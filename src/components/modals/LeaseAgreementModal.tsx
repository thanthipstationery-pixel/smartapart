'use client';

import React, { useState, useRef } from 'react';
import styles from './LeaseAgreementModal.module.css';
import { THAI_MONTHS } from '@/lib/thaiDate';
import { parseThaiAddress, ParsedThaiAddress as ParsedAddress } from '@/lib/thaiAddress';

export interface LeaseAgreementModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  room: any;
  tenant: any;
  building: any;
  property: any;
}

// Convert Western digits (0-9) to Thai digits (๐-๙)
function toThaiDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const thaiMap = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(val).replace(/[0-9]/g, (d) => thaiMap[parseInt(d, 10)]);
}

// Convert Thai digits (๐-๙) to Western digits (0-9)
function toArabicDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
  return String(val).replace(/[๐-๙]/g, (d) => String(thaiDigits.indexOf(d)));
}

// Format numbers as currency with optional Thai digits
function formatCurrency(
  val: number | string | null | undefined,
  useThai = true
): string {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return String(val);
  const formatted = num.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return useThai ? toThaiDigits(formatted) : toArabicDigits(formatted);
}

// Parse Name into Prefix, First Name, Last Name
function parseThaiName(fullName?: string | null) {
  if (!fullName || !fullName.trim()) {
    return { prefix: '', firstName: '', lastName: '', fullName: '' };
  }
  let trimmed = fullName.trim();
  let prefix = '';
  const prefixes = ['นาย', 'นางสาว', 'น.ส.', 'นาง'];
  for (const p of prefixes) {
    if (trimmed.startsWith(p)) {
      prefix = p;
      trimmed = trimmed.slice(p.length).trim();
      break;
    }
  }
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return {
    prefix,
    firstName,
    lastName,
    fullName: fullName.trim(),
  };
}

