import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const where: any = {};
    if (roomId) where.roomId = roomId;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { room: true },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      roomId,
      customerName,
      customerPhone,
      customerIdCard,
      customerEmail,
      customerLineId,
      expectedCheckInDate,
      depositAmount,
      paymentMethod,
      slipImage,
      note,
    } = await request.json();

    if (!roomId || !customerName || !customerPhone || !expectedCheckInDate) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ห้องพัก, ชื่อผู้จอง, เบอร์โทร, วันย้ายเข้า)' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    if (room.status === 'OCCUPIED') {
      return NextResponse.json({ error: 'ห้องพักนี้มีผู้เช่าอยู่แล้ว ไม่สามารถจองได้' }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          roomId,
          customerName,
          customerPhone,
          customerIdCard: customerIdCard || null,
          customerEmail: customerEmail || null,
          customerLineId: customerLineId || null,
          expectedCheckInDate: new Date(expectedCheckInDate),
          depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
          paymentMethod: paymentMethod || null,
          slipImage: slipImage || null,
          note: note || null,
          status: 'ACTIVE',
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'BOOKED' },
      });

      return newBooking;
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกการจอง' }, { status: 500 });
  }
}
