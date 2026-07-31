import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // YYYY-MM
    const [year, month] = period.split('-').map(Number);
    
    // Start of selected billing month (UTC)
    const startOfPeriod = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    // End of selected billing month (UTC)
    const endOfPeriod = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const buildings = await prisma.building.findMany({
      include: {
        floors: {
          orderBy: { number: 'asc' },
          include: {
            rooms: {
              orderBy: { number: 'asc' },
              include: {
                tenants: {
                  orderBy: { startDate: 'desc' },
                },
                bookings: {
                  where: { status: 'ACTIVE' },
                  orderBy: { createdAt: 'desc' },
                },
                invoices: {
                  where: { status: 'UNPAID' },
                  select: { id: true }
                }
              },
            },
          },
        },
      },
    });

    // Fetch all readings ordered by date desc to process in-memory
    const allReadings = await prisma.meterReading.findMany({
      orderBy: { readingDate: 'desc' },
    });

    // Fetch invoices to calculate revenue stats and meter fallbacks
    const allInvoices = await prisma.invoice.findMany({
      select: {
        status: true,
        totalAmount: true,
        billingPeriod: true,
        roomId: true,
        tenantId: true,
        previousWater: true,
        currentWater: true,
        previousElec: true,
        currentElec: true,
      }
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
    
    // Revenue calculations
    const currentMonthRevenue = allInvoices
      .filter((inv) => inv.status === 'PAID' && inv.billingPeriod === currentMonth)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const totalUnpaidAmount = allInvoices
      .filter((inv) => inv.status === 'UNPAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get unique rooms with unpaid invoices
    const unpaidRoomIds = new Set(
      allInvoices.filter((inv) => inv.status === 'UNPAID').map((inv) => inv.roomId)
    );
    const unpaidRoomsCount = unpaidRoomIds.size;

    let totalRooms = 0;
    let occupiedRooms = 0;
    let bookedRooms = 0;
    let vacantRooms = 0;
    let maintenanceRooms = 0;

    const formattedBuildings = buildings.map((building) => {
      let bTotal = 0;
      let bOccupied = 0;
      let bBooked = 0;
      let bVacant = 0;
      let bMaintenance = 0;

      const floors = building.floors.map((floor) => {
        const sortedRooms = [...floor.rooms].sort((a, b) =>
          a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
        );
        const rooms = sortedRooms.map((room) => {
          bTotal++;
          totalRooms++;

          // Find tenant active during this requested billing period
          const activeTenant = room.tenants.find((t: any) => {
            const tenantStart = new Date(t.startDate);
            const tenantEnd = t.endDate ? new Date(t.endDate) : null;
            return tenantStart <= endOfPeriod && (!tenantEnd || tenantEnd >= startOfPeriod);
          }) || null;

          // Determine historical room status for this period
          let historicalStatus = room.status;
          if (activeTenant) {
            historicalStatus = 'OCCUPIED';
          } else if (room.status === 'OCCUPIED') {
            // Room is occupied now, but was vacant in this period
            historicalStatus = 'VACANT';
          }

          if (historicalStatus === 'OCCUPIED') {
            bOccupied++;
            occupiedRooms++;
          } else if (historicalStatus === 'BOOKED') {
            bBooked++;
            bookedRooms++;
          } else if (historicalStatus === 'MAINTENANCE') {
            bMaintenance++;
            maintenanceRooms++;
          } else {
            bVacant++;
            vacantRooms++;
          }

          const activeBooking = room.bookings[0] || null;
          const hasUnpaidInvoice = room.invoices.length > 0;

          // Filter readings in-memory
          const roomReadings = allReadings.filter(r => r.roomId === room.id);
          const currentReading = roomReadings.find(r => {
            const d = new Date(r.readingDate);
            return d >= startOfPeriod && d <= endOfPeriod;
          });
          const prevReading = roomReadings.find(r => {
            const d = new Date(r.readingDate);
            return d < startOfPeriod;
          });

          // Check if an invoice exists for this room in this period (or tenant's check-in invoice)
          const periodInvoice = allInvoices.find(
            inv => inv.roomId === room.id && (inv.billingPeriod === period || (activeTenant && inv.tenantId === activeTenant.id))
          );

          let prevWater = prevReading ? prevReading.waterValue : 0.0;
          let prevElec = prevReading ? prevReading.electricityValue : 0.0;
          let currentWater = currentReading ? currentReading.waterValue : null;
          let currentElec = currentReading ? currentReading.electricityValue : null;

          // If no explicit MeterReading entry exists for this period, fallback to Invoice values or prevReading
          if (currentWater === null && periodInvoice && periodInvoice.currentWater !== undefined && periodInvoice.currentWater !== null) {
            currentWater = periodInvoice.currentWater;
            if (!prevReading) {
              prevWater = periodInvoice.previousWater;
            }
          } else if (currentWater === null && prevWater > 0) {
            currentWater = prevWater;
          }

          if (currentElec === null && periodInvoice && periodInvoice.currentElec !== undefined && periodInvoice.currentElec !== null) {
            currentElec = periodInvoice.currentElec;
            if (!prevReading) {
              prevElec = periodInvoice.previousElec;
            }
          } else if (currentElec === null && prevElec > 0) {
            currentElec = prevElec;
          }

          return {
            id: room.id,
            number: room.number,
            type: room.type,
            basePrice: room.basePrice,
            status: historicalStatus,
            waterBillingType: room.waterBillingType,
            flatWaterCost: room.flatWaterCost,
            elecBillingType: room.elecBillingType,
            flatElecCost: room.flatElecCost,
            hasUnpaidInvoice,
            prevWater,
            prevElec,
            currentWater,
            currentElec,
            isMeterRecorded: Boolean(currentReading || (periodInvoice && periodInvoice.billingPeriod === period)),
            activeTenant: activeTenant
              ? {
                  id: activeTenant.id,
                  name: activeTenant.name,
                  phone: activeTenant.phone,
                  idCard: activeTenant.idCard,
                  address: activeTenant.address,
                  email: activeTenant.email,
                  lineId: activeTenant.lineId,
                  workplace: activeTenant.workplace,
                  emergencyName: activeTenant.emergencyName,
                  emergencyRel: activeTenant.emergencyRel,
                  emergencyPhone: activeTenant.emergencyPhone,
                  securityDeposit: activeTenant.securityDeposit,
                  keycardCount: activeTenant.keycardCount,
                  keycardDeposit: activeTenant.keycardDeposit,
                  keycardCode: activeTenant.keycardCode,
                  note: activeTenant.note,
                  startDate: activeTenant.startDate,
                  noticeDate: activeTenant.noticeDate,
                  expectedCheckOutDate: activeTenant.expectedCheckOutDate,
                }
              : null,
            activeBooking: activeBooking
              ? {
                  id: activeBooking.id,
                  customerName: activeBooking.customerName,
                  customerPhone: activeBooking.customerPhone,
                  expectedCheckInDate: activeBooking.expectedCheckInDate,
                  depositAmount: activeBooking.depositAmount,
                }
              : null,
          };
        });

        return {
          id: floor.id,
          number: floor.number,
          rooms,
        };
      });

      return {
        id: building.id,
        name: building.name,
        waterRate: building.waterRate,
        electricityRate: building.electricityRate,
        minimumWaterCost: building.minimumWaterCost,
        lateFee: building.lateFee,
        defaultDueDay: building.defaultDueDay ?? 5,
        phone: building.phone,
        email: building.email,
        address: building.address,
        lineId: building.lineId,
        promptPayId: building.promptPayId,
        promptPayName: building.promptPayName,
        promptPayQrUrl: building.promptPayQrUrl,
        stats: {
          total: bTotal,
          occupied: bOccupied,
          booked: bBooked,
          vacant: bVacant,
          maintenance: bMaintenance,
          occupancyRate: bTotal > 0 ? Math.round((bOccupied / bTotal) * 100) : 0,
        },
        floors,
      };
    });

    return NextResponse.json({
      buildings: formattedBuildings,
      stats: {
        totalRooms,
        occupiedRooms,
        bookedRooms,
        vacantRooms,
        maintenanceRooms,
        unpaidRoomsCount,
        currentMonthRevenue,
        totalUnpaidAmount,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching buildings stats:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update building utility rates & PromptPay settings
export async function PUT(request: Request) {
  try {
    const { id, name, waterRate, electricityRate, minimumWaterCost, lateFee, defaultDueDay, phone, email, address, lineId, promptPayId, promptPayName, promptPayQrUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน (ไม่พบ ID อาคาร)' }, { status: 400 });
    }

    const updated = await prisma.building.update({
      where: { id },
      data: {
        name: name || undefined,
        waterRate: waterRate !== undefined ? parseFloat(waterRate) : undefined,
        electricityRate: electricityRate !== undefined ? parseFloat(electricityRate) : undefined,
        minimumWaterCost: minimumWaterCost !== undefined ? parseFloat(minimumWaterCost) : undefined,
        lateFee: lateFee !== undefined ? parseFloat(lateFee) : undefined,
        defaultDueDay: defaultDueDay !== undefined ? parseInt(defaultDueDay) : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        lineId: lineId !== undefined ? lineId : undefined,
        promptPayId: promptPayId !== undefined ? promptPayId : undefined,
        promptPayName: promptPayName !== undefined ? promptPayName : undefined,
        promptPayQrUrl: promptPayQrUrl !== undefined ? promptPayQrUrl : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating building rates:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลอาคาร' },
      { status: 500 }
    );
  }
}
