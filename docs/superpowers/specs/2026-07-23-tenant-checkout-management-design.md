# Tenant & Check-out Management Design Spec

**Date**: 2026-07-23  
**Target System**: Pakdee Apartment Management System  
**Feature**: Expanded Tenant Profile, Keycard Deposit Ledger & Comprehensive Check-out System  

---

## 1. Executive Summary

This design specification details the expansion of the **Tenant & Check-out Management System** for Pakdee Apartment. It expands the tenant profile data model to capture complete personal, emergency, and workplace details, introduces a dual-ledger for Security Deposits and Keycard Deposits, and provides an end-to-end Check-out workflow with final utility calculation, damage deductions, keycard return reconciliation, and late keycard refund capabilities.

---

## 2. Database Schema Changes (`prisma/schema.prisma`)

We will update the `Tenant` model to support expanded fields, keycard tracking, and check-out ledger history.

```prisma
model Tenant {
  id                  String     @id @default(uuid())
  name                String
  phone               String
  idCard              String?
  address             String?    // ที่อยู่ตามบัตรประชาชน
  email               String?
  lineId              String?
  workplace           String?    // สถานที่ทำงาน/ศึกษา
  
  // Emergency Contact
  emergencyName       String?    // ชื่อผู้ติดต่อฉุกเฉิน
  emergencyRel        String?    // ความสัมพันธ์ (เช่น พ่อ, แม่, น้า, อา)
  emergencyPhone      String?    // เบอร์โทรฉุกเฉิน
  
  // Financial & Keycard Ledger
  securityDeposit     Float      @default(0) // เงินประกันสัญญาเช่า
  keycardCount        Int        @default(0) // จำนวนคีย์การ์ดที่รับไป
  keycardDeposit      Float      @default(0) // เงินมัดจำคีย์การ์ดรวม
  keycardCode         String?    // รหัส/เลขบัตรคีย์การ์ด
  note                String?    // หมายเหตุ/ข้อตกลงพิเศษ
  
  // Rental Contract Period
  startDate           DateTime   @default(now())
  endDate             DateTime?
  
  // Check-out Status & Keycard Refund Ledger
  status              String     @default("ACTIVE") // "ACTIVE", "CHECKED_OUT"
  checkedOutAt        DateTime?
  keycardReturnedCount Int       @default(0)
  keycardRefundedAt   DateTime?
  keycardRefundAmount Float      @default(0)

  // Relations
  roomId              String
  room                Room       @relation(fields: [roomId], references: [id])
  invoices            Invoice[]
  createdAt           DateTime   @default(now())
}
```

---

## 3. Backend API Endpoints

### 1. `PUT /api/tenants/[id]`
- **Purpose**: Update tenant profile fields (address, workplace, emergency contact, keycard details, note).
- **Body**: `{ address, workplace, emergencyName, emergencyRel, emergencyPhone, securityDeposit, keycardCount, keycardDeposit, keycardCode, note }`

### 2. `POST /api/tenants/[id]/checkout`
- **Purpose**: Perform room check-out, record final utility meters, calculate deposit deductions, mark room as `VACANT`, and mark tenant as `CHECKED_OUT`.
- **Body**:
  ```json
  {
    "checkOutDate": "2026-07-31",
    "finalWaterValue": 150.0,
    "finalElecValue": 450.0,
    "cleaningFee": 500,
    "repairFee": 0,
    "otherDeductions": 0,
    "keycardsReturned": 2,
    "note": "คืนคีย์การ์ดครบ 2 ใบ"
  }
  ```
- **Calculation Logic**:
  1. Final Water Cost = `(finalWaterValue - prevWater) * building.waterRate`
  2. Final Elec Cost = `(finalElecValue - prevElec) * building.electricityRate`
  3. Keycard Refund = `(keycardsReturned / keycardCount) * keycardDeposit`
  4. Total Deductions = `Final Water + Final Elec + Unpaid Invoices + Cleaning Fee + Repair Fee + Other Deductions`
  5. Net Refund = `(securityDeposit + Keycard Refund) - Total Deductions`
- **Actions**:
  - Update `Tenant.status = "CHECKED_OUT"`, `Tenant.endDate = checkOutDate`, `Tenant.keycardReturnedCount = keycardsReturned`.
  - Record final `MeterReading`.
  - Update `Room.status = "VACANT"`.

### 3. `POST /api/tenants/[id]/refund-keycard`
- **Purpose**: Allow refunding keycard deposit later if tenant returns keycards after initial check-out.
- **Body**: `{ returnedCount: 1, refundAmount: 100 }`
- **Actions**: Update `Tenant.keycardRefundedAt = now()`, `Tenant.keycardRefundAmount = refundAmount`.

---

## 4. User Interface & Workflow

### A. Check-in Modal (Registration)
- Updated with clean tabbed / grid sections:
  1. **ข้อมูลส่วนตัว**: ชื่อ, เบอร์โทร (เฉพาะตัวเลข), เลขบัตรประชาชน, ที่อยู่ตามบัตรฯ, สถานที่ทำงาน/ศึกษา
  2. **ผู้ติดต่อกรณีฉุกเฉิน**: ชื่อผู้ติดต่อ, ความสัมพันธ์ (ดรอปดาวน์/พิมพ์: พ่อ, แม่, น้า, อา, พี่น้อง, เพื่อน), เบอร์โทร
  3. **เงินประกัน & คีย์การ์ด**: เงินประกันสัญญา (บาท), จำนวนคีย์การ์ด (ใบ), เงินมัดจำคีย์การ์ด (บาท), เลขรหัสคีย์การ์ด
  4. **มิเตอร์แรกเข้า & หมายเหตุ**

### B. Tenant Profile Modal
- View and edit complete tenant profile details.
- High-contrast, clean layout with emergency contact quick-call badge.

### C. Check-out Modal (แจ้งย้ายออก)
- **Step 1**: วันที่ย้ายออก & กรอกมิเตอร์น้ำ-ไฟวันย้ายออกจริง (แสดงมิเตอร์ครั้งก่อนอ้างอิง)
- **Step 2**: การคืนคีย์การ์ด (เลือกจำนวนคีย์การ์ดที่นำมาคืน)
- **Step 3**: สรุปรายการหักและยอดคืนประกันสุทธิ (แสดงการคำนวณแบบโปร่งใส):
  - 💵 เงินมัดจำประกันสัญญา: `+3,000฿`
  - 🔑 เงินมัดจำคีย์การ์ด (คืน 2/2 ใบ): `+200฿`
  - 💧 ค่าน้ำเดือนสุดท้าย: `-150฿`
  - ⚡ ค่าไฟเดือนสุดท้าย: `-350฿`
  - 🧹 ค่าทำความสะอาดห้อง: `-500฿`
  - 🔴 ค่าน้ำไฟ/ค่าเช่าค้างชำระ: `-0฿`
  - -------------------------------------
  - 💰 **ยอดเงินคืนสุทธิ**: `= 2,200฿`
- **Step 4**: ปุ่มพิมพ์/บันทึก **ใบสรุปการย้ายออก (Check-out Receipt)**

---

## 5. Verification Plan

### Automated / API Verification
1. Run `npx prisma db push` to verify database schema migration.
2. Execute test POST to `/api/tenants/[id]/checkout` to confirm correct calculation of final utility meters, keycard refund logic, and room status transition to `VACANT`.

### Manual Verification
1. Check-in a new tenant with address, workplace, emergency contact relation, and keycard deposit.
2. Open Check-out modal for an occupied room and test both complete keycard returns and partial/late returns.
3. Verify mobile responsiveness and high-contrast styling across all check-out modals.
