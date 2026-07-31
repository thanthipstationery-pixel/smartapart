import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const admin = await prisma.admin.findFirst({
      where: { username: cleanUsername },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(cleanPassword, admin.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const token = await signJWT({
      username: admin.username,
      name: admin.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: admin.username,
        name: admin.name,
      },
    });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: false, // Must be false in dev (HTTP), true only in production (HTTPS)
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดจากทางเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
