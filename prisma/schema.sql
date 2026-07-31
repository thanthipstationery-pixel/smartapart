-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "lineId" TEXT,
    "geminiApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "waterRate" REAL NOT NULL,
    "electricityRate" REAL NOT NULL,
    "minimumWaterCost" REAL NOT NULL DEFAULT 0,
    "lateFee" REAL NOT NULL DEFAULT 0,
    "defaultDueDay" INTEGER NOT NULL DEFAULT 5,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "lineId" TEXT,
    "promptPayId" TEXT,
    "promptPayName" TEXT,
    "promptPayQrUrl" TEXT,
    "propertyId" TEXT NOT NULL,
    CONSTRAINT "Building_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "waterBillingType" TEXT NOT NULL DEFAULT 'METER',
    "flatWaterCost" REAL NOT NULL DEFAULT 0,
    "elecBillingType" TEXT NOT NULL DEFAULT 'METER',
    "flatElecCost" REAL NOT NULL DEFAULT 0,
    "floorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerIdCard" TEXT,
    "customerEmail" TEXT,
    "customerLineId" TEXT,
    "bookingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCheckInDate" DATETIME NOT NULL,
    "depositAmount" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "slipImage" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idCard" TEXT,
    "address" TEXT,
    "email" TEXT,
    "lineId" TEXT,
    "workplace" TEXT,
    "emergencyName" TEXT,
    "emergencyRel" TEXT,
    "emergencyPhone" TEXT,
    "securityDeposit" REAL NOT NULL DEFAULT 0,
    "keycardCount" INTEGER NOT NULL DEFAULT 0,
    "keycardDeposit" REAL NOT NULL DEFAULT 0,
    "keycardCode" TEXT,
    "note" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "checkedOutAt" DATETIME,
    "noticeDate" DATETIME,
    "expectedCheckOutDate" DATETIME,
    "keycardReturnedCount" INTEGER NOT NULL DEFAULT 0,
    "keycardRefundedAt" DATETIME,
    "keycardRefundAmount" REAL NOT NULL DEFAULT 0,
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "readingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waterValue" REAL NOT NULL,
    "electricityValue" REAL NOT NULL,
    "recordedBy" TEXT,
    CONSTRAINT "MeterReading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "previousWater" REAL NOT NULL,
    "currentWater" REAL NOT NULL,
    "previousElec" REAL NOT NULL,
    "currentElec" REAL NOT NULL,
    "waterCost" REAL NOT NULL,
    "electricityCost" REAL NOT NULL,
    "rentCost" REAL NOT NULL,
    "otherCost" REAL NOT NULL DEFAULT 0,
    "bookNo" TEXT,
    "invoiceNoStr" TEXT,
    "otherFeeDetails" TEXT,
    "otherNote" TEXT,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "waterRate" REAL,
    "electricityRate" REAL,
    CONSTRAINT "Invoice_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "slipImage" TEXT,
    "status" TEXT NOT NULL,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterReplacement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "oldWaterFinal" REAL,
    "newWaterStart" REAL,
    "oldElecFinal" REAL,
    "newElecStart" REAL,
    "replacementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "billingPeriod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeterReplacement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

