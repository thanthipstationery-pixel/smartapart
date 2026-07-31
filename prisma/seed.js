const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting exact room database seeding...');

  // 1. Clean existing database
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.meterReading.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.admin.deleteMany({});

  // 2. Create Admin
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ (Admin)',
    },
  });
  console.log('Seeded Admin:', admin.username);

  // 3. Create Property
  const property = await prisma.property.create({
    data: {
      name: 'สมาร์ทอพาร์ทเมนท์ (SmartApart)',
      phone: '096-2624963',
      email: 'contact@smartapart.com',
      address: '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110',
      lineId: '@smartapart',
    },
  });
  console.log('Seeded Property:', property.name);

  // 4. Data structure matching landlord's image
  const buildingsData = [
    {
      name: 'ธารทิพย์ อพาร์ทเมนท์',
      waterRate: 18.0,
      electricityRate: 7.0,
      phone: '096-2624963',
      address: '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110',
      lineId: '@tharantip',
      floors: [
        {
          number: 1,
          rooms: [
            { number: 'A1', basePrice: 2500, type: 'FAN' },
            { number: 'A2', basePrice: 3500, type: 'AC' },
            { number: 'A3', basePrice: 2500, type: 'FAN' },
            { number: 'A4', basePrice: 3500, type: 'AC' },
            { number: 'A5', basePrice: 3500, type: 'AC' },
            { number: 'A6', basePrice: 3500, type: 'AC' },
            { number: 'A7', basePrice: 3500, type: 'AC' },
            { number: 'A8', basePrice: 3500, type: 'AC' },
            { number: 'A9', basePrice: 3500, type: 'AC' },
            { number: 'A10', basePrice: 3500, type: 'AC' },
          ]
        },
        {
          number: 2,
          rooms: [
            { number: 'B1', basePrice: 2500, type: 'FAN' },
            { number: 'B2', basePrice: 2500, type: 'FAN' },
            { number: 'B3', basePrice: 3500, type: 'AC' },
            { number: 'B4', basePrice: 3500, type: 'AC' },
            { number: 'B5', basePrice: 2500, type: 'FAN' },
            { number: 'B6', basePrice: 3000, type: 'FAN' },
            { number: 'B7', basePrice: 2500, type: 'FAN' },
            { number: 'B8', basePrice: 2500, type: 'FAN' },
            { number: 'B9', basePrice: 2500, type: 'FAN' },
            { number: 'B10', basePrice: 2500, type: 'FAN' },
          ]
        },
        {
          number: 3,
          rooms: [
            { number: 'D1', basePrice: 2500, type: 'FAN' },
            { number: 'D2', basePrice: 2500, type: 'FAN' },
            { number: 'D3', basePrice: 2500, type: 'FAN' },
            { number: 'D4', basePrice: 3500, type: 'FAN' },
            { number: 'D5', basePrice: 2500, type: 'FAN' },
            { number: 'D6', basePrice: 2500, type: 'FAN' },
            { number: 'D7', basePrice: 2500, type: 'FAN' },
            { number: 'D8', basePrice: 2500, type: 'FAN' },
            { number: 'D9', basePrice: 3500, type: 'AC' },
            { number: 'D10', basePrice: 3500, type: 'AC' },
          ]
        }
      ]
    },
    {
      name: 'วิชุดา อพาร์ทเมนท์',
      waterRate: 18.0,
      electricityRate: 7.0,
      phone: '096-2624963',
      address: '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110',
      lineId: '@wichuda',
      floors: [
        {
          number: 1,
          rooms: [
            { number: '32/1', basePrice: 2500, type: 'FAN' },
            { number: '32/2', basePrice: 2500, type: 'FAN' },
            { number: '32/3', basePrice: 2500, type: 'FAN' },
            { number: '32/4', basePrice: 2500, type: 'FAN' },
            { number: '32/5', basePrice: 2500, type: 'FAN' },
            { number: '32/6', basePrice: 2500, type: 'FAN' },
          ]
        },
        {
          number: 2,
          rooms: [
            { number: '32/7', basePrice: 2500, type: 'FAN' },
            { number: '32/8', basePrice: 2500, type: 'FAN' },
            { number: '32/9', basePrice: 2500, type: 'FAN' },
            { number: '32/10', basePrice: 2500, type: 'FAN' },
            { number: '32/11', basePrice: 2500, type: 'FAN' },
            { number: '32/12', basePrice: 2500, type: 'FAN' },
          ]
        },
        {
          number: 3,
          rooms: [
            { number: '32/13', basePrice: 3500, type: 'AC' },
            { number: '32/14', basePrice: 2500, type: 'FAN' },
            { number: '32/15', basePrice: 2500, type: 'FAN' },
            { number: '32/16', basePrice: 2500, type: 'FAN' },
            { number: '32/17', basePrice: 2500, type: 'FAN' },
            { number: '32/18', basePrice: 2500, type: 'FAN' },
          ]
        }
      ]
    },
    {
      name: 'พักดี อพาร์ทเมนท์',
      waterRate: 18.0,
      electricityRate: 8.0,
      phone: '096-2624963',
      address: '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110',
      lineId: '@pakdee',
      floors: [
        {
          number: 1,
          rooms: [
            { number: '1/1', basePrice: 4000, type: 'AC' },
            { number: '1/2', basePrice: 4000, type: 'AC' },
            { number: '1/3', basePrice: 3500, type: 'FAN' },
            { number: '1/4', basePrice: 4000, type: 'AC' },
            { number: '1/5', basePrice: 4000, type: 'AC' },
            { number: '1/6', basePrice: 4000, type: 'AC' },
            { number: '1/7', basePrice: 4000, type: 'AC' },
            { number: '1/8', basePrice: 4000, type: 'AC' },
            { number: '1/9', basePrice: 4000, type: 'AC' },
            { number: '1/10', basePrice: 4000, type: 'AC' },
          ]
        },
        {
          number: 2,
          rooms: [
            { number: '2/1', basePrice: 3500, type: 'FAN' },
            { number: '2/2', basePrice: 4000, type: 'AC' },
            { number: '2/3', basePrice: 4000, type: 'AC' },
            { number: '2/4', basePrice: 3500, type: 'FAN' },
            { number: '2/5', basePrice: 3500, type: 'FAN' },
            { number: '2/6', basePrice: 3500, type: 'FAN' },
            { number: '2/7', basePrice: 4000, type: 'AC' },
            { number: '2/8', basePrice: 4000, type: 'AC' },
            { number: '2/9', basePrice: 4000, type: 'AC' },
            { number: '2/10', basePrice: 4000, type: 'AC' },
          ]
        },
        {
          number: 3,
          rooms: [
            { number: '3/1', basePrice: 3000, type: 'FAN' },
            { number: '3/2', basePrice: 3000, type: 'FAN' },
            { number: '3/3', basePrice: 3000, type: 'FAN' },
            { number: '3/4', basePrice: 3000, type: 'FAN' },
            { number: '3/5', basePrice: 3000, type: 'FAN' },
            { number: '3/6', basePrice: 3000, type: 'FAN' },
            { number: '3/7', basePrice: 3000, type: 'FAN' },
            { number: '3/8', basePrice: 3000, type: 'FAN' },
            { number: '3/9', basePrice: 3000, type: 'FAN' },
            { number: '3/10', basePrice: 3000, type: 'FAN' },
          ]
        },
        {
          number: 4,
          rooms: [
            { number: '4/1', basePrice: 2500, type: 'FAN' },
            { number: '4/2', basePrice: 2500, type: 'FAN' },
            { number: '4/3', basePrice: 2500, type: 'FAN' },
            { number: '4/4', basePrice: 2500, type: 'FAN' },
            { number: '4/5', basePrice: 2500, type: 'FAN' },
            { number: '4/6', basePrice: 2500, type: 'FAN' },
            { number: '4/7', basePrice: 3000, type: 'FAN' },
            { number: '4/8', basePrice: 2500, type: 'FAN' },
            { number: '4/9', basePrice: 2500, type: 'FAN' },
            { number: '4/10', basePrice: 2500, type: 'FAN' },
          ]
        }
      ]
    }
  ];

  let totalRoomsCreated = 0;
  const createdRoomsMap = [];

  for (const bData of buildingsData) {
    const building = await prisma.building.create({
      data: {
        name: bData.name,
        waterRate: bData.waterRate,
        electricityRate: bData.electricityRate,
        phone: bData.phone,
        address: bData.address,
        lineId: bData.lineId,
        minimumWaterCost: 0,
        lateFee: 0,
        defaultDueDay: 5,
        propertyId: property.id,
      },
    });

    console.log(`Seeded Building: ${building.name}`);

    for (const fData of bData.floors) {
      const floor = await prisma.floor.create({
        data: {
          number: fData.number,
          buildingId: building.id,
        },
      });

      for (const rData of fData.rooms) {
        const room = await prisma.room.create({
          data: {
            number: rData.number,
            type: rData.type,
            basePrice: rData.basePrice,
            floorId: floor.id,
            status: 'VACANT',
            waterBillingType: 'METER',
            flatWaterCost: 0.0,
            elecBillingType: 'METER',
            flatElecCost: 0.0,
          },
        });

        totalRoomsCreated++;
        createdRoomsMap.push({
          ...room,
          buildingName: bData.name,
        });

        // Baseline meter reading (June 1, 2026)
        await prisma.meterReading.create({
          data: {
            roomId: room.id,
            waterValue: 100.0,
            electricityValue: 1000.0,
            readingDate: new Date('2026-06-01T00:00:00Z'),
            recordedBy: 'System Init',
          },
        });
      }
    }
  }

  console.log(`Successfully seeded ${totalRoomsCreated} exact rooms across 3 buildings!`);

  // Seed 2 demo occupied rooms for demo purposes
  const roomA3 = createdRoomsMap.find(r => r.buildingName === 'ธารทิพย์ อพาร์ทเมนท์' && r.number === 'A3');
  if (roomA3) {
    await prisma.room.update({
      where: { id: roomA3.id },
      data: { status: 'OCCUPIED' },
    });
    const tenantA3 = await prisma.tenant.create({
      data: {
        name: 'นายสมชาย ใจดี',
        phone: '081-234-5678',
        idCard: '1100101234567',
        startDate: new Date('2026-06-01T00:00:00Z'),
        roomId: roomA3.id,
      },
    });
    await prisma.meterReading.create({
      data: {
        roomId: roomA3.id,
        waterValue: 109.0,
        electricityValue: 1069.0,
        readingDate: new Date('2026-06-30T00:00:00Z'),
        recordedBy: 'admin',
      },
    });
  }

  const roomPakdee11 = createdRoomsMap.find(r => r.buildingName === 'พักดี อพาร์ทเมนท์' && r.number === '1/1');
  if (roomPakdee11) {
    await prisma.room.update({
      where: { id: roomPakdee11.id },
      data: { status: 'OCCUPIED' },
    });
    await prisma.tenant.create({
      data: {
        name: 'นางสาวสมศรี รักเรียน',
        phone: '089-876-5432',
        idCard: '1200202345678',
        startDate: new Date('2026-06-01T00:00:00Z'),
        roomId: roomPakdee11.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
