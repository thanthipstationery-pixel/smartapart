# Tenant & Check-out Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the expanded Tenant Profile, Keycard Deposit Ledger, and Comprehensive Check-out System for Pakdee Apartment.

**Architecture:** Extend Prisma `Tenant` schema with emergency contact, workplace, address, and keycard deposit fields. Implement backend endpoints for tenant updates (`PUT /api/tenants/[id]`), comprehensive check-out calculation (`POST /api/tenants/[id]/checkout`), and late keycard refunds (`POST /api/tenants/[id]/refund-keycard`). Upgrade frontend Check-in, Tenant Details, and Check-out Modals with full responsiveness and print-friendly receipts.

**Tech Stack:** Next.js 16 (App Router), Prisma Client, SQLite, TypeScript, CSS Modules / Vanilla CSS.

---

## Global Constraints

- Preserve all existing API response structures.
- All phone input fields must use `inputMode="numeric"` and filter out non-digit/dash characters.
- All modal buttons must be centered (`justify-content: center`), high-contrast, and clearly styled (`.btnSecondary` with dark slate background and white text).

---

### Task 1: Extend Database Schema for Tenant Profile & Keycard Ledger

**Files:**
- Modify: `prisma/schema.prisma:60-80`

**Interfaces:**
- Consumes: Existing Prisma `Tenant` schema
- Produces: Expanded `Tenant` model fields in SQLite `dev.db`

- [ ] **Step 1: Update `Tenant` model in `prisma/schema.prisma`**

```prisma
model Tenant {
  id                   String     @id @default(uuid())
  name                 String
  phone                String
  idCard               String?
  address              String?
  email                String?
  lineId               String?
  workplace            String?
  
  // Emergency Contact
  emergencyName        String?
  emergencyRel         String?
  emergencyPhone       String?
  
  // Financial & Keycard Ledger
  securityDeposit      Float      @default(0)
  keycardCount         Int        @default(0)
  keycardDeposit       Float      @default(0)
  keycardCode          String?
  note                 String?
  
  // Rental Contract Period
  startDate            DateTime   @default(now())
  endDate              DateTime?
  
  // Check-out Status & Keycard Refund Ledger
  status               String     @default("ACTIVE") // "ACTIVE", "CHECKED_OUT"
  checkedOutAt         DateTime?
  keycardReturnedCount Int        @default(0)
  keycardRefundedAt    DateTime?
  keycardRefundAmount  Float      @default(0)

  // Relations
  roomId               String
  room                 Room       @relation(fields: [roomId], references: [id])
  invoices             Invoice[]
  createdAt            DateTime   @default(now())
}
```

- [ ] **Step 2: Push database schema and generate Prisma Client**

Run: `npx prisma db push`
Expected: "Your database is now in sync with your schema."

- [ ] **Step 3: Commit database schema updates**

```bash
git add prisma/schema.prisma
git commit -m "schema: expand Tenant model with keycard deposit and emergency contact fields"
```

---

### Task 2: Implement Backend API Routes for Tenant Management & Check-out

**Files:**
- Create: `src/app/api/tenants/[id]/route.ts`
- Create: `src/app/api/tenants/[id]/checkout/route.ts`
- Create: `src/app/api/tenants/[id]/refund-keycard/route.ts`
- Modify: `src/app/api/buildings/route.ts`
- Modify: `src/app/api/rooms/[id]/route.ts`

**Interfaces:**
- Consumes: Prisma Client `prisma.tenant`, `prisma.room`, `prisma.meterReading`
- Produces: API REST handlers for tenant update, check-out calculation, and late keycard refund

