'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AnnualReportModal.module.css';
import { formatThaiMonthOnly, getShortBuildingName, THAI_MONTHS } from '@/lib/thaiDate';

export interface AnnualReportModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  reportYear: string;
  reportBuildingId: string;
  buildings: any[];
  yearlyData: any[];
  currentDateStr: string;
}

export default function AnnualReportModal({
  showModal,
  setShowModal,
  reportYear,
  reportBuildingId,
  buildings,
  yearlyData,
  currentDateStr,
}: AnnualReportModalProps) {
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

  if (!showModal) return null;

  const thaiYear = reportYear ? parseInt(reportYear) + 543 : '';
  const selectedBuilding =
    reportBuildingId && reportBuildingId !== 'ALL'
      ? (buildings || []).find((b) => b.id === reportBuildingId)
      : null;
  const pageHeaderTitle = selectedBuilding
    ? `สรุปรายงานค่าเช่า ${selectedBuilding.name} ประจำปี ${thaiYear}`
    : `สรุปรายงานค่าเช่า ประจำปี ${thaiYear}`;

  const formatAmount = (val: number | undefined | null, keepDecimals = false) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    const num = val || 0;
    if (num === 0) return '';
    if (keepDecimals && num % 1 !== 0) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(num).toLocaleString('en-US');
  };

  const formatTotalCell = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Math.round(val || 0).toLocaleString('en-US');
  };

  const getBuildingOrder = (name: string) => {
    if (!name) return 99;
    if (name.includes('ธารทิพย์')) return 1;
    if (name.includes('วิชุดา')) return 2;
    if (name.includes('พักดี')) return 3;
    return 4;
  };

  // Build complete 12 months array
  const fullYearMonths = Array.from({ length: 12 }, (_, i) => {
    const period = `${reportYear}-${String(i + 1).padStart(2, '0')}`;
    const found = (yearlyData || []).find((d) => d.period === period);
    if (found) {
      const sortedB = [...(found.buildings || [])].sort(
        (a: any, b: any) =>
          getBuildingOrder(a.buildingName || a.name) -
          getBuildingOrder(b.buildingName || b.name)
      );
      return { ...found, buildings: sortedB };
    }

    // Default empty month data
    const sortedBuildingsList = [...(buildings || [])].sort(
      (a: any, b: any) =>
        getBuildingOrder(a.buildingName || a.name) -
        getBuildingOrder(b.buildingName || b.name)
    );

    const bList = sortedBuildingsList.map((b) => ({
      buildingId: b.id,
      buildingName: b.name,
      occupiedRooms: 0,
      rentCost: 0,
      waterCost: 0,
      electricityCost: 0,
      otherCost: 0,
      totalAmount: 0,
      govWaterBill: 0,
      govElecBill: 0,
      netTotal: 0,
    }));

    return {
      period,
      buildings: bList,
      total: {
        occupiedRooms: 0,
        rentCost: 0,
        waterCost: 0,
        electricityCost: 0,
        otherCost: 0,
        totalAmount: 0,
        govWaterBill: 0,
        govElecBill: 0,
        netTotal: 0,
      },
    };
  });

  // Calculate annual grand totals
  const grandTotal = fullYearMonths.reduce(
    (acc, m) => {
      acc.occupiedRooms += m.total.occupiedRooms || 0;
      acc.waterCost += m.total.waterCost || 0;
      acc.electricityCost += m.total.electricityCost || 0;
      acc.otherCost += m.total.otherCost || 0;
      acc.rentCost += m.total.rentCost || 0;
      acc.totalAmount += m.total.totalAmount || 0;
      acc.govWaterBill += m.total.govWaterBill || 0;
      acc.govElecBill += m.total.govElecBill || 0;
      acc.netTotal += m.total.netTotal || 0;
      return acc;
    },
    {
      occupiedRooms: 0,
      waterCost: 0,
      electricityCost: 0,
      otherCost: 0,
      rentCost: 0,
      totalAmount: 0,
      govWaterBill: 0,
      govElecBill: 0,
      netTotal: 0,
    }
  );

  // Standalone Popup Print Window
  const handlePrintA4 = () => {
    if (!printableContainerRef.current) return;

    const sheet = printableContainerRef.current.querySelector(
      `.${styles.a4Sheet}`
    );
    if (!sheet) return;

    const printWindow = window.open('', '_blank', 'width=950,height=1200');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัพในเบราว์เซอร์เพื่อพิมพ์รายงานสรุปการเงินรายปี');
      return;
    }

    const sheetHtml = sheet.outerHTML;

    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classRe = new RegExp(
      `\\.(?:${Object.values(styles)
        .map((c) => escapeRe(String(c)))
        .join('|')})(?![\\w-])`
    );
    let moduleCss = '';
    Array.from(document.styleSheets).forEach((s) => {
      let rules: CSSRuleList;
      try {
        rules = s.cssRules;
      } catch {
        return;
      }
      Array.from(rules).forEach((rule) => {
        if (rule.type === CSSRule.STYLE_RULE && classRe.test(rule.cssText)) {
          moduleCss += rule.cssText + '\n';
        }
      });
    });

    const printDoc = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>สรุปรายงานค่าเช่า ประจำปี ${thaiYear}</title>
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
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    @media print {
      .${styles.a4Sheet} {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  ${sheetHtml}
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
    printWindow.document.write(printDoc);
    printWindow.document.close();
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
            <span className={styles.toolbarBadge}>1 หน้า</span>
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

        {/* Printable Sheet Preview */}
        <div className={styles.sheetsWrapper}>
          <div
            className={styles.sheetsSizer}
            style={{
              width: `${Math.round(794 * zoom)}px`,
              height: `${Math.round(1119 * zoom)}px`,
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
              <div className={styles.a4Sheet}>
              <div className={styles.sheetBody}>
                <div className={styles.pageHeaderTitle}>{pageHeaderTitle}</div>

                <table className={styles.annualTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>
                        เดือน /<br />
                        อพาร์ทเมนท์
                      </th>
                      <th style={{ width: '9%' }}>
                        ห้องที่เช่า
                        <br />
                        (ห้อง)
                      </th>
                      <th style={{ width: '9%' }}>
                        ค่าน้ำ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '9%' }}>
                        ค่าไฟ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '9%' }}>
                        ค่าอื่นๆ
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '9%' }}>
                        ค่าห้อง
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '10%' }}>
                        รวมค่าเช่า
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '9%' }}>
                        บิลน้ำหลวง
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '9%' }}>
                        บิลไฟหลวง
                        <br />
                        (บาท)
                      </th>
                      <th style={{ width: '11%' }}>
                        รวมสุทธิ
                        <br />
                        (บาท)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullYearMonths.map((m) => {
                      const monthIdx = parseInt(m.period.split('-')[1]) - 1;
                      const monthName = THAI_MONTHS[monthIdx] || formatThaiMonthOnly(m.period);
                      const hasData = (m.buildings || []).some((b: any) => (b.totalAmount || 0) > 0 || (b.occupiedRooms || 0) > 0);

                      return (
                        <React.Fragment key={m.period}>
                          {/* Month Header Row */}
                          <tr className={styles.monthRow}>
                            <td colSpan={10}>{monthName}</td>
                          </tr>

                          {/* Building Rows */}
                          {(m.buildings || []).map((b: any, bIdx: number) => (
                            <tr key={b.buildingId || bIdx} className={styles.buildingRow}>
                              <td className={`${styles.textLeft} ${styles.buildingNameCell}`}>
                                {bIdx + 1}.{getShortBuildingName(b.buildingName)}
                              </td>
                              <td className={styles.textCenter}>
                                {b.occupiedRooms > 0 ? b.occupiedRooms : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.waterCost > 0 ? formatAmount(b.waterCost) : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.electricityCost > 0 ? formatAmount(b.electricityCost) : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.otherCost > 0 ? formatAmount(b.otherCost) : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.rentCost > 0 ? formatAmount(b.rentCost) : ''}
                              </td>
                              <td className={`${styles.textRight} ${styles.bold}`}>
                                {b.totalAmount > 0 ? formatAmount(b.totalAmount) : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.govWaterBill > 0 ? formatAmount(b.govWaterBill) : ''}
                              </td>
                              <td className={styles.textRight}>
                                {b.govElecBill > 0 ? formatAmount(b.govElecBill) : ''}
                              </td>
                              <td
                                className={`${styles.textRight} ${
                                  b.netTotal < 0 ? styles.negative : styles.bold
                                }`}
                              >
                                {b.netTotal !== 0 ? (
                                  `${b.netTotal > 0 ? '' : ''}${formatAmount(b.netTotal)}`
                                ) : (
                                  ''
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Month Total Row (ยอดรวม) */}
                          <tr className={styles.monthTotalRow}>
                            <td className={`${styles.textRight} ${styles.monthTotalLabel}`}>ยอดรวม</td>
                            <td className={styles.textCenter}>
                              {m.total.occupiedRooms > 0 ? m.total.occupiedRooms : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.waterCost > 0 ? formatAmount(m.total.waterCost) : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.electricityCost > 0 ? formatAmount(m.total.electricityCost) : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.otherCost > 0 ? formatAmount(m.total.otherCost) : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.rentCost > 0 ? formatAmount(m.total.rentCost) : ''}
                            </td>
                            <td className={`${styles.textRight} ${styles.bold}`}>
                              {m.total.totalAmount > 0 ? formatAmount(m.total.totalAmount) : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.govWaterBill > 0 ? formatAmount(m.total.govWaterBill) : ''}
                            </td>
                            <td className={styles.textRight}>
                              {m.total.govElecBill > 0 ? formatAmount(m.total.govElecBill) : ''}
                            </td>
                            <td
                              className={`${styles.textRight} ${
                                m.total.netTotal < 0 ? styles.negative : styles.bold
                              }`}
                            >
                              {m.total.netTotal !== 0 ? (
                                `${m.total.netTotal > 0 ? '' : ''}${formatAmount(m.total.netTotal)}`
                              ) : (
                                ''
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Annual Grand Total Row (ยอดรวมสุทธิ) */}
                    <tr className={styles.grandTotalRow}>
                      <td className={`${styles.textRight} ${styles.grandTotalLabel}`}>ยอดรวมสุทธิ</td>
                      <td className={styles.textCenter}>{formatTotalCell(grandTotal.occupiedRooms)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.waterCost)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.electricityCost)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.otherCost)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.rentCost)}</td>
                      <td className={`${styles.textRight} ${styles.bold}`}>{formatTotalCell(grandTotal.totalAmount)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.govWaterBill)}</td>
                      <td className={styles.textRight}>{formatTotalCell(grandTotal.govElecBill)}</td>
                      <td
                        className={`${styles.textRight} ${
                          grandTotal.netTotal < 0 ? styles.negative : styles.bold
                        }`}
                      >
                        {formatTotalCell(grandTotal.netTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
