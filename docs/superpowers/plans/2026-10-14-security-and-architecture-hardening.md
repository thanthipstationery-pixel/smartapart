# Security & Architecture Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ขจัดช่องโหว่ความปลอดภัยระดับวิกฤต (Secret Leak, Financial Tampering, Token Forgery), ป้องกัน Race Condition และความผิดพลาดของ State Machine ในระบบจัดการห้องพัก/การเงิน, และกำจัดคอขวดหน่วยความจำ (Memory Leak/OOM) บน Cloudflare Edge Runtime

**Architecture:** 
1. เปลี่ยนการจัดการ Security & Auth ให้เป็น Fail-Fast และ Zero-Trust โดยตัด Client-side Exposure ของ Secrets ทั้งหมด
2. ปรับปรุง Database Schema ด้วย Unique Constraints และ Indexing เพื่อรองรับ Concurrency Control และ Query Optimization บน Cloudflare D1
3. บังคับใช้ Server-Authoritative Financial Calculation ใน API Endpoints ทุกจุด ห้ามเชื่อถือยอดรวมที่ Client คำนวณมา
4. แก้ไข State Machine Transition (Booking, Check-in, Transfer, Checkout) ให้มี Atomic Guards ป้องกันสถานะทับซ้อน
5. ปรับปรุง Data Retrieval Pattern บน Edge Runtime จาก Unbounded In-Memory Aggregations เป็น Scoped Batch Queries

**Tech Stack:** Next.js (App Router), Cloudflare Workers (via OpenNext), Cloudflare D1 (SQLite), Prisma ORM with `@prisma/adapter-d1` & `@prisma/client/wasm`, Jose (JWT), Bcryptjs

---

## Global Constraints

- รันบน Cloudflare Workers Edge Runtime (WASM-based Prisma Client, Memory Limit 128MB)
- ฐานข้อมูลคือ Cloudflare D1 (SQLite) — ไม่รองรับ `prisma migrate deploy` อัตโนมัติ ต้องเตรียม SQL DDL Scripts สำหรับรันคำสั่ง D1 เสมอ
- ห้ามทำลาย WASM Worker Loader Patches ใน `node_modules` และ `scripts/patch-wasm.js`
- API ทุกเส้นต้องคงรูปแบบ Response Contract เดิมสำหรับ Frontend

---

### Task 1: Auth & Secret Hardening (JWT & API Keys)

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/api/property/route.ts`
- Modify: `src/app/api/scan-id-card/route.ts`

**Interfaces:**
- `verifyJWT(token: string)`: คืนค่า payload หรือ null หาก secret ไม่ตรง
- `GET /api/property`: คืนค่า property data โดย sanitize `geminiApiKey` เป็น `hasGeminiApiKey: boolean`
- `POST /api/scan-id-card`: ตรวจสอบขนาด base64 payload ไม่เกิน 5MB ก่อนส่งต่อ

- [ ] **Step 1: แก้ไข `src/lib/auth.ts` ป้องกัน Fallback Secret ใน Production**

```typescript
import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET environment variable is missing in production.');
}

const JWT_SECRET = new TextEncoder().encode(
  rawSecret || 'smartapart-dev-insecure-key-do-not-use-in-production'
);

