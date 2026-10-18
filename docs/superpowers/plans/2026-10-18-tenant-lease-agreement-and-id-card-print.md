# Tenant Lease Agreement & ID Card Print System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete A4 print and generation system for Thai apartment lease agreements (สัญญาเช่าห้องพัก ๓ หน้า), asset/furniture rental contracts (สัญญาเช่าทรัพย์สิน ๒ หน้า), apartment rules (กฎระเบียบ ๑ หน้า), and tenant ID card attachments (ใบแนบสำเนาบัตรประชาชนพร้อมลายน้ำ PDPA ๑ หน้า) using data from new tenant registration.

**Architecture:** 
1. Database schema extension on `Tenant` model in Prisma (SQLite/D1) to store compressed watermarked ID card images (Base64) and second tenant details.
2. Client-side canvas utility to automatically compress and burn translucent legal watermarks into ID card photos before saving.
3. Enhanced `CheckInModal` and `EditTenantModal` with ID card preview, co-tenant accordion, contract duration selector (default 6 months), and rent share split (1,000 THB room rent + remainder asset rent).
4. A dedicated, high-fidelity A4 printable component (`LeaseAgreementModal.tsx`) matching the user's exact 6-page contract + 1-page ID card attachment with page selection checkboxes and standard browser print/Save as PDF engine.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Prisma ORM (SQLite / Cloudflare D1), HTML5 Canvas, CSS `@media print`.

## Global Constraints
- Target paper format: standard A4 portrait (`@page { size: A4 portrait; margin: 12mm 15mm; }`).
- Thai typography standard: 'Sarabun', 'TH Sarabun New', sans-serif.
- Default contract duration: 6 months (adjustable: 1, 3, 6, 12 months).
- Page 4 asset agreement text: *"ซึ่ง ผู้ให้เช่า ได้นำทรัพย์สินมาให้ผู้เช่า เช่าไว้ `[ค่าห้องรวม]` บาท"*.
- Rent share split: clause 2.1 room rent = 1,000 THB, clause 2.2 asset rent = (total rent - 1,000 THB), total rent = total room price.
- ID Card image security: burn diagonal watermark *"ใช้สำหรับทำสัญญาเช่าห้องพัก [ชื่ออพาร์ทเมนท์] เท่านั้น"* on client-side before transmission.

---

### Task 1: Database Schema Migration & Prisma Generation

**Files:**
- Modify: `prisma/schema.prisma:104-145`
- Test: `scripts/test-schema-contract.ts` (scratch test)

**Interfaces:**
- Produces: New fields on `Tenant` (`idCardImage`, `secondTenantName`, `secondTenantNickname`, `secondTenantAge`, `secondTenantIdCard`, `secondTenantAddress`, `secondTenantPhone`, `secondTenantWorkplace`, `secondTenantEmergencyName`, `secondTenantEmergencyRel`, `secondTenantEmergencyPhone`, `secondTenantIdCardImage`, `contractNumber`, `contractDurationMonths`, `roomRentShare`, `assetRentShare`).

- [ ] **Step 1: Add new fields to Tenant model in `prisma/schema.prisma`**

