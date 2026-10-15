import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSqlDump } from '@/lib/backupSql';

export const dynamic = 'force-dynamic';

async function getAdminToken(request?: Request | NextRequest): Promise<string | null> {
  // 1. Try reading cookie via Next.js cookies()
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (token) return token;
  } catch {
    // cookies() may throw outside Next request context (e.g. in standalone tests)
  }

  // 2. Try NextRequest cookies
  if (request && 'cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const token = (request as any).cookies.get('admin_session')?.value;
    if (token) return token;
  }

  // 3. Fallback: Parse Cookie header directly
  if (request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    // 4. Fallback: Authorization Bearer header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
  }

  return null;
}

export async function GET(request: NextRequest | Request) {
  try {
    const token = await getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (payload.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น' },
        { status: 403 }
      );
    }


    const [
      property,
      admin,
      building,
      floor,
      room,
      tenant,
      booking,
      meterReading,
      invoice,
      payment,
      meterReplacement,
      buildingMonthlyUtility,
    ] = await Promise.all([
      prisma.property.findMany(),
      prisma.admin.findMany(),
      prisma.building.findMany(),
      prisma.floor.findMany(),
      prisma.room.findMany(),
      prisma.tenant.findMany(),
      prisma.booking.findMany(),
      prisma.meterReading.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
      prisma.meterReplacement.findMany(),
      prisma.buildingMonthlyUtility.findMany(),
    ]);

    const tablesData: Record<string, any[]> = {
      Property: property,
      Admin: admin,
      Building: building,
      Floor: floor,
      Room: room,
      Tenant: tenant,
      Booking: booking,
      MeterReading: meterReading,
      Invoice: invoice,
      Payment: payment,
      MeterReplacement: meterReplacement,
      BuildingMonthlyUtility: buildingMonthlyUtility,
    };

    const sqlDump = generateSqlDump(tablesData);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return new Response(sqlDump, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="smartapart_backup_${timestamp}.sql"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error during database backup export:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
