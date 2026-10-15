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

// Filter noisy local dev context fallback logs
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

// ---------------------------------------------------------------------------
// Dynamic Imports of Target Modules
// ---------------------------------------------------------------------------
const { signJWT, verifyJWT, getAuthSession } = await import('@/lib/auth');
const { prisma } = await import('@/lib/prisma');

// Route Handlers
const { POST: postMeterReading } = await import('../src/app/api/meter-readings/route.ts');
const { POST: postPayment } = await import('../src/app/api/payments/route.ts');
const { POST: postBooking } = await import('../src/app/api/bookings/route.ts');
const { POST: cancelBooking } = await import('../src/app/api/bookings/[id]/cancel/route.ts');
const { POST: checkInBooking } = await import('../src/app/api/bookings/[id]/check-in/route.ts');
const { POST: postTenant } = await import('../src/app/api/tenants/route.ts');
const { PUT: putTenant, DELETE: deleteTenant } = await import('../src/app/api/tenants/[id]/route.ts');
const { POST: checkoutTenant } = await import('../src/app/api/tenants/[id]/checkout/route.ts');
const { POST: transferTenant } = await import('../src/app/api/tenants/[id]/transfer/route.ts');
const { GET: exportBackup } = await import('../src/app/api/admin/backup/export/route.ts');
const { POST: restoreBackup } = await import('../src/app/api/admin/backup/restore/route.ts');
const { GET: getAdminUsers, POST: createAdminUser } = await import('../src/app/api/admin/users/route.ts');
const { PUT: updateAdminUser, DELETE: deleteAdminUser } = await import('../src/app/api/admin/users/[id]/route.ts');

