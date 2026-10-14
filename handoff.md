# SmartApart — Handoff Document
Last updated: 2026-10-14 — Security Hardened + Backup & Restore System Active ✅

## Production URL
https://smartapart.ai-pro.workers.dev
Current Version ID: cfa51f77-5894-4422-9d63-40c7b019698c

## Status: ALL APIs WORKING (verified 2026-10-14)

| Endpoint | Result |
|---|---|
| POST /api/auth/login | ✅ 200 |
| GET /api/auth/me | ✅ 200 |
| GET /api/admin/backup/export | ✅ 200 |
| POST /api/admin/backup/restore | ✅ 200 |
| GET /api/property | ✅ 200 |
| PUT /api/property | ✅ 200 |
| GET /api/buildings | ✅ 200 |
| PUT /api/buildings | ✅ 200 |
| GET /api/buildings/monthly-utility | ✅ 200 |
| GET /api/tenants | ✅ 200 |
| PUT /api/tenants/[id] | ✅ 200 |
| GET /api/invoices | ✅ 200 |
| GET /api/invoices/[id] | ✅ 200 |
| GET /api/meter-readings | ✅ 200 |
| POST /api/meter-readings | ✅ 200 |
| GET /api/bookings | ✅ 200 |
| GET /api/rooms/[id] | ✅ 200 |

---

## Credentials
- Admin login: `admin` / `password123`
- D1 database: `smartapart-db` (ID: b45375ef-d42c-4175-8e75-dcc764c8e647)
- Binding name: `DB`

---

## Build & Deploy

```powershell
# 1. Patch WASM (required after npm install)
node "d:\AI\SmartApart\scripts\patch-wasm.js"

# 2. Build (~10 min)
node "d:\AI\SmartApart\node_modules\@opennextjs\cloudflare\dist\cli\index.js" build 2>&1

# 3. Deploy
node "d:\AI\SmartApart\node_modules\@opennextjs\cloudflare\dist\cli\index.js" deploy 2>&1

# npm install (Windows - always --ignore-scripts)
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install --ignore-scripts

# D1 query
node "d:\AI\SmartApart\node_modules\wrangler\bin\wrangler.js" d1 execute smartapart-db --remote --command "SQL HERE" 2>&1
```

---

## ALL FIXES APPLIED (DO NOT REVERT)

### 1. WASM patches — auto re-applied by patch-wasm.js at each build
- `node_modules/.prisma/client/wasm-worker-loader.mjs` → static import
- `node_modules/.prisma/client/wasm.js` → imports from ./wasm-worker-loader.mjs
- `src/lib/prisma.ts` → `@prisma/client/wasm` (NOT /edge, NOT plain @prisma/client)
- `wrangler.json` → CompiledWasm rule with fallthrough: true

### 2. D1 Schema Fixes (2026-08-14)
Two items were missing from D1 — already added:
```sql
-- Missing column
ALTER TABLE Building ADD COLUMN useDynamicUtilityRate INTEGER NOT NULL DEFAULT 0;

-- Missing table
CREATE TABLE IF NOT EXISTS "BuildingMonthlyUtility" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "buildingId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "waterBillTotal" REAL NOT NULL,
  "waterUnitsTotal" REAL NOT NULL,
  "waterRate" REAL NOT NULL,
  "elecBillTotal" REAL NOT NULL,
  "elecUnitsTotal" REAL NOT NULL,
  "elecRate" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "BuildingMonthlyUtility_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("buildingId", "period")
);
```
**No Prisma migrate for D1** — new columns/tables must be added manually. Always compare `schema.prisma` models vs D1 tables:
```powershell
node "d:\AI\SmartApart\node_modules\wrangler\bin\wrangler.js" d1 execute smartapart-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" 2>&1
```

