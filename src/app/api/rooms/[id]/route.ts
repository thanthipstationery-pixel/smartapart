import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        floor: {
          include: {
            building: true,
          },
        },
        tenants: {
          orderBy: { startDate: 'desc' },
        },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 12,
        },
        invoices: {
          orderBy: { billingPeriod: 'desc' },
          take: 12,
          include: {
            payments: true
          }
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, basePrice, type, number, waterBillingType, flatWaterCost, elecBillingType, flatElecCost } = await request.json();

    const currentRoom = await prisma.room.findUnique({
      where: { id },
      include: { tenants: { where: { endDate: null } } },
    });

    if (!currentRoom) {
      return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    }

    const activeTenant = currentRoom.tenants[0];
    if (activeTenant && status === 'VACANT') {
      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนสถานะเป็นห้องว่างได้ เนื่องจากมีผู้เช่าอยู่ กรุณาทำการย้ายออก (Check-out) ผู้เช่าก่อน' },
        { status: 400 }
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        status: status || currentRoom.status,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : currentRoom.basePrice,
        type: type || currentRoom.type,
        number: number || currentRoom.number,
        waterBillingType: waterBillingType || currentRoom.waterBillingType,
        flatWaterCost: flatWaterCost !== undefined ? parseFloat(flatWaterCost) : currentRoom.flatWaterCost,
        elecBillingType: elecBillingType || currentRoom.elecBillingType,
        flatElecCost: flatElecCost !== undefined ? parseFloat(flatElecCost) : currentRoom.flatElecCost,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้องพัก' },
      { status: 500 }
    );
  }
}
