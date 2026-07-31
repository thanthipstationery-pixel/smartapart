# Tenant Management Enhancements & Room Transfer System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cancel Check-in (`ยกเลิกการเข้าพัก`), Edit Contract Start Date (`แก้ไขวันที่เริ่มสัญญาเช่า`), and Automated Room Transfer (`ระบบย้ายห้องพักอัตโนมัติ`) features to SmartApart.

**Architecture:** Extend existing API routes (`/api/tenants/[id]`), create `/api/tenants/[id]/transfer`, update `RoomModal` and `EditTenantModal`, and add `RoomTransferModal` component.

**Tech Stack:** Next.js 16 (App Router), Prisma ORM, SQLite, React (Client Components).

## Global Constraints
- Language requirement: All user UI labels and messages MUST be in 100% Thai language.
- Zero regression: Preserve all existing billing rules and modal state behaviors.

---

### Task 1: API Endpoint `DELETE /api/tenants/[id]` (Cancel Check-in Backend)

**Files:**
- Modify: `src/app/api/tenants/[id]/route.ts`

**Interfaces:**
- Consumes: Prisma `tenant`, `room`, `invoice`, `payment`, `meterReading`.
- Produces: `DELETE /api/tenants/[id]` API handler that hard deletes check-in data and sets room status to `VACANT`.

