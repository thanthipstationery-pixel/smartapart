'use client';

import React from 'react';

interface BatchPrintModalProps {
  showBatchPrintModal: boolean;
  setShowBatchPrintModal: (val: boolean) => void;
  filteredInvoices: any[];
  handleBatchPrintA5List: (invoices: any[], mode?: 'INVOICE_ONLY' | 'RECEIPT_ONLY' | 'ALL_GROUPED', includeQr?: boolean) => void;
  styles: any;
}

export default function BatchPrintModal({
  showBatchPrintModal,
  setShowBatchPrintModal,
  filteredInvoices,
  handleBatchPrintA5List,
  styles,
}: BatchPrintModalProps) {
  const [includeQrCode, setIncludeQrCode] = React.useState<boolean>(true);

  if (!showBatchPrintModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '560px', padding: '1.5rem' }}>
        <div className={styles.modalHeader} style={{ marginBottom: '1.25rem' }}>
          <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            🖨️ เลือกรูปแบบการพิมพ์ชุดเอกสาร A5
          </h2>
          <button className={styles.modalClose} onClick={() => setShowBatchPrintModal(false)}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody} style={{ padding: 0 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            เลือกรูปแบบเอกสารที่ต้องการพิมพ์สำหรับรอบบิลและตึกที่เลือกขณะนี้ (<strong>{filteredInvoices.length} ห้อง</strong>):
          </p>

          {/* Toggle QR Code Option */}
          <div
            style={{
              padding: '0.75rem 0.9rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={includeQrCode}
                onChange={(e) => setIncludeQrCode(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>📲 แสดง PromptPay QR Code สแกนชำระเงิน บนใบแจ้งหนี้ A5</span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Option 1: Invoice Only */}
            <button
              type="button"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem',
                backgroundColor: 'var(--bg-color)',
                border: '1.5px solid #2563eb',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setShowBatchPrintModal(false);
                handleBatchPrintA5List(filteredInvoices, 'INVOICE_ONLY', includeQrCode);
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#2563eb', marginBottom: '0.25rem' }}>
                📄 1. พิมพ์ใบแจ้งหนี้ทั้งหมด ({filteredInvoices.length} ห้อง)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                พิมพ์ใบแจ้งหนี้เรียงตามเลขห้อง (1 A5/ห้อง) สำหรับนำทั้งปึกไปเสียบสอดตามห้องได้ทันที
              </div>
            </button>

            {/* Option 2: Receipt Only */}
            <button
              type="button"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem',
                backgroundColor: 'var(--bg-color)',
                border: '1.5px solid #10b981',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                const paidInvoices = filteredInvoices.filter((i) => i.status === 'PAID');
                if (paidInvoices.length === 0) {
                  alert('ไม่พบรายการที่ชำระเงินเรียบร้อยแล้วในรอบบิล/ตึกที่เลือก');
                  return;
                }
                setShowBatchPrintModal(false);
                handleBatchPrintA5List(filteredInvoices, 'RECEIPT_ONLY', includeQrCode);
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#10b981', marginBottom: '0.25rem' }}>
                🧾 2. พิมพ์ใบเสร็จรับเงินทั้งหมด (เฉพาะห้องที่จ่ายแล้ว)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                พิมพ์เฉพาะใบเสร็จรับเงิน A5 สำหรับห้องที่ชำระเงินเรียบร้อยแล้ว
              </div>
            </button>

            {/* Option 3: All Grouped */}
            <button
              type="button"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem',
                backgroundColor: 'var(--bg-color)',
                border: '1.5px solid #7c3aed',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setShowBatchPrintModal(false);
                handleBatchPrintA5List(filteredInvoices, 'ALL_GROUPED', includeQrCode);
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#7c3aed', marginBottom: '0.25rem' }}>
                📑 3. พิมพ์ทั้งหมด (เรียงใบแจ้งหนี้ทุกห้องขึ้นก่อน ➔ ใบเสร็จรับเงิน)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                พิมพ์ใบแจ้งหนี้ทุกห้องให้เสร็จสิ้นก่อน แล้วตามด้วยใบเสร็จรับเงินของห้องที่ชำระแล้วอยู่ที่ครึ่งหลัง
              </div>
            </button>
          </div>
        </div>

        <div className={styles.modalFooter} style={{ marginTop: '1.25rem' }}>
          <button type="button" className={styles.btn} onClick={() => setShowBatchPrintModal(false)}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