export async function signJWT(payload: { username: string; name: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { username: string; name: string };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: แก้ไข `src/app/api/property/route.ts` ไม่ส่ง Plaintext `geminiApiKey` ไปที่ Client**

ตัดฟิลด์ `geminiApiKey` ออกจากผลลัพธ์ของ `GET` และส่งกลับเฉพาะ Flag `hasGeminiApiKey: boolean`:

```typescript
    const property = await prisma.property.findFirst();
    if (!property) {
      const newProp = await prisma.property.create({
        data: {
          name: 'สมาร์ทอพาร์ทเมนท์ (SmartApart)',
          phone: '02-123-4567',
          email: 'contact@smartapart.com',
          address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
          lineId: '@smartapart',
        }
      });
      const { geminiApiKey: _omitted, ...safeNewProp } = newProp;
      return NextResponse.json({ ...safeNewProp, hasGeminiApiKey: false });
    }

    const { geminiApiKey: _omittedKey, ...safeProperty } = property;
    return NextResponse.json({
      ...safeProperty,
      hasGeminiApiKey: Boolean(property.geminiApiKey),
    });
```

- [ ] **Step 3: ป้องกัน OOM จาก Base64 Upload ใน `src/app/api/scan-id-card/route.ts`**

เพิ่มการตรวจสอบ Max Payload Size (5MB) และเปลี่ยน Model Endpoint ให้เป็น Stable Gemini Model:

```typescript
    const MAX_BASE64_BYTES = 5 * 1024 * 1024 * 1.37; // ~5MB file in base64
    if (typeof image !== 'string' || image.length > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { error: 'ขนาดรูปภาพเกินกำหนด (ต้องไม่เกิน 5MB)' },
        { status: 400 }
      );
    }
```

- [ ] **Step 4: ทดสอบ Verification สำหรับ Task 1**
Run: `node -e "const { signJWT } = require('./src/lib/auth.ts')"` หรือทดสอบผ่าน API call ตรวจสอบว่า `GET /api/property` ไม่มี key หลุด

---

### Task 2: Database Schema Hardening & Cloudflare D1 Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261014_hardening.sql`

**Interfaces:**
- `Invoice`: เพิ่ม `@@unique([roomId, billingPeriod])` และ Index `billingPeriod`, `status`, `roomId`
- `MeterReading`: เพิ่ม Index `[roomId, readingDate]`
- `Tenant`: เพิ่ม Index `[roomId, status]`

- [ ] **Step 1: อัปเดต `prisma/schema.prisma`**

เพิ่ม Unique Constraints และ Indexing:

```prisma
model Invoice {
  id               String        @id @default(uuid())
  roomId           String
  room             Room          @relation(fields: [roomId], references: [id])
  tenantId         String
  tenant           Tenant        @relation(fields: [tenantId], references: [id])
  billingPeriod    String        // Format: "YYYY-MM"
  previousWater    Float
  currentWater     Float
  previousElec     Float
  currentElec      Float
  waterCost        Float
  electricityCost  Float
  rentCost         Float
  otherCost        Float         @default(0)
  bookNo           String?
  invoiceNoStr     String?
  otherFeeDetails  String?
  otherNote        String?
  totalAmount      Float
  status           String
  createdAt        DateTime      @default(now())
  dueDate          DateTime
  waterRate        Float?
  electricityRate Float?
  payments         Payment[]

  @@unique([roomId, billingPeriod])
  @@index([billingPeriod])
  @@index([status])
  @@index([roomId])
}

model MeterReading {
  id               String   @id @default(uuid())
  roomId           String
  room             Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  readingDate      DateTime @default(now())
  waterValue       Float
  electricityValue Float
  recordedBy       String?

  @@index([roomId, readingDate])
}

model Tenant {
  // ... existing fields ...
  roomId               String
  room                 Room       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  invoices             Invoice[]

  @@index([roomId, status])
}
```

- [ ] **Step 2: สร้างไฟล์ SQL DDL Script สำหรับ Cloudflare D1**

สร้าง `prisma/migrations/20261014_hardening.sql`:

```sql
-- Create unique index to prevent duplicate invoices per room per period
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_roomId_billingPeriod_key" ON "Invoice"("roomId", "billingPeriod");

-- Query performance indexes
CREATE INDEX IF NOT EXISTS "Invoice_billingPeriod_idx" ON "Invoice"("billingPeriod");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_roomId_idx" ON "Invoice"("roomId");
CREATE INDEX IF NOT EXISTS "MeterReading_roomId_readingDate_idx" ON "MeterReading"("roomId", "readingDate");
CREATE INDEX IF NOT EXISTS "Tenant_roomId_status_idx" ON "Tenant"("roomId", "status");
```

---

### Task 3: State Machine Invariants & Concurrency Guards

**Files:**
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/app/api/bookings/[id]/cancel/route.ts`
- Modify: `src/app/api/tenants/[id]/checkout/route.ts`
- Modify: `src/app/api/tenants/route.ts`

**Interfaces:**
- `POST /api/bookings`: ปฏิเสธห้องที่ไม่ใช่ `VACANT` (รวมถึง `BOOKED` และ `OCCUPIED`)
- `POST /api/bookings/[id]/cancel`: อนุญาตให้ cancel เฉพาะ `ACTIVE` booking และรีเซ็ตห้องเป็น `VACANT` เฉพาะเมื่อห้องยังเป็น `BOOKED`
- `POST /api/tenants/[id]/checkout`: ปฏิเสธ tenant ที่มีสถานะ `CHECKED_OUT` แล้ว และรวบ `meterReading.create` เข้า Transaction

- [ ] **Step 1: แก้ไข `src/app/api/bookings/route.ts` เพื่อป้องกัน Double Booking**

```typescript
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'ไม่พบห้องพักที่ระบุ' }, { status: 404 });
    if (room.status !== 'VACANT') {
      return NextResponse.json(
        { error: `ไม่สามารถจองห้องพักได้ เนื่องจากห้องมีสถานะเป็น ${room.status}` },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: แก้ไข `src/app/api/bookings/[id]/cancel/route.ts` เพื่อป้องกัน State Corruption**

```typescript
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    if (booking.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `รายการจองนี้ไม่สามารถยกเลิกได้เนื่องจากมีสถานะเป็น ${booking.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'REFUND' ? 'CANCELLED_REFUNDED' : 'CANCELLED_FORFEITED';

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: newStatus },
      });

      // ป้องกันการรีเซ็ตห้องที่ผู้เช่าเข้าอยู่แล้ว
      if (booking.room.status === 'BOOKED') {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'VACANT' },
        });
      }
    });
