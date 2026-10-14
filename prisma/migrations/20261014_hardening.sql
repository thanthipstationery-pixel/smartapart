-- Unique constraint to prevent duplicate invoices per room per period
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_roomId_billingPeriod_key" ON "Invoice"("roomId", "billingPeriod");

-- Query performance indexes
CREATE INDEX IF NOT EXISTS "Invoice_billingPeriod_idx" ON "Invoice"("billingPeriod");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_roomId_idx" ON "Invoice"("roomId");
CREATE INDEX IF NOT EXISTS "MeterReading_roomId_readingDate_idx" ON "MeterReading"("roomId", "readingDate");
CREATE INDEX IF NOT EXISTS "Tenant_roomId_status_idx" ON "Tenant"("roomId", "status");
