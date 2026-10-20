# Design Spec: 1:1 Exact Excel Monthly Summary Report A4 Modal

- **Date:** 2026-10-20
- **Status:** Approved (Approach 1 Selected)
- **Target Component:** `src/components/modals/MonthlyReportModal.tsx`, `MonthlyReportModal.module.css`, and integration into `src/components/tabs/ReportTab.tsx`

---

## 1. Goal & Context
The user requested an exact 1:1 replica of their original monthly apartment rental report (as authored and printed in Excel, e.g. for สิงหาคม 2569) based on the user's uploaded Excel file (`media_1792485347228_e913eebc.xlsx`).

Currently, the web system wraps all buildings in a single HTML table, which spills arbitrarily into 3 pages during browser printing.

To achieve an exact match with zero spillage, we implement **Approach 1: Dedicated A4 Print Preview Modal** (mirroring the proven architecture of `LeaseAgreementModal`), presenting a 2-page A4 preview with zoom controls and a standalone popup print window that prints strictly 2 pages.

---

## 2. Layout Specifications (Extracted Directly from Original Excel)

### Page 1 (Thanthip + Wichuda)
1. **Top Header (Row 1):**
   - Text: `ค่าเช่า ประจำเดือน [เดือนไทย] [ปี พ.ศ.]` (e.g. `ค่าเช่า ประจำเดือน สิงหาคม  2569`)
   - Style: Font Arial 10pt (bold), centered across all 7 columns.
2. **Building 1 Section (Thanthip):**
   - Title (Row 2): `ธารทิพย์อพาร์ทเมนท์` (Arial 10pt bold, centered)
   - Table Header (Row 3):
     - Background: `#5B9BD5` (Accent blue)
     - Text: White, Arial 10pt bold, centered
     - Columns:
       1. `ห้อง` (~7% width, centered)
       2. `ชื่อผู้เช่า` (~28% width, left aligned)
       3. `ค่าห้อง` (~12.3% width, right aligned)
       4. `ค่าน้ำ (บาท)` (~12.3% width, right aligned)
       5. `ค่าไฟ (บาท)` (~12.3% width, right aligned)
       6. `ค่าใช้จ่ายอื่นๆ` (~12.3% width, right aligned)
       7. `รวมเป็นเงิน (บาท)` (~16% width, right aligned)
   - Room Rows (Rows 4–33, 30 rooms: A1–D10):
     - Alternating row background: light gray `#f2f2f2` / white.
     - Thin borders (`#000` or `#ccc`).
     - Occupied rooms: Room number (center), Tenant name (left), Amounts formatted with commas (right).
     - Empty rooms (e.g. A2, A4): Room number only in Col 1; Cols 2–7 are completely blank (no text, no dash).
   - Subtotal Row (Row 34):
     - Spanning Cols 1–6: `ยอดรวม ( Total )     ` (bold, right aligned)
     - Col 7: Subtotal amount (e.g. `71,121`), bold, right aligned.
3. **Spacing:** 2 blank rows.
4. **Building 2 Section (Wichuda):**
   - Title (Row 37): `วิชุดาอพาร์ทเมนท์` (Arial 10pt bold, centered)
   - Table Header (Row 38): Identical columns and header style (`#5B9BD5`, white bold).
   - Room Rows (Rows 39–56, 18 rooms: 32/1–32/18): Same row formatting & empty room handling.
   - Subtotal Row (Row 57): `ยอดรวม ( Total )     ` | Subtotal amount (e.g. `53,400`).
5. **Page 1 Footer (Row 61):**
   - Text: `วันที่เอกสาร :  [วันที่]` (e.g. `วันที่เอกสาร :  30 กรกฎาคม 2569`), right-aligned.
   - Total rows on Page 1: 61 rows.

---

### Page 2 (Pakdee + 3-Building Summary Table)
1. **Top Header (Row 62):**
   - Text: `ค่าเช่า ประจำเดือน [เดือนไทย] [ปี พ.ศ.]` (Arial 10pt bold, centered).
2. **Building 3 Section (Pakdee):**
   - Title (Row 63): `พักดีอพาร์ทเมนท์` (Arial 10pt bold, centered)
   - Table Header (Row 64): Identical 7 columns with `#5B9BD5` header.
   - Room Rows (Rows 65–104, 40 rooms: 1/1–4/10): Same row formatting & empty room handling.
   - Subtotal Row (Row 105): `ยอดรวม ( Total )     ` | Subtotal amount (e.g. `93,082`).
