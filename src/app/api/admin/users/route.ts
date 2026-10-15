import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface OwnerSession {
  id: string;
  username: string;
  name: string;
  role: string;
}

export type AuthResult =
  | { success: true; session: OwnerSession }
  | { success: false; response: NextResponse };

export async function getAdminToken(request?: Request | NextRequest): Promise<string | null> {
  // 1. Try reading cookie via Next.js cookies()
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (token) return token;
  } catch {
    // Outside Next request context (e.g. standalone tests)
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

export async function authenticateOwner(request: Request | NextRequest): Promise<AuthResult> {
  const token = await getAdminToken(request);
  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: สิทธิ์การเข้าถึงถูกปฏิเสธ (ต้องเป็นระดับ OWNER เท่านั้น)' },
        { status: 403 }
      ),
    };
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'OWNER') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: สิทธิ์การเข้าถึงถูกปฏิเสธ (ต้องเป็นระดับ OWNER เท่านั้น)' },
        { status: 403 }
      ),
    };
  }

  let userId = payload.id;
  if (!userId) {
    const admin = await prisma.admin.findUnique({
      where: { username: payload.username },
      select: { id: true, isActive: true, role: true },
    });
    if (!admin || !admin.isActive || admin.role !== 'OWNER') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden: บัญชีผู้ใช้นี้ถูกระงับการใช้งาน ไม่มีในระบบ หรือไม่มีสิทธิ์ OWNER' },
          { status: 403 }
        ),
      };
    }
    userId = admin.id;
  } else {
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });
    if (!admin || !admin.isActive || admin.role !== 'OWNER') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden: บัญชีผู้ใช้นี้ถูกระงับการใช้งาน ไม่มีในระบบ หรือไม่มีสิทธิ์ OWNER' },
          { status: 403 }
        ),
      };
    }
  }


  return {
    success: true,
    session: {
      id: userId,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    },
  };
}

export async function GET(request: Request | NextRequest) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth.success) {
      return auth.response;
    }

    const users = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth.success) {
      return auth.response;
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { username, password, name, role, phone } = body || {};

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (username, password, name, role)' },
        { status: 400 }
      );
    }

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof name !== 'string' ||
      typeof role !== 'string'
    ) {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const validRoles = ['OWNER', 'STAFF', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'ระดับสิทธิ์ (Role) ไม่ถูกต้อง ต้องเป็น OWNER, STAFF หรือ VIEWER' },
        { status: 400 }
      );
    }

    // Check unique username
    const existing = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.admin.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: name.trim(),
        role,
        phone: phone ? String(phone).trim() : null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
