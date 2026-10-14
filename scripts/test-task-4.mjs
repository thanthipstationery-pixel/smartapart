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
    ['--loader', './scripts/test-loader.mjs', path.resolve('scripts/test-task-4.mjs')],
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
  const transferRoute = await import('../src/app/api/tenants/[id]/transfer/route.ts');
  const paymentsRoute = await import('../src/app/api/payments/route.ts');

  originalLog('====================================================');
  originalLog('  TESTING TASK 4: FINANCIAL INTEGRITY & SANITATION  ');
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
  const testSuffix = `t4_${Date.now()}`;
  let propertyId = null;
  let buildingId = null;
  let floorId = null;
  const createdRoomIds = [];
  const createdInvoiceIds = [];

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
      data: { number: 4, buildingId: bldg.id },
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
    // TEST SUITE 1: Server-Authoritative Financial Calculation on Room Transfer
    // ----------------------------------------------------------------------------
    originalLog('--- Suite 1: Transfer Invoice Server-Authoritative Calculation ---');

    await runAsyncTest('1.1: Transfer endpoint ignores client netTotal tampering and calculates totalAmount strictly on server', async () => {
      const sourceRoom = await createTestRoom('R401A', 'OCCUPIED');
      const targetRoom = await createTestRoom('R401B', 'VACANT');

      const tenant = await prisma.tenant.create({
        data: {
          name: 'สมศักดิ์ ผู้ขอย้ายห้อง',
          phone: '0812345678',
          roomId: sourceRoom.id,
          status: 'ACTIVE',
          securityDeposit: 5000,
          keycardDeposit: 200,
          keycardCount: 1,
          startDate: new Date('2026-01-01'),
        },
      });

      // Client intentionally tampers with netTotal to 0 or 1, while items add up to 7050
      const invoiceDataPayload = {
        billingPeriod: '2026-08',
        proratedNewRent: 1500,
        nextMonthFullRent: 3500,
        waterCost: 100,
        elecCost: 350,
        newSecurityDeposit: 6000, // Difference: +1000
        keycardAction: 'REPLACE',
        keycardRefund: 200,       // Refund old keycard: -200
        newKeycardDeposit: 300,   // New keycard deposit: +300 (Net keycard: +100)
        otherFeeDetails: [
          { name: 'ค่าขนย้ายและทำความสะอาด', amount: 500 },
        ],
        netTotal: 0, // TAMPERED VALUE! Client tries to set total to 0!
      };

      const req = new Request(`http://localhost/api/tenants/${tenant.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRoomId: targetRoom.id,
          transferDate: '2026-08-15',
          invoiceData: invoiceDataPayload,
        }),
      });

      const res = await transferRoute.POST(req, {
        params: Promise.resolve({ id: tenant.id }),
      });

      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const resJson = await res.json();
      assert.strictEqual(resJson.success, true);

      // Verify the generated invoice in DB
      const invoice = await prisma.invoice.findFirst({
        where: { roomId: targetRoom.id, tenantId: tenant.id },
      });
      assert.ok(invoice, 'Transfer invoice must be generated in DB');
      createdInvoiceIds.push(invoice.id);

      // Expected calculation:
      // rentCost = 1500 + 3500 = 5000
      // waterCost = 100
      // elecCost = 350
      // otherCost = 500 + 1000 - 200 + 300 = 1600
      // totalAmount = Math.max(0, 5000 + 100 + 350 + 1600) = 7050
      assert.strictEqual(invoice.rentCost, 5000, 'rentCost should be 5000');
      assert.strictEqual(invoice.waterCost, 100, 'waterCost should be 100');
      assert.strictEqual(invoice.electricityCost, 350, 'electricityCost should be 350');
      assert.strictEqual(invoice.otherCost, 1600, 'otherCost should be 1600');
      assert.strictEqual(invoice.totalAmount, 7050, `totalAmount MUST be 7050, ignoring client netTotal 0. Got: ${invoice.totalAmount}`);
    });

    await runAsyncTest('1.2: Server-authoritative calculation clamps negative balance to 0', async () => {
      const sourceRoom = await createTestRoom('R402A', 'OCCUPIED');
      const targetRoom = await createTestRoom('R402B', 'VACANT');

      const tenant = await prisma.tenant.create({
        data: {
          name: 'สมศรี ขอลดขนาดห้อง',
          phone: '0812345679',
          roomId: sourceRoom.id,
          status: 'ACTIVE',
          securityDeposit: 8000,
          keycardDeposit: 500,
          keycardCount: 2,
          startDate: new Date('2026-01-01'),
        },
      });

      // Huge refund / credit causing negative subtotal
      const invoiceDataPayload = {
        billingPeriod: '2026-08',
        proratedNewRent: 500,
        nextMonthFullRent: 0,
        waterCost: 50,
        elecCost: 50,
        proratedOldRentCredit: 3000, // Credit: -3000
        newSecurityDeposit: 4000,    // Deposit difference: -4000
        netTotal: -9999,
      };

      const req = new Request(`http://localhost/api/tenants/${tenant.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRoomId: targetRoom.id,
          transferDate: '2026-08-15',
          invoiceData: invoiceDataPayload,
        }),
      });

      const res = await transferRoute.POST(req, {
        params: Promise.resolve({ id: tenant.id }),
      });

      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);

      const invoice = await prisma.invoice.findFirst({
        where: { roomId: targetRoom.id, tenantId: tenant.id },
      });
      assert.ok(invoice, 'Transfer invoice must be generated in DB');
      createdInvoiceIds.push(invoice.id);

      // Calculations:
      // rentCost = 500
      // waterCost = 50, elecCost = 50
      // otherCost = -3000 (credit) - 4000 (deposit diff) = -7000
      // sum = 500 + 50 + 50 - 7000 = -6400 -> Clamped to 0
      assert.strictEqual(invoice.totalAmount, 0, `totalAmount must be clamped to 0, got: ${invoice.totalAmount}`);
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 2: Payment Input Sanitation & Validation
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 2: Payment Input Validation (amountPaid > 0) ---');

    // Create a dummy invoice for payment tests
    const payRoom = await createTestRoom('R403', 'OCCUPIED');
    const payTenant = await prisma.tenant.create({
      data: {
        name: 'ผู้เช่าชำระเงิน',
        phone: '0819999999',
        roomId: payRoom.id,
        status: 'ACTIVE',
      },
    });
    const payInvoice = await prisma.invoice.create({
      data: {
        roomId: payRoom.id,
        tenantId: payTenant.id,
        billingPeriod: '2026-08',
        previousWater: 100,
        currentWater: 110,
        previousElec: 500,
        currentElec: 600,
        waterCost: 200,
        electricityCost: 800,
        rentCost: 4000,
        totalAmount: 5000,
        status: 'UNPAID',
        dueDate: new Date('2026-08-05'),
      },
    });
    createdInvoiceIds.push(payInvoice.id);

    await runAsyncTest('2.1: Reject payment when amountPaid <= 0 (zero)', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payInvoice.id,
          amountPaid: 0,
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ยอดเงินชำระไม่ถูกต้อง'),
        `Expected validation error, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('2.2: Reject payment when amountPaid < 0 (negative)', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payInvoice.id,
          amountPaid: -500,
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ยอดเงินชำระไม่ถูกต้อง'),
        `Expected validation error, got: ${JSON.stringify(data)}`
      );
    });

    await runAsyncTest('2.3: Reject payment when amountPaid is NaN or non-numeric string', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payInvoice.id,
          amountPaid: 'not-a-number',
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ยอดเงินชำระไม่ถูกต้อง'),
        `Expected validation error, got: ${JSON.stringify(data)}`
      );
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 3: Target Invoice Existence Check (404)
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 3: Target Invoice Existence Check (404) ---');

    await runAsyncTest('3.1: Reject payment with 404 when invoiceId does not exist', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: 'non-existent-invoice-uuid-999',
          amountPaid: 1000,
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 404, `Expected status 404, got ${res.status}`);
      const data = await res.json();
      assert.ok(
        data.error && data.error.includes('ไม่พบใบแจ้งหนี้'),
        `Expected 404 invoice not found error, got: ${JSON.stringify(data)}`
      );
    });

    // ----------------------------------------------------------------------------
    // TEST SUITE 4: Valid Payment Processing & Accurate Status Progression
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 4: Valid Payment Processing & Status Transitions ---');

    await runAsyncTest('4.1: Partial payment (amountPaid < totalAmount) sets status to PARTIAL', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payInvoice.id,
          amountPaid: 2000,
          paymentMethod: 'TRANSFER',
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const paymentData = await res.json();
      assert.strictEqual(paymentData.amountPaid, 2000);
      assert.strictEqual(paymentData.status, 'APPROVED');

      // Verify invoice status updated to PARTIAL
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: payInvoice.id },
      });
      assert.strictEqual(updatedInvoice.status, 'PARTIAL', `Expected status PARTIAL, got ${updatedInvoice.status}`);
    });

    await runAsyncTest('4.2: Full remaining payment (sum >= totalAmount) sets status to PAID', async () => {
      const req = new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payInvoice.id,
          amountPaid: '3000', // String number should be parsed cleanly
          paymentMethod: 'CASH',
        }),
      });

      const res = await paymentsRoute.POST(req);
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const paymentData = await res.json();
      assert.strictEqual(paymentData.amountPaid, 3000);

      // Total paid is now 2000 + 3000 = 5000 >= 5000 -> PAID
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: payInvoice.id },
      });
      assert.strictEqual(updatedInvoice.status, 'PAID', `Expected status PAID, got ${updatedInvoice.status}`);
    });

  } finally {
    // Cleanup all created records
    try {
      for (const invId of createdInvoiceIds) {
        await prisma.payment.deleteMany({ where: { invoiceId: invId } });
        await prisma.invoice.deleteMany({ where: { id: invId } });
      }
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
  originalLog(`      ALL TASK 4 TESTS PASSED! (${passedTests}/${totalTests})`);
  originalLog('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
