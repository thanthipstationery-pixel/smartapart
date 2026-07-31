'use client';

import React from 'react';
import { formatThaiBillingPeriod } from '@/lib/thaiDate';

interface PaymentModalProps {
  showPaymentModal: boolean;
  setShowPaymentModal: (val: boolean) => void;
  selectedInvoice: any;
  showInvoiceDetailModal: boolean;
  setShowInvoiceDetailModal: (val: boolean) => void;
  handleRecordPayment: (e: React.FormEvent) => void;
  paymentAmount: string;
  setPaymentAmount: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentDate: string;
  setPaymentDate: (val: string) => void;
  paymentSlipImage: string;
  setPaymentSlipImage: (val: string) => void;
  paymentReceiverName: string;
  setPaymentReceiverName: (val: string) => void;
  styles: any;
}

export default function PaymentModal({
  showPaymentModal,
  setShowPaymentModal,
  selectedInvoice,
  showInvoiceDetailModal,
  setShowInvoiceDetailModal,
  handleRecordPayment,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentDate,
  setPaymentDate,
  paymentSlipImage,
  setPaymentSlipImage,
  paymentReceiverName,
  setPaymentReceiverName,
  styles,
}: PaymentModalProps) {
  if (!showPaymentModal || !selectedInvoice) return null;

  const approvedPaid = (selectedInvoice.payments || [])
    .filter((p: any) => p.status === 'APPROVED')
    .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
  const remainingDue = Math.max(0, selectedInvoice.totalAmount - approvedPaid);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '520px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>บันทึกชำระเงิน - ห้อง {selectedInvoice.room.number}</h2>
          <button
            className={styles.modalClose}
            onClick={() => {
              setShowPaymentModal(false);
              if (showInvoiceDetailModal) {
                setShowInvoiceDetailModal(true);
              }
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleRecordPayment}>
          <div className={styles.modalBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary Info Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>รอบบิล:</span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.05rem', margin: 0, color: 'var(--primary-color)' }}>
                    {formatThaiBillingPeriod(selectedInvoice.billingPeriod)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ยอดคงค้างที่ต้องชำระ:</span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0, color: '#ef4444' }}>
                    {remainingDue.toLocaleString()} บาท
                  </p>
                </div>
              </div>

              {/* Breakdown of bill & past payments */}
              {approvedPaid > 0 && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0 0.25rem',
                  }}
                >
                  <span>ยอดบิลเต็ม: {selectedInvoice.totalAmount.toLocaleString()} บ.</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>ชำระแล้วสะสม: {approvedPaid.toLocaleString()} บ.</span>
                </div>
              )}

              {/* Payment Amount Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>จำนวนเงินชำระครั้งนี้ (บาท) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className={styles.formInput}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ช่องทางการชำระเงิน *</label>
                <select className={styles.formSelect} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="TRANSFER">โอนเงินผ่านธนาคาร (Bank Transfer)</option>
                  <option value="CASH">เงินสด (Cash)</option>
                </select>
              </div>

              {/* Payment Date */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>วันที่ชำระเงิน *</label>
                <input
                  type="date"
                  required
                  className={styles.formInput}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              {/* Slip Image Upload / URL */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>แนบสลิปโอนเงิน (ถ้ามี)</label>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.formInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPaymentSlipImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {paymentSlipImage && (
                  <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                    <img
                      src={paymentSlipImage}
                      alt="Slip Preview"
                      style={{ maxHeight: '150px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                )}
              </div>

              {/* Receiver Name */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อผู้รับเงินประจำใบเสร็จ</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={paymentReceiverName}
                  onChange={(e) => setPaymentReceiverName(e.target.value)}
                  placeholder="เช่น น.ส. สมศรี ใจดี (หากว่างไว้จะเปิดเป็นช่องเซ็นลายมือ)"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowPaymentModal(false)}>
              ยกเลิก
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              ยืนยันการรับชำระเงิน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
