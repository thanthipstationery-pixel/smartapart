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
    ['--loader', './scripts/test-loader.mjs', path.resolve('scripts/test-task-5.mjs')],
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
  const buildingsRoute = await import('../src/app/api/buildings/route.ts');

  originalLog('====================================================');
  originalLog('  TESTING TASK 5: MEMORY LEAK & QUERY OPTIMIZATION  ');
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
  const testSuffix = `t5_${Date.now()}`;
  let propertyId = null;
  let buildingId = null;
  let floorId = null;
  const createdRoomIds = [];
  const createdInvoiceIds = [];
  const createdReadingIds = [];
  const createdTenantIds = [];

  try {
    // ----------------------------------------------------------------------------
    // Fixture Setup
    // ----------------------------------------------------------------------------
    const prop = await prisma.property.create({
      data: { name: `Property_${testSuffix}` },
    });
    propertyId = prop.id;

    const bldg = await prisma.building.create({
      data: {
        name: `Bldg_${testSuffix}`,
        waterRate: 18,
        electricityRate: 8,
        minimumWaterCost: 100,
        lateFee: 50,
        defaultDueDay: 5,
        propertyId: prop.id,
      },
    });
    buildingId = bldg.id;

    const flr = await prisma.floor.create({
      data: { number: 5, buildingId: bldg.id },
    });
    floorId = flr.id;

    async function createTestRoom(number, status = 'VACANT', basePrice = 4000) {
      const room = await prisma.room.create({
        data: {
          number: `${number}_${testSuffix}`,
          type: 'FAN',
          basePrice,
          floorId: flr.id,
          status,
        },
      });
      createdRoomIds.push(room.id);
      return room;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-10"
    const requestedPeriod = '2026-08';
    const oldHistoricalPeriod = '2024-05';

    // Room 1: Occupied in 2026-08 with reading and paid invoice in currentMonth
    const room1 = await createTestRoom('501', 'OCCUPIED', 4500);
    const tenant1 = await prisma.tenant.create({
      data: {
        name: `Tenant_1_${testSuffix}`,
        phone: '0810000001',
        roomId: room1.id,
        startDate: new Date('2026-01-01'),
        status: 'ACTIVE',
      },
    });
    createdTenantIds.push(tenant1.id);

    // Reading for Room 1 before requested period (prev reading)
    const r1Prev = await prisma.meterReading.create({
      data: {
        roomId: room1.id,
        readingDate: new Date('2026-07-31T10:00:00Z'),
        waterValue: 120,
        electricityValue: 850,
      },
    });
    createdReadingIds.push(r1Prev.id);

    // Reading for Room 1 in requested period (current reading)
    const r1Curr = await prisma.meterReading.create({
      data: {
        roomId: room1.id,
        readingDate: new Date('2026-08-31T10:00:00Z'),
        waterValue: 128,
        electricityValue: 920,
      },
    });
    createdReadingIds.push(r1Curr.id);

    // Reading in the future (after requested period: 2026-09-15) -> Should be excluded for period 2026-08!
    const r1Future = await prisma.meterReading.create({
      data: {
        roomId: room1.id,
        readingDate: new Date('2026-09-15T10:00:00Z'),
        waterValue: 135,
        electricityValue: 990,
      },
    });
    createdReadingIds.push(r1Future.id);

    // Invoice for Room 1 in currentMonth (PAID) -> Should count toward currentMonthRevenue
    const invCurrMonthPaid = await prisma.invoice.create({
      data: {
        roomId: room1.id,
        tenantId: tenant1.id,
        billingPeriod: currentMonth,
        previousWater: 135,
        currentWater: 142,
        previousElec: 990,
        currentElec: 1070,
        waterCost: 126,
        electricityCost: 640,
        rentCost: 4500,
        totalAmount: 5266,
        status: 'PAID',
        dueDate: new Date(),
      },
    });
    createdInvoiceIds.push(invCurrMonthPaid.id);

    // Room 2: Vacant, but has UNPAID invoice from 2026-07 -> Must be fetched by { status: 'UNPAID' }
    const room2 = await createTestRoom('502', 'VACANT', 4000);
    const tenant2 = await prisma.tenant.create({
      data: {
        name: `Tenant_2_${testSuffix}`,
        phone: '0810000002',
        roomId: room2.id,
        startDate: new Date('2026-06-01'),
        status: 'ACTIVE',
      },
    });
    createdTenantIds.push(tenant2.id);

    const invUnpaid = await prisma.invoice.create({
      data: {
        roomId: room2.id,
        tenantId: tenant2.id,
        billingPeriod: '2026-07',
        previousWater: 50,
        currentWater: 55,
        previousElec: 300,
        currentElec: 350,
        waterCost: 100,
        electricityCost: 400,
        rentCost: 4000,
        totalAmount: 4500,
        status: 'UNPAID',
        dueDate: new Date('2026-07-05'),
      },
    });
    createdInvoiceIds.push(invUnpaid.id);

    // Room 3: Has an old PAID invoice from 2024 (Out of scope!)
    // This invoice MUST NOT be fetched and MUST NOT affect any revenue or unpaid stats!
    const room3 = await createTestRoom('503', 'VACANT', 3800);
    const tenant3 = await prisma.tenant.create({
      data: {
        name: `Tenant_3_${testSuffix}`,
        phone: '0810000003',
        roomId: room3.id,
        startDate: new Date('2024-01-01'),
        status: 'ACTIVE',
      },
    });
    createdTenantIds.push(tenant3.id);

    const invOldPaid = await prisma.invoice.create({
      data: {
        roomId: room3.id,
        tenantId: tenant3.id,
        billingPeriod: oldHistoricalPeriod,
        previousWater: 10,
        currentWater: 20,
        previousElec: 100,
        currentElec: 200,
        waterCost: 180,
        electricityCost: 800,
        rentCost: 3800,
        totalAmount: 99999, // Unusually large amount to make any leakage glaringly obvious!
        status: 'PAID',
        dueDate: new Date('2024-05-05'),
      },
    });
    createdInvoiceIds.push(invOldPaid.id);

    // ----------------------------------------------------------------------------
    // SUITE 1: Query Scoping Verification (No Unbounded findMany)
    // ----------------------------------------------------------------------------
    originalLog('--- Suite 1: Query Scoping & Unbounded Query Elimination ---');

    await runAsyncTest('1.1: GET /api/buildings queries invoice with scoped OR conditions and meterReading with readingDate <= endOfPeriod', async () => {
      let interceptedInvoiceArgs = null;
      let interceptedReadingArgs = null;

      const origInvoiceFindMany = prisma.invoice.findMany;
      const origReadingFindMany = prisma.meterReading.findMany;

      prisma.invoice.findMany = async function (args) {
        interceptedInvoiceArgs = args;
        return origInvoiceFindMany.apply(this, arguments);
      };

      prisma.meterReading.findMany = async function (args) {
        interceptedReadingArgs = args;
        return origReadingFindMany.apply(this, arguments);
      };

      try {
        const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
        const res = await buildingsRoute.GET(req);
        assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);

        // Verify prisma.invoice.findMany scoping
        assert.ok(interceptedInvoiceArgs, 'prisma.invoice.findMany must be called');
        assert.ok(interceptedInvoiceArgs.where, 'prisma.invoice.findMany MUST have a where clause');
        assert.ok(Array.isArray(interceptedInvoiceArgs.where.OR), 'prisma.invoice.findMany where clause must use OR filters');

        const orFilters = interceptedInvoiceArgs.where.OR;
        const hasPeriodFilter = orFilters.some((f) => f.billingPeriod === requestedPeriod);
        const hasCurrentMonthPaidFilter = orFilters.some((f) => f.billingPeriod === currentMonth && f.status === 'PAID');
        const hasUnpaidFilter = orFilters.some((f) => f.status === 'UNPAID');

        assert.ok(hasPeriodFilter, `where.OR must include { billingPeriod: '${requestedPeriod}' }`);
        assert.ok(hasCurrentMonthPaidFilter, `where.OR must include { billingPeriod: '${currentMonth}', status: 'PAID' }`);
        assert.ok(hasUnpaidFilter, `where.OR must include { status: 'UNPAID' }`);

        // Verify prisma.meterReading.findMany scoping
        assert.ok(interceptedReadingArgs, 'prisma.meterReading.findMany must be called');
        assert.ok(interceptedReadingArgs.where, 'prisma.meterReading.findMany MUST have a where clause');
        assert.ok(interceptedReadingArgs.where.readingDate, 'where clause must filter readingDate');
        assert.ok(interceptedReadingArgs.where.readingDate.lte instanceof Date, 'where clause must filter readingDate.lte with a Date object');

        // Check select optimization
        assert.ok(interceptedReadingArgs.select, 'prisma.meterReading.findMany should optimize with select fields');
        assert.strictEqual(interceptedReadingArgs.select.roomId, true);
        assert.strictEqual(interceptedReadingArgs.select.waterValue, true);
        assert.strictEqual(interceptedReadingArgs.select.electricityValue, true);
      } finally {
        prisma.invoice.findMany = origInvoiceFindMany;
        prisma.meterReading.findMany = origReadingFindMany;
      }
    });

    await runAsyncTest('1.2: Out-of-scope old PAID invoice (2024-05, 99999 Baht) is completely excluded from queries and stats', async () => {
      const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
      const res = await buildingsRoute.GET(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();

      // Current month revenue must NOT include 99999
      assert.ok(
        json.stats.currentMonthRevenue < 90000,
        `currentMonthRevenue must not contain old 99,999 invoice! Got: ${json.stats.currentMonthRevenue}`
      );
      // Total unpaid amount must NOT include 99999
      assert.ok(
        json.stats.totalUnpaidAmount < 90000,
        `totalUnpaidAmount must not contain old 99,999 invoice! Got: ${json.stats.totalUnpaidAmount}`
      );
    });

    await runAsyncTest('1.3: Future readings (after endOfPeriod) are excluded and not picked as current readings', async () => {
      const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
      const res = await buildingsRoute.GET(req);
      const json = await res.json();

      const targetBldg = json.buildings.find((b) => b.id === buildingId);
      assert.ok(targetBldg, 'Created test building must be in response');
      const targetRoom = targetBldg.floors[0].rooms.find((r) => r.id === room1.id);
      assert.ok(targetRoom, 'Room 1 must be present');

      // Room 1 has readings:
      // - 2026-07-31: water 120, elec 850 (prev)
      // - 2026-08-31: water 128, elec 920 (current)
      // - 2026-09-15: water 135, elec 990 (future - must NOT be picked!)
      assert.strictEqual(targetRoom.prevWater, 120, `prevWater should be 120, got ${targetRoom.prevWater}`);
      assert.strictEqual(targetRoom.prevElec, 850, `prevElec should be 850, got ${targetRoom.prevElec}`);
      assert.strictEqual(targetRoom.currentWater, 128, `currentWater should be 128, got ${targetRoom.currentWater}`);
      assert.strictEqual(targetRoom.currentElec, 920, `currentElec should be 920, got ${targetRoom.currentElec}`);
      assert.strictEqual(targetRoom.isMeterRecorded, true, 'isMeterRecorded must be true for recorded reading');
    });

    // ----------------------------------------------------------------------------
    // SUITE 2: Response Contract & Schema Invariants
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 2: Response Contract & Schema Invariants ---');

    await runAsyncTest('2.1: Response contract matches expected structure (buildings[], stats{})', async () => {
      const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
      const res = await buildingsRoute.GET(req);
      const json = await res.json();

      assert.ok(Array.isArray(json.buildings), 'json.buildings must be an array');
      assert.ok(typeof json.stats === 'object' && json.stats !== null, 'json.stats must be an object');

      // Verify stats fields
      const expectedStatsKeys = [
        'totalRooms',
        'occupiedRooms',
        'bookedRooms',
        'vacantRooms',
        'maintenanceRooms',
        'unpaidRoomsCount',
        'currentMonthRevenue',
        'totalUnpaidAmount',
        'occupancyRate',
      ];
      for (const k of expectedStatsKeys) {
        assert.ok(k in json.stats, `stats object missing key: ${k}`);
        assert.ok(typeof json.stats[k] === 'number', `stats.${k} must be number, got ${typeof json.stats[k]}`);
      }

      // Verify building fields
      const bldg = json.buildings.find((b) => b.id === buildingId);
      assert.ok(bldg, 'Target building should exist');
      const expectedBldgKeys = [
        'id',
        'name',
        'waterRate',
        'electricityRate',
        'minimumWaterCost',
        'lateFee',
        'defaultDueDay',
        'stats',
        'floors',
      ];
      for (const k of expectedBldgKeys) {
        assert.ok(k in bldg, `building missing key: ${k}`);
      }

      // Verify room fields
      const rm = bldg.floors[0].rooms[0];
      const expectedRoomKeys = [
        'id',
        'number',
        'type',
        'basePrice',
        'status',
        'waterBillingType',
        'flatWaterCost',
        'elecBillingType',
        'flatElecCost',
        'hasUnpaidInvoice',
        'prevWater',
        'prevElec',
        'currentWater',
        'currentElec',
        'isMeterRecorded',
        'activeTenant',
        'activeBooking',
      ];
      for (const k of expectedRoomKeys) {
        assert.ok(k in rm, `room missing key: ${k}`);
      }
    });

    // ----------------------------------------------------------------------------
    // SUITE 3: Accurate Stats & Revenue Calculations
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 3: Financial & Occupancy Calculation Accuracy ---');

    await runAsyncTest('3.1: Global stats correctly aggregates active rooms, unpaid count, and revenue', async () => {
      const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
      const res = await buildingsRoute.GET(req);
      const json = await res.json();

      // We created 3 rooms for our test building
      const targetBldg = json.buildings.find((b) => b.id === buildingId);
      assert.strictEqual(targetBldg.stats.total, 3, `Building total rooms should be 3, got ${targetBldg.stats.total}`);
      // In 2026-08:
      // Room 1 had tenant starting 2026-01 -> OCCUPIED
      // Room 2 had tenant starting 2026-06 -> OCCUPIED
      // Room 3 had tenant starting 2024-01 -> OCCUPIED
      assert.strictEqual(targetBldg.stats.occupied, 3, 'All 3 rooms had active tenant in 2026-08');
      assert.strictEqual(targetBldg.stats.occupancyRate, 100);

      // Verify unpaidRoomIds includes Room 2
      assert.ok(json.stats.unpaidRoomsCount >= 1, 'unpaidRoomsCount must be at least 1');
      assert.ok(json.stats.totalUnpaidAmount >= 4500, `totalUnpaidAmount must include 4500, got ${json.stats.totalUnpaidAmount}`);
      assert.ok(json.stats.currentMonthRevenue >= 5266, `currentMonthRevenue must include 5266, got ${json.stats.currentMonthRevenue}`);
    });

    // ----------------------------------------------------------------------------
    // SUITE 4: Meter Reading Invoice Fallback
    // ----------------------------------------------------------------------------
    originalLog('\n--- Suite 4: Meter Fallback to Period Invoice ---');

    await runAsyncTest('4.1: When room lacks MeterReading entry for period, fallbacks accurately to period invoice values', async () => {
      // Room 4 has an invoice for period 2026-08 with previousWater=40, currentWater=48, previousElec=200, currentElec=260
      // but NO MeterReading records
      const room4 = await createTestRoom('504', 'OCCUPIED', 3500);
      const tenant4 = await prisma.tenant.create({
        data: {
          name: `Tenant_4_${testSuffix}`,
          phone: '0810000004',
          roomId: room4.id,
          startDate: new Date('2026-01-01'),
          status: 'ACTIVE',
        },
      });
      createdTenantIds.push(tenant4.id);

      const periodInv = await prisma.invoice.create({
        data: {
          roomId: room4.id,
          tenantId: tenant4.id,
          billingPeriod: requestedPeriod,
          previousWater: 40,
          currentWater: 48,
          previousElec: 200,
          currentElec: 260,
          waterCost: 144,
          electricityCost: 480,
          rentCost: 3500,
          totalAmount: 4124,
          status: 'UNPAID',
          dueDate: new Date('2026-08-05'),
        },
      });
      createdInvoiceIds.push(periodInv.id);

      const req = new Request(`http://localhost/api/buildings?period=${requestedPeriod}`);
      const res = await buildingsRoute.GET(req);
      const json = await res.json();

      const targetBldg = json.buildings.find((b) => b.id === buildingId);
      const r4 = targetBldg.floors[0].rooms.find((r) => r.id === room4.id);
      assert.ok(r4, 'Room 4 must exist');

      assert.strictEqual(r4.prevWater, 40, `prevWater fallback should be 40, got ${r4.prevWater}`);
      assert.strictEqual(r4.currentWater, 48, `currentWater fallback should be 48, got ${r4.currentWater}`);
      assert.strictEqual(r4.prevElec, 200, `prevElec fallback should be 200, got ${r4.prevElec}`);
      assert.strictEqual(r4.currentElec, 260, `currentElec fallback should be 260, got ${r4.currentElec}`);
      assert.strictEqual(r4.isMeterRecorded, true, 'isMeterRecorded must be true because period invoice exists');
      assert.strictEqual(r4.hasUnpaidInvoice, true, 'hasUnpaidInvoice must be true');
    });

  } finally {
    // Cleanup all fixtures
    try {
      for (const invId of createdInvoiceIds) {
        await prisma.payment.deleteMany({ where: { invoiceId: invId } });
        await prisma.invoice.deleteMany({ where: { id: invId } });
      }
      for (const rId of createdReadingIds) {
        await prisma.meterReading.deleteMany({ where: { id: rId } });
      }
      for (const tId of createdTenantIds) {
        await prisma.tenant.deleteMany({ where: { id: tId } });
      }
      for (const roomId of createdRoomIds) {
        await prisma.meterReading.deleteMany({ where: { roomId } });
        await prisma.invoice.deleteMany({ where: { roomId } });
        await prisma.tenant.deleteMany({ where: { roomId } });
        await prisma.booking.deleteMany({ where: { roomId } });
        await prisma.room.deleteMany({ where: { id: roomId } });
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
  originalLog(`      ALL TASK 5 TESTS PASSED! (${passedTests}/${totalTests})`);
  originalLog('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
