import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์แก้ไขข้อมูลผู้เช่า' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as any;

    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    const parseAge = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const num = parseInt(String(val), 10);
      return isNaN(num) ? null : num;
    };

    const dataToUpdate: any = {};

    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone;
    if (body.idCard !== undefined) dataToUpdate.idCard = body.idCard || null;
    if (body.address !== undefined) dataToUpdate.address = body.address || null;
    if (body.email !== undefined) dataToUpdate.email = body.email || null;
    if (body.lineId !== undefined) dataToUpdate.lineId = body.lineId || null;
    if (body.workplace !== undefined) dataToUpdate.workplace = body.workplace || null;
    if (body.emergencyName !== undefined) dataToUpdate.emergencyName = body.emergencyName || null;
    if (body.emergencyRel !== undefined) dataToUpdate.emergencyRel = body.emergencyRel || null;
    if (body.emergencyPhone !== undefined) dataToUpdate.emergencyPhone = body.emergencyPhone || null;

    if (body.securityDeposit !== undefined) {
      const sdVal = parseFloat(String(body.securityDeposit));
      dataToUpdate.securityDeposit = !isNaN(sdVal) ? sdVal : 0;
    }
    if (body.keycardCount !== undefined) {
      const kcVal = parseInt(String(body.keycardCount), 10);
      dataToUpdate.keycardCount = !isNaN(kcVal) ? kcVal : 0;
    }
    if (body.keycardDeposit !== undefined) {
      const kdVal = parseFloat(String(body.keycardDeposit));
      dataToUpdate.keycardDeposit = !isNaN(kdVal) ? kdVal : 0;
    }
    if (body.keycardCode !== undefined) dataToUpdate.keycardCode = body.keycardCode || null;
    if (body.note !== undefined) dataToUpdate.note = body.note || null;
    if (body.startDate !== undefined) dataToUpdate.startDate = new Date(body.startDate);

    // Lease Agreement & Co-Tenant Fields
    if (body.nickname !== undefined) dataToUpdate.nickname = body.nickname ? String(body.nickname).trim() : null;
    if (body.age !== undefined) dataToUpdate.age = parseAge(body.age);
    if (body.idCardImage !== undefined) dataToUpdate.idCardImage = body.idCardImage || null;

    if (body.secondTenantName !== undefined) {
      dataToUpdate.secondTenantName = body.secondTenantName ? String(body.secondTenantName).trim() : null;
    }
    if (body.secondTenantNickname !== undefined) {
      dataToUpdate.secondTenantNickname = body.secondTenantNickname ? String(body.secondTenantNickname).trim() : null;
    }
    if (body.secondTenantAge !== undefined) dataToUpdate.secondTenantAge = parseAge(body.secondTenantAge);
    if (body.secondTenantIdCard !== undefined) {
      dataToUpdate.secondTenantIdCard = body.secondTenantIdCard ? String(body.secondTenantIdCard).trim() : null;
    }
    if (body.secondTenantAddress !== undefined) {
      dataToUpdate.secondTenantAddress = body.secondTenantAddress ? String(body.secondTenantAddress).trim() : null;
    }
    if (body.secondTenantPhone !== undefined) {
      dataToUpdate.secondTenantPhone = body.secondTenantPhone ? String(body.secondTenantPhone).trim() : null;
    }
    if (body.secondTenantWorkplace !== undefined) {
      dataToUpdate.secondTenantWorkplace = body.secondTenantWorkplace ? String(body.secondTenantWorkplace).trim() : null;
    }
    if (body.secondTenantEmergencyName !== undefined) {
      dataToUpdate.secondTenantEmergencyName = body.secondTenantEmergencyName ? String(body.secondTenantEmergencyName).trim() : null;
    }
    if (body.secondTenantEmergencyRel !== undefined) {
      dataToUpdate.secondTenantEmergencyRel = body.secondTenantEmergencyRel ? String(body.secondTenantEmergencyRel).trim() : null;
    }
    if (body.secondTenantEmergencyPhone !== undefined) {
      dataToUpdate.secondTenantEmergencyPhone = body.secondTenantEmergencyPhone ? String(body.secondTenantEmergencyPhone).trim() : null;
    }
    if (body.secondTenantIdCardImage !== undefined) dataToUpdate.secondTenantIdCardImage = body.secondTenantIdCardImage || null;

    if (body.contractNumber !== undefined) {
      dataToUpdate.contractNumber = body.contractNumber ? String(body.contractNumber).trim() : null;
    }
    if (body.contractDurationMonths !== undefined) {
      const parsedDuration = parseInt(String(body.contractDurationMonths), 10);
      dataToUpdate.contractDurationMonths = !isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : 6;
    }

    // Room rent share and asset rent share calculation
    const roomPrice = existingTenant.room?.basePrice || 0;
    if (body.roomRentShare !== undefined) {
      const parsedRShare = parseFloat(String(body.roomRentShare));
      dataToUpdate.roomRentShare = !isNaN(parsedRShare) ? parsedRShare : 1000;
    }

    if (body.assetRentShare !== undefined) {
      if (body.assetRentShare === null || body.assetRentShare === '') {
        dataToUpdate.assetRentShare = null;
      } else {
        const parsedAShare = parseFloat(String(body.assetRentShare));
        dataToUpdate.assetRentShare = !isNaN(parsedAShare) ? parsedAShare : null;
      }
    } else if (body.roomRentShare !== undefined) {
      // Recalculate assetRentShare if roomRentShare changed but assetRentShare was not explicitly provided
      const currentRoomRentShare = dataToUpdate.roomRentShare !== undefined ? dataToUpdate.roomRentShare : (existingTenant.roomRentShare ?? 1000);
      dataToUpdate.assetRentShare = Math.max(0, roomPrice - currentRoomRentShare);
    }

    // End date calculation
    if (body.endDate !== undefined) {
      dataToUpdate.endDate = body.endDate ? new Date(body.endDate) : null;
    } else if (body.contractDurationMonths !== undefined || body.startDate !== undefined) {
      const sDate = dataToUpdate.startDate ? new Date(dataToUpdate.startDate) : new Date(existingTenant.startDate);
      const duration = dataToUpdate.contractDurationMonths !== undefined ? dataToUpdate.contractDurationMonths : (existingTenant.contractDurationMonths || 6);
      const endD = new Date(sDate);
      endD.setMonth(endD.getMonth() + duration);
      dataToUpdate.endDate = endD;
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: dataToUpdate,
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
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์ยกเลิกการเข้าพัก' },
        { status: 403 }
      );
    }

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
