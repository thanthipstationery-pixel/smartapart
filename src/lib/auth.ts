import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret && process.env.NODE_ENV === 'production') {
    throw new Error('[FATAL] JWT_SECRET environment variable is missing in production.');
  }
  return new TextEncoder().encode(
    rawSecret || 'smartapart-dev-insecure-key-do-not-use-in-production'
  );
}

// Fail-fast at load time if running in production without JWT_SECRET
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET environment variable is missing in production.');
}

export interface JWTPayloadData {
  id?: string;
  username: string;
  name: string;
  role?: string;
}

export async function signJWT(payload: JWTPayloadData): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    id: payload.id || '',
    username: payload.username,
    name: payload.name,
    role: payload.role || 'OWNER',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayloadData | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      id: (payload.id as string) || undefined,
      username: payload.username as string,
      name: payload.name as string,
      role: (payload.role as string) || 'OWNER',
    };
  } catch {
    return null;
  }
}

export async function getAuthSession(
  request?: Request
): Promise<JWTPayloadData | null> {
  let token: string | undefined;

  // 1. Try reading cookie via Next.js cookies() from next/headers
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    token = cookieStore.get('admin_session')?.value;
  } catch {
    // Outside Next request context (e.g. standalone tests or scripts)
  }

  // 2. Try NextRequest cookies if request object has .cookies
  if (!token && request && 'cookies' in request && typeof (request as any).cookies?.get === 'function') {
    token = (request as any).cookies.get('admin_session')?.value;
  }

  // 3. Fallback: Parse Cookie header directly
  if (!token && request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // 4. Fallback: Authorization Bearer header
  if (!token && request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return null;
  }

  return await verifyJWT(token);
}

