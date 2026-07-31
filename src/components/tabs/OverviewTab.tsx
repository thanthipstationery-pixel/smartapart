'use client';

import React, { useState } from 'react';
import { getShortBuildingName } from '@/lib/thaiDate';

interface OverviewTabProps {
  activeStats: any;
  overviewBuildingFilter: string;
  setOverviewBuildingFilter: (val: string) => void;
  buildings: any[];
  invoices: any[];
  setSelectedBuildingId: (val: string) => void;
  setActiveTab: (tab: any) => void;
  setOverdueBuildingFilter: (val: string) => void;
  setShowOverdueModal: (val: boolean) => void;
  styles: any;
  Icons: any;
}

export default function OverviewTab({
  activeStats,
  overviewBuildingFilter,
  setOverviewBuildingFilter,
  buildings,
  invoices,
  setSelectedBuildingId,
  setActiveTab,
  setOverdueBuildingFilter,
  setShowOverdueModal,
  styles,
  Icons,
}: OverviewTabProps) {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [chartViewMode, setChartViewMode] = useState<'status' | 'type'>('status');

  if (!activeStats) return null;

  const isUnpaidClickable = overviewBuildingFilter === 'ALL' || (activeStats.unpaidRoomsCount > 0);

  const getChartData = () => {
    const filtered = invoices.filter((inv) => {
      if (overviewBuildingFilter === 'ALL') return true;
      return inv.room?.floor?.building?.id === overviewBuildingFilter;
    });

    const groups: { [period: string]: { billed: number; paid: number; unpaid: number; rent: number; water: number; electricity: number; other: number } } = {};

    filtered.forEach((inv) => {
      const period = inv.billingPeriod;
      if (!groups[period]) {
        groups[period] = { billed: 0, paid: 0, unpaid: 0, rent: 0, water: 0, electricity: 0, other: 0 };
      }
      groups[period].billed += inv.totalAmount;
      groups[period].rent += inv.rentCost || 0;
      groups[period].water += inv.waterCost || 0;
      groups[period].electricity += inv.electricityCost || 0;
      groups[period].other += inv.otherCost || 0;

      if (inv.status === 'PAID') {
        groups[period].paid += inv.totalAmount;
      } else {
        groups[period].unpaid += inv.totalAmount;
      }
    });

    const periods = Object.keys(groups).sort();
    const lastPeriods = periods.slice(-6);

    return lastPeriods.map((p) => {
      const [year, month] = p.split('-');
      const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
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

  return (
    <div className="fade-in">
      {/* Apartment Dropdown Selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <label htmlFor="overviewBuildingFilter" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          เลือกดูข้อมูลอาคาร:
        </label>
        <select
          id="overviewBuildingFilter"
          value={overviewBuildingFilter}
          onChange={(e) => setOverviewBuildingFilter(e.target.value)}
          className={styles.formInput}
          style={{ minWidth: '240px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">ทั้งหมด</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {getShortBuildingName(b.name)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Rooms Card */}
        <div className={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel}>ห้องทั้งหมด</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏠</span>
          </div>
          <span className={styles.statValue}>{activeStats.totalRooms}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>ห้องพัก</span>
        </div>

        {/* Vacant Rooms card */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-vacant)',
            borderWidth: '2px',
            cursor: overviewBuildingFilter !== 'ALL' ? 'pointer' : 'default',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-vacant-bg))',
          }}
          onClick={
            overviewBuildingFilter !== 'ALL'
              ? () => {
                  setSelectedBuildingId(overviewBuildingFilter);
                  setActiveTab('map');
                }
              : undefined
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel} style={{ color: 'var(--status-vacant)' }}>ห้องว่าง</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'var(--status-vacant-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid rgba(16,185,129,0.2)' }}>✅</span>
          </div>
          <span className={styles.statValue} style={{ color: 'var(--status-vacant)' }}>{activeStats.vacantRooms}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-vacant)', marginTop: '0.35rem', opacity: 0.8 }}>
            ห้องพัก {overviewBuildingFilter !== 'ALL' && <span style={{ fontWeight: 700 }}>→ ดูแผนผัง</span>}
          </span>
        </div>

        {/* Occupied Rooms card */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-occupied)',
            borderWidth: '2px',
            cursor: overviewBuildingFilter !== 'ALL' ? 'pointer' : 'default',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-occupied-bg))',
          }}
          onClick={
            overviewBuildingFilter !== 'ALL'
              ? () => {
                  setSelectedBuildingId(overviewBuildingFilter);
                  setActiveTab('map');
                }
              : undefined
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel} style={{ color: 'var(--status-occupied)' }}>ผู้เช่าพัก</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'var(--status-occupied-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid rgba(59,130,246,0.2)' }}>👤</span>
          </div>
          <span className={styles.statValue} style={{ color: 'var(--status-occupied)' }}>{activeStats.occupiedRooms}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-occupied)', marginTop: '0.35rem', opacity: 0.8 }}>
            ห้องพัก {overviewBuildingFilter !== 'ALL' && <span style={{ fontWeight: 700 }}>→ ดูแผนผัง</span>}
          </span>
        </div>

        {/* Unpaid Rooms card */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-unpaid)',
            borderWidth: '2px',
            cursor: isUnpaidClickable ? 'pointer' : 'default',
            background: 'linear-gradient(135deg, var(--card-bg) 60%, var(--status-unpaid-bg))',
          }}
          onClick={
            isUnpaidClickable
              ? () => {
                  setOverdueBuildingFilter(overviewBuildingFilter);
                  setShowOverdueModal(true);
                }
              : undefined
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel} style={{ color: 'var(--status-unpaid)' }}>ค้างชำระ</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'var(--status-unpaid-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1px solid rgba(244,63,94,0.2)' }}>⚠️</span>
          </div>
          <span className={styles.statValue} style={{ color: 'var(--status-unpaid)' }}>{activeStats.unpaidRoomsCount || 0}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-unpaid)', marginTop: '0.35rem', opacity: 0.8 }}>
            ห้องพัก {isUnpaidClickable && <span style={{ fontWeight: 700 }}>→ ดูทั้งหมด</span>}
          </span>
        </div>
      </div>

      {/* Revenue Summaries */}
      <div className={styles.statsGrid} style={{ marginBottom: '2.5rem' }}>
        {/* Monthly Revenue Card */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-vacant)',
            borderWidth: '2px',
            background: 'linear-gradient(135deg, var(--status-vacant-bg), color-mix(in srgb, var(--status-vacant-bg) 50%, var(--card-bg)))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel} style={{ color: 'var(--status-vacant)' }}>รายรับเดือนนี้</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>💰</span>
          </div>
          <span className={styles.statValue} style={{ color: 'var(--status-vacant)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}>
            {(activeStats.currentMonthRevenue || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-vacant)', marginTop: '0.35rem', opacity: 0.8 }}>บาท (ชำระแล้ว)</span>
        </div>

        {/* Unpaid Amount card */}
        <div
          className={styles.statCard}
          style={{
            borderColor: 'var(--status-unpaid)',
            borderWidth: '2px',
            background: 'linear-gradient(135deg, var(--status-unpaid-bg), color-mix(in srgb, var(--status-unpaid-bg) 50%, var(--card-bg)))',
            cursor: isUnpaidClickable ? 'pointer' : 'default',
          }}
          onClick={
            isUnpaidClickable
              ? () => {
                  setOverdueBuildingFilter(overviewBuildingFilter);
                  setShowOverdueModal(true);
                }
              : undefined
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className={styles.statLabel} style={{ color: 'var(--status-unpaid)' }}>ยอดค้างชำระ</span>
            <span style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🔔</span>
          </div>
          <span className={styles.statValue} style={{ color: 'var(--status-unpaid)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}>
            {(activeStats.totalUnpaidAmount || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-unpaid)', marginTop: '0.35rem', opacity: 0.8 }}>
            บาท {isUnpaidClickable && <span style={{ fontWeight: 700 }}>→ ดูทั้งหมด</span>}
          </span>
        </div>
      </div>

      {/* Revenue Trend Chart Card */}
      <div className={styles.sectionCard} style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>วิเคราะห์และแนวโน้มรายรับ</h2>

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
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#3b82f6' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าเช่า</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ef4444' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าไฟ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#0d9488' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าน้ำ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#8b5cf6' }}></span>
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
                        fill="#3b82f6"
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
                        fill="#ef4444"
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
                        fill="#0d9488"
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
                          fill="#8b5cf6"
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
                          fill={otherH > 0 ? '#8b5cf6' : waterH > 0 ? '#0d9488' : elecH > 0 ? '#ef4444' : '#3b82f6'}
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
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                  🗓️ {chartData[hoveredChartIndex].label}
                </div>
                {chartViewMode === 'status' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#34d399' }}>
                      <span>ชำระแล้ว:</span>
                      <strong>{chartData[hoveredChartIndex].paid.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#f87171' }}>
                      <span>ค้างชำระ:</span>
                      <strong>{chartData[hoveredChartIndex].unpaid.toLocaleString()} บ.</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#60a5fa' }}>
                      <span>ค่าเช่าห้อง:</span>
                      <strong>{chartData[hoveredChartIndex].rent.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#f87171' }}>
                      <span>ค่าไฟฟ้า:</span>
                      <strong>{chartData[hoveredChartIndex].electricity.toLocaleString()} บ.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#2dd4bf' }}>
                      <span>ค่าน้ำประปา:</span>
                      <strong>{chartData[hoveredChartIndex].water.toLocaleString()} บ.</strong>
                    </div>
                    {chartData[hoveredChartIndex].other > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#a78bfa' }}>
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
          <button className={`${styles.btn}`} style={{ backgroundColor: 'var(--accent-purple)', color: 'white', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)' }} onClick={() => setActiveTab('invoices')}>
            <Icons.Invoice /> จัดการบิลและออกบิล
          </button>
        </div>
      </div>

      {/* Buildings Occupancy Summary */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>ข้อมูลห้องพักแต่ละอาคาร</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {buildings.map((b) => (
            <div key={b.id} className={styles.buildingSummaryCard}>
              <h3 className={styles.buildingSummaryCardTitle}>🏢 {b.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ห้องทั้งหมด:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{b.stats.total} ห้อง</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ห้องว่าง:</span>
                  <strong style={{ color: 'var(--status-vacant)' }}>{b.stats.vacant} ห้อง</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ผู้เช่าพัก:</span>
                  <strong style={{ color: 'var(--status-occupied)' }}>{b.stats.occupied} ห้อง</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>อัตราค่าน้ำ / ค่าไฟ:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{b.waterRate} / {b.electricityRate} บาท</strong>
                </div>
              </div>
              <div className={styles.occupancyBar}>
                <div 
                  className={styles.occupancyBarFill} 
                  style={{ width: `${b.stats.total > 0 ? Math.round((b.stats.occupied / b.stats.total) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