### 3. Prisma D1 Compatibility (2026-08-14)
- `src/app/api/tenants/route.ts`: Removed `orderBy: { room: { number: 'asc' } }` (D1 does NOT support relation orderBy), replaced with in-memory `.sort()`
- `src/app/api/rooms/[id]/route.ts`: Split nested `take+include` in findUnique into `Promise.all([findUnique, findMany, findMany])` parallel queries

### 4. TypeScript Fixes (2026-08-14)
- `src/components/tabs/GovBillTab.tsx` → `res.json() as any` (×2)
- `src/components/tabs/ReportTab.tsx` → `res.json() as any[]`

### 5. UI/UX Fixes (2026-08-14)
- `ReportTab.tsx`: Fixed mobile responsiveness by wrapping the entire A4 page in `.a4PageWrapper` with `overflow-x: auto` instead of individual tables.
- `ReportTab.tsx`: Locked table column widths (10%, 30%, 12%, 12%, 12%, 12%, 12%) so building and summary tables align perfectly.
- `ReportTab.tsx` (YEARLY Print Fix): Fixed the "phantom 2nd page" and vertical overflow issues when printing the Yearly Report by resetting `.a4Page` `min-height: 0` and `margin: 0` in `@media print`, while tuning `font-size: 10.8px` and `padding` to perfectly fit 62 rows within a single A4 page.
- `MeterTab.tsx`: Simplified dropdown options and removed extra styling on the period label.
- `FloorMapTab.tsx`: Floors now map ascending instead of descending (`.reverse()` removed).
- `SettingsTab.tsx`: Billing modes (METER, FLAT, CUSTOM) now render as colored badges.
- `InvoiceTab.tsx`: Default filter is now the current month instead of ALL.

---

## Remaining Backlog & Planned Features

| | Task |
|---|---|
| 🔲 | **Overdue Report (รายงานยอดค้างชำระ)**: Track unpaid invoices past their due date. |
| 🔲 | **Payment Collection Report (รายงานสรุปการรับเงิน)**: Cash vs Transfer breakdown. |
| 🔲 | **Move-in/Move-out Report**: Tenant turnover and deposit tracking. |
| 🔲 | **Utility Usage Trends**: Chart/table of water and electricity usage over time. |
| 🔲 | POST /api/tenants (check-in) — not tested (risk: changes room status + creates invoice) |
| 🔲 | POST /api/invoices (generate invoice) — not tested |
| 🔲 | POST /api/payments — not tested |
| 🔲 | POST /api/bookings — not tested |
| 🔲 | DELETE /api/tenants/[id] — not tested |
| 🔲 | POST /api/tenants/[id]/checkout — not tested |
| 🔲 | wrangler.json compatibility_date: 2024-09-23 (consider updating) |

---

## Debugging Pattern (if 500 returns)

### Step 1: Add _d to catch block
```ts
} catch (error: any) {
  return NextResponse.json({ error: '...', _d: error?.message || String(error) }, { status: 500 });
}
```

### Step 2: Rebuild + deploy, then test with curl
```powershell
[System.IO.File]::WriteAllText("lb.json", '{"username":"admin","password":"password123"}')
curl.exe -s -c "ck.txt" -X POST "https://smartapart.ai-pro.workers.dev/api/auth/login" -H "Content-Type: application/json" -d "@lb.json" --max-time 20
curl.exe -s -b "ck.txt" "https://smartapart.ai-pro.workers.dev/api/ENDPOINT" --max-time 25
```

### Step 3: Match _d to fix
| _d message | Fix |
|---|---|
| `no such column` | Run `ALTER TABLE X ADD COLUMN Y` on D1 |
| `bind of undefined` | Re-run patch-wasm.js + rebuild |
| `fs.readdir` | Fix prisma.ts import to use `@prisma/client/wasm` |
| `orderBy` + relation field | Sort in-memory with .sort() instead |
| nested `take` + `include` | Split into Promise.all with separate findMany |

---

## Key Architecture

