import axios from 'axios';

const AUTOFLOW_KNOWLEDGE_BASE = `
คุณคือ AutoFlow AI Assistant ผู้ช่วยอัจฉริยะของ "AutoFlow Studio"
บริการหลักของเรา:
1. ติดตั้งระบบ LINE Official Account ตรวจสลิปโอนเงินอัตโนมัติ 24 ชม. ป้องกันสลิปปลอม สลิปซ้ำ ยอดโอนไม่ครบ
2. บันทึกยอดขายลง Google Sheets แบบเรียลไทม์ พร้อมแจ้งเตือนเจ้าของร้านผ่าน LINE Notify / Discord
3. แพ็กเกจราคาและการติดตั้ง:
   - แพ็กเกจ Starter (สำหรับร้านเริ่มต้น): เริ่มต้นเพียง 1,500 - 3,500 บาท (ติดตั้งเสร็จพร้อมใช้ใน 24 ชม.)
   - แพ็กเกจ Pro / Custom (สำหรับร้านใหญ่/หลายบัญชี/เชื่อมระบบสต็อก): 5,000 - 12,000 บาท
4. ช่องทางการสั่งซื้อและติดต่อ:
   - สั่งซื้อผ่าน Fastwork รับประกันงาน 100%: https://fastwork.co/user/toddev/shop-and-page-admin-25924850
   - ทดลองใช้งานระบบจริง: แชทนี้ได้เลย (ลองพิมพ์ "ดูสินค้า" หรือส่ง "รูปภาพสลิป" มาทดสอบได้ทันที)

สไตล์การตอบ:
- ภาษาไทย สุภาพ เป็นกันเอง มีความน่าเชื่อถือ
- ใช้ Emoji ประกอบให้อ่านง่าย สบายตา
- สั้นกระชับ ตรงประเด็น (ความยาวประมาณ 2-4 บรรทัด)
- ลงท้ายด้วยคำแนะนำให้ทดลองส่งรูปสลิป หรือทักจ้างงานผ่าน Fastwork เสมอ
`;

export async function generateAutoReply(userMessage: string): Promise<string> {
  const trimmed = userMessage.trim();

  // 1. ตรวจสอบคำถามที่เจอบ่อย (Fast Match) เพื่อความรวดเร็วและแม่นยำระดับ 0ms
  const lower = trimmed.toLowerCase();

  if (lower.includes('ราคา') || lower.includes('กี่บาท') || lower.includes('แพงไหม') || lower.includes('ค่าบริการ')) {
    return '💰 บริการติดตั้งระบบ LINE Bot ตรวจสลิปอัตโนมัติ AutoFlow:\n\n' +
      '• แพ็กเกจ Starter: เริ่มต้นเพียง 1,500 - 3,500 บาท (ติดตั้งเสร็จใน 24 ชม.)\n' +
      '• แพ็กเกจ Pro (เชื่อม Google Sheets + แจ้งเตือนยอดเงินขาด): 4,500 - 7,500 บาท\n\n' +
      '📦 สั่งซื้อผ่าน Fastwork ปลอดภัย 100%: https://fastwork.co/user/toddev/shop-and-page-admin-25924850\n' +
      '🧪 หรือพิมพ์ "ดูสินค้า" เพื่อทดลองสั่งซื้อและส่งสลิปในแชทนี้ได้เลยครับ!';
  }

  if (lower.includes('วิธีใช้') || lower.includes('ใช้งานยังไง') || lower.includes('ทดสอบ') || lower.includes('ลอง')) {
    return '🤖 วิธีทดลองใช้งานระบบ SlipPay Demo:\n\n' +
      '1. พิมพ์คำว่า "ดูสินค้า" เพื่อเลือกแพ็กเกจ\n' +
      '2. หรือส่ง "รูปภาพสลิปโอนเงินจริง/สลิปทดสอบ" เข้ามาในแชทนี้ได้ทันที\n' +
      '3. ระบบจะอ่าน QR Code บนสลิปและตรวจสอบกับธนาคารให้อัตโนมัติใน 1-2 วินาทีครับ ⚡';
  }

  if (lower.includes('ติดต่อ') || lower.includes('คน') || lower.includes('เจ้าหน้าที่') || lower.includes('แอดมิน') || lower.includes('โทร')) {
    return '👤 ติดต่อแอดมิน / ทีมงาน AutoFlow Studio:\n\n' +
      '• สั่งทำระบบผ่าน Fastwork: https://fastwork.co/user/toddev/shop-and-page-admin-25924850\n' +
      '• ติดต่อด่วน: แจ้งรายละเอียดระบบที่ต้องการไว้ในแชทนี้ได้เลย แอดมินจะรีบเข้ามาตอบกลับครับ 😊';
  }

  if (lower.includes('สลิปปลอม') || lower.includes('เช็คยังไง') || lower.includes('ป้องกัน')) {
    return '🛡️ ระบบ AutoFlow ตรวจสลิปอย่างไร?\n\n' +
      '• ระบบจะอ่าน Mini-QR Code บนสลิปและยิงเช็กกับฐานข้อมูลธนาคารโดยตรง\n' +
      '• ตรวจจับ: สลิปตัดต่อ, ยอดเงินไม่ตรง, สลิปวนซ้ำ, บัญชีรับเงินไม่ถูกต้อง\n' +
      '• ปลอดภัย 100% บอททำงาน 24 ชม. ไม่ต้องนั่งตรวจเองดึกๆ ครับ 🌙';
  }

  // 2. ถ้าเป็นคำถามอิสระ ให้เรียก AI ผ่าน Auto-Post Content API หรือ fallback
  try {
    const aiRes = await axios.post(
      'https://auto-post-nu.vercel.app/api/ai/generate-post',
      {
        topic: `ตอบคำถามลูกค้า LINE OA สั้นๆ 2-3 บรรทัด: "${trimmed}"`,
        details: AUTOFLOW_KNOWLEDGE_BASE,
        aiProvider: 'deepseek',
        selectedNodeSlugs: ['tone-friendly', 'len-short'],
      },
      { timeout: 10000 }
    );

    const postText = aiRes.data?.data?.result?.postText || aiRes.data?.result?.postText;
    if (postText && typeof postText === 'string' && postText.trim()) {
      return `${postText.trim()}\n\n💬 พิมพ์ "ดูสินค้า" หรือส่ง "รูปสลิป" มาทดลองระบบได้เลยครับ!`;
    }
  } catch (e: any) {
    console.log('[AI Chat Fallback]', e.message);
  }

  // 3. Fallback ทั่วไป
  return '👋 ยินดีต้อนรับสู่ AutoFlow Studio - ระบบบอทตรวจสลิปอัตโนมัติ 24 ชม.!\n\n' +
    '• พิมพ์ "ดูสินค้า" เพื่อเลือกแพ็กเกจ\n' +
    '• ส่ง "รูปสลิป" เพื่อทดสอบการตรวจสลิปทันที\n' +
    '• พิมพ์ "ราคา" เพื่อดูแพ็กเกจค่าบริการติดตั้ง\n' +
    '• สอบถามข้อมูลเพิ่มเติมผ่าน Fastwork: https://fastwork.co/user/toddev/shop-and-page-admin-25924850';
}
