import React, { useState, useMemo, useEffect } from 'react';
import styles from './ReportTab.module.css';
import { formatThaiMonthOnly, getShortBuildingName } from '@/lib/thaiDate';
import { getPayInAdvanceBillingPeriod } from '@/lib/billingRules';

interface ReportTabProps {
  buildings: any[];
  invoices: any[];
  styles: any;
}

export default function ReportTab({ buildings, invoices, styles: globalStyles }: ReportTabProps) {
  const [reportPeriod, setReportPeriod] = useState(() => getPayInAdvanceBillingPeriod(new Date()));
  const [monthlyUtilities, setMonthlyUtilities] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'SUMMARY' | 'PNL' | 'YEARLY' | 'OVERDUE'>('SUMMARY');
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear().toString());
  const [reportBuildingId, setReportBuildingId] = useState<string>('ALL');
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  // Overdue tab states
  const [overdueBuildingFilter, setOverdueBuildingFilter] = useState<string>('ALL');
  const [overdueSearchQuery, setOverdueSearchQuery] = useState<string>('');
  const [overdueSortBy, setOverdueSortBy] = useState<'ROOM' | 'AMOUNT_DESC' | 'DAYS_DESC'>('ROOM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyReminder = (room: any) => {
    const bName = getShortBuildingName(room.buildingName);
    const tenantName = room.tenantName || 'ผู้เช่า';
    let text = `📢 แจ้งเตือนยอดค้างชำระ: ${bName} ห้อง ${room.roomNumber} (${tenantName})
`;
    text += `รายการค้างชำระ:
`;
    room.invoices.forEach((inv: any) => {
      const periodStr = formatThaiMonthOnly(inv.billingPeriod) + ' ' + (inv.billingPeriod.split('-')[0] ? parseInt(inv.billingPeriod.split('-')[0]) + 543 : '');
      text += `• รอบบิล ${periodStr}: ${formatAmount(inv.totalAmount)} บาท
`;
    });
    text += `รวมยอดค้างชำระทั้งสิ้น: ${formatAmount(room.totalAmount)} บาท
`;
    text += `กรุณาชำระเงินและแจ้งสลิป ขอบคุณครับ 🙏`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setToastMessage(`คัดลอกข้อความทวงหนี้ ห้อง ${room.roomNumber} เรียบร้อยแล้ว!`);
        setTimeout(() => setToastMessage(null), 3000);
      }).catch(() => {
        setToastMessage(`คัดลอกข้อความไม่สำเร็จ`);
        setTimeout(() => setToastMessage(null), 3000);
      });
    }
  };

  useEffect(() => {
    const fetchMonthlyUtilities = async () => {
      try {
        const res = await fetch(`/api/buildings/monthly-utility?period=${reportPeriod}`);
        if (res.ok) {
          const data = await res.json() as any[];
          setMonthlyUtilities(data);
        }
      } catch (error) {
        console.error('Error fetching monthly utilities:', error);
      }
    };
    fetchMonthlyUtilities();
  }, [reportPeriod]);

  useEffect(() => {
    if (activeSubTab !== 'YEARLY') return;
    const fetchYearly = async () => {
      try {
        const res = await fetch(`/api/reports/yearly?year=${reportYear}&buildingId=${reportBuildingId}`);
        if (res.ok) {
          const data = await res.json() as any[];
          setYearlyData(data);
        }
      } catch (error) {
        console.error('Error fetching yearly reports:', error);
      }
    };
    fetchYearly();
  }, [reportYear, reportBuildingId, activeSubTab]);

  // Filter invoices based on the selected period
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => inv.billingPeriod === reportPeriod);
  }, [invoices, reportPeriod]);

  const formatAmount = (val: number | undefined | null, keepDecimals: boolean = false) => {
    const num = val || 0;
    if (keepDecimals && num % 1 !== 0) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.round(num).toLocaleString('en-US');
  };

  const handlePrint = () => {
    window.print();
  };

  const [currentDateStr, setCurrentDateStr] = useState("");
  useEffect(() => {
    setCurrentDateStr(new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const [expandedMobileYearly, setExpandedMobileYearly] = useState<Record<string, boolean>>({});
  const toggleMobileYearlyAccordion = (period: string, buildingId: string) => {
    const key = `${period}-${buildingId}`;
    setExpandedMobileYearly(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Group data by building
  const reportData = useMemo(() => {
    const data: any[] = [];
    let grandTotal = 0;
    let grandRentCost = 0;
    let grandWaterCost = 0;
    let grandElectricityCost = 0;
    let grandOtherCost = 0;

    buildings.forEach(building => {
      // Calculate occupancy
      let totalRooms = 0;
      let occupiedRooms = 0;

      const buildingInvoices: any[] = [];
      let buildingTotal = 0;
      let buildingRentCost = 0;
      let buildingWaterCost = 0;
      let buildingElectricityCost = 0;
      let buildingOtherCost = 0;

      building.floors.forEach((floor: any) => {
        floor.rooms.forEach((room: any) => {
          totalRooms++;
          if (room.status === 'OCCUPIED') occupiedRooms++;

          // Find invoice for this room
          const invoice = filteredInvoices.find(inv => inv.roomId === room.id);
          if (invoice) {
            const actualRentCost = invoice.rentCost || room.basePrice || 0;
            buildingInvoices.push({
              roomNumber: room.number,
              tenantName: invoice.tenant?.name || '-',
              rentCost: actualRentCost,
              waterCost: invoice.waterCost || 0,
              electricityCost: invoice.electricityCost || 0,
              otherCost: invoice.otherCost || 0,
              totalAmount: invoice.totalAmount || 0,
              previousWater: invoice.previousWater || 0,
              currentWater: invoice.currentWater || 0,
              previousElec: invoice.previousElec || 0,
              currentElec: invoice.currentElec || 0,
              isEmpty: false,
            });
            buildingTotal += invoice.totalAmount || 0;
            buildingRentCost += actualRentCost;
            buildingWaterCost += invoice.waterCost || 0;
            buildingElectricityCost += invoice.electricityCost || 0;
            buildingOtherCost += invoice.otherCost || 0;
          } else {
            buildingInvoices.push({
              roomNumber: room.number,
              isEmpty: true,
            });
          }
        });
      });

      // Sort invoices by room number naturally
      buildingInvoices.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' }));

      if (buildingInvoices.length > 0) {
        data.push({
          id: building.id,
          name: building.name,
          totalRooms,
          occupiedRooms,
          invoices: buildingInvoices,
          buildingTotal,
          buildingRentCost,
          buildingWaterCost,
          buildingElectricityCost,
          buildingOtherCost,
        });
        grandTotal += buildingTotal;
        grandRentCost += buildingRentCost;
        grandWaterCost += buildingWaterCost;
        grandElectricityCost += buildingElectricityCost;
        grandOtherCost += buildingOtherCost;
      }
    });

    return { 
      buildingData: data, 
      grandTotal,
      grandRentCost,
      grandWaterCost,
      grandElectricityCost,
      grandOtherCost
    };
  }, [buildings, filteredInvoices]);

  const pnlData = useMemo(() => {
    let grandRevenueWater = 0;
    let grandCostWater = 0;
    let grandProfitWater = 0;
    
    let grandRevenueElec = 0;
    let grandCostElec = 0;
    let grandProfitElec = 0;

    let grandTotalRevenue = 0;
    let grandTotalCost = 0;
    let grandTotalProfit = 0;
    let grandOccupiedRooms = 0;

    let grandGovWaterUnits = 0;
    let grandTenantWaterUnits = 0;
    let grandCommonWaterUnits = 0;
    let grandGovElecUnits = 0;
    let grandTenantElecUnits = 0;
    let grandCommonElecUnits = 0;

    const buildingPnl = reportData.buildingData.map(bData => {
      const utility = monthlyUtilities.find(u => u.buildingId === bData.id);
      const costWater = utility?.waterBillTotal || 0;
      const costElec = utility?.elecBillTotal || 0;
      
      const revWater = bData.buildingWaterCost || 0;
      const revElec = bData.buildingElectricityCost || 0;

      const profitWater = revWater - costWater;
      const profitElec = revElec - costElec;

      const totalRev = revWater + revElec;
      const totalCost = costWater + costElec;
      const totalProfit = profitWater + profitElec;

      let tenantWaterUnits = 0;
      let tenantElecUnits = 0;

      bData.invoices.forEach((inv: any) => {
        if (!inv.isEmpty) {
          const wDiff = (inv.currentWater || 0) - (inv.previousWater || 0);
          if (wDiff > 0) tenantWaterUnits += wDiff;
          const eDiff = (inv.currentElec || 0) - (inv.previousElec || 0);
          if (eDiff > 0) tenantElecUnits += eDiff;
        }
      });

      const govWaterUnits = utility?.waterUnitsTotal || 0;
      const govElecUnits = utility?.elecUnitsTotal || 0;

      const commonWaterUnits = govWaterUnits - tenantWaterUnits;
      const commonElecUnits = govElecUnits - tenantElecUnits;

      grandRevenueWater += revWater;
      grandCostWater += costWater;
      grandProfitWater += profitWater;

      grandRevenueElec += revElec;
      grandCostElec += costElec;
      grandProfitElec += profitElec;

      grandTotalRevenue += totalRev;
      grandTotalCost += totalCost;
      grandTotalProfit += totalProfit;
      grandOccupiedRooms += bData.occupiedRooms || 0;

      grandGovWaterUnits += govWaterUnits;
      grandTenantWaterUnits += tenantWaterUnits;
      grandCommonWaterUnits += commonWaterUnits;
      grandGovElecUnits += govElecUnits;
      grandTenantElecUnits += tenantElecUnits;
      grandCommonElecUnits += commonElecUnits;

      return {
        id: bData.id,
        name: getShortBuildingName(bData.name),
        occupiedRooms: bData.occupiedRooms,
        revWater,
        costWater,
        profitWater,
        revElec,
        costElec,
        profitElec,
        totalRev,
        totalCost,
        totalProfit,
        govWaterUnits,
        tenantWaterUnits,
        commonWaterUnits,
        govElecUnits,
        tenantElecUnits,
        commonElecUnits
      };
    });

    return {
      buildingPnl,
      grandOccupiedRooms,
      grandRevenueWater,
      grandCostWater,
      grandProfitWater,
      grandRevenueElec,
      grandCostElec,
      grandProfitElec,
      grandTotalRevenue,
      grandTotalCost,
      grandTotalProfit,
      grandGovWaterUnits,
      grandTenantWaterUnits,
      grandCommonWaterUnits,
      grandGovElecUnits,
      grandTenantElecUnits,
      grandCommonElecUnits
    };
  }, [reportData.buildingData, monthlyUtilities]);

  // Group and calculate overdue data
  const overdueData = useMemo(() => {
    const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID');
    
    // Group by room
    const roomMap = new Map<string, any>();
    
    unpaidInvoices.forEach(inv => {
      const bId = inv.room?.floor?.buildingId || inv.room?.floor?.building?.id || '';
      const bName = inv.room?.floor?.building?.name || '';
      const rId = inv.roomId || inv.room?.id;
      const rNum = inv.room?.number || '';
      const tName = inv.tenant?.name || inv.tenantName || '-';
      const tPhone = inv.tenant?.phone || '';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date();
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const isPastDue = diffTime > 0;

      if (!roomMap.has(rId)) {
        roomMap.set(rId, {
          roomId: rId,
          roomNumber: rNum,
          buildingId: bId,
          buildingName: bName,
          tenantName: tName,
          tenantPhone: tPhone,
          invoices: [],
          totalAmount: 0,
          maxDaysOverdue: 0,
        });
      }

      const roomObj = roomMap.get(rId);
      roomObj.invoices.push({
        ...inv,
        daysOverdue,
        isPastDue
      });
      roomObj.totalAmount += inv.totalAmount || 0;
      if (daysOverdue > roomObj.maxDaysOverdue) {
        roomObj.maxDaysOverdue = daysOverdue;
      }
    });

    // Sort invoices inside each room by billingPeriod asc (oldest first)
    roomMap.forEach(r => {
      r.invoices.sort((a: any, b: any) => a.billingPeriod.localeCompare(b.billingPeriod));
    });

    let allRooms = Array.from(roomMap.values());

    // Filter by Building
    if (overdueBuildingFilter !== 'ALL') {
      allRooms = allRooms.filter(r => r.buildingId === overdueBuildingFilter);
    }

    // Filter by Search Query
    if (overdueSearchQuery.trim()) {
      const q = overdueSearchQuery.trim().toLowerCase();
      allRooms = allRooms.filter(r => 
        r.roomNumber.toLowerCase().includes(q) || 
        r.tenantName.toLowerCase().includes(q) ||
        r.tenantPhone.includes(q)
      );
    }

    // KPI Calculations
    let totalOverdueAmount = 0;
    let totalOverdueInvoices = 0;
    let overdue30DaysRooms = 0;
    let overdue30DaysAmount = 0;
    let overdue60DaysRooms = 0;
    let overdue60DaysAmount = 0;

    allRooms.forEach(r => {
      totalOverdueAmount += r.totalAmount;
      totalOverdueInvoices += r.invoices.length;
      if (r.maxDaysOverdue >= 60) {
        overdue60DaysRooms++;
        overdue60DaysAmount += r.totalAmount;
      } else if (r.maxDaysOverdue >= 30) {
        overdue30DaysRooms++;
        overdue30DaysAmount += r.totalAmount;
      }
    });

    // Sorting
    allRooms.sort((a, b) => {
      if (overdueSortBy === 'AMOUNT_DESC') {
        return b.totalAmount - a.totalAmount;
      }
      if (overdueSortBy === 'DAYS_DESC') {
        return b.maxDaysOverdue - a.maxDaysOverdue;
      }
      // Default: Building then Room
      const bComp = (a.buildingName || '').localeCompare(b.buildingName || '', 'th');
      if (bComp !== 0) return bComp;
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Group rooms by building for display
    const buildingGroups: { buildingId: string; buildingName: string; rooms: any[]; totalAmount: number }[] = [];
    
    allRooms.forEach(room => {
      let group = buildingGroups.find(g => g.buildingId === room.buildingId);
      if (!group) {
        group = {
          buildingId: room.buildingId,
          buildingName: room.buildingName,
          rooms: [],
          totalAmount: 0
        };
        buildingGroups.push(group);
      }
      group.rooms.push(room);
      group.totalAmount += room.totalAmount;
    });

    return {
      allRooms,
      buildingGroups,
      totalOverdueAmount,
      totalOverdueRooms: allRooms.length,
      totalOverdueInvoices,
      overdue30DaysRooms,
      overdue30DaysAmount,
      overdue60DaysRooms,
      overdue60DaysAmount
    };
  }, [invoices, overdueBuildingFilter, overdueSearchQuery, overdueSortBy]);

  return (
    <div className={styles.reportContainer}>
      
      {/* Mobile Report Selector */}
      <div className={styles.mobileReportSelector}>
        <label className={styles.mobileReportLabel}>📂 เลือกรายงาน:</label>
        <div className={styles.selectWrapper}>
          <select 
            value={activeSubTab} 
            onChange={(e) => setActiveSubTab(e.target.value as any)}
            className={styles.reportSelect}
          >
            <option value="SUMMARY">รายงานสรุปประจำเดือน</option>
            <option value="PNL">รายงานกำไร-ขาดทุน ค่าน้ำ-ไฟ</option>
            <option value="YEARLY">รายงานสรุปการเงินรายปี</option>
            <option value="OVERDUE">รายงานยอดค้างชำระ</option>
          </select>
        </div>
      </div>
<div className={styles.tabGroup}>
        <button 
          className={`${styles.tabBtn} ${activeSubTab === 'SUMMARY' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('SUMMARY')}
        >
          รายงานสรุปประจำเดือน
        </button>
        <button 
          className={`${styles.tabBtn} ${activeSubTab === 'PNL' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PNL')}
        >
          รายงานกำไร-ขาดทุน ค่าน้ำ-ไฟ
        </button>
        <button 
          className={`${styles.tabBtn} ${activeSubTab === 'YEARLY' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('YEARLY')}
        >
          รายงานสรุปการเงินรายปี
        </button>
        <button 
          className={`${styles.tabBtn} ${activeSubTab === 'OVERDUE' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('OVERDUE')}
        >
          รายงานยอดค้างชำระ
        </button>
      </div>
      {/* Global print rules for all sub-tabs: Hide sidebar, headers, and reset layout containers */}
      <style type="text/css" media="print">
        {`
          html, body { height: auto !important; min-height: 0 !important; background: white !important; }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide Layout UI completely, regardless of tag (aside, nav, div) */
          [class*="sidebar"] { display: none !important; }
          [class*="mobileNav"] { display: none !important; }
          main > [class*="header"] { display: none !important; }

            /* Fix Dark Mode Print Issues */
            [class*="reportContainer"], [class*="a4Page"], table { 
              background: white !important; 
              color: black !important; 
              box-shadow: none !important; 
            }
            [class*="controls"], [class*="tabGroup"], [class*="mobileReportSelector"] { 
              display: none !important; 
            }
            [class*="printBtn"] { 
              display: none !important; 
            }

          
          /* Reset Layout containers */
          main, [class*="mainContent"], [class*="wrapper"], [class*="a4PageWrapper"], [class*="a4Page"] { 
            min-height: 0 !important; 
            height: auto !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            display: block !important;
            overflow: visible !important;
            width: 100% !important;
          }
        `}
      </style>

      {activeSubTab === 'SUMMARY' && (
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 5mm; }
          `}
        </style>
      )}

      {activeSubTab === 'PNL' && (
        <style type="text/css" media="print">
          {`
            @page { size: A4 landscape; margin: 10mm; }
          `}
        </style>
      )}

      {activeSubTab === 'YEARLY' && (
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 3mm; }

            .${styles.summaryTable} {
              width: 100% !important;
            }
            
            .${styles.printHeaderContent} {
              color: black !important;
              font-size: 16px !important;
              padding-bottom: 2px !important;
              margin-bottom: 2px !important;
            }

            .${styles.printFooterContent} {
              color: black !important;
              font-size: 11px !important;
              margin-top: 3px !important;
              padding-top: 0 !important;
            }
            
            .${styles.summarySection} {
              margin-top: 0 !important;
            }
          `}
        </style>
      )}

      {activeSubTab === 'OVERDUE' && (
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 5mm; }
            
            .${styles.kpiGrid}, .${styles.callBtn}, .${styles.copyBtn} {
              display: none !important;
            }

            .printOnlyPhone {
              display: inline !important;
            }

            .${styles.summaryTable} th, .${styles.summaryTable} td {
              font-size: 11px !important;
              padding: 3px 4px !important;
              line-height: 1.2 !important;
            }
          `}
        </style>
      )}

      {/* KPI Cards for Overdue Report (Hidden during print) */}
      {activeSubTab === 'OVERDUE' && (
        
        <div className={styles.overdueMasterCard}>
            <div className={styles.overdueMasterHeader}>
                📊 สรุปภาพรวมหนี้ค้าง
            </div>
            <div className={styles.overdueMasterGrid}>
                <div className={styles.overdueMasterItem}>
                    <div className={styles.overdueMasterLabel}>ยอดค้างชำระรวม</div>
                    <div className={`${styles.overdueMasterValue} ${styles.valTotal}`}>{formatAmount(overdueData.totalOverdueAmount)} ฿</div>
                    <div className={styles.overdueMasterSub}>{overdueData.totalOverdueInvoices} ใบแจ้งหนี้</div>
                </div>
                <div className={styles.overdueMasterItem} style={{ paddingLeft: "0.75rem" }}>
                    <div className={styles.overdueMasterLabel}>ห้องที่ค้างชำระ</div>
                    <div className={`${styles.overdueMasterValue} ${styles.valRooms}`}>{overdueData.totalOverdueRooms} ห้อง</div>
                    <div className={styles.overdueMasterSub}>จากทุกอาคาร</div>
                </div>
                <div className={styles.overdueMasterItem} style={{ paddingTop: "1rem" }}>
                    <div className={styles.overdueMasterLabel}>ค้างเกิน 30 วัน</div>
                    <div className={`${styles.overdueMasterValue} ${styles.valWarn}`}>{overdueData.overdue30DaysRooms} ห้อง</div>
                    <div className={`${styles.overdueMasterSub} ${styles.valWarn}`}>รวม {formatAmount(overdueData.overdue30DaysAmount)} ฿</div>
                </div>
                <div className={styles.overdueMasterItem} style={{ paddingLeft: "0.75rem", paddingTop: "1rem" }}>
                    <div className={styles.overdueMasterLabel}><span className={styles.pulseDot}></span>เสี่ยง 60+ วัน</div>
                    <div className={`${styles.overdueMasterValue} ${styles.valDanger}`}>{overdueData.overdue60DaysRooms} ห้อง</div>
                    <div className={`${styles.overdueMasterSub} ${styles.valDanger}`}>ยอด {formatAmount(overdueData.overdue60DaysAmount)} ฿</div>
                </div>
            </div>
        </div>
      )}

      {/* Controls Section (Hidden during print) */}
      <div className={styles.controls}>
        {activeSubTab === 'OVERDUE' ? (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>🏢 เลือกอาคาร</label>
              <select
                className={styles.formInput}
                value={overdueBuildingFilter}
                onChange={(e) => setOverdueBuildingFilter(e.target.value)}
              >
                <option value="ALL">รวมทุกอาคาร</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>🔍 ค้นหาห้อง / ผู้เช่า</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="พิมพ์เลขห้อง หรือ ชื่อผู้เช่า..."
                value={overdueSearchQuery}
                onChange={(e) => setOverdueSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>🔄 เรียงลำดับ</label>
              <select
                className={styles.formInput}
                value={overdueSortBy}
                onChange={(e) => setOverdueSortBy(e.target.value as any)}
              >
                <option value="ROOM">เรียงตามเลขห้อง</option>
                <option value="AMOUNT_DESC">เรียงตามยอดค้างมากสุด 🔻</option>
                <option value="DAYS_DESC">เรียงตามค้างนานสุด (เสี่ยงสูง) ⚠️</option>
              </select>
            </div>
          </>
        ) : activeSubTab === 'YEARLY' ? (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>📅 เลือกปี</label>
              <select
                className={styles.formInput}
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year + 543}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>🏢 เลือกอพาร์ทเมนท์</label>
              <select
                className={styles.formInput}
                value={reportBuildingId}
                onChange={(e) => setReportBuildingId(e.target.value)}
              >
                <option value="ALL">รวมทุกอพาร์ทเมนท์</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>📅 เลือกรอบบิลรายงาน</label>
            <input
              type="month"
              className={styles.formInput}
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              max={getPayInAdvanceBillingPeriod(new Date())}
            />
          </div>
        )}
        <button className={styles.printBtn} onClick={handlePrint}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          พิมพ์รายงาน
        </button>
      </div>


      {/* Mobile Card List for OVERDUE (Hidden on desktop & print via CSS) */}
      {activeSubTab === 'OVERDUE' && (
        <div className={styles.mobileOverdueList}>
          {overdueData.buildingGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              🎉 ยอดเยี่ยมมาก! ไม่มียอดค้างชำระในระบบ (หรือตามตัวกรองที่เลือก)
            </div>
          ) : (
          overdueData.allRooms.map((room) => {
              const maxDays = Math.max(...room.invoices.map((i: any) => i.daysOverdue || 0));
              const isDanger = maxDays >= 60;
              const isWarning = maxDays >= 30 && !isDanger;
              const badgeClass = isDanger ? styles.overdueRiskDanger : isWarning ? styles.overdueRiskWarning : "";
              
              return (
              <div key={room.roomId} className={styles.overdueClayCard}>
                {(isDanger || isWarning) && (
                  <div className={`${styles.overdueRiskBadge} ${badgeClass}`}>
                    {isDanger ? "⚠️ ค้างเกิน 60 วัน" : "ค้างเกิน 30 วัน"}
                  </div>
                )}
                
                <h4 className={styles.overdueRoomTitle}>ห้อง {room.roomNumber}</h4>
                <div className={styles.overdueBuildingName}>
                  🏢 {getShortBuildingName(room.buildingName)}
                </div>

                <div className={styles.overdueInfoGrid}>
                  <div className={styles.overdueInfoRow}>
                    <span className={styles.overdueInfoLabel}>ผู้เช่า</span>
                    <span className={styles.overdueInfoVal}>{room.tenantName}</span>
                  </div>
                  <div className={styles.overdueInfoRow}>
                    <span className={styles.overdueInfoLabel}>เบอร์โทร</span>
                    {room.tenantPhone ? (
                      <a href={`tel:${room.tenantPhone}`} className={styles.overdueCallBtn}>📞 โทรออก</a>
                    ) : (
                      <span className={styles.overdueInfoVal} style={{ opacity: 0.5 }}>— ไม่มี —</span>
                    )}
                  </div>
                  <div className={styles.overdueInfoRow}>
                    <span className={styles.overdueInfoLabel}>ทวงถาม</span>
                    {room.tenantPhone ? (
                      <button type="button" className={styles.overdueLineBtn} onClick={() => handleCopyReminder(room)}>📋 คัดลอกส่ง LINE</button>
                    ) : (
                      <span className={styles.overdueInfoVal} style={{ opacity: 0.5 }}>— ไม่สามารถติดต่อได้ —</span>
                    )}
                  </div>
                </div>

                <div className={styles.overdueInvoiceList}>
                  {room.invoices.map((inv: any) => {
                    const periodStr = formatThaiMonthOnly(inv.billingPeriod) + " " + (inv.billingPeriod.split("-")[0] ? parseInt(inv.billingPeriod.split("-")[0]) + 543 : "");
                    const formattedDueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-";
                    
                    return (
                      <div key={inv.id} className={styles.overdueInvoiceItem}>
                        <div>
                          <div className={styles.overdueInvMonth}>รอบ {periodStr}</div>
                          <div className={styles.overdueInvDue}>ครบกำหนด {formattedDueDate}</div>
                        </div>
                        <div className={styles.overdueInvAmount}>{formatAmount(inv.totalAmount)} ฿</div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.overdueGrandContainer}>
                  <div className={styles.overdueGrandRow}>
                    <span className={styles.overdueInfoLabel}>ยอดค้างรวม</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f43f5e" }}>
                      {formatAmount(room.totalAmount)} ฿
                    </span>
                  </div>
                  <button 
                    type="button"
                    className={styles.payBtn}
                    onClick={() => alert("ฟังก์ชันรับชำระเงินกำลังอยู่ในช่วงพัฒนา...")}
                  >
                    💳 รับชำระเงิน (เคลียร์ยอด)
                  </button>
                </div>
              </div>
              );
            })
          )}
          {overdueData.buildingGroups.length > 0 && (
            <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '6rem' }}>
              <div className={styles.mobileOverdueRow} style={{ marginBottom: 0 }}>
                <span className={styles.mobileOverdueLabel} style={{ fontWeight: 600 }}>
                  ยอดรวมทั้งสิ้น ({overdueData.totalOverdueRooms} ห้อง):
                </span>
                <span className={styles.mobileOverdueValue} style={{ color: 'var(--status-danger)', fontSize: '1.2rem' }}>
                  {formatAmount(overdueData.totalOverdueAmount)} ฿
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A4 Printable Page */}
      <div className={`${styles.a4PageWrapper} ${activeSubTab === 'OVERDUE' ? styles.hideOnMobile : ''}`}>
        <div className={`${styles.a4Page} ${(activeSubTab === 'SUMMARY' || activeSubTab === 'PNL' || activeSubTab === 'YEARLY') ? styles.mobileSummaryPage : ''}`}>
          {activeSubTab === 'OVERDUE' ? (
            <>
              {/* Desktop & Print Table */}
              <div className={styles.desktopOverdueTable}>
                <table className={styles.printWrapperTable}>
                  <thead>
                    <tr>
                      <td>
                        <div className={styles.printHeaderContent} style={{ color: 'var(--status-danger-text)' }}>
                          📋 รายงานยอดค้างชำระ (Outstanding Balance Report)
                        </div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className={styles.summarySection} style={{ marginTop: '10px' }}>
                          <table className={styles.summaryTable}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                                <th style={{ width: '14%', padding: '10px 8px' }}>อาคาร</th>
                                <th style={{ width: '9%', padding: '10px 8px' }}>ห้อง</th>
                                <th style={{ width: '27%', padding: '10px 8px' }}>ผู้เช่า / ติดต่อ</th>
                                <th style={{ width: '18%', padding: '10px 8px' }}>รอบบิลที่ค้าง</th>
                                <th style={{ width: '16%', padding: '10px 8px' }}>ครบกำหนด / สถานะ</th>
                                <th style={{ width: '16%', padding: '10px 8px' }}>ยอดค้าง (บาท)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {overdueData.buildingGroups.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#16a34a', fontWeight: 'bold', fontSize: '15px' }}>
                                    🎉 ยอดเยี่ยมมาก! ไม่มียอดค้างชำระในระบบ (หรือตามตัวกรองที่เลือก)
                                  </td>
                                </tr>
                              ) : (
                                overdueData.buildingGroups.map(group => (
                                  <React.Fragment key={group.buildingId}>
                                    <tr className={styles.buildingHeaderRow}>
                                      <td colSpan={6}>
                                        🏢 {getShortBuildingName(group.buildingName)} 
                                        <span style={{ fontWeight: 'normal', fontSize: '0.85em', marginLeft: '8px', color: "rgba(255, 255, 255, 0.75)" }}>
                                          (ค้างชำระ {group.rooms.length} ห้อง — รวม {formatAmount(group.totalAmount)} บาท)
                                        </span>
                                      </td>
                                    </tr>
                                    {group.rooms.map(room => (
                                      <React.Fragment key={room.roomId}>
                                        {room.invoices.map((inv: any, invIdx: number) => {
                                          const isFirst = invIdx === 0;
                                          const periodStr = formatThaiMonthOnly(inv.billingPeriod) + ' ' + (inv.billingPeriod.split('-')[0] ? parseInt(inv.billingPeriod.split('-')[0]) + 543 : '');
                                          const formattedDueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
                                          
                                          let badgeClass = styles.badgeNormal;
                                          let dotClass = styles.dotNormal;
                                          let statusText = 'รอชำระ';
                                          let rowRiskClass = styles.rowRisk0;
                                          if (inv.isPastDue) {
                                            if (inv.daysOverdue >= 60) {
                                              badgeClass = styles.badgeDanger;
                                              dotClass = styles.dotDanger;
                                              rowRiskClass = styles.rowRisk60;
                                              statusText = `ค้าง ${inv.daysOverdue} วัน`;
                                            } else {
                                              badgeClass = styles.badgeWarning;
                                              dotClass = styles.dotWarning;
                                              rowRiskClass = styles.rowRisk30;
                                              statusText = `ค้าง ${inv.daysOverdue} วัน`;
                                            }
                                          }

                                          return (
                                            <tr key={inv.id} className={rowRiskClass}>
                                              {isFirst && (
                                                <td rowSpan={room.invoices.length} className={styles.colCenter} style={{ verticalAlign: 'top', paddingTop: '8px' }}>
                                                  {getShortBuildingName(room.buildingName)}
                                                </td>
                                              )}
                                              {isFirst && (
                                                <td rowSpan={room.invoices.length} className={styles.colCenter} style={{ verticalAlign: 'top', paddingTop: '8px', fontWeight: 'bold', color: '#be123c', fontSize: '1.05em' }}>
                                                  {room.roomNumber}
                                                </td>
                                              )}
                                              {isFirst && (
                                                <td rowSpan={room.invoices.length} className={styles.colLeft} style={{ verticalAlign: 'top', paddingTop: '8px' }}>
                                                  <div style={{ fontWeight: 600, color: '#111827' }}>{room.tenantName}</div>
                                                  {room.tenantPhone ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                                      <a href={`tel:${room.tenantPhone}`} className={styles.callBtn} title="แตะเพื่อโทรออก">
                                                        📞 {room.tenantPhone}
                                                      </a>
                                                      <span className="printOnlyPhone" style={{ display: 'none', fontSize: '11px', color: '#333' }}>
                                                        ({room.tenantPhone})
                                                      </span>
                                                      <button 
                                                        type="button"
                                                        className={styles.copyBtn}
                                                        onClick={() => handleCopyReminder(room)}
                                                        title="คัดลอกข้อความสรุปยอดส่ง LINE"
                                                      >
                                                        📋 แจ้ง LINE
                                                      </button>
                                                        <button 
                                                          type="button"
                                                          className={`${styles.payBtnDesktop} noPrint`}
                                                          onClick={() => alert("ฟังก์ชันรับชำระเงินกำลังอยู่ในช่วงพัฒนา...")}
                                                          title="บันทึกรับชำระเงิน"
                                                        >
                                                          💳 รับชำระ
                                                        </button>
                                                    </div>
                                                  ) : (
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>— ไม่มีเบอร์โทร —</div>
                                                  )}
                                                </td>
                                              )}
                                              <td className={styles.colCenter}>{periodStr}</td>
                                              <td className={styles.colCenter}>
                                                <div>{formattedDueDate}</div>
                                                <div style={{ marginTop: '3px' }}>
                                                  <span className={badgeClass}>
                                                    <span className={`${styles.badgeDot} ${dotClass}`}></span>
                                                    {statusText}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className={styles.colRight} style={{ fontWeight: 600, color: '#111827' }}>
                                                {formatAmount(inv.totalAmount)}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                        {room.invoices.length > 1 && (
                                          <tr className={styles.roomSubtotalRow}>
                                            <td colSpan={5} style={{ textAlign: 'right', paddingRight: '15px', color: '#475569' }}>
                                              รวมห้อง {room.roomNumber} (ค้าง {room.invoices.length} เดือน)
                                            </td>
                                            <td className={styles.colRight} style={{ color: '#be123c', fontWeight: 'bold' }}>
                                              {formatAmount(room.totalAmount)}
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </React.Fragment>
                                ))
                              )}
                              {overdueData.buildingGroups.length > 0 && (
                                <tr className={styles.summaryTotalRow}>
                                  <td colSpan={5} style={{ textAlign: 'right', paddingRight: '15px', fontSize: '1.05em' }}>
                                    ยอดรวมค้างชำระทั้งสิ้น ({overdueData.totalOverdueRooms} ห้อง / {overdueData.totalOverdueInvoices} บิล)
                                  </td>
                                  <td className={styles.colRight} style={{ color: '#be123c', fontSize: '1.15em', fontWeight: '800' }}>
                                    {formatAmount(overdueData.totalOverdueAmount)}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <div className={styles.printFooterContent}>
                          พิมพ์เอกสาร ณ วันที่ : {currentDateStr}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : activeSubTab === 'YEARLY' ? (
            
<>
  <div className={styles.desktopYearlyTable}>
    <div className={styles.yearlyPrintHeader}>
      <span>รายงานสรุปการเงินรายปี ประจำปี {parseInt(reportYear) + 543}</span>
    </div>
    <div className={styles.yearlySummarySection}>
      <table className={styles.summaryTable}>
        <thead>
          <tr style={{ backgroundColor: '#5b9bd5', color: 'white' }}>
            <th style={{ width: '14%' }}>เดือน / อพาร์ทเมนท์</th>
            <th style={{ width: '8%' }}>ห้องที่เช่า<br/>(ห้อง)</th>
            <th style={{ width: '9%' }}>ค่าน้ำ<br/>(บาท)</th>
            <th style={{ width: '9%' }}>ค่าไฟ<br/>(บาท)</th>
            <th style={{ width: '9%' }}>ค่าอื่นๆ<br/>(บาท)</th>
            <th style={{ width: '9%' }}>ค่าห้อง<br/>(บาท)</th>
            <th style={{ width: '11%' }}>รวมค่าเช่า<br/>(บาท)</th>
            <th style={{ width: '9%' }}>บิลน้ำหลวง<br/>(บาท)</th>
            <th style={{ width: '9%' }}>บิลไฟหลวง<br/>(บาท)</th>
            <th style={{ width: '13%' }}>รวมสุทธิ<br/>(บาท)</th>
          </tr>
        </thead>
        <tbody>
          {yearlyData.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูลในปีนี้</td>
            </tr>
          ) : (
            yearlyData.map((data) => (
              <React.Fragment key={data.period}>
                <tr className={styles.yearlyMonthRow} style={{ backgroundColor: '#444', color: 'white', fontWeight: 'bold' }}>
                  <td colSpan={10} className={styles.colLeft}>{formatThaiMonthOnly(data.period)}</td>
                </tr>
                {data.buildings.map((b: any, idx: number) => (
                  <tr key={b.buildingId}>
                    <td className={styles.colLeft} style={{ paddingLeft: '20px' }}>{idx + 1}. {getShortBuildingName(b.buildingName)}</td>
                    <td className={styles.colCenter}>{b.occupiedRooms}</td>
                    <td className={styles.colRight}>{formatAmount(b.waterCost)}</td>
                    <td className={styles.colRight}>{formatAmount(b.electricityCost)}</td>
                    <td className={styles.colRight}>{formatAmount(b.otherCost)}</td>
                    <td className={styles.colRight}>{formatAmount(b.rentCost)}</td>
                    <td className={styles.colRight}>{formatAmount(b.totalAmount)}</td>
                    <td className={styles.colRight}>{formatAmount(b.govWaterBill, true)}</td>
                    <td className={styles.colRight}>{formatAmount(b.govElecBill, true)}</td>
                    <td className={styles.colRight} style={{ color: b.netTotal < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>{formatAmount(b.netTotal, true)}</td>
                  </tr>
                ))}
                {data.buildings.length > 1 && (
                  <tr className={styles.yearlyMonthTotalRow} style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>
                    <td className={styles.colLeft}>{formatThaiMonthOnly(data.period)} Total</td>
                    <td className={styles.colCenter}>{data.total.occupiedRooms}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.waterCost)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.electricityCost)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.otherCost)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.rentCost)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.totalAmount)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.govWaterBill, true)}</td>
                    <td className={styles.colRight}>{formatAmount(data.total.govElecBill, true)}</td>
                    <td className={styles.colRight} style={{ color: data.total.netTotal < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>{formatAmount(data.total.netTotal, true)}</td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
          {yearlyData.length > 0 && (
            <tr className={styles.summaryTotalRow} style={{ backgroundColor: '#ffeb9c', fontWeight: 'bold' }}>
              <td style={{ textAlign: 'center' }}>Grand Total</td>
              <td className={styles.colCenter}>{yearlyData.reduce((sum, d) => sum + d.total.occupiedRooms, 0)}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.waterCost, 0))}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.electricityCost, 0))}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.otherCost, 0))}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.rentCost, 0))}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.totalAmount, 0))}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.govWaterBill, 0), true)}</td>
              <td className={styles.colRight}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.govElecBill, 0), true)}</td>
              <td className={styles.colRight} style={{ color: yearlyData.reduce((sum, d) => sum + d.total.netTotal, 0) < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>{formatAmount(yearlyData.reduce((sum, d) => sum + d.total.netTotal, 0), true)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className={styles.printFooterContent} style={{ textAlign: 'right', marginTop: '10px' }}>
      วันที่เอกสาร : {currentDateStr}
    </div>
  </div>
  
<div className={styles.mobileYearlyList}>
  <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center' }}>
    สรุปการเงินรายปี {parseInt(reportYear) + 543}
  </div>
  
  {yearlyData.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>ไม่มีข้อมูลในปีนี้</div>
  ) : (
    yearlyData.map((data) => (
      <div key={data.period} className={styles.yearlyMobileCard}>
        <div className={styles.yearlyMobileHeader}>
          <div>
            <div className={styles.yearlyMobileMonth} style={{ textAlign: 'left' }}>{formatThaiMonthOnly(data.period)} {parseInt(reportYear) + 543}</div>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', padding: '2px 8px', borderRadius: 'var(--radius-lg)', fontWeight: 600 }}>
              🏢 เช่ารวม {data.total.occupiedRooms} ห้อง
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>กำไรสุทธิรวม</div>
            <div className={`${data.total.netTotal >= 0 ? styles.profitText : styles.lossText}`} style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {data.total.netTotal > 0 ? '+' : ''} {formatAmount(data.total.netTotal, true)} ฿
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', padding: '0.5rem', textAlign: 'center', boxShadow: 'var(--shadow-inset)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>รวมรับ (ผู้เช่า)</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatAmount(data.total.totalAmount)} ฿</div>
          </div>
          <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', padding: '0.5rem', textAlign: 'center', boxShadow: 'var(--shadow-inset)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>รวมจ่าย (หลวง)</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatAmount(data.total.govWaterBill + data.total.govElecBill, true)} ฿</div>
          </div>
        </div>
        
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>แยกตามอาคาร</div>

        {data.buildings.map((b: any, bIdx: number) => {
          const isExpanded = expandedMobileYearly[`${data.period}-${b.buildingId}`];
          const iconThemes = [
            { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5' },
            { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', color: '#db2777' },
            { bg: 'linear-gradient(135deg, var(--status-warning-bg) 0%, #fed7aa 100%)', color: '#ea580c' },
            { bg: 'linear-gradient(135deg, var(--status-success-bg) 0%, #bbf7d0 100%)', color: '#16a34a' }
          ];
          const theme = iconThemes[bIdx % iconThemes.length];

          return (
            <div key={b.buildingId}>
              <button 
                className={styles.yearlyMobileAccordionBtn} 
                onClick={() => toggleMobileYearlyAccordion(data.period, b.buildingId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-lg)', background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-inset)' }}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12.25M17.25 13.5h.75m-.75 3h.75" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{getShortBuildingName(b.buildingName)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{b.occupiedRooms} ห้อง</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={b.netTotal >= 0 ? styles.profitText : styles.lossText} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {b.netTotal > 0 ? '+' : ''} {formatAmount(b.netTotal, true)}
                  </span>
                  <svg style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </button>
              
              {isExpanded && (
                <div className={styles.yearlyMobileAccordionContent}>
                  <div className={styles.yearlyMobileGrid}>
                    <div className={styles.yearlyMobileGridCol}>
                      <div className={`${styles.yearlyMobileGridRow} ${styles.bold}`}>
                        <span>รับ (ผู้เช่า)</span>
                        <span style={{ color: '#4f46e5' }}>{formatAmount(b.totalAmount)}</span>
                      </div>
                      <div className={styles.yearlyMobileGridRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>ค่าห้อง</span>
                        <span style={{ fontWeight: 600 }}>{formatAmount(b.rentCost)}</span>
                      </div>
                      <div className={styles.yearlyMobileGridRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>ค่าน้ำ</span>
                        <span style={{ fontWeight: 600 }}>{formatAmount(b.waterCost)}</span>
                      </div>
                      <div className={styles.yearlyMobileGridRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>ค่าไฟ</span>
                        <span style={{ fontWeight: 600 }}>{formatAmount(b.electricityCost)}</span>
                      </div>
                      <div className={styles.yearlyMobileGridRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>อื่นๆ</span>
                        <span style={{ fontWeight: 600 }}>{formatAmount(b.otherCost)}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className={styles.yearlyMobileGridCol}>
                        <div className={`${styles.yearlyMobileGridRow} ${styles.bold}`}>
                          <span>จ่าย (หลวง)</span>
                          <span style={{ color: '#e11d48' }}>{formatAmount(b.govWaterBill + b.govElecBill, true)}</span>
                        </div>
                        <div className={styles.yearlyMobileGridRow}>
                          <span style={{ color: 'var(--text-secondary)' }}>น้ำหลวง</span>
                          <span style={{ fontWeight: 600 }}>{formatAmount(b.govWaterBill, true)}</span>
                        </div>
                        <div className={styles.yearlyMobileGridRow}>
                          <span style={{ color: 'var(--text-secondary)' }}>ไฟหลวง</span>
                          <span style={{ fontWeight: 600 }}>{formatAmount(b.govElecBill, true)}</span>
                        </div>
                      </div>
                      <div className={styles.yearlyMobileNetBox}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>สุทธิ</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#059669' }}>{b.netTotal > 0 ? '+' : ''} {formatAmount(b.netTotal, true)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ))
  )}
  
  {yearlyData.length > 0 && (
    <div className={`${styles.yearlyMobileCard} ${styles.yearlyMobileGrandCard}`} style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
      <div className={styles.yearlyMobileMonth} style={{ color: 'white' }}>ยอดรวมทั้งปี (สุทธิ)</div>
      <div className={styles.yearlyMobileNet} style={{ marginTop: '0.5rem', marginBottom: 0 }}>
        <span className={`${styles.yearlyMobileNetValue} ${yearlyData.reduce((sum, d) => sum + d.total.netTotal, 0) >= 0 ? styles.profitText : styles.lossText}`} style={{ fontSize: '1.5rem' }}>
          {formatAmount(yearlyData.reduce((sum, d) => sum + d.total.netTotal, 0), true)} ฿
        </span>
      </div>
    </div>
  )}
</div>

</>
          ) : activeSubTab === "PNL" ? (
            <>
              <div className={styles.desktopSummaryTable} style={{ overflowX: 'auto' }}>
                <table className={styles.printWrapperTable}>
            <thead>
              <tr>
                <td>
                  <div className={styles.printHeaderContent}>
                    รายงานกำไร-ขาดทุน ค่าน้ำ-ไฟ ประจำเดือน {formatThaiMonthOnly(reportPeriod)} {reportPeriod.split('-')[0] ? parseInt(reportPeriod.split('-')[0]) + 543 : ''}
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className={styles.summarySection} style={{ marginTop: '20px' }}>
                    <table className={styles.summaryTable}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{ width: '12%', backgroundColor: '#70ad47' }}>อพาร์ทเมนท์</th>
                          <th rowSpan={2} style={{ width: '6%', backgroundColor: '#70ad47' }}>ห้องที่<br/>มีผู้เช่า</th>
                          <th colSpan={6} style={{ backgroundColor: '#5b9bd5' }}>ค่าน้ำ</th>
                          <th colSpan={6} style={{ backgroundColor: '#c659a1' }}>ค่าไฟ</th>
                          <th colSpan={3} style={{ backgroundColor: '#70ad47' }}>รวมสุทธิ</th>
                        </tr>
                        <tr>
                          <th style={{ width: '5%', backgroundColor: '#5b9bd5' }}>หลวง<br/>(หน่วย)</th>
                          <th style={{ width: '5%', backgroundColor: '#5b9bd5' }}>ผู้เช่า<br/>(หน่วย)</th>
                          <th style={{ width: '5%', backgroundColor: '#5b9bd5' }}>ส่วนกลาง<br/>(หน่วย)</th>
                          <th style={{ width: '6%', backgroundColor: '#5b9bd5' }}>รายรับ<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#5b9bd5' }}>ต้นทุน<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#5b9bd5' }}>สุทธิ<br/>(บาท)</th>
                          <th style={{ width: '5%', backgroundColor: '#c659a1' }}>หลวง<br/>(หน่วย)</th>
                          <th style={{ width: '5%', backgroundColor: '#c659a1' }}>ผู้เช่า<br/>(หน่วย)</th>
                          <th style={{ width: '5%', backgroundColor: '#c659a1' }}>ส่วนกลาง<br/>(หน่วย)</th>
                          <th style={{ width: '6%', backgroundColor: '#c659a1' }}>รายรับ<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#c659a1' }}>ต้นทุน<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#c659a1' }}>สุทธิ<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#70ad47' }}>รายรับ<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#70ad47' }}>ต้นทุน<br/>(บาท)</th>
                          <th style={{ width: '6%', backgroundColor: '#70ad47' }}>สุทธิ<br/>(บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnlData.buildingPnl.length === 0 ? (
                          <tr>
                            <td colSpan={17} style={{ textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูลในรอบบิลนี้</td>
                          </tr>
                        ) : (
                          pnlData.buildingPnl.map((bPnl) => (
                            <tr key={`pnl-${bPnl.id}`}>
                              <td className={styles.colLeft}>{bPnl.name}</td>
                              <td className={styles.colCenter}>{bPnl.occupiedRooms}</td>
                              
                              <td className={styles.colRight}>{formatAmount(bPnl.govWaterUnits)}</td>
                              <td className={styles.colRight}>{formatAmount(bPnl.tenantWaterUnits)}</td>
                              <td className={styles.colRight}>{formatAmount(bPnl.commonWaterUnits)}</td>
                              <td className={styles.colRight}>{(bPnl.revWater % 1 !== 0) ? bPnl.revWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.revWater)}</td>
                              <td className={styles.colRight}>{(bPnl.costWater % 1 !== 0) ? bPnl.costWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.costWater)}</td>
                              <td className={styles.colRight} style={{ color: bPnl.profitWater < 0 ? 'red' : 'inherit', fontWeight: bPnl.profitWater < 0 ? 'bold' : 'normal' }}>{(bPnl.profitWater % 1 !== 0) ? bPnl.profitWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.profitWater)}</td>
                              
                              <td className={styles.colRight}>{formatAmount(bPnl.govElecUnits)}</td>
                              <td className={styles.colRight}>{formatAmount(bPnl.tenantElecUnits)}</td>
                              <td className={styles.colRight}>{formatAmount(bPnl.commonElecUnits)}</td>
                              <td className={styles.colRight}>{(bPnl.revElec % 1 !== 0) ? bPnl.revElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.revElec)}</td>
                              <td className={styles.colRight}>{(bPnl.costElec % 1 !== 0) ? bPnl.costElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.costElec)}</td>
                              <td className={styles.colRight} style={{ color: bPnl.profitElec < 0 ? 'red' : 'inherit', fontWeight: bPnl.profitElec < 0 ? 'bold' : 'normal' }}>{(bPnl.profitElec % 1 !== 0) ? bPnl.profitElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.profitElec)}</td>
                              
                              <td className={styles.colRight}>{(bPnl.totalRev % 1 !== 0) ? bPnl.totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.totalRev)}</td>
                              <td className={styles.colRight}>{(bPnl.totalCost % 1 !== 0) ? bPnl.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.totalCost)}</td>
                              <td className={styles.colRight} style={{ color: bPnl.totalProfit < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>{(bPnl.totalProfit % 1 !== 0) ? bPnl.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(bPnl.totalProfit)}</td>
                            </tr>
                          ))
                        )}
                        {pnlData.buildingPnl.length > 0 && (
                          <tr className={styles.summaryTotalRow}>
                            <td style={{ textAlign: 'right', paddingRight: '15px' }}>ยอดรวม</td>
                            <td className={styles.colCenter}>{pnlData.grandOccupiedRooms}</td>

                            <td className={styles.colRight}>{formatAmount(pnlData.grandGovWaterUnits)}</td>
                            <td className={styles.colRight}>{formatAmount(pnlData.grandTenantWaterUnits)}</td>
                            <td className={styles.colRight}>{formatAmount(pnlData.grandCommonWaterUnits)}</td>
                            <td className={styles.colRight}>{(pnlData.grandRevenueWater % 1 !== 0) ? pnlData.grandRevenueWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandRevenueWater)}</td>
                            <td className={styles.colRight}>{(pnlData.grandCostWater % 1 !== 0) ? pnlData.grandCostWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandCostWater)}</td>
                            <td className={styles.colRight} style={{ color: pnlData.grandProfitWater < 0 ? 'red' : 'inherit', fontWeight: pnlData.grandProfitWater < 0 ? 'bold' : 'normal' }}>{(pnlData.grandProfitWater % 1 !== 0) ? pnlData.grandProfitWater.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandProfitWater)}</td>
                            
                            <td className={styles.colRight}>{formatAmount(pnlData.grandGovElecUnits)}</td>
                            <td className={styles.colRight}>{formatAmount(pnlData.grandTenantElecUnits)}</td>
                            <td className={styles.colRight}>{formatAmount(pnlData.grandCommonElecUnits)}</td>
                            <td className={styles.colRight}>{(pnlData.grandRevenueElec % 1 !== 0) ? pnlData.grandRevenueElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandRevenueElec)}</td>
                            <td className={styles.colRight}>{(pnlData.grandCostElec % 1 !== 0) ? pnlData.grandCostElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandCostElec)}</td>
                            <td className={styles.colRight} style={{ color: pnlData.grandProfitElec < 0 ? 'red' : 'inherit', fontWeight: pnlData.grandProfitElec < 0 ? 'bold' : 'normal' }}>{(pnlData.grandProfitElec % 1 !== 0) ? pnlData.grandProfitElec.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandProfitElec)}</td>
                            
                            <td className={styles.colRight}>{(pnlData.grandTotalRevenue % 1 !== 0) ? pnlData.grandTotalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandTotalRevenue)}</td>
                            <td className={styles.colRight}>{(pnlData.grandTotalCost % 1 !== 0) ? pnlData.grandTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandTotalCost)}</td>
                            <td className={styles.colRight} style={{ color: pnlData.grandTotalProfit < 0 ? 'red' : 'inherit', fontWeight: 'bold' }}>{(pnlData.grandTotalProfit % 1 !== 0) ? pnlData.grandTotalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatAmount(pnlData.grandTotalProfit)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div className={styles.printFooterContent}>
                    วันที่เอกสาร : {currentDateStr}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
              </div>
              <div className={styles.mobileSummaryList}>
                {pnlData.buildingPnl.length > 0 ? (
                  <>
                    <div className={styles.grandCard}>
                      <h3>สรุปกำไรสุทธิ (รวมทุกอาคาร)</h3>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>รวมห้องเช่าทั้งหมด: {pnlData.grandOccupiedRooms} ห้อง</p>
                      
                      <div style={{ background: "var(--bg-color)", borderRadius: 'var(--radius-lg)', padding: "1rem", marginBottom: "1rem", boxShadow: "var(--shadow-inset)" }}>
                        <p className={`${styles.totalProfit} ${pnlData.grandTotalProfit >= 0 ? styles.profitText : styles.lossText}`}>
                          {pnlData.grandTotalProfit > 0 ? "+" : ""} {formatAmount(pnlData.grandTotalProfit)} <span style={{ fontSize: "1.2rem" }}>฿</span>
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0 0.5rem", marginBottom: "1rem" }}>
                        <div style={{ textAlign: "left" }}>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>รับรวม (ผู้เช่า)</span>
                          <strong style={{ fontSize: "1rem" }}>{formatAmount(pnlData.grandTotalRevenue)}</strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "var(--text-secondary)", display: "block" }}>จ่ายรวม (หลวง)</span>
                          <strong style={{ fontSize: "1rem" }}>{formatAmount(pnlData.grandTotalCost)}</strong>
                        </div>
                      </div>

                      <div className={styles.subProfits}>
                        <div>
                          <span>กำไรน้ำ 💧</span>
                          <strong className={pnlData.grandProfitWater >= 0 ? styles.profitText : styles.lossText}>{pnlData.grandProfitWater > 0 ? "+" : ""}{formatAmount(pnlData.grandProfitWater)}</strong>
                        </div>
                        <div>
                          <span>กำไรไฟ ⚡</span>
                          <strong className={pnlData.grandProfitElec >= 0 ? styles.profitText : styles.lossText}>{pnlData.grandProfitElec > 0 ? "+" : ""}{formatAmount(pnlData.grandProfitElec)}</strong>
                        </div>
                      </div>
                    </div>

                    {pnlData.buildingPnl.map((bPnl: any) => (
                      <div key={`pnl-mob-${bPnl.id}`} className={styles.buildingCard}>
                        <div className={styles.buildingHeader}>
                          <h4 className={styles.buildingName}>
                            🏢 {bPnl.name} <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-secondary)" }}>({bPnl.occupiedRooms} ห้อง)</span>
                          </h4>
                          <div className={`${styles.buildingProfitBadge} ${bPnl.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                            {bPnl.totalProfit > 0 ? "+" : ""} {formatAmount(bPnl.totalProfit)} ฿
                          </div>
                        </div>

                        <div className={styles.utilSection}>
                          <div className={`${styles.utilHeader} ${styles.utilWater}`}>💧 การประปา</div>
                          <div className={`${styles.unitBreakdown} ${styles.water}`}>
                            <div className={styles.unitBreakdownCol}>
                              <div className={styles.unitLabel}>หน่วยหลวง</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatAmount(bPnl.govWaterUnits)}</div>
                            </div>
                            <div className={`${styles.unitBreakdownCol} ${styles.center}`}>
                              <div className={styles.unitLabel}>หน่วยผู้เช่า</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatAmount(bPnl.tenantWaterUnits)}</div>
                            </div>
                            <div className={styles.unitBreakdownCol}>
                              <div className={styles.unitLabel}>ส่วนกลาง</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary-color)" }}>{formatAmount(bPnl.commonWaterUnits)}</div>
                            </div>
                          </div>
                          <div className={styles.utilGrid}>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>เก็บผู้เช่า (รับ)</span>
                              <span className={styles.utilVal}>{formatAmount(bPnl.revWater)}</span>
                            </div>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>จ่ายหลวง (ทุน)</span>
                              <span className={styles.utilVal}>{formatAmount(bPnl.costWater)}</span>
                            </div>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>กำไร</span>
                              <span className={bPnl.profitWater >= 0 ? styles.utilProfitVal : styles.utilLossVal}>
                                {bPnl.profitWater > 0 ? "+" : ""} {formatAmount(bPnl.profitWater)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.utilSection}>
                          <div className={`${styles.utilHeader} ${styles.utilElec}`}>⚡ การไฟฟ้า</div>
                          <div className={`${styles.unitBreakdown} ${styles.elec}`}>
                            <div className={styles.unitBreakdownCol}>
                              <div className={styles.unitLabel}>หน่วยหลวง</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatAmount(bPnl.govElecUnits)}</div>
                            </div>
                            <div className={`${styles.unitBreakdownCol} ${styles.center}`}>
                              <div className={styles.unitLabel}>หน่วยผู้เช่า</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{formatAmount(bPnl.tenantElecUnits)}</div>
                            </div>
                            <div className={styles.unitBreakdownCol}>
                              <div className={styles.unitLabel}>ส่วนกลาง</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary-color)" }}>{formatAmount(bPnl.commonElecUnits)}</div>
                            </div>
                          </div>
                          <div className={styles.utilGrid}>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>เก็บผู้เช่า (รับ)</span>
                              <span className={styles.utilVal}>{formatAmount(bPnl.revElec)}</span>
                            </div>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>จ่ายหลวง (ทุน)</span>
                              <span className={styles.utilVal}>{formatAmount(bPnl.costElec)}</span>
                            </div>
                            <div className={styles.utilBox}>
                              <span className={styles.unitLabel}>กำไร</span>
                              <span className={bPnl.profitElec >= 0 ? styles.utilProfitVal : styles.utilLossVal}>
                                {bPnl.profitElec > 0 ? "+" : ""} {formatAmount(bPnl.profitElec)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>ไม่มีข้อมูลกำไร-ขาดทุนในรอบบิลนี้</div>
                )}
              </div>
              </>
) : reportData.buildingData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>ไม่มีข้อมูลใบแจ้งหนี้ในรอบบิลนี้</div>
        ) : (
          <>
            {/* ─── SCREEN-ONLY: New premium monthly summary UI ─── */}
            <div className={styles.screenOnlyMonthly}>
              {/* KPI Bar */}
              <div className={styles.monthlyKpiBar}>
                <div className={styles.monthlyKpiCard}>
                  <div className={styles.monthlyKpiIcon}>🏠</div>
                  <div className={styles.monthlyKpiLabel}>ห้องที่เช่าทั้งหมด</div>
                  <div className={`${styles.monthlyKpiValue} ${styles.kpiColorRooms}`}>
                    {reportData.buildingData.reduce((acc, b) => acc + b.occupiedRooms, 0)} ห้อง
                  </div>
                  <div className={styles.monthlyKpiSub}>จาก {reportData.buildingData.length} อาคาร</div>
                </div>
                <div className={styles.monthlyKpiCard}>
                  <div className={styles.monthlyKpiIcon}>💰</div>
                  <div className={styles.monthlyKpiLabel}>ค่าเช่ารวม</div>
                  <div className={`${styles.monthlyKpiValue} ${styles.kpiColorRent}`}>
                    {formatAmount(reportData.grandRentCost)}
                  </div>
                  <div className={styles.monthlyKpiSub}>บาท</div>
                </div>
                <div className={styles.monthlyKpiCard}>
                  <div className={styles.monthlyKpiIcon}>💧</div>
                  <div className={styles.monthlyKpiLabel}>ค่าน้ำ + ค่าไฟ</div>
                  <div className={`${styles.monthlyKpiValue} ${styles.kpiColorUtil}`}>
                    {formatAmount(reportData.grandWaterCost + reportData.grandElectricityCost)}
                  </div>
                  <div className={styles.monthlyKpiSub}>บาท</div>
                </div>
                <div className={styles.monthlyKpiCard}>
                  <div className={styles.monthlyKpiIcon}>🧾</div>
                  <div className={styles.monthlyKpiLabel}>ยอดรวมทั้งหมด</div>
                  <div className={`${styles.monthlyKpiValue} ${styles.kpiColorTotal}`}>
                    {formatAmount(reportData.grandTotal)}
                  </div>
                  <div className={styles.monthlyKpiSub}>บาท</div>
                </div>
              </div>

              {/* Building Cards */}
              {reportData.buildingData.map((bData, idx) => {
                const bGlowColors = [
                  'rgba(79, 70, 229, 0.15)', // Indigo
                  'rgba(5, 150, 105, 0.15)', // Emerald
                  'rgba(234, 88, 12, 0.15)', // Orange
                  'rgba(2, 132, 199, 0.15)', // Sky
                ];
                const bAccentLight = ['#4338ca', '#059669', '#ea580c', '#0284c7'];
                const bAccentDark  = ['#818cf8', '#34d399', '#fb923c', '#38bdf8'];
                
                const glowColor = bGlowColors[idx % bGlowColors.length];
                const accentLight = bAccentLight[idx % bAccentLight.length];
                const accentDark  = bAccentDark[idx % bAccentDark.length];

                return (
                  <div 
                    key={bData.id} 
                    className={styles.monthlyBuildingCard}
                    style={{ '--accent-l': accentLight, '--accent-d': accentDark } as any}
                  >
                    <div className={styles.monthlyGlow} style={{ background: glowColor }} />
                    <div className={styles.monthlyBuildingHeader}>
                      <div className={styles.monthlyBuildingTitle}>
                        <span style={{ fontSize: '1.4rem' }}>🏢</span> {getShortBuildingName(bData.name)}
                        <span className={styles.monthlyBuildingBadge}>เช่า {bData.occupiedRooms} ห้อง</span>
                      </div>
                      <div className={styles.monthlyBuildingTotal}>{formatAmount(bData.buildingTotal)} ฿</div>
                    </div>
                    <div className={styles.monthlyTableWrap}>
                      <table className={styles.monthlyScreenTable}>
                        <thead>
                          <tr>
                            <th style={{ width: '8%', textAlign: 'left' }}>ห้อง</th>
                            <th style={{ width: '27%', textAlign: 'left' }}>ชื่อผู้เช่า</th>
                            <th>ค่าห้อง</th>
                            <th>ค่าน้ำ</th>
                            <th>ค่าไฟ</th>
                            <th>อื่นๆ</th>
                            <th>รวม (฿)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bData.invoices.map((inv: any) => (
                            <tr key={inv.roomNumber} className={inv.isEmpty ? styles.monthlyEmptyRow : ''}>
                              <td>
                                <span className={styles.monthlyRoomNum}>{inv.roomNumber}</span>
                              </td>
                              {inv.isEmpty ? (
                                <td colSpan={6} className={styles.monthlyEmptyCell}>— ว่าง —</td>
                              ) : (
                                <>
                                  <td className={styles.monthlyTenantName}>{inv.tenantName}</td>
                                  <td>{inv.rentCost ? formatAmount(inv.rentCost) : '—'}</td>
                                  <td>{inv.waterCost > 0 ? formatAmount(inv.waterCost) : '—'}</td>
                                  <td>{inv.electricityCost > 0 ? formatAmount(inv.electricityCost) : '—'}</td>
                                  <td>{inv.otherCost > 0 ? formatAmount(inv.otherCost) : '—'}</td>
                                  <td className={styles.monthlyAmountBold}>{formatAmount(inv.totalAmount)}</td>
                                </>
                              )}
                            </tr>
                          ))}
                          <tr className={styles.monthlyTotalRow}>
                            <td colSpan={6} style={{ textAlign: 'right', paddingRight: '1rem' }}>
                              ยอดรวม {getShortBuildingName(bData.name)}
                            </td>
                            <td>{formatAmount(bData.buildingTotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Grand Summary */}
              {reportData.buildingData.length > 0 && (
                <div className={styles.monthlyGrandSummary}>
                  <div className={styles.monthlyGrandLeft}>
                    <div className={styles.monthlyGrandLabel}>💎 ยอดรวมรายรับทั้งหมด (Grand Total)</div>
                    <div className={styles.monthlyGrandTotal}>{formatAmount(reportData.grandTotal)} ฿</div>
                  </div>
                  <div className={styles.monthlyGrandRight}>
                    {reportData.buildingData.map(b => (
                      <div key={b.id} className={styles.monthlyGrandItem}>
                        <label>{getShortBuildingName(b.name)}</label>
                        <span>{formatAmount(b.buildingTotal)}</span>
                      </div>
                    ))}
                    <div className={styles.monthlyGrandItem}>
                      <label>ค่าเช่า</label>
                      <span>{formatAmount(reportData.grandRentCost)}</span>
                    </div>
                    <div className={styles.monthlyGrandItem}>
                      <label>ค่าน้ำ</label>
                      <span>{formatAmount(reportData.grandWaterCost)}</span>
                    </div>
                    <div className={styles.monthlyGrandItem}>
                      <label>ค่าไฟ</label>
                      <span>{formatAmount(reportData.grandElectricityCost)}</span>
                    </div>
                    {reportData.grandOtherCost > 0 && (
                      <div className={styles.monthlyGrandItem}>
                        <label>อื่นๆ</label>
                        <span>{formatAmount(reportData.grandOtherCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─── PRINT-ONLY: Original table structure (hidden on screen) ─── */}
            <div className={`${styles.desktopSummaryTable} ${styles.hideOnScreen}`} style={{ overflowX: 'auto' }}>
              <table className={styles.printWrapperTable}>
            <thead>
              <tr>
                <td>
                  <div className={styles.printHeaderContent}>
                    ค่าเช่า ประจำเดือน {formatThaiMonthOnly(reportPeriod)} {reportPeriod.split('-')[0] ? parseInt(reportPeriod.split('-')[0]) + 543 : ''}
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {reportData.buildingData.map((bData, idx) => (
                    <div key={bData.id} className={`${styles.buildingSection} ${idx === 1 ? styles.pageBreakAfter : ''}`}>
                      <div className={styles.buildingHeader}>
                        {bData.name}
                      </div>
                      <table className={styles.table}>
                          <thead>
                            <tr style={{ backgroundColor: '#5b9bd5', color: 'white' }}>
                              <th style={{ width: '10%' }}>ห้อง</th>
                              <th style={{ width: '30%' }}>ชื่อผู้เช่า</th>
                              <th style={{ width: '12%' }}>ค่าห้อง</th>
                              <th style={{ width: '12%' }}>ค่าน้ำ (บาท)</th>
                              <th style={{ width: '12%' }}>ค่าไฟ (บาท)</th>
                              <th style={{ width: '12%' }}>ค่าใช้จ่ายอื่นๆ</th>
                              <th style={{ width: '12%' }}>รวมเป็นเงิน (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bData.invoices.map((inv: any) => (
                              <tr key={inv.roomNumber}>
                                <td>{inv.roomNumber}</td>
                                {inv.isEmpty ? (
                                  <>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                  </>
                                ) : (
                                  <>
                                    <td>{inv.tenantName}</td>
                                    <td>{inv.rentCost ? formatAmount(inv.rentCost) : ''}</td>
                                    <td>{inv.waterCost > 0 ? formatAmount(inv.waterCost) : ''}</td>
                                    <td>{inv.electricityCost > 0 ? formatAmount(inv.electricityCost) : ''}</td>
                                    <td>{inv.otherCost > 0 ? formatAmount(inv.otherCost) : ''}</td>
                                    <td style={{ fontWeight: 'bold' }}>{formatAmount(inv.totalAmount)}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                            <tr className={styles.totalRow}>
                              <td colSpan={6} style={{ textAlign: 'right', paddingRight: '15px' }}>ยอดรวม (Total)</td>
                              <td>{formatAmount(bData.buildingTotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                    </div>
                  ))}

                  {/* Summary Section */}
                  {reportData.buildingData.length > 0 && (
                    <div className={styles.summarySection}>
                      <table className={styles.summaryTable}>
                        <thead>
                            <tr style={{ backgroundColor: '#5b9bd5', color: 'white' }}>
                              <th style={{ width: '10%' }}>ลำดับ</th>
                              <th style={{ width: '30%' }}>อพาร์ทเมนท์</th>
                              <th style={{ width: '12%' }}>ค่าห้อง (บาท)</th>
                              <th style={{ width: '12%' }}>ค่าน้ำ (บาท)</th>
                              <th style={{ width: '12%' }}>ค่าไฟ (บาท)</th>
                              <th style={{ width: '12%' }}>ค่าใช้จ่ายอื่นๆ (บาท)</th>
                              <th style={{ width: '12%' }}>รวมเป็นเงิน (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.buildingData.map((bData, idx) => (
                              <tr key={`sum-${bData.id}`}>
                                <td className={styles.colCenter}>{idx + 1}</td>
                                <td className={styles.colLeft}>{getShortBuildingName(bData.name)} ( เช่ารวม {bData.occupiedRooms} ห้อง )</td>
                                <td className={styles.colCenter}>{bData.buildingRentCost > 0 ? formatAmount(bData.buildingRentCost) : '0'}</td>
                                <td className={styles.colCenter}>{bData.buildingWaterCost > 0 ? formatAmount(bData.buildingWaterCost) : '0'}</td>
                                <td className={styles.colCenter}>{bData.buildingElectricityCost > 0 ? formatAmount(bData.buildingElectricityCost) : '0'}</td>
                                <td className={styles.colCenter}>{bData.buildingOtherCost > 0 ? formatAmount(bData.buildingOtherCost) : '0'}</td>
                                <td className={styles.colRight}>{formatAmount(bData.buildingTotal)}</td>
                              </tr>
                            ))}
                            <tr className={styles.summaryTotalRow}>
                              <td colSpan={6} style={{ textAlign: 'right', paddingRight: '15px' }}>ยอดรวม ( Total )</td>
                              <td className={styles.colRight}>{formatAmount(reportData.grandTotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div className={styles.printFooterContent}>
                    วันที่เอกสาร : {currentDateStr}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
            </div>
            {/* MOBILE SUMMARY (Old) */}
            <div className={styles.mobileSummaryList}>
              <div className={styles.grandSummaryCard}>
                <h3>ยอดรวมทั้งหมดทุกอาคาร</h3>
                <div className={styles.grandTotalVal}>{formatAmount(reportData.grandTotal)} <span style={{fontSize: "1rem"}}>฿</span></div>
                <div className={styles.grandSummaryDetails}>
                  <div className={styles.grandSummaryItem}>รวมห้อง <span>{reportData.buildingData.reduce((acc, b) => acc + b.occupiedRooms, 0)} ห้อง</span></div>
                  <div className={styles.grandSummaryItem}>ค่าเช่า <span>{formatAmount(reportData.grandRentCost)}</span></div>
                  <div className={styles.grandSummaryItem}>ค่าน้ำ <span>{formatAmount(reportData.grandWaterCost)}</span></div>
                  <div className={styles.grandSummaryItem}>ค่าไฟ <span>{formatAmount(reportData.grandElectricityCost)}</span></div>
                  <div className={styles.grandSummaryItem}>อื่นๆ <span>{formatAmount(reportData.grandOtherCost)}</span></div>
                </div>
              </div>
              
              {reportData.buildingData.map(bData => (
                <div key={"mob-" + bData.id} className={styles.buildingSection}>
                  <div className={styles.buildingHeaderCard}>
                    <div className={styles.buildingTitleRow}>
                      <div className={styles.buildingNameVal}>🏢 {bData.name.replace("อาคาร", "").trim()}</div>
                      <div className={styles.buildingNetVal}>{formatAmount(bData.buildingTotal)} ฿</div>
                    </div>
                    <div className={styles.buildingDetailsRow}>
                      <div>ห้อง: <span>{bData.occupiedRooms}</span></div>
                      <div>เช่า: <span>{formatAmount(bData.buildingRentCost)}</span></div>
                      <div>น้ำ: <span>{formatAmount(bData.buildingWaterCost)}</span></div>
                      <div>ไฟ: <span>{formatAmount(bData.buildingElectricityCost)}</span></div>
                      <div>อื่นๆ: <span>{formatAmount(bData.buildingOtherCost)}</span></div>
                    </div>
                  </div>
                  
                  {bData.invoices.filter((inv: any) => !inv.isEmpty).map((inv: any) => (
                    <div key={"mob-inv-" + inv.roomNumber} className={styles.summaryRoomCard}>
                      <div className={styles.summaryRoomHeader}>
                        <div>
                          <div className={styles.summaryRoomNum}>{inv.roomNumber}</div>
                          <div className={styles.summaryTenant}>{inv.tenantName}</div>
                        </div>
                        <div className={`${styles.summaryBadge} ${inv.status === "UNPAID" ? styles.unpaid : styles.paid}`}>
                          {inv.status === "UNPAID" ? "รอชำระ" : "ชำระแล้ว"}
                        </div>
                      </div>
                      <div className={styles.summaryRoomBreakdown}>
                        <div className={styles.summaryBreakdownRow}>
                          <div>ค่าเช่า</div>
                          <span>{inv.rentCost ? formatAmount(inv.rentCost) : "0.00"}</span>
                        </div>
                        <div className={styles.summaryBreakdownRow}>
                          <div>ค่าน้ำ <span className={styles.summaryUnitText}>{(inv.currentWater || 0) - (inv.previousWater || 0)} หน่วย</span></div>
                          <span>{inv.waterCost ? formatAmount(inv.waterCost) : "0.00"}</span>
                        </div>
                        <div className={styles.summaryBreakdownRow}>
                          <div>ค่าไฟ <span className={styles.summaryUnitText}>{(inv.currentElec || 0) - (inv.previousElec || 0)} หน่วย</span></div>
                          <span>{inv.electricityCost ? formatAmount(inv.electricityCost) : "0.00"}</span>
                        </div>
                        {inv.otherCost > 0 && (
                          <div className={styles.summaryBreakdownRow}>
                            <div>อื่นๆ</div>
                            <span>{formatAmount(inv.otherCost)}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.summaryRoomFooter}>
                        <div className={styles.netLabel}>ยอดสุทธิ</div>
                        <div className={styles.netValue}>
                          {formatAmount(inv.totalAmount)} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>บาท</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            </>
        )}
        </div>
      </div>

      {toastMessage && (
        <div className={styles.copyToast}>
          <span>✅</span> {toastMessage}
        </div>
      )}
    </div>
  );
}




