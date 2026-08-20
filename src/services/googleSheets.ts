import { google } from 'googleapis';

interface SlipRecord {
  transRef: string;
  dateTime: string;
  senderName: string;
  senderBank: string;
  amount: number;
  receiverAccount: string;
  userId: string;
  status: string;
}

export async function appendToGoogleSheet(record: SlipRecord): Promise<boolean> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn('[Google Sheets] ข้อมูล Credentials ยังไม่ครบ ข้ามการบันทึกลง Sheets');
    return false;
  }

  // แก้ไข newline ใน private key
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // เพิ่มแถวใหม่ต่อท้าย
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
            record.transRef,
            record.senderName,
            record.senderBank,
            record.amount,
            record.receiverAccount,
            record.userId,
            record.status
          ]
        ]
      }
    });

    console.log(`[Google Sheets] บันทึกยอด ${record.amount} บาท (Ref: ${record.transRef}) สำเร็จ`);
    return true;
  } catch (error: any) {
    console.error('[Google Sheets Error]:', error.message);
    return false;
  }
}
