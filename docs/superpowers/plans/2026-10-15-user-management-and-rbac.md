# User Management & RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete User Management & Role-Based Access Control (RBAC) system for SmartApart with 3 user roles (`OWNER`, `STAFF`, `VIEWER`), self-service password changing, owner-controlled user administration, operational accountability via `recordedBy` tracking, and server-side API authorization guards.

**Architecture:** Extend SQLite/Prisma `Admin` schema with `role`, `phone`, `isActive` and operational models (`MeterReading`, `Payment`, `Booking`) with `recordedBy`. Enhance JWT auth cookies to encode roles. Enforce server-side security guards for mutations and owner-only endpoints. Build a Top Header profile popover with a Change Password modal, and embed a full User Management administrative suite into the Settings tab.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma (WASM driver adapter for Cloudflare D1 / SQLite), bcryptjs, jose (JWT).

## Global Constraints
- Target platform: Cloudflare Workers (OpenNext) with Cloudflare D1 & Node.js SQLite.
- WASM client preservation: Every time `prisma generate` is run, immediately execute `node scripts/patch-wasm.js`.
- Security: Passwords must always be hashed with `bcryptjs` (cost factor 10); passwords must never be returned in API responses.
- Invariants:
  1. No self-deletion (an admin cannot delete their own account).
  2. Last owner protection (the system must never delete or demote the last remaining `OWNER`).
  3. Deactivated users (`isActive: false`) must be blocked from logging in.
  4. `VIEWER` role cannot execute mutations (`POST`, `PUT`, `DELETE`).
  5. Only `OWNER` can access Database Backup/Restore and User Management.

---

### Task 1: Database Schema Migration & Model Updates

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261015_user_management_and_rbac.sql`
- Test: `scripts/test-task-1-schema.mjs`

**Interfaces:**
- Produces: Updated Prisma Client with `role`, `phone`, `isActive` on `Admin`, and `recordedBy` on `MeterReading`, `Payment`, and `Booking`.

- [ ] **Step 1: Write the failing test for schema updates**

Create `scripts/test-task-1-schema.mjs`:
```javascript
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma.js';

async function testSchema() {
  console.log('Testing schema extensions...');
  
  // 1. Check Admin fields
  const admin = await prisma.admin.findFirst();
  assert(admin, 'Admin record should exist');
  assert('role' in admin, 'Admin must have role property');
  assert('phone' in admin, 'Admin must have phone property');
  assert('isActive' in admin, 'Admin must have isActive property');
  assert.strictEqual(admin.role, 'OWNER', 'Default admin should have role OWNER');
  assert.strictEqual(admin.isActive, true, 'Default admin should be active');

  console.log('✅ Task 1 schema tests passed!');
  await prisma.$disconnect();
}

