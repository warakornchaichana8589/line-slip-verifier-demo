# 🤖 LINE Slip Verifier & Google Sheets Sync

ระบบบอท LINE OA สำหรับตรวจสอบสลิปโอนเงินอัตโนมัติ (Anti-fraud & Instant Confirmation) พร้อมบันทึกยอดขายลง Google Sheets แบบ Real-time

---

## ⚡ ฟีเจอร์หลัก (Key Features)

1. **Auto Slip Scan:** ตรวจจับรูปสลิปจาก LINE ทันที ตรวจสอบเลขอ้างอิง (transRef), วันเวลา, ผู้โอน, ผู้รับ, และยอดเงิน
2. **Anti-Duplicate Slip:** ป้องกันการนำสลิปเก่ามาใช้ซ้ำ
3. **Beautiful Flex Message:** ส่งการ์ดยืนยันยอดชำระแบบมืออาชีพให้ลูกค้าทันที
4. **Google Sheets Sync:** บันทึกทุกยอดขายลง Spreadsheets อัตโนมัติ เพื่อทำบัญชีและตัดรอบสต็อก

---

## 🛠️ วิธีการติดตั้งและทดสอบ (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. ตั้งค่า .env
cp .env.example .env
# กรอกค่า LINE_CHANNEL_ACCESS_TOKEN, SLIPOK_API_KEY, GOOGLE_SHEET_ID

# 3. รันเซิร์ฟเวอร์
npm run dev
```

---

## 🌐 การ Deploy ขึ้น Cloud ฟรี (Zero-Cost Hosting)
* สามารถ Deploy ขึ้น **Render.com / Railway.app / Vercel Serverless / Cloudflare Workers** ได้ฟรี
* ใช้ **ngrok** สำหรับทดสอบ Webhook บนเครื่องตัวเองก่อนขึ้น Production

---

## 🚀 Production Environment
* **Domain:** `slip.zyncoder.com`
* **LINE Webhook URL:** `https://slip.zyncoder.com/api/webhook` (เปลี่ยนตาม path ที่ใช้งานจริง)
