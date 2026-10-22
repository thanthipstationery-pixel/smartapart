import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_BASE64_BYTES = 5 * 1024 * 1024 * 1.37; // ~5MB file in base64

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { image } = body || {};

    if (!image) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปถ่ายบัตรประชาชน' }, { status: 400 });
    }

    if (typeof image !== 'string' || image.length > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { error: 'ขนาดรูปภาพเกินกำหนด (ต้องไม่เกิน 5MB)' },
        { status: 400 }
      );
    }

    // Extract base64 data and mime type
    const mimeType = image.split(';')[0]?.split(':')[1] || 'image/jpeg';
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // Check env variable first, fallback to property settings in DB
    const prop = await prisma.property.findFirst();
    let apiKey = process.env.GEMINI_API_KEY || prop?.geminiApiKey;

    // Filter out placeholder / dummy test keys from initial seeding
    if (apiKey && (apiKey.includes('SecretTestKey') || apiKey.trim().length < 25)) {
      apiKey = undefined;
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'ยังไม่ได้ตั้งค่า Google Gemini API Key ในระบบ กรุณาไปที่เมนู "ตั้งค่าระบบ" เพื่อกรอก API Key สำหรับเปิดใช้งานการสแกนบัตรประชาชนอัตโนมัติ (สามารถขอรับ Key ฟรีได้ที่ https://aistudio.google.com/app/apikey)',
          noApiKey: true,
        },
        { status: 400 }
      );
    }

    // Call Google Gemini Vision API (try gemini-2.5-flash first, fallback to gemini-flash-latest)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest'];
    let response: Response | null = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (res.ok) {
          response = res;
          break;
        }

        const errJson = (await res.json().catch(() => null)) as any;
        lastError = { status: res.status, json: errJson };

        // If it's an API Key error, do not retry other models, return error immediately
        const errMsg = errJson?.error?.message || '';
        if (
          res.status === 400 &&
          (errMsg.includes('API key') || errMsg.includes('INVALID_ARGUMENT'))
        ) {
          return NextResponse.json(
            {
              error:
                'Google Gemini API Key ที่ระบุในระบบไม่ถูกต้อง กรุณาตรวจสอบหรือขอ API Key ใหม่จาก Google AI Studio ในเมนู "ตั้งค่าระบบ"',
              details: errMsg,
            },
            { status: 400 }
          );
        }

        // If 404 (model not found), continue to next model in loop
        if (res.status === 404) {
          continue;
        }

        break;
      } catch (err: any) {
        lastError = { error: err.message };
      }
    }

    if (!response || !response.ok) {
      const errMsg = lastError?.json?.error?.message || lastError?.error || '';
      return NextResponse.json(
        {
          error: errMsg
            ? `Google Gemini รายงานข้อผิดพลาด: ${errMsg}`
            : 'ไม่สามารถประมวลผลการอ่านภาพบัตรประชาชนได้ กรุณาลองใหม่อีกครั้ง',
        },
        { status: 502 }
      );
    }

    const result = (await response.json()) as any;
    const parts = result.candidates?.[0]?.content?.parts || [];
    // Extract non-thought text parts (Gemini 2.5 uses thought: true for reasoning blocks)
    const textParts = parts
      .filter((p: any) => p.text && !p.thought)
      .map((p: any) => p.text);
    const candidateText =
      textParts.join('\n') || parts.map((p: any) => p.text || '').join('\n');

    // Extract JSON block from response text
    const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error:
            'ไม่สามารถอ่านข้อความจากภาพบัตรประชาชนได้ กรุณาถ่ายภาพให้ชัดเจนและลองใหม่อีกครั้ง',
        },
        { status: 422 }
      );
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: {
        name: parsedData.name || '',
        idCard: parsedData.idCard
          ? String(parsedData.idCard).replace(/[^0-9]/g, '')
          : '',
        address: parsedData.address || '',
      },
    });
  } catch (error) {
    console.error('Error scanning ID card:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสแกนบัตรประชาชน' },
      { status: 500 }
    );
  }
}
