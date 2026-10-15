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
