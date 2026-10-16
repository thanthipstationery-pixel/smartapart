import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const property = await prisma.property.findFirst();
    if (!property) {
      const newProp = await prisma.property.create({
        data: {
          name: 'สมาร์ทอพาร์ทเมนท์ (SmartApart)',
          phone: '02-123-4567',
          email: 'contact@smartapart.com',
          address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
          lineId: '@smartapart',
        }
      });
      const { geminiApiKey: _omitted, ...safeNewProp } = newProp;
      return NextResponse.json({ ...safeNewProp, hasGeminiApiKey: false });
    }

    const { geminiApiKey: _omittedKey, ...safeProperty } = property;
    return NextResponse.json({
      ...safeProperty,
      hasGeminiApiKey: Boolean(property.geminiApiKey),
    });
  } catch (error) {
    console.error('Error fetching property settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลตั้งค่าระบบ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์แก้ไขข้อมูลกิจการ' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const { name, phone, email, address, lineId, geminiApiKey } = body || {};

    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อกิจการ' }, { status: 400 });
    }

    const property = await prisma.property.findFirst();

    if (!property) {
      const created = await prisma.property.create({
        data: { name, phone, email, address, lineId, geminiApiKey }
      });
      const { geminiApiKey: _omitted, ...safeCreated } = created;
      return NextResponse.json({
        ...safeCreated,
        hasGeminiApiKey: Boolean(created.geminiApiKey),
      });
    }

    const updateData: any = { name, phone, email, address, lineId };
    if (geminiApiKey !== undefined && geminiApiKey !== '') {
      updateData.geminiApiKey = geminiApiKey;
    } else if (geminiApiKey === null) {
      updateData.geminiApiKey = null;
    }

    const updated = await prisma.property.update({
      where: { id: property.id },
      data: updateData
    });

    const { geminiApiKey: _omittedKey, ...safeUpdated } = updated;
    return NextResponse.json({
      ...safeUpdated,
      hasGeminiApiKey: Boolean(updated.geminiApiKey),
    });
  } catch (error) {
    console.error('Error updating property settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลตั้งค่าระบบ' },
      { status: 500 }
    );
  }
}
