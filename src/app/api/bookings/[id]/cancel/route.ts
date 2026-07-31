import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // "REFUND" or "FORFEIT"

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    const newStatus = action === 'REFUND' ? 'CANCELLED_REFUNDED' : 'CANCELLED_FORFEITED';

    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'VACANT' },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' }, { status: 500 });
  }
}
