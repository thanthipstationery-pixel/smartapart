import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let _fallbackPrisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && (ctx.env as any).DB) {
      const adapter = new PrismaD1((ctx.env as any).DB);
      return new PrismaClient({ adapter });
    }
  } catch (e) {
    // Fallback when outside of request context or during local build
  }

  if (!_fallbackPrisma) {
    _fallbackPrisma = new PrismaClient();
  }
  return _fallbackPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
