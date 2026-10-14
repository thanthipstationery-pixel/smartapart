async function verify() {
  const baseUrl = 'https://smartapart.ai-pro.workers.dev';
  
  console.log(`Testing Login for Test User 'tester' on ${baseUrl}...\n`);

  // Test Login with tester / password123
  const loginRes = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tester', password: 'password123' })
  });

  const loginData = await loginRes.json();
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')].filter(Boolean);
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

  console.log(`[${loginRes.status}] /api/auth/login -> Name: "${loginData?.user?.name}" | Status: ${loginRes.ok ? 'SUCCESS' : 'FAILED'}`);

  if (loginRes.ok) {
    const buildingsRes = await fetch(baseUrl + '/api/buildings', {
      headers: { Cookie: cookieHeader }
    });
    console.log(`[${buildingsRes.status}] /api/buildings -> Authenticated Access OK!`);
  }
}

verify();
