import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const branchId = process.env.SLIPOK_BRANCH_ID;
const apiKey = process.env.SLIPOK_API_KEY;

console.log('--- SlipOK API Connection Test ---');
console.log('Branch ID:', branchId);
console.log('API Key:', apiKey ? `${apiKey.substring(0, 6)}***` : 'NOT SET');

async function testConnection() {
  if (!branchId || !apiKey) {
    console.error('❌ Error: SLIPOK_BRANCH_ID หรือ SLIPOK_API_KEY ยังไม่ได้ตั้งใน .env');
    return;
  }

  try {
    // ส่ง dummy request เพื่อทดสอบการยืนยันตัวตนกับ SlipOK server
    const res = await axios.post(
      `https://api.slipok.com/api/line/apikey/${branchId}`,
      {},
      {
        headers: {
          'x-authorization': apiKey
        },
        validateStatus: () => true // รับ status ทุกตัวเพื่อดู response
      }
    );

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', res.data);

    if (res.status === 400 && res.data?.message?.includes('file')) {
      console.log('✅ SlipOK API Key และ Branch ID ถูกต้องและเชื่อมต่อสำเร็จ! (รอรับไฟล์สลิปจริง)');
    } else if (res.data?.success === true) {
      console.log('✅ SlipOK API Key ทำงานปกติ!');
    } else if (res.status === 401 || res.status === 403) {
      console.warn('⚠️ SlipOK ตอบกลับ 401/403: ตรวจสอบ Branch ID หรือ API Key อีกครั้ง');
    } else {
      console.log('ℹ️ SlipOK Response:', res.data);
    }
  } catch (error: any) {
    console.error('❌ Connection Error:', error.message);
  }
}

testConnection();
