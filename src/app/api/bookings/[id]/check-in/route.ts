import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { startDate, idCard, email, lineId, startingWaterMeter, startingElecMeter } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    if (booking.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'รายการจองนี้ไม่อยู่ในสถานะที่ทำสัญญาได้' }, { status: 400 });
    }

    const checkInDate = startDate ? new Date(startDate) : new Date();

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: booking.customerName,
          phone: booking.customerPhone,
          idCard: idCard || booking.customerIdCard || null,
          email: email || booking.customerEmail || null,
          lineId: lineId || booking.customerLineId || null,
          startDate: checkInDate,
          roomId: booking.roomId,
        },
      });

      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'OCCUPIED' },
      });

      await tx.booking.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
      });

      if (startingWaterMeter !== undefined || startingElecMeter !== undefined) {
        const waterVal = startingWaterMeter !== undefined && startingWaterMeter !== '' ? parseFloat(startingWaterMeter) : 0.0;
        const elecVal = startingElecMeter !== undefined && startingElecMeter !== '' ? parseFloat(startingElecMeter) : 0.0;

        await tx.meterReading.create({
          data: {
            roomId: booking.roomId,
            waterValue: isNaN(waterVal) ? 0.0 : waterVal,
            electricityValue: isNaN(elecVal) ? 0.0 : elecVal,
            readingDate: checkInDate,
            recordedBy: 'ระบบ (มิเตอร์แรกเข้าจากส่งต่อการจอง)',
          },
        });
      }

      return newTenant;
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error checking in booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการทำสัญญาเข้าพัก' }, { status: 500 });
  }
}
