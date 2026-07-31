import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        idCard: body.idCard || null,
        address: body.address || null,
        email: body.email || null,
        lineId: body.lineId || null,
        workplace: body.workplace || null,
        emergencyName: body.emergencyName || null,
        emergencyRel: body.emergencyRel || null,
        emergencyPhone: body.emergencyPhone || null,
        securityDeposit: body.securityDeposit !== undefined ? parseFloat(body.securityDeposit) : undefined,
        keycardCount: body.keycardCount !== undefined ? parseInt(body.keycardCount) : undefined,
        keycardDeposit: body.keycardDeposit !== undefined ? parseFloat(body.keycardDeposit) : undefined,
        keycardCode: body.keycardCode || null,
        note: body.note || null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true, invoices: { include: { payments: true } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete payments for tenant's invoices
      const invoiceIds = tenant.invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
      }

      // 2. Delete tenant invoices
      await tx.invoice.deleteMany({
        where: { tenantId: id },
      });

      // 3. Delete initial meter readings for room during tenant stay
      await tx.meterReading.deleteMany({
        where: { roomId: tenant.roomId, recordedBy: 'CHECK_IN' },
      });

      // 4. Delete tenant record
      await tx.tenant.delete({
        where: { id },
      });

      // 5. Reset room status to VACANT
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      });
    });

    return NextResponse.json({ success: true, message: 'ยกเลิกการเข้าพักและคืนสถานะห้องว่างเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error cancelling check-in:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการเข้าพัก' }, { status: 500 });
  }
}
