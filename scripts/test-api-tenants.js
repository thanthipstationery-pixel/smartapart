const assert = require('node:assert');
require('dotenv').config();
const { register, createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const rootUrl = pathToFileURL(process.cwd() + '/').href;
globalThis.require = createRequire(rootUrl);

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

register('data:text/javascript,' + encodeURIComponent(loaderCode), rootUrl);

async function main() {
  console.log('======================================================');
  console.log('  TEST SUITE: TENANT CONTRACT & CO-TENANT API ROUTES  ');
  console.log('======================================================\n');

  // Suppress local prisma dev logging if any
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

  const { prisma } = await import('@/lib/prisma');
  const { signJWT } = await import('@/lib/auth');
  const { POST: createTenantHandler } = await import('../src/app/api/tenants/route.ts');
  const { GET: getTenantHandler, PUT: updateTenantHandler } = await import('../src/app/api/tenants/[id]/route.ts');

  // Generate tokens for OWNER and VIEWER
  const ownerToken = await signJWT({ username: 'owner_test', name: 'Owner', role: 'OWNER' });
  const viewerToken = await signJWT({ username: 'viewer_test', name: 'Viewer', role: 'VIEWER' });

  const authHeaders = (token) => ({
    'Cookie': `admin_session=${token}`,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // Setup test building, floor, rooms
  const testProperty = await prisma.property.create({
    data: { name: 'API Test Property' },
  });

  const testBuilding = await prisma.building.create({
    data: {
      name: 'API Test Building',
      waterRate: 18,
      electricityRate: 8,
      propertyId: testProperty.id,
    },
  });

  const testFloor = await prisma.floor.create({
    data: {
      number: 1,
      buildingId: testBuilding.id,
    },
  });

  const roomA = await prisma.room.create({
    data: {
      number: 'API-101',
      type: 'AC',
      basePrice: 3500,
      floorId: testFloor.id,
      status: 'VACANT',
    },
  });

  const roomB = await prisma.room.create({
    data: {
      number: 'API-102',
      type: 'FAN',
      basePrice: 2800,
      floorId: testFloor.id,
      status: 'VACANT',
    },
  });

  const createdTenantIds = [];

  try {
    // ------------------------------------------------------------------------
    // Test 1: VIEWER Role Guard on POST /api/tenants
    // ------------------------------------------------------------------------
    console.log('[Test 1] POST /api/tenants: Blocks VIEWER with 403...');
    {
      const req = new Request('http://localhost/api/tenants', {
        method: 'POST',
        headers: authHeaders(viewerToken),
        body: JSON.stringify({
          name: 'ทดสอบ ผู้ชม',
          phone: '0811111111',
          startDate: '2026-10-01',
          roomId: roomA.id,
        }),
      });

      const res = await createTenantHandler(req);
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden for VIEWER, got ${res.status}`);
      const data = await res.json();
      assert.match(data.error, /ไม่มีสิทธิ์ลงทะเบียนผู้เช่า/);
      console.log('  ✓ Viewer correctly blocked with 403');
    }

    // ------------------------------------------------------------------------
    // Test 2: Validation on POST /api/tenants (Missing fields)
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] POST /api/tenants: Rejects missing required fields with 400...');
    {
      const req = new Request('http://localhost/api/tenants', {
        method: 'POST',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({
          name: 'ขาดข้อมูล',
          // missing phone, startDate, roomId
        }),
      });

      const res = await createTenantHandler(req);
      assert.strictEqual(res.status, 400, 'Expected 400 Bad Request');
      const data = await res.json();
      assert.match(data.error, /กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน/);
      console.log('  ✓ Missing fields rejected with 400');
    }

    // ------------------------------------------------------------------------
    // Test 3: POST /api/tenants with Full Contract & Co-Tenant Fields
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] POST /api/tenants: Full contract & co-tenant creation...');
    let tenant1Id = null;
    {
      const payload = {
        name: 'นายสมชาย ใจดี',
        phone: '0812345678',
        idCard: '1100500123456',
        address: '99/1 ซอยสุขุมวิท 101 กทม.',
        email: 'somchai@example.com',
        lineId: 'somchai_line',
        workplace: 'บริษัท เทค จำกัด',
        emergencyName: 'นางสมศรี ใจดี',
        emergencyRel: 'มารดา',
        emergencyPhone: '0898765432',
        securityDeposit: 3500,
        keycardCount: 2,
        keycardDeposit: 200,
        keycardCode: 'KC-101',
        note: 'ขอเตียงคู่',
        startDate: '2026-11-01',
        roomId: roomA.id,
        startingWaterMeter: 120.5,
        startingElecMeter: 450.0,

        // Contract & Co-tenant fields
        nickname: 'ชาย',
        age: 30,
        idCardImage: 'data:image/jpeg;base64,dGVzdC1wcmltYXJ5',
        secondTenantName: 'นางสาวสมหญิง สดใส',
        secondTenantNickname: 'หญิง',
        secondTenantAge: 27,
        secondTenantIdCard: '1100500987654',
        secondTenantAddress: '99/1 ซอยสุขุมวิท 101 กทม.',
        secondTenantPhone: '0823456789',
        secondTenantWorkplace: 'บริษัท ดีไซน์ จำกัด',
        secondTenantEmergencyName: 'นายประสิทธิ์ สดใส',
        secondTenantEmergencyRel: 'บิดา',
        secondTenantEmergencyPhone: '0834567890',
        secondTenantIdCardImage: 'data:image/jpeg;base64,dGVzdC1zZWNvbmQ=',
        contractNumber: '101/2569',
        contractDurationMonths: 12,
        roomRentShare: 1500,
        assetRentShare: 2000,
        endDate: '2027-10-31',
      };

      const req = new Request('http://localhost/api/tenants', {
        method: 'POST',
        headers: authHeaders(ownerToken),
        body: JSON.stringify(payload),
      });

      const res = await createTenantHandler(req);
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      tenant1Id = data.id;
      createdTenantIds.push(tenant1Id);

      // Verify returned data
      assert.strictEqual(data.name, 'นายสมชาย ใจดี');
      assert.strictEqual(data.nickname, 'ชาย');
      assert.strictEqual(data.age, 30);
      assert.strictEqual(data.idCardImage, 'data:image/jpeg;base64,dGVzdC1wcmltYXJ5');
      assert.strictEqual(data.secondTenantName, 'นางสาวสมหญิง สดใส');
      assert.strictEqual(data.secondTenantNickname, 'หญิง');
      assert.strictEqual(data.secondTenantAge, 27);
      assert.strictEqual(data.secondTenantIdCard, '1100500987654');
      assert.strictEqual(data.secondTenantPhone, '0823456789');
      assert.strictEqual(data.secondTenantIdCardImage, 'data:image/jpeg;base64,dGVzdC1zZWNvbmQ=');
      assert.strictEqual(data.contractNumber, '101/2569');
      assert.strictEqual(data.contractDurationMonths, 12);
      assert.strictEqual(data.roomRentShare, 1500);
      assert.strictEqual(data.assetRentShare, 2000);
      assert.strictEqual(new Date(data.endDate).toISOString().slice(0, 10), '2027-10-31');

      // Verify database room status
      const updatedRoom = await prisma.room.findUnique({ where: { id: roomA.id } });
      assert.strictEqual(updatedRoom.status, 'OCCUPIED');

      console.log('  ✓ Full contract & co-tenant data created and saved successfully');
    }

    // ------------------------------------------------------------------------
    // Test 4: POST /api/tenants Default Calculations (Omitted contract fields)
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] POST /api/tenants: Auto-computes duration, endDate, roomRentShare, assetRentShare defaults...');
    let tenant2Id = null;
    {
      const startDateStr = '2026-11-01';
      const payload = {
        name: 'นายกิตติ ค่าเริ่มต้น',
        phone: '0855555555',
        startDate: startDateStr,
        roomId: roomB.id,
        // Omitted: contractDurationMonths, roomRentShare, assetRentShare, endDate, nickname, age, secondTenant...
      };

      const req = new Request('http://localhost/api/tenants', {
        method: 'POST',
        headers: authHeaders(ownerToken),
        body: JSON.stringify(payload),
      });

      const res = await createTenantHandler(req);
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      tenant2Id = data.id;
      createdTenantIds.push(tenant2Id);

      // Verify default values:
      // duration: 6 months
      assert.strictEqual(data.contractDurationMonths, 6, 'Expected default contractDurationMonths = 6');
      
      // endDate: startDate + 6 months
      const expectedEnd = new Date(startDateStr);
      expectedEnd.setMonth(expectedEnd.getMonth() + 6);
      assert.strictEqual(
        new Date(data.endDate).toISOString().slice(0, 10),
        expectedEnd.toISOString().slice(0, 10),
        'Expected endDate to be startDate + 6 months'
      );

      // roomRentShare: default 1000
      assert.strictEqual(data.roomRentShare, 1000, 'Expected default roomRentShare = 1000');

      // assetRentShare: room.basePrice (2800) - 1000 = 1800
      assert.strictEqual(data.assetRentShare, 1800, 'Expected default assetRentShare = 2800 - 1000 = 1800');

      // Nullable fields
      assert.strictEqual(data.nickname, null);
      assert.strictEqual(data.age, null);
      assert.strictEqual(data.idCardImage, null);
      assert.strictEqual(data.secondTenantName, null);

      console.log('  ✓ Defaults verified: duration=6, endDate=startDate+6mo, roomRentShare=1000, assetRentShare=1800');
    }

    // ------------------------------------------------------------------------
    // Test 5: GET /api/tenants/[id]
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] GET /api/tenants/[id]: Fetches single tenant with room relation & contract info...');
    {
      const req = new Request(`http://localhost/api/tenants/${tenant1Id}`, {
        method: 'GET',
        headers: authHeaders(ownerToken),
      });

      const res = await getTenantHandler(req, { params: Promise.resolve({ id: tenant1Id }) });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      const data = await res.json();

      assert.strictEqual(data.id, tenant1Id);
      assert.strictEqual(data.nickname, 'ชาย');
      assert.strictEqual(data.contractNumber, '101/2569');
      assert.strictEqual(data.secondTenantName, 'นางสาวสมหญิง สดใส');
      assert.strictEqual(data.room.number, 'API-101');
      console.log('  ✓ GET /api/tenants/[id] successfully returned tenant with relations');
    }

    // ------------------------------------------------------------------------
    // Test 6: PUT /api/tenants/[id] VIEWER Block
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] PUT /api/tenants/[id]: Blocks VIEWER with 403...');
    {
      const req = new Request(`http://localhost/api/tenants/${tenant1Id}`, {
        method: 'PUT',
        headers: authHeaders(viewerToken),
        body: JSON.stringify({
          nickname: 'แอบเปลี่ยน',
        }),
      });

      const res = await updateTenantHandler(req, { params: Promise.resolve({ id: tenant1Id }) });
      assert.strictEqual(res.status, 403, 'Expected 403 Forbidden for VIEWER');
      console.log('  ✓ Viewer correctly blocked from editing with 403');
    }

    // ------------------------------------------------------------------------
    // Test 7: PUT /api/tenants/[id] Partial Update (Preserves unmentioned fields)
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] PUT /api/tenants/[id]: Partial update preserves unmentioned fields...');
    {
      const req = new Request(`http://localhost/api/tenants/${tenant1Id}`, {
        method: 'PUT',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({
          nickname: 'ชายใหญ่',
          age: 31,
        }),
      });

      const res = await updateTenantHandler(req, { params: Promise.resolve({ id: tenant1Id }) });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      const data = await res.json();

      assert.strictEqual(data.nickname, 'ชายใหญ่');
      assert.strictEqual(data.age, 31);
      // Unmentioned fields must NOT be cleared
      assert.strictEqual(data.contractNumber, '101/2569');
      assert.strictEqual(data.secondTenantName, 'นางสาวสมหญิง สดใส');
      assert.strictEqual(data.idCardImage, 'data:image/jpeg;base64,dGVzdC1wcmltYXJ5');
      console.log('  ✓ Partial update preserved idCardImage, contractNumber, secondTenantName');
    }

    // ------------------------------------------------------------------------
    // Test 8: PUT /api/tenants/[id] Recalculates assetRentShare when roomRentShare changes
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] PUT /api/tenants/[id]: Auto-recalculates assetRentShare when roomRentShare updated...');
    {
      // roomA basePrice is 3500. Update roomRentShare to 1200 without providing assetRentShare.
      // Expected new assetRentShare = 3500 - 1200 = 2300.
      const req = new Request(`http://localhost/api/tenants/${tenant1Id}`, {
        method: 'PUT',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({
          roomRentShare: 1200,
        }),
      });

      const res = await updateTenantHandler(req, { params: Promise.resolve({ id: tenant1Id }) });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      const data = await res.json();

      assert.strictEqual(data.roomRentShare, 1200);
      assert.strictEqual(data.assetRentShare, 2300, 'Expected assetRentShare to be recalculated to 2300');
      console.log('  ✓ assetRentShare automatically recalculated to 2300 (3500 - 1200)');
    }

    // ------------------------------------------------------------------------
    // Test 9: PUT /api/tenants/[id] Recalculates endDate when contractDurationMonths changes
    // ------------------------------------------------------------------------
    console.log('\n[Test 9] PUT /api/tenants/[id]: Auto-recalculates endDate when contractDurationMonths changes...');
    {
      // tenant2 startDate was 2026-11-01, original duration was 6. Change duration to 3.
      const req = new Request(`http://localhost/api/tenants/${tenant2Id}`, {
        method: 'PUT',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({
          contractDurationMonths: 3,
        }),
      });

      const res = await updateTenantHandler(req, { params: Promise.resolve({ id: tenant2Id }) });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      const data = await res.json();

      assert.strictEqual(data.contractDurationMonths, 3);
      const expectedEnd = new Date('2026-11-01');
      expectedEnd.setMonth(expectedEnd.getMonth() + 3);
      assert.strictEqual(
        new Date(data.endDate).toISOString().slice(0, 10),
        expectedEnd.toISOString().slice(0, 10),
        'Expected endDate to be recalculated to startDate + 3 months'
      );
      console.log('  ✓ endDate automatically recalculated to startDate + 3 months');
    }

    // ------------------------------------------------------------------------
    // Test 10: PUT /api/tenants/[id] Explicit endDate takes precedence
    // ------------------------------------------------------------------------
    console.log('\n[Test 10] PUT /api/tenants/[id]: Explicit endDate takes precedence...');
    {
      const explicitDate = '2028-05-31';
      const req = new Request(`http://localhost/api/tenants/${tenant2Id}`, {
        method: 'PUT',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({
          endDate: explicitDate,
        }),
      });

      const res = await updateTenantHandler(req, { params: Promise.resolve({ id: tenant2Id }) });
      assert.strictEqual(res.status, 200, 'Expected 200 OK');
      const data = await res.json();

      assert.strictEqual(
        new Date(data.endDate).toISOString().slice(0, 10),
        explicitDate,
        'Expected explicit endDate to be stored'
      );
      console.log('  ✓ Explicit endDate preserved correctly');
    }

    console.log('\n======================================================');
    console.log('ALL API ENDPOINT TESTS PASSED SUCCESSFULLY! (10/10)');
    console.log('======================================================\n');
  } finally {
    console.log('--- Cleaning up test records ---');
    for (const tId of createdTenantIds) {
      await prisma.invoice.deleteMany({ where: { tenantId: tId } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tId } }).catch(() => {});
    }
    await prisma.meterReading.deleteMany({ where: { roomId: { in: [roomA.id, roomB.id] } } }).catch(() => {});
    await prisma.room.deleteMany({ where: { id: { in: [roomA.id, roomB.id] } } }).catch(() => {});
    await prisma.floor.delete({ where: { id: testFloor.id } }).catch(() => {});
    await prisma.building.delete({ where: { id: testBuilding.id } }).catch(() => {});
    await prisma.property.delete({ where: { id: testProperty.id } }).catch(() => {});
    await prisma.$disconnect();
    console.log('  ✓ Cleanup complete');
  }
}

main().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
