'use client';

import React from 'react';
import { formatThaiBillingPeriod, getShortBuildingName } from '@/lib/thaiDate';

interface InvoiceTabProps {
  invoiceStatusFilter: string;
  setInvoiceStatusFilter: (val: string) => void;
  invoiceFilterPeriod: string;
  setInvoiceFilterPeriod: (val: string) => void;
  invoiceFilterBuildingId: string;
  setInvoiceFilterBuildingId: (val: string) => void;
  invoiceSearchQuery: string;
  setInvoiceSearchQuery: (val: string) => void;
  setShowBulkBillModal: (val: boolean) => void;
  fetchBulkRooms: (period: string) => void;
  bulkBillPeriod: string;
  filteredInvoices: any[];
  setShowBatchPrintModal: (val: boolean) => void;
  handleInvoiceClick: (invoiceId: string) => void;
  setSelectedInvoice: (invoice: any) => void;
  setPaymentAmount: (amount: string) => void;
  setShowPaymentModal: (val: boolean) => void;
  invoices: any[];
  buildings: any[];
  styles: any;
}

export default function InvoiceTab({
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  invoiceFilterPeriod,
  setInvoiceFilterPeriod,
  invoiceFilterBuildingId,
  setInvoiceFilterBuildingId,
  invoiceSearchQuery,
  setInvoiceSearchQuery,
  setShowBulkBillModal,
  fetchBulkRooms,
  bulkBillPeriod,
  filteredInvoices,
  setShowBatchPrintModal,
  handleInvoiceClick,
  setSelectedInvoice,
  setPaymentAmount,
  setShowPaymentModal,
  invoices,
  buildings,
  styles,
}: InvoiceTabProps) {
  return (
    <div className="fade-in">
      {/* Header Title Banner */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className={styles.title} style={{ marginBottom: '0.25rem' }}>📄 ใบแจ้งหนี้ / ใบเสร็จรับเงิน</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          จัดการใบแจ้งหนี้ประจำเดือน, บันทึกรับชำระเงิน และพิมพ์ใบเสร็จรับเงิน A5
        </p>
      </div>

      {/* Rich Multi-Criteria Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {/* Status buttons */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setInvoiceStatusFilter('ALL')}
            className={`${styles.btn} ${invoiceStatusFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setInvoiceStatusFilter('UNPAID')}
            className={`${styles.btn} ${invoiceStatusFilter === 'UNPAID' ? styles.btnPrimary : styles.btnSecondary}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            ค้างชำระ
          </button>
          <button
            onClick={() => setInvoiceStatusFilter('PARTIAL')}
            className={`${styles.btn} ${invoiceStatusFilter === 'PARTIAL' ? styles.btnPrimary : styles.btnSecondary}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', backgroundColor: invoiceStatusFilter === 'PARTIAL' ? '#f59e0b' : undefined, color: invoiceStatusFilter === 'PARTIAL' ? '#ffffff' : undefined, borderColor: invoiceStatusFilter === 'PARTIAL' ? '#d97706' : undefined }}
          >
            ชำระบางส่วน
          </button>
          <button
            onClick={() => setInvoiceStatusFilter('PAID')}
            className={`${styles.btn} ${invoiceStatusFilter === 'PAID' ? styles.btnPrimary : styles.btnSecondary}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            ชำระแล้ว
          </button>
        </div>

        {/* Billing Period filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>รอบบิล:</span>
          <select
            className={styles.formSelect}
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem', minHeight: '38px' }}
            value={invoiceFilterPeriod}
            onChange={(e) => setInvoiceFilterPeriod(e.target.value)}
          >
            <option value="ALL">📅 ทุกรอบบิล</option>
            {Array.from(new Set(invoices.map((i) => i.billingPeriod))).sort().reverse().map((p) => (
              <option key={p} value={p}>{formatThaiBillingPeriod(p)}</option>
            ))}
          </select>
        </div>

        {/* Building filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>อาคาร:</span>
          <select
            className={styles.formSelect}
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem', minHeight: '38px' }}
            value={invoiceFilterBuildingId}
            onChange={(e) => setInvoiceFilterBuildingId(e.target.value)}
          >
            <option value="ALL">🏢 ทุกอาคาร</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{getShortBuildingName(b.name)}</option>
            ))}
          </select>
        </div>

        {/* Search query */}
        <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
          <input
            type="text"
            placeholder="🔎 ค้นหาบิล (เลขห้อง, ชื่อผู้เช่า, เบอร์, เล่ม/เลขที่)..."
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            className={styles.formInput}
            style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem', minHeight: '38px' }}
          />
        </div>

        {/* Action Buttons: Bulk Generator & Batch A5 Printer */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setShowBulkBillModal(true);
              fetchBulkRooms(bulkBillPeriod);
            }}
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ ออกใบแจ้งหนี้ทุกห้อง
          </button>

          <button
            type="button"
            onClick={() => {
              if (filteredInvoices.length === 0) {
                alert('ไม่มีรายการใบแจ้งหนี้/ใบเสร็จตามเงื่อนไขที่เลือกในขณะนี้');
                return;
              }
              setShowBatchPrintModal(true);
            }}
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
          >
            🖨️ พิมพ์ชุดเอกสาร A5 ({filteredInvoices.length} รายการ)
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className={styles.sectionCard}>
        {/* Desktop Table View */}
        <div className="invoice-desktop-only" style={{ overflowX: 'auto' }}>
          <table className={styles.meterTable}>
            <thead>
              <tr>
                <th>เลขที่ห้อง</th>
                <th>อาคาร / ตึก</th>
                <th>ผู้เช่า</th>
                <th>รอบบิล</th>
                <th>ค่าน้ำ-ไฟ</th>
                <th>ค่าเช่าห้อง</th>
                <th>ยอดรวมสุทธิ</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    🔍 ไม่พบใบแจ้งหนี้ที่ตรงกับการค้นหาของคุณ
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 'bold' }}>{inv.room.number}</td>
                    <td>{inv.room.floor.building.name}</td>
                    <td>{inv.tenant.name}</td>
                    <td>{formatThaiBillingPeriod(inv.billingPeriod)}</td>
                    <td>{(inv.waterCost + inv.electricityCost).toLocaleString()} บาท</td>
                    <td>{inv.rentCost.toLocaleString()} บาท</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {inv.totalAmount.toLocaleString()} บาท
                      {inv.status === 'PARTIAL' && (() => {
                        const approvedPaid = (inv.payments || [])
                          .filter((p: any) => p.status === 'APPROVED')
                          .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                        const remaining = Math.max(0, inv.totalAmount - approvedPaid);
                        return (
                          <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                            (จ่ายแล้ว {approvedPaid.toLocaleString()} / ค้าง {remaining.toLocaleString()} บ.)
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`${styles.invoiceBadge} ${
                        inv.status === 'PAID' ? styles.badgePaid :
                        inv.status === 'PARTIAL' ? styles.badgePartial :
                        inv.status === 'UNPAID' ? styles.badgeUnpaid : styles.badgeOverdue
                      }`}>
                        {inv.status === 'PAID' ? 'ชำระแล้ว' : inv.status === 'PARTIAL' ? 'ชำระบางส่วน' : inv.status === 'UNPAID' ? 'ค้างชำระ' : 'เกินกำหนด'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          style={{ padding: '0.375rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => handleInvoiceClick(inv.id)}
                        >
                          🖨️ พิมพ์ / ดูบิล
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            className={`${styles.btn} ${styles.btnSuccess}`}
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => {
                              setSelectedInvoice(inv);
                              const approvedPaid = (inv.payments || [])
                                .filter((p: any) => p.status === 'APPROVED')
                                .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                              const remaining = Math.max(0, inv.totalAmount - approvedPaid);
                              setPaymentAmount(remaining > 0 ? remaining.toString() : inv.totalAmount.toString());
                              setShowPaymentModal(true);
                            }}
                          >
                            ชำระเงิน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="invoice-mobile-only">
          {filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              🔍 ไม่พบใบแจ้งหนี้ที่ตรงกับการค้นหาของคุณ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredInvoices.map((inv) => {
                const statusColor = inv.status === 'PAID' ? '#10b981' : inv.status === 'PARTIAL' ? '#f59e0b' : inv.status === 'UNPAID' ? '#ef4444' : '#dc2626';
                const statusText = inv.status === 'PAID' ? 'ชำระแล้ว' : inv.status === 'PARTIAL' ? 'ชำระบางส่วน' : inv.status === 'UNPAID' ? 'ค้างชำระ' : 'เกินกำหนด';
                const statusIcon = inv.status === 'PAID' ? '✅' : inv.status === 'PARTIAL' ? '⏳' : '🔴';
                return (
                  <div
                    key={inv.id}
                    style={{
                      background: 'var(--card-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '0.85rem 1rem',
                      borderLeft: `4px solid ${statusColor}`,
                    }}
                  >
                    {/* Row 1: Room + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>🏠 {inv.room.number}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.8 }}>{inv.room.floor.building.name}</span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '20px',
                        backgroundColor: `${statusColor}22`,
                        color: statusColor,
                        border: `1px solid ${statusColor}44`,
                        whiteSpace: 'nowrap',
                      }}>
                        {statusIcon} {statusText}
                      </span>
                    </div>

                    {/* Row 2: Tenant + Period */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>👤 {inv.tenant.name}</span>
                      <span>📅 {formatThaiBillingPeriod(inv.billingPeriod)}</span>
                    </div>

                    {/* Row 3: Cost breakdown */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                      <div style={{ flex: 1, background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>💧⚡ น้ำ-ไฟ</div>
                        <div style={{ fontWeight: 700 }}>{(inv.waterCost + inv.electricityCost).toLocaleString()} ฿</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>🏠 ค่าเช่า</div>
                        <div style={{ fontWeight: 700 }}>{inv.rentCost.toLocaleString()} ฿</div>
                      </div>
                      <div style={{ flex: 1, background: `${statusColor}15`, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.4rem', textAlign: 'center', border: `1px solid ${statusColor}33` }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>💰 รวม</div>
                        <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{inv.totalAmount.toLocaleString()} ฿</div>
                      </div>
                    </div>

                    {/* Partial payment info */}
                    {inv.status === 'PARTIAL' && (() => {
                      const approvedPaid = (inv.payments || [])
                        .filter((p: any) => p.status === 'APPROVED')
                        .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                      const remaining = Math.max(0, inv.totalAmount - approvedPaid);
                      return (
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
                          💳 จ่ายแล้ว {approvedPaid.toLocaleString()} / ค้างอีก {remaining.toLocaleString()} บาท
                        </div>
                      );
                    })()}

                    {/* Row 4: Action buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}
                        onClick={() => handleInvoiceClick(inv.id)}
                      >
                        🖨️ พิมพ์ / ดูบิล
                      </button>
                      {inv.status !== 'PAID' && (
                        <button
                          className={`${styles.btn} ${styles.btnSuccess}`}
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            const approvedPaid = (inv.payments || [])
                              .filter((p: any) => p.status === 'APPROVED')
                              .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                            const remaining = Math.max(0, inv.totalAmount - approvedPaid);
                            setPaymentAmount(remaining > 0 ? remaining.toString() : inv.totalAmount.toString());
                            setShowPaymentModal(true);
                          }}
                        >
                          💳 ชำระเงิน
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
