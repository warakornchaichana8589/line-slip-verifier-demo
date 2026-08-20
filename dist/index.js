"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bot_sdk_1 = require("@line/bot-sdk");
const slipVerifier_js_1 = require("./services/slipVerifier.js");
const googleSheets_js_1 = require("./services/googleSheets.js");
const lineFlex_js_1 = require("./services/lineFlex.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};
// Client สำหรับตอบกลับข้อความ
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: lineConfig.channelAccessToken
});
// Client Blob สำหรับดาวน์โหลดไฟล์รูปภาพจาก LINE
const blobClient = new bot_sdk_1.messagingApi.MessagingApiBlobClient({
    channelAccessToken: lineConfig.channelAccessToken
});
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
        service: 'LINE Auto Slip Verifier'
    });
});
async function handleEvent(event) {
    if (event.type !== 'message') {
        return null;
    }
    const replyToken = event.replyToken;
    const userId = event.source?.userId || 'unknown';
    // 1. กรณีผู้ใช้ส่งรูปภาพ (สลิปโอนเงิน)
    if (event.message.type === 'image') {
        console.log(`[Event] ได้รับรูปภาพจาก User ID: ${userId}`);
        try {
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
                console.log(`[SlipOK Success] ยอดเงิน: ${result.data.amount} บาท`);
                // บันทึกลง Google Sheets
                await (0, googleSheets_js_1.appendToGoogleSheet)({
                    transRef: result.data.transRef,
                    dateTime: result.data.date,
                    senderName: result.data.sender.name || 'ไม่ระบุ',
                    senderBank: result.data.sender.bank || 'ไม่ระบุ',
                    amount: result.data.amount,
                    receiverAccount: result.data.receiver.account || 'ร้านค้า',
                    userId: userId,
                    status: 'VERIFIED'
                });
                // ส่ง Flex Message ตอบกลับผู้ใช้
                await client.replyMessage({
                    replyToken: replyToken,
                    messages: [
                        (0, lineFlex_js_1.createSuccessFlexMessage)({
                            amount: result.data.amount,
                            transRef: result.data.transRef,
                            senderName: result.data.sender.name,
                            dateStr: result.data.date
                        })
                    ]
                });
            }
            else {
                console.warn(`[SlipOK Rejected] ${result.message}`);
                // แจ้งเตือนกรณีไม่ผ่าน
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
    // 2. กรณีผู้ใช้ส่งข้อความ Text ทั่วไป
    if (event.message.type === 'text') {
        const text = event.message.text.trim();
        if (text.includes('เลขบัญชี') || text.includes('โอนเงิน') || text.includes('ชำระเงิน')) {
            await client.replyMessage({
                replyToken: replyToken,
                messages: [
                    {
                        type: 'text',
                        text: '💳 ท่านสามารถโอนเงินแล้วแนบ "รูปภาพสลิป" ส่งเข้ามาในแชทนี้ได้เลยครับ\nระบบอัตโนมัติจะตรวจสอบยอดและบันทึกออเดอร์ให้ทันที ⚡'
                    }
                ]
            });
        }
    }
    return null;
}
app.listen(PORT, () => {
    console.log(`🚀 LINE Slip Verifier Server is running on port ${PORT}`);
});
