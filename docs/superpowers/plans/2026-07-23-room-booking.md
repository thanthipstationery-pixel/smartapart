# Room Booking System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Room Booking (ระบบจองห้องพัก) feature including Prisma database schema updates, backend API endpoints for booking CRUD, check-in conversion, cancellation (refund/forfeit), and a dual-mode (Express vs Full) frontend UI.

**Architecture:** Extend SQLite database via Prisma schema with a `Booking` model. Create API endpoints for creating, listing, checking in, and cancelling bookings. Update Next.js `page.tsx` with a dual-mode booking modal, status badge for "จองแล้ว" (BOOKED), and booking management actions inside the room detail modal.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Prisma Client, SQLite.

## Global Constraints
- Naming & status string: `"BOOKED"` for room status, rendered in Thai UI as `"จองแล้ว"`.
- Booking modes: `"EXPRESS"` and `"FULL"`.
- Backward compatibility: Preserves existing vacant, occupied, and maintenance room flows.

---

### Task 1: Update Prisma Schema & Push Database Changes

**Files:**
- Modify: `prisma/schema.prisma:64-68`
- Database: `prisma/dev.db` (SQLite)

**Interfaces:**
- Consumes: Existing `Room` model
- Produces: `Booking` model and `Room.bookings` relation in `@prisma/client`

- [ ] **Step 1: Update `prisma/schema.prisma`**

Add `bookings Booking[]` relation to `Room` model, and append `model Booking` definition:

```prisma
model Room {
  id               String         @id @default(uuid())
  number           String
  type             String
  basePrice        Float
  waterBillingType String         @default("METER")
  flatWaterCost    Float          @default(0)
  elecBillingType  String         @default("METER")
  flatElecCost     Float          @default(0)
  floorId          String
  floor            Floor          @relation(fields: [floorId], references: [id], onDelete: Cascade)
  status           String         // "VACANT", "OCCUPIED", "MAINTENANCE", "BOOKED"
  tenants          Tenant[]
  readings         MeterReading[]
  invoices         Invoice[]
  bookings         Booking[]
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
  paymentMethod       String?  // "CASH", "TRANSFER"
  slipImage           String?
  note                String?
  status              String   @default("ACTIVE") // "ACTIVE", "CHECKED_IN", "CANCELLED_REFUNDED", "CANCELLED_FORFEITED"
  createdAt           DateTime @default(now())
}
```

- [ ] **Step 2: Run Prisma db push & generate**

Run: `cmd /c npx prisma db push`
Expected: Database schema synchronized and Prisma client generated cleanly.

---

### Task 2: Implement Backend API Endpoints for Bookings

**Files:**
- Create: `src/app/api/bookings/route.ts`
- Create: `src/app/api/bookings/[id]/check-in/route.ts`
- Create: `src/app/api/bookings/[id]/cancel/route.ts`

**Interfaces:**
- Consumes: Prisma `prisma.booking`, `prisma.room`, `prisma.tenant`
- Produces: API JSON endpoints for `/api/bookings`, `/api/bookings/[id]/check-in`, and `/api/bookings/[id]/cancel`

- [ ] **Step 1: Create `src/app/api/bookings/route.ts`**

Implement POST (Create Booking & set room status to `"BOOKED"`) and GET (Fetch bookings):

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const where: any = {};
    if (roomId) where.roomId = roomId;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { room: true },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      roomId,
      customerName,
      customerPhone,
      customerIdCard,
      customerEmail,
      customerLineId,
      expectedCheckInDate,
      depositAmount,
      paymentMethod,
      slipImage,
      note,
    } = await request.json();

    if (!roomId || !customerName || !customerPhone || !expectedCheckInDate) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ห้องพัก, ชื่อผู้จอง, เบอร์โทร, วันย้ายเข้า)' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'ไม่พบห้องพัก' }, { status: 404 });
    if (room.status === 'OCCUPIED') {
      return NextResponse.json({ error: 'ห้องพักนี้มีผู้เช่าอยู่แล้ว ไม่สามารถจองได้' }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          roomId,
          customerName,
          customerPhone,
          customerIdCard: customerIdCard || null,
          customerEmail: customerEmail || null,
          customerLineId: customerLineId || null,
          expectedCheckInDate: new Date(expectedCheckInDate),
          depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
          paymentMethod: paymentMethod || null,
          slipImage: slipImage || null,
          note: note || null,
          status: 'ACTIVE',
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'BOOKED' },
      });

      return newBooking;
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกการจอง' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/bookings/[id]/check-in/route.ts`**

