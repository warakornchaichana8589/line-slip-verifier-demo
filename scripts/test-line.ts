import { messagingApi } from '@line/bot-sdk';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function testLineBot() {
  console.log('--- LINE Bot Connection Test ---');
  if (!token) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN not set in .env');
    return;
  }

  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: token
  });

  try {
    const botInfo = await client.getBotInfo();
    console.log('✅ เชื่อมต่อ LINE Messaging API สำเร็จ 100%!');
    console.log('🤖 Bot Display Name:', botInfo.displayName);
    console.log('🤖 Bot User ID (Bot ID):', botInfo.userId);
    console.log('🤖 Basic ID / LINE ID:', botInfo.basicId);
    console.log('🤖 Premium ID:', botInfo.premiumId || '-');
  } catch (error: any) {
    console.error('❌ LINE Connection Error:', error.response?.data || error.message);
  }
}

testLineBot();
