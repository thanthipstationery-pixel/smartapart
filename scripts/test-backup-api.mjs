import { register, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert';

// Define global require for ESM environments (needed by prisma.ts local SQLite fallback)
globalThis.require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Setup dynamic module loader for Next.js internal paths and TypeScript files
// ---------------------------------------------------------------------------
const loaderCode = `
import { pathToFileURL } from 'node:url';
const rootUrl = pathToFileURL(process.cwd() + '/').href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier === 'next/headers') {
    return nextResolve('next/headers.js', context);
  }
  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2);
    const resolvedUrl = new URL('./src/' + sub + '.ts', rootUrl).href;
    return nextResolve(resolvedUrl, context);
  }
  return nextResolve(specifier, context);
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), import.meta.url);

// Ensure test environment JWT secret
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'smartapart-test-jwt-secret-key-32chars-min';
}

// ---------------------------------------------------------------------------
// Dynamic Imports of Target Modules
// ---------------------------------------------------------------------------
const { signJWT } = await import('@/lib/auth');
const { prisma } = await import('@/lib/prisma');
const { parseAndSanitizeSql, ALLOWED_TABLES } = await import('@/lib/backupSql');
const { GET: exportHandler } = await import('../src/app/api/admin/backup/export/route.ts');
const { POST: restoreHandler } = await import('../src/app/api/admin/backup/restore/route.ts');

console.log('================================================================');
console.log('      TEST SUITE: BACKUP EXPORT & RESTORE API ENDPOINTS         ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Helper: Generate valid admin token
async function getValidAdminToken() {
  return await signJWT({ username: 'admin', name: 'System Administrator' });
}

// ============================================================================
// SUITE 1: Export Endpoint Authentication (GET /api/admin/backup/export)
// ============================================================================
console.log('--- Suite 1: Export Endpoint Authentication ---');

await runTest('1.1: GET /export without cookie returns 401 Unauthorized', async () => {
  const req = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
  });
  const res = await exportHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

await runTest('1.2: GET /export with invalid JWT token returns 401 Unauthorized', async () => {
  const req = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
    headers: {
      cookie: 'admin_session=invalid.token.payload',
    },
  });
  const res = await exportHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

await runTest('1.3: GET /export with empty admin_session returns 401 Unauthorized', async () => {
  const req = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
    headers: {
      cookie: 'admin_session=',
    },
  });
  const res = await exportHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

// ============================================================================
// SUITE 2: Export Endpoint Functional & Headers (GET /api/admin/backup/export)
// ============================================================================
console.log('\n--- Suite 2: Export Endpoint Functional & Headers ---');

let exportedSql = '';

await runTest('2.1: GET /export with valid admin token returns 200 and SQL dump', async () => {
  const token = await getValidAdminToken();
  const req = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
    headers: {
      cookie: `admin_session=${token}`,
    },
  });
  const res = await exportHandler(req);
  assert.strictEqual(res.status, 200);

  // Headers verification
  const contentType = res.headers.get('content-type');
  assert.ok(
    contentType && contentType.includes('application/sql'),
    `Expected application/sql content-type, got: ${contentType}`
  );

  const disposition = res.headers.get('content-disposition');
  assert.ok(
    disposition && disposition.includes('attachment;') && disposition.includes('smartapart_backup_') && disposition.endsWith('.sql"'),
    `Expected attachment with smartapart_backup_*.sql filename, got: ${disposition}`
  );

  const cacheControl = res.headers.get('cache-control');
  assert.strictEqual(cacheControl, 'no-store');

  exportedSql = await res.text();
  assert.ok(exportedSql.length > 0, 'Exported SQL dump should not be empty');
  assert.ok(exportedSql.includes('BEGIN TRANSACTION;'), 'Dump should include BEGIN TRANSACTION');
  assert.ok(exportedSql.includes('COMMIT;'), 'Dump should include COMMIT');
  assert.ok(exportedSql.includes('DELETE FROM "BuildingMonthlyUtility";'), 'Dump should clean child tables first');
  assert.ok(exportedSql.includes('DELETE FROM "Property";'), 'Dump should clean parent tables');
});

await runTest('2.2: Exported SQL dump passes parseAndSanitizeSql whitelist validator', async () => {
  assert.ok(exportedSql.length > 0, 'Precondition: exportedSql must exist');
  const result = parseAndSanitizeSql(exportedSql);
  assert.strictEqual(result.valid, true, `Validation failed with error: ${result.error}`);
  assert.ok(result.statements.length > 0, 'Expected non-empty sanitized statements');
});

// ============================================================================
// SUITE 3: Restore Endpoint Authentication & Input Validation (POST)
// ============================================================================
console.log('\n--- Suite 3: Restore Endpoint Authentication & Input Validation ---');

await runTest('3.1: POST /restore without cookie returns 401 Unauthorized', async () => {
  const req = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sqlContent: 'DELETE FROM "Property";' }),
  });
  const res = await restoreHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

await runTest('3.2: POST /restore with invalid JWT token returns 401 Unauthorized', async () => {
  const req = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: 'admin_session=tampered.or.malicious.token',
    },
    body: JSON.stringify({ sqlContent: 'DELETE FROM "Property";' }),
  });
  const res = await restoreHandler(req);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

await runTest('3.3: POST /restore with missing sqlContent returns 400', async () => {
  const token = await getValidAdminToken();
  const req = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `admin_session=${token}`,
    },
    body: JSON.stringify({}),
  });
  const res = await restoreHandler(req);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error, 'Expected error message for missing sqlContent');
});

await runTest('3.4: POST /restore with empty whitespace sqlContent returns 400', async () => {
  const token = await getValidAdminToken();
  const req = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `admin_session=${token}`,
    },
    body: JSON.stringify({ sqlContent: '   \n  \t  ' }),
  });
  const res = await restoreHandler(req);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error, 'Expected error message for empty sqlContent');
});

// ============================================================================
// SUITE 4: SQL Security Sanitizer & Whitelist Rejection (POST)
// ============================================================================
console.log('\n--- Suite 4: SQL Sanitizer Whitelist Rejection ---');

const maliciousPayloads = [
  { name: 'DROP TABLE injection', sql: 'DROP TABLE "Tenant";' },
  { name: 'PRAGMA command injection', sql: 'PRAGMA table_info("Admin");' },
  { name: 'UPDATE statement injection', sql: 'UPDATE "Admin" SET password = "hacked";' },
  { name: 'ALTER TABLE injection', sql: 'ALTER TABLE "Tenant" ADD COLUMN hack TEXT;' },
  { name: 'ATTACH DATABASE injection', sql: "ATTACH DATABASE '/tmp/pwn.db' AS pwn;" },
  { name: 'Unknown table deletion', sql: 'DELETE FROM "Users";' },
  { name: 'Unknown table insertion', sql: 'INSERT INTO "Secrets" ("key") VALUES (\'abc\');' },
  { name: 'DELETE with WHERE clause', sql: 'DELETE FROM "Property" WHERE id = \'1\';' },
  { name: 'INSERT with subquery SELECT', sql: 'INSERT INTO "Property" ("id", "name") SELECT id, name FROM "Admin";' },
  { name: 'Unterminated string literal', sql: 'INSERT INTO "Property" ("id", "name") VALUES (\'prop-1\', \'unclosed);' },
];

for (let i = 0; i < maliciousPayloads.length; i++) {
  const { name, sql } = maliciousPayloads[i];
  await runTest(`4.${i + 1}: Rejects ${name} with 400 Bad Request`, async () => {
    const token = await getValidAdminToken();
    const req = new Request('http://localhost/api/admin/backup/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `admin_session=${token}`,
      },
      body: JSON.stringify({ sqlContent: sql }),
    });
    const res = await restoreHandler(req);
    assert.strictEqual(res.status, 400, `Expected status 400 for ${name}, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.error, `Expected error message in response for ${name}`);
  });
}

