# Database Backup & Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างระบบสำรองข้อมูล (Backup) และกู้คืนข้อมูล (Restore) ฐานข้อมูลแบบ 1-Click สำหรับผู้ดูแลระบบ ผ่านหน้าการตั้งค่า (Settings) ด้วยมาตรฐานความปลอดภัย Transactional Whitelist SQL Parser

**Architecture:**
1. โมดูล `src/lib/backupSql.ts` ทำหน้าที่แปลงข้อมูลในฐานข้อมูลทั้ง 12 ตารางเป็นคำสั่ง SQL Dump ที่ Escape อย่างปลอดภัย และแยก/ตรวจสอบคำสั่ง SQL ที่อัปโหลดเข้ามาผ่าน Whitelist Sanitizer
2. Endpoint `GET /api/admin/backup/export` ดึงข้อมูลตามลำดับ Foreign-Key Topological Order และส่งออกเป็นไฟล์ `.sql`
3. Endpoint `POST /api/admin/backup/restore` ตรวจสอบสิทธิ์ Admin, คัดกรองคำสั่ง SQL ผ่าน Sanitizer, และรันคำสั่งทั้งหมดแบบ Atomic Transaction
4. หน้าเว็บ `src/components/tabs/SettingsTab.tsx` เพิ่มส่วนการจัดการฐานข้อมูล ประกอบด้วยปุ่มดาวน์โหลด Backup 1-Click และส่วน Upload Restore พร้อม Modal ยืนยันความปลอดภัย

**Tech Stack:** Next.js (App Router), Prisma Client (WASM/Edge & SQLite), Cloudflare D1 / SQLite, TypeScript, React 19

---

## Global Constraints

- รองรับทั้ง Cloudflare Workers (OpenNext/D1) และ Node.js (Local SQLite)
- ไม่อนุญาตให้ใช้คำสั่งอันตราย (`DROP`, `ALTER`, `CREATE`, `PRAGMA`, `ATTACH`, `DETACH`) ในการ Restore
- ห้ามกระทบ WASM Patches ใน `node_modules`
- Response formats และ UI Styling ต้องสอดคล้องกับระบบเดิมของ SmartApart

---

### Task 1: SQL Dump Generator & Whitelist Sanitizer Utility

**Files:**
- Create: `src/lib/backupSql.ts`
- Test: `scripts/test-backup-sql.mjs`

**Interfaces:**
- `generateSqlDump(data: DatabaseEntities): string`: สร้างข้อความ SQL dump ครบถ้วน
- `parseAndSanitizeSql(sqlContent: string): { valid: boolean; error?: string; statements: string[] }`: แยกและกรองคำสั่ง SQL อย่างเข้มงวด

- [ ] **Step 1: สร้าง `src/lib/backupSql.ts`**

ฟังก์ชันการทำงาน:
1. `ALLOWED_TABLES`: กำหนดรายชื่อตารางที่อนุญาตทั้ง 12 ตาราง
2. `escapeSqlValue(val: any)`: Escape ค่าสตริง, วันที่, Boolean, ตัวเลข, Null ตามมาตรฐาน SQLite
3. `generateSqlDump(dbData)`: สร้างชุดคำสั่ง `DELETE FROM ...` ย้อนกลับ และ `INSERT INTO ...` ตามลำดับ Foreign Key
4. `parseAndSanitizeSql(sql)`: Tokenize คำสั่ง SQL และบล็อกคำสั่งนอกเหนือจาก `DELETE FROM` หรือ `INSERT INTO` ที่มีตารางใน `ALLOWED_TABLES`

- [ ] **Step 2: เขียน Unit Test `scripts/test-backup-sql.mjs`**

ทดสอบ:
1. การ Escape ข้อมูลสตริงที่มี single quote (`'`), newline, null, boolean, float
2. การสร้าง SQL dump ที่มี header, `BEGIN TRANSACTION;`, delete statements, และ insert statements
3. Sanitizer ปฏิเสธคำสั่งอันตราย (`DROP TABLE Room;`, `PRAGMA ...`, `DELETE FROM User;`)
4. Sanitizer ยอมรับเฉพาะคำสั่งที่ถูกต้องตาม Whitelist

- [ ] **Step 3: รันการทดสอบและ Commit**
Run: `node scripts/test-backup-sql.mjs`
Commit: `feat(backup): add SQL dump generator and whitelist sanitizer utility`

