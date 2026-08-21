import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import {
  middleware,
  messagingApi,
  WebhookEvent
} from '@line/bot-sdk';
import { verifySlipWithSlipOK } from './services/slipVerifier.js';
import { appendToGoogleSheet } from './services/googleSheets.js';
import {
  createSuccessFlexMessage,
  createUnderpaidFlexMessage,
  createProductCatalogFlexMessage,
  createAgencyServicesFlexMessage,
  createFailedTextMessage,
  createWelcomeFlexMessage
} from './services/lineFlex.js';
import { generateAutoReply } from './services/aiChat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

// Client สำหรับส่งข้อความ
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken
});

// Client Blob สำหรับดาวน์โหลดรูปภาพ
const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: lineConfig.channelAccessToken
});

// State เก็บรายการคำสั่งซื้อที่รอยืนยันสลิปของแต่ละ User
interface PendingOrder {
  packageName: string;
  expectedAmount: number;
  timestamp: number;
}
const userPendingOrders = new Map<string, PendingOrder>();

// ระบบจำกัดการตรวจสลิป (Demo) ป้องกันคนสแปม API SlipOK
const MAX_SLIP_PER_USER = 3;
const userSlipUsage = new Map<string, number>();

// Webhook endpoint
app.post(
  '/webhook',
  middleware(lineConfig),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const events: WebhookEvent[] = req.body.events;
      await Promise.all(events.map(handleEvent));
      res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      console.error('[Webhook Error]:', err);
      res.status(500).end();
    }
  }
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'LINE Auto Slip Verifier & Order Engine'
  });
});

