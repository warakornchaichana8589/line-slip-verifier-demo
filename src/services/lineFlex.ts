import { messagingApi } from '@line/bot-sdk';

/**
 * สร้าง Flex Message แสดงรายการสินค้าตัวอย่างและปุ่มสั่งซื้อ
 */
export function createProductCatalogFlexMessage(): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '🛍️ รายการสินค้าและแพ็กเกจ',
    contents: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#3B82F6',
            contents: [
              {
                type: 'text',
                text: '📦 แพ็กเกจ A (ชุดเริ่มต้น)',
                weight: 'bold',
                color: '#FFFFFF',
                size: 'sm'
              }
            ]
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '฿199.00',
                weight: 'bold',
                size: 'xl',
                color: '#1E3A8A'
              },
              {
                type: 'text',
                text: 'เหมาะสำหรับทดลองระบบตรวจสลิป',
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#3B82F6',
                height: 'sm',
                action: {
                  type: 'message',
                  label: 'เลือกแพ็กนี้ (199.-)',
                  text: 'สั่งซื้อ แพ็กเกจ A 199'
                }
              }
            ]
          }
        },
        {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#8B5CF6',
            contents: [
              {
                type: 'text',
                text: '🚀 แพ็กเกจ B (ชุดยอดนิยม)',
                weight: 'bold',
                color: '#FFFFFF',
                size: 'sm'
              }
            ]
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '฿499.00',
                weight: 'bold',
                size: 'xl',
                color: '#4C1D95'
              },
              {
                type: 'text',
                text: 'ทดสอบการโอนเต็มจำนวน หรือโอนขาด',
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#8B5CF6',
                height: 'sm',
                action: {
                  type: 'message',
                  label: 'เลือกแพ็กนี้ (499.-)',
                  text: 'สั่งซื้อ แพ็กเกจ B 499'
                }
              }
            ]
          }
        }
      ]
    }
  };
}

/**
 * สร้าง Flex Message เมื่อชำระเงินครบถ้วน
 */
export function createSuccessFlexMessage(data: {
  amount: number;
  expectedAmount?: number;
  transRef: string;
  senderName?: string;
  packageName?: string;
}): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: `✅ ยืนยันการชำระเงินสำเร็จ ยอด ฿${data.amount.toLocaleString('th-TH')}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#10B981',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '✅ ได้รับยอดชำระเงินครบถ้วน',
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
            align: 'center'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `฿${data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
            size: 'xxl',
            weight: 'bold',
            align: 'center',
            color: '#111827'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'รายการ:', size: 'sm', color: '#6B7280', flex: 2 },
                  { type: 'text', text: data.packageName || 'สินค้า/บริการ', size: 'sm', color: '#111827', flex: 4, align: 'end' }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ผู้โอน:', size: 'sm', color: '#6B7280', flex: 2 },
                  { type: 'text', text: data.senderName || '-', size: 'sm', color: '#111827', flex: 4, align: 'end' }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เลขอ้างอิง:', size: 'sm', color: '#6B7280', flex: 2 },
                  { type: 'text', text: data.transRef, size: 'xs', color: '#111827', flex: 4, align: 'end' }
                ]
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#ECFDF5',
            cornerRadius: '8px',
            paddingAll: '12px',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '🎉 ระบบบันทึกออเดอร์แล้ว ทางร้านกำลังดำเนินการจัดเตรียมส่งมอบให้ท่านครับ',
                size: 'xs',
                color: '#065F46',
                wrap: true,
                align: 'center'
              }
            ]
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message แจ้งเตือนเมื่อยอดเงิน "โอนไม่ครบ" (Underpayment Alert)
 */
export function createUnderpaidFlexMessage(data: {
  actualAmount: number;
  expectedAmount: number;
  remainingAmount: number;
  transRef: string;
  senderName?: string;
  packageName?: string;
}): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: `⚠️ ยอดเงินยังไม่ครบ (ขาดอีก ฿${data.remainingAmount.toLocaleString('th-TH')})`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#F59E0B',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '⚠️ ยอดชำระเงินยังไม่ครบถ้วน',
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
            align: 'center'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ยอดคงค้างชำระเพิ่ม',
                size: 'xs',
                color: '#EF4444',
                align: 'center',
                weight: 'bold'
              },
              {
                type: 'text',
                text: `฿${data.remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                size: 'xxl',
                weight: 'bold',
                align: 'center',
                color: '#DC2626'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ยอดที่ต้องชำระ:', size: 'sm', color: '#6B7280', flex: 3 },
                  { type: 'text', text: `฿${data.expectedAmount.toLocaleString('th-TH')}`, size: 'sm', color: '#111827', flex: 3, align: 'end' }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ยอดที่โอนมา:', size: 'sm', color: '#6B7280', flex: 3 },
                  { type: 'text', text: `฿${data.actualAmount.toLocaleString('th-TH')}`, size: 'sm', color: '#10B981', flex: 3, align: 'end' }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เลขอ้างอิงสลิป:', size: 'sm', color: '#6B7280', flex: 3 },
                  { type: 'text', text: data.transRef, size: 'xs', color: '#111827', flex: 3, align: 'end' }
                ]
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FEF2F2',
            cornerRadius: '8px',
            paddingAll: '12px',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: `💡 กรุณาโอนเงินส่วนที่เหลือ ฿${data.remainingAmount.toLocaleString('th-TH')} และส่งรูปสลิปอีกครั้งเพื่อเปิดใช้งานออเดอร์ครับ`,
                size: 'xs',
                color: '#991B1B',
                wrap: true,
                align: 'center'
              }
            ]
          }
        ]
      }
    }
  };
}

/**
 * สร้างข้อความแจ้งเตือนเมื่อสลิปมีปัญหา
 */
export function createFailedTextMessage(reason: string): string {
  return `⚠️ ไม่สามารถยืนยันยอดเงินจากสลิปนี้ได้\nสาเหตุ: ${reason}\n\nหากท่านได้โอนเงินจริง กรุณารอแอดมินเข้ามาตรวจสอบให้สักครู่นะครับ 🙏`;
}
