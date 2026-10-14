# Database Backup & Restore System Design

**Date:** 2026-10-14  
**Author:** Principal Systems & Software Engineer  
**Status:** Approved by User  
**Target Platform:** Next.js (App Router), Cloudflare Workers (OpenNext), Cloudflare D1 (SQLite Engine) & Local SQLite

---

## 1. Overview & Problem Statement

Currently, SmartApart lacks an automated or user-accessible disaster recovery system. In the event of human error (e.g., unintended tenant deletion or corrupted checkout) or database corruption, administrators cannot easily snapshot the database or restore it back to a known-good state.

This specification details an in-app Database Backup & Restore subsystem accessible to verified Admins via the **Settings** page:
1. **One-Click Backup Export**: Exports all application tables in topological foreign-key order into a standard, portable `.sql` dump file.
2. **Safe Transactional Restore**: Accepts an uploaded `.sql` backup file, validates every statement against a strict security whitelist, and restores the full database state atomically.

---

## 2. Security & Architectural Model

### 2.1 Threat Modeling & SQL Injection Mitigation
Directly executing uploaded SQL files is inherently dangerous if unconstrained. An attacker or malicious user could inject `DROP TABLE`, `ALTER TABLE`, `PRAGMA`, or `ATTACH DATABASE` statements to destroy data or compromise server isolation.

**Enforced Security Controls:**
- **Admin Authorization**: All backup endpoints require an active `admin_session` cookie validated via `verifyJWT`. Unauthenticated or non-admin requests are rejected with HTTP 401.
- **Strict SQL Whitelist Parser**:
  - The restore endpoint does NOT pass raw SQL directly to the database.
  - It tokenizes statements and validates that:
    1. Only `DELETE FROM` and `INSERT INTO` statements are accepted.
    2. Target table names strictly match the 12 recognized models:
       - `Property`
       - `Admin`
       - `Building`
       - `Floor`
       - `Room`
       - `Tenant`
       - `Booking`
       - `MeterReading`
       - `Invoice`
       - `Payment`
       - `MeterReplacement`
       - `BuildingMonthlyUtility`
    3. Any statement containing `DROP`, `ALTER`, `CREATE`, `PRAGMA`, `ATTACH`, `DETACH`, or unknown table names will abort the entire operation with HTTP 400.

### 2.2 Atomic Execution & Disaster Invariance
- To prevent partial restores (e.g., tables half-wiped when a later insert fails), all operations are executed within a single atomic database transaction (`prisma.$transaction` or D1 batch).
- If any statement fails, the database automatically rolls back to its exact pre-restore state.

---

## 3. API Specifications

### 3.1 `GET /api/admin/backup/export`

* **Method:** `GET`
* **Auth:** Required (`admin_session`)
* **Behavior:**
  1. Authenticates admin session.
  2. Queries all 12 tables in topological foreign-key order:
     - `Property`
     - `Admin`
     - `Building`
     - `Floor`
     - `Room`
     - `Tenant`
     - `Booking`
     - `MeterReading`
     - `Invoice`
     - `Payment`
     - `MeterReplacement`
     - `BuildingMonthlyUtility`
  3. Generates SQL dump text:
     - Header comments (System version, Export timestamp UTC + TH, Total rows).
     - `BEGIN TRANSACTION;`
     - Reverse-order `DELETE FROM "TableName";` (to safely clear child records before parent records).
     - Standard `INSERT INTO "TableName" ("col1", "col2", ...) VALUES (val1, val2, ...);` with properly escaped quotes, dates, booleans, and nulls.
     - `COMMIT;`
* **Response Headers:**
  - `Content-Type: application/sql`
  - `Content-Disposition: attachment; filename="smartapart_backup_YYYY-MM-DD_HHmmss.sql"`
  - `Cache-Control: no-store`

---

### 3.2 `POST /api/admin/backup/restore`

* **Method:** `POST`
* **Auth:** Required (`admin_session`)
* **Content-Type:** `multipart/form-data` or `application/json` (with `{ sqlContent: string }`)
* **Behavior:**
  1. Authenticates admin session.
  2. Parses SQL string into discrete statements.
  3. Runs security sanitizer check on all statements.
  4. Executes statements in an atomic `$transaction`.
  5. Returns summary of restored tables and row count.
* **Response:**
  - Success (200): `{ success: true, message: "กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว", statementsExecuted: N }`
  - Error (400/500): `{ success: false, error: "ข้อความแจ้งเตือนข้อผิดพลาด" }`

---

## 4. Frontend UI Specifications (`SettingsTab.tsx`)

A dedicated section is added to `SettingsTab.tsx`:
**Section 3: จัดการฐานข้อมูลและสำรองข้อมูล (Database & Backups)**

### 4.1 Card 1: สำรองข้อมูลฐานข้อมูล (Database Backup)
- **Header:** `📦 สำรองข้อมูลฐานข้อมูล (Database Backup)`
- **Body:**
  - Explanatory guide: แนะนำให้สำรองข้อมูลเป็นประจำ หรือก่อนการเปลี่ยนแปลงโครงสร้างอาคารและค่าเช่า
  - Button: `📥 ดาวน์โหลดไฟล์สำรอง (.sql)`
  - State: Shows spinning indicator / "กำลังสร้างไฟล์สำรอง..." while downloading.

### 4.2 Card 2: กู้คืนข้อมูล (Database Restore)
- **Header:** `⚠️ กู้คืนข้อมูลจากไฟล์สำรอง (Database Restore)`
- **Body:**
  - Alert Banner: กล่องแจ้งเตือนสีส้มแดงระบุว่าการกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด
  - File Upload Input: รองรับเฉพาะไฟล์นามสกุล `.sql`
  - Action Button: `กู้คืนข้อมูลทันที` (Disabled จนกว่าจะเลือกไฟล์)
  - **Confirmation Modal / Safety Guard**:
    - Displays selected filename and size.
    - Requires clicking a confirmation button ("ยืนยันการเขียนทับและกู้คืนข้อมูล") to prevent accidental triggers.
    - Success/Failure feedback via Toast / Alert and auto-refreshes dashboard data upon success.

---

## 5. Verification & Testing Plan

1. **Unit & Security Tests (`scripts/test-backup-restore.mjs`)**:
   - `export`: Generates valid SQL with correct table ordering and escaped values.
   - `sanitizer`: Blocks malicious SQL payloads (`DROP TABLE`, `PRAGMA`, arbitrary system tables).
   - `restore`: Populates clean records, restores relationships correctly, and supports roundtrip (Export -> Modify DB -> Restore -> Check matches original).
2. **TypeScript & Build Checks**:
   - `npx tsc --noEmit` passes 0 errors.
   - `npm run build` succeeds on Cloudflare OpenNext.
