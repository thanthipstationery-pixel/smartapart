import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปถ่ายบัตรประชาชน' }, { status: 400 });
    }

    // Extract base64 data and mime type
    const mimeType = image.split(';')[0]?.split(':')[1] || 'image/jpeg';
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // Check env variable first, fallback to property settings in DB
    const prop = await prisma.property.findFirst();
    const apiKey = process.env.GEMINI_API_KEY || prop?.geminiApiKey;

    if (!apiKey) {
      // Fallback mock response for testing without API key setup
      return NextResponse.json({
        success: true,
        data: {
          name: 'นายสมชาย ใจดี',
          idCard: '1100700123456',
          address: '99/1 หมู่ 2 ต.บางรัก อ.เมือง จ.กรุงเทพมหานคร 10110',
        },
        note: 'Mock response (กรุณากรอก GEMINI_API_KEY ในหน้าตั้งค่าระบบ เพื่อใช้งาน AI สแกนภาพจริง)',
      });
    }

    // Call Google Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `คุณคือระบบอ่านข้อมูลเอกสารประจำตัวผู้เช่า (บัตรประชาชนไทย / ใบขับขี่ / หนังสือเดินทาง) (Thai ID Card & Driver's License OCR Expert)
กรุณาตั้งใจอ่านข้อความบนบัตรประจำตัว (บัตรประชาชน หรือ ใบขับขี่ หรือ พาสปอร์ต) ด้วยความแม่นยำสูงสุด:
1. ตรวจสอบสระและวรรณยุกต์ภาษาไทยอย่างละเอียด ทั้งสระบน (อิ อี อึ อื ◌็ ◌่ ◌้ ◌๊ ◌๋) และสระล่าง (สระอุ ◌ุ, สระอู ◌ู)
2. ในกรณีมีข้อความชื่อภาษาอังกฤษบรรทัดล่าง ให้เปรียบเทียบคำอ่านภาษาไทยกับข้อความชื่อภาษาอังกฤษเพื่อยืนยันการสะกดสระภาษาไทยให้ถูกต้อง 100%
3. อ่านเลขประจำตัวประชาชน 13 หลัก หรือเลขประจำตัวตามบัตร/ใบขับขี่ให้ถูกต้อง
4. อ่านที่อยู่ตามบัตร/ใบขับขี่ให้ครบถ้วน (หากไม่มีที่อยู่บนใบขับขี่รุ่นใหม่ ให้ดึงเฉพาะชื่อและเลข 13 หลัก)

ตอบกลับเฉพาะ JSON วัตถุเพียงอย่างเดียวตามรูปแบบนี้:
{
  "name": "ชื่อ-นามสกุล ภาษาไทย พร้อมคำนำหน้า",
  "idCard": "เลขประจำตัวประชาชน 13 หลัก เฉพาะตัวเลข",
  "address": "ที่อยู่เต็มตามบัตรหรือใบขับขี่ (หากไม่ระบุในเอกสารให้ใส่เป็นข้อความว่าง \"\")"
}
ตอบเฉพาะ JSON เท่านั้น ห้ามใส่ข้อความอื่นเด็ดขาด`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON block from response text
    const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'ไม่สามารถอ่านข้อมูลจากภาพได้ กรุณาลองถ่ายใหม่อีกครั้ง' }, { status: 422 });
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: {
        name: parsedData.name || '',
        idCard: parsedData.idCard ? String(parsedData.idCard).replace(/[^0-9]/g, '') : '',
        address: parsedData.address || '',
      },
    });
  } catch (error) {
    console.error('Error scanning ID card:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสแกนบัตรประชาชน' }, { status: 500 });
  }
}
