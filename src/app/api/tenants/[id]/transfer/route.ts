import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      targetRoomId,
      sourceWaterMeter,
      sourceElecMeter,
      targetWaterMeter,
      targetElecMeter,
      transferDate,
      note,
    } = await request.json();

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

    const result = await prisma.$transaction(async (tx) => {
      const dateObj = transferDate ? new Date(transferDate) : new Date();

      // 1. Record final meter reading for source room
      if (sourceWaterMeter !== undefined && sourceWaterMeter !== '' || sourceElecMeter !== undefined && sourceElecMeter !== '') {
        await tx.meterReading.create({
          data: {
            roomId: tenant.roomId,
            waterValue: sourceWaterMeter ? parseFloat(sourceWaterMeter) : 0,
            electricityValue: sourceElecMeter ? parseFloat(sourceElecMeter) : 0,
            readingDate: dateObj,
            recordedBy: 'ROOM_TRANSFER_OUT',
          },
        });
      }

      // 2. Record starting meter reading for target room
      if (targetWaterMeter !== undefined && targetWaterMeter !== '' || targetElecMeter !== undefined && targetElecMeter !== '') {
        await tx.meterReading.create({
          data: {
            roomId: targetRoomId,
            waterValue: targetWaterMeter ? parseFloat(targetWaterMeter) : 0,
            electricityValue: targetElecMeter ? parseFloat(targetElecMeter) : 0,
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

      // 5. Transfer tenant to target room & update note
      const oldRoomNumber = tenant.room.number;
      const transferLog = `[ย้ายห้องจาก ${oldRoomNumber} ไป ${targetRoom.number} เมื่อ ${dateObj.toISOString().split('T')[0]}] ${note || ''}`;
      const updatedNote = tenant.note ? `${tenant.note}\n${transferLog}` : transferLog;

      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: {
          roomId: targetRoomId,
          note: updatedNote,
        },
      });

      return updatedTenant;
    });

    return NextResponse.json({ success: true, tenant: result });
  } catch (error) {
    console.error('Error transferring room:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการย้ายห้องพัก' }, { status: 500 });
  }
}
