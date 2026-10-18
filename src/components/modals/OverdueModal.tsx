'use client';

import React from 'react';
import { formatThaiBillingPeriod, formatThaiDateNumeric, getShortBuildingName, formatPhone } from '@/lib/thaiDate';

interface OverdueModalProps {
  showOverdueModal: boolean;
  setShowOverdueModal: (val: boolean) => void;
  invoices: any[];
  buildings: any[];
  overdueBuildingFilter: string;
  setOverdueBuildingFilter: (val: string) => void;
  setSelectedInvoice: (val: any) => void;
  setPaymentAmount: (val: string) => void;
  setShowPaymentModal: (val: boolean) => void;
  styles: any;
  isViewer?: boolean;
}

export default function OverdueModal({
  showOverdueModal,
  setShowOverdueModal,
  invoices,
  buildings,
  overdueBuildingFilter,
  setOverdueBuildingFilter,
  setSelectedInvoice,
  setPaymentAmount,
  setShowPaymentModal,
  styles,
  isViewer = false,
}: OverdueModalProps) {
  if (!showOverdueModal) return null;

  const allUnpaidList = invoices.filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE');
  const filteredOverdueList = allUnpaidList.filter(
    (inv) =>
      overdueBuildingFilter === 'ALL' ||
      (inv.room?.floor?.buildingId || inv.room?.floor?.building?.id) === overdueBuildingFilter
  );
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const overduePastDueCount = filteredOverdueList.filter((inv) => {
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < startOfToday.getTime();
  }).length;
  const totalFilteredAmount = filteredOverdueList.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const uniqueRoomsCount = new Set(filteredOverdueList.map((inv) => inv.roomId || inv.room?.number)).size;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalCard} ${styles.overdueModalCard}`}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle} style={{ color: 'var(--status-unpaid)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <span>⚠️</span>
              <span>รายการค้างชำระทั้งหมด</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              สรุปบิลค้างชำระแยกตามอาคาร พร้อมบันทึกรับชำระเงินทันที
            </p>
          </div>
          <button className={styles.modalClose} onClick={() => setShowOverdueModal(false)} aria-label="ปิด">
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Summary Banner */}
          <div className={styles.overdueSummaryStrip}>
            <div className={styles.overdueSummaryBox}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                จำนวนบิลค้างชำระ ({overdueBuildingFilter === 'ALL' ? 'ทุกอาคาร' : getShortBuildingName(buildings.find((b) => b.id === overdueBuildingFilter)?.name)})
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {filteredOverdueList.length} รายการ
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ({uniqueRoomsCount} ห้อง)
                </span>
                {overduePastDueCount > 0 && (
                  <span className={styles.overduePastDuePill}>
                    เกินกำหนด {overduePastDueCount}
                  </span>
                )}
              </div>
            </div>

            <div className={`${styles.overdueSummaryBox} ${styles.overdueSummaryBoxDanger}`}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--status-unpaid)' }}>
                ยอดค้างชำระรวมสุทธิ
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-unpaid)', letterSpacing: '-0.02em' }}>
                ฿{totalFilteredAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Building selector inside modal */}
          <div className={styles.overdueFilterBar}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.15rem' }}>
              🏢 อาคาร:
            </span>
            <button
              type="button"
              onClick={() => setOverdueBuildingFilter('ALL')}
              className={`${styles.btn} ${styles.overdueFilterPill} ${overdueBuildingFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
            >
              <span>ทั้งหมด</span>
              <span className={styles.overdueFilterCount}>{allUnpaidList.length}</span>
            </button>
            {buildings.map((b) => {
              const bCount = allUnpaidList.filter(
                (inv) => (inv.room?.floor?.buildingId || inv.room?.floor?.building?.id) === b.id
              ).length;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOverdueBuildingFilter(b.id)}
                  className={`${styles.btn} ${styles.overdueFilterPill} ${overdueBuildingFilter === b.id ? styles.btnPrimary : styles.btnSecondary}`}
                >
                  <span>{getShortBuildingName(b.name)}</span>
                  <span className={styles.overdueFilterCount}>{bCount}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Table View (> 768px) */}
          <div className={styles.overdueDesktopTableWrap}>
            <table className={styles.overdueTable}>
              <thead>
                <tr>
                  <th>ห้องพัก</th>
                  <th>ตึก</th>
                  <th>ผู้เช่า</th>
                  <th>รอบบิล</th>
                  <th style={{ textAlign: 'right' }}>ยอดเงินค้าง</th>
                  <th>ครบกำหนด</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverdueList.map((inv) => {
                  const due = inv.dueDate ? new Date(inv.dueDate) : null;
                  if (due) due.setHours(0, 0, 0, 0);
                  const isPastDue = Boolean(due && due.getTime() < startOfToday.getTime());

                  return (
                    <tr key={inv.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={styles.overdueRoomBadge}>{inv.room.number}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={styles.overdueBuildingBadge}>
                          {getShortBuildingName(inv.room.floor.building.name)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {inv.tenant.name}
                        </div>
                        {inv.tenant.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
                            📞 {formatPhone(inv.tenant.phone)}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.billingPeriod}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {formatThaiBillingPeriod(inv.billingPeriod)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.95rem', color: 'var(--status-unpaid)' }}>
                        ฿{inv.totalAmount.toLocaleString()}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: isPastDue ? 'var(--status-unpaid)' : 'var(--text-primary)' }}>
                          {formatThaiDateNumeric(inv.dueDate)}
                        </div>
                        {isPastDue && (
                          <div style={{ marginTop: '0.2rem' }}>
                            <span className={styles.overduePastDuePill}>เกินกำหนด</span>
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSuccess}`}
                          disabled={isViewer}
                          style={{
                            padding: '0.42rem 0.9rem',
                            fontSize: '0.8rem',
                            borderRadius: '9999px',
                            whiteSpace: 'nowrap',
                            ...(isViewer ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                          }}
                          onClick={() => {
                            if (isViewer) return;
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.totalAmount.toString());
                            setShowPaymentModal(true);
                          }}
                        >
                          {isViewer ? '🔒 ตรวจการ' : '💳 ชำระเงิน'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOverdueList.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 1rem', borderLeft: '1px solid var(--border-color)' }}>
                      🎉 ไม่มีรายการค้างชำระในอาคารที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Structured Card View (<= 768px) */}
          <div className={styles.overdueMobileList}>
            {filteredOverdueList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                🎉 ไม่มีรายการค้างชำระในอาคารที่เลือก
              </div>
            ) : (
              filteredOverdueList.map((inv) => {
                const due = inv.dueDate ? new Date(inv.dueDate) : null;
                if (due) due.setHours(0, 0, 0, 0);
                const isPastDue = Boolean(due && due.getTime() < startOfToday.getTime());

                return (
                  <div key={inv.id} className={styles.overdueMobileCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0 }}>
                        <span className={styles.overdueRoomBadge}>ห้อง {inv.room.number}</span>
                        <span className={styles.overdueBuildingBadge}>
                          {getShortBuildingName(inv.room.floor.building.name)}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          รอบ {inv.billingPeriod}
                        </span>
                      </div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-unpaid)', whiteSpace: 'nowrap' }}>
                        ฿{inv.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.83rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        👤 {inv.tenant.name}
                      </span>
                      {inv.tenant.phone && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          📞 {formatPhone(inv.tenant.phone)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                        <span style={{ color: isPastDue ? 'var(--status-unpaid)' : 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          📅 ครบกำหนด {formatThaiDateNumeric(inv.dueDate)}
                        </span>
                        {isPastDue && (
                          <span className={styles.overduePastDuePill}>เกินกำหนด</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSuccess}`}
                        disabled={isViewer}
                        style={{
                          padding: '0.38rem 0.85rem',
                          fontSize: '0.78rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          ...(isViewer ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                        }}
                        onClick={() => {
                          if (isViewer) return;
                          setSelectedInvoice(inv);
                          setPaymentAmount(inv.totalAmount.toString());
                          setShowPaymentModal(true);
                        }}
                      >
                        {isViewer ? '🔒 ตรวจการ' : '💳 ชำระเงิน'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowOverdueModal(false)}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
