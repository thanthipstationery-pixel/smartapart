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
}: OverdueModalProps) {
  if (!showOverdueModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: 'var(--status-unpaid)' }}>
            รายการค้างชำระทั้งหมด (Overdue Bills)
          </h2>
          <button className={styles.modalClose} onClick={() => setShowOverdueModal(false)}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Building selector inside modal */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>เลือกตึก:</span>
            <button
              onClick={() => setOverdueBuildingFilter('ALL')}
              className={`${styles.btn} ${overdueBuildingFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
            >
              ทั้งหมด
            </button>
            {buildings.map((b) => (
              <button
                key={b.id}
                onClick={() => setOverdueBuildingFilter(b.id)}
                className={`${styles.btn} ${overdueBuildingFilter === b.id ? styles.btnPrimary : styles.btnSecondary}`}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Table listing unpaid invoices */}
          <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
            <table className={styles.meterTable}>
              <thead>
                <tr>
                  <th>ห้องพัก</th>
                  <th>อาคาร / ตึก</th>
                  <th>ผู้เช่า</th>
                  <th>รอบบิล</th>
                  <th>ยอดเงินค้าง</th>
                  <th>ครบกำหนด</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((inv) => inv.status === 'UNPAID')
                  .filter((inv) => overdueBuildingFilter === 'ALL' || inv.room.floor.buildingId === overdueBuildingFilter)
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--status-unpaid)' }}>{inv.room.number}</td>
                      <td>{getShortBuildingName(inv.room.floor.building.name)}</td>
                      <td>
                        <div>{inv.tenant.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatPhone(inv.tenant.phone)}</div>
                      </td>
                      <td>{formatThaiBillingPeriod(inv.billingPeriod)}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--status-unpaid)' }}>{inv.totalAmount.toLocaleString()} บาท</td>
                      <td style={{ fontSize: '0.85rem', color: new Date(inv.dueDate) < new Date() ? 'red' : 'inherit' }}>
                        {formatThaiDateNumeric(inv.dueDate)}
                        {new Date(inv.dueDate) < new Date() && ' (เกินกำหนด)'}
                      </td>
                      <td>
                        <button
                          className={`${styles.btn} ${styles.btnSuccess}`}
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.totalAmount.toString());
                            setShowPaymentModal(true);
                          }}
                        >
                          ชำระเงิน
                        </button>
                      </td>
                    </tr>
                  ))}
                {invoices
                  .filter((inv) => inv.status === 'UNPAID')
                  .filter((inv) => overdueBuildingFilter === 'ALL' || inv.room.floor.buildingId === overdueBuildingFilter).length ===
                  0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      ไม่มีรายการค้างชำระในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
