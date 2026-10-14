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

export async function signJWT(payload: { username: string; name: string }) {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyJWT(token: string) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as { username: string; name: string };
  } catch {
    return null;
  }
}