Update `prisma/schema.prisma`:
```prisma
model Tenant {
  id                   String     @id @default(uuid())
  name                 String
  phone                String
  idCard               String?
  address              String?    // ที่อยู่ตามบัตรประชาชน
  email                String?
  lineId               String?
  workplace            String?    // สถานที่ทำงาน/ศึกษา
  
  // Emergency Contact
  emergencyName        String?    // ชื่อผู้ติดต่อฉุกเฉิน
  emergencyRel         String?    // ความสัมพันธ์ (เช่น พ่อ, แม่, น้า, อา)
  emergencyPhone       String?    // เบอร์โทรฉุกเฉิน
  
  // Financial & Keycard Ledger
  securityDeposit      Float      @default(0) // เงินประกันสัญญาเช่า
  keycardCount         Int        @default(0) // จำนวนคีย์การ์ดที่รับไป
  keycardDeposit       Float      @default(0) // เงินมัดจำคีย์การ์ดรวม
  keycardCode          String?    // รหัส/เลขบัตรคีย์การ์ด
  note                 String?    // หมายเหตุ/ข้อตกลงพิเศษ
  
  // Rental Contract Period
  startDate            DateTime   @default(now())
  endDate              DateTime?

  // --- NEW LEASE AGREEMENT & CO-TENANT FIELDS ---
  nickname                   String?    // ชื่อเล่นผู้เช่า ๑
  age                        Int?       // อายุผู้เช่า ๑
  idCardImage                String?    // Base64 Data URL รูปถ่ายบัตรประชาชนผู้เช่า ๑ (ฝังลายน้ำแล้ว)

  // ผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย)
  secondTenantName           String?
  secondTenantNickname       String?
  secondTenantAge            Int?
  secondTenantIdCard         String?
  secondTenantAddress        String?
  secondTenantPhone          String?
  secondTenantWorkplace      String?
  secondTenantEmergencyName  String?
  secondTenantEmergencyRel   String?
  secondTenantEmergencyPhone String?
  secondTenantIdCardImage    String?    // Base64 Data URL รูปถ่ายบัตรประชาชนผู้เช่า ๒

  // ข้อมูลสัญญาเช่า
  contractNumber             String?    // เลขที่สัญญา เช่น 101/2569
  contractDurationMonths     Int        @default(6) // ระยะเวลาสัญญา (เดือน) เช่น 1, 3, 6, 12
  roomRentShare              Float      @default(1000) // ค่าเช่าห้องพัก (บาท)
  assetRentShare             Float?     // ค่าเช่าทรัพย์สิน (บาท) (default: ค่าห้อง - roomRentShare)
  
  // Check-out Status & Keycard Refund Ledger
  status               String     @default("ACTIVE") // "ACTIVE", "CHECKED_OUT"
  checkedOutAt         DateTime?
  noticeDate           DateTime?  // วันที่ผู้เช่าแจ้งย้ายออกล่วงหน้า
  expectedCheckOutDate DateTime?  // วันที่กำหนดจะย้ายออกจริง
  keycardReturnedCount Int        @default(0)
  keycardRefundedAt    DateTime?
  keycardRefundAmount  Float      @default(0)

  // Relations
  roomId               String
  room                 Room       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  invoices             Invoice[]

  @@index([roomId, status])
}
```

- [ ] **Step 2: Run Prisma generate and push schema to database**

Run:
```powershell
npx prisma generate
npx prisma db push
```
Expected: Schema synchronized successfully.

- [ ] **Step 3: Verify schema using test query**

Create `scripts/test-schema-contract.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.tenant.count();
  console.log('Database connection verified, tenant count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```
Run: `node scripts/test-schema-contract.js`  
Expected output: `Database connection verified, tenant count: ...`

- [ ] **Step 4: Commit schema changes**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add lease agreement and co-tenant fields to Tenant model"
```

---

### Task 2: Client-side Watermark Burn-in & Image Compression Utility

**Files:**
- Create: `src/lib/idCardWatermark.ts`
- Test: `scripts/test-watermark.ts`

**Interfaces:**
- Produces: `compressAndWatermarkIdCard(file: File, apartmentName: string): Promise<string>`
  - Takes an uploaded `File` object and the apartment's name.
  - Scales image to max width 1200px (preserving aspect ratio).
  - Draws diagonal translucent watermark band with security text:
    `"ใช้สำหรับทำสัญญาเช่าห้องพัก ${apartmentName} เท่านั้น"`
  - Returns `Promise<string>` containing Base64 Data URL (`data:image/jpeg;base64,...`) compressed to ~100-200 KB.

- [ ] **Step 1: Create `src/lib/idCardWatermark.ts`**

```typescript
/**
 * Utility to compress an ID card image and permanently burn a diagonal security watermark
 * onto the image canvas before uploading to the server.
 */
