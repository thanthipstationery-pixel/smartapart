'use client';

import React, { useState } from 'react';
import { getShortBuildingName, formatThaiDateNumeric, formatThaiMonthOnly } from '@/lib/thaiDate';
import { getPayInAdvanceBillingPeriod } from '@/lib/billingRules';

interface OverviewTabProps {
  activeStats: any;
  overviewBuildingFilter: string;
  setOverviewBuildingFilter: (val: string) => void;
  buildings: any[];
  invoices: any[];
  billingPeriod?: string;
  setBillingPeriod?: (val: string) => void;
  meterReadings?: any[];
  govBills?: any[];
  bookings?: any[];
  setSelectedBuildingId: (val: string) => void;
  setActiveTab: (tab: any) => void;
  setOverdueBuildingFilter: (val: string) => void;
  setShowOverdueModal: (val: boolean) => void;
  setMapSearchQuery?: (val: string) => void;
  setRoomStatusFilter?: (val: string) => void;
  setInvoiceStatusFilter?: (val: string) => void;
  setInvoiceFilterPeriod?: (val: string) => void;
  setInvoiceFilterBuildingId?: (val: string) => void;
  setTenantBuildingFilter?: (val: string) => void;
  setTenantSubTab?: (val: string) => void;
  handleRoomClick?: (roomId: string) => void;
  styles: any;
  Icons: any;
}

