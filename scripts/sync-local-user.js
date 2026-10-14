const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = 'tester';
  const password = 'password123';
  const name = 'ผู้ทดสอบระบบ (Test User)';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashedPassword, name },
    create: { username, password: hashedPassword, name }
  });

  console.log('Successfully synced test user to local dev database!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
