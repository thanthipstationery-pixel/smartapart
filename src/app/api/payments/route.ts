import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { invoiceId, amountPaid, paymentMethod, slipImage, status } = await request.json();

    if (!invoiceId || amountPaid === undefined) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุใบแจ้งหนี้และยอดเงินชำระ)' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountPaid);
    const paymentStatus = status || 'APPROVED';

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          invoiceId,
          amountPaid: amount,
          paymentMethod: paymentMethod || 'TRANSFER',
          slipImage: slipImage || null,
          status: paymentStatus,
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