export default function OverviewTab({
  activeStats,
  overviewBuildingFilter,
  setOverviewBuildingFilter,
  buildings,
  invoices,
  billingPeriod,
  setBillingPeriod,
  meterReadings = [],
  govBills = [],
  bookings = [],
  setSelectedBuildingId,
  setActiveTab,
  setOverdueBuildingFilter,
  setShowOverdueModal,
  setMapSearchQuery,
  setRoomStatusFilter,
  setInvoiceStatusFilter,
  setInvoiceFilterPeriod,
  setInvoiceFilterBuildingId,
  setTenantBuildingFilter,
  setTenantSubTab,
  handleRoomClick,
  styles,
  Icons,
}: OverviewTabProps) {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [chartViewMode, setChartViewMode] = useState<'status' | 'type'>('status');

  if (!activeStats) return null;

  const currentCalendarMonth = new Date().toISOString().slice(0, 7);
  const nextPayInAdvanceMonth = getPayInAdvanceBillingPeriod(new Date());
  const activeWorkflowPeriod = billingPeriod || currentCalendarMonth;

  // Format YYYY-MM to readable Thai month + BE year (e.g. "เม.ย. 2569")
  const formatPeriodBadge = (periodStr: string) => {
    if (!periodStr || !periodStr.includes('-')) return periodStr;
    const [y, m] = periodStr.split('-');
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const mName = monthNames[parseInt(m, 10) - 1] || m;
    const yBE = parseInt(y, 10) + 543;
    return `${mName} ${yBE}`;
  };

  // Filtered buildings & rooms based on overviewBuildingFilter
  const filteredBuildings = overviewBuildingFilter === 'ALL'
    ? buildings
    : buildings.filter((b) => b.id === overviewBuildingFilter);

  const allFilteredRooms = filteredBuildings.flatMap((b) =>
    (b.floors || []).flatMap((f: any) =>
      (f.rooms || []).map((r: any) => ({
        ...r,
        buildingId: b.id,
        buildingName: b.name,
      }))
    )
  );

  // Filtered invoices based on overviewBuildingFilter
  const filteredInvoices = invoices.filter((inv) => {
    if (overviewBuildingFilter === 'ALL') return true;
    const bId = inv.room?.floor?.building?.id || inv.room?.floor?.buildingId;
    return bId === overviewBuildingFilter;
  });

  // Room breakdown counts
  const bookedRoomsCount =
    activeStats.bookedRoomsCount ??
    activeStats.bookedRooms ??
    allFilteredRooms.filter((r) => r.status === 'BOOKED' || Boolean(r.activeBooking)).length;

  const maintenanceRoomsCount =
    activeStats.maintenanceRoomsCount ??
    activeStats.maintenanceRooms ??
    allFilteredRooms.filter((r) => r.status === 'MAINTENANCE').length;

  const occupancyRate =
    activeStats.totalRooms > 0
      ? Number(((activeStats.occupiedRooms / activeStats.totalRooms) * 100).toFixed(1))
      : 0;

  // Effective period for the Financial Progress card
  const effectiveFinancialPeriod = activeStats.effectivePeriod || activeWorkflowPeriod;
  const financialPeriodInvoices = filteredInvoices.filter(
    (inv) => inv.billingPeriod === effectiveFinancialPeriod && inv.status !== 'CANCELLED'
  );

  const currentMonthRevenue =
    activeStats.currentMonthRevenue ??
    financialPeriodInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const currentPeriodTotalBilled =
    activeStats.currentPeriodTotalBilled ??
    financialPeriodInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const currentPeriodCollectionRate =
    currentPeriodTotalBilled > 0
      ? Math.min(100, Math.round((currentMonthRevenue / currentPeriodTotalBilled) * 100))
      : 0;

  // Unpaid breakdown: Current Period vs Past Overdue Periods
  const allUnpaidInvoices = filteredInvoices.filter(
    (inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE'
  );
  const currentPeriodUnpaidList = allUnpaidInvoices.filter(
    (inv) => inv.billingPeriod === effectiveFinancialPeriod
  );
  const pastPeriodsUnpaidList = allUnpaidInvoices.filter(
    (inv) => inv.billingPeriod !== effectiveFinancialPeriod
  );

  const currentPeriodUnpaidAmount =
    activeStats.currentPeriodUnpaidAmount ??
    currentPeriodUnpaidList.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const currentPeriodUnpaidCount =
    activeStats.currentPeriodUnpaidCount ?? currentPeriodUnpaidList.length;

  const overduePastPeriodsAmount =
    activeStats.overduePastPeriodsAmount ??
    pastPeriodsUnpaidList.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const overduePastPeriodsCount =
    activeStats.overduePastPeriodsCount ?? pastPeriodsUnpaidList.length;

  const totalUnpaidAmount = activeStats.totalUnpaidAmount ?? (currentPeriodUnpaidAmount + overduePastPeriodsAmount);

  // Government utility bills for the period (filtered by building)
  const matchingGovBills = govBills.filter((gb) => {
    const matchesBuilding = overviewBuildingFilter === 'ALL' || gb.buildingId === overviewBuildingFilter;
    const matchesPeriod = gb.period === effectiveFinancialPeriod || gb.period === activeWorkflowPeriod;
    return matchesBuilding && matchesPeriod;
  });

  // Deduplicate by buildingId for the target period (prefer effectiveFinancialPeriod)
  const govBillsByBuilding = new Map<string, any>();
  matchingGovBills.forEach((gb) => {
    const existing = govBillsByBuilding.get(gb.buildingId);
    if (!existing || gb.period === effectiveFinancialPeriod) {
      govBillsByBuilding.set(gb.buildingId, gb);
    }
  });
  const activeGovBillsList = Array.from(govBillsByBuilding.values());
  const totalGovBillCost = activeGovBillsList.reduce(
    (sum, gb) => sum + (Number(gb.waterBillTotal) || 0) + (Number(gb.elecBillTotal) || 0),
    0
  );
  const hasGovBillsForPeriod = activeGovBillsList.length > 0 && totalGovBillCost > 0;
  const netOperatingEstimate = currentMonthRevenue - totalGovBillCost;
  const projectedNetAfterGov = currentPeriodTotalBilled - totalGovBillCost;

  // Tenant utility billed in effectiveFinancialPeriod
  const periodTenantUtilityBilled = financialPeriodInvoices.reduce(
    (sum, inv) => sum + (inv.waterCost || 0) + (inv.electricityCost || 0),
    0
  );

  // ============================================================================
  // Monthly Workflow Tracker Calculations (for activeWorkflowPeriod)
  // ============================================================================
  const occupiedRoomsList = allFilteredRooms.filter((r) => r.status === 'OCCUPIED');
  const occupiedRoomsCount = occupiedRoomsList.length;

  // 1. Meter readings recorded in activeWorkflowPeriod
  const meterRecordedRoomIds = new Set(
    meterReadings
      .filter((mr) => {
        const matchBld = overviewBuildingFilter === 'ALL' || mr.buildingId === overviewBuildingFilter;
        const matchPeriod = !mr.billingPeriod || mr.billingPeriod === activeWorkflowPeriod;
        return matchBld && matchPeriod;
      })
      .map((mr) => mr.roomId)
  );
  const recordedRoomsCount = occupiedRoomsList.filter(
    (r) => r.isMeterRecorded || meterRecordedRoomIds.has(r.id)
  ).length;
  const meterProgressPct =
    occupiedRoomsCount > 0 ? Math.min(100, Math.round((recordedRoomsCount / occupiedRoomsCount) * 100)) : 0;

  // 2. Invoices issued in activeWorkflowPeriod
  const workflowPeriodInvoices = filteredInvoices.filter(
    (inv) => inv.billingPeriod === activeWorkflowPeriod && inv.status !== 'CANCELLED'
  );
  const billedRoomIds = new Set(workflowPeriodInvoices.map((inv) => inv.roomId));
  const billedOccupiedCount = occupiedRoomsList.filter((r) => billedRoomIds.has(r.id)).length;
  const billedRoomsCount = Math.max(billedOccupiedCount, Math.min(billedRoomIds.size, occupiedRoomsCount || billedRoomIds.size));
  const billProgressPct =
    occupiedRoomsCount > 0 ? Math.min(100, Math.round((billedRoomsCount / occupiedRoomsCount) * 100)) : 0;

  // 3. Paid invoices vs Total invoices in activeWorkflowPeriod
  const totalPeriodInvoicesCount = workflowPeriodInvoices.length;
  const paidInvoicesCount = workflowPeriodInvoices.filter((inv) => inv.status === 'PAID').length;
  const paidProgressPct =
    totalPeriodInvoicesCount > 0
      ? Math.min(100, Math.round((paidInvoicesCount / totalPeriodInvoicesCount) * 100))
      : 0;

  // ============================================================================
  // Row 3: Actionable Alerts & Upcoming Events
  // ============================================================================
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Overdue Invoices (status UNPAID/OVERDUE and dueDate strictly before today)
  const overdueInvoicesAlertList = allUnpaidInvoices
    .filter((inv) => {
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() < startOfToday.getTime();
    })
    .map((inv) => {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      const daysOverdue = Math.max(1, Math.floor((startOfToday.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        ...inv,
        daysOverdue,
        roomNumber: inv.room?.number || '-',
        buildingName: inv.room?.floor?.building?.name || '',
        tenantName: inv.tenant?.name || 'ผู้เช่า',
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // 2. Upcoming Move-Outs (rooms whose activeTenant has noticeDate or expectedCheckOutDate)
  const upcomingMoveOutsList = allFilteredRooms
    .filter((r) => r.activeTenant && (r.activeTenant.noticeDate || r.activeTenant.expectedCheckOutDate))
    .map((r) => {
      const checkOutDate = r.activeTenant.expectedCheckOutDate
        ? new Date(r.activeTenant.expectedCheckOutDate)
        : null;
      let daysRemaining: number | null = null;
      if (checkOutDate) {
        const target = new Date(checkOutDate);
        target.setHours(0, 0, 0, 0);
        daysRemaining = Math.round((target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
      }
      return {
        roomId: r.id,
        roomNumber: r.number,
        buildingId: r.buildingId,
        buildingName: r.buildingName,
        tenantName: r.activeTenant.name,
        tenantPhone: r.activeTenant.phone,
        noticeDate: r.activeTenant.noticeDate,
        expectedCheckOutDate: r.activeTenant.expectedCheckOutDate,
        daysRemaining,
      };
    })
    .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  // 3. Upcoming Check-Ins (bookings with CONFIRMED / ACTIVE status)
  const upcomingCheckInsList = (
    bookings.length > 0
      ? bookings.filter((bk) => {
          const matchStatus = !bk.status || bk.status === 'CONFIRMED' || bk.status === 'ACTIVE';
          const matchBld = overviewBuildingFilter === 'ALL' || bk.buildingId === overviewBuildingFilter;
          return matchStatus && matchBld;
        })
      : allFilteredRooms
          .filter((r) => r.activeBooking || r.status === 'BOOKED')
          .map((r) => ({
            id: r.activeBooking?.id || r.id,
            roomId: r.id,
            roomNumber: r.number,
            buildingId: r.buildingId,
            buildingName: r.buildingName,
            customerName: r.activeBooking?.customerName || 'ลูกค้าจองห้อง',
            customerPhone: r.activeBooking?.customerPhone || '',
            expectedCheckInDate: r.activeBooking?.expectedCheckInDate || null,
            depositAmount: r.activeBooking?.depositAmount || 0,
            status: 'CONFIRMED',
          }))
  )
    .map((bk) => {
      const checkInDate = bk.expectedCheckInDate ? new Date(bk.expectedCheckInDate) : null;
      let daysUntil: number | null = null;
      if (checkInDate) {
        const target = new Date(checkInDate);
        target.setHours(0, 0, 0, 0);
        daysUntil = Math.round((target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
      }
      return {
        ...bk,
        daysUntil,
      };
    })
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999));

  const totalActionableAlerts =
    overdueInvoicesAlertList.length + upcomingMoveOutsList.length + upcomingCheckInsList.length;

  // ============================================================================
  // Row 4: 6-Month Chart Data & Summary Metrics
  // ============================================================================
  const getChartData = () => {
    const groups: {
      [period: string]: {
        billed: number;
        paid: number;
        unpaid: number;
        rent: number;
        water: number;
        electricity: number;
        other: number;
      };
    } = {};

    filteredInvoices.forEach((inv) => {
      if (inv.status === 'CANCELLED') return;
      const period = inv.billingPeriod;
      if (!groups[period]) {
        groups[period] = { billed: 0, paid: 0, unpaid: 0, rent: 0, water: 0, electricity: 0, other: 0 };
      }
      groups[period].billed += inv.totalAmount || 0;
      groups[period].rent += inv.rentCost || 0;
      groups[period].water += inv.waterCost || 0;
      groups[period].electricity += inv.electricityCost || 0;
      groups[period].other += inv.otherCost || 0;

      if (inv.status === 'PAID') {
        groups[period].paid += inv.totalAmount || 0;
      } else {
        groups[period].unpaid += inv.totalAmount || 0;
      }
    });

    const periods = Object.keys(groups).sort();
    const lastPeriods = periods.slice(-6);

    return lastPeriods.map((p) => {
      const [year, month] = p.split('-');
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthName = monthNames[parseInt(month) - 1] || month;
      const shortYear = (parseInt(year) + 543).toString().slice(2);
      const label = `${monthName} ${shortYear}`;

      return {
        period: p,
        label,
        billed: groups[p].billed,
        paid: groups[p].paid,
        unpaid: groups[p].unpaid,
        rent: groups[p].rent,
        water: groups[p].water,
        electricity: groups[p].electricity,
        other: groups[p].other,
      };
    });
  };

  const chartData = getChartData();
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.billed), 10000) * 1.15 : 10000;

  // 6-Month Summary Calculations
  const total6MoPaid = chartData.reduce((sum, d) => sum + d.paid, 0);
  const total6MoBilled = chartData.reduce((sum, d) => sum + d.billed, 0);
  const avg6MoPaidRevenue = chartData.length > 0 ? Math.round(total6MoPaid / chartData.length) : 0;
  const sixMonthCollectionRate =
    total6MoBilled > 0 ? Number(((total6MoPaid / total6MoBilled) * 100).toFixed(1)) : 0;

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * 600;

    if (svgX >= 55 && svgX <= 580 && chartData.length > 0) {
      const groupWidth = 525 / chartData.length;
      const index = Math.floor((svgX - 55) / groupWidth);
      if (index >= 0 && index < chartData.length) {
        setHoveredChartIndex(index);
        setTooltipPos({
          x: x,
          y: y - 130,
        });
        return;
      }
    }
    setHoveredChartIndex(null);
  };

  // Navigation Handlers for Row 1 Cards (Always Clickable!)
  const handleVacantCardClick = () => {
    if (overviewBuildingFilter !== 'ALL') {
      setSelectedBuildingId(overviewBuildingFilter);
    } else if (buildings.length > 0) {
      // Keep current selectedBuildingId or fallback to first building
      setSelectedBuildingId(buildings[0].id);
    }
    setRoomStatusFilter?.('VACANT');
    setMapSearchQuery?.('ว่าง');
    setActiveTab('map');
  };

  const handleOccupiedCardClick = () => {
    if (overviewBuildingFilter !== 'ALL') {
      setSelectedBuildingId(overviewBuildingFilter);
      setRoomStatusFilter?.('OCCUPIED');
      setMapSearchQuery?.('มีผู้เช่า');
      setActiveTab('map');
    } else {
      setTenantBuildingFilter?.('ALL');
      setActiveTab('tenants');
    }
  };

  const handleUnpaidCardClick = () => {
    setInvoiceStatusFilter?.('UNPAID');
    setInvoiceFilterBuildingId?.(overviewBuildingFilter);
    setActiveTab('invoices');
  };

  return (
    <div className="fade-in">
      {/* Top Filter & Period Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.85rem 1.15rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            htmlFor="overviewBuildingFilter"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            🏢 อาคารที่แสดงผล:
          </label>
          <select
            id="overviewBuildingFilter"
            value={overviewBuildingFilter}
            onChange={(e) => setOverviewBuildingFilter(e.target.value)}
            className={styles.formInput}
            style={{
              minWidth: '210px',
              width: 'auto',
              minHeight: '38px',
              padding: '0.4rem 2rem 0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">ทุกอาคารรวมกัน ({buildings.length} อาคาร)</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {getShortBuildingName(b.name)} ({b.stats?.total || 0} ห้อง)
              </option>
            ))}
          </select>
          {overviewBuildingFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setOverviewBuildingFilter('ALL')}
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Active Billing Period Selector for Workflow & Metrics */}
        {setBillingPeriod && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🗓️ รอบบิลทำงาน:
            </span>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-color)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setBillingPeriod(currentCalendarMonth)}
                style={{
                  border: 'none',
                  padding: '0.28rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeWorkflowPeriod === currentCalendarMonth ? 'var(--primary-color)' : 'transparent',
                  color: activeWorkflowPeriod === currentCalendarMonth ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                เดือนนี้ ({formatPeriodBadge(currentCalendarMonth)})
              </button>
              {nextPayInAdvanceMonth !== currentCalendarMonth && (
                <button
                  type="button"
                  onClick={() => setBillingPeriod(nextPayInAdvanceMonth)}
                  style={{
                    border: 'none',
                    padding: '0.28rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeWorkflowPeriod === nextPayInAdvanceMonth ? 'var(--primary-color)' : 'transparent',
                    color: activeWorkflowPeriod === nextPayInAdvanceMonth ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  รอบถัดไป ({formatPeriodBadge(nextPayInAdvanceMonth)})
                </button>
              )}
            </div>
            <input
              type="month"
              value={activeWorkflowPeriod}
              onChange={(e) => e.target.value && setBillingPeriod(e.target.value)}
              aria-label="เลือกรอบบิล"
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            />
          </div>
        )}
      </div>

      {/* =====================================================================
          ROW 1: Enhanced KPI Cards (ห้องทั้งหมด, ห้องว่าง, ผู้เช่าพัก, ค้างชำระ)
          ===================================================================== */}
      <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {/* 1. Total Rooms Card with Booked & Maintenance Breakdown */}
        <div
          className={styles.statCard}
          style={{
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
          onClick={() => {
            if (overviewBuildingFilter !== 'ALL') {
              setSelectedBuildingId(overviewBuildingFilter);
            }
            setMapSearchQuery?.('');
            setActiveTab('map');
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.statLabel}>ห้องทั้งหมด</span>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏠</span>
            </div>
            <span className={styles.statValue}>{activeStats.totalRooms}</span>
          </div>

          <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* Pill badges for Booked and Maintenance */}
            {(bookedRoomsCount > 0 || maintenanceRoomsCount > 0) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {bookedRoomsCount > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.18rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: 'var(--status-booked-bg, rgba(245, 158, 11, 0.15))',
                      color: 'var(--status-booked, #d97706)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    📌 ติดจอง {bookedRoomsCount} ห้อง
                  </span>
                )}
                {maintenanceRoomsCount > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.18rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: 'var(--status-maintenance-bg, rgba(100, 116, 139, 0.15))',
                      color: 'var(--status-maintenance, #64748b)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                    }}
                  >
                    🔧 ซ่อมบำรุง {maintenanceRoomsCount} ห้อง
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                ว่าง {activeStats.vacantRooms} • มีผู้เช่า {activeStats.occupiedRooms} ห้อง
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              คลิกเพื่อดูผังห้อง ➔
            </span>
          </div>
        </div>

        {/* 2. Vacant Rooms Card (Always Clickable) */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-vacant)',
            borderWidth: '2px',
            cursor: 'pointer',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-vacant-bg))',
          }}
          onClick={handleVacantCardClick}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.statLabel} style={{ color: 'var(--status-vacant)' }}>ห้องว่าง</span>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--status-vacant-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid var(--status-vacant-bg)' }}>✅</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={styles.statValue} style={{ color: 'var(--status-vacant)' }}>{activeStats.vacantRooms}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--status-vacant)', fontWeight: 600 }}>ห้องพร้อมเข้าอยู่</span>
            </div>
          </div>

          <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {bookedRoomsCount > 0 && (
              <span
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.14rem 0.45rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.16)',
                  color: '#b45309',
                }}
              >
                📌 รอเข้าพักอีก {bookedRoomsCount} ห้อง (ติดจอง)
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--status-vacant)', fontWeight: 700 }}>
              คลิกเพื่อดู ➔
            </span>
          </div>
        </div>

        {/* 3. Occupied Rooms Card with Occupancy Rate Badge & Mini Progress Bar (Always Clickable) */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-occupied)',
            borderWidth: '2px',
            cursor: 'pointer',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-occupied-bg))',
          }}
          onClick={handleOccupiedCardClick}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.statLabel} style={{ color: 'var(--status-occupied)' }}>ผู้เช่าพัก</span>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--status-occupied-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid var(--status-occupied-bg)' }}>👤</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={styles.statValue} style={{ color: 'var(--status-occupied)' }}>{activeStats.occupiedRooms}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--status-occupied-bg)',
                  color: 'var(--status-occupied)',
                  border: '1px solid var(--status-occupied)',
                }}
              >
                อัตราเข้าพัก {occupancyRate}%
              </span>
            </div>
          </div>

          <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* Mini Progress Bar */}
            <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, occupancyRate)}%`,
                  backgroundColor: 'var(--status-occupied)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-occupied)', fontWeight: 700 }}>
              คลิกเพื่อดู ➔
            </span>
          </div>
        </div>

        {/* 4. Unpaid Rooms Card (Always Clickable -> Invoices UNPAID + Quick Modal option) */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-unpaid)',
            borderWidth: '2px',
            cursor: 'pointer',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-unpaid-bg))',
          }}
          onClick={handleUnpaidCardClick}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.statLabel} style={{ color: 'var(--status-unpaid)' }}>ค้างชำระ</span>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--status-unpaid-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid var(--status-unpaid-bg)' }}>⚠️</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className={styles.statValue} style={{ color: 'var(--status-unpaid)' }}>{activeStats.unpaidRoomsCount || 0}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--status-unpaid)', fontWeight: 600 }}>ห้องที่มียอดค้าง</span>
            </div>
          </div>

          <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-unpaid)', fontWeight: 700 }}>
              คลิกเพื่อดูบิลค้าง ➔
            </span>
            {(activeStats.unpaidRoomsCount || 0) > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOverdueBuildingFilter(overviewBuildingFilter);
                  setShowOverdueModal(true);
                }}
                style={{
                  border: '1px solid var(--status-unpaid)',
                  background: 'var(--card-bg)',
                  color: 'var(--status-unpaid)',
                  borderRadius: '999px',
                  padding: '0.15rem 0.55rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                สรุปรายห้อง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 2: Upgraded Financial Cards + Monthly Operation Workflow Tracker
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Financial Card 1: รายรับและอัตราการเก็บเงินรอบบิลนี้ */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-vacant)',
            borderWidth: '2px',
            background: 'linear-gradient(135deg, var(--status-vacant-bg), color-mix(in srgb, var(--status-vacant-bg) 45%, var(--card-bg)))',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
              <div>
                <span className={styles.statLabel} style={{ color: 'var(--status-vacant)', display: 'block', marginBottom: '0.2rem' }}>
                  รายรับและอัตราการเก็บเงินรอบบิลนี้
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--status-vacant)',
                    border: '1px solid var(--status-vacant)',
                  }}
                >
                  🗓️ รอบบิล {formatPeriodBadge(effectiveFinancialPeriod)}
                </span>
              </div>
              <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--status-vacant-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>💰</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div>
                <span className={styles.statValue} style={{ color: 'var(--status-vacant)', fontSize: 'clamp(1.4rem, 2.2vw, 1.9rem)' }}>
                  ฿{currentMonthRevenue.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', fontWeight: 600 }}>
                  / ฿{currentPeriodTotalBilled.toLocaleString()}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--status-vacant)',
                  backgroundColor: 'var(--card-bg)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                }}
              >
                เก็บได้แล้ว {currentPeriodCollectionRate}%
              </span>
            </div>

            {/* Smooth Collection Progress Bar */}
            <div style={{ marginTop: '0.65rem' }}>
              <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.18)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${currentPeriodCollectionRate}%`,
                    background: 'linear-gradient(90deg, var(--status-vacant), #059669)',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 500 }}>
                <span>เก็บแล้ว ฿{currentMonthRevenue.toLocaleString()}</span>
                <span>จากยอดออกบิล ฿{currentPeriodTotalBilled.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Operating Estimate after Government Utility Bills */}
          <div
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px dashed rgba(16, 185, 129, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.4rem',
              fontSize: '0.78rem',
            }}
          >
            {hasGovBillsForPeriod ? (
              <>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  🏛️ หักบิลหลวง (฿{totalGovBillCost.toLocaleString()}):
                </span>
                <strong style={{ color: netOperatingEstimate >= 0 ? 'var(--status-vacant)' : 'var(--status-unpaid)', fontSize: '0.85rem' }}>
                  คงเหลือหลังหักบิลหลวง: ฿{netOperatingEstimate.toLocaleString()}
                  {currentPeriodTotalBilled > currentMonthRevenue && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                      (เต็มรอบ ฿{projectedNetAfterGov.toLocaleString()})
                    </span>
                  )}
                </strong>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                  🏛️ ยังไม่ได้บันทึกบิลน้ำ-ไฟหลวงในรอบนี้
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('govbill')}
                  style={{
                    border: 'none',
                    background: 'var(--card-bg)',
                    color: 'var(--status-vacant)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  + บันทึกบิลหลวง ➔
                </button>
              </>
            )}
          </div>
        </div>

        {/* Financial Card 2: ยอดค้างชำระแยกตามรอบบิล */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-unpaid)',
            borderWidth: '2px',
            background: 'linear-gradient(135deg, var(--status-unpaid-bg), color-mix(in srgb, var(--status-unpaid-bg) 45%, var(--card-bg)))',
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
          onClick={() => {
            setOverdueBuildingFilter(overviewBuildingFilter);
            setShowOverdueModal(true);
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span className={styles.statLabel} style={{ color: 'var(--status-unpaid)', display: 'block', marginBottom: '0.15rem' }}>
                  ยอดค้างชำระแยกตามรอบบิล
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  รวมทุกรอบบิลที่ยังไม่ได้ชำระ ({allUnpaidInvoices.length} บิล)
                </span>
              </div>
              <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--status-unpaid-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🔔</span>
            </div>

            <span className={styles.statValue} style={{ color: 'var(--status-unpaid)', fontSize: 'clamp(1.4rem, 2.2vw, 1.9rem)', display: 'block', marginBottom: '0.65rem' }}>
              ฿{totalUnpaidAmount.toLocaleString()}
            </span>

            {/* Two Clear Sub-Items Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--card-bg)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  รอชำระรอบบิลนี้ ({formatPeriodBadge(effectiveFinancialPeriod)})
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                  ฿{currentPeriodUnpaidAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {currentPeriodUnpaidCount} บิล
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--card-bg)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: overduePastPeriodsAmount > 0 ? '1px solid var(--status-unpaid)' : '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--status-unpaid)', fontWeight: 700 }}>
                  ค้างสะสมจากรอบก่อน
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--status-unpaid)', marginTop: '0.15rem' }}>
                  ฿{overduePastPeriodsAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--status-unpaid)' }}>
                  {overduePastPeriodsCount} บิล
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.55rem',
              borderTop: '1px dashed rgba(244, 63, 94, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--status-unpaid)',
              fontWeight: 700,
            }}
          >
            <span>🔍 คลิกดูสรุปรายห้อง</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUnpaidCardClick();
              }}
              style={{
                border: 'none',
                background: 'var(--card-bg)',
                color: 'var(--status-unpaid)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ไปหน้าบิลค้างชำระ ➔
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 2B: Monthly Operation Workflow Tracker (📋 สถานะงานประจำรอบบิล)
          ===================================================================== */}
      <div className={styles.sectionCard} style={{ marginBottom: '1.75rem', padding: '1.35rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.15rem' }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 สถานะงานประจำรอบบิล ({formatPeriodBadge(activeWorkflowPeriod)})
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
              ติดตามความคืบหน้า 3 ขั้นตอนหลักประจำเดือน ตั้งแต่จดมิเตอร์ ออกบิล จนถึงเก็บเงินค่าเช่า
            </p>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '0.3rem 0.7rem',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            ห้องที่มีผู้เช่า: {occupiedRoomsCount} ห้อง
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Step 1: จดมิเตอร์น้ำ-ไฟ */}
          {(() => {
            const isDone = occupiedRoomsCount > 0 && recordedRoomsCount >= occupiedRoomsCount;
            const isInProgress = recordedRoomsCount > 0 && !isDone;
            return (
              <div
                onClick={() => {
                  if (overviewBuildingFilter !== 'ALL') {
                    setSelectedBuildingId(overviewBuildingFilter);
                  }
                  setActiveTab('meter');
                }}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: isDone ? '1.5px solid var(--status-vacant)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    1. จดมิเตอร์น้ำ-ไฟ
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: isDone
                        ? 'var(--status-vacant-bg)'
                        : isInProgress
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'var(--card-bg)',
                      color: isDone
                        ? 'var(--status-vacant)'
                        : isInProgress
                        ? '#d97706'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isDone ? '✅ ครบแล้ว' : isInProgress ? `⏳ ${meterProgressPct}%` : '⚪ รอจดมิเตอร์'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {recordedRoomsCount} / {occupiedRoomsCount} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ห้อง</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDone ? 'var(--status-vacant)' : 'var(--primary-color)' }}>
                    ({meterProgressPct}%)
                  </span>
                </div>

                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${meterProgressPct}%`,
                      backgroundColor: isDone ? 'var(--status-vacant)' : '#f59e0b',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.15rem' }}>
                  ไปหน้าจดมิเตอร์ ➔
                </div>
              </div>
            );
          })()}

          {/* Step 2: ออกบิลใบแจ้งหนี้ */}
          {(() => {
            const isDone = occupiedRoomsCount > 0 && billedRoomsCount >= occupiedRoomsCount;
            const isInProgress = billedRoomsCount > 0 && !isDone;
            return (
              <div
                onClick={() => {
                  setInvoiceFilterPeriod?.(activeWorkflowPeriod);
                  setInvoiceFilterBuildingId?.(overviewBuildingFilter);
                  setInvoiceStatusFilter?.('ALL');
                  setActiveTab('invoices');
                }}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: isDone ? '1.5px solid var(--status-vacant)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    2. ออกบิลใบแจ้งหนี้
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: isDone
                        ? 'var(--status-vacant-bg)'
                        : isInProgress
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'var(--card-bg)',
                      color: isDone
                        ? 'var(--status-vacant)'
                        : isInProgress
                        ? 'var(--status-occupied)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isDone ? '✅ ครบแล้ว' : isInProgress ? `⏳ ${billProgressPct}%` : '⚪ รอออกบิล'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {billedRoomsCount} / {occupiedRoomsCount} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ห้อง</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDone ? 'var(--status-vacant)' : 'var(--status-occupied)' }}>
                    ({billProgressPct}%)
                  </span>
                </div>

                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${billProgressPct}%`,
                      backgroundColor: isDone ? 'var(--status-vacant)' : 'var(--status-occupied)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.15rem' }}>
                  ไปหน้าออกบิล/จัดการบิล ➔
                </div>
              </div>
            );
          })()}

          {/* Step 3: เก็บเงินค่าเช่า */}
          {(() => {
            const isDone = totalPeriodInvoicesCount > 0 && paidInvoicesCount >= totalPeriodInvoicesCount;
            const isInProgress = paidInvoicesCount > 0 && !isDone;
            return (
              <div
                onClick={() => {
                  setInvoiceFilterPeriod?.(activeWorkflowPeriod);
                  setInvoiceFilterBuildingId?.(overviewBuildingFilter);
                  setInvoiceStatusFilter?.(isDone ? 'ALL' : 'UNPAID');
                  setActiveTab('invoices');
                }}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: isDone ? '1.5px solid var(--status-vacant)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    3. เก็บเงินค่าเช่า
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: isDone
                        ? 'var(--status-vacant-bg)'
                        : isInProgress
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'var(--card-bg)',
                      color: isDone
                        ? 'var(--status-vacant)'
                        : isInProgress
                        ? 'var(--status-vacant)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isDone ? '✅ ครบแล้ว' : isInProgress ? `⏳ ${paidProgressPct}%` : '⚪ รอรับชำระ'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {paidInvoicesCount} / {totalPeriodInvoicesCount} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>บิล</span>
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-vacant)' }}>
                    ({paidProgressPct}%)
                  </span>
                </div>

                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${paidProgressPct}%`,
                      backgroundColor: 'var(--status-vacant)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.15rem' }}>
                  ไปหน้ารับชำระเงิน ➔
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* =====================================================================
          ROW 3: Actionable Alerts & Upcoming Events (🔔 แจ้งเตือนสิ่งที่ต้องจัดการ)
          ===================================================================== */}
      <div className={styles.sectionCard} style={{ marginBottom: '2rem', padding: '1.35rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔔 แจ้งเตือนสิ่งที่ต้องจัดการ
            {totalActionableAlerts > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--status-unpaid-bg)',
                  color: 'var(--status-unpaid)',
                }}
              >
                {totalActionableAlerts} รายการ
              </span>
            )}
          </h2>
        </div>

        {totalActionableAlerts === 0 ? (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-vacant-bg)',
              border: '1px solid var(--status-vacant)',
              color: 'var(--status-vacant)',
              fontWeight: 700,
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            ✨ เหตุการณ์ปกติ — ไม่มีบิลเกินกำหนด หรือรายการแจ้งย้ายออก/นัดเข้าพักที่ค้างจัดการ
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Column 1: ⏰ บิลเกินกำหนดชำระ (Overdue Invoices) */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    ⏰ บิลเกินกำหนดชำระ
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: overdueInvoicesAlertList.length > 0 ? 'var(--status-unpaid-bg)' : 'var(--card-bg)',
                      color: overdueInvoicesAlertList.length > 0 ? 'var(--status-unpaid)' : 'var(--text-secondary)',
                    }}
                  >
                    {overdueInvoicesAlertList.length} บิล
                  </span>
                </div>

                {overdueInvoicesAlertList.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem 0', textAlign: 'center' }}>
                    ✅ ไม่มีบิลเกินกำหนดชำระ
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {overdueInvoicesAlertList.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          if (inv.roomId && handleRoomClick) {
                            handleRoomClick(inv.roomId);
                          } else {
                            handleUnpaidCardClick();
                          }
                        }}
                        style={{
                          padding: '0.55rem 0.7rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--card-bg)',
                          borderLeft: '3px solid var(--status-unpaid)',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span>
                            ห้อง {inv.roomNumber} {overviewBuildingFilter === 'ALL' && inv.buildingName ? `(${getShortBuildingName(inv.buildingName)})` : ''}
                          </span>
                          <span style={{ color: 'var(--status-unpaid)' }}>฿{(inv.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                          <span>👤 {inv.tenantName}</span>
                          <span style={{ color: 'var(--status-unpaid)', fontWeight: 600 }}>
                            ครบกำหนด {formatThaiDateNumeric(inv.dueDate)} (เกิน {inv.daysOverdue} วัน)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {overdueInvoicesAlertList.length > 0 && (
                <button
                  type="button"
                  onClick={handleUnpaidCardClick}
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--status-unpaid)',
                    background: 'var(--card-bg)',
                    color: 'var(--status-unpaid)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  จัดการบิลค้างชำระทั้งหมด ({overdueInvoicesAlertList.length}) ➔
                </button>
              )}
            </div>

            {/* Column 2: 🚪 แจ้งย้ายออกล่วงหน้า (Upcoming Move-Outs) */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    🚪 แจ้งย้ายออกล่วงหน้า
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: upcomingMoveOutsList.length > 0 ? 'rgba(245, 158, 11, 0.16)' : 'var(--card-bg)',
                      color: upcomingMoveOutsList.length > 0 ? '#b45309' : 'var(--text-secondary)',
                    }}
                  >
                    {upcomingMoveOutsList.length} ห้อง
                  </span>
                </div>

                {upcomingMoveOutsList.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem 0', textAlign: 'center' }}>
                    ✅ ไม่มีห้องที่แจ้งย้ายออกล่วงหน้า
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {upcomingMoveOutsList.slice(0, 4).map((item) => (
                      <div
                        key={item.roomId}
                        onClick={() => {
                          if (handleRoomClick) {
                            handleRoomClick(item.roomId);
                          } else {
                            setActiveTab('tenants');
                          }
                        }}
                        style={{
                          padding: '0.55rem 0.7rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--card-bg)',
                          borderLeft: '3px solid #f59e0b',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span>
                            ห้อง {item.roomNumber} ({getShortBuildingName(item.buildingName)})
                          </span>
                          <span style={{ color: '#b45309', fontSize: '0.72rem' }}>
                            {item.daysRemaining !== null
                              ? item.daysRemaining > 0
                                ? `อีก ${item.daysRemaining} วัน`
                                : item.daysRemaining === 0
                                ? 'ย้ายออกวันนี้'
                                : `เลยกำหนด ${Math.abs(item.daysRemaining)} วัน`
                              : 'แจ้งออกแล้ว'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                          <span>👤 {item.tenantName}</span>
                          <span>
                            📅 ออก: {item.expectedCheckOutDate ? formatThaiDateNumeric(item.expectedCheckOutDate) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {upcomingMoveOutsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('tenants')}
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #f59e0b',
                    background: 'var(--card-bg)',
                    color: '#b45309',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ดูข้อมูลผู้เช่าแจ้งย้ายออก ➔
                </button>
              )}
            </div>

            {/* Column 3: 📌 รายการจองรอเข้าพัก (Upcoming Check-Ins) */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    📌 รายการจองรอเข้าพัก
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '999px',
                      backgroundColor: upcomingCheckInsList.length > 0 ? 'rgba(59, 130, 246, 0.15)' : 'var(--card-bg)',
                      color: upcomingCheckInsList.length > 0 ? 'var(--status-occupied)' : 'var(--text-secondary)',
                    }}
                  >
                    {upcomingCheckInsList.length} ห้อง
                  </span>
                </div>

                {upcomingCheckInsList.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem 0', textAlign: 'center' }}>
                    ✅ ไม่มีรายการจองค้างเข้าพัก
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {upcomingCheckInsList.slice(0, 4).map((bk) => (
                      <div
                        key={bk.id}
                        onClick={() => {
                          if (bk.roomId && handleRoomClick) {
                            handleRoomClick(bk.roomId);
                          } else {
                            setTenantSubTab?.('bookings');
                            setActiveTab('tenants');
                          }
                        }}
                        style={{
                          padding: '0.55rem 0.7rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--card-bg)',
                          borderLeft: '3px solid var(--status-occupied)',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span>
                            ห้อง {bk.roomNumber} ({getShortBuildingName(bk.buildingName || '')})
                          </span>
                          <span style={{ color: 'var(--status-occupied)', fontSize: '0.72rem' }}>
                            มัดจำ ฿{(bk.depositAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                          <span>👤 {bk.customerName}</span>
                          <span>
                            📅 นัดเข้า: {bk.expectedCheckInDate ? formatThaiDateNumeric(bk.expectedCheckInDate) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {upcomingCheckInsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTenantSubTab?.('bookings');
                    setMapSearchQuery?.('จองแล้ว');
                    setActiveTab('map');
                  }}
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--status-occupied)',
                    background: 'var(--card-bg)',
                    color: 'var(--status-occupied)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ดูห้องติดจองบนแผนผัง ➔
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          ROW 4A: Enhanced 6-Month Revenue Trend Chart Card
          ===================================================================== */}
      <div className={styles.sectionCard} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>วิเคราะห์และแนวโน้มรายรับ (6 เดือนล่าสุด)</h2>

          {/* Tab selectors for view mode */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--border-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setChartViewMode('status')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: chartViewMode === 'status' ? 'var(--card-bg)' : 'transparent',
                color: chartViewMode === 'status' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: chartViewMode === 'status' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              ยอดการชำระเงิน
            </button>
            <button
              onClick={() => setChartViewMode('type')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: chartViewMode === 'type' ? 'var(--card-bg)' : 'transparent',
                color: chartViewMode === 'type' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: chartViewMode === 'type' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              สัดส่วนค่าน้ำ/ค่าไฟ/ค่าเช่า
            </button>
          </div>
        </div>

        {/* 6-Month Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-color)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              รายรับเฉลี่ย {chartData.length || 6} เดือน (ชำระแล้ว)
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-vacant)', marginTop: '0.15rem' }}>
              ฿{avg6MoPaidRevenue.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ เดือน</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              อัตราการเก็บเงินสำเร็จ {chartData.length || 6} เดือน
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-occupied)', marginTop: '0.15rem' }}>
              {sixMonthCollectionRate}%{' '}
              <span style={{ fontSize: '0.73rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                (฿{total6MoPaid.toLocaleString()} / ฿{total6MoBilled.toLocaleString()})
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ต้นทุนบิลหลวง vs เก็บค่าน้ำ-ไฟผู้เช่า ({formatPeriodBadge(effectiveFinancialPeriod)})
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {hasGovBillsForPeriod ? (
                <span>
                  บิลหลวง ฿{totalGovBillCost.toLocaleString()} vs เก็บ ฿{periodTenantUtilityBilled.toLocaleString()}{' '}
                  <strong style={{ color: periodTenantUtilityBilled - totalGovBillCost >= 0 ? 'var(--status-vacant)' : 'var(--status-unpaid)' }}>
                    ({periodTenantUtilityBilled - totalGovBillCost >= 0 ? '+' : ''}฿{(periodTenantUtilityBilled - totalGovBillCost).toLocaleString()})
                  </strong>
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>
                  เรียกเก็บค่าน้ำ-ไฟผู้เช่า: <strong style={{ color: 'var(--text-primary)' }}>฿{periodTenantUtilityBilled.toLocaleString()}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Legends */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          {chartViewMode === 'status' ? (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-vacant)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ชำระแล้ว</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-unpaid)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค้างชำระ</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-info)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าเช่า</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-danger)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าไฟ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-success-text)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าน้ำ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-purple)' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>อื่นๆ</span>
              </div>
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            📊 ยังไม่มีข้อมูลบิลสำหรับนำมาพล็อตกราฟสรุปรายรับ
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <svg
              viewBox="0 0 600 300"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredChartIndex(null)}
            >
              {/* Y-Axis Grid Lines & Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const yVal = maxVal * ratio;
                const yPos = 250 - ratio * 200;
                return (
                  <g key={index}>
                    <line x1="55" y1={yPos} x2="580" y2={yPos} stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
                    <text x="45" y={yPos + 4} fill="var(--text-secondary)" fontSize="11" textAnchor="end">
                      {yVal >= 1000 ? `${(yVal / 1000).toFixed(0)}k` : yVal.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Bars and X-Axis Labels */}
              {chartData.map((d, index) => {
                const groupWidth = 525 / chartData.length;
                const groupX = 55 + index * groupWidth;
                const centerOffset = groupWidth / 2;
                const opacityVal = hoveredChartIndex === null || hoveredChartIndex === index ? 1 : 0.45;

                if (chartViewMode === 'status') {
                  const barWidth = 20;
                  const paidH = (d.paid / maxVal) * 200;
                  const paidY = 250 - paidH;
                  const unpaidH = (d.unpaid / maxVal) * 200;
                  const unpaidY = 250 - unpaidH;

                  const paidX = groupX + centerOffset - barWidth - 4;
                  const unpaidX = groupX + centerOffset + 4;

                  return (
                    <g key={index}>
                      {/* Paid Bar */}
                      <rect
                        x={paidX}
                        y={paidY}
                        width={barWidth}
                        height={Math.max(paidH, 2)}
                        rx="4"
                        fill="var(--status-vacant)"
                        style={{
                          opacity: opacityVal,
                          transition: 'opacity 0.2s, transform 0.2s',
                          transformOrigin: `${paidX + barWidth / 2}px 250px`,
                          transform: hoveredChartIndex === index ? 'scaleX(1.05)' : 'none',
                        }}
                      />

                      {/* Unpaid Bar */}
                      <rect
                        x={unpaidX}
                        y={unpaidY}
                        width={barWidth}
                        height={Math.max(unpaidH, 2)}
                        rx="4"
                        fill="var(--status-unpaid)"
                        style={{
                          opacity: opacityVal,
                          transition: 'opacity 0.2s, transform 0.2s',
                          transformOrigin: `${unpaidX + barWidth / 2}px 250px`,
                          transform: hoveredChartIndex === index ? 'scaleX(1.05)' : 'none',
                        }}
                      />

                      {/* X-Axis Labels */}
                      <text x={groupX + centerOffset} y="270" fill="var(--text-primary)" fontSize="12" fontWeight="600" textAnchor="middle">
                        {d.label}
                      </text>
                    </g>
                  );
                } else {
                  // Stacked Category Bar
                  const barWidth = 28;
                  const barX = groupX + centerOffset - barWidth / 2;

                  const rentH = (d.rent / maxVal) * 200;
                  const rentY = 250 - rentH;

                  const elecH = (d.electricity / maxVal) * 200;
                  const elecY = rentY - elecH;

                  const waterH = (d.water / maxVal) * 200;
                  const waterY = elecY - waterH;

                  const otherH = (d.other / maxVal) * 200;
                  const otherY = waterY - otherH;

                  return (
                    <g key={index}>
                      {/* Rent segment */}
                      <rect
                        x={barX}
                        y={rentY}
                        width={barWidth}
                        height={Math.max(rentH, 0)}
                        fill="var(--status-info)"
                        style={{
                          opacity: opacityVal,
                          transition: 'all 0.2s',
                        }}
                      />
                      {/* Electricity segment */}
                      <rect
                        x={barX}
                        y={elecY}
                        width={barWidth}
                        height={Math.max(elecH, 0)}
                        fill="var(--status-danger)"
                        style={{
                          opacity: opacityVal,
                          transition: 'all 0.2s',
                        }}
                      />
                      {/* Water segment */}
                      <rect
                        x={barX}
                        y={waterY}
                        width={barWidth}
                        height={Math.max(waterH, 0)}
                        fill="var(--status-success-text)"
                        style={{
                          opacity: opacityVal,
                          transition: 'all 0.2s',
                        }}
                      />
                      {/* Other segment */}
                      {otherH > 0 && (
                        <rect
                          x={barX}
                          y={otherY}
                          width={barWidth}
                          height={otherH}
                          fill="var(--accent-purple)"
                          style={{
                            opacity: opacityVal,
                            transition: 'all 0.2s',
                          }}
                        />
                      )}

                      {/* Rounded Cap */}
                      {d.billed > 0 && (
                        <rect
                          x={barX}
                          y={250 - (d.billed / maxVal) * 200}
                          width={barWidth}
                          height="4"
                          rx="2"
                          fill={otherH > 0 ? 'var(--accent-purple)' : waterH > 0 ? 'var(--status-success-text)' : elecH > 0 ? 'var(--status-danger)' : 'var(--status-info)'}
                          style={{
                            opacity: opacityVal,
                            transition: 'all 0.2s',
                          }}
                        />
                      )}

                      {/* X-Axis Labels */}
                      <text x={groupX + centerOffset} y="270" fill="var(--text-primary)" fontSize="12" fontWeight="600" textAnchor="middle">
                        {d.label}
                      </text>
                    </g>
                  );
                }
              })}

              {/* Bottom Baseline */}
              <line x1="55" y1="250" x2="580" y2="250" stroke="var(--text-secondary)" strokeWidth="1.5" />
            </svg>

            {/* Interactive Tooltip Overlay */}
            {hoveredChartIndex !== null && chartData[hoveredChartIndex] && (
              <div
                style={{
                  position: 'absolute',
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.8rem',
                  zIndex: 50,
                  minWidth: '170px',
                  lineHeight: '1.4',
                  transition: 'left 0.1s ease-out, top 0.1s ease-out',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--status-info)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                  🗓️ {chartData[hoveredChartIndex].label}
                </div>
                {chartViewMode === 'status' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--status-success)' }}>
                      <span>ชำระแล้ว:</span>
                      <strong>{chartData[hoveredChartIndex].paid.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--status-danger)' }}>
                      <span>ค้างชำระ:</span>
                      <strong>{chartData[hoveredChartIndex].unpaid.toLocaleString()} บ.</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--status-info)' }}>
                      <span>ค่าเช่าห้อง:</span>
                      <strong>{chartData[hoveredChartIndex].rent.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--status-danger)' }}>
                      <span>ค่าไฟฟ้า:</span>
                      <strong>{chartData[hoveredChartIndex].electricity.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--status-success)' }}>
                      <span>ค่าน้ำประปา:</span>
                      <strong>{chartData[hoveredChartIndex].water.toLocaleString()} บ.</strong>
                    </div>
                    {chartData[hoveredChartIndex].other > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--accent-purple)' }}>
                        <span>อื่นๆ:</span>
                        <strong>{chartData[hoveredChartIndex].other.toLocaleString()} บ.</strong>
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.2)', fontWeight: 700 }}>
                  <span>รวมเรียกเก็บ:</span>
                  <span>{chartData[hoveredChartIndex].billed.toLocaleString()} บ.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Card */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>เมนูด่วน (Quick Actions)</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setActiveTab('map')}>
            <Icons.Map /> ดูสถานะตึก/ห้องพัก
          </button>
          <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={() => setActiveTab('meter')}>
            <Icons.Meter /> จดมิเตอร์น้ำ-ไฟรายเดือน
          </button>
          <button className={`${styles.btn}`} style={{ backgroundColor: 'var(--accent-purple)', color: 'white', boxShadow: 'var(--shadow-glow-purple, 0 4px 15px rgba(124, 58, 237, 0.4))' }} onClick={() => setActiveTab('invoices')}>
            <Icons.Invoice /> จัดการบิลและออกบิล
          </button>
        </div>
      </div>

      {/* =====================================================================
          ROW 4B: Interactive Building Summary Cards (สรุปข้อมูลรายอาคาร)
          ===================================================================== */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>สรุปข้อมูลรายอาคาร</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            คลิกที่การ์ดอาคารเพื่อเปิดดูแผนผังห้องพัก
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {buildings.map((b) => {
            const bUnpaidInvoices = invoices.filter((inv) => {
              const bId = inv.room?.floor?.building?.id || inv.room?.floor?.buildingId;
              return bId === b.id && (inv.status === 'UNPAID' || inv.status === 'OVERDUE');
            });
            const bUnpaidRoomsCount = new Set(bUnpaidInvoices.map((inv) => inv.roomId)).size;
            const bUnpaidTotal = bUnpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
            const bBookedCount = b.stats?.booked || 0;
            const bMaintenanceCount = b.stats?.maintenance || 0;
            const bOccRate = b.stats?.total > 0 ? Math.round((b.stats.occupied / b.stats.total) * 100) : 0;
            const isFilteredThisBuilding = overviewBuildingFilter === b.id;

            return (
              <div
                key={b.id}
                className={styles.buildingSummaryCard}
                onClick={() => {
                  setSelectedBuildingId(b.id);
                  setMapSearchQuery?.('');
                  setActiveTab('map');
                }}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderColor: isFilteredThisBuilding ? 'var(--primary-color)' : undefined,
                  borderWidth: isFilteredThisBuilding ? '2px' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <h3 className={styles.buildingSummaryCardTitle} style={{ margin: 0 }}>
                      🏢 {b.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ดูผังห้อง ➔
                    </span>
                  </div>

                  {/* Unpaid Status Badge + Booked/Maintenance Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                    {bUnpaidRoomsCount > 0 ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverdueBuildingFilter(b.id);
                          setShowOverdueModal(true);
                        }}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.18rem 0.55rem',
                          borderRadius: '999px',
                          backgroundColor: 'var(--status-unpaid-bg)',
                          color: 'var(--status-unpaid)',
                          border: '1px solid var(--status-unpaid)',
                        }}
                      >
                        ⚠️ ค้างชำระ {bUnpaidRoomsCount} ห้อง (฿{bUnpaidTotal.toLocaleString()})
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.18rem 0.55rem',
                          borderRadius: '999px',
                          backgroundColor: 'var(--status-vacant-bg)',
                          color: 'var(--status-vacant)',
                        }}
                      >
                        ✅ เก็บเงินครบแล้ว
                      </span>
                    )}

                    {bBookedCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.18rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(245, 158, 11, 0.16)',
                          color: '#b45309',
                        }}
                      >
                        📌 ติดจอง {bBookedCount}
                      </span>
                    )}

                    {bMaintenanceCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.18rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(100, 116, 139, 0.16)',
                          color: '#64748b',
                        }}
                      >
                        🔧 ซ่อม {bMaintenanceCount}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ห้องทั้งหมด:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{b.stats.total} ห้อง</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ห้องว่าง:</span>
                      <strong style={{ color: 'var(--status-vacant)' }}>{b.stats.vacant} ห้อง</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ผู้เช่าพัก (อัตราเข้าพัก {bOccRate}%):</span>
                      <strong style={{ color: 'var(--status-occupied)' }}>{b.stats.occupied} ห้อง</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>อัตราค่าน้ำ / ค่าไฟ:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{b.waterRate} / {b.electricityRate} บาท</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={styles.occupancyBar}>
                    <div
                      className={styles.occupancyBarFill}
                      style={{ width: `${bOccRate}%` }}
                    />
                  </div>

                  {/* Card Footer Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverviewBuildingFilter(isFilteredThisBuilding ? 'ALL' : b.id);
                      }}
                      style={{
                        border: '1px solid var(--border-color)',
                        background: isFilteredThisBuilding ? 'var(--primary-color)' : 'var(--bg-color)',
                        color: isFilteredThisBuilding ? '#ffffff' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isFilteredThisBuilding ? '✓ กำลังกรองตึกนี้ (ดูทุกตึก)' : 'กรองแดชบอร์ดเฉพาะตึกนี้'}
                    </button>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                      ดูผังห้อง ➔
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
