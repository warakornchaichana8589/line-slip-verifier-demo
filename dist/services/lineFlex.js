"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessFlexMessage = createSuccessFlexMessage;
exports.createFailedTextMessage = createFailedTextMessage;
/**
 * สร้าง Flex Message ตอบกลับเมื่อสลิปผ่านการตรวจสอบ
 */
function createSuccessFlexMessage(data) {
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
                        text: '✅ ได้รับยอดชำระเงินเรียบร้อยแล้ว',
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
                                    {
                                        type: 'text',
                                        text: 'ผู้โอน:',
                                        size: 'sm',
                                        color: '#6B7280',
                                        flex: 2
                                    },
                                    {
                                        type: 'text',
                                        text: data.senderName || '-',
                                        size: 'sm',
                                        color: '#111827',
                                        flex: 4,
                                        align: 'end'
                                    }
                                ]
                            },
                            {
                                type: 'box',
                                layout: 'horizontal',
                                contents: [
                                    {
                                        type: 'text',
                                        text: 'เลขอ้างอิง:',
                                        size: 'sm',
                                        color: '#6B7280',
                                        flex: 2
                                    },
                                    {
                                        type: 'text',
                                        text: data.transRef,
                                        size: 'xs',
                                        color: '#111827',
                                        flex: 4,
                                        align: 'end'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        backgroundColor: '#F3F4F6',
                        cornerRadius: '8px',
                        paddingAll: '12px',
                        margin: 'lg',
                        contents: [
                            {
                                type: 'text',
                                text: '🎉 ระบบบันทึกออเดอร์แล้ว ทางร้านกำลังดำเนินการจัดเตรียมสินค้า/บริการให้ท่านครับ',
                                size: 'xs',
                                color: '#4B5563',
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
function createFailedTextMessage(reason) {
    return `⚠️ ไม่สามารถยืนยันยอดเงินจากสลิปนี้ได้\nสาเหตุ: ${reason}\n\nหากท่านได้โอนเงินจริง กรุณารอแอดมินเข้ามาตรวจสอบให้สักครู่นะครับ 🙏`;
}