export async function compressAndWatermarkIdCard(
  file: File,
  apartmentName: string = 'อพาร์ทเมนท์'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('รูปภาพไม่ถูกต้องหรือไม่สามารถเปิดได้'));
      img.onload = () => {
        // Target width: 1200px max
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('ไม่สามารถสร้าง canvas context ได้'));
        }

        // Draw original resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Security Watermark Drawing
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6); // -30 degrees diagonal

        const watermarkText = `ใช้สำหรับทำสัญญาเช่าห้องพัก ${apartmentName} เท่านั้น`;
        const fontSize = Math.max(22, Math.round(width / 32));
        ctx.font = `bold ${fontSize}px 'Sarabun', 'TH Sarabun New', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw translucent dark line & text for high contrast regardless of card brightness
        ctx.fillStyle = 'rgba(220, 38, 38, 0.45)'; // Semi-transparent red
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // White glow/border
        ctx.lineWidth = 3;

        // Dual lines above and below
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const lineYOffset = fontSize * 0.9;

        ctx.beginPath();
        ctx.moveTo(-textWidth / 2 - 20, -lineYOffset);
        ctx.lineTo(textWidth / 2 + 20, -lineYOffset);
        ctx.moveTo(-textWidth / 2 - 20, lineYOffset);
        ctx.lineTo(textWidth / 2 + 20, lineYOffset);
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeText(watermarkText, 0, 0);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();

        // Export as JPEG with 0.82 quality (~120-180 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 2: Commit watermark utility**

```bash
git add src/lib/idCardWatermark.ts
git commit -m "feat: add client-side id card watermark burn-in and compression utility"
```

---

### Task 3: Backend API Updates (`/api/tenants` and `/api/tenants/[id]`)

**Files:**
- Modify: `src/app/api/tenants/route.ts`
- Modify: `src/app/api/tenants/[id]/route.ts`

**Interfaces:**
- Consumes: JSON body with tenant data including contract fields and ID card images.
- Produces: JSON response with created/updated `Tenant` entity.

- [ ] **Step 1: Update `src/app/api/tenants/route.ts` POST handler**

In `src/app/api/tenants/route.ts`:
Extract and pass the new fields to `prisma.tenant.create`:
- `nickname`, `age`, `idCardImage`
- `secondTenantName`, `secondTenantNickname`, `secondTenantAge`, `secondTenantIdCard`, `secondTenantAddress`, `secondTenantPhone`, `secondTenantWorkplace`, `secondTenantEmergencyName`, `secondTenantEmergencyRel`, `secondTenantEmergencyPhone`, `secondTenantIdCardImage`
- `contractNumber`, `contractDurationMonths`, `roomRentShare`, `assetRentShare`
Calculate `endDate` if not provided: `endDate = new Date(startDate.setMonth(startDate.getMonth() + (contractDurationMonths || 6)))`.

- [ ] **Step 2: Update `src/app/api/tenants/[id]/route.ts` PUT handler**

Allow updating all the new fields when editing a tenant via `PUT /api/tenants/[id]`.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit API changes**

```bash
git add src/app/api/tenants/route.ts src/app/api/tenants/\[id\]/route.ts
git commit -m "feat(api): support contract fields and id card images in tenant endpoints"
```

---

### Task 4: UI Enhancements in CheckInModal & EditTenantModal

**Files:**
- Modify: `src/components/modals/CheckInModal.tsx`
- Modify: `src/components/modals/EditTenantModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- CheckInModal Props: Add handlers and states for:
  - `idCardImage`, `setIdCardImage`
  - `nickname`, `setNickname`, `age`, `setAge`
  - `showSecondTenant`, `setShowSecondTenant`
  - `secondTenantName`, `secondTenantNickname`, `secondTenantAge`, `secondTenantIdCard`, `secondTenantAddress`, `secondTenantPhone`, `secondTenantWorkplace`, `secondTenantEmergencyName`, `secondTenantEmergencyRel`, `secondTenantEmergencyPhone`, `secondTenantIdCardImage`, `setSecondTenantIdCardImage`
  - `contractNumber`, `setContractNumber`, `contractDuration`, `setContractDuration`, `roomRentShare`, `setRoomRentShare`, `assetRentShare`, `setAssetRentShare`

