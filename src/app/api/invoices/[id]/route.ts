import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งหนี้ที่ระบุ' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบแจ้งหนี้' },
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
    const body = await request.json();

    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งหนี้ที่ระบุ' }, { status: 404 });
    }

    const {
      previousWater,
      currentWater,
      previousElec,
      currentElec,
      waterRate,
      electricityRate,
      waterCost,
      electricityCost,
      rentCost,
      otherCost,
      otherFeeDetails,
      otherNote,
      totalAmount,
      dueDate,
      status,
      bookNo,
      invoiceNoStr,
    } = body;

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        previousWater: previousWater !== undefined ? parseFloat(previousWater) : existing.previousWater,
        currentWater: currentWater !== undefined ? parseFloat(currentWater) : existing.currentWater,
        previousElec: previousElec !== undefined ? parseFloat(previousElec) : existing.previousElec,
        currentElec: currentElec !== undefined ? parseFloat(currentElec) : existing.currentElec,
        waterRate: waterRate !== undefined ? parseFloat(waterRate) : existing.waterRate,
        electricityRate: electricityRate !== undefined ? parseFloat(electricityRate) : existing.electricityRate,
        waterCost: waterCost !== undefined ? parseFloat(waterCost) : existing.waterCost,
        electricityCost: electricityCost !== undefined ? parseFloat(electricityCost) : existing.electricityCost,
        rentCost: rentCost !== undefined ? parseFloat(rentCost) : existing.rentCost,
        otherCost: otherCost !== undefined ? parseFloat(otherCost) : existing.otherCost,
        otherFeeDetails: otherFeeDetails !== undefined ? (typeof otherFeeDetails === 'string' ? otherFeeDetails : JSON.stringify(otherFeeDetails)) : existing.otherFeeDetails,
        otherNote: otherNote !== undefined ? otherNote : existing.otherNote,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : existing.totalAmount,
        status: status || existing.status,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        bookNo: bookNo !== undefined ? bookNo : existing.bookNo,
        invoiceNoStr: invoiceNoStr !== undefined ? invoiceNoStr : existing.invoiceNoStr,
      },
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
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขใบแจ้งหนี้' },
      { status: 500 }
    );
  }
}
