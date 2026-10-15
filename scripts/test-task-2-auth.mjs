import assert from 'node:assert';
import { spawnSync } from 'node:child_process';

console.log('====================================================');
console.log('       TESTING TASK 2: JWT AUTH & CHANGE PASSWORD   ');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// TEST SUITE 1: src/lib/auth.ts (JWT with role and id)
// ----------------------------------------------------------------------------
console.log('--- Suite 1: JWT Signing and Verification with Role & ID ---');

const suite1Result = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { signJWT, verifyJWT } from './src/lib/auth.ts';

    async function runSuite1() {
      // 1.1 Sign and verify with explicit role and id
      const payloadWithRole = {
        id: 'admin-uuid-1234',
        username: 'staff_user',
        name: 'Staff Member',
        role: 'STAFF',
      };
      const token = await signJWT(payloadWithRole);
      if (!token || typeof token !== 'string') {
        console.error('Failed to generate token');
        process.exit(1);
      }

      const decoded = await verifyJWT(token);
      if (!decoded) {
        console.error('Failed to verify token');
        process.exit(2);
      }
      if (decoded.id !== 'admin-uuid-1234') {
        console.error('Expected decoded id "admin-uuid-1234", got:', decoded.id);
        process.exit(3);
      }
      if (decoded.role !== 'STAFF') {
        console.error('Expected decoded role "STAFF", got:', decoded.role);
        process.exit(4);
      }
      if (decoded.username !== 'staff_user' || decoded.name !== 'Staff Member') {
        console.error('Decoded username/name mismatch:', decoded);
        process.exit(5);
      }
      console.log('  [PASS] signJWT and verifyJWT preserve id and custom role');

      // 1.2 Backward compatibility: sign with only username & name
      const legacyPayload = {
        username: 'legacy_admin',
        name: 'Legacy Admin',
      };
      const legacyToken = await signJWT(legacyPayload);
      const decodedLegacy = await verifyJWT(legacyToken);
      if (!decodedLegacy) {
        console.error('Failed to verify legacy token');
        process.exit(6);
      }
      if (decodedLegacy.role !== 'OWNER') {
        console.error('Expected default role "OWNER" for legacy payload, got:', decodedLegacy.role);
        process.exit(7);
      }
      console.log('  [PASS] Backward compatibility: defaults role to "OWNER"');

      process.exit(0);
    }

    runSuite1().catch(err => {
      console.error(err);
      process.exit(9);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);

assert.strictEqual(
  suite1Result.status,
  0,
  `Suite 1 failed: ${suite1Result.stderr}\n${suite1Result.stdout}`
);
console.log(suite1Result.stdout.trim());
console.log('  [SUITE 1 PASS] JWT role & id support verified.\n');

// ----------------------------------------------------------------------------
// TEST SUITE 2: src/app/api/auth/login/route.ts (Reject inactive admin & return role/id)
// ----------------------------------------------------------------------------
console.log('--- Suite 2: Login Route Role, ID & Active Status Enforcement ---');

const suite2Result = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { createRequire } from 'node:module';
    globalThis.require = createRequire(import.meta.url);
    import bcrypt from 'bcryptjs';

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

    import { prisma } from './src/lib/prisma.ts';
    import { verifyJWT } from './src/lib/auth.ts';
    import { POST } from './src/app/api/auth/login/route.ts';

    async function runSuite2() {
      const hashedPw = await bcrypt.hash('TestPassword123!', 10);
      const inactiveUsername = 'test_inactive_' + Date.now();
      const activeUsername = 'test_active_' + Date.now();

      // Clean up beforehand just in case
      await prisma.admin.deleteMany({
        where: { username: { in: [inactiveUsername, activeUsername] } }
      });

      // Create inactive user
      const inactiveAdmin = await prisma.admin.create({
        data: {
          username: inactiveUsername,
          password: hashedPw,
          name: 'Inactive Staff',
          role: 'STAFF',
          isActive: false,
        }
      });

      // Create active user
      const activeAdmin = await prisma.admin.create({
        data: {
          username: activeUsername,
          password: hashedPw,
          name: 'Active Staff',
          role: 'STAFF',
          isActive: true,
        }
      });

      try {
        // 2.1 Inactive admin login attempt -> 403 Forbidden
        const inactiveReq = new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: inactiveUsername,
            password: 'TestPassword123!',
          })
        });
        const inactiveRes = await POST(inactiveReq);
        if (inactiveRes.status !== 403) {
          console.error('Expected status 403 for inactive admin, got:', inactiveRes.status);
          process.exit(1);
        }
        const inactiveData = await inactiveRes.json();
        if (!inactiveData.error || !inactiveData.error.includes('ถูกระงับการใช้งาน')) {
          console.error('Expected error message mentioning account suspended, got:', inactiveData);
          process.exit(2);
        }
        console.log('  [PASS] Inactive admin login rejected with 403 Forbidden');

        // 2.2 Active admin login -> 200 OK with id, role in body and session cookie
        const activeReq = new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: activeUsername,
            password: 'TestPassword123!',
          })
        });
        const activeRes = await POST(activeReq);
        if (activeRes.status !== 200) {
          console.error('Expected status 200 for active admin, got:', activeRes.status);
          process.exit(3);
        }
        const activeData = await activeRes.json();
        if (!activeData.success || !activeData.user) {
          console.error('Expected success: true and user object, got:', activeData);
          process.exit(4);
        }
        if (activeData.user.id !== activeAdmin.id || activeData.user.role !== 'STAFF') {
          console.error('User object missing id or role:', activeData.user);
          process.exit(5);
        }
        if ('password' in activeData.user) {
          console.error('Security violation: password field leaked in user response!');
          process.exit(6);
        }

        // Verify session cookie was set with token containing id and role
        const setCookie = activeRes.headers.get('set-cookie');
        if (!setCookie || !setCookie.includes('admin_session=')) {
          console.error('Expected admin_session in Set-Cookie header');
          process.exit(7);
        }
        const tokenMatch = setCookie.match(/admin_session=([^;]+)/);
        const sessionToken = tokenMatch ? tokenMatch[1] : null;
        if (!sessionToken) {
          console.error('Failed to parse admin_session token');
          process.exit(8);
        }
        const sessionPayload = await verifyJWT(sessionToken);
        if (!sessionPayload || sessionPayload.id !== activeAdmin.id || sessionPayload.role !== 'STAFF') {
          console.error('Session token payload does not match expected id and role:', sessionPayload);
          process.exit(9);
        }
        console.log('  [PASS] Active admin login returned user with id, role and valid JWT session');

      } finally {
        await prisma.admin.deleteMany({
          where: { username: { in: [inactiveUsername, activeUsername] } }
        });
      }

      process.exit(0);
    }

    runSuite2().catch(err => {
      console.error(err);
      process.exit(10);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);

assert.strictEqual(
  suite2Result.status,
  0,
  `Suite 2 failed: ${suite2Result.stderr}\n${suite2Result.stdout}`
);
console.log(suite2Result.stdout.trim());
console.log('  [SUITE 2 PASS] Login role, id, and active status enforcement verified.\n');

// ----------------------------------------------------------------------------
// TEST SUITE 3: src/app/api/auth/change-password/route.ts
// ----------------------------------------------------------------------------
console.log('--- Suite 3: Self-Service Password Change Route ---');

const suite3Result = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { createRequire, register } from 'node:module';
    import { pathToFileURL } from 'node:url';
    globalThis.require = createRequire(import.meta.url);

    // Register hook for next/headers if not resolved by test-loader.mjs
    register('data:text/javascript,' + encodeURIComponent(\`
      export function resolve(specifier, context, nextResolve) {
        if (specifier === 'next/headers') {
          return nextResolve('next/headers.js', context);
        }
        return nextResolve(specifier, context);
      }
    \`), pathToFileURL('./').href);

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

    import bcrypt from 'bcryptjs';
    import { prisma } from './src/lib/prisma.ts';
    import { signJWT } from './src/lib/auth.ts';

    async function runSuite3() {
      const { POST } = await import('./src/app/api/auth/change-password/route.ts');
      const hashedPw = await bcrypt.hash('CurrentSecret123!', 10);
      const username = 'test_pw_user_' + Date.now();

      const admin = await prisma.admin.create({
        data: {
          username,
          password: hashedPw,
          name: 'Password Test User',
          role: 'STAFF',
          isActive: true,
        }
      });

      const validToken = await signJWT({
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      });

      try {
        // 3.1 Unauthenticated request -> 401
        const unauthReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: 'CurrentSecret123!',
            newPassword: 'NewSecret123456!',
            confirmPassword: 'NewSecret123456!',
          })
        });
        const unauthRes = await POST(unauthReq);
        if (unauthRes.status !== 401) {
          console.error('Expected 401 for unauthenticated request, got:', unauthRes.status);
          process.exit(1);
        }
        console.log('  [PASS] Unauthenticated change-password request rejected with 401');

        // 3.2 Missing required fields -> 400
        const missingReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_session=' + validToken
          },
          body: JSON.stringify({
            currentPassword: 'CurrentSecret123!',
            newPassword: 'NewSecret123456!',
            // missing confirmPassword
          })
        });
        const missingRes = await POST(missingReq);
        if (missingRes.status !== 400) {
          console.error('Expected 400 for missing fields, got:', missingRes.status);
          process.exit(2);
        }
        console.log('  [PASS] Missing required fields rejected with 400');

        // 3.3 New password mismatch -> 400
        const mismatchReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_session=' + validToken
          },
          body: JSON.stringify({
            currentPassword: 'CurrentSecret123!',
            newPassword: 'NewSecret123456!',
            confirmPassword: 'DifferentSecret123!',
          })
        });
        const mismatchRes = await POST(mismatchReq);
        if (mismatchRes.status !== 400) {
          console.error('Expected 400 for password mismatch, got:', mismatchRes.status);
          process.exit(3);
        }
        console.log('  [PASS] Password mismatch rejected with 400');

        // 3.4 New password too short (< 6 characters) -> 400
        const shortReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_session=' + validToken
          },
          body: JSON.stringify({
            currentPassword: 'CurrentSecret123!',
            newPassword: '12345',
            confirmPassword: '12345',
          })
        });
        const shortRes = await POST(shortReq);
        if (shortRes.status !== 400) {
          console.error('Expected 400 for short new password, got:', shortRes.status);
          process.exit(4);
        }
        console.log('  [PASS] Short password (< 6 chars) rejected with 400');

        // 3.5 Wrong current password -> 400
        const wrongPwReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_session=' + validToken
          },
          body: JSON.stringify({
            currentPassword: 'IncorrectCurrentPassword!',
            newPassword: 'NewSecret123456!',
            confirmPassword: 'NewSecret123456!',
          })
        });
        const wrongPwRes = await POST(wrongPwReq);
        if (wrongPwRes.status !== 400) {
          console.error('Expected 400 for incorrect current password, got:', wrongPwRes.status);
          process.exit(5);
        }
        const wrongPwData = await wrongPwRes.json();
        if (wrongPwData.error !== 'รหัสผ่านปัจจุบันไม่ถูกต้อง') {
          console.error('Expected error message "รหัสผ่านปัจจุบันไม่ถูกต้อง", got:', wrongPwData);
          process.exit(6);
        }
        console.log('  [PASS] Incorrect current password rejected with 400');

        // 3.6 Valid password change -> 200 OK and updates DB hash
        const successReq = new Request('http://localhost/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'admin_session=' + validToken
          },
          body: JSON.stringify({
            currentPassword: 'CurrentSecret123!',
            newPassword: 'BrandNewPassword999!',
            confirmPassword: 'BrandNewPassword999!',
          })
        });
        const successRes = await POST(successReq);
        if (successRes.status !== 200) {
          console.error('Expected 200 for valid password change, got:', successRes.status);
          process.exit(7);
        }
        const successData = await successRes.json();
        if (!successData.success || successData.message !== 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว') {
          console.error('Expected success: true and message, got:', successData);
          process.exit(8);
        }
        if ('password' in successData || 'hash' in successData) {
          console.error('Security violation: password or hash returned in response!');
          process.exit(9);
        }

        // Verify in DB that new password matches and old password does not
        const updatedAdmin = await prisma.admin.findUnique({
          where: { id: admin.id }
        });
        const newMatches = await bcrypt.compare('BrandNewPassword999!', updatedAdmin.password);
        const oldMatches = await bcrypt.compare('CurrentSecret123!', updatedAdmin.password);
        if (!newMatches || oldMatches) {
          console.error('DB password verification failed! newMatches:', newMatches, 'oldMatches:', oldMatches);
          process.exit(10);
        }
        console.log('  [PASS] Valid password change succeeded and updated password hash in database');

      } finally {
        await prisma.admin.deleteMany({
          where: { id: admin.id }
        });
      }

      process.exit(0);
    }

    runSuite3().catch(err => {
      console.error(err);
      process.exit(11);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);

assert.strictEqual(
  suite3Result.status,
  0,
  `Suite 3 failed: ${suite3Result.stderr}\n${suite3Result.stdout}`
);
console.log(suite3Result.stdout.trim());
console.log('  [SUITE 3 PASS] Change-password endpoint verified completely.\n');

// ----------------------------------------------------------------------------
// TEST SUITE 4: src/app/api/auth/me/route.ts (Return role & id)
// ----------------------------------------------------------------------------
console.log('--- Suite 4: GET /api/auth/me Returns ID and Role ---');

const suite4Result = spawnSync(
  process.execPath,
  [
    '--loader', './scripts/test-loader.mjs',
    '-e',
    `
    import { createRequire, register } from 'node:module';
    import { pathToFileURL } from 'node:url';
    globalThis.require = createRequire(import.meta.url);

    // Register hook for next/headers if not resolved by test-loader.mjs
    register('data:text/javascript,' + encodeURIComponent(\`
      export function resolve(specifier, context, nextResolve) {
        if (specifier === 'next/headers') {
          return nextResolve('next/headers.js', context);
        }
        return nextResolve(specifier, context);
      }
    \`), pathToFileURL('./').href);

    import { signJWT } from './src/lib/auth.ts';

    async function runSuite4() {
      const { GET } = await import('./src/app/api/auth/me/route.ts');
      const token = await signJWT({
        id: 'me-admin-id',
        username: 'viewer_user',
        name: 'Auditor Viewer',
        role: 'VIEWER'
      });

      const req = new Request('http://localhost/api/auth/me', {
        headers: {
          'Cookie': 'admin_session=' + token
        }
      });

      const res = await GET(req);
      if (res.status !== 200) {
        console.error('Expected 200 from /api/auth/me, got:', res.status);
        process.exit(1);
      }
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        console.error('Expected authenticated: true and user object, got:', data);
        process.exit(2);
      }
      if (data.user.id !== 'me-admin-id') {
        console.error('Expected user.id "me-admin-id", got:', data.user.id);
        process.exit(3);
      }
      if (data.user.role !== 'VIEWER') {
        console.error('Expected user.role "VIEWER", got:', data.user.role);
        process.exit(4);
      }
      console.log('  [PASS] GET /api/auth/me returned correct id and role');

      process.exit(0);
    }

    runSuite4().catch(err => {
      console.error(err);
      process.exit(5);
    });
    `
  ],
  { cwd: process.cwd(), encoding: 'utf-8' }
);

assert.strictEqual(
  suite4Result.status,
  0,
  `Suite 4 failed: ${suite4Result.stderr}\n${suite4Result.stdout}`
);
console.log(suite4Result.stdout.trim());
console.log('  [SUITE 4 PASS] GET /api/auth/me verified successfully.\n');

console.log('====================================================');
console.log('       ALL TASK 2 TESTS PASSED SUCCESSFULLY!       ');
console.log('====================================================');
