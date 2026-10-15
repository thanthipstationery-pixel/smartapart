import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

console.log('====================================================');
console.log('  TESTING TASK 1: SCHEMA MIGRATION & MODEL UPDATES  ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(' ', err.message);
    throw err;
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(' ', err.message);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// TEST SUITE 1: prisma/schema.prisma Definitions
// ----------------------------------------------------------------------------
console.log('--- Suite 1: Prisma Schema Model Definitions ---');

const schemaPath = path.resolve('prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

runTest('1.1: schema.prisma contains role, phone, and isActive on Admin', () => {
  const adminModelMatch = schemaContent.match(/model\s+Admin\s+\{([^}]+)\}/);
  assert.ok(adminModelMatch, 'Admin model not found in schema.prisma');
  const adminBody = adminModelMatch[1];

  assert.ok(
    /role\s+String\s+@default\("OWNER"\)/.test(adminBody),
    'Expected role String @default("OWNER") in Admin model'
  );
  assert.ok(
    /phone\s+String\?/.test(adminBody),
    'Expected phone String? in Admin model'
  );
  assert.ok(
    /isActive\s+Boolean\s+@default\(true\)/.test(adminBody),
    'Expected isActive Boolean @default(true) in Admin model'
  );
});

runTest('1.2: schema.prisma contains recordedBy on MeterReading', () => {
  const meterModelMatch = schemaContent.match(/model\s+MeterReading\s+\{([^}]+)\}/);
  assert.ok(meterModelMatch, 'MeterReading model not found in schema.prisma');
  const meterBody = meterModelMatch[1];

  assert.ok(
    /recordedBy\s+String\?/.test(meterBody),
    'Expected recordedBy String? in MeterReading model'
  );
});

runTest('1.3: schema.prisma contains recordedBy on Payment', () => {
  const paymentModelMatch = schemaContent.match(/model\s+Payment\s+\{([^}]+)\}/);
  assert.ok(paymentModelMatch, 'Payment model not found in schema.prisma');
  const paymentBody = paymentModelMatch[1];

  assert.ok(
    /recordedBy\s+String\?/.test(paymentBody),
    'Expected recordedBy String? in Payment model'
  );
});

