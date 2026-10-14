import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

console.log('====================================================');
console.log('       TESTING TASK 1: AUTH & SECRET HARDENING      ');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// TEST SUITE 1: src/lib/auth.ts
// ----------------------------------------------------------------------------
console.log('--- Suite 1: JWT Secret Hardening & Fail-Fast ---');

// Test 1.1: Fail-fast in production when JWT_SECRET is missing
console.log('Test 1.1: Production mode throws when JWT_SECRET is missing');
const prodFailResult = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    import('./src/lib/auth.ts').then(() => {
      console.error('FAIL: auth.ts did not throw in production without JWT_SECRET');
      process.exit(1);
    }).catch(err => {
      if (err.message.includes('[FATAL] JWT_SECRET environment variable is missing in production.')) {
        process.exit(42);
      }
      console.error('Unexpected error:', err);
      process.exit(1);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);
assert.strictEqual(
  prodFailResult.status,
  42,
  `Expected exit code 42 (fatal error on missing JWT_SECRET), got status ${prodFailResult.status}: ${prodFailResult.stderr}`
);
console.log('  [PASS] Successfully throws [FATAL] JWT_SECRET in production when missing\n');

// Test 1.2: Production mode works when JWT_SECRET is present
console.log('Test 1.2: Production mode signs & verifies when JWT_SECRET is present');
const prodPassResult = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'super-secret-key-for-prod-testing-1234567890';
    import('./src/lib/auth.ts').then(async ({ signJWT, verifyJWT }) => {
      const payload = { username: 'admin_test', name: 'Admin Prod' };
      const token = await signJWT(payload);
      if (typeof token !== 'string' || token.length < 20) {
        console.error('Invalid token generated');
        process.exit(1);
      }
      const verified = await verifyJWT(token);
      if (!verified || verified.username !== 'admin_test' || verified.name !== 'Admin Prod') {
        console.error('Verification failed:', verified);
        process.exit(2);
      }
      const invalidToken = await verifyJWT('header.fakebody.fakesig');
      if (invalidToken !== null) {
        console.error('Expected null for invalid token, got:', invalidToken);
        process.exit(3);
      }
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(4);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);
assert.strictEqual(
  prodPassResult.status,
  0,
  `JWT production signing/verification failed: ${prodPassResult.stderr}`
);
console.log('  [PASS] Production JWT signing and verification works as expected\n');

// Test 1.3: Development mode fallback
console.log('Test 1.3: Development mode allows dev fallback secret');
const devPassResult = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    import('./src/lib/auth.ts').then(async ({ signJWT, verifyJWT }) => {
      const payload = { username: 'dev_user', name: 'Developer' };
      const token = await signJWT(payload);
      const verified = await verifyJWT(token);
      if (!verified || verified.username !== 'dev_user') {
        process.exit(1);
      }
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(2);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);
assert.strictEqual(
  devPassResult.status,
  0,
  `JWT dev mode fallback failed: ${devPassResult.stderr}`
);
console.log('  [PASS] Development mode fallback functions cleanly\n');


// ----------------------------------------------------------------------------
// TEST SUITE 2: src/app/api/property/route.ts
// ----------------------------------------------------------------------------
console.log('--- Suite 2: Property Route Secret Sanitization ---');

const propTestResult = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { createRequire } from 'node:module';
    globalThis.require = createRequire(import.meta.url);
    import { GET, PUT } from './src/app/api/property/route.ts';

    async function runPropertyTests() {
      // 2.1 Test GET /api/property sanitization
      const getRes = await GET();
      if (getRes.status !== 200) {
        console.error('GET /api/property returned status', getRes.status);
        process.exit(1);
      }
      const getData = await getRes.json();
      if ('geminiApiKey' in getData) {
        console.error('FAIL: geminiApiKey was leaked in GET response!', getData);
        process.exit(2);
      }
      if (typeof getData.hasGeminiApiKey !== 'boolean') {
        console.error('FAIL: hasGeminiApiKey boolean missing in GET response!', getData);
        process.exit(3);
      }
      console.log('  [PASS] GET /api/property sanitized geminiApiKey. hasGeminiApiKey:', getData.hasGeminiApiKey);

      // 2.2 Test PUT /api/property sanitization
      const putReq = new Request('http://localhost/api/property', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'สมาร์ทอพาร์ทเมนท์ (SmartApart)',
          phone: '02-123-4567',
          email: 'contact@smartapart.com',
          address: '123 ถนนสุขุมวิท',
          geminiApiKey: 'AIzaSySecretTestKey123',
        })
      });
      const putRes = await PUT(putReq);
      if (putRes.status !== 200) {
        console.error('PUT /api/property returned status', putRes.status);
        process.exit(4);
      }
      const putData = await putRes.json();
      if ('geminiApiKey' in putData) {
        console.error('FAIL: geminiApiKey was leaked in PUT response!', putData);
        process.exit(5);
      }
      if (putData.hasGeminiApiKey !== true) {
        console.error('FAIL: hasGeminiApiKey expected true, got', putData.hasGeminiApiKey);
        process.exit(6);
      }
      console.log('  [PASS] PUT /api/property sanitized geminiApiKey. hasGeminiApiKey:', putData.hasGeminiApiKey);

      // 2.3 Verify GET after PUT still sanitizes and shows hasGeminiApiKey: true
      const getAfterPut = await GET();
      const getAfterData = await getAfterPut.json();
      if ('geminiApiKey' in getAfterData) {
        console.error('FAIL: geminiApiKey leaked on GET after PUT!');
        process.exit(7);
      }
      if (getAfterData.hasGeminiApiKey !== true) {
        console.error('FAIL: hasGeminiApiKey should be true after setting key!');
        process.exit(8);
      }
      console.log('  [PASS] GET /api/property verified with hasGeminiApiKey: true');

      process.exit(0);
    }

    runPropertyTests().catch(err => {
      console.error(err);
      process.exit(9);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);
assert.strictEqual(
  propTestResult.status,
  0,
  `Property test failed: ${propTestResult.stderr}\n${propTestResult.stdout}`
);
console.log('  [PASS] Property API route sanitization verified completely\n');


// ----------------------------------------------------------------------------
// TEST SUITE 3: src/app/api/scan-id-card/route.ts
// ----------------------------------------------------------------------------
console.log('--- Suite 3: Scan ID Card Route Hardening ---');

// 3.1 Verify model endpoint in source code
const scanRouteSrc = fs.readFileSync('./src/app/api/scan-id-card/route.ts', 'utf-8');
assert(
  !scanRouteSrc.includes('gemini-3.5-flash-lite'),
  'FAIL: scan-id-card still contains invalid gemini-3.5-flash-lite model'
);
assert(
  scanRouteSrc.includes('gemini-2.5-flash'),
  'FAIL: scan-id-card does not contain gemini-2.5-flash model'
);
console.log('  [PASS] Model endpoint correctly updated to gemini-2.5-flash (no gemini-3.5-flash-lite)');

const scanTestResult = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { createRequire } from 'node:module';
    globalThis.require = createRequire(import.meta.url);
    import { POST } from './src/app/api/scan-id-card/route.ts';

    async function runScanTests() {
      // 3.2 Missing image -> 400
      const reqMissing = new Request('http://localhost/api/scan-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const resMissing = await POST(reqMissing);
      if (resMissing.status !== 400) {
        console.error('Expected 400 for missing image, got', resMissing.status);
        process.exit(1);
      }
      console.log('  [PASS] Missing image rejected with 400');

      // 3.3 Non-string image -> 400
      const reqNonString = new Request('http://localhost/api/scan-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 12345 })
      });
      const resNonString = await POST(reqNonString);
      if (resNonString.status !== 400) {
        console.error('Expected 400 for non-string image, got', resNonString.status);
        process.exit(2);
      }
      console.log('  [PASS] Non-string image rejected with 400');

      // 3.4 Oversized image (> 5MB) -> 400
      // 5 * 1024 * 1024 * 1.37 ~= 7,182,745
      const oversized = 'A'.repeat(7.2 * 1024 * 1024);
      const reqOversized = new Request('http://localhost/api/scan-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: oversized })
      });
      const resOversized = await POST(reqOversized);
      if (resOversized.status !== 400) {
        console.error('Expected 400 for oversized image, got', resOversized.status);
        process.exit(3);
      }
      const dataOversized = await resOversized.json();
      if (!dataOversized.error || !dataOversized.error.includes('5MB')) {
        console.error('Expected error message mentioning 5MB, got', dataOversized);
        process.exit(4);
      }
      console.log('  [PASS] Oversized image (>5MB) rejected with 400 and error message:', dataOversized.error);

      // 3.5 Test Gemini API call with mocked fetch to verify URL endpoint and response parsing
      let calledUrl = '';
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url, options) => {
        calledUrl = String(url);
        return {
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        name: 'นายทดสอบ ระบบ',
                        idCard: '1-2345-67890-12-3',
                        address: '123/45 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร'
                      })
                    }
                  ]
                }
              }
            ]
          })
        };
      };

      const validImage = 'data:image/jpeg;base64,' + Buffer.from('small-test-image-content').toString('base64');
      const reqValid = new Request('http://localhost/api/scan-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: validImage })
      });
      const resValid = await POST(reqValid);
      globalThis.fetch = originalFetch;

      if (resValid.status !== 200) {
        console.error('Expected 200 for valid image, got', resValid.status);
        process.exit(5);
      }
      const dataValid = await resValid.json();
      if (!dataValid.success || dataValid.data.idCard !== '1234567890123') {
        console.error('Expected success: true and sanitized idCard digits, got', dataValid);
        process.exit(6);
      }
      if (!calledUrl.includes('gemini-2.5-flash')) {
        console.error('Expected fetch URL to target gemini-2.5-flash, but got:', calledUrl);
        process.exit(7);
      }
      console.log('  [PASS] Valid image payload called gemini-2.5-flash endpoint and parsed response correctly');

      process.exit(0);
    }

    runScanTests().catch(err => {
      console.error(err);
      process.exit(7);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);
assert.strictEqual(
  scanTestResult.status,
  0,
  `Scan test failed: ${scanTestResult.stderr}\n${scanTestResult.stdout}`
);
console.log('  [PASS] Scan ID card size limits and validation verified completely\n');

console.log('====================================================');
console.log('       ALL TASK 1 TESTS PASSED SUCCESSFULLY!       ');
console.log('====================================================');
