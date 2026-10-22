# Design Spec: 1:1 Exact Annual Rental Financial Summary Report A4 Modal

- **Date:** 2026-10-22
- **Status:** Approved (User provided CSV layout from original system)
- **Target Component:** `src/components/modals/AnnualReportModal.tsx`, `AnnualReportModal.module.css`, and integration into `src/components/tabs/ReportTab.tsx`

---

## 1. Goal & Context
The user requested an exact replica of their original Annual Rental Financial Summary Report ("สรุปรายงานค่าเช่า ประจำปี") based on the layout structure provided via CSV:
- Title: `สรุปรายงานค่าเช่า ประจำปี [ปี พ.ศ.]` (e.g. `สรุปรายงานค่าเช่า ประจำปี 2569`)
- 10 standard columns matching the original report
- 12 months (มกราคม – ธันวาคม), each containing 3 apartment rows (1.ธารทิพย์, 2.วิชุดา, 3.พักดี) and a month total row (`ยอดรวม`)
- A bottom grand total row (`ยอดรวมสุทธิ`)
- All numbers and calculations must strictly use our existing system calculations (from `ReportTab.tsx` and `/api/reports/yearly`).
- The entire 12-month report must fit comfortably onto **EXACTLY 1 PAGE OF A4 PORTRAIT** (strictly 1 page, zero spill to page 2).

---

## 2. Table & Styling Specifications (Extracted from Original PDF & CSV)

### Dimensions & Structure (A4 Portrait - 1 Page)
- Page size: `210mm x 297mm` (usable height `296mm`)
- Margins: `padding: 6mm 8mm 4mm 8mm`
- Table row height: `~15.5px`
- Table font size: `11px` (Arial / Sarabun, crisp and clearly readable)

### 10 Columns Proportions:
1. `เดือน / อพาร์ทเมนท์`: **16%** (Left aligned, month name centered or left bold, apartment indented)
2. `ห้องที่เช่า (ห้อง)`: **9%** (Center aligned)
3. `ค่าน้ำ (บาท)`: **9%** (Right aligned)
4. `ค่าไฟ (บาท)`: **9%** (Right aligned)
5. `ค่าอื่นๆ (บาท)`: **9%** (Right aligned)
6. `ค่าห้อง (บาท)`: **9%** (Right aligned)
7. `รวมค่าเช่า (บาท)`: **10%** (Right aligned, bold)
8. `บิลน้ำหลวง (บาท)`: **9%** (Right aligned)
9. `บิลไฟหลวง (บาท)`: **9%** (Right aligned)
10. `รวมสุทธิ (บาท)`: **11%** (Right aligned, bold; red if negative)

### Color Palette & Row Styles:
- **Title (Top):** `สรุปรายงานค่าเช่า ประจำปี [ปี พ.ศ.]` (14px bold, center).
- **Table Header:** Background `#000000` (or `#1e293b`), text white bold, vertical-align middle.
- **Month Row (e.g. มกราคม):** Background `#595959` (Dark gray), text white bold, colSpan 10.
- **Building Rows (1. ธารทิพย์, 2. วิชุดา, 3. พักดี):** Background white `#ffffff`, thin gray borders (`#b0b0b0`).
- **Month Total Row (`ยอดรวม`):** Background `#D9D9D9` (Light gray), text black bold, thin border top/bottom.
- **Grand Total Row (`ยอดรวมสุทธิ`):** Background `#FFF2CC` (Light yellow/cream), text black bold, border-top `1px solid #000`, border-bottom `2px double #000`.
- **Footer:** `วันที่เอกสาร : [วันที่]` (Right-aligned, 10px).

---

## 3. Architecture & Integration

### A. New Component: `AnnualReportModal.tsx` & `AnnualReportModal.module.css`
- **Props:**
  - `showModal: boolean`
  - `setShowModal: (val: boolean) => void`
  - `reportYear: string` (e.g. "2026")
  - `reportBuildingId: string` ("ALL" or specific building id)
  - `buildings: any[]`
  - `yearlyData: any[]` (12 months from `/api/reports/yearly`)
  - `currentDateStr: string`
- **Features:**
  - Sticky control toolbar with zoom (`75%`, `90%`, `100%`), print button (`[ 🖨️ สั่งพิมพ์ (Print / PDF) ]`), close button (`[ ✕ ปิด ]`).
  - Badge: `1 หน้า`
  - Dedicated standalone popup print window (`window.open`) with `@page { size: A4 portrait; margin: 0; }` guaranteeing strict 1-page output.

### B. Integration into `ReportTab.tsx`:
- When `activeSubTab === 'YEARLY'`:
  - Clicking `พิมพ์รายงาน` opens `AnnualReportModal` instead of default `window.print()`.
  - Update the desktop screen table headers and row labels (`[Month] Total` -> `ยอดรวม`, `Grand Total` -> `ยอดรวมสุทธิ`) and colors so screen view matches modal preview.

---

## 4. Verification Plan
- Launch Puppeteer headless Chrome on local dev server (`http://localhost:3000`).
- Log in as tester, navigate to Reports tab, switch to `รายงานสรุปการเงินรายปี`.
- Click `พิมพ์รายงาน` to open `AnnualReportModal`.
- Capture screenshot of the modal preview and the single A4 sheet.
- Export to PDF and verify page count is **strictly 1 page**.
- Check that all calculations match existing data in the system.