```

- [ ] **Step 3: ปรับปรุง `src/app/api/tenants/[id]/checkout/route.ts` ให้เป็น Atomic & Idempotent**

1. ตรวจสอบ `if (tenant.status === 'CHECKED_OUT')` เพื่อ Fail Fast
2. ย้าย `prisma.meterReading.create` เข้าไปใน `prisma.$transaction(async (tx) => ...)`

---

### Task 4: Financial Calculation Integrity & Input Sanitation

**Files:**
- Modify: `src/app/api/tenants/[id]/transfer/route.ts`
- Modify: `src/app/api/payments/route.ts`

**Interfaces:**
- `POST /api/tenants/[id]/transfer`: คำนวณ `totalAmount` ใหม่บนฝั่ง Server จากผลรวมของ ค่าเช่า + ค่าน้ำ + ค่าไฟ + ค่าธรรมเนียมอื่นๆ
- `POST /api/payments`: ตรวจสอบ `amountPaid > 0` และ `!isNaN(amountPaid)`

- [ ] **Step 1: แก้ไข `src/app/api/tenants/[id]/transfer/route.ts` ห้ามเชื่อถือ Client `netTotal`**

```typescript
        const rentCost = (invoiceData.proratedNewRent || 0) + (invoiceData.nextMonthFullRent || 0);
        const waterCost = invoiceData.waterCost || 0;
        const elecCost = invoiceData.elecCost || 0;
        
        // คำนวณ Total Amount ฝั่ง Server อย่างเด็ดขาด
        const calculatedTotal = rentCost + waterCost + elecCost + otherCost;

        await tx.invoice.create({
          data: {
            roomId: targetRoomId,
            tenantId: id,
            billingPeriod: invoiceData.billingPeriod || dateObj.toISOString().slice(0, 7),
            previousWater: oldWaterStart,
            currentWater: oldWaterFinal,
            previousElec: oldElecStart,
            currentElec: oldElecFinal,
            waterCost,
            electricityCost: elecCost,
            rentCost,
            otherCost,
            totalAmount: calculatedTotal,
            otherFeeDetails: JSON.stringify(otherFeeDetails),
            otherNote: `บิลแจ้งย้ายห้อง (จากห้อง ${oldRoomNumber})`,
            status: 'UNPAID',
            dueDate: dueDate,
            waterRate: invoiceData.waterRate || 0,
            electricityRate: invoiceData.elecRate || 0,
          },
        });
```

- [ ] **Step 2: แก้ไข `src/app/api/payments/route.ts` ตรวจสอบความถูกต้องของยอดชำระ**

```typescript
    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'ยอดเงินชำระไม่ถูกต้อง (ต้องเป็นตัวเลขมากกว่า 0)' },
        { status: 400 }
      );
    }
```

---

### Task 5: Memory Leak & Query Optimization บน Cloudflare Workers

**Files:**
- Modify: `src/app/api/buildings/route.ts`

**Interfaces:**
- `GET /api/buildings?period=YYYY-MM`: ไม่ Query ทุกแถวในตาราง `MeterReading` และ `Invoice` แต่จำกัดเฉพาะรอบบิลที่ระบุและช่วงเวลาที่เกี่ยวข้อง

- [ ] **Step 1: ปรับปรุง `src/app/api/buildings/route.ts` ด้วย Scoped Queries**

แทนที่จะเรียก `prisma.meterReading.findMany()` ทั้งหมด:
1. ดึง `MeterReading` เฉพาะช่วงวันที่เกี่ยวข้องกับ `period` ปัจจุบัน และมิเตอร์ล่าสุดก่อน `startOfPeriod`
2. ดึง `Invoice` เฉพาะที่มีสถานะ `UNPAID` หรืออยู่ในรอบบิล `currentMonth` / `period`
3. กำจัด In-memory Array Scan ทั้งตาราง ลดการใช้ RAM บน Worker จาก O(All DB Rows) เหลือเฉพาะ O(Current Month Rooms)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-14-security-and-architecture-hardening.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
