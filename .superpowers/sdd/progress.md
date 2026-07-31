# SDD Progress Ledger

## Previous Feature: Room Booking System (Completed)
- Task 1: Prisma Schema & DB Push - complete
- Task 2: Backend API Endpoints - complete
- Task 3: Dual-Mode Booking Modal & UI Integration - complete
- Task 4: Verification & Server Ready - complete

## Current Feature: Tenant & Check-out Management System
- [x] Task 1: Extend Database Schema for Tenant Profile & Keycard Ledger - complete (Prisma db push & client generated)
- [x] Task 2: Implement Backend API Routes for Tenant Management & Check-out - complete (PUT /api/tenants/[id], POST /checkout, POST /refund-keycard created)
- [x] Task 3: Upgrade Check-in Modal with Expanded Tenant & Keycard Fields - complete (Personal, emergency contact, keycard deposit & initial meters integrated)
- [x] Task 4: Build Check-out Modal & Receipt Summary System - complete

## Current Feature: AI Thai ID Card OCR Scanner
- [x] Task 1: Backend API Handler (POST /api/scan-id-card) - complete
- [x] Task 2: Frontend Camera Scanner & Auto-Fill Integration - complete

## Current Feature: Official A5 Rent Invoice System
- [x] Task 1: Extend Database Schema for A5 Invoice Fields - complete (bookNo, invoiceNoStr, otherFeeDetails, otherNote added)
- [x] Task 2: Backend API Routes Update (POST/GET /api/invoices and /api/invoices/[id]) - complete
- [x] Task 3: Upgrade Invoice Generation Modal with Itemized Extra Fees UI - complete (dynamic extra fees line items, auto-sum, auto-note generation, tenure month index)
- [x] Task 4: Official A5 Print-Ready Invoice Modal & Batch Print Component - complete (exact match of uploaded landlord A5 form layout, black banner title, top-right property box, Thai date/month, meter range table, and bottom note)
