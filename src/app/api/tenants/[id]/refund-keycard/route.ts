import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์บันทึกคืนเงินคีย์การ์ด' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as any;

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
