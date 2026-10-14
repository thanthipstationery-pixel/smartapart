const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const crypto = require('crypto');

async function createTestUser() {
  const username = 'tester';
  const password = 'password123';
  const name = 'ผู้ทดสอบระบบ (Test User)';
  const id = crypto.randomUUID();
  
  const hashedPassword = await bcrypt.hash(password, 10);

  // Escaped SQL for Cloudflare D1
  const sql = `INSERT OR REPLACE INTO Admin (id, username, password, name, createdAt) VALUES ('${id}', '${username}', '${hashedPassword}', '${name}', datetime('now'));`;

  console.log(`[Creating Test User] Username: ${username} | Password: ${password}`);

  try {
    const cmd = `node "d:\\AI\\SmartApart\\node_modules\\wrangler\\bin\\wrangler.js" d1 execute smartapart-db --remote --command "${sql.replace(/"/g, '\\"')}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('\n Successfully added test user to Production D1 database!');
  } catch (err) {
    console.error('\n Error adding test user to D1:', err.message);
  }
}

createTestUser();