3. **Spacing:** 2 blank rows.
4. **3-Building Summary Table (Rows 109–113):**
   - Table Header (Row 109):
     - Background: `#4472C4` (Darker royal blue)
     - Text: White, Arial 10pt bold, centered
     - Headers: `ลำดับ`, `อพาร์ทเมนท์`, `ค่าห้อง\n(บาท)`, `ค่าน้ำ\n (บาท)`, `ค่าไฟ\n (บาท)`, `ค่าใช้จ่ายอื่นๆ\n(บาท)`, `รวมเป็นเงิน\n(บาท)`
   - Rows (Rows 110–112):
     - Row 1: `1` | `ธารทิพย์   ( เช่ารวม X ห้อง )` | ค่าห้อง | ค่าน้ำ | ค่าไฟ | ค่าใช้จ่ายอื่นๆ | รวมเงิน
     - Row 2: `2` | `วิชุดา        ( เช่ารวม Y ห้อง )` | ...
     - Row 3: `3` | `พักดี         ( เช่ารวม Z ห้อง )` | ...
   - Grand Total Row (Row 113):
     - Background: `#FFF2CC` (soft yellow / accent tint 0.8)
     - Spanning Cols 1–6: `ยอดรวม ( Total )     ` (bold, right aligned)
     - Col 7: Grand total amount (e.g. `217,603`), bold, right aligned.
5. **Page 2 Footer (Row 120):**
   - Text: `วันที่เอกสาร :  [วันที่]`, right-aligned.
   - Total rows on Page 2: 59 rows.

---

## 3. UI Component Architecture

### A. Modal Component: `src/components/modals/MonthlyReportModal.tsx`
- **Props:**
  - `showModal: boolean`
  - `setShowModal: (val: boolean) => void`
  - `reportPeriod: string` (e.g. `2026-08`)
  - `reportData: any` (building data, rooms, totals computed from ReportTab)
  - `currentDateStr: string` (document date string, e.g. "30 กรกฎาคม 2569")
- **State & Controls:**
  - `zoom`: 75%, 90%, 100% (default 90% or 100%)
  - Top Toolbar:
    - Title: "🖨️ ตัวอย่างก่อนพิมพ์ - รายงานสรุปค่าเช่าประจำเดือน (A4)"
    - Zoom selector: `[ 75% ] [ 90% ] [ 100% ]`
    - Action buttons: `[ 🖨️ สั่งพิมพ์ (Print / PDF) ]` and `[ ✕ ปิด ]`
- **A4 Sheets Rendering:**
  - `printableContainerRef`: container holding two `.a4Sheet` elements.
  - Sheet 1: Thanthip + Wichuda + Footer.
  - Sheet 2: Pakdee + 3-Building Summary Table + Footer.
  - Dimension constraints: `width: 210mm`, `height: 296mm`, `padding: 8mm 10mm 6mm 10mm`, `box-sizing: border-box`.
  - Line-height: `1.15`, font size: `10.5px` / `11px`, compact cell padding (`1.5px 3px`) ensuring all rows fit snugly within 296mm.
- **Standalone Popup Print:**
  - Calls `window.open` with minimal blank document.
  - Injects preview module CSS and `@page { size: A4 portrait; margin: 0; }`.
  - Sets `.a4Sheet { page-break-after: always; }`.
  - Calls `printWindow.print()`.

### B. ReportTab Integration
- In `src/components/tabs/ReportTab.tsx`:
  - When in `activeSubTab === 'SUMMARY'`, clicking the `พิมพ์รายงาน` button opens `MonthlyReportModal`.
  - For other sub-tabs (`OVERDUE`, `YEARLY`, `PNL`), the existing `handlePrint` or window print behavior is maintained.

---

## 4. Verification & Testing Strategy
1. **Local Dev Server Execution:**
   - Run tests on `http://localhost:3000`.
   - Never push/deploy until verified locally.
2. **Automated Verification Script (`scripts/check-monthly-report-print.js`):**
   - Log into `localhost:3000` as `tester`.
   - Navigate to `รายงาน (Reports)`.
   - Select period `2026-08`.
   - Click `พิมพ์รายงาน` to open `MonthlyReportModal`.
   - Verify modal opens and renders both sheets.
   - Capture full screenshots of Sheet 1 and Sheet 2.
   - Trigger print/PDF generation and verify page count is **strictly 2 pages**.
3. **Data Verification:**
   - Check Thanthip total: `71,121` THB (20 occupied rooms).
   - Check Wichuda total: `53,400` THB (17 occupied rooms).
   - Check Pakdee total: `93,082` THB (24 occupied rooms).
   - Check Summary Table Grand Total: `217,603` THB (61 occupied rooms).
   - Check empty rooms have blank cells (no `— ว่าง —` placeholder in print).