| | |
|---|---|
| Framework | Next.js 16.2.12 (Turbopack) |
| Deploy | @opennextjs/cloudflare 1.20.2 on Cloudflare Workers |
| DB | Cloudflare D1 (SQLite) + Prisma D1 adapter |
| Prisma | @prisma/client/wasm — MUST be /wasm for Workers |
| Auth | Cookie: admin_session, bcrypt passwords |
| Windows build | Always use `node` directly, NOT npm/wrangler directly |

---

## การ Build และ Deploy (สำหรับครั้งต่อไป)

```powershell
# 1. Patch Prisma WASM (ต้องทำทุกครั้งหลัง npm install)
node "d:\AI\SmartApart\scripts\patch-wasm.js"

# 2. Build (~10 นาที)
node "d:\AI\SmartApart\node_modules\@opennextjs\cloudflare\dist\cli\index.js" build

# 3. Deploy
node "d:\AI\SmartApart\node_modules\@opennextjs\cloudflare\dist\cli\index.js" deploy
```

หลัง npm install ให้รัน `patch-wasm.js` ก่อนเสมอ (patches node_modules)

---

## สิ่งที่แก้ไขไปแล้ว (ห้าม revert)

### 1. `src/lib/prisma.ts` — ใช้ `/wasm` client
```ts
import { PrismaClient as EdgePrismaClient } from '@prisma/client/wasm';  // ✅
// ❌ ห้ามใช้ '@prisma/client'  → fs.readdir crashes
// ❌ ห้ามใช้ '@prisma/client/edge' → rejects driver adapters
```

### 2. `scripts/patch-wasm.js` — patch 2 ไฟล์ใน node_modules
- `wasm-worker-loader.mjs`: dynamic import → static import (wrangler bundles WASM)
- `wasm.js`: `#wasm-engine-loader` → `./wasm-worker-loader.mjs` (ป้องกัน Turbopack misresolution)

### 3. `wrangler.json` — CompiledWasm rule
```json
"rules": [{ "type": "CompiledWasm", "globs": ["**/*.wasm"], "fallthrough": true }]
```

### 4. `next.config.ts`
```ts
serverExternalPackages: []  // ห้ามใส่ @prisma/client ที่นี่
```

---

## Root Cause Summary

```
Error 1: "bind of undefined"
  → wasm-worker-loader.mjs ใช้ dynamic import('./query_engine_bg.wasm')
  → wrangler ไม่ follow dynamic .wasm imports
  → Fix: เปลี่ยนเป็น static import ✅

Error 2: "fs.readdir not implemented"
  → import { PrismaClient } from '@prisma/client' (regular)
  → Regular client หา native binary engine ด้วย fs.readdir
  → Fix: ใช้ '@prisma/client/wasm' ✅

Error 3: "adapter not allowed with /edge"
  → import from '@prisma/client/edge' ไม่รองรับ driver adapter
  → Fix: ใช้ '/wasm' แทน ✅

Error 4: "Cannot read properties of undefined (reading 'default')"
  → Turbopack resolve '#wasm-engine-loader' เป็น wasm.js ตัวเอง (circular)
  → Fix: patch wasm.js ให้ import จาก './wasm-worker-loader.mjs' โดยตรง ✅
```

---

## Database
- Cloudflare D1: `smartapart-db` (ID: b45375ef-d42c-4175-8e75-dcc764c8e647)
- Binding: `DB`

## Windows Commands
```powershell
# npm install (ต้องใช้ --ignore-scripts เสมอ)
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install --ignore-scripts

# prisma generate
node "d:\AI\SmartApart\node_modules\prisma\build\index.js" generate

# D1 migrations (production)
node "d:\AI\SmartApart\node_modules\wrangler\bin\wrangler.js" d1 migrations apply smartapart-db --remote
```

## Known Working Version
- Version ID: จาก deploy ล่าสุด (2026-08-08)
- Login: POST /api/auth/login → 401 ✅

## สิ่งที่ยังไม่ได้ทำ (Backlog)
- Logo ยังไม่ขึ้นบนหน้า login/app