- [ ] **Step 1: Add new states and handlers in `src/app/page.tsx`**

Add states for contract duration (default `6`), contract number (auto-populated as `${roomNumber}/${new Date().getFullYear() + 543}`), roomRentShare (default `1000`), second tenant fields, and ID card images with auto watermark invocation via `compressAndWatermarkIdCard`.

- [ ] **Step 2: Update `CheckInModal.tsx` UI**

Add sections in `CheckInModal.tsx`:
1. **Primary Tenant ID Card Section**:
   - Camera/Upload input using `compressAndWatermarkIdCard`.
   - Card preview thumbnail with "✓ ฝังลายน้ำรักษาความปลอดภัยเรียบร้อย" badge and remove button.
   - Age and Nickname inputs.
2. **Co-Tenant Accordion (`ผู้เช่าคนที่ ๒`)**:
   - Collapsible header: `[ + เพิ่มข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย) ]`.
   - ID card scan/upload button with AI OCR support (`target: 'SECOND_TENANT'`).
   - Fields: Name, Nickname, Age, ID Card, Address, Phone, Workplace, Emergency contact, and ID card preview.
3. **Rental Contract Box**:
   - Quick pills: `1 เดือน`, `3 เดือน`, `6 เดือน (แนะนำ)`, `12 เดือน`.
   - Contract number input with auto-generated recommendation.
   - Rent share breakdown:
     - ค่าเช่าห้องพัก: `1,000` บาท
     - ค่าเช่าทรัพย์สิน: `[ ค่าห้องรวม - 1,000 ]` บาท
     - รวมค่าเช่ารายเดือน: `[ ค่าห้องรวม ]` บาท
4. **Post-submission Action**:
   - In `handleCheckInSubmit`, after success, show option to immediately open `LeaseAgreementModal`.

- [ ] **Step 3: Update `EditTenantModal.tsx` UI**

Mirror fields in `EditTenantModal.tsx` so landlords can edit or add second tenant info, contract duration, and replace/view ID card photos anytime.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 5: Commit Check-in & Edit Modal enhancements**

```bash
git add src/app/page.tsx src/components/modals/CheckInModal.tsx src/components/modals/EditTenantModal.tsx
git commit -m "feat(ui): add id card preview, co-tenant accordion, and contract settings to check-in"
```

---

### Task 5: Create A4 Printable LeaseAgreementModal Component

**Files:**
- Create: `src/components/modals/LeaseAgreementModal.tsx`
- Create: `src/components/modals/LeaseAgreementModal.module.css`

**Interfaces:**
- Props:
  - `showModal: boolean`
  - `setShowModal: (val: boolean) => void`
  - `room: any`
  - `tenant: any`
  - `building: any`
  - `property: any`

- [ ] **Step 1: Create `src/components/modals/LeaseAgreementModal.module.css`**

Add high-fidelity styles:
- Screen preview styles: modal overlay, toolbar, scrollable A4 container, shadows, zoom toggle.
- Print styles:
  ```css
  @media print {
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    body {
      background: white !important;
      color: black !important;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
    }
    .a4Page {
      page-break-after: always;
      break-after: page;
      min-height: 270mm;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .noPrint {
      display: none !important;
    }
  }
  ```

- [ ] **Step 2: Create `src/components/modals/LeaseAgreementModal.tsx`**

