const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function escapeVal(col, val) {
  if (col === 'geminiApiKey') return 'NULL';
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function makeInsert(table, rows) {
  if (!rows || rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const sqls = rows.map(r => {
    const vals = cols.map(c => escapeVal(c, r[c])).join(', ');
    return `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals});`;
  });
  return sqls.join('\n') + '\n';
}

async function main() {
  const admins = await prisma.admin.findMany();
  const properties = await prisma.property.findMany();
  const buildings = await prisma.building.findMany();
  const floors = await prisma.floor.findMany();
  const rooms = await prisma.room.findMany();
  const tenants = await prisma.tenant.findMany();
  const readings = await prisma.meterReading.findMany();
  const invoices = await prisma.invoice.findMany();
  const payments = await prisma.payment.findMany();
  const bookings = await prisma.booking.findMany();
  const replacements = await prisma.meterReplacement.findMany();

  let sql = '';
  sql += makeInsert('Admin', admins);
  sql += makeInsert('Property', properties);
  sql += makeInsert('Building', buildings);
  sql += makeInsert('Floor', floors);
  sql += makeInsert('Room', rooms);
  sql += makeInsert('Tenant', tenants);
  sql += makeInsert('MeterReading', readings);
  sql += makeInsert('Invoice', invoices);
  sql += makeInsert('Payment', payments);
  sql += makeInsert('Booking', bookings);
  sql += makeInsert('MeterReplacement', replacements);

  const outputPath = path.join(__dirname, '../prisma/seed.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log('Successfully generated seed.sql with size:', fs.statSync(outputPath).size, 'bytes');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
