import axios from 'axios';

const ZYNCODER_KNOWLEDGE_BASE = `
คุณคือ "ZynCoder AI Consultant" ผู้เชี่ยวชาญด้านการให้คำปรึกษาและประเมินราคางานพัฒนาระบบของ "ZynCoder Studio"
บริการหลักของเรา:
1. ระบบ LINE Bot & ตรวจสลิปอัตโนมัติ 24 ชม. (ป้องกันสลิปปลอม, สลิปซ้ำ, บันทึกยอดลง Google Sheets)
2. พัฒนา Web Application, Dashboard, ระบบจัดการออเดอร์/สต็อก (Next.js, Node.js, React, Tailwind)
3. ระบบ AI & Facebook Marketing Automation (Auto-Post คอนเทนต์ + ภาพ AI, Auto-Reply ตอบแชท/คอมเมนต์)
4. เชื่อมต่อระบบ & Data Sync (Google Sheets, Notion, Database, REST APIs, Webhooks)
5. พัฒนา Custom Software & ระบบหลังบ้านตามความต้องการของธุรกิจ

เรทราคาประเมินเบื้องต้น:
- LINE Bot ตรวจสลิปพื้นฐาน: 1,500 - 3,500 บาท (เสร็จใน 24-48 ชม.)
- LINE Bot สั่งซื้อสินค้า + เชื่อมต่อสต็อก/Google Sheets: 4,500 - 8,500 บาท
- Web Application & Dashboard จัดการธุรกิจ: 6,500 - 18,000+ บาท (ตาม Scope)
- ระบบ Facebook Auto-Post & AI Content: 3,500 - 7,500 บาท
- Custom Software / API Integration: ประเมินตามความซับซ้อนของงาน

ช่องทางการติดต่อและสั่งจ้าง:
- จ้างงานผ่าน Fastwork ปลอดภัย รับประกันงาน 100%: https://fastwork.co/user/toddev/shop-and-page-admin-25924850
- ทดลองระบบ Demo: https://slip.zyncoder.com

สไตล์การตอบ:
- มืออาชีพ สุภาพ เป็นกันเอง ภาษาไทยถูกต้อง
- ใช้ Emoji ประกอบให้อ่านง่าย สบายตา
- สั้นกระชับ ตรงประเด็น (2-4 บรรทัด)
- พร้อมรับฟัง Requirement และให้คำแนะนำทางเทคนิคที่คุ้มค่าที่สุด
`;

