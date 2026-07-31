import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const {
      meterType, // "WATER" | "ELEC" | "BOTH"
      oldWaterFinal,
      newWaterStart,
      oldElecFinal,
      newElecStart,
      replacementDate,
      note,
      billingPeriod,
    } = body;

    if (!roomId || !meterType) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุห้องพักและประเภทมิเตอร์)' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลห้องพัก' }, { status: 404 });
    }

    const eventDate = replacementDate ? new Date(replacementDate) : new Date();
    const periodStr = billingPeriod || `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

    // Fetch the latest meter reading before the replacement
    const lastReading = await prisma.meterReading.findFirst({
      where: { roomId },
      orderBy: { readingDate: 'desc' },
    });

    const prevWater = lastReading ? lastReading.waterValue : 0;
    const prevElec = lastReading ? lastReading.electricityValue : 0;

    const parsedOldWater = oldWaterFinal !== undefined && oldWaterFinal !== null ? parseFloat(oldWaterFinal) : null;
    const parsedNewWater = newWaterStart !== undefined && newWaterStart !== null ? parseFloat(newWaterStart) : 0;
    const parsedOldElec = oldElecFinal !== undefined && oldElecFinal !== null ? parseFloat(oldElecFinal) : null;
    const parsedNewElec = newElecStart !== undefined && newElecStart !== null ? parseFloat(newElecStart) : 0;

    // 1. Create MeterReplacement Record
    const replacement = await prisma.meterReplacement.create({
      data: {
        roomId,
        meterType,
        oldWaterFinal: parsedOldWater,
        newWaterStart: parsedNewWater,
        oldElecFinal: parsedOldElec,
        newElecStart: parsedNewElec,
        replacementDate: eventDate,
        note: note || 'เปลี่ยนมิเตอร์น้ำ/ไฟ',
        billingPeriod: periodStr,
      },
    });

    // 2. Set new baseline MeterReading with the new meter initial value
    const finalNewWater = (meterType === 'WATER' || meterType === 'BOTH') ? parsedNewWater : prevWater;
    const finalNewElec = (meterType === 'ELEC' || meterType === 'BOTH') ? parsedNewElec : prevElec;

    const newReading = await prisma.meterReading.create({
      data: {
        roomId,
        readingDate: eventDate,
        waterValue: finalNewWater,
        electricityValue: finalNewElec,
        recordedBy: `เปลี่ยนมิเตอร์ (${note || meterType})`,
      },
    });

    return NextResponse.json({
      message: 'บันทึกการเปลี่ยนมิเตอร์เรียบร้อยแล้ว',
      replacement,
      newReading,
      prevWater,
      prevElec,
    });
  } catch (error: any) {
    console.error('Error recording meter replacement:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกเปลี่ยนมิเตอร์: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
