# Design Spec: Mobile Tenant Cards Design for SmartApart

**Date**: 2026-07-29  
**Status**: User Approved (with Explicit Thai Labels Modification)

---

## 🎯 Problem & Goal
Current Tenant Management tab (`TenantTab.tsx`) uses a 9-column desktop HTML table even on mobile screens, requiring horizontal scrolling and causing visual clutter.

**Goal**: Transform the mobile view into modern, scannable **Tenant Cards** with explicit Thai text labels instead of ambiguous icons, while keeping the full 9-column table for desktop screens.

---

## 📐 Layout & Component Design

### 1. Responsiveness Strategy
- **Desktop (width > 768px)**: Render existing 9-column table (`.meterDesktopTable`) with full details.
- **Mobile (width <= 768px)**: Render clean, stacked **Mobile Tenant Cards** (`.tenantMobileList`).

### 2. Mobile Tenant Card Structure (Explicit Thai Labels)
Each tenant card on mobile contains:
- **Card Header**:
  - `ห้อง [Room Number]` (Bold primary color badge)
  - `[Building Name]` (Light badge)
  - Status Badge: `🟢 พักอาศัยอยู่` or `🔴 ย้ายออกแล้ว`
- **Card Body** (Clear Thai text labels instead of bare icons):
  - **ชื่อผู้เช่า**: `[Tenant Name]` (Bold header)
  - **เบอร์โทรศัพท์**: `[Phone]` with `tel:[Phone]` link
  - **เงินประกันสัญญา**: `[Deposit Amount] บาท` (Explicit label instead of 💰 icon)
  - **วันที่เริ่มสัญญา/วันเข้าพัก**: `[Thai Date]` (Explicit label instead of 📅 icon)
  - **เลขบัตรประชาชน**: `[ID Card]` (Monospace font)
  - *If moved out*: **วันที่ย้ายออก** and **หมายเหตุ**
- **Card Footer / Actions**:
  - `📞 โทรออก` (Direct phone call button: `href="tel:phone"`)
  - `✏️ แก้ไขข้อมูล` (Triggers `handleOpenEditTenantModal(tenant)`)

### 3. Compact Mobile Filter Toolbar
- **Search input**: Compact rounded input field for name/phone/room/ID card.
- **Building Selector**: Filter by building.
- **Segmented Control Tabs**: Compact pills for `🟢 ผู้เช่าปัจจุบัน (N)` vs `📜 ประวัติย้ายออก (N)`.

---

## 🧪 Verification Plan
1. Test TypeScript build (`npm run build`).
2. Run Puppeteer Chrome test script to capture mobile view screenshot.
3. Verify that all money and date fields have explicit Thai text labels (`เงินประกัน:`, `วันเข้าพัก:`) and no ambiguous icons.
