import assert from 'node:assert';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Set up global require for CJS fallbacks in ESM context
globalThis.require = createRequire(import.meta.url);

// Respawn with test loader if not already active
if (process.env.TEST_LOADER_ACTIVE !== 'true') {
  const result = spawnSync(
    process.execPath,
    ['--loader', './scripts/test-loader.mjs', path.resolve('scripts/test-task-3.mjs')],
    {
      stdio: 'inherit',
      env: { ...process.env, TEST_LOADER_ACTIVE: 'true' },
    }
  );
  process.exit(result.status ?? 1);
}

// Filter noisy local dev context fallback logs from output
const originalLog = console.log;
console.log = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].startsWith('[prisma]') || args[0].includes('getCloudflareContext') || args[0].includes('initOpenNextCloudflareForDev'))
  ) {
    return;
  }
  originalLog(...args);
};

async function runAllTests() {
  // ----------------------------------------------------------------------------
  // Imports (resolved via test-loader.mjs)
  // ----------------------------------------------------------------------------
  const { prisma } = await import('@/lib/prisma');
  const bookingsRoute = await import('../src/app/api/bookings/route.ts');
  const bookingCancelRoute = await import('../src/app/api/bookings/[id]/cancel/route.ts');
  const tenantCheckoutRoute = await import('../src/app/api/tenants/[id]/checkout/route.ts');
  const tenantsRoute = await import('../src/app/api/tenants/route.ts');

  originalLog('====================================================');
  originalLog('  TESTING TASK 3: STATE INVARIANTS & CONCURRENCY    ');
  originalLog('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function runAsyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      originalLog(`  [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(' ', err);
      throw err;
    }
  }

  // Global fixtures tracking for cleanup
  const testSuffix = `t3_${Date.now()}`;
  let propertyId = null;
  let buildingId = null;
  let floorId = null;
  const createdRoomIds = [];

  try {
    // Setup baseline property & building & floor
    const prop = await prisma.property.create({
      data: { name: `Property_${testSuffix}` },
    });
    propertyId = prop.id;

    const bldg = await prisma.building.create({
      data: {
        name: `Bldg_${testSuffix}`,
        waterRate: 18,
        electricityRate: 8,
        propertyId: prop.id,
      },
    });
    buildingId = bldg.id;

    const flr = await prisma.floor.create({
      data: { number: 3, buildingId: bldg.id },
    });
    floorId = flr.id;

    // Helper to create a room
    async function createTestRoom(number, status = 'VACANT', basePrice = 3500) {
      const room = await prisma.room.create({
        data: {
          number: `${number}_${testSuffix}`,
          type: 'AIR',
          basePrice,
          floorId: flr.id,
          status,
        },
      });
      createdRoomIds.push(room.id);
      return room;
    }

    // ----------------------------------------------------------------------------
    // TEST SUITE 1: Reject booking for non-VACANT rooms & Double Booking protection
    // ----------------------------------------------------------------------------
    originalLog('--- Suite 1: Booking Room Status Invariants ---');

    await runAsyncTest('1.1: Reject booking when room status is BOOKED', async () => {
      const roomBooked = await createTestRoom('R101', 'BOOKED');

      const req = new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomBooked.id,
          customerName: 'สมชาย ผู้จองซ้อน',
          customerPhone: '0811111111',
          expectedCheckInDate: '2026-08-01',
        }),
      });

      const res = await bookingsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('BOOKED'),
        `Expected error to mention BOOKED, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('1.2: Reject booking when room status is OCCUPIED', async () => {
      const roomOccupied = await createTestRoom('R102', 'OCCUPIED');

      const req = new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomOccupied.id,
          customerName: 'สมหญิง ผู้จองห้องมีคนอยู่',
          customerPhone: '0822222222',
          expectedCheckInDate: '2026-08-01',
        }),
      });

      const res = await bookingsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('OCCUPIED'),
        `Expected error to mention OCCUPIED, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('1.3: Reject tenant lease creation (POST /api/tenants) when room is not VACANT', async () => {
      const roomBooked = await createTestRoom('R103', 'BOOKED');

      const req = new Request('http://localhost/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomBooked.id,
          name: 'สมเกียรติ สัญญาซ้อน',
          phone: '0833333333',
          startDate: '2026-08-01',
        }),
      });

      const res = await tenantsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ห้องพักนี้ไม่ว่างสำหรับทำสัญญาใหม่'),
        `Expected error message for non-vacant room, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('1.4: Allow booking when room is VACANT, updates status to BOOKED', async () => {
      const roomVacant = await createTestRoom('R104', 'VACANT');

      const req = new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomVacant.id,
          customerName: 'สมปอง ผู้จองสำเร็จ',
          customerPhone: '0844444444',
          expectedCheckInDate: '2026-08-01',
          depositAmount: 1000,
        }),
      });

      const res = await bookingsRoute.POST(req);
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const bookingData = await res.json();
      assert.ok(bookingData.id, 'Booking should be created');
      assert.strictEqual(bookingData.status, 'ACTIVE');

      // Verify room status transitioned to BOOKED
      const updatedRoom = await prisma.room.findUnique({ where: { id: roomVacant.id } });
      assert.strictEqual(updatedRoom.status, 'BOOKED');
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 2: Guard booking cancellation to ACTIVE only
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 2: Guard Booking Cancellation (ACTIVE only) ---');

    await runAsyncTest('2.1: Reject cancel on CANCELLED_REFUNDED booking', async () => {
      const room = await createTestRoom('R201', 'VACANT');
      const booking = await prisma.booking.create({
        data: {
          roomId: room.id,
          customerName: 'นายเคยยกเลิก',
          customerPhone: '0855555555',
          expectedCheckInDate: new Date('2026-08-01'),
          status: 'CANCELLED_REFUNDED',
        },
      });

      const req = new Request(`http://localhost/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFUND' }),
      });

      const res = await bookingCancelRoute.POST(req, {
        params: Promise.resolve({ id: booking.id }),
      });

      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('CANCELLED_REFUNDED'),
        `Expected error mentioning CANCELLED_REFUNDED, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('2.2: Reject cancel on CHECKED_IN booking', async () => {
      const room = await createTestRoom('R202', 'OCCUPIED');
      const booking = await prisma.booking.create({
        data: {
          roomId: room.id,
          customerName: 'นายเข้าพักแล้ว',
          customerPhone: '0866666666',
          expectedCheckInDate: new Date('2026-08-01'),
          status: 'CHECKED_IN',
        },
      });

      const req = new Request(`http://localhost/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FORFEIT' }),
      });

      const res = await bookingCancelRoute.POST(req, {
        params: Promise.resolve({ id: booking.id }),
      });

      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('CHECKED_IN'),
        `Expected error mentioning CHECKED_IN, got: ${JSON.stringify(data)}`
      );
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 3: Protect OCCUPIED room status on booking cancellation
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 3: Protect OCCUPIED Room Status During Booking Cancellation ---');

    await runAsyncTest('3.1: Cancelling booking on OCCUPIED room must NOT change room to VACANT', async () => {
      const room = await createTestRoom('R301', 'OCCUPIED');
      const booking = await prisma.booking.create({
        data: {
          roomId: room.id,
          customerName: 'นายจองห้องที่กำลังมีคนอยู่',
          customerPhone: '0877777777',
          expectedCheckInDate: new Date('2026-08-01'),
          status: 'ACTIVE',
        },
      });

      const req = new Request(`http://localhost/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFUND' }),
      });

      const res = await bookingCancelRoute.POST(req, {
        params: Promise.resolve({ id: booking.id }),
      });

      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);

      // Verify booking updated to CANCELLED_REFUNDED
      const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.strictEqual(updatedBooking.status, 'CANCELLED_REFUNDED');

      // CRITICAL: Room status MUST remain OCCUPIED!
      const roomAfter = await prisma.room.findUnique({ where: { id: room.id } });
      assert.strictEqual(
        roomAfter.status,
        'OCCUPIED',
        `Room status should remain OCCUPIED, but was reset to ${roomAfter.status}`
      );
    });

    await runAsyncTest('3.2: Cancelling booking on BOOKED room resets room status to VACANT', async () => {
      const room = await createTestRoom('R302', 'BOOKED');
      const booking = await prisma.booking.create({
        data: {
          roomId: room.id,
          customerName: 'นายจองปกติขอยกเลิก',
          customerPhone: '0888888888',
          expectedCheckInDate: new Date('2026-08-01'),
          status: 'ACTIVE',
        },
      });

      const req = new Request(`http://localhost/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFUND' }),
      });

      const res = await bookingCancelRoute.POST(req, {
        params: Promise.resolve({ id: booking.id }),
      });

      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);

      const roomAfter = await prisma.room.findUnique({ where: { id: room.id } });
      assert.strictEqual(
        roomAfter.status,
        'VACANT',
        `Room status should be reset to VACANT, got: ${roomAfter.status}`
      );
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 4: Checkout Idempotency Guard (Reject CHECKED_OUT tenants)
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 4: Checkout Idempotency Guard ---');

    await runAsyncTest('4.1: Reject FINAL_CHECKOUT when tenant is already CHECKED_OUT', async () => {
      const room = await createTestRoom('R401', 'VACANT');
      const tenant = await prisma.tenant.create({
        data: {
          name: 'นายย้ายออกไปแล้ว',
          phone: '0899999999',
          roomId: room.id,
          status: 'CHECKED_OUT',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-06-30'),
        },
      });

      const req = new Request(`http://localhost/api/tenants/${tenant.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'FINAL_CHECKOUT',
          checkOutDate: '2026-07-01',
        }),
      });

      const res = await tenantCheckoutRoute.POST(req, {
        params: Promise.resolve({ id: tenant.id }),
      });

      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ผู้เช่ารายนี้ดำเนินการย้ายออกเสร็จสิ้นไปแล้ว'),
        `Expected checked-out tenant error message, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('4.2: Reject RECORD_NOTICE_ONLY when tenant is already CHECKED_OUT', async () => {
      const room = await createTestRoom('R402', 'VACANT');
      const tenant = await prisma.tenant.create({
        data: {
          name: 'นายอดีตผู้เช่า',
          phone: '0891234567',
          roomId: room.id,
          status: 'CHECKED_OUT',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-06-30'),
        },
      });

      const req = new Request(`http://localhost/api/tenants/${tenant.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'RECORD_NOTICE_ONLY',
          noticeDate: '2026-07-01',
        }),
      });

      const res = await tenantCheckoutRoute.POST(req, {
        params: Promise.resolve({ id: tenant.id }),
      });

      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ผู้เช่ารายนี้ดำเนินการย้ายออกเสร็จสิ้นไปแล้ว'),
        `Expected checked-out tenant error message, got: ${JSON.stringify(data)}`
      );
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 5: Atomic Checkout & Meter Reading Recording
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 5: Atomic Meter Reading on Checkout ---');

    await runAsyncTest('5.1: Final checkout records meter reading, updates tenant to CHECKED_OUT and room to VACANT atomically', async () => {
      const room = await createTestRoom('R501', 'OCCUPIED');
      const tenant = await prisma.tenant.create({
        data: {
          name: 'นายย้ายออกพร้อมมิเตอร์',
          phone: '0898765432',
          roomId: room.id,
          status: 'ACTIVE',
          startDate: new Date('2026-01-01'),
          securityDeposit: 5000,
        },
      });

      const checkOutDateStr = '2026-07-31T10:00:00.000Z';
      const req = new Request(`http://localhost/api/tenants/${tenant.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'FINAL_CHECKOUT',
          checkOutDate: checkOutDateStr,
          finalWaterValue: '154.20',
          finalElecValue: '980.50',
          overrideForfeitDeposit: true,
        }),
      });

      const res = await tenantCheckoutRoute.POST(req, {
        params: Promise.resolve({ id: tenant.id }),
      });

      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const resData = await res.json();
      assert.strictEqual(resData.success, true);
      assert.strictEqual(resData.tenant.status, 'CHECKED_OUT');

      // 1. Verify tenant is CHECKED_OUT in DB
      const tenantDb = await prisma.tenant.findUnique({ where: { id: tenant.id } });
      assert.strictEqual(tenantDb.status, 'CHECKED_OUT');
      assert.ok(tenantDb.checkedOutAt, 'checkedOutAt should be populated');

      // 2. Verify room status transitioned to VACANT
      const roomDb = await prisma.room.findUnique({ where: { id: room.id } });
      assert.strictEqual(roomDb.status, 'VACANT');

      // 3. Verify meter reading was created
      const reading = await prisma.meterReading.findFirst({
        where: {
          roomId: room.id,
          recordedBy: 'ระบบ (มิเตอร์วันย้ายออก)',
        },
        orderBy: { readingDate: 'desc' },
      });

      assert.ok(reading, 'MeterReading record for checkout should exist');
      assert.strictEqual(reading.waterValue, 154.2);
      assert.strictEqual(reading.electricityValue, 980.5);
    });

  } finally {
    // Cleanup all created records
    try {
      for (const rId of createdRoomIds) {
        await prisma.meterReading.deleteMany({ where: { roomId: rId } });
        await prisma.invoice.deleteMany({ where: { roomId: rId } });
        await prisma.tenant.deleteMany({ where: { roomId: rId } });
        await prisma.booking.deleteMany({ where: { roomId: rId } });
        await prisma.room.deleteMany({ where: { id: rId } });
      }
      if (floorId) await prisma.floor.deleteMany({ where: { id: floorId } });
      if (buildingId) await prisma.building.deleteMany({ where: { id: buildingId } });
      if (propertyId) await prisma.property.deleteMany({ where: { id: propertyId } });
    } catch (cleanErr) {
      console.warn('Warning during test cleanup:', cleanErr.message);
    }
    await prisma.$disconnect();
  }

  originalLog('\n====================================================');
  originalLog(`      ALL TASK 3 TESTS PASSED! (${passedTests}/${totalTests})`);
  originalLog('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