console.log('================================================================');
console.log('  TEST SUITE: TASK 4 - VIEWER MUTATION GUARDS & recordedBy      ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Helper to make Next.js Request with cookie
function makeRequest(url, method, body, cookieToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieToken) {
    headers['Cookie'] = `admin_session=${cookieToken}`;
  }
  const init = { method, headers };
  if (body !== undefined && body !== null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(url, init);
}

// ---------------------------------------------------------------------------
// Test Data Setup
// ---------------------------------------------------------------------------
const runId = Date.now();
const testUsers = {
  owner: null,
  staff: null,
  viewer: null,
};
const testTokens = {
  owner: '',
  staff: '',
  viewer: '',
};

let testBuilding;
let testFloor;
let testRoom1;
let testRoom2;
let testTenant;
let testBooking;
let testInvoice;

try {
  // Create test property if none exists
  let property = await prisma.property.findFirst();
  if (!property) {
    property = await prisma.property.create({
      data: {
        id: `prop-t4-${runId}`,
        name: `T4 Test Property ${runId}`,
      },
    });
  }

  // Create building, floor, rooms
  testBuilding = await prisma.building.create({
    data: {
      id: `bld-t4-${runId}`,
      propertyId: property.id,
      name: `T4 Building ${runId}`,
      waterRate: 18.0,
      electricityRate: 7.0,
    },
  });

  testFloor = await prisma.floor.create({
    data: {
      id: `flr-t4-${runId}`,
      buildingId: testBuilding.id,
      number: 1,
    },
  });

  testRoom1 = await prisma.room.create({
    data: {
      id: `room1-t4-${runId}`,
      floorId: testFloor.id,
      number: `T4-101-${runId}`,
      type: 'FAN',
      status: 'OCCUPIED',
      basePrice: 3500.0,
    },
  });

  testRoom2 = await prisma.room.create({
    data: {
      id: `room2-t4-${runId}`,
      floorId: testFloor.id,
      number: `T4-102-${runId}`,
      type: 'FAN',
      status: 'VACANT',
      basePrice: 3500.0,
    },
  });


  // Create test tenant in room 1
  testTenant = await prisma.tenant.create({
    data: {
      id: `tenant-t4-${runId}`,
      name: 'Somchai Tenant',
      phone: '0811111111',
      roomId: testRoom1.id,
      status: 'ACTIVE',
      securityDeposit: 3500.0,
      keycardCount: 1,
      keycardDeposit: 200.0,
    },
  });

  // Create test invoice for payments
  testInvoice = await prisma.invoice.create({
    data: {
      id: `inv-t4-${runId}`,
      roomId: testRoom1.id,
      tenantId: testTenant.id,
      billingPeriod: '2026-10',
      previousWater: 10,
      currentWater: 15,
      previousElec: 100,
      currentElec: 150,
      waterCost: 90.0,
      electricityCost: 350.0,
      rentCost: 3500.0,
      otherCost: 0,
      totalAmount: 3940.0,
      status: 'UNPAID',
      dueDate: new Date(),
    },
  });

  // Create test booking in room 2
  testBooking = await prisma.booking.create({
    data: {
      id: `book-t4-${runId}`,
      roomId: testRoom2.id,
      customerName: 'Somsak Booker',
      customerPhone: '0822222222',
      expectedCheckInDate: new Date(),
      depositAmount: 1000.0,
      status: 'ACTIVE',
    },
  });

  // Create test admin users (OWNER, STAFF, VIEWER)
  testUsers.owner = await prisma.admin.create({
    data: {
      id: `owner-t4-${runId}`,
      username: `owner_t4_${runId}`,
      password: 'hashed_password_owner',
      name: 'Alice Owner',
      role: 'OWNER',
      isActive: true,
    },
  });

  testUsers.staff = await prisma.admin.create({
    data: {
      id: `staff-t4-${runId}`,
      username: `staff_t4_${runId}`,
      password: 'hashed_password_staff',
      name: 'Bob Staff',
      role: 'STAFF',
      isActive: true,
    },
  });

  testUsers.viewer = await prisma.admin.create({
    data: {
      id: `viewer-t4-${runId}`,
      username: `viewer_t4_${runId}`,
      password: 'hashed_password_viewer',
      name: 'Charlie Viewer',
      role: 'VIEWER',
      isActive: true,
    },
  });

  // Generate tokens
  testTokens.owner = await signJWT({
    id: testUsers.owner.id,
    username: testUsers.owner.username,
    name: testUsers.owner.name,
    role: 'OWNER',
  });

  testTokens.staff = await signJWT({
    id: testUsers.staff.id,
    username: testUsers.staff.username,
    name: testUsers.staff.name,
    role: 'STAFF',
  });

  testTokens.viewer = await signJWT({
    id: testUsers.viewer.id,
    username: testUsers.viewer.username,
    name: testUsers.viewer.name,
    role: 'VIEWER',
  });

  // ============================================================================
  // SUITE 1: VIEWER Role Mutation Guards (HTTP 403 Forbidden on all changes)
  // ============================================================================
  console.log('--- Suite 1: VIEWER Role Mutation Guards (403 Forbidden) ---');

  await runTest('1.1: VIEWER receives 403 on POST /api/meter-readings', async () => {
    const req = makeRequest('http://localhost/api/meter-readings', 'POST', {
      roomId: testRoom1.id,
      waterValue: 50,
      electricityValue: 200,
    }, testTokens.viewer);
    const res = await postMeterReading(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.2: VIEWER receives 403 on POST /api/payments', async () => {
    const req = makeRequest('http://localhost/api/payments', 'POST', {
      invoiceId: testInvoice.id,
      amountPaid: 1000,
    }, testTokens.viewer);
    const res = await postPayment(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.3: VIEWER receives 403 on POST /api/bookings', async () => {
    const req = makeRequest('http://localhost/api/bookings', 'POST', {
      roomId: testRoom2.id,
      customerName: 'Viewer Booking Attempt',
      customerPhone: '0899999999',
      expectedCheckInDate: '2026-11-01',
    }, testTokens.viewer);
    const res = await postBooking(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.4: VIEWER receives 403 on POST /api/bookings/[id]/cancel', async () => {
    const req = makeRequest(`http://localhost/api/bookings/${testBooking.id}/cancel`, 'POST', {
      action: 'REFUND',
    }, testTokens.viewer);
    const res = await cancelBooking(req, { params: Promise.resolve({ id: testBooking.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.5: VIEWER receives 403 on POST /api/bookings/[id]/check-in', async () => {
    const req = makeRequest(`http://localhost/api/bookings/${testBooking.id}/check-in`, 'POST', {
      startDate: '2026-10-15',
    }, testTokens.viewer);
    const res = await checkInBooking(req, { params: Promise.resolve({ id: testBooking.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.6: VIEWER receives 403 on POST /api/tenants', async () => {
    const req = makeRequest('http://localhost/api/tenants', 'POST', {
      name: 'New Tenant Viewer Attempt',
      phone: '0812345678',
      startDate: '2026-10-15',
      roomId: testRoom2.id,
    }, testTokens.viewer);
    const res = await postTenant(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.7: VIEWER receives 403 on PUT /api/tenants/[id]', async () => {
    const req = makeRequest(`http://localhost/api/tenants/${testTenant.id}`, 'PUT', {
      name: 'Modified Tenant Name',
    }, testTokens.viewer);
    const res = await putTenant(req, { params: Promise.resolve({ id: testTenant.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.8: VIEWER receives 403 on DELETE /api/tenants/[id]', async () => {
    const req = makeRequest(`http://localhost/api/tenants/${testTenant.id}`, 'DELETE', null, testTokens.viewer);
    const res = await deleteTenant(req, { params: Promise.resolve({ id: testTenant.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.9: VIEWER receives 403 on POST /api/tenants/[id]/checkout', async () => {
    const req = makeRequest(`http://localhost/api/tenants/${testTenant.id}/checkout`, 'POST', {
      actionType: 'FINAL_CHECKOUT',
    }, testTokens.viewer);
    const res = await checkoutTenant(req, { params: Promise.resolve({ id: testTenant.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  await runTest('1.10: VIEWER receives 403 on POST /api/tenants/[id]/transfer', async () => {
    const req = makeRequest(`http://localhost/api/tenants/${testTenant.id}/transfer`, 'POST', {
      targetRoomId: testRoom2.id,
    }, testTokens.viewer);
    const res = await transferTenant(req, { params: Promise.resolve({ id: testTenant.id }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('บัญชีโหมดตรวจการ'), `Expected Thai viewer error message, got: ${data.error}`);
  });

  // ============================================================================
  // SUITE 2: Database Backup Role Guards (Strict OWNER Only)
  // ============================================================================
  console.log('\n--- Suite 2: Database Backup Role Guards (Strict OWNER Only) ---');

  await runTest('2.1: GET /api/admin/backup/export rejects VIEWER with 403 Forbidden', async () => {
    const req = makeRequest('http://localhost/api/admin/backup/export', 'GET', null, testTokens.viewer);
    const res = await exportBackup(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น');
  });

  await runTest('2.2: GET /api/admin/backup/export rejects STAFF with 403 Forbidden', async () => {
    const req = makeRequest('http://localhost/api/admin/backup/export', 'GET', null, testTokens.staff);
    const res = await exportBackup(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น');
  });

  await runTest('2.3: POST /api/admin/backup/restore rejects VIEWER with 403 Forbidden', async () => {
    const req = makeRequest('http://localhost/api/admin/backup/restore', 'POST', {
      sqlContent: 'DELETE FROM "Property";',
    }, testTokens.viewer);
    const res = await restoreBackup(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น');
  });

  await runTest('2.4: POST /api/admin/backup/restore rejects STAFF with 403 Forbidden', async () => {
    const req = makeRequest('http://localhost/api/admin/backup/restore', 'POST', {
      sqlContent: 'DELETE FROM "Property";',
    }, testTokens.staff);
    const res = await restoreBackup(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error, 'สงวนสิทธิ์เฉพาะผู้ดูแลระดับ OWNER เท่านั้น');
  });

  await runTest('2.5: GET /api/admin/backup/export allows OWNER with 200 OK', async () => {
    const req = makeRequest('http://localhost/api/admin/backup/export', 'GET', null, testTokens.owner);
    const res = await exportBackup(req);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('BEGIN TRANSACTION;'), 'Dump should contain BEGIN TRANSACTION');
  });

  // ============================================================================
  // SUITE 3: Operational Accountability (`recordedBy`) for STAFF & OWNER
  // ============================================================================
  console.log('\n--- Suite 3: Operational Accountability (recordedBy) ---');

  // Create dedicated room for STAFF mutations
  const roomStaff = await prisma.room.create({
    data: {
      id: `room-staff-${runId}`,
      floorId: testFloor.id,
      number: `STAFF-103-${runId}`,
      type: 'FAN',
      status: 'VACANT',
      basePrice: 3500.0,
    },
  });

  await runTest('3.1: STAFF records meter reading and saves display name in recordedBy', async () => {
    const req = makeRequest('http://localhost/api/meter-readings', 'POST', {
      roomId: roomStaff.id,
      waterValue: 12.5,
      electricityValue: 88.0,
      readingDate: '2026-10-01',
    }, testTokens.staff);
    const res = await postMeterReading(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const readingInDb = await prisma.meterReading.findUnique({
      where: { id: data.id },
    });
    assert.ok(readingInDb, 'Meter reading should exist in DB');
    assert.strictEqual(readingInDb.recordedBy, 'Bob Staff');
  });

  await runTest('3.2: STAFF records payment and saves display name in recordedBy', async () => {
    const req = makeRequest('http://localhost/api/payments', 'POST', {
      invoiceId: testInvoice.id,
      amountPaid: 500,
      paymentMethod: 'CASH',
    }, testTokens.staff);
    const res = await postPayment(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const paymentInDb = await prisma.payment.findUnique({
      where: { id: data.id },
    });
    assert.ok(paymentInDb, 'Payment should exist in DB');
    assert.strictEqual(paymentInDb.recordedBy, 'Bob Staff');
  });

  await runTest('3.3: STAFF creates booking and saves display name in recordedBy', async () => {
    const req = makeRequest('http://localhost/api/bookings', 'POST', {
      roomId: roomStaff.id,
      customerName: 'Staff Client',
      customerPhone: '0833333333',
      expectedCheckInDate: '2026-11-15',
      depositAmount: 500,
    }, testTokens.staff);
    const res = await postBooking(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const bookingInDb = await prisma.booking.findUnique({
      where: { id: data.id },
    });
    assert.ok(bookingInDb, 'Booking should exist in DB');
    assert.strictEqual(bookingInDb.recordedBy, 'Bob Staff');
  });

  await runTest('3.4: Operator fallback to username when name is empty', async () => {
    const usernameOnlyToken = await signJWT({
      username: 'nameless_staff',
      name: '',
      role: 'STAFF',
    });

    const roomFallback = await prisma.room.create({
      data: {
        id: `room-fallback-${runId}`,
        floorId: testFloor.id,
        number: `FALLBACK-${runId}`,
        type: 'FAN',
        status: 'VACANT',
        basePrice: 3500.0,
      },
    });

    const req = makeRequest('http://localhost/api/meter-readings', 'POST', {
      roomId: roomFallback.id,
      waterValue: 5.0,
      electricityValue: 10.0,
      readingDate: '2026-10-02',
    }, usernameOnlyToken);
    const res = await postMeterReading(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const readingInDb = await prisma.meterReading.findUnique({
      where: { id: data.id },
    });
    assert.strictEqual(readingInDb.recordedBy, 'nameless_staff');
  });

  await runTest('3.5: Fallback to "ระบบ" when session is missing', async () => {
    const roomSystem = await prisma.room.create({
      data: {
        id: `room-system-${runId}`,
        floorId: testFloor.id,
        number: `SYSTEM-${runId}`,
        type: 'FAN',
        status: 'VACANT',
        basePrice: 3500.0,
      },
    });


    const req = makeRequest('http://localhost/api/meter-readings', 'POST', {
      roomId: roomSystem.id,
      waterValue: 1.0,
      electricityValue: 2.0,
      readingDate: '2026-10-03',
    });
    const res = await postMeterReading(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    const readingInDb = await prisma.meterReading.findUnique({
      where: { id: data.id },
    });
    assert.strictEqual(readingInDb.recordedBy, 'ระบบ');
  });

  // ============================================================================
  // SUITE 4: Hardened authenticateOwner (Deleted / Demoted / Inactive Tokens)
  // ============================================================================
  console.log('\n--- Suite 4: Hardened authenticateOwner Verification ---');

  await runTest('4.1: Token with id of deleted user receives 403 Forbidden', async () => {
    // Create temporary owner
    const deletedUser = await prisma.admin.create({
      data: {
        username: `deleted_owner_${runId}`,
        password: 'pass',
        name: 'Deleted Owner',
        role: 'OWNER',
        isActive: true,
      },
    });

    const deletedToken = await signJWT({
      id: deletedUser.id,
      username: deletedUser.username,
      name: deletedUser.name,
      role: 'OWNER',
    });

    // Delete user from DB
    await prisma.admin.delete({ where: { id: deletedUser.id } });

    // Request admin users endpoint
    const req = makeRequest('http://localhost/api/admin/users', 'GET', null, deletedToken);
    const res = await getAdminUsers(req);
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error && data.error.includes('Forbidden'), 'Expected Forbidden error');
  });

  await runTest('4.2: Token with OWNER role for user demoted to STAFF in DB receives 403', async () => {
    const demotedUser = await prisma.admin.create({
      data: {
        username: `demoted_owner_${runId}`,
        password: 'pass',
        name: 'Demoted Owner',
        role: 'OWNER',
        isActive: true,
      },
    });

    // Old token signed with OWNER
    const oldOwnerToken = await signJWT({
      id: demotedUser.id,
      username: demotedUser.username,
      name: demotedUser.name,
      role: 'OWNER',
    });

    // Demote in database to STAFF
    await prisma.admin.update({
      where: { id: demotedUser.id },
      data: { role: 'STAFF' },
    });

    // Request admin users endpoint
    const req = makeRequest('http://localhost/api/admin/users', 'GET', null, oldOwnerToken);
    const res = await getAdminUsers(req);
    assert.strictEqual(res.status, 403);

    // Clean up
    await prisma.admin.delete({ where: { id: demotedUser.id } });
  });

  await runTest('4.3: Token for user deactivated in DB receives 403', async () => {
    const deactivatedUser = await prisma.admin.create({
      data: {
        username: `deactivated_owner_${runId}`,
        password: 'pass',
        name: 'Deactivated Owner',
        role: 'OWNER',
        isActive: false,
      },
    });

    const token = await signJWT({
      id: deactivatedUser.id,
      username: deactivatedUser.username,
      name: deactivatedUser.name,
      role: 'OWNER',
    });

    const req = makeRequest('http://localhost/api/admin/users', 'GET', null, token);
    const res = await getAdminUsers(req);
    assert.strictEqual(res.status, 403);

    // Clean up
    await prisma.admin.delete({ where: { id: deactivatedUser.id } });
  });

  await runTest('4.4: Active OWNER user accesses admin endpoints successfully', async () => {
    const req = makeRequest('http://localhost/api/admin/users', 'GET', null, testTokens.owner);
    const res = await getAdminUsers(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.users), 'Expected array of users');
  });

  // ============================================================================
  // SUITE 5: Shared getAuthSession Helper Unit Tests
  // ============================================================================
  console.log('\n--- Suite 5: getAuthSession Helper Tests ---');

  await runTest('5.1: getAuthSession extracts session from Cookie header', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { Cookie: `admin_session=${testTokens.staff}` },
    });
    const session = await getAuthSession(req);
    assert.ok(session);
    assert.strictEqual(session.id, testUsers.staff.id);
    assert.strictEqual(session.role, 'STAFF');
    assert.strictEqual(session.name, 'Bob Staff');
  });

  await runTest('5.2: getAuthSession extracts session from Bearer authorization header', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${testTokens.owner}` },
    });
    const session = await getAuthSession(req);
    assert.ok(session);
    assert.strictEqual(session.id, testUsers.owner.id);
    assert.strictEqual(session.role, 'OWNER');
    assert.strictEqual(session.username, testUsers.owner.username);
  });

  await runTest('5.3: getAuthSession returns null when token is missing or invalid', async () => {
    const unauthReq = new Request('http://localhost/api/test');
    const session1 = await getAuthSession(unauthReq);
    assert.strictEqual(session1, null);

    const invalidReq = new Request('http://localhost/api/test', {
      headers: { Cookie: 'admin_session=invalid.malformed.jwt' },
    });
    const session2 = await getAuthSession(invalidReq);
    assert.strictEqual(session2, null);
  });

} finally {
  // Clean up test data
  try {
    if (testInvoice) await prisma.payment.deleteMany({ where: { invoiceId: testInvoice.id } });
    if (testTenant) await prisma.invoice.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.meterReading.deleteMany({ where: { roomId: { in: [testRoom1?.id, testRoom2?.id] } } });
    if (testBooking) await prisma.booking.deleteMany({ where: { id: testBooking.id } });
    if (testTenant) await prisma.tenant.deleteMany({ where: { id: testTenant.id } });
    await prisma.room.deleteMany({ where: { floorId: testFloor?.id } });
    if (testFloor) await prisma.floor.deleteMany({ where: { id: testFloor.id } });
    if (testBuilding) await prisma.building.deleteMany({ where: { id: testBuilding.id } });
    await prisma.admin.deleteMany({
      where: {
        id: { in: [testUsers.owner?.id, testUsers.staff?.id, testUsers.viewer?.id].filter(Boolean) },
      },
    });
  } catch (cleanErr) {
    console.error('Error during test cleanup:', cleanErr);
  }
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('ALL TASK 4 TESTS PASSED SUCCESSFULLY! (Exit Code 0)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${totalTests - passedTests} tests failed! (Exit Code 1)\n`);
  process.exit(1);
}
