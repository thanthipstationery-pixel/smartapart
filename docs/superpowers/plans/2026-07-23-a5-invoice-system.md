# Official A5 Rent Invoice System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the official A5 Printed Rent Invoice System matching the landlord's exact form layout, with smart itemized extra fee mapping, auto-calculated month tenure, and print-ready A5 CSS.

**Architecture:** 
- Extend `Invoice` Prisma model with `bookNo`, `invoiceNoStr`, `otherFeeDetails`, and `otherNote`.
- Update `/api/invoices` API routes to handle itemized extra fee arrays.
- Upgrade Invoice Creator UI to allow adding dynamic extra fee items (e.g. cleaning fee, repair fee) which auto-sum into `otherCost` and concatenate into `otherNote`.
- Create official A5 Print Modal matching the uploaded template layout (black title banner, top-right property box, Thai date/month, room & address format, meter range table, and bottom note).

**Tech Stack:** Next.js 16 (App Router), Prisma, SQLite, CSS Modules / Print Media CSS.

---

## Global Constraints

- Must match the uploaded A5 form layout 100%.
- Billing Period: Show month name only in Thai (e.g. `ประจำเดือน : กรกฎาคม`).
- Remove `ค่าบำรุงหม้อ`.
- Address format: `ที่อยู่ : ห้อง [RoomNo] [BuildingAddressWithoutBuildingNo]`.
- Auto-calculate `เล่มที่` (RoomNo) and `เลขที่` (Stay tenure month index) with manual override available.

---

### Task 1: Extend Database Schema for A5 Invoice Fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add A5 fields to `Invoice` model in `prisma/schema.prisma`**

```prisma
model Invoice {
  id              String      @id @default(uuid())
  roomId          String
  tenantId        String
  billingPeriod   String      // YYYY-MM
  previousWater   Float
  currentWater    Float
  previousElec    Float
  currentElec     Float
  waterCost       Float
  electricityCost Float
  rentCost        Float
  otherCost       Float
  bookNo          String?     // เล่มที่ (e.g. "A3")
  invoiceNoStr    String?     // เลขที่ (e.g. "1")
  otherFeeDetails String?     // JSON String of [{ name, amount }]
  otherNote       String?     // หมายเหตุรวม
  totalAmount     Float
  status          String      @default("UNPAID") // UNPAID, PAID, OVERDUE
  dueDate         DateTime?
  createdAt       DateTime    @default(now())
  room            Room        @relation(fields: [roomId], references: [id])
  tenant          Tenant      @relation(fields: [tenantId], references: [id])
  payments        Payment[]
}
```

- [ ] **Step 2: Sync database schema & generate client**

```bash
cmd /c npx prisma db push
cmd /c npx prisma generate
```

---

### Task 2: Backend API Routes Update (`src/app/api/invoices/route.ts`)

**Files:**
- Modify: `src/app/api/invoices/route.ts`

- [ ] **Step 1: Update POST & GET handlers to compute tenure month index, sum `otherFeeDetails`, and format `otherNote`**

---

### Task 3: Upgrade Invoice Generation Modal with Itemized Extra Fees UI

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add dynamic extra fee item list state in `src/app/page.tsx`**
- [ ] **Step 2: Real-time sum calculation for `otherCost` and live preview of `*** หมายเหตุ`**

---

### Task 4: Official A5 Print-Ready Invoice Modal & Batch Print Component

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Render exact A5 Invoice component with black banner, property box, meter range `( 144 - 153 )`, and bottom note**
- [ ] **Step 2: Add `@media print` CSS for A5 paper sizing**
- [ ] **Step 3: Add batch print button for printing all invoices in an entire building**