// ============================================================================
// SUITE 5: Transaction Atomic Rollback on Execution Error (POST)
// ============================================================================
console.log('\n--- Suite 5: Transaction Atomic Rollback on Execution Error ---');

await runTest('5.1: Database rolls back atomically when a statement fails in transaction', async () => {
  const token = await getValidAdminToken();

  // Snapshot initial count of Property
  const initialPropCount = await prisma.property.count();
  const testPropId = `rollback-test-${Date.now()}`;

  // Craft a payload that will pass sanitization (valid DELETE/INSERT on Property)
  // but will fail at SQLite execution time due to duplicate Primary Key violation on Property
  const failingSql = [
    `INSERT INTO "Property" ("id", "name") VALUES ('${testPropId}', 'Rollback Test Property');`,
    `INSERT INTO "Property" ("id", "name") VALUES ('${testPropId}', 'Duplicate PK Violation');`,
  ].join('\n');

  const req = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `admin_session=${token}`,
    },
    body: JSON.stringify({ sqlContent: failingSql }),
  });

  const res = await restoreHandler(req);
  assert.strictEqual(res.status, 500, `Expected status 500 on transaction failure, got ${res.status}`);
  const data = await res.json();
  assert.ok(
    data.error && data.error.startsWith('เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล:'),
    `Expected Thai error prefix, got: ${data.error}`
  );

  // CRITICAL CHECK: Verify atomic rollback - the first INSERT statement MUST NOT persist!
  const inserted = await prisma.property.findUnique({
    where: { id: testPropId },
  });
  assert.strictEqual(
    inserted,
    null,
    'Atomic rollback failed! The first record persisted despite the transaction error.'
  );

  const finalPropCount = await prisma.property.count();
  assert.strictEqual(
    finalPropCount,
    initialPropCount,
    `Property table count changed! Expected ${initialPropCount}, got ${finalPropCount}`
  );
});

