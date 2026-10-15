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
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์ดำเนินการย้ายออก' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as any;


    const {
      actionType = 'FINAL_CHECKOUT', // 'RECORD_NOTICE_ONLY' | 'FINAL_CHECKOUT' | 'CANCEL_NOTICE'
      checkOutDate,
      noticeDate,
      expectedCheckOutDate,
      finalWaterValue,
      finalElecValue,
      otherFeeDetails = [],
      keycardsReturned = 0,
      overrideForfeitDeposit = false,
      refundProratedRent = false,
      proratedRefundAmount = 0,
      note = '',
    } = body;

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
            invoices: {
              where: { status: 'UNPAID' },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    if (tenant.status === 'CHECKED_OUT') {
      return NextResponse.json(
        { error: 'ผู้เช่ารายนี้ดำเนินการย้ายออกเสร็จสิ้นไปแล้ว' },
        { status: 400 }
      );
    }

    // MODE 1: Record Notice Only (ยังไม่คืนห้อง)
    if (actionType === 'RECORD_NOTICE_ONLY') {
      const noticeDateTime = noticeDate ? new Date(noticeDate) : new Date();
      const expectedOutDateTime = expectedCheckOutDate ? new Date(expectedCheckOutDate) : (checkOutDate ? new Date(checkOutDate) : new Date());

      const updatedTenant = await prisma.tenant.update({
        where: { id },
        data: {
          noticeDate: noticeDateTime,
          expectedCheckOutDate: expectedOutDateTime,
          note: note ? `${tenant.note || ''}\n[บันทึกแจ้งย้ายออกเมื่อ ${noticeDateTime.toLocaleDateString('th-TH')} กำหนดออก ${expectedOutDateTime.toLocaleDateString('th-TH')}]: ${note}` : tenant.note,
        },
      });

      return NextResponse.json({
        success: true,
        isNoticeOnly: true,
        tenant: updatedTenant,
        message: 'บันทึกการแจ้งย้ายออกล่วงหน้าเรียบร้อยแล้ว',
      });
    }

    // MODE 1.5: Cancel Pending Notice (ยกเลิกการแจ้งย้ายออก)
    if (actionType === 'CANCEL_NOTICE') {
      const updatedTenant = await prisma.tenant.update({
        where: { id },
        data: {
          noticeDate: null,
          expectedCheckOutDate: null,
        },
      });

      return NextResponse.json({
        success: true,
        tenant: updatedTenant,
        message: 'ยกเลิกการแจ้งย้ายออกเรียบร้อยแล้ว',
      });
    }

    // MODE 2: Final Check-Out & Refund Settlement
    const checkOutDateTime = checkOutDate ? new Date(checkOutDate) : new Date();

    // Check 1-month notice policy (30 days)
    const { validateCheckOutNotice } = await import('@/lib/billingRules');
    const effectiveNoticeDate = noticeDate ? new Date(noticeDate) : (tenant.noticeDate ? new Date(tenant.noticeDate) : checkOutDateTime);
    
    const noticeCheck = validateCheckOutNotice(
      tenant.startDate,
      checkOutDateTime,
      effectiveNoticeDate,
      Boolean(overrideForfeitDeposit)
    );

    // Keycard refund calculation
    const keycardCount = tenant.keycardCount || 0;
    const keycardDeposit = tenant.keycardDeposit || 0;
    const returnedCountNum = parseInt(keycardsReturned || '0');
    const keycardRefundAmount = keycardCount > 0 ? (returnedCountNum / keycardCount) * keycardDeposit : 0;

    // Effective Security Deposit Refundable
    const effectiveSecurityDeposit = noticeCheck.shouldForfeitDeposit ? 0 : tenant.securityDeposit;

    const updatedNote = note
      ? `${tenant.note || ''}\n[คืนห้องย้ายออกวันที่ ${checkOutDateTime.toLocaleDateString('th-TH')}]: ${note} (${noticeCheck.warningMessage})`
      : tenant.note;

    // Atomic transaction: record meter reading (if provided), update Tenant to CHECKED_OUT, update Room to VACANT
    const updatedTenant = await prisma.$transaction(async (tx) => {
      // Record final meter reading if provided
      if (finalWaterValue !== undefined || finalElecValue !== undefined) {
        const waterVal = finalWaterValue !== '' ? parseFloat(finalWaterValue) : 0.0;
        const elecVal = finalElecValue !== '' ? parseFloat(finalElecValue) : 0.0;

        await tx.meterReading.create({
          data: {
            roomId: tenant.roomId,
            waterValue: isNaN(waterVal) ? 0.0 : waterVal,
            electricityValue: isNaN(elecVal) ? 0.0 : elecVal,
            readingDate: checkOutDateTime,
            recordedBy: 'ระบบ (มิเตอร์วันย้ายออก)',
          },
        });
      }

      const tenantResult = await tx.tenant.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          endDate: checkOutDateTime,
          checkedOutAt: checkOutDateTime,
          noticeDate: effectiveNoticeDate,
          keycardReturnedCount: returnedCountNum,
          keycardRefundAmount,
          keycardRefundedAt: checkOutDateTime,
          note: updatedNote,
        },
      });

      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      });

      return tenantResult;
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
      noticeCheck,
      summary: {
        rawSecurityDeposit: tenant.securityDeposit,
        securityDeposit: effectiveSecurityDeposit,
        keycardDeposit: tenant.keycardDeposit,
        keycardsReturned: returnedCountNum,
        keycardRefundAmount,
        otherFeeDetails,
        refundProratedRent: Boolean(refundProratedRent),
        proratedRefundAmount: parseFloat(proratedRefundAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error during tenant check-out:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดำเนินการย้ายออก' }, { status: 500 });
  }
}
