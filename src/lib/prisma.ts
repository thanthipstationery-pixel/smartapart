// Static top-level imports — REQUIRED for WASM pre-initialization in Cloudflare Workers
// Dynamic require() prevents WASM from loading correctly on the edge runtime
import { PrismaClient as EdgePrismaClient } from '@prisma/client/wasm';


import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { PrismaClient } from '@prisma/client';

let _cachedD1Client: EdgePrismaClient | null = null;
let _fallbackPrisma: any = null;

function getD1Database(db?: any): any {
  if (db) return db;

  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as any;
    if (env?.DB) return env.DB;
  } catch (e: any) {
    // Not in Cloudflare Workers context (e.g., local dev)
    console.log('[prisma] getCloudflareContext:', e?.message ?? 'no context');
  }

  // Additional fallbacks for different deployment patterns
  if ((globalThis as any).__env__?.DB) return (globalThis as any).__env__.DB;
  if ((globalThis as any).env?.DB) return (globalThis as any).env.DB;
  if ((globalThis as any).DB) return (globalThis as any).DB;

  return null;
}

export function getPrisma(db?: any): PrismaClient {
  const d1 = getD1Database(db);

  if (d1) {
    // Production: use D1 adapter with Prisma Edge client (WASM pre-initialized via static import)
    if (!_cachedD1Client) {
      const adapter = new PrismaD1(d1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _cachedD1Client = new EdgePrismaClient({ adapter: adapter as any });
    }
    return _cachedD1Client as unknown as PrismaClient;
  }

  // Local dev fallback: use native Prisma client with DATABASE_URL (SQLite file)
  if (!_fallbackPrisma) {
    console.log('[prisma] No D1 binding — using local SQLite fallback');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient: LocalClient } = require('@prisma/client');
    _fallbackPrisma = new LocalClient();
  }
  return _fallbackPrisma as PrismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
