import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const billingPeriod = searchParams.get('billingPeriod');
    const status = searchParams.get('status');

    const where: any = {};
    if (roomId) where.roomId = roomId;
    if (billingPeriod) where.billingPeriod = billingPeriod;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { billingPeriod: 'desc' },
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
        tenant: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบแจ้งหนี้' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { roomId, billingPeriod, dueDate, otherCost, customWaterCost, customElecCost } = await request.json();

    if (!roomId || !billingPeriod || !dueDate) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุห้องพัก, รอบบิล, วันที่ครบกำหนดชำระ)' },
        { status: 400 }
      );
    }

    // 1. Check if invoice already exists for this room and period
    const existing = await prisma.invoice.findFirst({
      where: { roomId, billingPeriod },
    });

    if (existing) {
      return NextResponse.json(
        { error: `มีใบแจ้งหนี้สำหรับห้องนี้ในรอบบิล ${billingPeriod} แล้ว` },
        { status: 400 }
      );
    }

    // 2. Fetch room, active tenant, and building rates
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        floor: {
          include: { building: true },
        },
        tenants: {
          where: { endDate: null }, // Active tenant
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    }

    const tenant = room.tenants[0];
    if (!tenant) {
      return NextResponse.json(
        { error: 'ไม่สามารถออกใบแจ้งหนี้ได้เนื่องจากห้องนี้ว่าง ไม่มีผู้เช่า' },
        { status: 400 }
      );
    }

    // 3. Find the current meter reading in this billingPeriod month
    const [year, month] = billingPeriod.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const currentReading = await prisma.meterReading.findFirst({
      where: {
        roomId,
        readingDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { readingDate: 'desc' },
    });

    if (!currentReading) {
      return NextResponse.json(
        { error: `ยังไม่มีการบันทึกมิเตอร์น้ำไฟของเดือน ${billingPeriod} สำหรับห้องนี้ กรุณาบันทึกค่ามิเตอร์ก่อน` },
        { status: 400 }
      );
    }

    // 4. Find the previous reading (latest before current reading)
    const previousReading = await prisma.meterReading.findFirst({
      where: {
        roomId,
        readingDate: {
          lt: currentReading.readingDate,
        },
      },
      orderBy: { readingDate: 'desc' },
    });

    const prevWater = previousReading ? previousReading.waterValue : currentReading.waterValue;
    const prevElec = previousReading ? previousReading.electricityValue : currentReading.electricityValue;

    // Check for meter replacement in this period
    const replacement = await prisma.meterReplacement.findFirst({
      where: { roomId, billingPeriod },
      orderBy: { createdAt: 'desc' },
    });

    let waterUnits = Math.max(0, currentReading.waterValue - prevWater);
    let elecUnits = Math.max(0, currentReading.electricityValue - prevElec);
    const replacementNotes: string[] = [];

    if (replacement) {
      if ((replacement.meterType === 'WATER' || replacement.meterType === 'BOTH') && replacement.oldWaterFinal !== null) {
        const oldWUnits = Math.max(0, replacement.oldWaterFinal - prevWater);
        const newWUnits = Math.max(0, currentReading.waterValue - (replacement.newWaterStart ?? 0));
        waterUnits = oldWUnits + newWUnits;
        replacementNotes.push(`เปลี่ยนมิเตอร์น้ำ (ลูกเก่า ${prevWater}➔${replacement.oldWaterFinal}=${oldWUnits}u, ลูกใหม่ ${replacement.newWaterStart}➔${currentReading.waterValue}=${newWUnits}u)`);
      }
      if ((replacement.meterType === 'ELEC' || replacement.meterType === 'BOTH') && replacement.oldElecFinal !== null) {
        const oldEUnits = Math.max(0, replacement.oldElecFinal - prevElec);
        const newEUnits = Math.max(0, currentReading.electricityValue - (replacement.newElecStart ?? 0));
        elecUnits = oldEUnits + newEUnits;
        replacementNotes.push(`เปลี่ยนมิเตอร์ไฟ (ลูกเก่า ${prevElec}➔${replacement.oldElecFinal}=${oldEUnits}u, ลูกใหม่ ${replacement.newElecStart}➔${currentReading.electricityValue}=${newEUnits}u)`);
      }
    }

    const building = room.floor.building;
    
    // Calculate water cost based on billing type
    let waterCost = 0;
    if (room.waterBillingType === 'FLAT') {
      waterCost = room.flatWaterCost;
    } else if (room.waterBillingType === 'CUSTOM') {
      waterCost = customWaterCost !== undefined ? parseFloat(customWaterCost) : 0;
    } else {
      const calculatedWaterCost = waterUnits * building.waterRate;
      // Apply minimum water cost if set
      waterCost = Math.max(calculatedWaterCost, building.minimumWaterCost);
    }

    // Calculate electricity cost based on billing type
    let electricityCost = 0;
    if (room.elecBillingType === 'FLAT') {
      electricityCost = room.flatElecCost;
    } else if (room.elecBillingType === 'CUSTOM') {
      electricityCost = customElecCost !== undefined ? parseFloat(customElecCost) : 0;
    } else {
      electricityCost = elecUnits * building.electricityRate;
    }

    const rentCost = room.basePrice;

    // Calculate other fees and format note
    let additionalCost = otherCost ? parseFloat(otherCost) : 0;
    let formattedNote = '';
    let parsedFeeDetails = null;

    const bodyData = await request.json().catch(() => ({}));
    if (bodyData.otherFeeItems && Array.isArray(bodyData.otherFeeItems) && bodyData.otherFeeItems.length > 0) {
      parsedFeeDetails = JSON.stringify(bodyData.otherFeeItems);
      const calculatedOtherSum = bodyData.otherFeeItems.reduce((acc: number, item: any) => acc + (parseFloat(item.amount) || 0), 0);
      if (calculatedOtherSum > 0) {
        additionalCost = calculatedOtherSum;
      }
      formattedNote = bodyData.otherFeeItems
        .filter((item: any) => item.name && parseFloat(item.amount) > 0)
        .map((item: any) => `${item.name} (${parseFloat(item.amount).toLocaleString()} บ.)`)
        .join(', ');
    }

    if (bodyData.customOtherNote) {
      formattedNote = formattedNote ? `${formattedNote} - ${bodyData.customOtherNote}` : bodyData.customOtherNote;
    }

    if (replacementNotes.length > 0) {
      const repNote = replacementNotes.join(' | ');
      formattedNote = formattedNote ? `${formattedNote} - *** ${repNote}` : `*** ${repNote}`;
    }

    // Auto-calculate bookNo (e.g., A3) and invoiceNoStr (stay tenure month count)
    const bookNoVal = bodyData.bookNo || room.number;
    
    let tenureMonthCount = 1;
    if (tenant.startDate) {
      const startD = new Date(tenant.startDate);
      const startYear = startD.getFullYear();
      const startMonth = startD.getMonth() + 1;
      const monthDiff = (year - startYear) * 12 + (month - startMonth) + 1;
      tenureMonthCount = Math.max(1, monthDiff);
    }
    const invoiceNoVal = bodyData.invoiceNoStr || String(tenureMonthCount);

    const totalAmount = rentCost + waterCost + electricityCost + additionalCost;

    const invoice = await prisma.invoice.create({
      data: {
        roomId,
        tenantId: tenant.id,
        billingPeriod,
        previousWater: prevWater,
        currentWater: currentReading.waterValue,
        previousElec: prevElec,
        currentElec: currentReading.electricityValue,
        waterCost,
        electricityCost,
        rentCost,
        otherCost: additionalCost,
        bookNo: bookNoVal,
        invoiceNoStr: invoiceNoVal,
        otherFeeDetails: parsedFeeDetails,
        otherNote: formattedNote,
        totalAmount,
        status: 'UNPAID',
        dueDate: new Date(dueDate),
        waterRate: building.waterRate,
        electricityRate: building.electricityRate,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการออกใบแจ้งหนี้' },
      { status: 500 }
    );
  }
}
