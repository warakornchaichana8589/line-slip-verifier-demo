"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const bot_sdk_1 = require("@line/bot-sdk");
const slipVerifier_js_1 = require("./services/slipVerifier.js");
const googleSheets_js_1 = require("./services/googleSheets.js");
const lineFlex_js_1 = require("./services/lineFlex.js");
const aiChat_js_1 = require("./services/aiChat.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};
// Client สำหรับส่งข้อความ
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: lineConfig.channelAccessToken
});
// Client Blob สำหรับดาวน์โหลดรูปภาพ
const blobClient = new bot_sdk_1.messagingApi.MessagingApiBlobClient({
    channelAccessToken: lineConfig.channelAccessToken
});
const userPendingOrders = new Map();
// ระบบจำกัดการตรวจสลิป (Demo) ป้องกันคนสแปม API SlipOK
const MAX_SLIP_PER_USER = 3;
const userSlipUsage = new Map();
// Webhook endpoint
app.post('/webhook', (0, bot_sdk_1.middleware)(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        await Promise.all(events.map(handleEvent));
        res.status(200).json({ status: 'ok' });
    }
    catch (err) {
        console.error('[Webhook Error]:', err);
        res.status(500).end();
    }
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'LINE Auto Slip Verifier & Order Engine'
    });
});
async function handleEvent(event) {
    const replyToken = event.replyToken;
    const userId = event.source?.userId || 'unknown';
    // 0. กรณีผู้ใช้แอดบอทครั้งแรก (Follow Event)
    if (event.type === 'follow') {
        if (replyToken) {
            await client.replyMessage({
                replyToken: replyToken,
                messages: [(0, lineFlex_js_1.createWelcomeFlexMessage)()]
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
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const imageBuffer = Buffer.concat(chunks);
            // ตรวจสอบสลิปผ่าน SlipOK API
            const result = await (0, slipVerifier_js_1.verifySlipWithSlipOK)(imageBuffer);
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
                            (0, lineFlex_js_1.createUnderpaidFlexMessage)({
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
                await (0, googleSheets_js_1.appendToGoogleSheet)({
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
                        (0, lineFlex_js_1.createSuccessFlexMessage)({
                            amount: slipAmount,
                            expectedAmount: pendingOrder?.expectedAmount,
                            transRef: result.data.transRef,
                            senderName: result.data.sender.name,
                            packageName: packageName
                        })
                    ]
                });
            }
            else {
                console.warn(`[SlipOK Rejected] ${result.message}`);
                await client.replyMessage({
                    replyToken: replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: (0, lineFlex_js_1.createFailedTextMessage)(result.message)
                        }
                    ]
                });
            }
        }
        catch (err) {
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
        // 2.3 ขอเมนู / แคตตาล็อกสินค้า
        if (text.includes('สินค้า') || text.includes('เมนู') || text.includes('ซื้อ') || text.includes('สั่ง')) {
            await client.replyMessage({
                replyToken: replyToken,
                messages: [(0, lineFlex_js_1.createProductCatalogFlexMessage)()]
            });
            return null;
        }
        // 2.4 คำถามทั่วไป / สอบถามราคา / วิธีใช้ -> ให้ AI Auto-Reply อัจฉริยะตอบ
        const aiReplyText = await (0, aiChat_js_1.generateAutoReply)(text);
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
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Root endpoint serves the landing page if index.html exists
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 LINE Slip Verifier Server is running on port ${PORT}`);
    });
}
exports.default = app;