runTest('1.4: schema.prisma contains recordedBy on Booking', () => {
  const bookingModelMatch = schemaContent.match(/model\s+Booking\s+\{([^}]+)\}/);
  assert.ok(bookingModelMatch, 'Booking model not found in schema.prisma');
  const bookingBody = bookingModelMatch[1];

  assert.ok(
    /recordedBy\s+String\?/.test(bookingBody),
    'Expected recordedBy String? in Booking model'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: Migration SQL File Verification
// ----------------------------------------------------------------------------
console.log('\n--- Suite 2: D1 Migration Script (20261015_user_management_and_rbac.sql) ---');

const migrationPath = path.resolve('prisma/migrations/20261015_user_management_and_rbac.sql');

runTest('2.1: Migration file exists', () => {
  assert.ok(fs.existsSync(migrationPath), `Migration file not found at ${migrationPath}`);
});

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

runTest('2.2: Migration contains Admin schema alter statements', () => {
  assert.ok(
    migrationSql.includes('ALTER TABLE "Admin" ADD COLUMN "role" TEXT NOT NULL DEFAULT \'OWNER\';'),
    'Missing Admin.role ALTER TABLE statement'
  );
  assert.ok(
    migrationSql.includes('ALTER TABLE "Admin" ADD COLUMN "phone" TEXT;'),
    'Missing Admin.phone ALTER TABLE statement'
  );
  assert.ok(
    migrationSql.includes('ALTER TABLE "Admin" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1;'),
    'Missing Admin.isActive ALTER TABLE statement'
  );
});

runTest('2.3: Migration contains recordedBy column additions', () => {
  assert.ok(
    migrationSql.includes('ALTER TABLE "MeterReading" ADD COLUMN "recordedBy" TEXT;'),
    'Missing MeterReading.recordedBy ALTER TABLE statement'
  );
  assert.ok(
    migrationSql.includes('ALTER TABLE "Payment" ADD COLUMN "recordedBy" TEXT;'),
    'Missing Payment.recordedBy ALTER TABLE statement'
  );
  assert.ok(
    migrationSql.includes('ALTER TABLE "Booking" ADD COLUMN "recordedBy" TEXT;'),
    'Missing Booking.recordedBy ALTER TABLE statement'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: Local SQLite DB Column Verification
// ----------------------------------------------------------------------------
console.log('\n--- Suite 3: Local SQLite DB Schema & Column Verification ---');

const dbPaths = [
  path.resolve('prisma/dev.db'),
  path.resolve('dev.db'),
].filter(p => fs.existsSync(p));

for (const dbPath of dbPaths) {
  const relativeDbName = path.relative(process.cwd(), dbPath);
  await runAsyncTest(`3.x: Columns exist in SQLite database: ${relativeDbName}`, async () => {
    const client = createClient({ url: `file:${dbPath}` });

    const adminInfo = await client.execute('PRAGMA table_info(Admin)');
    const adminCols = new Set(adminInfo.rows.map(r => r.name));
    assert.ok(adminCols.has('role'), `Missing role column on Admin in ${relativeDbName}`);
    assert.ok(adminCols.has('phone'), `Missing phone column on Admin in ${relativeDbName}`);
    assert.ok(adminCols.has('isActive'), `Missing isActive column on Admin in ${relativeDbName}`);

    const meterInfo = await client.execute('PRAGMA table_info(MeterReading)');
    const meterCols = new Set(meterInfo.rows.map(r => r.name));
    assert.ok(meterCols.has('recordedBy'), `Missing recordedBy column on MeterReading in ${relativeDbName}`);

    const paymentInfo = await client.execute('PRAGMA table_info(Payment)');
    const paymentCols = new Set(paymentInfo.rows.map(r => r.name));
    assert.ok(paymentCols.has('recordedBy'), `Missing recordedBy column on Payment in ${relativeDbName}`);

    const bookingInfo = await client.execute('PRAGMA table_info(Booking)');
    const bookingCols = new Set(bookingInfo.rows.map(r => r.name));
    assert.ok(bookingCols.has('recordedBy'), `Missing recordedBy column on Booking in ${relativeDbName}`);

    // Verify existing Admin default values backward compatibility
    const existingAdmins = await client.execute('SELECT * FROM Admin');
    for (const admin of existingAdmins.rows) {
      assert.strictEqual(admin.role, 'OWNER', `Expected default role 'OWNER' for admin ${admin.username}`);
      assert.strictEqual(Number(admin.isActive), 1, `Expected default isActive 1 for admin ${admin.username}`);
    }

    client.close();
  });
}

// ----------------------------------------------------------------------------
// TEST SUITE 4: Functional Testing with Prisma Client
// ----------------------------------------------------------------------------
console.log('\n--- Suite 4: Prisma Client Functional Verification ---');

const prisma = new PrismaClient();

await runAsyncTest('4.1: Existing admin records query with default role OWNER and isActive true', async () => {
  const admins = await prisma.admin.findMany();
  assert.ok(admins.length > 0, 'Expected at least one admin in DB');
  for (const adm of admins) {
    assert.strictEqual(adm.role, 'OWNER', `Expected admin ${adm.username} role to be OWNER`);
    assert.strictEqual(adm.isActive, true, `Expected admin ${adm.username} isActive to be true`);
  }
});

await runAsyncTest('4.2: Admin create and query with custom role, phone, and isActive', async () => {
  const testUsername = `test_admin_${Date.now()}`;
  let created = null;
  try {
    created = await prisma.admin.create({
      data: {
        username: testUsername,
        password: 'hashed_password_test',
        name: 'Manager Test',
        role: 'MANAGER',
        phone: '0899998888',
        isActive: false,
      }
    });

    assert.strictEqual(created.role, 'MANAGER');
    assert.strictEqual(created.phone, '0899998888');
    assert.strictEqual(created.isActive, false);

    const fetched = await prisma.admin.findUnique({
      where: { id: created.id }
    });
    assert.ok(fetched, 'Failed to fetch created admin');
    assert.strictEqual(fetched.role, 'MANAGER');
    assert.strictEqual(fetched.phone, '0899998888');
    assert.strictEqual(fetched.isActive, false);
  } finally {
    if (created?.id) {
      await prisma.admin.delete({ where: { id: created.id } });
    }
  }
});

await runAsyncTest('4.3: MeterReading recordedBy field works with Prisma', async () => {
  const testSuffix = `mr_${Date.now()}`;
  const prop = await prisma.property.create({ data: { name: `Prop_${testSuffix}` } });
  const bldg = await prisma.building.create({
    data: { name: `Bldg_${testSuffix}`, waterRate: 18, electricityRate: 8, propertyId: prop.id }
  });
  const flr = await prisma.floor.create({ data: { number: 1, buildingId: bldg.id } });
  const room = await prisma.room.create({
    data: { number: `R_${testSuffix}`, type: 'FAN', basePrice: 2500, floorId: flr.id, status: 'VACANT' }
  });

  try {
    const reading = await prisma.meterReading.create({
      data: {
        roomId: room.id,
        waterValue: 120,
        electricityValue: 450,
        recordedBy: 'meter_officer_1',
      }
    });

    assert.strictEqual(reading.recordedBy, 'meter_officer_1');

    const fetched = await prisma.meterReading.findUnique({ where: { id: reading.id } });
    assert.strictEqual(fetched.recordedBy, 'meter_officer_1');
  } finally {
    await prisma.meterReading.deleteMany({ where: { roomId: room.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.floor.delete({ where: { id: flr.id } });
    await prisma.building.delete({ where: { id: bldg.id } });
    await prisma.property.delete({ where: { id: prop.id } });
  }
});

await runAsyncTest('4.4: Payment recordedBy field works with Prisma', async () => {
  const testSuffix = `pay_${Date.now()}`;
  const prop = await prisma.property.create({ data: { name: `Prop_${testSuffix}` } });
  const bldg = await prisma.building.create({
    data: { name: `Bldg_${testSuffix}`, waterRate: 18, electricityRate: 8, propertyId: prop.id }
  });
  const flr = await prisma.floor.create({ data: { number: 1, buildingId: bldg.id } });
  const room = await prisma.room.create({
    data: { number: `R_${testSuffix}`, type: 'FAN', basePrice: 2500, floorId: flr.id, status: 'OCCUPIED' }
  });
  const tenant = await prisma.tenant.create({
    data: { name: `T_${testSuffix}`, phone: '0812345678', roomId: room.id }
  });
  const invoice = await prisma.invoice.create({
    data: {
      roomId: room.id,
      tenantId: tenant.id,
      billingPeriod: `2099-11-${testSuffix.slice(-4)}`,
      previousWater: 0,
      currentWater: 5,
      previousElec: 0,
      currentElec: 10,
      waterCost: 90,
      electricityCost: 80,
      rentCost: 2500,
      totalAmount: 2670,
      status: 'UNPAID',
      dueDate: new Date('2099-11-05')
    }
  });

  try {
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amountPaid: 2670,
        paymentMethod: 'CASH',
        status: 'APPROVED',
        recordedBy: 'cashier_staff_2',
      }
    });

    assert.strictEqual(payment.recordedBy, 'cashier_staff_2');

    const fetched = await prisma.payment.findUnique({ where: { id: payment.id } });
    assert.strictEqual(fetched.recordedBy, 'cashier_staff_2');
  } finally {
    await prisma.payment.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.deleteMany({ where: { roomId: room.id } });
    await prisma.tenant.deleteMany({ where: { roomId: room.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.floor.delete({ where: { id: flr.id } });
    await prisma.building.delete({ where: { id: bldg.id } });
    await prisma.property.delete({ where: { id: prop.id } });
  }
});

await runAsyncTest('4.5: Booking recordedBy field works with Prisma', async () => {
  const testSuffix = `bk_${Date.now()}`;
  const prop = await prisma.property.create({ data: { name: `Prop_${testSuffix}` } });
  const bldg = await prisma.building.create({
    data: { name: `Bldg_${testSuffix}`, waterRate: 18, electricityRate: 8, propertyId: prop.id }
  });
  const flr = await prisma.floor.create({ data: { number: 1, buildingId: bldg.id } });
  const room = await prisma.room.create({
    data: { number: `R_${testSuffix}`, type: 'FAN', basePrice: 2500, floorId: flr.id, status: 'VACANT' }
  });

  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: room.id,
        customerName: 'Somchai Jaidee',
        customerPhone: '0891234567',
        expectedCheckInDate: new Date('2099-12-01'),
        depositAmount: 1000,
        paymentMethod: 'TRANSFER',
        status: 'ACTIVE',
        recordedBy: 'receptionist_3',
      }
    });

    assert.strictEqual(booking.recordedBy, 'receptionist_3');

    const fetched = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.strictEqual(fetched.recordedBy, 'receptionist_3');
  } finally {
    await prisma.booking.deleteMany({ where: { roomId: room.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.floor.delete({ where: { id: flr.id } });
    await prisma.building.delete({ where: { id: bldg.id } });
    await prisma.property.delete({ where: { id: prop.id } });
  }
});

// ----------------------------------------------------------------------------
// TEST SUITE 5: WASM Bundling & Patch Verification
// ----------------------------------------------------------------------------
console.log('\n--- Suite 5: WASM Worker Loader & Bundler Compatibility ---');

const loaderMjs = path.resolve('node_modules/.prisma/client/wasm-worker-loader.mjs');
const wasmJs = path.resolve('node_modules/.prisma/client/wasm.js');

runTest('5.1: wasm-worker-loader.mjs retains static import patch', () => {
  assert.ok(fs.existsSync(loaderMjs), 'wasm-worker-loader.mjs exists');
  const content = fs.readFileSync(loaderMjs, 'utf8');
  assert.ok(
    content.includes("import * as wasmModule from './query_engine_bg.wasm'"),
    'wasm-worker-loader.mjs does NOT have static WASM import patch!'
  );
});

runTest('5.2: wasm.js retains loader alias patch', () => {
  assert.ok(fs.existsSync(wasmJs), 'wasm.js exists');
  const content = fs.readFileSync(wasmJs, 'utf8');
  assert.ok(
    content.includes('./wasm-worker-loader.mjs'),
    'wasm.js does NOT reference wasm-worker-loader.mjs!'
  );
});

await prisma.$disconnect();

console.log('\n====================================================');
console.log(`      ALL TASK 1 TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('====================================================\n');
