import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as any;
    const {
      targetRoomId,
      sourceWaterMeter,
      sourceElecMeter,
      targetWaterMeter,
      targetElecMeter,
      transferDate,
      note,
      invoiceData,
    } = body || {};

    if (!targetRoomId) {
      return NextResponse.json({ error: 'กรุณาระบุห้องพักปลายทาง' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    const targetRoom = await prisma.room.findUnique({
      where: { id: targetRoomId },
    });

    if (!targetRoom || targetRoom.status !== 'VACANT') {
      return NextResponse.json({ error: 'ห้องพักปลายทางไม่อยู่ในสถานะว่าง' }, { status: 400 });
    }

    // Prepare dates
    const dateObj = transferDate ? new Date(transferDate) : new Date();

    // Determine meters
    const oldWaterFinal = sourceWaterMeter !== undefined && sourceWaterMeter !== '' ? parseFloat(sourceWaterMeter) : 0;
    const oldElecFinal = sourceElecMeter !== undefined && sourceElecMeter !== '' ? parseFloat(sourceElecMeter) : 0;
    const newWaterStart = targetWaterMeter !== undefined && targetWaterMeter !== '' ? parseFloat(targetWaterMeter) : 0;
    const newElecStart = targetElecMeter !== undefined && targetElecMeter !== '' ? parseFloat(targetElecMeter) : 0;

    // Get old meters to store on invoice
    const lastOldWaterReading = await prisma.meterReading.findFirst({
      where: { roomId: tenant.roomId },
      orderBy: { readingDate: 'desc' },
    });
    const oldWaterStart = lastOldWaterReading?.waterValue || 0;
    const oldElecStart = lastOldWaterReading?.electricityValue || 0;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record final meter reading for source room
      if (oldWaterFinal > 0 || oldElecFinal > 0) {
        await tx.meterReading.create({
          data: {
            roomId: tenant.roomId,
            waterValue: oldWaterFinal,
            electricityValue: oldElecFinal,
            readingDate: dateObj,
            recordedBy: 'ROOM_TRANSFER_OUT',
          },
        });
      }

      // 2. Record starting meter reading for target room
      if (newWaterStart > 0 || newElecStart > 0) {
        await tx.meterReading.create({
          data: {
            roomId: targetRoomId,
            waterValue: newWaterStart,
            electricityValue: newElecStart,
            readingDate: dateObj,
            recordedBy: 'ROOM_TRANSFER_IN',
          },
        });
      }

      // 3. Update source room to VACANT
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      });

      // 4. Update target room to OCCUPIED
      await tx.room.update({
        where: { id: targetRoomId },
        data: { status: 'OCCUPIED' },
      });

      // 5. Transfer tenant to target room & update note and financials
      const oldRoomNumber = tenant.room.number;
      const transferLog = `[ย้ายห้องจาก ${oldRoomNumber} ไป ${targetRoom.number} เมื่อ ${dateObj.toISOString().split('T')[0]}] ${note || ''}`;
      const updatedNote = tenant.note ? `${tenant.note}\n${transferLog}` : transferLog;
      
      let newSecurityDeposit = tenant.securityDeposit;
      let newKeycardCount = tenant.keycardCount;
      let newKeycardDeposit = tenant.keycardDeposit;

      if (invoiceData) {
        if (invoiceData.newSecurityDeposit !== undefined) {
          newSecurityDeposit = invoiceData.newSecurityDeposit;
        }
        if (invoiceData.keycardAction === 'REPLACE') {
          newKeycardCount = invoiceData.newKeycardCount || 0;
          newKeycardDeposit = invoiceData.newKeycardDeposit || 0;
        } else if (invoiceData.keycardAction === 'RETURN') {
          newKeycardCount = 0;
          newKeycardDeposit = 0;
        }
      }

      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: {
          roomId: targetRoomId,
          note: updatedNote,
          securityDeposit: newSecurityDeposit,
          keycardCount: newKeycardCount,
          keycardDeposit: newKeycardDeposit,
        },
      });

      // 6. Generate Transfer Invoice if invoiceData is provided
      if (invoiceData) {
        const dueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date(dateObj.getTime() + 5 * 24 * 60 * 60 * 1000); // default +5 days
        
        const otherFeeDetails = invoiceData.otherFeeDetails ? [...invoiceData.otherFeeDetails] : [];
        let otherCost = otherFeeDetails.reduce((sum, item) => sum + item.amount, 0);
        if (invoiceData.proratedOldRentCredit > 0) {
          otherFeeDetails.push({ name: `คืนค่าเช่าเฉลี่ยที่ไม่ได้อยู่ (ห้อง ${oldRoomNumber})`, amount: -invoiceData.proratedOldRentCredit });
          otherCost -= invoiceData.proratedOldRentCredit;
        }
        
        // Deposit Adjustments
        const depositDifference = (invoiceData.newSecurityDeposit || 0) - (tenant.securityDeposit || 0);
        if (depositDifference > 0) {
          otherFeeDetails.push({ name: `เรียกเก็บส่วนต่างเงินประกันเพิ่ม`, amount: depositDifference });
          otherCost += depositDifference;
        } else if (depositDifference < 0) {
          otherFeeDetails.push({ name: `คืนส่วนต่างเงินประกัน (ส่วนลด)`, amount: depositDifference });
          otherCost += depositDifference; // depositDifference is already negative
        }

        // Keycard Adjustments
        if (invoiceData.keycardAction === 'RETURN') {
           otherFeeDetails.push({ name: 'คืนมัดจำคีย์การ์ดเดิม', amount: -(invoiceData.keycardRefund || 0) });
           otherCost -= (invoiceData.keycardRefund || 0);
        } else if (invoiceData.keycardAction === 'REPLACE' || invoiceData.keycardAction === 'NONE') {
           if ((invoiceData.keycardRefund || 0) > 0) {
             otherFeeDetails.push({ name: 'คืนมัดจำคีย์การ์ดเดิม', amount: -invoiceData.keycardRefund });
             otherCost -= invoiceData.keycardRefund;
           }
           if ((invoiceData.newKeycardDeposit || 0) > 0) {
             otherFeeDetails.push({ name: 'ค่ามัดจำคีย์การ์ดใหม่', amount: invoiceData.newKeycardDeposit });
             otherCost += invoiceData.newKeycardDeposit;
           }
        }

        const rentCost = (invoiceData.proratedNewRent || 0) + (invoiceData.nextMonthFullRent || 0);
        const waterCost = invoiceData.waterCost || 0;
        const elecCost = invoiceData.elecCost || 0;

        // Server-authoritative financial calculation:
        const calculatedTotal = Math.max(0, rentCost + waterCost + elecCost + otherCost);

        await tx.invoice.create({
          data: {
            roomId: targetRoomId,
            tenantId: id,
            billingPeriod: invoiceData.billingPeriod || dateObj.toISOString().slice(0, 7),
            previousWater: oldWaterStart,
            currentWater: oldWaterFinal,
            previousElec: oldElecStart,
            currentElec: oldElecFinal,
            waterCost: waterCost,
            electricityCost: elecCost,
            rentCost: rentCost,
            otherCost: otherCost,
            totalAmount: calculatedTotal,
            otherFeeDetails: JSON.stringify(otherFeeDetails),
            otherNote: `บิลแจ้งย้ายห้อง (จากห้อง ${oldRoomNumber})`,
            status: 'UNPAID',
            dueDate: dueDate,
            waterRate: invoiceData.waterRate || 0,
            electricityRate: invoiceData.elecRate || 0,
          },
        });
      }

      return updatedTenant;
    });

    return NextResponse.json({ success: true, tenant: result });
  } catch (error) {
    console.error('Error transferring room:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการย้ายห้องพัก' }, { status: 500 });
  }
}
