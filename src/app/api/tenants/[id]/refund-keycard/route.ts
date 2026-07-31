import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { returnedCount, refundAmount } = body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        keycardReturnedCount: parseInt(returnedCount || '0'),
        keycardRefundAmount: parseFloat(refundAmount || '0'),
        keycardRefundedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error('Error processing late keycard refund:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกคืนเงินคีย์การ์ด' }, { status: 500 });
  }
}
