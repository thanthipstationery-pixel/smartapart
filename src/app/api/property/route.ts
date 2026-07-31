import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json(newProp);
    }
    return NextResponse.json(property);
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
    const { name, phone, email, address, lineId, geminiApiKey } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อกิจการ' }, { status: 400 });
    }

    const property = await prisma.property.findFirst();

    if (!property) {
      const created = await prisma.property.create({
        data: { name, phone, email, address, lineId, geminiApiKey }
      });
      return NextResponse.json(created);
    }

    const updated = await prisma.property.update({
      where: { id: property.id },
      data: { name, phone, email, address, lineId, geminiApiKey }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating property settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลตั้งค่าระบบ' },
      { status: 500 }
    );
  }
}
