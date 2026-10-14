import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseAndSanitizeSql } from '@/lib/backupSql';

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

export async function POST(request: NextRequest | Request) {
  try {
    const token = await getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let sqlContent: string | null = null;

    if (contentType.includes('application/json')) {
      try {
        const body = (await request.json()) as any;
        if (body && typeof body.sqlContent === 'string') {
          sqlContent = body.sqlContent;
        }
      } catch {
        return NextResponse.json(
          { error: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง' },
          { status: 400 }
        );
      }
    } else if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const sqlParam = formData.get('sqlContent');

        if (file && typeof file === 'object' && typeof (file as Blob).text === 'function') {
          sqlContent = await (file as Blob).text();
        } else if (typeof file === 'string') {
          sqlContent = file;
        } else if (typeof sqlParam === 'string') {
          sqlContent = sqlParam;
        }
      } catch {
        return NextResponse.json(
          { error: 'ไม่สามารถอ่านข้อมูล FormData หรือไฟล์ที่อัปโหลดได้' },
          { status: 400 }
        );
      }
    } else {
      // Fallback for raw text payloads
      try {
        const raw = await request.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.sqlContent === 'string') {
              sqlContent = parsed.sqlContent;
            } else {
              sqlContent = raw;
            }
          } catch {
            sqlContent = raw;
          }
        }
      } catch {
        // Ignore read error
      }
    }

    if (!sqlContent || typeof sqlContent !== 'string' || !sqlContent.trim()) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูล SQL หรืออัปโหลดไฟล์สำรองข้อมูล' },
        { status: 400 }
      );
    }

    // Validate SQL statements against whitelist
    const sanitizeResult = parseAndSanitizeSql(sqlContent);
    if (!sanitizeResult.valid) {
      return NextResponse.json(
        { error: sanitizeResult.error },
        { status: 400 }
      );
    }

    if (sanitizeResult.statements.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบคำสั่ง SQL ที่สามารถดำเนินการได้ในไฟล์สำรองข้อมูล' },
        { status: 400 }
      );
    }

    // Execute atomic restore transaction
    try {
      await prisma.$transaction(async (tx) => {
        for (const stmt of sanitizeResult.statements) {
          await tx.$executeRawUnsafe(stmt);
        }
      });

      return NextResponse.json({
        success: true,
        message: 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว',
        statementsExecuted: sanitizeResult.statements.length,
      });
    } catch (txError: any) {
      console.error('Error during database restore transaction execution:', txError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล: ' + (txError?.message || String(txError)) },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error during database backup restore:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
