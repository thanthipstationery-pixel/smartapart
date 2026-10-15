import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const readings = await prisma.meterReading.findMany({
      where: roomId ? { roomId } : undefined,
      orderBy: { readingDate: 'desc' },
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
      take: 50,
    });

    return NextResponse.json(readings);
  } catch (error: any) {
    console.error('Error fetching meter readings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลมิเตอร์' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (session?.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์บันทึกมิเตอร์' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const { roomId, waterValue, electricityValue, readingDate, allowDownwardCorrection } = body || {};

    if (!roomId) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องระบุห้องพัก)' },
        { status: 400 }
      );
    }


    const date = readingDate ? new Date(readingDate) : new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    // Start of this billing month
    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    // End of this billing month
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

    // Find if a reading already exists for this room in the same billing month
    const existingReading = await prisma.meterReading.findFirst({
      where: {
        roomId,
        readingDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // The true previous reading is the latest reading before startOfMonth
    const previousReading = await prisma.meterReading.findFirst({
      where: {
        roomId,
        readingDate: {
          lt: startOfMonth,
        },
      },
      orderBy: { readingDate: 'desc' },
    });

    // Resolve water value
    let water: number;
    if (waterValue !== undefined && waterValue !== null && waterValue !== '') {
      water = parseFloat(waterValue);
      if (isNaN(water)) {
        return NextResponse.json({ error: 'ค่ามิเตอร์น้ำต้องเป็นตัวเลข' }, { status: 400 });
      }
    } else {
      if (existingReading) {
        water = existingReading.waterValue;
      } else if (previousReading) {
        water = previousReading.waterValue;
      } else {
        water = 0.0;
      }
    }

    // Resolve electricity value
    let elec: number;
    if (electricityValue !== undefined && electricityValue !== null && electricityValue !== '') {
      elec = parseFloat(electricityValue);
      if (isNaN(elec)) {
        return NextResponse.json({ error: 'ค่ามิเตอร์ไฟต้องเป็นตัวเลข' }, { status: 400 });
      }
    } else {
      if (existingReading) {
        elec = existingReading.electricityValue;
      } else if (previousReading) {
        elec = previousReading.electricityValue;
      } else {
        elec = 0.0;
      }
    }

    // Previous month validation
    if (previousReading) {
      if (waterValue !== undefined && waterValue !== null && waterValue !== '') {
        if (water < previousReading.waterValue) {
          return NextResponse.json(
            { error: `เลขมิเตอร์น้ำ (${water}) ต้องไม่น้อยกว่ามิเตอร์เดือนก่อนหน้า (${previousReading.waterValue})` },
            { status: 400 }
          );
        }
      }
      if (electricityValue !== undefined && electricityValue !== null && electricityValue !== '') {
        if (elec < previousReading.electricityValue) {
          return NextResponse.json(
            { error: `เลขมิเตอร์ไฟ (${elec}) ต้องไม่น้อยกว่ามิเตอร์เดือนก่อนหน้า (${previousReading.electricityValue})` },
            { status: 400 }
          );
        }
      }
    }

    const operatorName = session?.name || session?.username || 'ระบบ';
    let savedReading;
    if (existingReading) {
      // Update existing reading for this month (correcting a mistake)
      savedReading = await prisma.meterReading.update({
        where: { id: existingReading.id },
        data: {
          waterValue: water,
          electricityValue: elec,
          readingDate: date,
          recordedBy: operatorName,
        },
      });
    } else {
      // Create new reading
      savedReading = await prisma.meterReading.create({
        data: {
          roomId,
          waterValue: water,
          electricityValue: elec,
          readingDate: date,
          recordedBy: operatorName,
        },
      });
    }


    return NextResponse.json(savedReading);
  } catch (error: any) {
    console.error('Error saving meter reading:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกค่ามิเตอร์' },
      { status: 500 }
    );
  }
}