- [ ] **Step 1: Create `src/app/api/tenants/[id]/route.ts` for profile updates**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        idCard: body.idCard,
        address: body.address,
        email: body.email,
        lineId: body.lineId,
        workplace: body.workplace,
        emergencyName: body.emergencyName,
        emergencyRel: body.emergencyRel,
        emergencyPhone: body.emergencyPhone,
        securityDeposit: body.securityDeposit !== undefined ? parseFloat(body.securityDeposit) : undefined,
        keycardCount: body.keycardCount !== undefined ? parseInt(body.keycardCount) : undefined,
        keycardDeposit: body.keycardDeposit !== undefined ? parseFloat(body.keycardDeposit) : undefined,
        keycardCode: body.keycardCode,
        note: body.note,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/tenants/[id]/checkout/route.ts` for check-out calculation**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      checkOutDate,
      finalWaterValue,
      finalElecValue,
      cleaningFee = 0,
      repairFee = 0,
      otherDeductions = 0,
      keycardsReturned = 0,
      note = '',
    } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
            invoices: {
              where: { status: 'UNPAID' },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const checkOutDateTime = checkOutDate ? new Date(checkOutDate) : new Date();

    // Record final meter reading if provided
    if (finalWaterValue !== undefined || finalElecValue !== undefined) {
      await prisma.meterReading.create({
        data: {
          roomId: tenant.roomId,
          waterValue: parseFloat(finalWaterValue || '0'),
          electricityValue: parseFloat(finalElecValue || '0'),
          readingDate: checkOutDateTime,
          recordedBy: 'CHECK_OUT',
        },
      });
    }

    // Keycard refund calculation
    const keycardCount = tenant.keycardCount || 0;
    const keycardDeposit = tenant.keycardDeposit || 0;
    const keycardRefundAmount = keycardCount > 0 ? (keycardsReturned / keycardCount) * keycardDeposit : 0;

    // Transaction to update Tenant & Room status
    const result = await prisma.$transaction([
      prisma.tenant.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          endDate: checkOutDateTime,
          checkedOutAt: checkOutDateTime,
          keycardReturnedCount: parseInt(keycardsReturned),
          keycardRefundAmount,
          keycardRefundedAt: checkOutDateTime,
          note: note ? `${tenant.note || ''}\n[Check-out Note]: ${note}` : tenant.note,
        },
      }),
      prisma.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tenant: result[0],
      summary: {
        securityDeposit: tenant.securityDeposit,
        keycardRefundAmount,
        cleaningFee: parseFloat(cleaningFee),
        repairFee: parseFloat(repairFee),
        otherDeductions: parseFloat(otherDeductions),
      },
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    return NextResponse.json({ error: 'Check-out failed' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `src/app/api/tenants/[id]/refund-keycard/route.ts` for late keycard return**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { returnedCount, refundAmount } = body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        keycardReturnedCount: parseInt(returnedCount),
        keycardRefundAmount: parseFloat(refundAmount),
        keycardRefundedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error('Error processing late keycard refund:', error);
    return NextResponse.json({ error: 'Failed to refund keycard' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Update `src/app/api/buildings/route.ts` and `src/app/api/rooms/[id]/route.ts` to include expanded tenant fields**

In `src/app/api/buildings/route.ts` (lines 140-146):
```ts
activeTenant: activeTenant
  ? {
      id: activeTenant.id,
      name: activeTenant.name,
      phone: activeTenant.phone,
      startDate: activeTenant.startDate,
      emergencyName: activeTenant.emergencyName,
      emergencyRel: activeTenant.emergencyRel,
      emergencyPhone: activeTenant.emergencyPhone,
      securityDeposit: activeTenant.securityDeposit,
      keycardCount: activeTenant.keycardCount,
      keycardDeposit: activeTenant.keycardDeposit,
    }
  : null,
