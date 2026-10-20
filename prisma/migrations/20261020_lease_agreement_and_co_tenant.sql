-- Add Lease Agreement and Co-Tenant columns to Tenant table for production Cloudflare D1
ALTER TABLE "Tenant" ADD COLUMN "nickname" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "age" INTEGER;
ALTER TABLE "Tenant" ADD COLUMN "idCardImage" TEXT;

ALTER TABLE "Tenant" ADD COLUMN "secondTenantName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantNickname" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantAge" INTEGER;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantIdCard" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantAddress" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantPhone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantWorkplace" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantEmergencyName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantEmergencyRel" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantEmergencyPhone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondTenantIdCardImage" TEXT;

ALTER TABLE "Tenant" ADD COLUMN "contractNumber" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "contractDurationMonths" INTEGER DEFAULT 6;
ALTER TABLE "Tenant" ADD COLUMN "roomRentShare" REAL DEFAULT 1000;
ALTER TABLE "Tenant" ADD COLUMN "assetRentShare" REAL;
