# SmartApart — User Management & RBAC Design Specification

**Document Version:** 1.0  
**Date:** 2026-10-15  
**Author:** Pair Programming Agent & User  
**Status:** Approved for Implementation Planning  

---

## 1. Overview & Business Objectives

SmartApart requires a multi-user management and Role-Based Access Control (RBAC) architecture to support teams operating dormitories and apartments (Owners, Staff, and Auditors/Viewers). In addition to user credentials management, operational accountability must be maintained so that the system tracks which staff member performed critical daily tasks (meter recordings, rent payments, bookings).

### Key Goals
1. **Three-Tier Role Hierarchy:**
   - 👑 **OWNER:** Full 100% administrative authority, user management, database backup/restore, core building/utility configurations.
   - 👔 **STAFF:** Operational access (read/write for meter recording, invoicing, payment collection, tenant check-in/out), with sensitive settings and user management hidden.
   - 👁️ **VIEWER:** Read-only access to view dashboards, maps, invoices, meter data, and financial reports without modification privileges.
2. **Self-Service Password Management:** Fast 1-click password change accessible to all logged-in users from the Top Header profile menu.
3. **Owner-Controlled User Management:** In the Settings tab, an administrative section allowing Owners to add, edit roles, toggle active status, reset passwords, and delete accounts (with strict safety invariants).
4. **Lightweight Operational Accountability (`recordedBy`):** Capturing the operator's display name or username on Meter Readings, Payments, and Bookings.
5. **Two-Layer Security Architecture:** Server-side API authorization guards paired with UI visual adaptation (hidden or disabled controls).

---

## 2. Roles & Permissions Matrix

| Module / Action | 👑 OWNER | 👔 STAFF | 👁️ VIEWER |
|---|:---:|:---:|:---:|
| **Dashboard Overview & Floor Map** | View & Manage | View & Manage | View Only |
| **Meter Readings** | Record / Edit / Delete | Record / Edit | View Only (Buttons disabled) |
| **Invoices & Billing** | Generate / Edit / Print | Generate / Edit / Print | View & Print Only (No Create/Delete) |
| **Payments & Slip Upload** | Collect / Cancel / View | Collect / View | View Only (No Collect) |
| **Tenants (Check-in, Check-out, Transfer)** | Full Management | Full Management | View Only |
| **Reports (Monthly & Yearly P&L)** | Full Access | Full Access | View Only |
| **Change Own Password** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Building & Utility Settings** | Edit & Save | ❌ Hidden / 403 | ❌ Hidden / 403 |
| **Database Backup & Restore** | Export & Restore | ❌ Hidden / 403 | ❌ Hidden / 403 |
| **User Management (CRUD Staff/Viewers)** | Full Management | ❌ Hidden / 403 | ❌ Hidden / 403 |

---

## 3. Database Schema & Migration Strategy

### 3.1 Model Updates (`prisma/schema.prisma`)

#### `Admin` Model
```prisma
model Admin {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // Hashed password (bcrypt)
  name      String   // Display Name
  role      String   @default("OWNER") // "OWNER" | "STAFF" | "VIEWER"
  phone     String?  // Optional contact phone
  isActive  Boolean  @default(true)    // Toggle active status
  createdAt DateTime @default(now())
}
```

#### Operational Accountability Fields
```prisma
model MeterReading {
  // Existing fields...
  recordedBy String?  // Name or username of staff who logged the reading
}

model Payment {
  // Existing fields...
  recordedBy String?  // Name or username of staff who received payment
}

model Booking {
  // Existing fields...
  recordedBy String?  // Name or username of staff who took the booking
}
```

### 3.2 SQL Migration (Local SQLite & Cloudflare D1)

```sql
-- Migration: 20261015_user_management_and_rbac.sql
ALTER TABLE "Admin" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "Admin" ADD COLUMN "phone" TEXT;
ALTER TABLE "Admin" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "MeterReading" ADD COLUMN "recordedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN "recordedBy" TEXT;
ALTER TABLE "Booking" ADD COLUMN "recordedBy" TEXT;
```

*Backward Compatibility Guarantee:* Existing records automatically default `role = 'OWNER'` and `isActive = 1`. Pre-existing meter readings, payments, and bookings will have `recordedBy = NULL` which displays gracefully as "ระบบ (System)".

---

## 4. API Endpoints & Server Security Guards

### 4.1 Authentication & Session
- **`POST /api/auth/login`**:
  - Validates `username`, `password`, and verifies `isActive === true`. If `isActive === false`, rejects with `403` ("บัญชีผู้ใช้นี้ถูกระงับการใช้งาน").
  - Issues JWT containing `{ id, username, name, role }`.
- **`GET /api/auth/me`**:
  - Returns `{ authenticated: true, user: { id, username, name, role } }`.
- **`POST /api/auth/change-password`**:
  - Authenticated session required (any role).
  - Body: `{ currentPassword, newPassword, confirmPassword }`.
  - Verifies current password using `bcrypt.compare`.
  - Validates `newPassword` length (minimum 6 characters).
  - Updates password hash.

### 4.2 User Management (OWNER Only)
- **`GET /api/admin/users`**:
  - Guard: `role === 'OWNER'` (else `403 Forbidden`).
  - Returns `Admin[]` excluding `password` column.
- **`POST /api/admin/users`**:
  - Guard: `role === 'OWNER'`.
  - Body: `{ username, password, name, role, phone }`.
  - Validates username uniqueness and formats role (`OWNER` | `STAFF` | `VIEWER`).
  - Hashes password with `bcrypt.hash(password, 10)`.