async function handleEvent(event: WebhookEvent) {
  const replyToken = (event as any).replyToken;
  const userId = event.source?.userId || 'unknown';

  // 0. กรณีผู้ใช้แอดบอทครั้งแรก (Follow Event)
  if (event.type === 'follow') {
    if (replyToken) {
      await client.replyMessage({
        replyToken: replyToken,
        messages: [createWelcomeFlexMessage()]
      });
    }
    return null;
  }

  if (event.type !== 'message') {
    return null;
  }

  // 1. กรณีผู้ใช้ส่งรูปภาพ (สลิปโอนเงิน)
  if (event.message.type === 'image') {
    console.log(`[Event] ได้รับรูปภาพสลิปจาก User ID: ${userId}`);

    // ตรวจสอบโควต้าการเช็คสลิป
    const currentUsage = userSlipUsage.get(userId) || 0;
    if (currentUsage >= MAX_SLIP_PER_USER) {
      await client.replyMessage({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: '🛑 คุณใช้โควต้าการทดสอบตรวจสลิปครบ 3 ครั้งแล้วครับ (สำหรับ Demo)\n\nหากสนใจนำระบบไปใช้งานจริงแบบไม่จำกัด สามารถติดต่อสั่งซื้อ/สอบถามได้ผ่านลิงก์ Fastwork เลยครับ 🙏\nhttps://fastwork.co/user/toddev/shop-and-page-admin-25924850'
          }
        ]
      });
      return null;
    }

    try {
      // อัปเดตโควต้า
      userSlipUsage.set(userId, currentUsage + 1);

      // ดาวน์โหลดรูปภาพจาก LINE Server
      const stream = await blobClient.getMessageContent(event.message.id);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const imageBuffer = Buffer.concat(chunks);

      // ตรวจสอบสลิปผ่าน SlipOK API
      const result = await verifySlipWithSlipOK(imageBuffer);

      if (result.success && result.data) {
        const slipAmount = result.data.amount;
        const pendingOrder = userPendingOrders.get(userId);

        console.log(`[SlipOK Success] ยอดเงินในสลิป: ${slipAmount} บาท`);

        // ตรวจสอบเงื่อนไขยอดเงินขาด (Underpayment Check)
        if (pendingOrder && slipAmount < pendingOrder.expectedAmount) {
          const remaining = pendingOrder.expectedAmount - slipAmount;
          console.warn(`[Underpaid] ค้างชำระ: ${remaining} บาท`);

          await client.replyMessage({
            replyToken: replyToken,
            messages: [
              createUnderpaidFlexMessage({
                actualAmount: slipAmount,
                expectedAmount: pendingOrder.expectedAmount,
                remainingAmount: remaining,
                transRef: result.data.transRef,
                senderName: result.data.sender.name,
                packageName: pendingOrder.packageName
              })
            ]
          });
          return null;
        }

        // กรณีโอนครบ หรือไม่ได้เลือกแพ็กเกจไว้ล่วงหน้า
        const packageName = pendingOrder ? pendingOrder.packageName : 'ชำระค่าสินค้า/บริการ';
        userPendingOrders.delete(userId); // เคลียร์สถานะออเดอร์เมื่อชำระสำเร็จ

        // บันทึกลง Google Sheets
        await appendToGoogleSheet({
          transRef: result.data.transRef,
          dateTime: result.data.date,
          senderName: result.data.sender.name || 'ไม่ระบุ',
          senderBank: result.data.sender.bank || 'ไม่ระบุ',
          amount: slipAmount,
          receiverAccount: result.data.receiver.account || 'ร้านค้า',
          userId: userId,
          status: 'PAID'
        });

        // ส่ง Flex Card ยืนยันสำเร็จ
        await client.replyMessage({
          replyToken: replyToken,
          messages: [
            createSuccessFlexMessage({
              amount: slipAmount,
              expectedAmount: pendingOrder?.expectedAmount,
              transRef: result.data.transRef,
              senderName: result.data.sender.name,
              packageName: packageName
            })
          ]
        });
      } else {
        console.warn(`[SlipOK Rejected] ${result.message}`);
        await client.replyMessage({
          replyToken: replyToken,
          messages: [
            {
              type: 'text',
              text: createFailedTextMessage(result.message)
            }
          ]
        });
      }
    } catch (err: any) {
      console.error('[Process Slip Error]:', err.message);
      await client.replyMessage({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: '⚠️ ระบบกำลังประมวลผลขัดข้องชั่วคราว แอดมินจะรีบตรวจสอบให้โดยเร็วครับ'
          }
        ]
      });
    }
  }

  // 2. กรณีผู้ใช้ส่งข้อความ Text
  if (event.message.type === 'text') {
    const text = event.message.text.trim();

    // 2.1 สั่งซื้อแพ็กเกจ A
    if (text.includes('แพ็กเกจ A') || text.includes('199')) {
      userPendingOrders.set(userId, {
        packageName: 'แพ็กเกจ A (ชุดเริ่มต้น)',
        expectedAmount: 199,
        timestamp: Date.now()
      });

      await client.replyMessage({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: '🛍️ คุณได้เลือก "แพ็กเกจ A (ชุดเริ่มต้น)" ยอดชำระ 199.00 บาท\n\n💳 ท่านสามารถโอนเงิน 199 บาท แล้วแนบ "รูปภาพสลิป" เข้ามาในแชทนี้ได้เลยครับ\n(หรือลองส่งสลิปยอดน้อยกว่า 199 เพื่อทดสอบระบบแจ้งเตือนโอนไม่ครบได้ครับ ⚡)'
          }
        ]
      });
      return null;
    }

    // 2.2 สั่งซื้อแพ็กเกจ B
    if (text.includes('แพ็กเกจ B') || text.includes('499')) {
      userPendingOrders.set(userId, {
        packageName: 'แพ็กเกจ B (ชุดยอดนิยม)',
        expectedAmount: 499,
        timestamp: Date.now()
      });

      await client.replyMessage({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: '🚀 คุณได้เลือก "แพ็กเกจ B (ชุดยอดนิยม)" ยอดชำระ 499.00 บาท\n\n💳 ท่านสามารถโอนเงิน 499 บาท แล้วแนบ "รูปภาพสลิป" เข้ามาในแชทนี้ได้เลยครับ ⚡'
          }
        ]
      });
      return null;
    }

    // 2.3 ขอเมนูบริการทั้งหมดของ Agency
    if (text.includes('บริการ') || text.includes('service') || text.includes('โซลูชัน')) {
      await client.replyMessage({
        replyToken: replyToken,
        messages: [createAgencyServicesFlexMessage()]
      });
      return null;
    }

    // 2.4 ขอเมนู / แคตตาล็อกสินค้า Demo
    if (text.includes('สินค้า') || text.includes('เมนู') || text.includes('ซื้อ') || text.includes('สั่ง')) {
      await client.replyMessage({
        replyToken: replyToken,
        messages: [createProductCatalogFlexMessage()]
      });
      return null;
    }

    // 2.4 คำถามทั่วไป / สอบถามราคา / วิธีใช้ -> ให้ AI Auto-Reply อัจฉริยะตอบ
    const aiReplyText = await generateAutoReply(text);
    await client.replyMessage({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: aiReplyText
        }
      ]
    });
  }

  return null;
}

// Serve static files for the landing page
app.use(express.static(path.join(__dirname, '../public')));

// Root endpoint serves the landing page if index.html exists
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 LINE Slip Verifier Server is running on port ${PORT}`);
  });
}

export default app;
