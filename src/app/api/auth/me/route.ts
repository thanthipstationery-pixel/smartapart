import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export async function GET(request?: Request) {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('admin_session')?.value;
  } catch {
    // Fallback if cookies() is invoked outside request context
  }

  if (!token && request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    token = match ? match[1] : undefined;
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
  }

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role || 'OWNER',
    },
  });
}
