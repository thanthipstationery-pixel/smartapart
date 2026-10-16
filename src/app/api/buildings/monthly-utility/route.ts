import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const period = searchParams.get('period');

    if (!buildingId && !period) {
      return NextResponse.json({ error: 'Missing buildingId or period' }, { status: 400 });
    }

    if (!buildingId && period) {
      const records = await prisma.buildingMonthlyUtility.findMany({
        where: { period },
      });
      return NextResponse.json(records);
    }

    if (!buildingId) {
      return NextResponse.json({ error: 'Missing buildingId' }, { status: 400 });
    }

    if (period) {
      const record = await prisma.buildingMonthlyUtility.findUnique({
        where: {
          buildingId_period: {
            buildingId,
            period,
          },
        },
      });
      return NextResponse.json(record);
    } else {
      const records = await prisma.buildingMonthlyUtility.findMany({
        where: { buildingId },
        orderBy: { period: 'desc' },
      });
      return NextResponse.json(records);
    }
  } catch (error) {
    console.error('Error fetching monthly utility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์บันทึกหรือแก้ไขข้อมูลบิลส่วนกลาง' },
        { status: 403 }
      );
    }

    const body: any = await request.json();
    const {
      buildingId,
      period,
      waterBillTotal,
      waterUnitsTotal,
      waterRate,
      elecBillTotal,
      elecUnitsTotal,
      elecRate,
    } = body;

    if (!buildingId || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalWaterRate = Number(waterRate);
    if (isNaN(finalWaterRate) || finalWaterRate === 0) {
      finalWaterRate = Number(waterUnitsTotal) > 0 ? Number(waterBillTotal) / Number(waterUnitsTotal) : 0;
    }
    
    let finalElecRate = Number(elecRate);
    if (isNaN(finalElecRate) || finalElecRate === 0) {
      finalElecRate = Number(elecUnitsTotal) > 0 ? Number(elecBillTotal) / Number(elecUnitsTotal) : 0;
    }

    const record = await prisma.buildingMonthlyUtility.upsert({
      where: {
        buildingId_period: {
          buildingId,
          period,
        },
      },
      update: {
        waterBillTotal: Number(waterBillTotal),
        waterUnitsTotal: Number(waterUnitsTotal),
        waterRate: finalWaterRate,
        elecBillTotal: Number(elecBillTotal),
        elecUnitsTotal: Number(elecUnitsTotal),
        elecRate: finalElecRate,
      },
      create: {
        building: { connect: { id: buildingId } },
        period,
        waterBillTotal: Number(waterBillTotal),
        waterUnitsTotal: Number(waterUnitsTotal),
        waterRate: finalWaterRate,
        elecBillTotal: Number(elecBillTotal),
        elecUnitsTotal: Number(elecUnitsTotal),
        elecRate: finalElecRate,
      },
    });
    // Auto-update UNPAID invoices if dynamic utility rate is enabled
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (building?.useDynamicUtilityRate) {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          billingPeriod: period,
          status: 'UNPAID',
          room: { floor: { buildingId } },
        },
        include: { room: true },
      });

      for (const invoice of unpaidInvoices) {
        // Calculate units safely using meter replacement logic
        const replacement = await prisma.meterReplacement.findFirst({
          where: { roomId: invoice.roomId, billingPeriod: period },
          orderBy: { createdAt: 'desc' },
        });

        let waterUnits = Math.max(0, invoice.currentWater - invoice.previousWater);
        let elecUnits = Math.max(0, invoice.currentElec - invoice.previousElec);

        if (replacement) {
          if ((replacement.meterType === 'WATER' || replacement.meterType === 'BOTH') && replacement.oldWaterFinal !== null) {
            const oldWUnits = Math.max(0, replacement.oldWaterFinal - invoice.previousWater);
            const newWUnits = Math.max(0, invoice.currentWater - (replacement.newWaterStart ?? 0));
            waterUnits = oldWUnits + newWUnits;
          }
          if ((replacement.meterType === 'ELEC' || replacement.meterType === 'BOTH') && replacement.oldElecFinal !== null) {
            const oldEUnits = Math.max(0, replacement.oldElecFinal - invoice.previousElec);
            const newEUnits = Math.max(0, invoice.currentElec - (replacement.newElecStart ?? 0));
            elecUnits = oldEUnits + newEUnits;
          }
        }

        // Recalculate costs
        let waterCost = 0;
        if (invoice.room.waterBillingType === 'FLAT') {
          waterCost = invoice.room.flatWaterCost;
        } else if (invoice.room.waterBillingType === 'CUSTOM') {
          waterCost = invoice.waterCost; // keep original if custom
        } else {
          waterCost = Math.max(waterUnits * finalWaterRate, building.minimumWaterCost);
        }

        let electricityCost = 0;
        if (invoice.room.elecBillingType === 'FLAT') {
          electricityCost = invoice.room.flatElecCost;
        } else if (invoice.room.elecBillingType === 'CUSTOM') {
          electricityCost = invoice.electricityCost; // keep original if custom
        } else {
          electricityCost = elecUnits * finalElecRate;
        }

        const totalAmount = invoice.rentCost + waterCost + electricityCost + invoice.otherCost;

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            waterCost,
            electricityCost,
            waterRate: finalWaterRate,
            electricityRate: finalElecRate,
            totalAmount,
          },
        });
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error saving monthly utility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
