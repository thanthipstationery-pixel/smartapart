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

async function getAdminToken(request?: Request | NextRequest): Promise<string | null> {
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

async function authenticateOwner(request: Request | NextRequest): Promise<AuthResult> {
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

export async function PUT(
  request: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth.success) {
      return auth.response;
    }
    const session = auth.session;

    const resolvedParams = params ? await params : undefined;
    const targetId = resolvedParams?.id;
    if (!targetId) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสผู้ใช้งาน' },
        { status: 400 }
      );
    }

    const target = await prisma.admin.findUnique({
      where: { id: targetId },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้งานที่ระบุ' },
        { status: 404 }
      );
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

    const { name, role, phone, isActive, newPassword } = body || {};

    // Validate role if provided
    if (role !== undefined) {
      const validRoles = ['OWNER', 'STAFF', 'VIEWER'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'ระดับสิทธิ์ (Role) ไม่ถูกต้อง ต้องเป็น OWNER, STAFF หรือ VIEWER' },
          { status: 400 }
        );
      }
    }

    // Invariant: Acting on own account
    const isSelf = target.id === session.id || (session.username && target.username.toLowerCase() === session.username.toLowerCase());
    if (isSelf) {
      if (role !== undefined && role !== 'OWNER') {
        return NextResponse.json(
          { error: 'ไม่สามารถลดสิทธิ์บัญชีของตนเองได้' },
          { status: 400 }
        );
      }
      if (isActive !== undefined && (isActive === false || isActive === 0 || isActive === 'false')) {
        return NextResponse.json(
          { error: 'ไม่สามารถระงับการใช้งานบัญชีของตนเองได้' },
          { status: 400 }
        );
      }
    }

    // Invariant: If target user is OWNER and being demoted to non-OWNER or deactivated
    const isDemotingOwner = target.role === 'OWNER' && role !== undefined && role !== 'OWNER';
    const isDeactivatingOwner = target.role === 'OWNER' && isActive !== undefined && (isActive === false || isActive === 0 || isActive === 'false');

    if (isDemotingOwner || isDeactivatingOwner) {
      if (target.isActive) {
        const activeOwnersCount = await prisma.admin.count({
          where: { role: 'OWNER', isActive: true },
        });
        if (activeOwnersCount <= 1) {
          return NextResponse.json(
            { error: 'ต้องมีผู้ดูแลระดับ OWNER ที่ใช้งานได้อย่างน้อย 1 บัญชี' },
            { status: 400 }
          );
        }
      }
    }

    // Validate newPassword if provided
    let hashedPassword: string | undefined;
    if (newPassword !== undefined && newPassword !== null && newPassword !== '') {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'ชื่อผู้ใช้งานต้องไม่เป็นค่าว่าง' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (role !== undefined) {
      updateData.role = role;
    }
    if (phone !== undefined) {
      updateData.phone = phone ? String(phone).trim() : null;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }
    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.admin.update({
      where: { id: targetId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
      ...updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth.success) {
      return auth.response;
    }
    const session = auth.session;

    const resolvedParams = params ? await params : undefined;
    const targetId = resolvedParams?.id;
    if (!targetId) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสผู้ใช้งาน' },
        { status: 400 }
      );
    }

    const target = await prisma.admin.findUnique({
      where: { id: targetId },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้งานที่ระบุ' },
        { status: 404 }
      );
    }

    // Invariant 1: No last-owner deletion
    if (target.role === 'OWNER') {
      const totalOwners = await prisma.admin.count({
        where: { role: 'OWNER' },
      });
      if (totalOwners <= 1) {
        return NextResponse.json(
          { error: 'ไม่สามารถลบ OWNER คนสุดท้ายของระบบได้' },
          { status: 400 }
        );
      }
    }

    // Invariant 2: No self-deletion
    const isSelf = target.id === session.id || (session.username && target.username.toLowerCase() === session.username.toLowerCase());
    if (isSelf) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบบัญชีของตนเองได้' },
        { status: 400 }
      );
    }

    await prisma.admin.delete({
      where: { id: targetId },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