// ============================================================================
// SUITE 6: Full Roundtrip Export & Restore Verification
// ============================================================================
console.log('\n--- Suite 6: Full Roundtrip Export & Restore Verification ---');

await runTest('6.1: Roundtrip via JSON payload restores database state perfectly', async () => {
  const token = await getValidAdminToken();

  // Step 1: Export current database snapshot
  const exportReq = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
    headers: { cookie: `admin_session=${token}` },
  });
  const exportRes = await exportHandler(exportReq);
  assert.strictEqual(exportRes.status, 200);
  const snapshotSql = await exportRes.text();
  assert.ok(snapshotSql.length > 0);

  const originalProps = await prisma.property.findMany();
  assert.ok(originalProps.length > 0, 'Database should have at least one property');

  // Step 2: Make a temporary modification to the database
  const tempPropId = `temp-prop-${Date.now()}`;
  await prisma.property.create({
    data: {
      id: tempPropId,
      name: 'Temporary Property Before Restore',
      phone: '0999999999',
    },
  });

  const modifiedCheck = await prisma.property.findUnique({ where: { id: tempPropId } });
  assert.ok(modifiedCheck, 'Temporary property should exist before restore');

  // Step 3: Restore the original snapshot via JSON payload
  const restoreReq = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `admin_session=${token}`,
    },
    body: JSON.stringify({ sqlContent: snapshotSql }),
  });
  const restoreRes = await restoreHandler(restoreReq);
  assert.strictEqual(restoreRes.status, 200, `Restore failed with status ${restoreRes.status}`);
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.success, true);
  assert.strictEqual(restoreData.message, 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว');
  assert.ok(restoreData.statementsExecuted > 0);

  // Step 4: Verify the temporary property is wiped and original properties are back
  const tempCheckAfter = await prisma.property.findUnique({ where: { id: tempPropId } });
  assert.strictEqual(tempCheckAfter, null, 'Temporary property must not exist after restore');

  const restoredProps = await prisma.property.findMany();
  assert.strictEqual(restoredProps.length, originalProps.length);
  assert.strictEqual(restoredProps[0].id, originalProps[0].id);
  assert.strictEqual(restoredProps[0].name, originalProps[0].name);
});

await runTest('6.2: Roundtrip via FormData (file upload) restores successfully', async () => {
  const token = await getValidAdminToken();

  // Export fresh snapshot
  const exportReq = new Request('http://localhost/api/admin/backup/export', {
    method: 'GET',
    headers: { cookie: `admin_session=${token}` },
  });
  const exportRes = await exportHandler(exportReq);
  const snapshotSql = await exportRes.text();

  // Build FormData with SQL file Blob
  const formData = new FormData();
  const fileBlob = new Blob([snapshotSql], { type: 'application/sql' });
  formData.append('file', fileBlob, 'backup_test.sql');

  // Next.js Request with FormData body
  const restoreReq = new Request('http://localhost/api/admin/backup/restore', {
    method: 'POST',
    headers: {
      cookie: `admin_session=${token}`,
    },
    body: formData,
  });

  const restoreRes = await restoreHandler(restoreReq);
  assert.strictEqual(restoreRes.status, 200);
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.success, true);
  assert.strictEqual(restoreData.message, 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว');
  assert.ok(restoreData.statementsExecuted > 0);
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('ALL API ENDPOINT TESTS PASSED SUCCESSFULLY! (Exit Code 0)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${totalTests - passedTests} tests failed! (Exit Code 1)\n`);
  process.exit(1);
}
