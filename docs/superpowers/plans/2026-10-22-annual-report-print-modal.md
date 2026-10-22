# Implementation Plan: Annual Report Print Modal (1:1 Exact Replica)

- **Date:** 2026-10-22
- **Spec:** `docs/superpowers/specs/2026-10-22-annual-report-print-modal-design.md`
- **Goal:** Provide an exact 1:1 replica of the original Annual Rental Financial Summary Report in a dedicated A4 Print Preview Modal, strictly constrained to 1 page.

---

## Proposed Tasks

### Task 1: Create `AnnualReportModal.module.css`
- **File:** `src/components/modals/AnnualReportModal.module.css`
- **Details:**
  - Overlay, modal container, sticky toolbar with zoom controls, print and close buttons.
  - `.a4Sheet`: `width: 210mm; height: 296mm; max-height: 296mm; padding: 6mm 8mm 4mm 8mm;`
  - `.pageHeaderTitle`: font size 14px bold, center.
  - `.annualTable`: 10-column table, fixed layout, font size 10.5px - 11px.
  - `.annualTable th`: background `#000000`, white bold, padding 2.5px 2px.
  - `.monthHeaderRow td`: background `#595959`, white bold, padding 2px 6px.
  - `.buildingRow td`: background `#ffffff`, padding 1px 3px.
  - `.monthTotalRow td`: background `#D9D9D9`, black bold, padding 1.5px 3px.
  - `.grandTotalRow td`: background `#FFF2CC`, black bold, border-top 1px solid #000, border-bottom 2px double #000.
  - `.sheetFooter`: font size 9.5px, right-aligned.

---

### Task 2: Implement `AnnualReportModal.tsx`
- **File:** `src/components/modals/AnnualReportModal.tsx`
- **Details:**
  - Props: `showModal`, `setShowModal`, `reportYear`, `reportBuildingId`, `buildings`, `yearlyData`, `currentDateStr`.
  - Title: `สรุปรายงานค่าเช่า ประจำปี ${parseInt(reportYear) + 543}`.
  - If `yearlyData` is empty, generate all 12 months with 0s.
  - Map each month's buildings: `1.ธารทิพย์`, `2.วิชุดา`, `3.พักดี`.
  - Format numbers with commas; empty/0 values in other/gov bills formatted cleanly.
  - Net total in red if negative.
  - Month total row (`ยอดรวม`) summing across buildings.
  - Grand total row (`ยอดรวมสุทธิ`) summing all 12 months.
  - Standalone popup print method injecting CSS rules and `@page { size: A4 portrait; margin: 0; }`.

---

### Task 3: Integrate with `ReportTab.tsx`
- **File:** `src/components/tabs/ReportTab.tsx`
- **Details:**
  - Import `AnnualReportModal`.
  - Add state `showAnnualPrintModal`.
  - In `handlePrint`:
    - If `activeSubTab === 'YEARLY'`, set `showAnnualPrintModal(true)`.
  - Render `<AnnualReportModal />` with `yearlyData`, `reportYear`, `reportBuildingId`, `buildings`, `currentDateStr`.
  - Align desktop screen table labels (`[Month] Total` -> `ยอดรวม`, `Grand Total` -> `ยอดรวมสุทธิ`) and headers.

---

### Task 4: Local Verification via Automated Puppeteer Testing
- **File:** `scripts/check-annual-report-print.js`
- **Details:**
  - Log in to `http://localhost:3000`.
  - Open `รายงาน (Reports)` -> `รายงานสรุปการเงินรายปี`.
  - Click `พิมพ์รายงาน`.
  - Capture screenshot of preview and A4 sheet.
  - Export PDF and verify page count is **strictly 1 page**.
  - Verify data values match system calculation.