Convert active booking into active tenant (`Tenant`), record initial meters if passed, update `Room.status` to `"OCCUPIED"`, and set `Booking.status` to `"CHECKED_IN"`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { startDate, idCard, email, lineId, startingWaterMeter, startingElecMeter } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    if (booking.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'รายการจองนี้ไม่อยู่ในสถานะที่ทำสัญญาได้' }, { status: 400 });
    }

    const checkInDate = startDate ? new Date(startDate) : new Date();

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: booking.customerName,
          phone: booking.customerPhone,
          idCard: idCard || booking.customerIdCard || null,
          email: email || booking.customerEmail || null,
          lineId: lineId || booking.customerLineId || null,
          startDate: checkInDate,
          roomId: booking.roomId,
        },
      });

      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'OCCUPIED' },
      });

      await tx.booking.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
      });

      if (startingWaterMeter !== undefined || startingElecMeter !== undefined) {
        const waterVal = startingWaterMeter !== undefined && startingWaterMeter !== '' ? parseFloat(startingWaterMeter) : 0.0;
        const elecVal = startingElecMeter !== undefined && startingElecMeter !== '' ? parseFloat(startingElecMeter) : 0.0;

        await tx.meterReading.create({
          data: {
            roomId: booking.roomId,
            waterValue: isNaN(waterVal) ? 0.0 : waterVal,
            electricityValue: isNaN(elecVal) ? 0.0 : elecVal,
            readingDate: checkInDate,
            recordedBy: 'ระบบ (มิเตอร์แรกเข้าจากส่งต่อการจอง)',
          },
        });
      }

      return newTenant;
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error checking in booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการทำสัญญาเข้าพัก' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `src/app/api/bookings/[id]/cancel/route.ts`**

Cancel booking with refund or forfeit action, update `Booking.status`, and set `Room.status` back to `"VACANT"`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // "REFUND" or "FORFEIT"

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    const newStatus = action === 'REFUND' ? 'CANCELLED_REFUNDED' : 'CANCELLED_FORFEITED';

    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: newStatus },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'VACANT' },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' }, { status: 500 });
  }
}
```

---

### Task 3: Implement Dual-Mode Booking Modal & UI Integration in `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css` (for status badges and tab toggle styles if needed)

**Interfaces:**
- Consumes: Backend endpoints `/api/bookings`, `/api/bookings/[id]/check-in`, `/api/bookings/[id]/cancel`
- Produces: Integrated Room Booking UI in main dashboard

- [ ] **Step 1: Add Booking State & Handlers to `page.tsx`**

Add state hooks:
```typescript
const [showBookingModal, setShowBookingModal] = useState(false);
const [bookingMode, setBookingMode] = useState<'EXPRESS' | 'FULL'>('EXPRESS');
const [bookingName, setBookingName] = useState('');
const [bookingPhone, setBookingPhone] = useState('');
const [bookingIdCard, setBookingIdCard] = useState('');
const [bookingEmail, setBookingEmail] = useState('');
const [bookingLineId, setBookingLineId] = useState('');
const [bookingCheckInDate, setBookingCheckInDate] = useState(new Date().toISOString().split('T')[0]);
const [bookingDeposit, setBookingDeposit] = useState('');
const [bookingPaymentMethod, setBookingPaymentMethod] = useState('CASH');
const [bookingSlipImage, setBookingSlipImage] = useState('');
const [bookingNote, setBookingNote] = useState('');
const [activeBooking, setActiveBooking] = useState<any>(null);
```

Implement `handleBookingSubmit`, `handleBookingCheckIn`, and `handleBookingCancel` functions.

- [ ] **Step 2: Update Room Detail Modal for `BOOKED` Status**

When `selectedRoom.status === 'BOOKED'`:
Display the active booking summary (customer name, phone, expected check-in date, deposit amount).
Provide buttons:
1. 📝 **"ทำสัญญาเข้าพัก (Check-in)"**: Triggers `handleBookingCheckIn`
2. ❌ **"ยกเลิกการจอง"**: Prompt for Refund vs Forfeit deposit and calls `handleBookingCancel`

- [ ] **Step 3: Add Room Booking Modal UI with Express / Full Tabs**

Render the `showBookingModal` card containing:
- Tab selector switch: **⚡ จองด่วน (Express)** vs **📋 จองแบบเต็ม (Full)**
- Express mode: `customerName`, `customerPhone`, `expectedCheckInDate`, `depositAmount`
- Full mode: Adds `customerIdCard`, `customerEmail`, `customerLineId`, `paymentMethod`, `slipImage`, `note`

- [ ] **Step 4: Update Room Card Status Badges & Filter Count**

Add `"BOOKED"` status styling (Yellow/Orange badge with label **"จองแล้ว"**).
Ensure building summary cards count `BOOKED` rooms properly.

---

### Task 4: Verification & Manual Testing

- [ ] **Step 1: Test Express Booking**
Create an Express booking for a vacant room. Verify room status turns to `"จองแล้ว"`.

- [ ] **Step 2: Test Check-in Conversion**
Click the booked room, click "ทำสัญญาเข้าพัก", verify tenant is registered, deposit credited, and room status turns to `"มีผู้เช่า"`.

- [ ] **Step 3: Test Cancellation (Refund / Forfeit)**
Create a booking, cancel it with Refund/Forfeit option, and verify room status returns to `"ห้องว่าง"`.