testSchema().catch((err) => {
  console.error('❌ Schema test failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-task-1-schema.mjs`  
Expected: FAIL (fields do not exist yet on Prisma Client or database table).

- [ ] **Step 3: Update `prisma/schema.prisma` and create SQL migration**

In `prisma/schema.prisma`, update the `Admin` model and add `recordedBy` to operational models:
```prisma
model Admin {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // Hashed password
  name      String
  role      String   @default("OWNER") // "OWNER" | "STAFF" | "VIEWER"
  phone     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model MeterReading {
  id          String   @id @default(uuid())
  roomId      String
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  readingDate DateTime @default(now())
  waterUnits  Float
  elecUnits   Float
  note        String?
  recordedBy  String?
  createdAt   DateTime @default(now())

  @@index([roomId, readingDate])
}

model Payment {
  id            String   @id @default(uuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amountPaid    Float
  paymentDate   DateTime @default(now())
  paymentMethod String
  recordedBy    String?
  createdAt     DateTime @default(now())
}

model Booking {
  id                  String   @id @default(uuid())
  roomId              String
  room                Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  customerName        String
  customerPhone       String
  customerIdCard      String?
  customerEmail       String?
  customerLineId      String?
  bookingDate         DateTime @default(now())
  expectedCheckInDate DateTime
  depositAmount       Float    @default(0)
  paymentMethod       String?
  slipImage           String?
  note                String?
  status              String   @default("ACTIVE")
  recordedBy          String?
  createdAt           DateTime @default(now())
}
```

Create `prisma/migrations/20261015_user_management_and_rbac.sql`:
```sql
ALTER TABLE "Admin" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "Admin" ADD COLUMN "phone" TEXT;
ALTER TABLE "Admin" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "MeterReading" ADD COLUMN "recordedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN "recordedBy" TEXT;
ALTER TABLE "Booking" ADD COLUMN "recordedBy" TEXT;
```

Apply migration to local SQLite `prisma/dev.db`:
Execute SQLite statements via node script or sqlite3 command.

Run Prisma generate and WASM patch:
```bash
npx prisma generate
node scripts/patch-wasm.js
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-task-1-schema.mjs`  
Expected: PASS (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261015_user_management_and_rbac.sql scripts/test-task-1-schema.mjs
git commit -m "feat(db): add user roles, status, and recordedBy fields to schema"
```

---

### Task 2: JWT Auth & Self-Service Password Change API

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/auth/change-password/route.ts`
- Create: `scripts/test-task-2-auth.mjs`

**Interfaces:**
- Consumes: `prisma.admin` from Task 1.
- Produces:
  - `signJWT(payload: { id: string, username: string, name: string, role: string })`
  - `verifyJWT(token: string): Promise<{ id: string, username: string, name: string, role: string } | null>`
  - `POST /api/auth/change-password`: `{ currentPassword, newPassword, confirmPassword }` -> `{ success: true, message: string }`

- [ ] **Step 1: Write the failing integration test**

Create `scripts/test-task-2-auth.mjs`:
```javascript
import assert from 'node:assert';
import { signJWT, verifyJWT } from '../src/lib/auth.js';

async function testAuth() {
  console.log('Testing JWT signing and verification with role...');
  
  const token = await signJWT({
    id: 'test-admin-id',
    username: 'admin',
    name: 'Admin User',
    role: 'OWNER'
  });
  
  assert(token, 'Token must be generated');
  const payload = await verifyJWT(token);
  assert(payload, 'Payload must be verifiable');
  assert.strictEqual(payload.role, 'OWNER', 'Payload must contain role');
  assert.strictEqual(payload.id, 'test-admin-id', 'Payload must contain user ID');

  console.log('✅ Task 2 auth unit tests passed!');
}

testAuth().catch((err) => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-task-2-auth.mjs`  
Expected: FAIL (types and signJWT do not yet accept `id` and `role`).

- [ ] **Step 3: Implement Auth Updates and Change Password Endpoint**

1. In `src/lib/auth.ts`:
```typescript
export interface JWTPayloadData {
  id?: string;
  username: string;
  name: string;
  role?: string;
}

export async function signJWT(payload: JWTPayloadData): Promise<string> {
  const secretKey = getJwtSecret();
  return new SignJWT({
    id: payload.id || '',
    username: payload.username,
    name: payload.name,
    role: payload.role || 'OWNER',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<JWTPayloadData | null> {
  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string | undefined,
      username: payload.username as string,
      name: payload.name as string,
      role: (payload.role as string) || 'OWNER',
    };
  } catch {
    return null;
  }
}
```

2. In `src/app/api/auth/login/route.ts`:
Verify `admin.isActive`:
```typescript
    if (admin.isActive === false) {
      return NextResponse.json(
        { error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 403 }
      );
    }
```
Include `id` and `role` in JWT token and response:
```typescript
    const token = await signJWT({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
```

3. In `src/app/api/auth/me/route.ts`:
Return `id` and `role`:
```typescript
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        username: payload.username,
        name: payload.name,
        role: payload.role || 'OWNER',
      },
    });
```

4. Create `src/app/api/auth/change-password/route.ts`:
Handles self-service password update for any authenticated user.
- Checks `cookies().get('admin_session')`.
- Verifies `currentPassword` with `bcrypt.compare`.
- Validates `newPassword` length (>= 6 chars).
- Hashes `newPassword` and updates `prisma.admin`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-task-2-auth.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/login/route.ts src/app/api/auth/me/route.ts src/app/api/auth/change-password/route.ts scripts/test-task-2-auth.mjs
git commit -m "feat(auth): add role to JWT, enforce active status, and add change-password endpoint"
```

---

### Task 3: User Management CRUD Endpoints (OWNER Only)

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `scripts/test-task-3-user-crud.mjs`

**Interfaces:**
- Consumes: `prisma.admin`, `verifyJWT`.
- Produces:
  - `GET /api/admin/users`: returns array of `{ id, username, name, role, phone, isActive, createdAt }`.
  - `POST /api/admin/users`: `{ username, password, name, role, phone }` -> creates user with hashed password.
  - `PUT /api/admin/users/[id]`: `{ name, role, phone, isActive, newPassword? }` -> updates user, prevents self-demotion/deactivation.
  - `DELETE /api/admin/users/[id]`: deletes user, prevents self-deletion and last-owner deletion.

- [ ] **Step 1: Write integration test for User CRUD & Security Invariants**

Create `scripts/test-task-3-user-crud.mjs`:
Verifies:
1. `GET /api/admin/users` requires `role === 'OWNER'`.
2. `POST /api/admin/users` creates `STAFF` and `VIEWER`.
3. `PUT /api/admin/users/[id]` prevents owner from demoting self when sole owner.
4. `DELETE /api/admin/users/[id]` prevents self-deletion.
5. `DELETE /api/admin/users/[id]` prevents deleting the last remaining OWNER.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-task-3-user-crud.mjs`  
Expected: FAIL (endpoints do not exist).

- [ ] **Step 3: Implement User CRUD Routes**

1. Create `src/app/api/admin/users/route.ts`:
```typescript
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

async function checkOwnerAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'OWNER') return null;
  return payload;
}

export async function GET() {
  const session = await checkOwnerAuth();
  if (!session) {
    return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น' }, { status: 403 });
  }

  const users = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await checkOwnerAuth();
  if (!session) {
    return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น' }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, name, role = 'STAFF', phone } = body || {};

  if (!username || !password || !name) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลชื่อ, Username และรหัสผ่านให้ครบถ้วน' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = await prisma.admin.findUnique({ where: { username: cleanUsername } });
  if (existing) {
    return NextResponse.json({ error: 'Username นี้ถูกใช้งานแล้ว' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  const newUser = await prisma.admin.create({
    data: {
      username: cleanUsername,
      password: hashedPassword,
      name: name.trim(),
      role: ['OWNER', 'STAFF', 'VIEWER'].includes(role) ? role : 'STAFF',
      phone: phone ? phone.trim() : null,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, user: newUser }, { status: 201 });
}
```

2. Create `src/app/api/admin/users/[id]/route.ts`:
Implements `PUT` and `DELETE` enforcing all 5 invariants:
- Prevents self-deletion.
- Prevents deleting the last owner.
- Prevents demoting self if sole owner.
- Allows updating details and resetting passwords.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-task-3-user-crud.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/users/route.ts src/app/api/admin/users/[id]/route.ts scripts/test-task-3-user-crud.mjs
git commit -m "feat(api): add admin user management CRUD routes with role protection"
```

---

### Task 4: Operational Accountability (`recordedBy`) & Role Mutation Guards

**Files:**
- Modify: `src/app/api/meter-readings/route.ts`
- Modify: `src/app/api/payments/route.ts`
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/app/api/admin/backup/export/route.ts`
- Modify: `src/app/api/admin/backup/restore/route.ts`
- Create: `scripts/test-task-4-guards.mjs`

**Interfaces:**
- Consumes: `verifyJWT` session from cookies.
- Produces:
  - When creating `MeterReading`, `Payment`, `Booking`, sets `recordedBy: session.name || session.username`.
  - Rejects `VIEWER` mutations with `403 Forbidden`.
  - Rejects `STAFF` and `VIEWER` from `/api/admin/backup/*` with `403 Forbidden`.

- [ ] **Step 1: Write integration tests for mutation guards and `recordedBy`**

Create `scripts/test-task-4-guards.mjs`:
- Tests that `VIEWER` receives `403 Forbidden` on POST `/api/meter-readings`.
- Tests that `STAFF` and `OWNER` successfully record meter readings with `recordedBy` saved.
- Tests that `STAFF` receives `403 Forbidden` on GET `/api/admin/backup/export`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-task-4-guards.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement guards and `recordedBy` tracking**

1. In `src/app/api/meter-readings/route.ts`:
- Check user session:
```typescript
const cookieStore = await cookies();
const token = cookieStore.get('admin_session')?.value;
const session = token ? await verifyJWT(token) : null;
if (session?.role === 'VIEWER') {
  return NextResponse.json({ error: 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์บันทึกมิเตอร์' }, { status: 403 });
}
```
- When creating reading:
```typescript
data: {
  // ...
  recordedBy: session?.name || session?.username || 'ระบบ',
}
```

2. In `src/app/api/payments/route.ts`:
- Reject `VIEWER` with 403.
- Save `recordedBy: session?.name || session?.username || 'ระบบ'`.

3. In `src/app/api/bookings/route.ts`:
- Reject `VIEWER` with 403.
- Save `recordedBy: session?.name || session?.username || 'ระบบ'`.

4. In `src/app/api/admin/backup/export/route.ts` and `src/app/api/admin/backup/restore/route.ts`:
- Require `session?.role === 'OWNER'`. If not, return 403.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-task-4-guards.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/meter-readings/route.ts src/app/api/payments/route.ts src/app/api/bookings/route.ts src/app/api/admin/backup/export/route.ts src/app/api/admin/backup/restore/route.ts scripts/test-task-4-guards.mjs
git commit -m "feat(security): enforce VIEWER mutation guards, OWNER backup guards, and record operator names"
```

---

### Task 5: Header Profile Dropdown & Change Password UI

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard.module.css`
- Create: `src/components/modals/ChangePasswordModal.tsx`

**Interfaces:**
- Consumes: `adminUser` state `{ id, username, name, role }` from `GET /api/auth/me`.
- Produces:
  - Header profile button displaying Role badge (👑 / 👔 / 👁️) + username.
  - Dropdown menu with:
    - User Info
    - "🔑 เปลี่ยนรหัสผ่านของฉัน" (opens `ChangePasswordModal`)
    - "👥 จัดการผู้ใช้งานระบบ" (quick anchor to Settings tab if OWNER)
    - "🚪 ออกจากระบบ"
  - `ChangePasswordModal`: Handles password change and feedback alert.
  - Read-Only Banner when `adminUser.role === 'VIEWER'`.

- [ ] **Step 1: Create `src/components/modals/ChangePasswordModal.tsx`**

Modal with fields:
- รหัสผ่านปัจจุบัน (Current Password)
- รหัสผ่านใหม่ (New Password, min 6 characters)
- ยืนยันรหัสผ่านใหม่ (Confirm New Password)
- Submits to `POST /api/auth/change-password`.

- [ ] **Step 2: Update `src/app/dashboard.module.css`**

Add CSS styles for `.profileDropdownMenu`, `.profileDropdownHeader`, `.profileRoleBadge`, `.readOnlyBanner`:
```css
.profileRoleBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.roleOwner {
  background-color: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.roleStaff {
  background-color: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

.roleViewer {
  background-color: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.readOnlyBanner {
  background-color: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 0.5rem 1rem;
  font-size: 0.825rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
```

- [ ] **Step 3: Update `src/app/page.tsx` Header Actions**

- Render profile trigger button with avatar, username, and role badge.
- Open profile popover on click with outside-click dismissal.
- Integrate `ChangePasswordModal`.
- Show read-only banner when `adminUser?.role === 'VIEWER'`.
- Pass `currentUser={adminUser}` into `SettingsTab`.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`  
Expected: PASS (0 errors).

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/ChangePasswordModal.tsx src/app/dashboard.module.css src/app/page.tsx
git commit -m "feat(ui): add header profile popover, role badges, and change password modal"
```

---

### Task 6: Settings Tab - User Management UI Section & Verification

**Files:**
- Modify: `src/components/tabs/SettingsTab.tsx`
- Create: `src/components/modals/UserManagementModal.tsx`
- Modify: `src/components/tabs/MeterTab.tsx` (display `recordedBy`)
- Modify: `src/components/tabs/InvoiceTab.tsx` (display `recordedBy`)

**Interfaces:**
- Consumes: `currentUser: { id: string, username: string, name: string, role: string }` prop.
- Produces:
  - User Management section in Settings tab rendered **only for OWNER**.
  - Hide "Database & Backups" section for non-OWNER users.
  - CRUD operations for users: Add User, Edit User, Reset Password, Delete User.
  - Badges displaying `recordedBy` in Meter readings and Invoices.

- [ ] **Step 1: Create `src/components/modals/UserManagementModal.tsx`**

Provides reusable modal for:
- Mode "create": Name, Username, Initial Password, Role select (`OWNER`, `STAFF`, `VIEWER`), Phone.
- Mode "edit": Name, Role select, Phone, Active status toggle.
- Mode "reset-password": Owner assigns a new password for staff.

- [ ] **Step 2: Update `src/components/tabs/SettingsTab.tsx`**

1. Add `currentUser` prop to `SettingsTabProps`.
2. Guard Database & Backups:
```tsx
{currentUser?.role === 'OWNER' && (
  <div className={styles.sectionCard}>
    {/* Section 1: Database & Backups */}
  </div>
)}
```
3. Add User Management Section:
```tsx
{currentUser?.role === 'OWNER' && (
  <div className={styles.sectionCard}>
    {/* Section: User Management & Roles */}
    {/* Users Table / Responsive Cards with Add User button and Action buttons */}
  </div>
)}
```
4. Handle user list fetching (`GET /api/admin/users`) and state management.

- [ ] **Step 3: Display `recordedBy` badges in MeterTab & InvoiceTab**

1. In `src/components/tabs/MeterTab.tsx`: Show `จดโดย: {r.recordedBy}` badge in reading rows if present.
2. In `src/components/tabs/InvoiceTab.tsx`: Show `ผู้รับเงิน: {p.recordedBy}` in payment history modal.

- [ ] **Step 4: Run full verification suite**

Run all test suites:
```bash
node scripts/test-task-1-schema.mjs
node scripts/test-task-2-auth.mjs
node scripts/test-task-3-user-crud.mjs
node scripts/test-task-4-guards.mjs
node scripts/test-backup-api.mjs
```
Run TypeScript check:
```bash
node ./node_modules/typescript/bin/tsc --noEmit
```
Run Next.js production build:
```bash
npm.cmd run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tabs/SettingsTab.tsx src/components/modals/UserManagementModal.tsx src/components/tabs/MeterTab.tsx src/components/tabs/InvoiceTab.tsx
git commit -m "feat(ui): integrate user management section in Settings tab and display recordedBy badges"
```

---

### Task 7: Production Database Migration & Cloudflare Deployment

**Files:**
- Execute: Cloudflare D1 SQL Migration
- Deploy: OpenNext Cloudflare bundle

- [ ] **Step 1: Execute SQL Migration on Cloudflare D1**

Run Wrangler command:
```bash
node node_modules/wrangler/bin/wrangler.js d1 execute smartapart-db --remote --command "ALTER TABLE Admin ADD COLUMN role TEXT NOT NULL DEFAULT 'OWNER'; ALTER TABLE Admin ADD COLUMN phone TEXT; ALTER TABLE Admin ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1; ALTER TABLE MeterReading ADD COLUMN recordedBy TEXT; ALTER TABLE Payment ADD COLUMN recordedBy TEXT; ALTER TABLE Booking ADD COLUMN recordedBy TEXT;"
```

- [ ] **Step 2: Build OpenNext Cloudflare bundle**

Run:
```bash
node node_modules/@opennextjs/cloudflare/dist/cli/index.js build
```

- [ ] **Step 3: Deploy to Cloudflare Workers**

Run:
```bash
node node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy
```

- [ ] **Step 4: Update `handoff.md` and commit**

Update Version ID in `handoff.md` and commit:
```bash
git add handoff.md
git commit -m "docs: record user management & RBAC deployment and update production version ID"
```
