import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
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
      orderBy: [
        { status: 'asc' },
        { room: { number: 'asc' } },
      ],
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      name,
      phone,
      idCard,
      address,
      email,
      lineId,
      workplace,
      emergencyName,
      emergencyRel,
      emergencyPhone,
      securityDeposit,
      keycardCount,
      keycardDeposit,
      keycardCode,
      note,
      startDate,
      roomId,
      startingWaterMeter,
      startingElecMeter
    } = await request.json();

    if (!name || !phone || !startDate || !roomId) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เบอร์โทร, วันที่เริ่มเช่า, ห้องพัก)' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { floor: { include: { building: true } } }
    });

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    }

    if (room.status === 'OCCUPIED') {
      return NextResponse.json({ error: 'ห้องพักนี้มีผู้เช่าอยู่แล้ว' }, { status: 400 });
    }

    // Create tenant and set room to occupied
    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name,
          phone,
          idCard: idCard || null,
          address: address || null,
          email: email || null,
          lineId: lineId || null,
          workplace: workplace || null,
          emergencyName: emergencyName || null,
          emergencyRel: emergencyRel || null,
          emergencyPhone: emergencyPhone || null,
          securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
          keycardCount: keycardCount ? parseInt(keycardCount) : 0,
          keycardDeposit: keycardDeposit ? parseFloat(keycardDeposit) : 0,
          keycardCode: keycardCode || null,
          note: note || null,
          startDate: new Date(startDate),
          roomId,
          status: 'ACTIVE',
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' },
      });

      // Calculate First Invoice using Landlord Rules (1.1, 1.2, 1.3)
      const { calculateCheckInPayment } = await import('@/lib/billingRules');
      const { formatThaiMonthOnly } = await import('@/lib/thaiDate');
      const secDepNum = securityDeposit ? parseFloat(securityDeposit) : room.basePrice;
      const calc = calculateCheckInPayment(startDate, room.basePrice, secDepNum);

      const kcDepNum = keycardDeposit ? parseFloat(keycardDeposit) : 0;
      const kcCountNum = keycardCount ? parseInt(keycardCount) : 0;
      const waterVal = startingWaterMeter !== undefined && startingWaterMeter !== '' ? parseFloat(startingWaterMeter) : 0.0;
      const elecVal = startingElecMeter !== undefined && startingElecMeter !== '' ? parseFloat(startingElecMeter) : 0.0;

      // Build itemized line items for Invoice Table (ตารางรายการค่าใช้จ่าย)
      const items: Array<{ name: string; amount: number }> = [];

      // 1. Current Month Rent
      if (calc.ruleCode === 'RULE_1_1') {
        items.push({
          name: `ค่าเช่าเดือน${formatThaiMonthOnly(calc.billingPeriod)}`,
          amount: calc.currentMonthRent,
        });
      } else {
        const curMonthPeriod = String(startDate).slice(0, 7);
        items.push({
          name: `ค่าเช่าเดือน${formatThaiMonthOnly(curMonthPeriod)} (${calc.remainingDays} วัน)`,
          amount: calc.currentMonthRent,
        });
      }

      // 2. Next Month Rent (Rule 1.3)
      if (calc.nextMonthRent > 0) {
        items.push({
          name: `ค่าเช่าเดือน${formatThaiMonthOnly(calc.nextBillingPeriod)} (ล่วงหน้า)`,
          amount: calc.nextMonthRent,
        });
      }

      // 3. Security Deposit (ค่าประกันสัญญาเช่า)
      items.push({
        name: 'ค่าประกันสัญญาเช่า',
        amount: calc.securityDeposit,
      });

      // 4. Keycard Deposit (ค่ามัดจำคีย์การ์ด - ถ้ามี)
      if (kcDepNum > 0) {
        items.push({
          name: `ค่ามัดจำคีย์การ์ด (${kcCountNum} ใบ)`,
          amount: kcDepNum,
        });
      }

      const grandTotalAmount = calc.currentMonthRent + calc.nextMonthRent + calc.securityDeposit + kcDepNum;

      // Create initial first invoice with itemized details
      const firstInvoice = await tx.invoice.create({
        data: {
          roomId,
          tenantId: newTenant.id,
          billingPeriod: calc.billingPeriod,
          previousWater: isNaN(waterVal) ? 0.0 : waterVal,
          currentWater: isNaN(waterVal) ? 0.0 : waterVal,
          previousElec: isNaN(elecVal) ? 0.0 : elecVal,
          currentElec: isNaN(elecVal) ? 0.0 : elecVal,
          waterCost: 0.0,
          electricityCost: 0.0,
          rentCost: 0.0,
          otherCost: grandTotalAmount,
          bookNo: room.number,
          invoiceNoStr: '1',
          otherFeeDetails: JSON.stringify(items),
          otherNote: `รายการรับชำระแรกเข้า (${calc.description})`,
          totalAmount: grandTotalAmount,
          status: 'UNPAID',
          dueDate: new Date(startDate),
          waterRate: room.floor.building.waterRate,
          electricityRate: room.floor.building.electricityRate,
        },
      });

      // Save initial meter reading record in MeterReading table
      await tx.meterReading.create({
        data: {
          roomId,
          waterValue: isNaN(waterVal) ? 0.0 : waterVal,
          electricityValue: isNaN(elecVal) ? 0.0 : elecVal,
          readingDate: new Date(startDate),
          recordedBy: 'CHECK_IN',
        },
      });

      return { ...newTenant, firstInvoiceId: firstInvoice.id, firstInvoicePeriod: calc.billingPeriod };
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error adding tenant:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียนผู้เช่า' },
      { status: 500 }
    );
  }
}