export default function LeaseAgreementModal({
  showModal,
  setShowModal,
  room,
  tenant,
  building,
  property,
}: LeaseAgreementModalProps) {
  // Section print toggles
  const [printLease, setPrintLease] = useState(true); // Pages 1-3
  const [printAsset, setPrintAsset] = useState(true); // Pages 4-5
  const [printRules, setPrintRules] = useState(true); // Page 6
  const [printIdCard, setPrintIdCard] = useState(true); // Page 7

  // Display toggles
  const [useThaiNumerals, setUseThaiNumerals] = useState(true);
  const [zoomScale, setZoomScale] = useState<number>(0.9);

  // Gender / Title prefix states (allows clicking in preview to toggle if needed)
  const [t1PrefixOverride, setT1PrefixOverride] = useState<string | null>(null);
  const [t2PrefixOverride, setT2PrefixOverride] = useState<string | null>(null);

  const printableContainerRef = useRef<HTMLDivElement>(null);

  if (!showModal) return null;

  // Normalized building & property data
  const currentBuilding =
    building || room?.floor?.building || property?.buildings?.[0] || {};
  const currentProperty = property || {};
  const buildingName =
    currentBuilding.name || currentProperty.name || 'อพาร์ทเมนท์';
  const buildingAddress =
    currentBuilding.address || currentProperty.address || '';
  const buildingPhone = currentBuilding.phone || currentProperty.phone || '';
  const lateFeeVal = currentBuilding.lateFee ?? 100;

  // Split address into 2 lines for formal header
  const addressLines = buildingAddress ? buildingAddress.split('\n') : [''];
  const addressLine1 = addressLines[0] || '';
  const addressLine2 = addressLines.slice(1).join(' ') || '';

  // Room & Financial calculations
  const roomNumber = room?.number || tenant?.room?.number || '';
  const totalRent = Number(room?.basePrice || room?.price || 0);
  const roomRentShare = Number(tenant?.roomRentShare ?? 1000);
  const assetRentShare = Number(
    tenant?.assetRentShare ?? Math.max(0, totalRent - roomRentShare)
  );
  const securityDeposit = Number(tenant?.securityDeposit ?? 0);
  const firstMonthRent = totalRent;
  const totalInitialPay = securityDeposit + firstMonthRent;

  // Contract duration & date
  const contractDurationMonths = tenant?.contractDurationMonths || 6;
  const contractDate = tenant?.startDate ? new Date(tenant.startDate) : new Date();
  const contractDay = contractDate.getDate();
  const contractMonth = THAI_MONTHS[contractDate.getMonth()] || '';
  const contractYearBE = contractDate.getFullYear() + 543;

  const contractNumber =
    tenant?.contractNumber ||
    (roomNumber ? `${roomNumber}/${contractYearBE}` : '');

  // Tenant 1 Information
  const t1Parsed = parseThaiName(tenant?.name);
  const t1Address = parseThaiAddress(tenant?.address);
  const t1WorkAddress = parseThaiAddress(tenant?.workplace);
  const t1Age = tenant?.age ? String(tenant.age) : '';
  const t1Nickname = tenant?.nickname || '';
  const t1Phone = tenant?.phone || '';
  const t1IdCard = tenant?.idCard || '';
  const t1EmergencyName = tenant?.emergencyName || '';
  const t1EmergencyRel = tenant?.emergencyRel || '';
  const t1EmergencyPhone = tenant?.emergencyPhone || '';

  // Tenant 2 Information (Co-tenant)
  const hasSecondTenant = Boolean(
    tenant?.secondTenantName && tenant.secondTenantName.trim() !== ''
  );
  const t2Parsed = parseThaiName(tenant?.secondTenantName);
  const t2Address = parseThaiAddress(tenant?.secondTenantAddress);
  const t2WorkAddress = parseThaiAddress(tenant?.secondTenantWorkplace);
  const t2Age = tenant?.secondTenantAge ? String(tenant.secondTenantAge) : '';
  const t2Nickname = tenant?.secondTenantNickname || '';
  const t2Phone = tenant?.secondTenantPhone || '';
  const t2IdCard = tenant?.secondTenantIdCard || '';
  const t2EmergencyName = tenant?.secondTenantEmergencyName || '';
  const t2EmergencyRel = tenant?.secondTenantEmergencyRel || '';
  const t2EmergencyPhone = tenant?.secondTenantEmergencyPhone || '';

  // Number helper for current numeral setting
  const num = (v: number | string | null | undefined): string => {
    if (v === null || v === undefined || v === '') return '';
    return useThaiNumerals ? toThaiDigits(v) : toArabicDigits(v);
  };

  const curr = (v: number | string | null | undefined): string => {
    return formatCurrency(v, useThaiNumerals);
  };

  // Select all / Deselect all
  const allSelected = printLease && printAsset && printRules && printIdCard;
  const toggleSelectAll = () => {
    const nextVal = !allSelected;
    setPrintLease(nextVal);
    setPrintAsset(nextVal);
    setPrintRules(nextVal);
    setPrintIdCard(nextVal);
  };

  // Total pages count dynamically
  let totalSelectedPages = 0;
  if (printLease) totalSelectedPages += 3;
  if (printAsset) totalSelectedPages += 2;
  if (printRules) totalSelectedPages += 1;
  if (printIdCard) totalSelectedPages += 1;

  // Print Handler via standalone window
  const handlePrintA4 = () => {
    if (!printableContainerRef.current) return;

    const sheets = printableContainerRef.current.querySelectorAll(
      `.${styles.a4Sheet}`
    );
    if (!sheets || sheets.length === 0) {
      alert('กรุณาเลือกหน้าที่ต้องการพิมพ์อย่างน้อย 1 หน้า');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=950,height=1200');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัพในเบราว์เซอร์เพื่อพิมพ์เอกสารสัญญา');
      return;
    }

    let sheetsHtml = '';
    sheets.forEach((sheet) => {
      sheetsHtml += sheet.outerHTML;
    });

    // Re-use the exact CSS-module rules of the preview so the printed/PDF output matches it 1:1.
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
        return; // cross-origin stylesheet
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
  <title>สัญญาเช่าห้องพัก - ห้อง ${roomNumber} - ${buildingName}</title>
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
    }
    ${moduleCss}
    .${styles.a4Sheet} {
      width: 210mm !important;
      height: 296mm !important;
      min-height: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      transform: none !important;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .${styles.a4Sheet}:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    @media screen {
      body { background: #64748b; padding: 16px 0; }
      .${styles.a4Sheet} { margin: 0 auto 16px auto !important; box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important; }
    }
  </style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`;

    printWindow.document.write(printDocumentContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const activeT1Prefix = t1PrefixOverride !== null ? t1PrefixOverride : t1Parsed.prefix;
  const activeT2Prefix = t2PrefixOverride !== null ? t2PrefixOverride : t2Parsed.prefix;

  // Render prefix titles with automatic strikethrough for unused titles
  const renderTitlePrefix = (
    prefix: string | undefined,
    onSelect: (p: string) => void
  ) => {
    const norm = (prefix || '').trim();
    const isMr = norm === 'นาย';
    const isMiss = norm === 'นางสาว' || norm === 'น.ส.' || norm === 'น.ส';
    const isMrs = norm === 'นาง';

    return (
      <span className={styles.prefixGroup} title="คลิกเพื่อเลือก/เปลี่ยนคำนำหน้าชื่อ">
        <span
          className={
            isMr
              ? styles.activePrefix
              : isMiss || isMrs
              ? styles.strikethroughPrefix
              : styles.normalPrefix
          }
          onClick={() => onSelect('นาย')}
          style={{ cursor: 'pointer' }}
        >
          นาย
        </span>
        {' / '}
        <span
          className={
            isMrs
              ? styles.activePrefix
              : isMr || isMiss
              ? styles.strikethroughPrefix
              : styles.normalPrefix
          }
          onClick={() => onSelect('นาง')}
          style={{ cursor: 'pointer' }}
        >
          นาง
        </span>
        {' / '}
        <span
          className={
            isMiss
              ? styles.activePrefix
              : isMr || isMrs
              ? styles.strikethroughPrefix
              : styles.normalPrefix
          }
          onClick={() => onSelect('นางสาว')}
          style={{ cursor: 'pointer' }}
        >
          นางสาว
        </span>
      </span>
    );
  };

  // Fillable field: real dot leaders (same as the blank paper form) with the value floating above them.
  // Width is fixed by the dot count of the original form and only grows if the value is wider.
  const BlankFill = ({
    value,
    dots = 15,
    block = false,
  }: {
    value?: string | number | null;
    dots?: number;
    block?: boolean;
  }) => {
    const strVal =
      value !== undefined && value !== null ? num(String(value).trim()) : '';

    return (
      <span className={`${styles.blank} ${block ? styles.blankBlock : ''}`}>
        <span className={styles.blankSpacer} aria-hidden="true">
          {'.'.repeat(dots)}
        </span>
        {strVal && <span className={styles.blankText}>{strVal}</span>}
        <span className={styles.blankDots} aria-hidden="true">
          {'.'.repeat(Math.max(dots, 160))}
        </span>
      </span>
    );
  };

  // Split a long address across the two dotted address lines of the form
  const addressCombined = [addressLine1, addressLine2].filter(Boolean).join(' ').trim();
  const splitAddress = (s: string): [string, string] => {
    const MAX = 40;
    if (s.length <= MAX) return [s, ''];
    const cut = s.lastIndexOf(' ', MAX);
    if (cut <= 0) return [s.slice(0, MAX), s.slice(MAX)];
    return [s.slice(0, cut), s.slice(cut + 1)];
  };
  const [addrLineA, addrLineB] = splitAddress(addressCombined);

  // Header shared by the lease (page 1) and asset (page 4) contracts
  const renderContractHeader = (title: string) => (
    <>
      <div className={styles.docHeaderRight}>
        <div>
          สัญญาลงวันที่ <BlankFill value={num(contractDay)} dots={12} /> / <BlankFill value={contractMonth} dots={15} /> / <BlankFill value={num(contractYearBE)} dots={12} />
        </div>
        <div>
          เลขที่ <BlankFill value={num(contractNumber)} dots={36} />
        </div>
      </div>

      <div className={styles.docTitle}>{title}</div>

      <div className={styles.locationGrid}>
        <div className={styles.locationLeft}>
          ห้องพักเลขที่ <BlankFill value={num(roomNumber)} dots={15} />
        </div>
        <div className={styles.locationRight}>
          <div>สัญญานี้ทำขึ้นที่ <BlankFill value={buildingName} dots={44} /></div>
          <div><BlankFill block value={addrLineA} dots={71} /></div>
          <div><BlankFill block value={addrLineB} dots={71} /></div>
          <div className={styles.locationTel}>โทร. <BlankFill value={num(buildingPhone)} dots={62} /></div>
        </div>
      </div>
    </>
  );

  interface TenantBlockData {
    first: string;
    last: string;
    nick: string;
    age: string;
    idCard: string;
    addr: ParsedAddress;
    phone: string;
    emName: string;
    emPhone: string;
    work: ParsedAddress;
  }

  // One tenant block of page 1 (rows mirror the original Word form line by line)
  const renderTenantBlock = (
    no: string,
    prefixNode: React.ReactNode,
    d: TenantBlockData
  ) => (
    <div className={styles.tenantDetailBlock}>
      <div className={styles.formRow}>
        <strong>ผู้เช่า {num(no)}.</strong> {prefixNode}<BlankFill value={d.first} dots={36} /> นามสกุล <BlankFill value={d.last} dots={36} /> ชื่อเล่น <BlankFill value={d.nick} dots={15} />
      </div>
      <div className={styles.formRow}>
        อายุ <BlankFill value={num(d.age)} dots={11} /> ปี บัตรประชาชนเลขที่ <BlankFill value={num(d.idCard)} dots={35} /> อยู่บ้านเลขที่ <BlankFill value={num(d.addr.houseNo)} dots={13} /> ถนน <BlankFill value={d.addr.road} dots={26} />
      </div>
      <div className={styles.formRow}>
        หมู่ <BlankFill value={num(d.addr.moo)} dots={8} /> ตำบล/แขวง <BlankFill value={d.addr.subdistrict} dots={31} /> อำเภอ/เขต <BlankFill value={d.addr.district} dots={31} /> จังหวัด <BlankFill value={d.addr.province} dots={32} />
      </div>
      <div className={styles.formRow}>
        โทรศัพท์มือถือ <BlankFill value={num(d.phone)} dots={35} /> บุคคลที่สามารถติดต่อได้สะดวก บิดา / มารดา / ญาติ / เพื่อน
      </div>
      <div className={styles.formRow}>
        โปรดระบุ <BlankFill value={d.emName} dots={90} /> เบอร์ติดต่อ <BlankFill value={num(d.emPhone)} dots={35} />
      </div>
      <div className={styles.formGap} />
      <div className={styles.formRow}>
        ที่อยู่ปัจจุบัน / ที่ทำงาน / สถานศึกษา <BlankFill value={d.work.placeName} dots={101} />
      </div>
      <div className={styles.formRow}>
        เลขที่ <BlankFill value={num(d.work.houseNo)} dots={16} /> ถนน <BlankFill value={d.work.road} dots={45} /> หมู่ <BlankFill value={num(d.work.moo)} dots={12} /> ตำบล/แขวง <BlankFill value={d.work.subdistrict} dots={42} />
      </div>
      <div className={styles.formRow}>
        อำเภอ/เขต <BlankFill value={d.work.district} dots={43} /> จังหวัด <BlankFill value={d.work.province} dots={36} /> โทรศัพท์ <BlankFill value={num(d.work.phone || d.phone)} dots={36} />
      </div>
    </div>
  );

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowModal(false);
      }}
    >
      <div className={styles.modalContainer}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.modalTitle}>
              📄 สัญญาเช่าห้องพักและเอกสารแนบท้าย (A4)
            </h2>
            <span className={styles.roomBadge}>ห้อง {roomNumber || '-'}</span>
            {contractNumber && (
              <span className={styles.contractBadge}>
                เลขที่: {num(contractNumber)}
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={() => setShowModal(false)}
            aria-label="ปิดหน้าต่าง"
          >
            &times;
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.sectionToggles}>
            <button
              type="button"
              className={`${styles.sectionPill} ${allSelected ? styles.active : ''}`}
              onClick={toggleSelectAll}
            >
              <span>{allSelected ? '✓ เลือกทั้งหมด' : '☐ เลือกทั้งหมด'}</span>
            </button>

            <label
              className={`${styles.sectionPill} ${printLease ? styles.active : ''}`}
            >
              <input
                type="checkbox"
                checked={printLease}
                onChange={(e) => setPrintLease(e.target.checked)}
              />
              <span>สัญญาเช่าห้องพัก (หน้า ๑-๓)</span>
            </label>

            <label
              className={`${styles.sectionPill} ${printAsset ? styles.active : ''}`}
            >
              <input
                type="checkbox"
                checked={printAsset}
                onChange={(e) => setPrintAsset(e.target.checked)}
              />
              <span>สัญญาเช่าทรัพย์สิน (หน้า ๔-๕)</span>
            </label>

            <label
              className={`${styles.sectionPill} ${printRules ? styles.active : ''}`}
            >
              <input
                type="checkbox"
                checked={printRules}
                onChange={(e) => setPrintRules(e.target.checked)}
              />
              <span>กฎระเบียบ (หน้า ๖)</span>
            </label>

            <label
              className={`${styles.sectionPill} ${printIdCard ? styles.active : ''}`}
            >
              <input
                type="checkbox"
                checked={printIdCard}
                onChange={(e) => setPrintIdCard(e.target.checked)}
              />
              <span>สำเนาบัตรประชาชน (หน้า ๗)</span>
            </label>
          </div>

          <div className={styles.toolbarActions}>
            {/* Numeral Toggle */}
            <button
              type="button"
              className={styles.sectionPill}
              onClick={() => setUseThaiNumerals(!useThaiNumerals)}
              title="สลับเลขไทย / เลขอารบิก"
            >
              <span>{useThaiNumerals ? 'เลขไทย (๑ ๒ ๓)' : 'เลขอารบิก (1 2 3)'}</span>
            </button>

            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
              <button
                type="button"
                className={`${styles.zoomBtn} ${zoomScale === 0.75 ? styles.activeZoom : ''}`}
                onClick={() => setZoomScale(0.75)}
              >
                75%
              </button>
              <button
                type="button"
                className={`${styles.zoomBtn} ${zoomScale === 0.9 ? styles.activeZoom : ''}`}
                onClick={() => setZoomScale(0.9)}
              >
                90%
              </button>
              <button
                type="button"
                className={`${styles.zoomBtn} ${zoomScale === 1.0 ? styles.activeZoom : ''}`}
                onClick={() => setZoomScale(1.0)}
              >
                100%
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              className={styles.printBtn}
              onClick={handlePrintA4}
              title="สั่งพิมพ์ A4 หรือบันทึกเป็น PDF"
            >
              <span>🖨️</span>
              <span>สั่งพิมพ์เอกสาร ({num(totalSelectedPages)} หน้า)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Viewport */}
        <div className={styles.previewScrollArea}>
          <div
            ref={printableContainerRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2rem',
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* ============================================================
                PAGE 1: สัญญาเช่าห้องพัก (ข้อมูลคู่สัญญา)
               ============================================================ */}
            {printLease && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  {renderContractHeader('สัญญาเช่าห้องพัก')}

                  {/* Opening Paragraph */}
                  <div className={styles.docParagraph} style={{ marginBottom: '18pt' }}>
                    สัญญานี้ทำขึ้นระหว่าง <BlankFill value={buildingName} dots={79} /> ซึ่งต่อไปในสัญญานี้ จะเรียกว่า “<strong>ผู้ให้เช่า</strong>” ฝ่ายหนึ่ง กับ “<strong>ผู้เช่า</strong>” อีกฝ่ายหนึ่ง ซึ่ง ผู้เช่า ในสัญญาฉบับนี้ลงนามผูกพันสัญญา จำนวน <BlankFill value={hasSecondTenant ? num(2) : num(1)} dots={11} /> คน เพื่อพักอาศัยในห้องเช่าตามเลขที่ข้างต้น ปรากฏตามรายละเอียดดังนี้
                  </div>

                  {renderTenantBlock(
                    '๑',
                    renderTitlePrefix(activeT1Prefix, setT1PrefixOverride),
                    {
                      first: t1Parsed.firstName || t1Parsed.fullName,
                      last: t1Parsed.lastName,
                      nick: t1Nickname,
                      age: t1Age,
                      idCard: t1IdCard,
                      addr: t1Address,
                      phone: t1Phone,
                      emName: t1EmergencyName
                        ? `${t1EmergencyName}${t1EmergencyRel ? ` (${t1EmergencyRel})` : ''}`
                        : '',
                      emPhone: t1EmergencyPhone,
                      work: t1WorkAddress,
                    }
                  )}

                  {renderTenantBlock(
                    '๒',
                    renderTitlePrefix(activeT2Prefix, setT2PrefixOverride),
                    {
                      first: hasSecondTenant ? t2Parsed.firstName || t2Parsed.fullName : '',
                      last: hasSecondTenant ? t2Parsed.lastName : '',
                      nick: hasSecondTenant ? t2Nickname : '',
                      age: hasSecondTenant ? t2Age : '',
                      idCard: hasSecondTenant ? t2IdCard : '',
                      addr: hasSecondTenant ? t2Address : parseThaiAddress(''),
                      phone: hasSecondTenant ? t2Phone : '',
                      emName:
                        hasSecondTenant && t2EmergencyName
                          ? `${t2EmergencyName}${t2EmergencyRel ? ` (${t2EmergencyRel})` : ''}`
                          : '',
                      emPhone: hasSecondTenant ? t2EmergencyPhone : '',
                      work: hasSecondTenant ? t2WorkAddress : parseThaiAddress(''),
                    }
                  )}
                </div>
                <div className={styles.sheetFooter}>หน้า {num(1)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 2: ข้อตกลงสัญญาเช่าห้องพัก (ข้อ ๑ - ๑๓)
               ============================================================ */}
            {printLease && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  <div className={styles.clauseHeader}>
                    คู่สัญญาตกลงทำสัญญาเช่า โดยมีรายละเอียดดังนี้
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(1)}.</div>
                    <div className={styles.clauseText}>
                      ผู้เช่าตกลงเช่าห้องพัก ตามเลขที่ห้องข้างต้น จากผู้ให้เช่า
                      เพื่อใช้เป็นที่อยู่อาศัย ภายใต้กฎระเบียบและข้อบังคับ
                      ที่แนบท้ายสัญญา ซึ่งผู้ให้เช่ากำหนดไว้
                      โดยมีระยะเวลาการเช่าห้องพัก ไม่น้อยกว่า{' '}
                      <BlankFill value={num(contractDurationMonths)} dots={12} />{' '}
                      เดือน
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(2)}.</div>
                    <div className={styles.clauseText}>
                      ผู้ให้เช่าและผู้เช่า ตกลงค่าเช่าห้องพัก ในอัตราเดือนละ{' '}
                      <BlankFill value={curr(totalRent)} dots={21} /> บาท
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(3)}.</div>
                    <div className={styles.clauseText}>
                      ในวันทำสัญญา ผู้เช่าได้ชำระเงินให้กับผู้ให้เช่า ดังต่อไปนี้
                      <div className={styles.subClauseItem}>
                        <div className={styles.subClauseNum}>
                          {num(3)}.{num(1)}.
                        </div>
                        <div className={styles.subClauseText}>
                          เงินประกัน จำนวนเงิน{' '}
                          <BlankFill value={curr(securityDeposit)} dots={30} />{' '}
                          บาท
                        </div>
                      </div>
                      <div className={styles.subClauseItem}>
                        <div className={styles.subClauseNum}>
                          {num(3)}.{num(2)}.
                        </div>
                        <div className={styles.subClauseText}>
                          ค่าเช่าห้องในเดือนที่พัก เป็นจำนวนเงิน{' '}
                          <BlankFill value={curr(firstMonthRent)} dots={30} />{' '}
                          บาท
                        </div>
                      </div>
                      <div style={{ paddingLeft: '11mm', marginBottom: '8pt', whiteSpace: 'nowrap' }}>
                        รวมจำนวนเงินที่ผู้เช่าได้ชำระในวันทำสัญญา เป็นจำนวนเงิน{' '}
                        <BlankFill value={curr(totalInitialPay)} dots={30} />{' '}
                        บาท
                      </div>
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(4)}.</div>
                    <div className={styles.clauseText}>
                      ในกรณีที่ผู้เช่ามีผู้ร่วมพักอาศัย จะมีผู้ร่วมอาศัยอยู่ได้{' '}
                      {num(1)} คน
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(5)}.</div>
                    <div className={styles.clauseText}>
                      การคืนห้องพัก ผู้เช่าจะต้องบอกกล่าวล่วงหน้า ต่อผู้ให้เช่า
                      อย่างน้อย {num(30)} วัน มิฉะนั้นผู้เช่า จะมิได้เงินประกันคืน
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(6)}.</div>
                    <div className={styles.clauseText}>
                      เมื่อสัญญาเช่าสิ้นสุดลง และผู้เช่าได้ปฏิบัติตามสัญญาถูกต้อง
                      โดยห้องพักและทรัพย์สินอื่นๆ ของผู้ให้เช่าไม่ได้เกิดความเสียหาย
                      และผู้เช่ามิได้ติดค้างชำระค่าใช้จ่ายต่างๆ ผู้ให้เช่าจะคืน
                      เงินประกัน ให้แก่ผู้เช่า
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(7)}.</div>
                    <div className={styles.clauseText}>
                      กรณีที่ผู้เช่า พักไม่ครบระยะเวลาตามที่กำหนด ดังข้อที่{' '}
                      {num(1)}. ผู้ให้เช่ามีสิทธิ์ไม่คืนเงินค่าประกัน
                      หรือเงินมัดจำให้แก่ผู้เช่า
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(8)}.</div>
                    <div className={styles.clauseText}>
                      หากผู้เช่า กระทำการใดๆ เป็นเหตุให้ผู้ให้เช่าได้รับความเสียหาย
                      ผู้เช่ายินยอมที่จะให้ผู้ให้เช่าหักเงินค่าประกัน
                      ตามความเสียหายที่เกิดขึ้น ดังข้อตกลงที่ระบุไว้ในสัญญา
                      หรือตามมูลค่าที่พิสูจน์ได้ ในกรณีที่ไม่ได้กำหนดราคาไว้ในสัญญา
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(9)}.</div>
                    <div className={styles.clauseText}>
                      กรณีที่ผู้เช่าค้างค่าเช่านานเกินกว่า {num(10)} วัน
                      ผู้ให้เช่ามีสิทธิ์ล็อคห้อง ระงับการจ่ายน้ำ และไฟฟ้า
                      พร้อมทั้งยึดหน่วงทรัพย์สินของผู้เช่าภายในห้องทั้งหมดได้
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(10)}.</div>
                    <div className={styles.clauseText}>
                      เมื่อผู้เช่ากระทำผิดสัญญาข้อหนึ่งข้อใด
                      ผู้ให้เช่ามีสิทธิ์บอกเลิกสัญญาเช่า
                      ที่ผู้เช่ายอมให้ผู้ให้เช่าทรงไว้ซึ่งสิทธิ์
                      ที่จะยึดครอบครองสถานที่ สิ่งที่ให้เช่าได้โดยพลัน
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(11)}.</div>
                    <div className={styles.clauseText}>
                      ในกรณีที่ผู้เช่าไม่ได้ใช้น้ำประปา หรือไฟฟ้า
                      ผู้เช่าต้องเสียค่ารักษามิเตอร์น้ำ และมิเตอร์ไฟฟ้า
                      ขั้นต่ำอย่างละ {num(1)} หน่วย
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(12)}.</div>
                    <div className={styles.clauseText}>
                      ผู้เช่ายินยอมให้ผู้ให้เช่าเข้าไปตรวจสอบความเรียบร้อยภายในห้องได้
                      ตามความเหมาะสม
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(13)}.</div>
                    <div className={styles.clauseText}>
                      ค่าทำความสะอาด {num(300)} บาท ในกรณีที่ย้าย หรือคืนห้อง
                      และค่าเสียหายที่มิได้ระบุไว้ในสัญญาฉบับนี้
                      จะตกเป็นสิทธิ์ของผู้ให้เช่าประเมินค่าเสียหายต่อทรัพย์สินตามที่พิสูจน์ได้
                    </div>
                  </div>
                </div>
                <div className={styles.sheetFooter}>หน้า {num(2)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 3: ลายมือชื่อคู่สัญญาเช่าห้องพัก
               ============================================================ */}
            {printLease && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  <div
                    className={styles.docParagraph}
                    style={{ marginTop: '4mm' }}
                  >
                    คู่สัญญาได้อ่านและเข้าใจข้อความในสัญญานี้โดยตลอดแล้วเห็นว่าถูกต้อง
                    จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
                  </div>

                  <div className={styles.signatureSection}>
                    {/* Tenant 1 Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>
                          ผู้เช่า {num(1)} และเช่าทรัพย์สิน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={t1Parsed.fullName} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Tenant 2 Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>
                          ผู้เช่า {num(2)} และเช่าทรัพย์สิน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={hasSecondTenant ? t2Parsed.fullName : ''} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Lessor / Agent Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}>
                          <span className={styles.signatureLineText}>{num(buildingName)}</span>
                        </span>
                        <span className={styles.signatureRole}>
                          ผู้ให้เช่า / ตัวแทน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={buildingName} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Witness Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>พยาน</span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value="" dots={72} /> )
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.sheetFooter}>หน้า {num(3)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 4: สัญญาเช่าทรัพย์สิน (ข้อ ๑ - ๗)
               ============================================================ */}
            {printAsset && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  {renderContractHeader('สัญญาเช่าทรัพย์สิน')}

                  {/* Opening Paragraph */}
                  <div className={styles.docParagraph}>
                    สัญญานี้ทำขึ้นระหว่าง <BlankFill value={buildingName} dots={74} /> ซึ่งต่อไปในสัญญานี้ จะเรียกว่า “<strong>ผู้ให้เช่า</strong>” ฝ่ายหนึ่ง กับ “<strong>ผู้เช่า</strong>” อีกฝ่ายหนึ่ง ซึ่ง ผู้เช่าในสัญญาฉบับนี้ลงนามผูกพันสัญญา จำนวน <BlankFill value={hasSecondTenant ? num(2) : num(1)} dots={11} /> คน เพื่อที่จะเช่าทรัพย์สิน อันได้แก่ โทรทัศน์, ตู้เย็น, ตู้เสื้อผ้า, เตียงนอน, ฟูก รวมทั้งเครื่องใช้ไฟฟ้า ที่มีอยู่ในห้องพักอาศัย โดยไม่รวมห้องเช่า ซึ่ง ผู้ให้เช่า ได้นำทรัพย์สินมาให้ ผู้เช่า เช่าไว้ <BlankFill value={curr(totalRent)} dots={18} /> บาท
                  </div>

                  <div className={styles.clauseHeader} style={{ textAlign: 'left', marginTop: '25pt' }}>
                    คู่สัญญาตกลงทำสัญญาเช่า โดยมีรายละเอียดดังนี้
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(1)}.</div>
                    <div className={styles.clauseText}>
                      การเช่านี้เป็นการเช่าเฟอร์นิเจอร์
                      และการนำทรัพย์สินเข้ามาให้เช่าต่างหาก
                      ซึ่งจะไม่อยู่ในเงื่อนไขของการเช่าห้องพัก
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(2)}.</div>
                    <div className={styles.clauseText}>
                      การให้เช่ามีระยะเวลาเท่ากับการให้เช่าห้องพัก
                      <div className={styles.subClauseItem}>
                        <div className={styles.subClauseNum}>
                          {num(2)}.{num(1)}.
                        </div>
                        <div className={styles.subClauseText}>
                          อัตราการเช่าห้องพัก{' '}
                          <BlankFill value={curr(roomRentShare)} dots={34} />{' '}
                          บาท
                        </div>
                      </div>
                      <div className={styles.subClauseItem}>
                        <div className={styles.subClauseNum}>
                          {num(2)}.{num(2)}.
                        </div>
                        <div className={styles.subClauseText}>
                          อัตราการเช่าทรัพย์สินภายในห้องพัก{' '}
                          <BlankFill value={curr(assetRentShare)} dots={34} />{' '}
                          บาท
                        </div>
                      </div>
                      <div style={{ paddingLeft: '11mm', marginBottom: '8pt', whiteSpace: 'nowrap' }}>
                        รวมค่าเช่าห้องต่อรายเดือน{' '}
                        <BlankFill value={curr(totalRent)} dots={34} /> บาท
                      </div>
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(3)}.</div>
                    <div className={styles.clauseText}>
                      ห้ามผู้เช่า นำทรัพย์สินที่ผู้ให้เช่ามีไว้ในห้องเช่า ไป จำหน่าย
                      จ่าย โอน ซื้อขาย จำนำ เช่าช่วง
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(4)}.</div>
                    <div className={styles.clauseText}>
                      ในกรณีที่ ผู้เช่าได้เข้าไปในห้องเช่าแล้วเห็นทุกสิ่ง
                      และทดสอบการใช้งาน แล้วใช้การได้อย่างสมบูรณ์
                      ผู้เช่าจะดูแลรักษาให้อยู่ในสภาพสมบูรณ์
                      และพร้อมที่จะส่งมอบคืนทุกประการ
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(5)}.</div>
                    <div className={styles.clauseText}>
                      ผู้เช่าจะต้องดูแลรักษา และใช้ทรัพย์สินที่ให้เช่า เยี่ยงวิญญูชน
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(6)}.</div>
                    <div className={styles.clauseText}>
                      ผู้เช่าตกลงยินยอมให้ ผู้ให้เช่าหรือตัวแทน
                      ตรวจสอบทรัพย์สินได้ทุกเวลา ภายหลังจากที่
                      ผู้เช่าแจ้งความประสงค์ที่จะคืนหรือออกจากห้องเช่าไม่ว่ากรณีใดๆ
                    </div>
                  </div>

                  <div className={styles.clauseItem}>
                    <div className={styles.clauseNum}>{num(7)}.</div>
                    <div className={styles.clauseText}>
                      ในกรณีที่ ทรัพย์สินที่นำมาให้เช่า เกิดความเสียหายหรือชำรุด
                      ผู้เช่าจะต้องเสียค่าใช้จ่ายในการซ่อมแซมนั้น
                      เมื่อผู้ให้เช่าประเมินค่าเสียหายต่อทรัพย์สิน ตามที่พิสูจน์ได้
                    </div>
                  </div>
                </div>
                <div className={styles.sheetFooter}>หน้า {num(4)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 5: ลายมือชื่อสัญญาเช่าทรัพย์สิน
               ============================================================ */}
            {printAsset && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  <div
                    className={styles.docParagraph}
                    style={{ marginTop: '4mm' }}
                  >
                    คู่สัญญาได้อ่านและเข้าใจข้อความในสัญญานี้โดยตลอดแล้วเห็นว่าถูกต้อง
                    จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
                  </div>

                  <div className={styles.signatureSection}>
                    {/* Tenant 1 Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>
                          ผู้เช่า {num(1)} และเช่าทรัพย์สิน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={t1Parsed.fullName} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Tenant 2 Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>
                          ผู้เช่า {num(2)} และเช่าทรัพย์สิน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={hasSecondTenant ? t2Parsed.fullName : ''} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Lessor / Agent Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}>
                          <span className={styles.signatureLineText}>{num(buildingName)}</span>
                        </span>
                        <span className={styles.signatureRole}>
                          ผู้ให้เช่า / ตัวแทน
                        </span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value={buildingName} dots={72} /> )
                        </span>
                      </div>
                    </div>

                    {/* Witness Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.signatureRow}>
                        <span className={styles.signatureLabel}>ลงชื่อ</span>
                        <span className={styles.signatureLine}></span>
                        <span className={styles.signatureRole}>พยาน</span>
                      </div>
                      <div className={styles.signatureNameRow}>
                        <span className={styles.signatureName}>
                          ( <BlankFill value="" dots={72} /> )
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.sheetFooter}>หน้า {num(5)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 6: กฎระเบียบสำหรับผู้พักอาศัยในอพาร์ทเมนท์ (ข้อ ๑ - ๑๘)
               ============================================================ */}
            {printRules && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  <div className={styles.rulesTitle}>
                    กฎระเบียบสำหรับผู้พักอาศัยในอพาร์ทเมนท์
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(1)}.</div>
                    <div className={styles.ruleText}>
                      การชำระค่าเช่าและค่าใช้จ่ายอื่นๆ ให้ชำระภายในวันที่ {num(1)} -{' '}
                      {num(5)} ของเดือนถัดไป หากเกินกำหนด ผู้เช่าจะต้องเสียค่าปรับวันละ{' '}
                      <BlankFill
                        value={lateFeeVal ? num(lateFeeVal) : ''}
                        dots={10}
                      />{' '}
                      บาท
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(2)}.</div>
                    <div className={styles.ruleText}>
                      ผู้เช่าต้องใช้ห้องที่เช่า เพื่อการอยู่อาศัย ซึ่งจะอยู่ได้ไม่เกินห้องละ{' '}
                      {num(2)} คน และต้องทำความสะอาดห้องพัก อย่าปล่อยให้ห้องสกปรกหรือมีกลิ่นเหม็น
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(3)}.</div>
                    <div className={styles.ruleText}>
                      ผู้เช่าต้องยอมให้ผู้ให้เช่าหรือเจ้าหน้าที่ของผู้ให้เช่า เข้าตรวจห้องพักหรือซ่อมแซมห้องพักเป็นครั้งคราว โดยที่ผู้ให้เช่าจะแจ้งให้ผู้เช่าทราบล่วงหน้าก่อน
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(4)}.</div>
                    <div className={styles.ruleText}>
                      การขนย้ายสิ่งของ เข้า-ออก อาคาร สามารถกระทำได้ระหว่าง {num('8:00')} – {num('18:00')} น. หากต้องการที่จะขนย้ายนอกเวลาที่กำหนด ต้องได้รับความยินยอมจากผู้ให้เช่าก่อน
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(5)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามนำบุคคลภายนอกเข้ามาภายในอาคาร หากมีความจำเป็นจะต้องแจ้งให้เจ้าหน้าที่ทราบก่อนทุกครั้ง (ไม่อนุญาตให้บุคคลภายนอกนอนพักค้างคืนภายในอาคาร)
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(6)}.</div>
                    <div className={styles.ruleText}>
                      ผู้เช่าต้องนำขยะมาทิ้งที่ถังขยะส่วนกลาง หรือบริเวณที่ผู้ให้เช่าได้จัดเตรียมไว้ให้
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(7)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามทิ้งขยะ หรือ สิ่งของ ออกนอกหน้าต่าง และอาคาร
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(8)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามทิ้งผ้าอนามัย กระดาษชำระ เศษอาหาร หรือสิ่งของใดๆ ลงในชักโครก หรือท่อน้ำ หากเกิดการอุดตัน จะคิดค่าบริการแก้ไขครั้งละ {num(500)} บาท หรือตามค่าใช้จ่ายที่เกิดขึ้นจริง
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(9)}.</div>
                    <div className={styles.ruleText}>
                      สถานที่จอดรถ ผู้ให้เช่าจัดเตรียมไว้ให้แก่ผู้เช่า เมื่อจอดรถไว้ให้ล็อครถ แล้วปิดประตูใหญ่ ใส่กุญแจไว้ หากมีความเสียหายใดๆ เกิดขึ้นกับรถของผู้เช่า ทางผู้ให้เช่าจะไม่รับผิดชอบใดๆ ทั้งสิ้น
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(10)}.</div>
                    <div className={styles.ruleText}>
                      ทรัพย์สินภายในห้องพักของผู้เช่า ซึ่งเป็นทรัพย์ส่วนบุคคล เพื่อป้องกันการสูญหาย โปรดเก็บรักษาด้วยความระมัดระวัง หากเกิดสูญหาย หรือเกิดความเสียหายใดๆ อันมิใช่ความผิดของผู้ให้เช่า ผู้ให้เช่าจะไม่รับผิดชอบใดๆ ทั้งสิ้น
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(11)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามกระทำการใดๆ หรือส่งเสียงดังรบกวนห้องพักข้างเคียง
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(12)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามขีดเขียน เจาะ ตอกตะปู ติดสติ๊กเกอร์ ติดกาวหรือเทปกาว ย้ายหรือดัดแปลง ปลั๊ก, สวิตช์, ดวงไฟ, สายไฟ, เปลี่ยนลูกบิดประตู หรือต่อเติมส่วนต่างๆ ของห้องพัก หากฝ่าฝืน ต้องจ่ายค่าซ่อมจุดละ {num(300)} - {num('1,000')} บาท หรือตามค่าใช้จ่ายที่เกิดขึ้นจริง
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(13)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามนำสัตว์เลี้ยงทุกชนิดเข้ามาเลี้ยงภายในห้องพักและอาคาร
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(14)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามวางรองเท้า หรือสิ่งของใดๆ บริเวณทางเดิน
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(15)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามนำสิ่งผิดกฎหมาย วัตถุไวไฟ ยาเสพติด อาวุธ หรือสิ่งน่ารังเกียจเข้ามาภายในอาคาร
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(16)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามกดสัญญาณเตือนภัยโดยไม่มีเหตุอันควร ฝ่าฝืนปรับ {num('1,000')} บาท
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(17)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามสูบบุหรี่ภายในอาคาร
                    </div>
                  </div>

                  <div className={styles.ruleItem}>
                    <div className={styles.ruleNum}>{num(18)}.</div>
                    <div className={styles.ruleText}>
                      ห้ามทำอาหารภายในห้องพัก อนุญาตเพียงหม้อหุงข้าว กาต้มน้ำไฟฟ้า ไมโครเวฟ
                    </div>
                  </div>
                </div>
                <div className={styles.sheetFooter}>หน้า {num(6)}</div>
              </div>
            )}

            {/* ============================================================
                PAGE 7: เอกสารแนบท้าย: สำเนาบัตรประจำตัวประชาชน
               ============================================================ */}
            {printIdCard && (
              <div className={styles.a4Sheet}>
                <div className={styles.sheetContent}>
                  <div className={styles.idCardTitle}>
                    เอกสารแนบท้ายสัญญาเช่า
                  </div>
                  <div className={styles.idCardSubTitle}>
                    สำเนาบัตรประจำตัวประชาชน
                  </div>

                  {/* Primary Tenant ID Card */}
                  <div className={styles.idCardSection}>
                    <div className={styles.idCardTenantHeader}>
                      ผู้เช่า {num(1)}:{' '}
                      <BlankFill
                        value={t1Parsed.fullName}
                        dots={30}
                      />
                    </div>
                    <div className={styles.idCardFrame}>
                      {tenant?.idCardImage ? (
                        <img
                          src={tenant.idCardImage}
                          alt={`สำเนาบัตรประชาชน ${t1Parsed.fullName}`}
                          className={styles.idCardImg}
                        />
                      ) : (
                        <div className={styles.idCardPlaceholder}>
                          <span style={{ fontSize: '2rem' }}>🪪</span>
                          <span>(ไม่มีไฟล์รูปภาพบัตรประจำตัวประชาชนในระบบ)</span>
                          <span style={{ fontSize: '12px' }}>
                            กรุณาแนบสำเนาบัตรประจำตัวประชาชนตัวจริง
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.certifyBlock}>
                      <div className={styles.certifySignLine}>
                        (ลงชื่อ) ............................................................................ ผู้เช่า {num(1)}
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        (&nbsp;
                        <BlankFill
                          value={t1Parsed.fullName}
                          dots={28}
                        />
                        &nbsp;)
                      </div>
                      <div className={styles.certifyText}>
                        รับรองสำเนาถูกต้อง
                      </div>
                    </div>
                  </div>

                  {/* Second Tenant ID Card (if co-tenant exists) */}
                  {(hasSecondTenant || tenant?.secondTenantIdCardImage) && (
                    <div className={styles.idCardSection}>
                      <div className={styles.idCardTenantHeader}>
                        ผู้เช่า {num(2)}:{' '}
                        <BlankFill
                          value={t2Parsed.fullName}
                          dots={30}
                        />
                      </div>
                      <div className={styles.idCardFrame}>
                        {tenant?.secondTenantIdCardImage ? (
                          <img
                            src={tenant.secondTenantIdCardImage}
                            alt={`สำเนาบัตรประชาชน ${t2Parsed.fullName}`}
                            className={styles.idCardImg}
                          />
                        ) : (
                          <div className={styles.idCardPlaceholder}>
                            <span style={{ fontSize: '2rem' }}>🪪</span>
                            <span>(ไม่มีไฟล์รูปภาพบัตรประจำตัวประชาชนผู้เช่า {num(2)})</span>
                            <span style={{ fontSize: '12px' }}>
                              กรุณาแนบสำเนาบัตรประจำตัวประชาชนตัวจริง
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.certifyBlock}>
                        <div className={styles.certifySignLine}>
                          (ลงชื่อ) ............................................................................ ผู้เช่า {num(2)}
                        </div>
                        <div style={{ marginBottom: '0.25rem' }}>
                          (&nbsp;
                          <BlankFill
                            value={t2Parsed.fullName}
                            dots={28}
                          />
                          &nbsp;)
                        </div>
                        <div className={styles.certifyText}>
                          รับรองสำเนาถูกต้อง
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.sheetFooter}>หน้า {num(7)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
