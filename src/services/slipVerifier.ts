import axios from 'axios';
import FormData from 'form-data';

export interface SlipVerificationResult {
  success: boolean;
  message: string;
  data?: {
    transRef: string;
    date: string;
    amount: number;
    sender: {
      bank?: string;
      name?: string;
      account?: string;
    };
    receiver: {
      bank?: string;
      name?: string;
      account?: string;
    };
  };
  raw?: any;
}

/**
 * ตรวจสอบสลิปผ่าน SlipOK API (หรือ EasySlip)
 */
export async function verifySlipWithSlipOK(
  imageBuffer: Buffer,
  branchId?: string,
  apiKey?: string
): Promise<SlipVerificationResult> {
  const bId = branchId || process.env.SLIPOK_BRANCH_ID;
  const key = apiKey || process.env.SLIPOK_API_KEY;

  if (!bId || !key) {
    return {
      success: false,
      message: 'SLIPOK_BRANCH_ID หรือ SLIPOK_API_KEY ยังไม่ได้ตั้งค่าใน .env'
    };
  }

  try {
    const formData = new FormData();
    formData.append('files', imageBuffer, {
      filename: 'slip.jpg',
      contentType: 'image/jpeg'
    });

    const response = await axios.post(
      `https://api.slipok.com/api/line/apikey/${bId}`,
      formData,
      {
        headers: {
          'x-authorization': key,
          ...formData.getHeaders()
        }
      }
    );

    const resData = response.data;
    if (resData.success && resData.data) {
      return {
        success: true,
        message: 'สลิปถูกต้องและตรวจสอบสำเร็จ',
        data: {
          transRef: resData.data.transRef || resData.data.ref || '',
          date: resData.data.transDate || new Date().toISOString(),
          amount: parseFloat(resData.data.amount) || 0,
          sender: {
            bank: resData.data.sendingBank,
            name: resData.data.sender?.displayName || resData.data.sender?.name,
            account: resData.data.sender?.account?.value
          },
          receiver: {
            bank: resData.data.receivingBank,
            name: resData.data.receiver?.displayName || resData.data.receiver?.name,
            account: resData.data.receiver?.account?.value
          }
        },
        raw: resData
      };
    } else {
      return {
        success: false,
        message: resData.message || 'ไม่สามารถตรวจสอบข้อมูลสลิปได้ (อาจไม่ใช่สลิปหรือสลิปซ้ำ)'
      };
    }
  } catch (error: any) {
    const errMsg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเรียก API ตรวจสอบสลิป';
    return {
      success: false,
      message: errMsg
    };
  }
}