export async function generateAutoReply(userMessage: string): Promise<string> {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // 1. ตรวจสอบ Keyword สำหรับประเมินราคา / ปรึกษาโจทย์งาน
  if (lower.includes('ประเมินราคา') || lower.includes('ปรึกษา') || lower.includes('ทำระบบ') || lower.includes('สร้างระบบ') || lower.includes('รับทำ')) {
    return '🚀 ยินดีให้คำปรึกษาและประเมินราคาระบบฟรีครับ!\n\n' +
      'ท่านสามารถพิมพ์บอกรายละเอียดโจทย์คร่าวๆ ได้เลยครับ เช่น:\n' +
      '1. ระบบที่อยากได้ (LINE Bot / Web App / Auto-Post / Data Sync)\n' +
      '2. ฟังก์ชันหลักที่ต้องการให้ทำได้\n' +
      '3. งบประมาณ หรือวันที่ต้องการเปิดใช้งาน\n\n' +
      '💡 หรือสั่งจ้างผ่าน Fastwork ปลอดภัย 100%: https://fastwork.co/user/toddev/shop-and-page-admin-25924850';
  }

  // 2. สอบถามราคาและแพ็กเกจ
  if (lower.includes('ราคา') || lower.includes('กี่บาท') || lower.includes('แพงไหม') || lower.includes('ค่าบริการ') || lower.includes('แพ็กเกจ') || lower.includes('package')) {
    return '💰 เรทราคาประเมินเบื้องต้นของ ZynCoder Studio:\n\n' +
      '• LINE Bot ตรวจสลิป / แจ้งเตือน: 1,500 - 3,500 บ.\n' +
      '• Web Application / Dashboard: 6,500 - 18,000+ บ.\n' +
      '• AI Auto-Post & Marketing: 3,500 - 7,500 บ.\n' +
      '• Custom API & Data Sync: ประเมินตาม Scope งาน\n\n' +
      '📦 สั่งซื้อผ่าน Fastwork: https://fastwork.co/user/toddev/shop-and-page-admin-25924850\n' +
      '💬 พิมพ์บอกฟังก์ชันที่ต้องการ เพื่อให้ประเมินราคาเฉพาะร้านได้เลยครับ!';
  }

  // 3. ขอติดต่อแอดมิน / คนจริง
  if (lower.includes('ติดต่อ') || lower.includes('คน') || lower.includes('เจ้าหน้าที่') || lower.includes('แอดมิน') || lower.includes('โทร') || lower.includes('dev')) {
    return '👤 ช่องทางการติดต่อทีมงาน ZynCoder Studio:\n\n' +
      '• สั่งทำระบบผ่าน Fastwork (รับประกันงาน 100%): https://fastwork.co/user/toddev/shop-and-page-admin-25924850\n' +
      '• หรือแจ้งรายละเอียด/เบอร์โทรศัพท์ไว้ในแชทนี้ได้เลยครับ ทีมงานจะรีบติดต่อกลับโดยเร็วที่สุดครับ 😊';
  }

  // 4. คำถามเรื่องสลิปและระบบ Demo
  if (lower.includes('สลิป') || lower.includes('ตรวจสลิป') || lower.includes('สลิปปลอม') || lower.includes('demo') || lower.includes('ทดสอบ')) {
    return '🛡️ ระบบตรวจสลิปอัตโนมัติ ZynCoder Slip Verifier:\n\n' +
      '• ตรวจสอบสลิปจริงจากฐานข้อมูลธนาคาร 24 ชม. ป้องกันสลิปปลอม/สลิปซ้ำ\n' +
      '• แจ้งเตือนยอดขาด + บันทึก Google Sheets อัตโนมัติ\n' +
      '• ทดลองเล่น Demo ได้ที่: https://slip.zyncoder.com\n' +
      '• หรือลองส่ง "รูปภาพสลิป" เข้ามาในแชทนี้เพื่อทดสอบได้ทันทีครับ!';
  }

  // 5. คำถามอิสระ -> เรียก AI ผ่าน Auto-Post Content API หรือ OpenAI/DeepSeek
  try {
    const aiRes = await axios.post(
      'https://auto-post-nu.vercel.app/api/ai/generate-post',
      {
        topic: `ตอบคำถามลูกค้า LINE OA ของ ZynCoder Studio สั้นๆ 2-3 บรรทัด: "${trimmed}"`,
        details: ZYNCODER_KNOWLEDGE_BASE,
        aiProvider: 'deepseek',
        selectedNodeSlugs: ['tone-friendly', 'len-short'],
      },
      { timeout: 10000 }
    );

    const postText = aiRes.data?.data?.result?.postText || aiRes.data?.result?.postText;
    if (postText && typeof postText === 'string' && postText.trim()) {
      return `${postText.trim()}\n\n💬 พิมพ์ "ประเมินราคาระบบ" หรือกดเลือกเมนูด้านล่างเพื่อดูรายละเอียดได้เลยครับ!`;
    }
  } catch (e: any) {
    console.log('[AI Chat Fallback]', e.message);
  }

  // 6. Fallback ทั่วไป
  return '⚡ ยินดีต้อนรับสู่ ZynCoder Studio - บริการพัฒนาระบบ & Automation ครบวงจร!\n\n' +
    '• พิมพ์ "ดูบริการทั้งหมด" เพื่อดูโซลูชันระบบทั้งหมด\n' +
    '• พิมพ์ "ประเมินราคาระบบ" เพื่อปรึกษาและประเมินงบประมาณ\n' +
    '• ส่ง "รูปสลิป" เพื่อทดสอบระบบตรวจสลิปอัตโนมัติ\n' +
    '• สอบถาม/สั่งจ้างผ่าน Fastwork: https://fastwork.co/user/toddev/shop-and-page-admin-25924850';
}
