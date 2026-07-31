import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/invoices/bulk
// Body: { billingPeriod, dueDate, rooms: [{ roomId, otherFeeItems?, customOtherNote? }] }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { billingPeriod, dueDate, rooms } = body;

    if (!billingPeriod || !dueDate || !Array.isArray(rooms) || rooms.length === 0) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุรอบบิล, วันที่ครบกำหนด และรายการห้อง)' },
        { status: 400 }
      );
    }

    const [year, month] = billingPeriod.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const results: { roomId: string; roomNumber: string; success: boolean; error?: string; invoiceId?: string }[] = [];

    for (const roomEntry of rooms) {
      const { roomId, otherFeeItems, customOtherNote } = roomEntry;

      try {
        // Check if invoice already exists for this room and period
        const existing = await prisma.invoice.findFirst({
          where: { roomId, billingPeriod },
        });

        if (existing) {
          const room = await prisma.room.findUnique({ where: { id: roomId }, select: { number: true } });
          results.push({ roomId, roomNumber: room?.number || roomId, success: false, error: 'มีใบแจ้งหนี้ในรอบนี้แล้ว' });
          continue;
        }

        // Fetch room with tenant and building
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            floor: { include: { building: true } },
            tenants: { where: { endDate: null } },
          },
        });

        if (!room) {
          results.push({ roomId, roomNumber: roomId, success: false, error: 'ไม่พบห้อง' });
          continue;
        }

        const tenant = room.tenants[0];
        if (!tenant) {
          results.push({ roomId, roomNumber: room.number, success: false, error: 'ไม่มีผู้เช่า' });
          continue;
        }

        // Find current meter reading
        const currentReading = await prisma.meterReading.findFirst({
          where: {
            roomId,
            readingDate: { gte: startOfMonth, lte: endOfMonth },
          },
          orderBy: { readingDate: 'desc' },
        });

        if (!currentReading) {
          results.push({ roomId, roomNumber: room.number, success: false, error: 'ยังไม่มีมิเตอร์เดือนนี้' });
          continue;
        }

        // Find previous meter reading
        const previousReading = await prisma.meterReading.findFirst({
          where: {
            roomId,
            readingDate: { lt: currentReading.readingDate },
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

        // Water cost
        let waterCost = 0;
        if (room.waterBillingType === 'FLAT') {
          waterCost = room.flatWaterCost;
        } else if (room.waterBillingType === 'CUSTOM') {
          waterCost = 0;
        } else {
          waterCost = Math.max(waterUnits * building.waterRate, building.minimumWaterCost);
        }

        // Electricity cost
        let electricityCost = 0;
        if (room.elecBillingType === 'FLAT') {
          electricityCost = room.flatElecCost;
        } else if (room.elecBillingType === 'CUSTOM') {
          electricityCost = 0;
        } else {
          electricityCost = elecUnits * building.electricityRate;
        }

        const rentCost = room.basePrice;

        // Other fees
        let additionalCost = 0;
        let parsedFeeDetails: string | null = null;
        let formattedNote = '';

        if (Array.isArray(otherFeeItems) && otherFeeItems.length > 0) {
          const validItems = otherFeeItems.filter((item: any) => item.name && parseFloat(item.amount) > 0);
          if (validItems.length > 0) {
            parsedFeeDetails = JSON.stringify(validItems);
            additionalCost = validItems.reduce((acc: number, item: any) => acc + (parseFloat(item.amount) || 0), 0);
            formattedNote = validItems
              .map((item: any) => `${item.name} (${parseFloat(item.amount).toLocaleString()} บ.)`)
              .join(', ');
          }
        }

        if (customOtherNote) {
          formattedNote = formattedNote ? `${formattedNote} - ${customOtherNote}` : customOtherNote;
        }

        if (replacementNotes.length > 0) {
          const repNote = replacementNotes.join(' | ');
          formattedNote = formattedNote ? `${formattedNote} - *** ${repNote}` : `*** ${repNote}`;
        }

        // Book/invoice number
        const bookNoVal = room.number;
        let tenureMonthCount = 1;
        if (tenant.startDate) {
          const startD = new Date(tenant.startDate);
          const monthDiff = (year - startD.getFullYear()) * 12 + (month - (startD.getMonth() + 1)) + 1;
          tenureMonthCount = Math.max(1, monthDiff);
        }
        const invoiceNoVal = String(tenureMonthCount);
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

        results.push({ roomId, roomNumber: room.number, success: true, invoiceId: invoice.id });
      } catch (err: any) {
        results.push({ roomId, roomNumber: roomId, success: false, error: err.message || 'เกิดข้อผิดพลาด' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({ results, successCount, failCount });
  } catch (error) {
    console.error('Bulk invoice error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการออกบิลพร้อมกัน' }, { status: 500 });
  }
}

// GET /api/invoices/bulk?billingPeriod=YYYY-MM
// Returns all occupied rooms with their meter status and invoice status for the period
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const billingPeriod = searchParams.get('billingPeriod');

    if (!billingPeriod) {
      return NextResponse.json({ error: 'ต้องระบุรอบบิล' }, { status: 400 });
    }

    const [year, month] = billingPeriod.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get all rooms with active tenants
    const rooms = await prisma.room.findMany({
      where: {
        tenants: { some: { endDate: null } },
      },
      include: {
        floor: { include: { building: true } },
        tenants: {
          where: { endDate: null },
          take: 1,
        },
      },
    });

    // Sort by building name first, then room number naturally (1/1, 1/2, A1, A2...)
    rooms.sort((a, b) => {
      const bComp = a.floor.building.name.localeCompare(b.floor.building.name, 'th');
      if (bComp !== 0) return bComp;
      return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Get existing invoices for this period
    const existingInvoices = await prisma.invoice.findMany({
      where: { billingPeriod },
      select: {
        roomId: true,
        id: true,
        totalAmount: true,
        currentWater: true,
        currentElec: true
      },
    });
    const invoiceMap = new Map(existingInvoices.map(inv => [inv.roomId, inv]));

    // Get meter readings for this period
    const meterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: { gte: startOfMonth, lte: endOfMonth },
        roomId: { in: rooms.map(r => r.id) },
      },
      select: { roomId: true, waterValue: true, electricityValue: true },
    });
    const meterMap = new Map(meterReadings.map(m => [m.roomId, m]));

    const roomData = rooms.map(room => {
      const tenant = room.tenants[0];
      const existingInvoice = invoiceMap.get(room.id);
      const meter = meterMap.get(room.id);

      // If invoice exists, it already has the values. Otherwise, look at the meter reading entry.
      const hasMeter = !!existingInvoice || meterMap.has(room.id);
      const meterWater = existingInvoice ? existingInvoice.currentWater : (meter?.waterValue ?? null);
      const meterElec = existingInvoice ? existingInvoice.currentElec : (meter?.electricityValue ?? null);

      return {
        roomId: room.id,
        roomNumber: room.number,
        buildingId: room.floor.building.id,
        buildingName: room.floor.building.name,
        tenantName: tenant?.name || '',
        basePrice: room.basePrice,
        hasMeter,
        meterWater,
        meterElec,
        hasInvoice: !!existingInvoice,
        existingInvoiceId: existingInvoice?.id || null,
        existingInvoiceTotal: existingInvoice?.totalAmount || null,
      };
    });

    // 3-Level Sort: Building Name -> Status Priority (Ready: 1, Waiting Meter: 2, Billed: 3) -> Room Number
    roomData.sort((a, b) => {
      const bComp = a.buildingName.localeCompare(b.buildingName, 'th');
      if (bComp !== 0) return bComp;

      const getStatusPriority = (r: typeof a) => {
        if (!r.hasInvoice && r.hasMeter) return 1; // 🟢 Ready to bill
        if (!r.hasInvoice && !r.hasMeter) return 2; // 🟡 Waiting for meter
        return 3; // 🔵 Already billed
      };

      const pDiff = getStatusPriority(a) - getStatusPriority(b);
      if (pDiff !== 0) return pDiff;

      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
    });

    return NextResponse.json(roomData);
  } catch (error) {
    console.error('Bulk invoice GET error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
