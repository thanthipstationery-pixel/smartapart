'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './MonthlyReportModal.module.css';
import { formatThaiMonthOnly, getShortBuildingName } from '@/lib/thaiDate';

export interface MonthlyReportModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  reportPeriod: string;
  reportData: {
    buildingData: any[];
    grandTotal: number;
    grandRentCost: number;
    grandWaterCost: number;
    grandElectricityCost: number;
    grandOtherCost: number;
  };
  currentDateStr: string;
}

export default function MonthlyReportModal({
  showModal,
  setShowModal,
  reportPeriod,
  reportData,
  currentDateStr,
}: MonthlyReportModalProps) {
  const [zoom, setZoom] = useState<number>(0.9);
  const [isFit, setIsFit] = useState<boolean>(false);
  const [fitScale, setFitScale] = useState<number>(0.5);
  const printableContainerRef = useRef<HTMLDivElement>(null);

  // Auto-fit calculation for responsive preview (especially mobile)
  useEffect(() => {
    const calcFit = () => {
      if (typeof window === 'undefined') return { isMobile: false, scale: 0.5 };
      const isMobile = window.innerWidth < 820;
      const padding = window.innerWidth < 480 ? 16 : 32;
      const scale = Math.min(
        1.0,
        Math.max(0.3, +((window.innerWidth - padding) / 794).toFixed(3))
      );
      setFitScale(scale);
      return { isMobile, scale };
    };

    if (showModal) {
      const { isMobile, scale } = calcFit();
      if (isMobile) {
        setIsFit(true);
        setZoom(scale);
      } else {
        setIsFit(false);
        setZoom(0.9);
      }

      const handleResize = () => {
        const { isMobile, scale } = calcFit();
        setIsFit((prevFit) => {
          if (prevFit || isMobile) {
            setZoom(scale);
            return true;
          }
          return prevFit;
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showModal]);

  const handleSetFit = () => {
    setIsFit(true);
    setZoom(fitScale);
  };

  const handleSetZoom = (val: number) => {
    setIsFit(false);
    setZoom(val);
  };

  console.log('[DEBUG] MonthlyReportModal render! showModal =', showModal);
  if (!showModal) return null;

  const formatAmount = (val: number | undefined | null) => {
    const num = val || 0;
    return Math.round(num).toLocaleString('en-US');
  };

  const periodParts = reportPeriod ? reportPeriod.split('-') : [];
  const thaiMonth = formatThaiMonthOnly(reportPeriod);
  const thaiYear = periodParts[0] ? parseInt(periodParts[0]) + 543 : '';
  const pageHeaderTitle = `ค่าเช่า ประจำเดือน ${thaiMonth}  ${thaiYear}`;

  // Find buildings specifically for Page 1 and Page 2
  const allBuildings = reportData?.buildingData || [];
  const thanthip =
    allBuildings.find((b) => b.name?.includes('ธารทิพย์')) || allBuildings[0];
  const wichuda =
    allBuildings.find((b) => b.name?.includes('วิชุดา')) || allBuildings[1];
  const pakdee =
    allBuildings.find((b) => b.name?.includes('พักดี')) || allBuildings[2];

  // Print Handler via standalone window (guaranteeing exact 2-page A4 output)
  const handlePrintA4 = () => {
    if (!printableContainerRef.current) return;

    const sheets = printableContainerRef.current.querySelectorAll(
      `.${styles.a4Sheet}`
    );
    if (!sheets || sheets.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=950,height=1200');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัพในเบราว์เซอร์เพื่อพิมพ์รายงานสรุปประจำเดือน');
      return;
    }

    let sheetsHtml = '';
    sheets.forEach((sheet) => {
      sheetsHtml += sheet.outerHTML;
    });

    // Re-use the exact CSS module rules
    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classRe = new RegExp(
      `\\.(?:${Object.values(styles)
        .map((c) => escapeRe(String(c)))
        .join('|')})(?![\\w-])`
    );
    let moduleCss = '';
    Array.from(document.styleSheets).forEach((sheet) => {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        return;
      }
      Array.from(rules).forEach((rule) => {
        if (rule.type === CSSRule.STYLE_RULE && classRe.test(rule.cssText)) {
          moduleCss += rule.cssText + '\n';
        }
      });
    });

    const printDocumentContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>รายงานสรุปค่าเช่าประจำเดือน - ${thaiMonth} ${thaiYear}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: Arial, 'Sarabun', 'Segoe UI', Tahoma, sans-serif;
    }
    ${moduleCss}
    .${styles.a4Sheet} {
      width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    @media print {
      .${styles.a4Sheet} {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  ${sheetsHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(printDocumentContent);
    printWindow.document.close();
  };

  // Render a building table matching the original Excel structure
  const renderBuildingTable = (bData: any) => {
    if (!bData) return null;
    return (
      <div key={bData.id || bData.name}>
        <div className={styles.buildingTitle}>{bData.name}</div>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th style={{ width: '7%' }}>ห้อง</th>
              <th style={{ width: '28%' }}>ชื่อผู้เช่า</th>
              <th style={{ width: '12.3%' }}>ค่าห้อง</th>
              <th style={{ width: '12.3%' }}>ค่าน้ำ (บาท)</th>
              <th style={{ width: '12.3%' }}>ค่าไฟ (บาท)</th>
              <th style={{ width: '12.3%' }}>ค่าใช้จ่ายอื่นๆ</th>
              <th style={{ width: '16.8%' }}>รวมเป็นเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {(bData.invoices || []).map((inv: any, idx: number) => {
              const isZebra = idx % 2 === 1;
              return (
                <tr
                  key={inv.roomNumber}
                  className={isZebra ? styles.zebraRow : ''}
                >
                  <td className={styles.textCenter}>{inv.roomNumber}</td>
                  {inv.isEmpty ? (
                    <>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </>
                  ) : (
                    <>
                      <td className={styles.textLeft}>{inv.tenantName}</td>
                      <td className={styles.textRight}>
                        {inv.rentCost ? formatAmount(inv.rentCost) : ''}
                      </td>
                      <td className={styles.textRight}>
                        {inv.waterCost > 0 ? formatAmount(inv.waterCost) : ''}
                      </td>
                      <td className={styles.textRight}>
                        {inv.electricityCost > 0
                          ? formatAmount(inv.electricityCost)
                          : ''}
                      </td>
                      <td className={styles.textRight}>
                        {inv.otherCost > 0 ? formatAmount(inv.otherCost) : ''}
                      </td>
                      <td className={`${styles.textRight} ${styles.bold}`}>
                        {formatAmount(inv.totalAmount)}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            <tr className={styles.subtotalRow}>
              <td colSpan={6} className={styles.subtotalLabel}>
                ยอดรวม ( Total )
              </td>
              <td className={`${styles.textRight} ${styles.bold}`}>
                {formatAmount(bData.buildingTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowModal(false);
      }}
    >
      <div className={styles.modalContainer}>
        {/* Sticky Control Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolbarTitle}>
              <span>📄</span> ตัวอย่างก่อนพิมพ์ (A4)
            </div>
            <span className={styles.toolbarBadge}>2 หน้า</span>
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.zoomGroup}>
              <button
                className={`${styles.zoomBtn} ${
                  isFit ? styles.zoomBtnActive : ''
                }`}
                onClick={handleSetFit}
                title="ย่อให้พอดีกับความกว้างหน้าจอ"
              >
                พอดีจอ
              </button>
              <button
                className={`${styles.zoomBtn} ${
                  !isFit && zoom === 0.75 ? styles.zoomBtnActive : ''
                }`}
                onClick={() => handleSetZoom(0.75)}
              >
                75%
              </button>
              <button
                className={`${styles.zoomBtn} ${
                  !isFit && zoom === 0.9 ? styles.zoomBtnActive : ''
                }`}
                onClick={() => handleSetZoom(0.9)}
              >
                90%
              </button>
              <button
                className={`${styles.zoomBtn} ${
                  !isFit && zoom === 1.0 ? styles.zoomBtnActive : ''
                }`}
                onClick={() => handleSetZoom(1.0)}
              >
                100%
              </button>
            </div>

            <button className={styles.printBtn} onClick={handlePrintA4}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              สั่งพิมพ์ (Print / PDF)
            </button>

            <button
              className={styles.closeBtn}
              onClick={() => setShowModal(false)}
            >
              ✕ ปิด
            </button>
          </div>
        </div>

        {/* Printable Sheets Preview */}
        <div className={styles.sheetsWrapper}>
          <div
            className={styles.sheetsSizer}
            style={{
              width: `${Math.round(794 * zoom)}px`,
              height: `${Math.round(2262 * zoom)}px`,
            }}
          >
            <div
              ref={printableContainerRef}
              className={styles.sheetsContainer}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
            {/* ═══════════════ PAGE 1: Thanthip + Wichuda ═══════════════ */}
            <div className={styles.a4Sheet}>
              <div className={styles.sheetBody}>
                <div className={styles.pageHeaderTitle}>{pageHeaderTitle}</div>

                {/* Building 1: Thanthip */}
                {renderBuildingTable(thanthip)}

                {/* Spacing between buildings */}
                <div className={styles.sectionSpacer} />

                {/* Building 2: Wichuda */}
                {renderBuildingTable(wichuda)}
              </div>

              {/* Page 1 Footer */}
              <div className={styles.sheetFooter}>
                วันที่เอกสาร : {currentDateStr}
              </div>
            </div>

            {/* ═══════════════ PAGE 2: Pakdee + 3-Building Summary Table ═══════════════ */}
            <div className={styles.a4Sheet}>
              <div className={styles.sheetBody}>
                <div className={styles.pageHeaderTitle}>{pageHeaderTitle}</div>

                {/* Building 3: Pakdee */}
                {renderBuildingTable(pakdee)}

                {/* Spacing before summary table: เพิ่มระยะห่าง 3-4 บรรทัด เพื่อแยกส่วนให้ชัดเจน */}
                <div className={styles.summaryTableSpacer} />

                {/* 3-Building Summary Table */}
                <table className={`${styles.reportTable} ${styles.summaryTable}`}>
                  <thead>
                    <tr>
                      <th style={{ width: '7%' }}>ลำดับ</th>
                      <th style={{ width: '28%' }}>อพาร์ทเมนท์</th>
                      <th style={{ width: '12.3%' }}>
                        ค่าห้อง
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '12.3%' }}>
                        ค่าน้ำ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '12.3%' }}>
                        ค่าไฟ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '12.3%' }}>
                        ค่าใช้จ่ายอื่นๆ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '16.8%' }}>
                        รวมเป็นเงิน
                        <br />
                        (บาท)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[thanthip, wichuda, pakdee].filter(Boolean).map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td className={styles.textCenter}>{idx + 1}</td>
                        <td className={styles.textLeft}>
                          {getShortBuildingName(b.name)}{' '}
                          <span style={{ fontSize: '9px', color: '#333' }}>
                            ( เช่ารวม {b.occupiedRooms} ห้อง )
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          {formatAmount(b.buildingRentCost)}
                        </td>
                        <td className={styles.textRight}>
                          {formatAmount(b.buildingWaterCost)}
                        </td>
                        <td className={styles.textRight}>
                          {formatAmount(b.buildingElectricityCost)}
                        </td>
                        <td className={styles.textRight}>
                          {formatAmount(b.buildingOtherCost)}
                        </td>
                        <td className={`${styles.textRight} ${styles.bold}`}>
                          {formatAmount(b.buildingTotal)}
                        </td>
                      </tr>
                    ))}
                    <tr className={styles.grandTotalRow}>
                      <td colSpan={6} className={styles.subtotalLabel}>
                        ยอดรวม ( Total )
                      </td>
                      <td className={`${styles.textRight} ${styles.bold}`}>
                        {formatAmount(reportData.grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Page 2 Footer */}
              <div className={styles.sheetFooter}>
                วันที่เอกสาร : {currentDateStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