Implement the 7 pages exactly as in user's provided PDF:
- **Page 1**: สัญญาเช่าห้องพัก (ข้อมูลคู่สัญญา ผู้เช่า ๑ และ ๒)
- **Page 2**: ข้อตกลงสัญญาเช่าห้องพัก (ข้อ ๑ - ๑๓)
- **Page 3**: ลายมือชื่อคู่สัญญาเช่าห้องพัก (ผู้เช่า ๑, ผู้เช่า ๒, ผู้ให้เช่า/ตัวแทน, พยาน)
- **Page 4**: สัญญาเช่าทรัพย์สิน (ข้อ ๑ - ๗)
  - Text: *"ซึ่ง ผู้ให้เช่า ได้นำทรัพย์สินมาให้ผู้เช่า เช่าไว้ [ค่าห้องรวม] บาท"*
  - Clause 2.1: อัตราการเช่าห้องพัก ๑,๐๐๐ บาท
  - Clause 2.2: อัตราการเช่าทรัพย์สินภายในห้องพัก [ค่าห้องรวม - ๑,๐๐๐] บาท
  - รวมค่าเช่าห้องต่อรายเดือน [ค่าห้องรวม] บาท
- **Page 5**: ลายมือชื่อสัญญาเช่าทรัพย์สิน
- **Page 6**: กฎระเบียบสำหรับผู้พักอาศัยในอพาร์ทเมนท์ (ข้อ ๑ - ๑๘)
- **Page 7**: เอกสารแนบท้าย: สำเนาบัตรประจำตัวประชาชน
  - Primary tenant ID card photo with watermark.
  - Signature line:
    ```text
    (ลงชื่อ) .................................................... ผู้เช่า ๑
           ( .................................................... )
                         รับรองสำเนาถูกต้อง
    ```
  - If second tenant exists: second tenant ID card photo and signature line.

- Toolbar features:
  - Checkboxes to include/exclude specific sections before printing.
  - Print button using `window.open` A4 print engine (similar to existing `handlePrintA5`).

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit LeaseAgreementModal**

```bash
git add src/components/modals/LeaseAgreementModal.tsx src/components/modals/LeaseAgreementModal.module.css
git commit -m "feat: implement 7-page A4 LeaseAgreementModal with ID card attachment"
```

---

### Task 6: Dashboard & Room / Tenant Tab Integration & End-to-End Verification

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/modals/RoomModal.tsx`
- Modify: `src/components/tabs/TenantTab.tsx`

**Interfaces:**
- Connects the "📄 พิมพ์สัญญาเช่า" action from RoomModal, TenantTab, and Check-in completion into `LeaseAgreementModal`.

- [ ] **Step 1: Add "พิมพ์สัญญาเช่า" button in `RoomModal.tsx`**

When a room has an active tenant, display a prominent button:
`📄 พิมพ์สัญญาเช่า (Lease Agreement)` next to `แก้ไขข้อมูลผู้เช่า` and `แจ้งย้ายออก`.

- [ ] **Step 2: Add "พิมพ์สัญญา" button in `TenantTab.tsx`**

In the tenant table action column / tenant card, add a print contract button with contract icon.

- [ ] **Step 3: Mount `LeaseAgreementModal` in `src/app/page.tsx`**

Pass the selected room, active tenant, building, and property details.

- [ ] **Step 4: Run full project build and verify**

Run: `npm run build`  
Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Verify runtime flow**

1. Launch `npm run dev`.
2. Test check-in flow with ID card upload -> verify watermark is applied and preview shows.
3. Verify second tenant accordion opens and fields work.
4. Verify contract duration sets end date.
5. Open `LeaseAgreementModal` -> check all 7 pages:
   - Check room price on Page 4 matches total rent.
   - Check rent split (1,000 / rest).
   - Check ID card photo appears on Page 7 with watermark and signature line.
   - Test print preview dialog.

- [ ] **Step 6: Commit integration changes**

```bash
git add src/app/page.tsx src/components/modals/RoomModal.tsx src/components/tabs/TenantTab.tsx
git commit -m "feat: integrate lease agreement print buttons in RoomModal and TenantTab"
```
