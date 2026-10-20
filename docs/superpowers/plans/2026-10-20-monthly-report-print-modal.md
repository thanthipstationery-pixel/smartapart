# Implementation Plan: Monthly Report Print Modal (1:1 Excel Replica)

- **Date:** 2026-10-20
- **Spec:** `docs/superpowers/specs/2026-10-20-monthly-report-print-modal-design.md`
- **Goal:** Provide an exact 1:1 replica of the original Excel monthly rental report in a dedicated A4 Print Preview Modal, strictly constrained to 2 pages.

---

## Proposed Tasks

### Task 1: Create `MonthlyReportModal.module.css`
- **File:** `src/components/modals/MonthlyReportModal.module.css`
- **Details:**
  - Modal overlay, modal dialog, sticky control toolbar (zoom 75%, 90%, 100%, print button, close button).
  - `.a4Sheet`: fixed width `210mm`, fixed height `296mm`, padding `8mm 10mm 6mm 10mm`, white background, `page-break-after: always`.
  - Sheet header, building header, table styling:
    - Font: `Arial, 'Sarabun', sans-serif`, font size `10px` / `10.5px`, line-height `1.15`.
    - Table borders: solid `1px #999` / `#000`, collapsed borders.
    - Header colors: `#5B9BD5` (building tables), `#4472C4` (summary table), white text bold.
    - Zebra striping: `#f2f2f2` alternating rows.
    - Subtotal row: bold, right-aligned, light gray `#e9e9e9` or white with double line.
    - Summary Grand Total row: `#FFF2CC` (soft yellow), bold.
    - Compact row heights (around `17px` - `18px`) so 61 rows fit cleanly on Page 1 and 59 rows on Page 2.

---

### Task 2: Implement `MonthlyReportModal.tsx`
- **File:** `src/components/modals/MonthlyReportModal.tsx`
- **Details:**
  - Receive `showModal`, `setShowModal`, `reportPeriod`, `reportData`, `currentDateStr`.
  - Group buildings into Page 1 (Thanthip and Wichuda) and Page 2 (Pakdee).
    - Note: In case building names differ slightly (e.g. contains 'ธารทิพย์', 'วิชุดา', 'พักดี'), perform robust matching by name or fallback to index (buildings[0], buildings[1] on Page 1; buildings[2] on Page 2).
  - Sheet 1:
    - Title: `ค่าเช่า ประจำเดือน [เดือนไทย] [ปี พ.ศ.]`
    - Building 1 Table (Thanthip): 7 columns, empty rooms show room number and blank cells for cols 2-7. Subtotal row.
    - 2 blank rows.
    - Building 2 Table (Wichuda): same structure. Subtotal row.
    - Footer: `วันที่เอกสาร : [วันที่]` right-aligned.
  - Sheet 2:
    - Title: `ค่าเช่า ประจำเดือน [เดือนไทย] [ปี พ.ศ.]`
    - Building 3 Table (Pakdee): same structure. Subtotal row.
    - 2 blank rows.
    - 3-Building Summary Table:
      - Header: `#4472C4`
      - Rows for all 3 buildings: `ลำดับ`, `อพาร์ทเมนท์ ( เช่ารวม X ห้อง )`, `ค่าห้อง`, `ค่าน้ำ`, `ค่าไฟ`, `ค่าใช้จ่ายอื่นๆ`, `รวมเป็นเงิน`.
      - Grand Total row: `#FFF2CC`, `ยอดรวม ( Total )` | grand total amount.
    - Footer: `วันที่เอกสาร : [วันที่]` right-aligned.
  - Standalone popup print handler:
    - Injects module CSS + `@page { size: A4 portrait; margin: 0; }`.
    - Opens print dialog.

---

### Task 3: Integrate with `ReportTab.tsx`
- **File:** `src/components/tabs/ReportTab.tsx`
- **Details:**
  - Add state `showMonthlyPrintModal` (boolean).
  - In `handlePrint`:
    - When `activeSubTab === 'SUMMARY'`, open `MonthlyReportModal` instead of generic `window.print()`.
    - Keep other subtabs using their dedicated print/window behaviors.
  - Render `<MonthlyReportModal />` inside `ReportTab`.

---

### Task 4: Local Verification via Automated Puppeteer Testing
- **File:** `scripts/check-monthly-report-print.js`
- **Details:**
  - Launch Chrome in headless mode.
  - Log in to `http://localhost:3000`.
  - Open `รายงาน (Reports)`.
  - Click `พิมพ์รายงาน` to display the modal.
  - Capture screenshots of Sheet 1 and Sheet 2.
  - Generate PDF via Puppeteer.
  - Check PDF page count (must be exactly 2 pages).
  - Verify data values:
    - Thanthip: 71,121 THB (20 occupied)
    - Wichuda: 53,400 THB (17 occupied)
    - Pakdee: 93,082 THB (24 occupied)
    - Grand Total: 217,603 THB (61 occupied)
    - Empty rooms have blank cells.
