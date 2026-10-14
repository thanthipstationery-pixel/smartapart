import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

console.log('====================================================');
console.log('   TESTING TASK 2: DATABASE HARDENING & D1 MIGRATION');
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
    console.error(' ', err);
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
    console.error(' ', err);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// TEST SUITE 1: prisma/schema.prisma Definitions
// ----------------------------------------------------------------------------
console.log('--- Suite 1: Prisma Schema Constraints & Indexes ---');

const schemaPath = path.resolve('prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

runTest('1.1: schema.prisma contains @@unique([roomId, billingPeriod]) on Invoice', () => {
  assert.ok(
    schemaContent.includes('@@unique([roomId, billingPeriod])'),
    'Expected @@unique([roomId, billingPeriod]) in schema.prisma'
  );
});

runTest('1.2: schema.prisma contains query indexes on Invoice (billingPeriod, status, roomId)', () => {
  assert.ok(
    schemaContent.includes('@@index([billingPeriod])'),
    'Expected @@index([billingPeriod]) on Invoice'
  );
  assert.ok(
    schemaContent.includes('@@index([status])'),
    'Expected @@index([status]) on Invoice'
  );
  assert.ok(
    schemaContent.includes('@@index([roomId])'),
    'Expected @@index([roomId]) on Invoice'
  );
});

runTest('1.3: schema.prisma contains @@index([roomId, readingDate]) on MeterReading', () => {
  assert.ok(
    schemaContent.includes('@@index([roomId, readingDate])'),
    'Expected @@index([roomId, readingDate]) on MeterReading'
  );
});

runTest('1.4: schema.prisma contains @@index([roomId, status]) on Tenant', () => {
  assert.ok(
    schemaContent.includes('@@index([roomId, status])'),
    'Expected @@index([roomId, status]) on Tenant'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 2: Cloudflare D1 Migration File Verification
// ----------------------------------------------------------------------------
console.log('\n--- Suite 2: D1 Migration Script (20261014_hardening.sql) ---');

const migrationPath = path.resolve('prisma/migrations/20261014_hardening.sql');

runTest('2.1: Migration file exists', () => {
  assert.ok(fs.existsSync(migrationPath), `Migration file not found at ${migrationPath}`);
});

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

runTest('2.2: Migration contains unique index for Invoice(roomId, billingPeriod)', () => {
  assert.ok(
    migrationSql.includes('CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_roomId_billingPeriod_key" ON "Invoice"("roomId", "billingPeriod");'),
    'Missing Invoice_roomId_billingPeriod_key unique index DDL'
  );
});

runTest('2.3: Migration contains performance indexes for Invoice, MeterReading, Tenant', () => {
  assert.ok(
    migrationSql.includes('CREATE INDEX IF NOT EXISTS "Invoice_billingPeriod_idx" ON "Invoice"("billingPeriod");'),
    'Missing Invoice_billingPeriod_idx'
  );
  assert.ok(
    migrationSql.includes('CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");'),
    'Missing Invoice_status_idx'
  );
  assert.ok(
    migrationSql.includes('CREATE INDEX IF NOT EXISTS "Invoice_roomId_idx" ON "Invoice"("roomId");'),
    'Missing Invoice_roomId_idx'
  );
  assert.ok(
    migrationSql.includes('CREATE INDEX IF NOT EXISTS "MeterReading_roomId_readingDate_idx" ON "MeterReading"("roomId", "readingDate");'),
    'Missing MeterReading_roomId_readingDate_idx'
  );
  assert.ok(
    migrationSql.includes('CREATE INDEX IF NOT EXISTS "Tenant_roomId_status_idx" ON "Tenant"("roomId", "status");'),
    'Missing Tenant_roomId_status_idx'
  );
});

// ----------------------------------------------------------------------------
// TEST SUITE 3: Local SQLite DB Index Verification
// ----------------------------------------------------------------------------
console.log('\n--- Suite 3: Local SQLite DB Schema & Index Verification ---');

const expectedIndexes = [
  { name: 'Invoice_roomId_billingPeriod_key', table: 'Invoice', unique: true },
  { name: 'Invoice_billingPeriod_idx', table: 'Invoice', unique: false },
  { name: 'Invoice_status_idx', table: 'Invoice', unique: false },
  { name: 'Invoice_roomId_idx', table: 'Invoice', unique: false },
  { name: 'MeterReading_roomId_readingDate_idx', table: 'MeterReading', unique: false },
  { name: 'Tenant_roomId_status_idx', table: 'Tenant', unique: false },
];

const dbPaths = [
  path.resolve('prisma/dev.db'),
  path.resolve('dev.db'),
].filter(p => fs.existsSync(p));

for (const dbPath of dbPaths) {
  const relativeDbName = path.relative(process.cwd(), dbPath);
  await runAsyncTest(`3.x: All 6 hardening indexes exist in ${relativeDbName}`, async () => {
    const client = createClient({ url: `file:${dbPath}` });
    const res = await client.execute(`
      SELECT name, tbl_name, sql FROM sqlite_master
      WHERE type = 'index'
    `);
    const foundNames = new Set(res.rows.map(r => r.name));

    for (const exp of expectedIndexes) {
      assert.ok(
        foundNames.has(exp.name),
        `Index ${exp.name} not found in ${relativeDbName}`
      );
    }

    // Verify unique index is unique
    const uniqueRow = res.rows.find(r => r.name === 'Invoice_roomId_billingPeriod_key');
    assert.ok(uniqueRow, 'Unique index row missing');
    assert.ok(
      String(uniqueRow.sql).toUpperCase().includes('UNIQUE'),
      `Expected ${uniqueRow.name} to have UNIQUE definition in SQL: ${uniqueRow.sql}`
    );

    client.close();
  });
}

// ----------------------------------------------------------------------------
// TEST SUITE 4: Functional Testing with Prisma Client
// ----------------------------------------------------------------------------
console.log('\n--- Suite 4: Prisma Client Functional & Constraint Verification ---');

const prisma = new PrismaClient();

await runAsyncTest('4.1: Unique constraint blocks duplicate invoice for same (roomId, billingPeriod)', async () => {
  const testSuffix = `t2_${Date.now()}`;
  const period = '2099-05';

  // 1. Setup minimal relational hierarchy
  const prop = await prisma.property.create({
    data: { name: `Prop_${testSuffix}` }
  });

  const bldg = await prisma.building.create({
    data: {
      name: `Bldg_${testSuffix}`,
      waterRate: 18,
      electricityRate: 8,
      propertyId: prop.id
    }
  });

  const flr = await prisma.floor.create({
    data: { number: 99, buildingId: bldg.id }
  });

  const room = await prisma.room.create({
    data: {
      number: `R999_${testSuffix}`,
      type: 'FAN',
      basePrice: 3000,
      floorId: flr.id,
      status: 'OCCUPIED'
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: `Tenant_${testSuffix}`,
      phone: '0812345678',
      roomId: room.id,
      status: 'ACTIVE'
    }
  });

  let invoice1 = null;
  try {
    // 2. Insert first invoice -> Should succeed
    invoice1 = await prisma.invoice.create({
      data: {
        roomId: room.id,
        tenantId: tenant.id,
        billingPeriod: period,
        previousWater: 100,
        currentWater: 105,
        previousElec: 500,
        currentElec: 530,
        waterCost: 90,
        electricityCost: 240,
        rentCost: 3000,
        totalAmount: 3330,
        status: 'UNPAID',
        dueDate: new Date('2099-05-05')
      }
    });
    assert.ok(invoice1 && invoice1.id, 'First invoice should be created');

    // 3. Attempt to insert duplicate invoice for same (roomId, billingPeriod) -> Must fail!
    let duplicateFailed = false;
    try {
      await prisma.invoice.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          billingPeriod: period, // Same period & room
          previousWater: 105,
          currentWater: 110,
          previousElec: 530,
          currentElec: 560,
          waterCost: 90,
          electricityCost: 240,
          rentCost: 3000,
          totalAmount: 3330,
          status: 'UNPAID',
          dueDate: new Date('2099-05-05')
        }
      });
    } catch (dupErr) {
      duplicateFailed = true;
      // In Prisma, unique constraint violation has code 'P2002'
      const isPrismaP2002 = dupErr.code === 'P2002';
      const isSqliteUnique = String(dupErr.message).includes('UNIQUE constraint failed');
      assert.ok(
        isPrismaP2002 || isSqliteUnique,
        `Expected unique constraint violation (P2002), got: ${dupErr.message} (code: ${dupErr.code})`
      );
    }
    assert.strictEqual(duplicateFailed, true, 'Duplicate invoice insertion MUST throw a unique constraint error');

  } finally {
    // Cleanup test data cleanly
    if (invoice1?.id) {
      await prisma.invoice.deleteMany({ where: { roomId: room.id } });
    }
    await prisma.tenant.deleteMany({ where: { roomId: room.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.floor.delete({ where: { id: flr.id } });
    await prisma.building.delete({ where: { id: bldg.id } });
    await prisma.property.delete({ where: { id: prop.id } });
  }
});

await runAsyncTest('4.2: Prisma queries on all new indexed fields succeed without error', async () => {
  // Query Invoice by billingPeriod
  const invByPeriod = await prisma.invoice.findMany({
    where: { billingPeriod: '2026-07' },
    take: 5
  });
  assert.ok(Array.isArray(invByPeriod), 'Query Invoice by billingPeriod should succeed');

  // Query Invoice by status
  const invByStatus = await prisma.invoice.findMany({
    where: { status: 'UNPAID' },
    take: 5
  });
  assert.ok(Array.isArray(invByStatus), 'Query Invoice by status should succeed');

  // Query MeterReading by roomId and readingDate
  const readings = await prisma.meterReading.findMany({
    where: { readingDate: { gte: new Date('2020-01-01') } },
    take: 5
  });
  assert.ok(Array.isArray(readings), 'Query MeterReading by readingDate should succeed');

  // Query Tenant by roomId and status
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    take: 5
  });
  assert.ok(Array.isArray(tenants), 'Query Tenant by status should succeed');
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
console.log(`      ALL TASK 2 TESTS PASSED! (${passedTests}/${totalTests})`);
console.log('====================================================\n');
