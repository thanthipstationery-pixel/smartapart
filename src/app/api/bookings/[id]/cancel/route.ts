import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as any;
    const { action } = body || {}; // "REFUND" or "FORFEIT"

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    if (booking.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'รายการจองนี้ไม่สามารถยกเลิกได้เนื่องจากมีสถานะเป็น ' + booking.status },
        { status: 400 }
      );
    }

    const newStatus = action === 'REFUND' ? 'CANCELLED_REFUNDED' : 'CANCELLED_FORFEITED';

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: newStatus },
      });

      if (booking.room && booking.room.status === 'BOOKED') {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'VACANT' },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' }, { status: 500 });
  }
}