---

### Task 2: Backup Export & Restore API Endpoints

**Files:**
- Create: `src/app/api/admin/backup/export/route.ts`
- Create: `src/app/api/admin/backup/restore/route.ts`
- Test: `scripts/test-backup-api.mjs`

**Interfaces:**
- `GET /api/admin/backup/export`: ส่งไฟล์ SQL กลับเป็น attachment (`smartapart_backup_*.sql`)
- `POST /api/admin/backup/restore`: รับ JSON `{ sqlContent: string }` หรือ multipart file และกู้คืนข้อมูลแบบ atomic

- [ ] **Step 1: สร้าง `src/app/api/admin/backup/export/route.ts`**

1. ตรวจสอบ Admin session token ผ่าน `verifyJWT(token)`
2. Query ข้อมูล 12 ตารางผ่าน `prisma`
3. เรียก `generateSqlDump`
4. ส่งกลับเป็น Response พร้อม Header:
   - `Content-Type: application/sql; charset=utf-8`
   - `Content-Disposition: attachment; filename="smartapart_backup_${timestamp}.sql"`

- [ ] **Step 2: สร้าง `src/app/api/admin/backup/restore/route.ts`**

1. ตรวจสอบ Admin session token ผ่าน `verifyJWT(token)`
2. อ่านข้อความ SQL จาก request payload
3. ตรวจสอบผ่าน `parseAndSanitizeSql` (หากไม่ผ่าน คืน HTTP 400 ทันที)
4. รัน statements ใน Atomic Transaction:
   - ใช้ `prisma.$executeRawUnsafe(stmt)` ทีละคำสั่งภายใน `prisma.$transaction(async (tx) => ...)`
5. ส่งผลลัพธ์ `{ success: true, message: 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว', count: statements.length }`

- [ ] **Step 3: เขียน Integration Test `scripts/test-backup-api.mjs`**

1. ทดสอบ Endpoint Export ต้องปฏิเสธคำขอที่ไม่ใส่ Cookie Auth (401)
2. ทดสอบ Export สำเร็จเมื่อมี Auth และได้ Header attachment
3. ทดสอบ Restore ปฏิเสธไฟล์ที่มีคำสั่งอันตราย (400)
4. ทดสอบ Restore กู้คืนข้อมูลสำเร็จ และ Rollback 100% หากคำสั่งผิดพลาด

- [ ] **Step 4: รันการทดสอบและ Commit**
Run: `node scripts/test-backup-api.mjs`
Commit: `feat(api): add admin backup export and transactional restore endpoints`

---

### Task 3: Settings UI Integration (Database & Backups Section)

**Files:**
- Modify: `src/components/tabs/SettingsTab.tsx`

**Interfaces:**
- Section 3: "จัดการฐานข้อมูลและสำรองข้อมูล (Database & Backups)"
- 1-Click Backup Export Button
- File Picker สำหรับ Restore พร้อม Safety Confirmation Modal

- [ ] **Step 1: เพิ่ม UI Card ใน `SettingsTab.tsx`**

1. เพิ่ม Section 3 ต่อท้าย Section 2 ใน `SettingsTab.tsx`
2. สร้าง Card สำหรับสำรองข้อมูล:
   - ปุ่มดาวน์โหลด 1-Click (`GET /api/admin/backup/export`) พร้อม Loading spinner
3. สร้าง Card สำหรับกู้คืนข้อมูล:
   - กล่องเตือนสีส้มแดงเตือนการเขียนทับ
   - Input file รับเฉพาะ `.sql`
   - ปุ่มเปิด Modal ยืนยันการกู้คืน
4. สร้าง Confirmation Modal:
   - แสดงชื่อไฟล์และขนาด
   - ป้องกันการกดพลาดด้วยการกดยืนยันชัดเจน
   - แสดงสถานะกำลังกู้คืนข้อมูล และเรียก `refreshDashboardData()` เมื่อสำเร็จ

- [ ] **Step 2: ตรวจสอบความถูกต้อง TypeScript และ Build**
Run: `npx tsc --noEmit`
Run: `npm run build`

- [ ] **Step 3: Commit**
Commit: `feat(ui): add database backup and restore section to Settings tab`

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-14-database-backup-restore.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
