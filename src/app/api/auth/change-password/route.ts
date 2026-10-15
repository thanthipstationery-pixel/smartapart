import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest | Request) {
  try {
    // 1. Authenticate session
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('admin_session')?.value;
    } catch {
      // Fallback if cookies() is invoked outside request context
    }

    if (!token && 'cookies' in request && typeof (request as any).cookies?.get === 'function') {
      token = (request as any).cookies.get('admin_session')?.value;
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/admin_session=([^;]+)/);
      token = match ? match[1] : undefined;
    }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' },
        { status: 401 }
      );
    }

    const session = await verifyJWT(token);
    if (!session) {
      return NextResponse.json(
        { error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 }
      );
    }

    // 2. Parse & Validate body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' },
        { status: 400 }
      );
    }

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลรหัสผ่านไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' },
        { status: 400 }
      );
    }

    // 3. Fetch admin from database
    const admin = session.id
      ? await prisma.admin.findUnique({ where: { id: session.id } })
      : await prisma.admin.findUnique({ where: { username: session.username } });

    if (!admin) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' },
        { status: 404 }
      );
    }

    if (admin.isActive === false || (admin as any).isActive === 0) {
      return NextResponse.json(
        { error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 403 }
      );
    }

    // 4. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 5. Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Change Password Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดจากทางเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
