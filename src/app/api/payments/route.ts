import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์บันทึกรับเงิน' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const { invoiceId, amountPaid, paymentMethod, slipImage, status } = body || {};

    if (!invoiceId || amountPaid === undefined) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุใบแจ้งหนี้และยอดเงินชำระ)' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: 'ยอดเงินชำระไม่ถูกต้อง (ต้องเป็นตัวเลขมากกว่า 0)' },
        { status: 400 }
      );
    }

    const targetInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!targetInvoice) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งหนี้ที่ระบุ' }, { status: 404 });
    }

    const paymentStatus = status || 'APPROVED';

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          invoiceId,
          amountPaid: amount,
          paymentMethod: paymentMethod || 'TRANSFER',
          slipImage: slipImage || null,
          status: paymentStatus,
          recordedBy: session?.name || session?.username || 'ระบบ',
        },
      });


      // If payment is approved, aggregate all approved payments for this invoice
      if (paymentStatus === 'APPROVED') {
        const approvedPaymentsSum = await tx.payment.aggregate({
          where: {
            invoiceId,
            status: 'APPROVED',
          },
          _sum: {
            amountPaid: true,
          },
        });

        const totalPaid = approvedPaymentsSum._sum.amountPaid || 0;

        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          select: { totalAmount: true },
        });

        if (invoice) {
          let newStatus = 'UNPAID';
          if (totalPaid >= invoice.totalAmount - 0.01) {
            newStatus = 'PAID';
          } else if (totalPaid > 0) {
            newStatus = 'PARTIAL';
          }

          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
          });
        }
      }

      return newPayment;
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error saving payment:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการชำระเงิน' },
      { status: 500 }
    );
  }
}