```

- [ ] **Step 5: Commit backend API routes**

```bash
git add src/app/api/tenants
git add src/app/api/buildings/route.ts
git add src/app/api/rooms/[id]/route.ts
git commit -m "feat: add API endpoints for tenant profile updates, check-out processing, and keycard refunds"
```

---

### Task 3: Upgrade Check-in Modal with Expanded Tenant & Keycard Fields

**Files:**
- Modify: `src/app/page.tsx:2630-2680, 3100-3160`

**Interfaces:**
- Consumes: Expanded Check-in Form States
- Produces: Complete Tenant registration with emergency contact, workplace, security deposit, and keycard deposit

- [ ] **Step 1: Add new Check-in state variables in `src/app/page.tsx`**

```tsx
const [checkInAddress, setCheckInAddress] = useState('');
const [checkInWorkplace, setCheckInWorkplace] = useState('');
const [checkInEmergencyName, setCheckInEmergencyName] = useState('');
const [checkInEmergencyRel, setCheckInEmergencyRel] = useState('พ่อ/แม่');
const [checkInEmergencyPhone, setCheckInEmergencyPhone] = useState('');
const [checkInSecurityDeposit, setCheckInSecurityDeposit] = useState('');
const [checkInKeycardCount, setCheckInKeycardCount] = useState('1');
const [checkInKeycardDeposit, setCheckInKeycardDeposit] = useState('100');
const [checkInKeycardCode, setCheckInKeycardCode] = useState('');
const [checkInNote, setCheckInNote] = useState('');
```

- [ ] **Step 2: Update Check-in Submit handler in `src/app/page.tsx`**

Send expanded fields in `POST /api/check-in`:
```tsx
body: JSON.stringify({
  roomId: selectedRoom.id,
  name: checkInName,
  phone: checkInPhone,
  idCard: checkInIdCard,
  address: checkInAddress,
  email: checkInEmail,
  lineId: checkInLineId,
  workplace: checkInWorkplace,
  emergencyName: checkInEmergencyName,
  emergencyRel: checkInEmergencyRel,
  emergencyPhone: checkInEmergencyPhone,
  securityDeposit: parseFloat(checkInSecurityDeposit || '0'),
  keycardCount: parseInt(checkInKeycardCount || '0'),
  keycardDeposit: parseFloat(checkInKeycardDeposit || '0'),
  keycardCode: checkInKeycardCode,
  note: checkInNote,
  startDate: checkInStartDate,
  waterMeter: parseFloat(checkInWaterMeter || '0'),
  elecMeter: parseFloat(checkInElecMeter || '0'),
})
```

- [ ] **Step 3: Update Check-in Modal Form UI in `src/app/page.tsx`**

Organize the form into 4 styled sections:
1. 👤 **ข้อมูลส่วนตัวผู้เช่า** (ชื่อ, เบอร์โทร, บัตรประชาชน, ที่อยู่ตามบัตรฯ, สถานที่ทำงาน)
2. 🚨 **ผู้ติดต่อกรณีฉุกเฉิน** (ชื่อผู้ติดต่อ, ความสัมพันธ์, เบอร์โทรศัพท์)
3. 🔑 **เงินประกัน & คีย์การ์ด** (เงินประกันสัญญา, จำนวนคีย์การ์ด, ยอดมัดจำคีย์การ์ด, เลขรหัสคีย์การ์ด)
4. ⚡ **มิเตอร์แรกเข้า & หมายเหตุ**

- [ ] **Step 4: Commit Check-in Modal upgrade**

```bash
git add src/app/page.tsx
git commit -m "feat: upgrade Check-in modal with expanded tenant details and keycard deposit fields"
```

---

### Task 4: Build Check-out Modal & Receipt Summary System

**Files:**
- Modify: `src/app/page.tsx:2740-2790`

**Interfaces:**
- Consumes: `POST /api/tenants/[id]/checkout`, `POST /api/tenants/[id]/refund-keycard`
- Produces: Interactive Check-out Modal with itemized deposit refund breakdown and printable Check-out receipt

- [ ] **Step 1: Add Check-out state variables in `src/app/page.tsx`**

```tsx
const [showCheckOutModal, setShowCheckOutModal] = useState(false);
const [checkOutDate, setCheckOutDate] = useState('');
const [checkOutFinalWater, setCheckOutFinalWater] = useState('');
const [checkOutFinalElec, setCheckOutFinalElec] = useState('');
const [checkOutCleaningFee, setCheckOutCleaningFee] = useState('500');
const [checkOutRepairFee, setCheckOutRepairFee] = useState('0');
const [checkOutOtherDeductions, setCheckOutOtherDeductions] = useState('0');
const [checkOutKeycardsReturned, setCheckOutKeycardsReturned] = useState('0');
const [checkOutNote, setCheckOutNote] = useState('');
const [checkOutReceiptData, setCheckOutReceiptData] = useState<any>(null);
```

- [ ] **Step 2: Implement `handleCheckOutSubmit` in `src/app/page.tsx`**

Call `POST /api/tenants/[id]/checkout` and display the generated summary receipt modal on success.

- [ ] **Step 3: Build Check-out Modal UI in `src/app/page.tsx`**

Build a multi-section Check-out Modal:
1. **วันที่ย้ายออก & เลขมิเตอร์วันย้ายออกจริง** (แสดงเลขมิเตอร์ครั้งก่อนอ้างอิง)
2. **การคืนคีย์การ์ด**: Select number of keycards returned (`0`, `1`, `2`, ... up to `keycardCount`)
3. **สรุปยอดเงินประกันและการหักชำระ (Real-time Net Calculation)**:
   - ➕ เงินมัดจำประกันสัญญา: `+3,000฿`
   - ➕ คืนมัดจำคีย์การ์ด (คืน X/Y ใบ): `+200฿`
   - ➖ ค่าน้ำไฟเดือนสุดท้าย: `-(ค่าน้ำ + ค่าไฟ)`
   - ➖ ค่าทำความสะอาด: `-500฿`
   - ➖ ค่าซ่อมแซม/ความเสียหาย: `-0฿`
   - =====================================
   - 💰 **ยอดเงินคืนสุทธิ (Net Refund)**: Badge in bright green or red.
4. **Footer Action Buttons**: `❌ ยกเลิก` (Dark slate `#475569`) & `📝 ยืนยันการแจ้งย้ายออก` (Primary blue `#2563eb`).

- [ ] **Step 4: Build Check-out Summary Receipt Printable Modal**

Create a clean print-ready receipt view for the landlord and tenant summarizing the check-out transaction.

- [ ] **Step 5: Commit Check-out Modal implementation**

```bash
git add src/app/page.tsx
git commit -m "feat: implement comprehensive Check-out modal with itemized deposit & keycard refund breakdown"
```

---

## Self-Review Checklist

1. **Spec Coverage**: All expanded tenant fields, keycard deposit tracking, emergency contact, check-out calculation, and late keycard refund handlers are covered.
2. **Types & Consistency**: Field names match Prisma model verbatim (`securityDeposit`, `keycardCount`, `keycardDeposit`, `emergencyName`, `emergencyRel`, `emergencyPhone`).
3. **Button Consistency**: All cancel buttons use `className={`${styles.btn} ${styles.btnSecondary}`}` with centered text.
