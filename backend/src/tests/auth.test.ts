import prisma from '../utils/db';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== CMMS AUTHENTICATION & RBAC INTEGRATION TEST SUITE ===');

  try {
    // 1. Fetch root database roles to get IDs for registration
    const roles = await prisma.role.findMany();
    const supervisorRole = roles.find(r => r.code === 'SUPERVISOR');
    const technicianRole = roles.find(r => r.code === 'TECHNICIAN');
    const superAdminRole = roles.find(r => r.code === 'SUPER_ADMIN');
    
    const plant = await prisma.plant.findFirst();

    if (!supervisorRole || !technicianRole || !superAdminRole || !plant) {
      throw new Error('Required seed data (roles/plants) not found in database. Run seed first.');
    }

    console.log(`[PASS] DB connection validated. Found roles: Super Admin, Supervisor, Technician.`);
    console.log(`[INFO] Using Plant: ${plant.name} (${plant.id})`);

    // 2. Health Check Request
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthJson = await healthRes.json() as any;
    if (healthRes.status !== 200 || healthJson.status !== 'success') {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }
    console.log('[PASS] Root Health check OK.');

    // 3. User Registration Test
    const testEmail = `tech_test_${Date.now()}@parksons.com`;
    const testPassword = 'TestPassword123!';
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Technician',
        email: testEmail,
        password: testPassword,
        phone: '9876543210',
        roleId: technicianRole.id,
        plantId: plant.id
      })
    });

    const registerJson = await registerRes.json() as any;
    if (registerRes.status !== 201 || registerJson.status !== 'success') {
      throw new Error(`Technician registration failed: ${JSON.stringify(registerJson)}`);
    }
    console.log(`[PASS] Registered test technician: ${testEmail}`);

    // Verify registration of supervisor
    const supervisorEmail = `super_test_${Date.now()}@parksons.com`;
    const supervisorRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Supervisor',
        email: supervisorEmail,
        password: testPassword,
        roleId: supervisorRole.id,
        plantId: plant.id
      })
    });
    const supervisorJson = await supervisorRes.json() as any;
    if (supervisorRes.status !== 201) {
      throw new Error(`Supervisor registration failed: ${JSON.stringify(supervisorJson)}`);
    }
    console.log(`[PASS] Registered test supervisor: ${supervisorEmail}`);

    // Verify duplicate registration rejection (should return 409 Conflict)
    const duplicateRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: testEmail,
        password: testPassword,
        roleId: technicianRole.id
      })
    });
    if (duplicateRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate email, got ${duplicateRes.status}`);
    }
    console.log('[PASS] Duplicate registration rejected with 409 Conflict.');

    // 4. User Login & Cookie Test
    console.log(`\nTesting login for: ${supervisorEmail}`);
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: supervisorEmail,
        password: testPassword
      })
    });

    const loginJson = await loginRes.json() as any;
    if (loginRes.status !== 200 || !loginJson.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }

    const supervisorToken = loginJson.data.token;
    console.log('[PASS] Login successful. Access Token received.');

    // Check Set-Cookie headers for HttpOnly Refresh Token
    const cookieHeader = loginRes.headers.get('set-cookie');
    if (!cookieHeader || !cookieHeader.includes('refreshToken=')) {
      throw new Error('Refresh token cookie missing in login response headers.');
    }
    if (!cookieHeader.includes('HttpOnly') || !cookieHeader.includes('SameSite=Strict')) {
      throw new Error(`Cookie policies not enforced correctly: ${cookieHeader}`);
    }
    console.log('[PASS] Secure HttpOnly, SameSite=Strict Refresh Token cookie set in response.');

    // Save the refresh token cookie value for the next tests
    const refreshTokenCookie = cookieHeader.split(';')[0];

    // 5. Test Access with Authentication (GET /me)
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${supervisorToken}` }
    });
    const meJson = await meRes.json() as any;
    if (meRes.status !== 200 || meJson.data?.user?.email !== supervisorEmail) {
      throw new Error(`Fetch profile failed: ${JSON.stringify(meJson)}`);
    }
    console.log(`[PASS] Profile profile retrieved: ${meJson.data.user.name} (${meJson.data.user.role.code})`);

    // Verify permissions lists matches expectations
    const supervisorPermissions = meJson.data.permissions as string[];
    if (!supervisorPermissions.includes('BREAKDOWN_CREATE') || supervisorPermissions.includes('USER_MANAGE')) {
      throw new Error(`Supervisor permission mapping incorrect. Permissions: ${JSON.stringify(supervisorPermissions)}`);
    }
    console.log('[PASS] Supervisor permissions verified (has BREAKDOWN_CREATE, does NOT have USER_MANAGE).');

    // 6. Test RBAC Permissions Middleware (403 Forbidden check)
    console.log('\nTesting authorization restrictions for supervisor...');
    
    // Test user-view endpoint (Supervisor lacks USER_VIEW permission in our seed)
    const userViewRes = await fetch(`${API_BASE}/test/user-view`, {
      headers: { 'Authorization': `Bearer ${supervisorToken}` }
    });
    if (userViewRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for /test/user-view, got ${userViewRes.status}`);
    }
    console.log('[PASS] Access to USER_VIEW endpoint rejected with 403 Forbidden (Correct).');

    // Test user-manage endpoint (Supervisor lacks USER_MANAGE permission)
    const userManageRes = await fetch(`${API_BASE}/test/user-manage`, {
      headers: { 'Authorization': `Bearer ${supervisorToken}` }
    });
    if (userManageRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for /test/user-manage, got ${userManageRes.status}`);
    }
    console.log('[PASS] Access to USER_MANAGE endpoint rejected with 403 Forbidden (Correct).');

    // 7. Test RBAC Bypass for Super Admin
    console.log('\nTesting login and access for Super Admin (yogeshkp85@gmail.com)...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'yogeshkp85@gmail.com',
        password: 'PKS@2026'
      })
    });
    const adminLoginJson = await adminLoginRes.json() as any;
    if (adminLoginRes.status !== 200 || !adminLoginJson.data?.token) {
      throw new Error(`Super Admin login failed: ${JSON.stringify(adminLoginJson)}`);
    }
    const adminToken = adminLoginJson.data.token;
    console.log('[PASS] Super Admin login successful.');

    // Hit test routes as Super Admin (expects 200 OK because of bypass)
    const adminUserViewRes = await fetch(`${API_BASE}/test/user-view`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminUserViewJson = await adminUserViewRes.json() as any;
    if (adminUserViewRes.status !== 200 || adminUserViewJson.status !== 'success') {
      throw new Error(`Super Admin blocked from user-view: ${JSON.stringify(adminUserViewJson)}`);
    }
    console.log('[PASS] Super Admin accessed USER_VIEW test endpoint successfully.');

    const adminUserManageRes = await fetch(`${API_BASE}/test/user-manage`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminUserManageJson = await adminUserManageRes.json() as any;
    if (adminUserManageRes.status !== 200 || adminUserManageJson.status !== 'success') {
      throw new Error(`Super Admin blocked from user-manage: ${JSON.stringify(adminUserManageJson)}`);
    }
    console.log('[PASS] Super Admin accessed USER_MANAGE test endpoint successfully.');

    // 8. Test Refresh Token
    console.log('\nTesting Silent Access Token Refresh...');
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': refreshTokenCookie
      }
    });
    const refreshJson = await refreshRes.json() as any;
    if (refreshRes.status !== 200 || !refreshJson.data?.token) {
      throw new Error(`Silent token refresh failed: ${JSON.stringify(refreshJson)}`);
    }
    const newAccessToken = refreshJson.data.token;
    console.log('[PASS] Silent refresh successful. New Access Token generated.');

    // Verify new token works
    const profileAfterRefreshRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });
    if (profileAfterRefreshRes.status !== 200) {
      throw new Error(`New access token is invalid: ${profileAfterRefreshRes.status}`);
    }
    console.log('[PASS] Verified profile query with newly refreshed access token.');

    // 9. Test Logout
    console.log('\nTesting Logout...');
    const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': refreshTokenCookie
      }
    });
    const logoutCookieHeader = logoutRes.headers.get('set-cookie');
    if (!logoutCookieHeader || !logoutCookieHeader.includes('refreshToken=;')) {
      throw new Error(`Cookie was not cleared during logout: ${logoutCookieHeader}`);
    }
    console.log('[PASS] Logout successful. Refresh token cookie cleared.');

    // 10. Verify Audit Trail was recorded
    console.log('\nChecking audit log entries in the database...');
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    if (auditLogs.length === 0) {
      throw new Error('No audit log entries found in database!');
    }
    console.log(`[PASS] Found ${auditLogs.length} audit logs. Latest actions:`);
    for (const log of auditLogs) {
      console.log(`   - [${log.module}] Action: ${log.action} | Target ID: ${log.targetId} | IP: ${log.ipAddress}`);
    }

    console.log('\n======================================================');
    console.log('ALL AUTH & RBAC MIDDLEWARE TESTS PASSED SUCCESSFULLY! ✅');
    console.log('======================================================');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ INTEGRATION TEST FAILED:');
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

runTests();
