import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use the patched wasm client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const buildingId = searchParams.get('buildingId');

    if (!year) {
      return NextResponse.json({ error: 'Year is required' }, { status: 400 });
    }

    const periods = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

    let invoiceWhere: any = {
      billingPeriod: { in: periods },
    };

    if (buildingId && buildingId !== 'ALL') {
      invoiceWhere.room = { floor: { buildingId } };
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true
              }
            }
          }
        }
      }
    });

    let utilityWhere: any = {
      period: { in: periods },
    };

    if (buildingId && buildingId !== 'ALL') {
      utilityWhere.buildingId = buildingId;
    }

    const utilities = await prisma.buildingMonthlyUtility.findMany({
      where: utilityWhere,
      include: { building: true }
    });

    // We also need all buildings to ensure we show them even if no data exists,
    // if buildingId === 'ALL'.
    let buildingsWhere: any = {};
    if (buildingId && buildingId !== 'ALL') {
      buildingsWhere.id = buildingId;
    }
    const allBuildings = await prisma.building.findMany({
      where: buildingsWhere,
      orderBy: { name: 'asc' }
    });

    const monthlyData = periods.map(period => {
      const periodInvoices = invoices.filter(inv => inv.billingPeriod === period);
      const periodUtilities = utilities.filter(u => u.period === period);

      const buildingsData = allBuildings.map(b => {
        const bInvoices = periodInvoices.filter(inv => inv.room.floor.buildingId === b.id);
        const bUtility = periodUtilities.find(u => u.buildingId === b.id);

        let occupiedRooms = bInvoices.length;
        let rentCost = 0;
        let waterCost = 0;
        let electricityCost = 0;
        let otherCost = 0;
        let totalAmount = 0;

        bInvoices.forEach(inv => {
          rentCost += inv.rentCost || 0;
          waterCost += inv.waterCost || 0;
          electricityCost += inv.electricityCost || 0;
          otherCost += inv.otherCost || 0;
          totalAmount += inv.totalAmount || 0;
        });

        let govWaterBill = bUtility?.waterBillTotal || 0;
        let govElecBill = bUtility?.elecBillTotal || 0;

        const netTotal = totalAmount - govWaterBill - govElecBill;

        return {
          buildingId: b.id,
          buildingName: b.name,
          occupiedRooms,
          rentCost,
          waterCost,
          electricityCost,
          otherCost,
          totalAmount,
          govWaterBill,
          govElecBill,
          netTotal
        };
      });

      // Calculate period total
      const total = buildingsData.reduce((acc, b) => {
        acc.occupiedRooms += b.occupiedRooms;
        acc.rentCost += b.rentCost;
        acc.waterCost += b.waterCost;
        acc.electricityCost += b.electricityCost;
        acc.otherCost += b.otherCost;
        acc.totalAmount += b.totalAmount;
        acc.govWaterBill += b.govWaterBill;
        acc.govElecBill += b.govElecBill;
        acc.netTotal += b.netTotal;
        return acc;
      }, {
        occupiedRooms: 0,
        rentCost: 0,
        waterCost: 0,
        electricityCost: 0,
        otherCost: 0,
        totalAmount: 0,
        govWaterBill: 0,
        govElecBill: 0,
        netTotal: 0
      });

      return {
        period,
        buildings: buildingsData,
        total
      };
    });

    return NextResponse.json(monthlyData);

  } catch (error) {
    console.error('Error fetching yearly report:', error);
    return NextResponse.json({ error: 'Failed to fetch yearly report' }, { status: 500 });
  }
}