- **`PUT /api/admin/users/[id]`**:
  - Guard: `role === 'OWNER'`.
  - Body: `{ name, role, phone, isActive, newPassword? }`.
  - Invariant Check: If target is the current user, prevents self-demotion from `OWNER` or self-deactivation.
  - Updates details; if `newPassword` is supplied, hashes and updates password.
- **`DELETE /api/admin/users/[id]`**:
  - Guard: `role === 'OWNER'`.
  - Invariant Check 1: Cannot delete self (`id !== session.id`).
  - Invariant Check 2: Cannot delete if target is the only remaining `OWNER`.
  - Deletes user record.

### 4.3 Mutation Guards for VIEWER
- Middleware / route handlers on `POST /api/meter-readings`, `POST /api/invoices`, `POST /api/payments`, `POST/PUT /api/tenants/*`, `POST /api/bookings/*`:
  - If token payload `role === 'VIEWER'`, return `403 Forbidden` (`{"error": "บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์แก้ไขข้อมูล"}`).

### 4.4 Backup Endpoints Guard
- `GET /api/admin/backup/export` & `POST /api/admin/backup/restore`:
  - Strictly requires `role === 'OWNER'`. Returns `403` for `STAFF` and `VIEWER`.

---

## 5. UI / UX Specifications

### 5.1 Top Header Profile Component
- **Location:** In `src/app/page.tsx` within `.headerActions` (next to Theme Style palette and Sun/Moon toggle).
- **Trigger Button:** Displays an avatar pill with badge icon (👑, 👔, 👁️) and user name.
- **Dropdown Menu:**
  - Header: User name, `@username`, Role tag (`เจ้าของหอพัก`, `พนักงาน`, `ผู้ตรวจการ`).
  - Action 1: `🔑 เปลี่ยนรหัสผ่านของฉัน (Change Password)` -> opens Change Password Modal.
  - Action 2 (Visible only if `role === 'OWNER'`): `👥 จัดการผู้ใช้งานระบบ (User Management)` -> smooth scrolls / activates Settings tab.
  - Action 3: `🚪 ออกจากระบบ (Logout)`.

### 5.2 Change Password Modal
- Fields:
  1. รหัสผ่านปัจจุบัน (Current Password)
  2. รหัสผ่านใหม่ (New Password, min 6 characters)
  3. ยืนยันรหัสผ่านใหม่ (Confirm Password)
- Feedback: Clear error message if passwords do not match or current password is wrong; success notification on update.

### 5.3 Settings Tab: User Management Section
- **Location:** Section in `src/components/tabs/SettingsTab.tsx`.
- **Visibility:** Rendered **only** when `currentUser.role === 'OWNER'`.
- **Card Header:** Title `👥 จัดการผู้ใช้งานและสิทธิ์เข้าถึงระบบ (User Management & Roles)` with `+ เพิ่มผู้ใช้งานใหม่` button.
- **User Cards / Responsive Table:**
  - Columns:
    - **ชื่อและชื่อผู้ใช้:** Name, `@username`
    - **บทบาท (Role Badge):**
      - 👑 `OWNER (เจ้าของหอพัก)` - Gold / Amber badge
      - 👔 `STAFF (พนักงาน)` - Blue / Indigo badge
      - 👁️ `VIEWER (ผู้ตรวจการ)` - Slate / Emerald badge
    - **เบอร์โทร:** Phone number or `-`
    - **สถานะ:** `🟢 ใช้งานอยู่` / `⚪ ระงับชั่วคราว`
    - **ปุ่มจัดการ:**
      - `✏️ แก้ไข`: Open edit modal (Name, Role, Phone, Active toggle).
      - `🔑 รีเซ็ตรหัส`: Open reset modal for owner to assign a new password.
      - `🗑️ ลบ`: Delete button (disabled with tooltip for self or last owner).

### 5.4 Operational "Recorded By" Badges
- **Meter Tab:** Small subtle tag in meter reading rows: `จดโดย: สมชาย`
- **Invoices / Payment Modal:** In payment history: `ผู้รับชำระ: นก พนักงาน`
- **Booking Modal:** In booking details drawer: `ผู้รับจอง: สมหญิง`

---

## 6. Implementation Verification Plan

1. **Database Migration Verification:**
   - Run SQL migration on local SQLite and Cloudflare D1.
   - Verify `Admin` table has `role`, `phone`, `isActive`.
   - Verify `MeterReading`, `Payment`, `Booking` have `recordedBy`.
2. **API Automated Integration Tests:**
   - Create `scripts/test-rbac-api.mjs`:
     - Test login for OWNER, STAFF, VIEWER.
     - Test `POST /api/auth/change-password` with valid/invalid current passwords.
     - Test user CRUD endpoints with OWNER (200 OK) vs STAFF (403 Forbidden).
     - Test self-deletion and last-owner deletion protection.
     - Test VIEWER mutation rejection (403 Forbidden on meter/payment creation).
     - Test `recordedBy` populated on meter readings, payments, bookings.
3. **Frontend UI Verification:**
   - Log in as OWNER: Verify header dropdown, change password modal, and settings user management.
   - Create a STAFF account: Log in as STAFF, verify backup and user management sections are hidden.
   - Create a VIEWER account: Log in as VIEWER, verify mutation buttons are disabled and read-only mode banner is displayed.
4. **Production Build & Cloudflare Deployment:**
   - Run `tsc --noEmit`.
   - Run `open-next build` and `open-next deploy`.
   - Verify live site on `https://smartapart.ai-pro.workers.dev`.
