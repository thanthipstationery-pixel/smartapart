import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

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
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์สร้างการจอง' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
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
    } = body || {};

    if (!roomId || !customerName || !customerPhone || !expectedCheckInDate) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ห้องพัก, ชื่อผู้จอง, เบอร์โทร, วันย้ายเข้า)' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    if (room.status !== 'VACANT') {
      return NextResponse.json(
        { error: `ไม่สามารถจองห้องพักได้ เนื่องจากห้องมีสถานะเป็น ${room.status}` },
        { status: 400 }
      );
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
          recordedBy: session?.name || session?.username || 'ระบบ',
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