- [ ] **Step 1: Write DELETE route implementation in `src/app/api/tenants/[id]/route.ts`**

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true, invoices: { include: { payments: true } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete payments for tenant's invoices
      const invoiceIds = tenant.invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
      }

      // 2. Delete tenant invoices
      await tx.invoice.deleteMany({
        where: { tenantId: id },
      });

      // 3. Delete initial meter readings for room during tenant stay
      await tx.meterReading.deleteMany({
        where: { roomId: tenant.roomId, recordedBy: 'CHECK_IN' },
      });

      // 4. Delete tenant record
      await tx.tenant.delete({
        where: { id },
      });

      // 5. Reset room status to VACANT
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      });
    });

    return NextResponse.json({ success: true, message: 'ยกเลิกการเข้าพักและคืนสถานะห้องว่างเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error cancelling check-in:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการเข้าพัก' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit Backend Endpoint**
Run build check to verify syntax.

---

### Task 2: API Endpoint `POST /api/tenants/[id]/transfer` (Room Transfer Backend)

**Files:**
- Create: `src/app/api/tenants/[id]/transfer/route.ts`

**Interfaces:**
- Consumes: Target room ID, source/target meter values, transfer date.
- Produces: Atomic transaction API for room transfer.

- [ ] **Step 1: Create `src/app/api/tenants/[id]/transfer/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      targetRoomId,
      sourceWaterMeter,
      sourceElecMeter,
      targetWaterMeter,
      targetElecMeter,
      transferDate,
      note,
    } = await request.json();

    if (!targetRoomId) {
      return NextResponse.json({ error: 'กรุณาระบุห้องพักปลายทาง' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้เช่า' }, { status: 404 });
    }

    const targetRoom = await prisma.room.findUnique({
      where: { id: targetRoomId },
    });

    if (!targetRoom || targetRoom.status !== 'VACANT') {
      return NextResponse.json({ error: 'ห้องพักปลายทางไม่อยู่ในสถานะว่าง' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dateObj = transferDate ? new Date(transferDate) : new Date();

      // 1. Record final meter reading for source room
      if (sourceWaterMeter !== undefined || sourceElecMeter !== undefined) {
        await tx.meterReading.create({
          data: {
            roomId: tenant.roomId,
            waterValue: sourceWaterMeter ? parseFloat(sourceWaterMeter) : 0,
            electricityValue: sourceElecMeter ? parseFloat(sourceElecMeter) : 0,
            readingDate: dateObj,
            recordedBy: 'ROOM_TRANSFER_OUT',
          },
        });
      }

      // 2. Record starting meter reading for target room
      if (targetWaterMeter !== undefined || targetElecMeter !== undefined) {
        await tx.meterReading.create({
          data: {
            roomId: targetRoomId,
            waterValue: targetWaterMeter ? parseFloat(targetWaterMeter) : 0,
            electricityValue: targetElecMeter ? parseFloat(targetElecMeter) : 0,
            readingDate: dateObj,
            recordedBy: 'ROOM_TRANSFER_IN',
          },
        });
      }

      // 3. Update source room to VACANT
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: 'VACANT' },
      });

      // 4. Update target room to OCCUPIED
      await tx.room.update({
        where: { id: targetRoomId },
        data: { status: 'OCCUPIED' },
      });

      // 5. Transfer tenant to target room & update note
      const oldRoomNumber = tenant.room.number;
      const transferLog = `[ย้ายห้องจาก ${oldRoomNumber} ไป ${targetRoom.number} เมื่อ ${dateObj.toISOString().split('T')[0]}] ${note || ''}`;
      const updatedNote = tenant.note ? `${tenant.note}\n${transferLog}` : transferLog;

      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: {
          roomId: targetRoomId,
          note: updatedNote,
        },
      });

      return updatedTenant;
    });

    return NextResponse.json({ success: true, tenant: result });
  } catch (error) {
    console.error('Error transferring room:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการย้ายห้องพัก' }, { status: 500 });
  }
}
```

---

### Task 3: UI Updates for `EditTenantModal.tsx` & `RoomModal.tsx`

**Files:**
- Modify: `src/components/modals/EditTenantModal.tsx`
- Modify: `src/components/modals/RoomModal.tsx`

**Interfaces:**
- Add `editTenantStartDate` / `setEditTenantStartDate` in `EditTenantModal.tsx`.
- Add `handleCancelCheckIn` and `handleOpenRoomTransferModal` in `RoomModal.tsx`.

- [ ] **Step 1: Add `startDate` input in `EditTenantModal.tsx`**

Add `editTenantStartDate` prop and date picker field inside `Category 1: ข้อมูลส่วนตัวผู้เช่าหลัก`:
```tsx
<div className={styles.formGroup} style={{ margin: 0 }}>
  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
    📅 วันที่เริ่มสัญญาเช่า (พ.ศ.) *
  </label>
  <input
    type="date"
    required
    value={editTenantStartDate}
    onChange={(e) => setEditTenantStartDate(e.target.value)}
    className={styles.formInput}
  />
</div>
```

- [ ] **Step 2: Add `Cancel Check-in` & `Transfer Room` buttons in `RoomModal.tsx`**

Inside `RoomModal.tsx` for OCCUPIED rooms, add buttons:
```tsx
<button
  type="button"
  className={`${styles.btn} ${styles.btnSecondary}`}
  style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', fontWeight: 'bold' }}
  onClick={() => handleOpenRoomTransferModal(selectedRoom)}
>
  🔄 ย้ายห้องพัก
</button>

<button
  type="button"
  className={`${styles.btn} ${styles.btnSecondary}`}
  style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', fontWeight: 'bold' }}
  onClick={() => handleCancelCheckIn(selectedRoom.tenants[0]?.id)}
>
  🗑️ ยกเลิกการเข้าพัก
</button>
```

---

### Task 4: UI Component `RoomTransferModal.tsx` (Automated Room Transfer Wizard)

**Files:**
- Create: `src/components/modals/RoomTransferModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Component for executing room transfer.

- [ ] **Step 1: Create `src/components/modals/RoomTransferModal.tsx`**

```tsx
'use client';

import React, { useState } from 'react';

interface RoomTransferModalProps {
  showTransferModal: boolean;
  setShowTransferModal: (val: boolean) => void;
  selectedRoom: any;
  vacantRooms: any[];
  handleExecuteTransfer: (data: any) => Promise<void>;
  styles: any;
}

export default function RoomTransferModal({
  showTransferModal,
  setShowTransferModal,
  selectedRoom,
  vacantRooms,
  handleExecuteTransfer,
  styles,
}: RoomTransferModalProps) {
  const [targetRoomId, setTargetRoomId] = useState('');
  const [sourceWater, setSourceWater] = useState('');
  const [sourceElec, setSourceElec] = useState('');
  const [targetWater, setTargetWater] = useState('');
  const [targetElec, setTargetElec] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!showTransferModal || !selectedRoom) return null;

  const activeTenant = selectedRoom.tenants?.[0];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoomId) return alert('กรุณาเลือกห้องพักปลายทาง');
    setSubmitting(true);
    try {
      await handleExecuteTransfer({
        targetRoomId,
        sourceWaterMeter: sourceWater,
        sourceElecMeter: sourceElec,
        targetWaterMeter: targetWater,
        targetElecMeter: targetElec,
        transferDate,
        note,
      });
      setShowTransferModal(false);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการย้ายห้องพัก');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🔄 ทำรายการย้ายห้องพัก - ห้อง {selectedRoom.number}</h2>
          <button className={styles.modalClose} onClick={() => setShowTransferModal(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div>ผู้เช่า: <strong>{activeTenant?.name || '-'}</strong> (เบอร์โทร: {activeTenant?.phone || '-'})</div>
                <div>ห้องเดิม: <strong>{selectedRoom.number} ({selectedRoom.floor?.building?.name})</strong></div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เลือกห้องพักใหม่ปลายทาง (เฉพาะห้องว่าง) *</label>
                <select className={styles.formSelect} required value={targetRoomId} onChange={(e) => setTargetRoomId(e.target.value)}>
                  <option value="">-- เลือกห้องว่าง --</option>
                  {vacantRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      ห้อง {r.number} ({r.floor?.building?.name}) - ค่าเช่า {r.basePrice.toLocaleString()} บ./เดือน
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์น้ำวันย้ายออก (ห้องเดิม {selectedRoom.number})</label>
                  <input type="number" step="any" className={styles.formInput} value={sourceWater} onChange={(e) => setSourceWater(e.target.value)} placeholder="ค่าน้ำสุดท้าย" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์ไฟวันย้ายออก (ห้องเดิม {selectedRoom.number})</label>
                  <input type="number" step="any" className={styles.formInput} value={sourceElec} onChange={(e) => setSourceElec(e.target.value)} placeholder="ค่าไฟสุดท้าย" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์น้ำเริ่มต้น (ห้องใหม่)</label>
                  <input type="number" step="any" className={styles.formInput} value={targetWater} onChange={(e) => setTargetWater(e.target.value)} placeholder="ค่าน้ำเริ่มต้น" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์ไฟเริ่มต้น (ห้องใหม่)</label>
                  <input type="number" step="any" className={styles.formInput} value={targetElec} onChange={(e) => setTargetElec(e.target.value)} placeholder="ค่าไฟเริ่มต้น" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>วันที่ทำรายการย้ายห้อง *</label>
                <input type="date" required className={styles.formInput} value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>หมายเหตุเพิ่มเติม</label>
                <input type="text" className={styles.formInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ย้ายเนื่องจากต้องการห้องชั้นล่าง" />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btn} onClick={() => setShowTransferModal(false)}>ยกเลิก</button>
            <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.btnPrimary}`} style={{ backgroundColor: '#7c3aed' }}>
              {submitting ? '⏳ กำลังย้ายห้อง...' : '🚀 ยืนยันการย้ายห้องพัก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 5: Integration in `src/app/page.tsx` & Build Verification

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Connect State and Handlers in `src/app/page.tsx`**
  - Add state `showTransferModal`, `handleExecuteTransfer`, `handleCancelCheckIn`, `editTenantStartDate`.
  - Pass handlers into `RoomModal`, `EditTenantModal`, and `RoomTransferModal`.

- [ ] **Step 2: Run Build Verification**
  - Execute: `cmd /c "if exist .next rmdir /s /q .next && npm run build"`
  - Verify `✓ Compiled successfully`.
