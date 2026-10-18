const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Testing Prisma Schema & Tenant Contract Fields ---');
  
  // 1. Basic count query
  const count = await prisma.tenant.count();
  console.log('Database connection verified, tenant count:', count);

  // 2. Find or create a room for schema field verification test
  let testRoom = await prisma.room.findFirst();
  let createdTestRoom = false;
  let testFloor = null;
  let testBuilding = null;
  let testProperty = null;

  if (!testRoom) {
    testProperty = await prisma.property.create({
      data: { name: 'Test Property' }
    });
    testBuilding = await prisma.building.create({
      data: {
        name: 'Test Building',
        waterRate: 18,
        electricityRate: 8,
        propertyId: testProperty.id
      }
    });
    testFloor = await prisma.floor.create({
      data: {
        number: 1,
        buildingId: testBuilding.id
      }
    });
    testRoom = await prisma.room.create({
      data: {
        number: 'TEST-999',
        type: 'AC',
        basePrice: 3500,
        floorId: testFloor.id,
        status: 'VACANT'
      }
    });
    createdTestRoom = true;
  }

  // 3. Test creating a tenant with all new fields
  const testTenant = await prisma.tenant.create({
    data: {
      name: 'สมชาย ทดสอบ',
      phone: '0812345678',
      idCard: '1234567890123',
      roomId: testRoom.id,
      nickname: 'ชาย',
      age: 28,
      idCardImage: 'data:image/jpeg;base64,dGVzdA==',
      secondTenantName: 'สมหญิง ทดสอบ',
      secondTenantNickname: 'หญิง',
      secondTenantAge: 26,
      secondTenantIdCard: '9876543210987',
      secondTenantAddress: '123/45 กทม.',
      secondTenantPhone: '0898765432',
      secondTenantWorkplace: 'บริษัท ตัวอย่าง จำกัด',
      secondTenantEmergencyName: 'คุณพ่อ ทดสอบ',
      secondTenantEmergencyRel: 'บิดา',
      secondTenantEmergencyPhone: '0823456789',
      secondTenantIdCardImage: 'data:image/jpeg;base64,dGVzdDItc2Vjb25k',
      contractNumber: '999/2569',
      contractDurationMonths: 6,
      roomRentShare: 1000,
      assetRentShare: 2500,
    }
  });

  console.log('Successfully created tenant with new fields:', testTenant.id);
  console.log('Contract fields verified:', {
    contractNumber: testTenant.contractNumber,
    contractDurationMonths: testTenant.contractDurationMonths,
    roomRentShare: testTenant.roomRentShare,
    assetRentShare: testTenant.assetRentShare,
    nickname: testTenant.nickname,
    age: testTenant.age,
    secondTenantName: testTenant.secondTenantName,
    secondTenantPhone: testTenant.secondTenantPhone,
  });

  // Verify default values when omitted
  const testTenantDefault = await prisma.tenant.create({
    data: {
      name: 'สมเกียรติ ค่าเริ่มต้น',
      phone: '0855555555',
      roomId: testRoom.id,
    }
  });

  if (testTenantDefault.contractDurationMonths !== 6) {
    throw new Error(`Expected default contractDurationMonths to be 6, got ${testTenantDefault.contractDurationMonths}`);
  }
  if (testTenantDefault.roomRentShare !== 1000) {
    throw new Error(`Expected default roomRentShare to be 1000, got ${testTenantDefault.roomRentShare}`);
  }
  console.log('Default values verified: contractDurationMonths = 6, roomRentShare = 1000');

  // Clean up test tenants
  await prisma.tenant.delete({ where: { id: testTenant.id } });
  await prisma.tenant.delete({ where: { id: testTenantDefault.id } });

  if (createdTestRoom) {
    await prisma.room.delete({ where: { id: testRoom.id } });
    await prisma.floor.delete({ where: { id: testFloor.id } });
    await prisma.building.delete({ where: { id: testBuilding.id } });
    await prisma.property.delete({ where: { id: testProperty.id } });
  }

  console.log('--- All schema contract tests PASSED successfully! ---');
}

main()
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
