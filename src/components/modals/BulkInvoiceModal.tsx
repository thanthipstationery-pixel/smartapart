'use client';

import React from 'react';
import { formatThaiBillingPeriod, formatThaiDateNumeric } from '@/lib/thaiDate';

interface BulkInvoiceModalProps {
  showBulkBillModal: boolean;
  setShowBulkBillModal: (val: boolean) => void;
  bulkBillPeriod: string;
  setBulkBillPeriod: (val: string) => void;
  fetchBulkRooms: (period: string) => void;
  bulkBillDueDate: string;
  setBulkBillDueDate: (val: string) => void;
  bulkBuildingFilter: string;
  setBulkBuildingFilter: (val: string) => void;
  buildings: any[];
  bulkStatusFilter: string;
  setBulkStatusFilter: (val: string) => void;
  bulkRoomList: any[];
  bulkExtraFees: any;
  addBulkFeeRow: (roomId: string) => void;
  updateBulkFee: (roomId: string, index: number, field: 'name' | 'amount', value: string) => void;
  removeBulkFeeRow: (roomId: string, index: number) => void;
  bulkRoomLoading: boolean;
  bulkResult: any;
  bulkGenerating: boolean;
  handleBulkGenerate: () => void;
  styles: any;
}

export default function BulkInvoiceModal({
  showBulkBillModal,
  setShowBulkBillModal,
  bulkBillPeriod,
  setBulkBillPeriod,
  fetchBulkRooms,
  bulkBillDueDate,
  setBulkBillDueDate,
  bulkBuildingFilter,
  setBulkBuildingFilter,
  buildings,
  bulkStatusFilter,
  setBulkStatusFilter,
  bulkRoomList,
  bulkExtraFees,
  addBulkFeeRow,
  updateBulkFee,
  removeBulkFeeRow,
  bulkRoomLoading,
  bulkResult,
  bulkGenerating,
  handleBulkGenerate,
  styles,
}: BulkInvoiceModalProps) {
  if (!showBulkBillModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '900px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ ออกบิลค่าเช่าพร้อมกันทุกห้อง (Bulk Bill Generation)
          </h2>
          <button className={styles.modalClose} onClick={() => setShowBulkBillModal(false)}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody} style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {/* Header Controls: Billing Period & Due Date Selection */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--bg-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
            }}
          >
            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label className={styles.formLabel}>
                📅 เลือกรอบบิลประจำเดือน <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiBillingPeriod(bulkBillPeriod)})</span> *
              </label>
              <input
                type="month"
                className={styles.formInput}
                value={bulkBillPeriod}
                onChange={(e) => {
                  setBulkBillPeriod(e.target.value);
                  fetchBulkRooms(e.target.value);
                }}
              />
            </div>

            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label className={styles.formLabel}>
                ⏰ วันที่ครบกำหนดชำระ <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(bulkBillDueDate)})</span> *
              </label>
              <input
                type="date"
                className={styles.formInput}
                value={bulkBillDueDate}
                onChange={(e) => setBulkBillDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Dual Filter Bars: Apartment & Invoice Status */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginBottom: '1rem',
              backgroundColor: 'var(--bg-color)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Row 1: Building Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '95px' }}>🏢 อพาร์ทเมนท์:</span>
              <button
                type="button"
                onClick={() => setBulkBuildingFilter('ALL')}
                className={`${styles.btn} ${bulkBuildingFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                🏢 ทั้งหมด
              </button>
              {buildings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBulkBuildingFilter(b.id)}
                  className={`${styles.btn} ${bulkBuildingFilter === b.id ? styles.btnPrimary : styles.btnSecondary}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Row 2: Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '95px' }}>📋 สถานะบิล:</span>
              <button
                type="button"
                onClick={() => setBulkStatusFilter('ALL')}
                className={`${styles.btn} ${bulkStatusFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                📋 ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setBulkStatusFilter('UNPAID_ONLY')}
                className={`${styles.btn} ${bulkStatusFilter === 'UNPAID_ONLY' ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                ⏳ ยังไม่ได้ออกบิล
              </button>
              <button
                type="button"
                onClick={() => setBulkStatusFilter('PAID_ONLY')}
                className={`${styles.btn} ${bulkStatusFilter === 'PAID_ONLY' ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                ✅ ออกบิลแล้ว
              </button>
            </div>
          </div>

          {/* Status Summary Cards & Room List */}
          {(() => {
            let displayRooms = bulkRoomList
              .filter((r) => bulkBuildingFilter === 'ALL' || r.buildingId === bulkBuildingFilter)
              .filter((r) => {
                if (bulkStatusFilter === 'UNPAID_ONLY') return !r.hasInvoice;
                if (bulkStatusFilter === 'PAID_ONLY') return r.hasInvoice;
                return true;
              });

            displayRooms.sort((a, b) => {
              const billedPriorityA = a.hasInvoice ? 2 : 1;
              const billedPriorityB = b.hasInvoice ? 2 : 1;
              if (billedPriorityA !== billedPriorityB) return billedPriorityA - billedPriorityB;

              const bComp = a.buildingName.localeCompare(b.buildingName, 'th');
              if (bComp !== 0) return bComp;

              return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
            });

            const totalRooms = displayRooms.length;
            const withMeter = displayRooms.filter((r) => r.hasMeter).length;
            const alreadyHasInvoice = displayRooms.filter((r) => r.hasInvoice).length;
            const eligibleToGen = displayRooms.filter((r) => !r.hasInvoice && r.hasMeter).length;

            return (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ห้องที่มีคนเช่า (ตามตัวกรอง)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalRooms} ห้อง</div>
                  </div>
                  <div
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>จดมิเตอร์แล้ว</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: withMeter === totalRooms ? '#10b981' : '#f59e0b' }}>
                      {withMeter} / {totalRooms} ห้อง
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ออกบิลแล้วในรอบนี้</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>{alreadyHasInvoice} ห้อง</div>
                  </div>
                  <div
                    style={{
                      background: eligibleToGen > 0 ? '#10b98115' : 'var(--card-bg)',
                      border: `1px solid ${eligibleToGen > 0 ? '#10b98144' : 'var(--border-color)'}`,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>พร้อมออกบิลในครั้งนี้</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{eligibleToGen} ห้อง</div>
                  </div>
                </div>

                {/* Generation Result Banner */}
                {bulkResult && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                      backgroundColor: bulkResult.failCount === 0 ? '#10b98115' : '#f59e0b15',
                      border: `1px solid ${bulkResult.failCount === 0 ? '#10b98144' : '#f59e0b44'}`,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: bulkResult.failCount === 0 ? '#10b981' : '#d97706',
                        marginBottom: '0.25rem',
                      }}
                    >
                      🎉 ดำเนินการออกบิลเรียบร้อยแล้ว: สำเร็จ {bulkResult.successCount} ห้อง{' '}
                      {bulkResult.failCount > 0 ? `| ข้าม/ล้มเหลว ${bulkResult.failCount} ห้อง` : ''}
                    </div>
                    {bulkResult.failCount > 0 && (
                      <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.82rem', color: '#ef4444' }}>
                        {bulkResult.results
                          .filter((r: any) => !r.success)
                          .map((r: any) => (
                            <li key={r.roomId}>
                              ห้อง {r.roomNumber}: {r.error}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Room Table List */}
                {bulkRoomLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    ⏳ กำลังโหลดข้อมูลห้องและมิเตอร์...
                  </div>
                ) : displayRooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    ❌ ไม่พบห้องที่มีผู้เช่าตรงกับเงื่อนไขที่เลือก
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(() => {
                      let lastGroupKey = '';
                      return displayRooms.map((room, idx) => {
                        const isReady = !room.hasInvoice && room.hasMeter;
                        const isWaitingMeter = !room.hasInvoice && !room.hasMeter;
                        const isBilled = room.hasInvoice;
                        const feeRows = bulkExtraFees[room.roomId] || [];

                        const groupKey = `${isBilled ? 'BILLED' : 'UNBILLED'}_${room.buildingId}`;
                        const isNewGroup = groupKey !== lastGroupKey;
                        lastGroupKey = groupKey;

                        const cardBg = isReady
                          ? 'rgba(16, 185, 129, 0.07)'
                          : isWaitingMeter
                          ? 'rgba(245, 158, 11, 0.07)'
                          : 'rgba(59, 130, 246, 0.04)';

                        const cardBorder = isReady
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : isWaitingMeter
                          ? '1px solid rgba(245, 158, 11, 0.3)'
                          : '1px solid rgba(59, 130, 246, 0.2)';

                        const borderLeftColor = isReady ? '#10b981' : isWaitingMeter ? '#f59e0b' : '#3b82f6';

                        return (
                          <React.Fragment key={room.roomId}>
                            {isNewGroup && (
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                  marginTop: idx === 0 ? '0' : '1rem',
                                  marginBottom: '0.2rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: isBilled ? '#3b82f6' : isReady ? '#10b981' : '#d97706',
                                }}
                              >
                                <span>🏢 {room.buildingName}</span>
                                <span>•</span>
                                <span>
                                  {isBilled
                                    ? `✅ ออกบิลเรียบร้อยแล้ว (${
                                        displayRooms.filter((r) => r.buildingId === room.buildingId && r.hasInvoice).length
                                      } ห้อง)`
                                    : `⏳ ยังไม่ได้ออกบิล (${
                                        displayRooms.filter((r) => r.buildingId === room.buildingId && !r.hasInvoice).length
                                      } ห้อง)`}
                                </span>
                              </div>
                            )}

                            <div
                              style={{
                                background: cardBg,
                                borderRadius: 'var(--radius-md)',
                                border: cardBorder,
                                padding: '0.85rem 1rem',
                                borderLeft: `5px solid ${borderLeftColor}`,
                                opacity: isBilled ? 0.75 : 1,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    🏠 ห้อง {room.roomNumber}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    👤 {room.tenantName} ({room.buildingName})
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {room.hasMeter ? (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#10b981',
                                        background: '#10b98115',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid #10b98133',
                                      }}
                                    >
                                      💧 {room.meterWater} | ⚡ {room.meterElec}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#ef4444',
                                        background: '#ef444415',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid #ef444433',
                                      }}
                                    >
                                      ⚠️ ยังไม่ได้บันทึกมิเตอร์
                                    </span>
                                  )}

                                  {room.hasInvoice ? (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#3b82f6',
                                        fontWeight: 600,
                                        background: '#3b82f615',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '20px',
                                        border: '1px solid #3b82f644',
                                      }}
                                    >
                                      🟢 ออกบิลแล้ว ({room.existingInvoiceTotal?.toLocaleString()} ฿)
                                    </span>
                                  ) : isReady ? (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#10b981',
                                        fontWeight: 600,
                                        background: '#10b98115',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '20px',
                                        border: '1px solid #10b98144',
                                      }}
                                    >
                                      ⏳ พร้อมออกบิล (ค่าเช่า {room.basePrice.toLocaleString()} ฿)
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#f59e0b',
                                        fontWeight: 600,
                                        background: '#f59e0b15',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '20px',
                                        border: '1px solid #f59e0b44',
                                      }}
                                    >
                                      ⏸️ ข้าม (รอมิเตอร์)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isReady && (
                                <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                      ➕ ค่าใช้จ่ายเพิ่มเติมสำหรับห้องนี้ (ถ้ามี เช่น ค่าซ่อม, ค่าที่จอดรถ):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addBulkFeeRow(room.roomId)}
                                      className={`${styles.btn} ${styles.btnSecondary}`}
                                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}
                                    >
                                      + เพิ่มรายการ
                                    </button>
                                  </div>

                                  {feeRows.map((fee: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        placeholder="ชื่อรายการ (เช่น ค่าซ่อมแอร์)"
                                        value={fee.name}
                                        onChange={(e) => updateBulkFee(room.roomId, idx, 'name', e.target.value)}
                                        className={styles.formInput}
                                        style={{ flex: 2, padding: '0.3rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                                      />
                                      <input
                                        type="number"
                                        placeholder="จำนวนเงิน (บาท)"
                                        value={fee.amount}
                                        onChange={(e) => updateBulkFee(room.roomId, idx, 'amount', e.target.value)}
                                        className={styles.formInput}
                                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                                      />
                                      {feeRows.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeBulkFeeRow(room.roomId, idx)}
                                          style={{
                                            border: 'none',
                                            background: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: '0 0.25rem',
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowBulkBillModal(false)}>
            ❌ ปิดหน้าต่าง
          </button>

          {(() => {
            const displayRooms = bulkRoomList.filter((r) => bulkBuildingFilter === 'ALL' || r.buildingId === bulkBuildingFilter);
            const eligibleCount = displayRooms.filter((r) => !r.hasInvoice && r.hasMeter).length;
            return (
              <button
                type="button"
                disabled={bulkGenerating || eligibleCount === 0}
                onClick={handleBulkGenerate}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{
                  padding: '0.6rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  opacity: bulkGenerating || eligibleCount === 0 ? 0.5 : 1,
                  cursor: bulkGenerating || eligibleCount === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {bulkGenerating ? '⏳ กำลังสร้างใบแจ้งหนี้...' : `🚀 ยืนยันออกบิลทุกห้องพร้อมกัน (${eligibleCount} ห้อง)`}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
