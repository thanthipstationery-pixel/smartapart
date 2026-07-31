'use client';

import React from 'react';
import {
  THAI_MONTHS,
  formatThaiBillingPeriod,
  formatThaiDateNumeric,
  formatThaiDateLong,
  formatThaiMonthOnly,
} from '@/lib/thaiDate';

interface InvoiceDetailModalProps {
  // Create Invoice Modal props
  showInvoiceModal: boolean;
  setShowInvoiceModal: (val: boolean) => void;
  selectedRoom: any;
  setShowRoomModal: (val: boolean) => void;
  handleGenerateInvoice: (e: React.FormEvent) => void;
  invoiceBookNo: string;
  setInvoiceBookNo: (val: string) => void;
  invoiceNoStr: string;
  setInvoiceNoStr: (val: string) => void;
  invoicePeriod: string;
  setInvoicePeriod: (val: string) => void;
  invoiceDueDate: string;
  setInvoiceDueDate: (val: string) => void;
  customWaterCostInput: string;
  setCustomWaterCostInput: (val: string) => void;
  customElecCostInput: string;
  setCustomElecCostInput: (val: string) => void;
  invoiceOtherFeeItems: any[];
  setInvoiceOtherFeeItems: (val: any[]) => void;
  invoiceCustomNote: string;
  setInvoiceCustomNote: (val: string) => void;

  // Invoice Detail / Print Modal props
  showInvoiceDetailModal: boolean;
  setShowInvoiceDetailModal: (val: boolean) => void;
  selectedInvoice: any;
  activePrintTab: 'invoice' | 'receipt';
  setActivePrintTab: (val: 'invoice' | 'receipt') => void;
  handlePrintA5: () => void;
  handleOpenEditInvoiceModal: (invoice: any) => void;
  showInvoiceQr: boolean;
  setShowInvoiceQr: (val: boolean) => void;
  paymentReceiverName: string;

  // Edit Invoice Modal props
  showEditInvoiceModal: boolean;
  setShowEditInvoiceModal: (val: boolean) => void;
  handleEditInvoiceSubmit: (e: React.FormEvent) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  editDueDate: string;
  setEditDueDate: (val: string) => void;
  editPrevWater: string;
  setEditPrevWater: (val: string) => void;
  editCurWater: string;
  setEditCurWater: (val: string) => void;
  editWaterRate: string;
  setEditWaterRate: (val: string) => void;
  editPrevElec: string;
  setEditPrevElec: (val: string) => void;
  editCurElec: string;
  setEditCurElec: (val: string) => void;
  editElecRate: string;
  setEditElecRate: (val: string) => void;
  editRentCost: string;
  setEditRentCost: (val: string) => void;
  editOtherFeeItems: any[];
  setEditOtherFeeItems: (val: any[]) => void;
  editOtherNote: string;
  setEditOtherNote: (val: string) => void;

  styles: any;
}

export default function InvoiceDetailModal({
  showInvoiceModal,
  setShowInvoiceModal,
  selectedRoom,
  setShowRoomModal,
  handleGenerateInvoice,
  invoiceBookNo,
  setInvoiceBookNo,
  invoiceNoStr,
  setInvoiceNoStr,
  invoicePeriod,
  setInvoicePeriod,
  invoiceDueDate,
  setInvoiceDueDate,
  customWaterCostInput,
  setCustomWaterCostInput,
  customElecCostInput,
  setCustomElecCostInput,
  invoiceOtherFeeItems,
  setInvoiceOtherFeeItems,
  invoiceCustomNote,
  setInvoiceCustomNote,

  showInvoiceDetailModal,
  setShowInvoiceDetailModal,
  selectedInvoice,
  activePrintTab,
  setActivePrintTab,
  handlePrintA5,
  handleOpenEditInvoiceModal,
  showInvoiceQr,
  setShowInvoiceQr,
  paymentReceiverName,

  showEditInvoiceModal,
  setShowEditInvoiceModal,
  handleEditInvoiceSubmit,
  editStatus,
  setEditStatus,
  editDueDate,
  setEditDueDate,
  editPrevWater,
  setEditPrevWater,
  editCurWater,
  setEditCurWater,
  editWaterRate,
  setEditWaterRate,
  editPrevElec,
  setEditPrevElec,
  editCurElec,
  setEditCurElec,
  editElecRate,
  setEditElecRate,
  editRentCost,
  setEditRentCost,
  editOtherFeeItems,
  setEditOtherFeeItems,
  editOtherNote,
  setEditOtherNote,

  styles,
}: InvoiceDetailModalProps) {
  return (
    <>
      {/* --- MODAL 3: INVOICE GENERATOR MODAL --- */}
      {showInvoiceModal && selectedRoom && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>ออกใบแจ้งหนี้ - ห้อง {selectedRoom.number}</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setShowInvoiceModal(false);
                  setShowRoomModal(true);
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice}>
              <div className={styles.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Book & Invoice Number Customization */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        เล่มที่ (เลขห้อง)
                      </label>
                      <input
                        type="text"
                        value={invoiceBookNo !== '' ? invoiceBookNo : selectedRoom.number}
                        onChange={(e) => setInvoiceBookNo(e.target.value)}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        เลขที่ (งวดเดือนเช่า)
                      </label>
                      <input
                        type="text"
                        value={invoiceNoStr}
                        onChange={(e) => setInvoiceNoStr(e.target.value)}
                        placeholder="ระบบคำนวณให้อัตโนมัติ"
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Custom Thai Billing Month Picker */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>รอบบิลประจำเดือน (พ.ศ.) *</label>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <select
                          className={styles.formSelect}
                          style={{ flex: 1.4, padding: '0.45rem', fontSize: '0.88rem' }}
                          value={invoicePeriod.split('-')[1] || '07'}
                          onChange={(e) => {
                            const y = invoicePeriod.split('-')[0] || String(new Date().getFullYear());
                            setInvoicePeriod(`${y}-${e.target.value}`);
                          }}
                        >
                          {THAI_MONTHS.map((mName, idx) => {
                            const val = String(idx + 1).padStart(2, '0');
                            return (
                              <option key={val} value={val}>
                                {mName}
                              </option>
                            );
                          })}
                        </select>
                        <select
                          className={styles.formSelect}
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.88rem' }}
                          value={invoicePeriod.split('-')[0] || String(new Date().getFullYear())}
                          onChange={(e) => {
                            const m = invoicePeriod.split('-')[1] || '07';
                            setInvoicePeriod(`${e.target.value}-${m}`);
                          }}
                        >
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                            <option key={y} value={y}>
                              {y + 543}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '0.3rem', fontWeight: 600 }}>
                        🗓️ {formatThaiBillingPeriod(invoicePeriod)}
                      </div>
                    </div>

                    {/* Custom Thai Due Date Picker (Day / Month / Year พ.ศ.) */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>วันที่ครบกำหนดชำระเงิน (พ.ศ.) *</label>
                      {(() => {
                        const parts = (invoiceDueDate || new Date().toISOString().split('T')[0]).split('-');
                        const curY = parts[0] || String(new Date().getFullYear());
                        const curM = parts[1] || '08';
                        const curD = parts[2] || '05';

                        const updateDueDate = (newY: string, newM: string, newD: string) => {
                          setInvoiceDueDate(`${newY}-${newM}-${newD}`);
                        };

                        return (
                          <>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <select
                                className={styles.formSelect}
                                style={{ flex: 0.8, padding: '0.45rem', fontSize: '0.88rem' }}
                                value={curD}
                                onChange={(e) => updateDueDate(curY, curM, e.target.value)}
                              >
                                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                                  <option key={d} value={d}>
                                    {parseInt(d)}
                                  </option>
                                ))}
                              </select>
                              <select
                                className={styles.formSelect}
                                style={{ flex: 1.4, padding: '0.45rem', fontSize: '0.88rem' }}
                                value={curM}
                                onChange={(e) => updateDueDate(curY, e.target.value, curD)}
                              >
                                {THAI_MONTHS.map((mName, idx) => {
                                  const val = String(idx + 1).padStart(2, '0');
                                  return (
                                    <option key={val} value={val}>
                                      {mName}
                                    </option>
                                  );
                                })}
                              </select>
                              <select
                                className={styles.formSelect}
                                style={{ flex: 1, padding: '0.45rem', fontSize: '0.88rem' }}
                                value={curY}
                                onChange={(e) => updateDueDate(e.target.value, curM, curD)}
                              >
                                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                                  <option key={y} value={y}>
                                    {y + 543}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '0.3rem', fontWeight: 600 }}>
                              📅 {formatThaiDateNumeric(invoiceDueDate)} ({formatThaiDateLong(invoiceDueDate)})
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedRoom.waterBillingType === 'CUSTOM' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        ค่าน้ำประปา (ระบุเองแบบ CUSTOM) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={customWaterCostInput}
                        onChange={(e) => setCustomWaterCostInput(e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                  )}

                  {selectedRoom.elecBillingType === 'CUSTOM' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                        ค่าไฟฟ้า (ระบุเองแบบ CUSTOM) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={customElecCostInput}
                        onChange={(e) => setCustomElecCostInput(e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>
                  )}

                  {/* Smart Itemized Extra Fees */}
                  <div
                    style={{
                      border: '1px solid var(--border-color)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <label className={styles.formLabel} style={{ marginBottom: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                        ➕ ค่าใช้จ่ายอื่นๆ เพิ่มเติม (แจกแจงลงหมายเหตุอัตโนมัติ)
                      </label>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          setInvoiceOtherFeeItems([...invoiceOtherFeeItems, { id: Date.now().toString(), name: '', amount: '' }]);
                        }}
                      >
                        + เพิ่มรายการ
                      </button>
                    </div>

                    {invoiceOtherFeeItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="ชื่อรายการ (เช่น ค่าทำความสะอาด)"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...invoiceOtherFeeItems];
                            updated[idx].name = e.target.value;
                            setInvoiceOtherFeeItems(updated);
                          }}
                          className={styles.formInput}
                          style={{ flex: '2', padding: '0.4rem', fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          placeholder="จำนวนเงิน"
                          value={item.amount}
                          onChange={(e) => {
                            const updated = [...invoiceOtherFeeItems];
                            updated[idx].amount = e.target.value;
                            setInvoiceOtherFeeItems(updated);
                          }}
                          className={styles.formInput}
                          style={{ flex: '1', padding: '0.4rem', fontSize: '0.85rem' }}
                        />
                        {invoiceOtherFeeItems.length > 1 && (
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              padding: '0 0.3rem',
                            }}
                            onClick={() => {
                              setInvoiceOtherFeeItems(invoiceOtherFeeItems.filter((i) => i.id !== item.id));
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}

                    <div className={styles.formGroup} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        หมายเหตุเพิ่มเติมสะสม
                      </label>
                      <input
                        type="text"
                        value={invoiceCustomNote}
                        onChange={(e) => setInvoiceCustomNote(e.target.value)}
                        placeholder="เช่น จ่ายภายในวันที่ 5"
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-color)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      margin: 0,
                    }}
                  >
                    💡 ระบบจะคำนวณค่าน้ำและไฟตามมิเตอร์ของตึกให้อัตโนมัติ พร้อมนำรายการย่อยค่าใช้จ่ายอื่นๆ มารวมยอดเงินและลงช่อง *** หมายเหตุ ในใบแจ้งหนี้ A5 ให้เรียบร้อย
                  </p>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setShowRoomModal(true);
                  }}
                >
                  ยกเลิก
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  💾 ออกบิลใบแจ้งหนี้ A5
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: OFFICIAL A5 PRINT-READY INVOICE MODAL --- */}
      {showInvoiceDetailModal && selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modalCard}
            style={{ maxWidth: '820px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
          >
            <div
              className={styles.modalHeader}
              style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{activePrintTab === 'receipt' ? '🧾' : '📄'}</span>
                <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                  {activePrintTab === 'receipt' ? 'ใบเสร็จรับเงินขนาด A5' : 'ใบแจ้งหนี้ขนาด A5'} - ห้อง {selectedInvoice.room.number} (ประจำเดือน{' '}
                  {formatThaiMonthOnly(selectedInvoice.billingPeriod)})
                </h2>
              </div>
              <button className={styles.modalClose} onClick={() => setShowInvoiceDetailModal(false)}>
                &times;
              </button>
            </div>

            {/* Printable Area Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Print mode selector */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.2rem',
                    backgroundColor: 'var(--card-bg)',
                    padding: '0.2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActivePrintTab('invoice')}
                    className={`${styles.btn}`}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: activePrintTab === 'invoice' ? 'var(--primary-color)' : 'transparent',
                      color: activePrintTab === 'invoice' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: 'none',
                    }}
                  >
                    📄 ใบแจ้งหนี้ A5
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePrintTab('receipt')}
                    className={`${styles.btn}`}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: activePrintTab === 'receipt' ? '#10b981' : 'transparent',
                      color: activePrintTab === 'receipt' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: 'none',
                    }}
                  >
                    🧾 ใบเสร็จรับเงิน A5
                  </button>
                </div>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ fontWeight: 'bold', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => handlePrintA5()}
                >
                  🖨️ พิมพ์{activePrintTab === 'receipt' ? 'ใบเสร็จรับเงิน A5' : 'ใบแจ้งหนี้ A5'}
                </button>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ fontSize: '0.85rem', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', fontWeight: 'bold' }}
                  onClick={() => handleOpenEditInvoiceModal(selectedInvoice)}
                >
                  ✏️ แก้ไขใบแจ้งหนี้
                </button>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setShowInvoiceQr(!showInvoiceQr)}
                >
                  {showInvoiceQr ? '🙈 ซ่อน PromptPay QR' : '📲 แสดง PromptPay QR สแกนจ่าย'}
                </button>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>กระดาษขนาด A5 (148mm x 210mm) พอดีหน้า 100%</span>
            </div>

            {/* A5 Scaled Preview Container */}
            <div
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                overflowY: 'auto',
              }}
            >
              <div style={{ zoom: 0.62 }}>
                {activePrintTab === 'receipt' ? (
                  /* --- OFFICIAL A5 RECEIPT TEMPLATE (ใบเสร็จรับเงิน) --- */
                  <div
                    className="a5-printable-card"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      padding: '16px 20px',
                      border: '1px solid #000000',
                      borderRadius: '2px',
                      fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      lineHeight: 1.4,
                      margin: '0 auto',
                      maxWidth: '720px',
                    }}
                  >
                    {/* Top Header: Book No. & Invoice No. */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      <span>เล่มที่ : {selectedInvoice.bookNo || selectedInvoice.room.number}</span>
                      <span>เลขที่ : {selectedInvoice.invoiceNoStr || '1'}</span>
                    </div>

                    {/* Black Title Banner: ใบเสร็จรับเงิน */}
                    <div
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        padding: '4px 0',
                        letterSpacing: '2px',
                        marginBottom: '14px',
                      }}
                    >
                      ใบเสร็จรับเงิน
                    </div>

                    {/* Top Right Property Box */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                      <div
                        style={{
                          border: '1.5px solid #000000',
                          padding: '6px 14px',
                          textAlign: 'center',
                          minWidth: '260px',
                          fontSize: '12px',
                          lineHeight: 1.35,
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                          {selectedInvoice.room.floor.building.name}
                        </div>
                        <div>{selectedInvoice.room.floor.building.address || '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110'}</div>
                        <div>โทร. {selectedInvoice.room.floor.building.phone || '096-2624963, 044-633888'}</div>
                      </div>
                    </div>

                    {/* Details Lines */}
                    <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                        <div>
                          <strong style={{ width: '55px', display: 'inline-block' }}>วันที่ :</strong>{' '}
                          {formatThaiDateLong(selectedInvoice.createdAt)}
                        </div>
                        <div style={{ marginRight: '40px', whiteSpace: 'nowrap' }}>
                          <strong style={{ display: 'inline-block' }}>ประจำเดือน :</strong>{' '}
                          {formatThaiMonthOnly(selectedInvoice.billingPeriod)}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ width: '55px', display: 'inline-block' }}>ผู้เช่า :</strong> {selectedInvoice.tenant.name}
                      </div>
                      <div>
                        <strong style={{ width: '55px', display: 'inline-block' }}>ที่อยู่ :</strong> ห้อง {selectedInvoice.room.number}{' '}
                        {(selectedInvoice.room.floor.building.address || '').replace(/^[0-9\/]+\s*/, '')}
                      </div>
                    </div>

                    {/* Main Itemized Table */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                        border: '1.5px solid #000000',
                        marginBottom: '12px',
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #000000', backgroundColor: '#f2f2f2' }}>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                            รายการ
                          </th>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '55px' }}>
                            หน่วยละ
                          </th>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>
                            ใช้ไป
                          </th>
                          <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.rentCost > 0 && (
                          <tr style={{ height: '26px' }}>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                              ค่าเช่าเดือน{formatThaiMonthOnly(selectedInvoice.billingPeriod)}
                            </td>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                            <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                              {selectedInvoice.rentCost.toLocaleString()}
                            </td>
                          </tr>
                        )}

                        <tr style={{ height: '26px' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                            ค่าน้ำ{' '}
                            <span style={{ marginLeft: '40px' }}>
                              ( {selectedInvoice.previousWater} - {selectedInvoice.currentWater} )
                            </span>
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {selectedInvoice.room.waterBillingType === 'FLAT'
                              ? 'เหมาจ่าย'
                              : selectedInvoice.waterRate ??
                                (selectedInvoice.waterCost > 0 && selectedInvoice.currentWater - selectedInvoice.previousWater > 0
                                  ? selectedInvoice.waterCost / (selectedInvoice.currentWater - selectedInvoice.previousWater)
                                  : selectedInvoice.room.floor.building.waterRate)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {Math.max(0, selectedInvoice.currentWater - selectedInvoice.previousWater)}
                          </td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                            {selectedInvoice.waterCost.toLocaleString()}
                          </td>
                        </tr>

                        <tr style={{ height: '26px' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                            ค่าไฟ{' '}
                            <span style={{ marginLeft: '40px' }}>
                              ( {selectedInvoice.previousElec} - {selectedInvoice.currentElec} )
                            </span>
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {selectedInvoice.room.elecBillingType === 'FLAT'
                              ? 'เหมาจ่าย'
                              : selectedInvoice.electricityRate ??
                                (selectedInvoice.electricityCost > 0 && selectedInvoice.currentElec - selectedInvoice.previousElec > 0
                                  ? selectedInvoice.electricityCost / (selectedInvoice.currentElec - selectedInvoice.previousElec)
                                  : selectedInvoice.room.floor.building.electricityRate)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {Math.max(0, selectedInvoice.currentElec - selectedInvoice.previousElec)}
                          </td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                            {selectedInvoice.electricityCost.toLocaleString()}
                          </td>
                        </tr>

                        {/* Itemized Other Fees */}
                        {(() => {
                          let parsedItems: any[] = [];
                          if (selectedInvoice.otherFeeDetails) {
                            try {
                              parsedItems = JSON.parse(selectedInvoice.otherFeeDetails);
                            } catch (e) {
                              parsedItems = [];
                            }
                          }

                          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                            return parsedItems.map((item, idx) => (
                              <tr key={idx} style={{ height: '26px' }}>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>{item.name}</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                                  {item.amount.toLocaleString()}
                                </td>
                              </tr>
                            ));
                          } else if (selectedInvoice.otherCost > 0) {
                            return (
                              <tr style={{ height: '26px' }}>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>ค่าใช้จ่ายอื่นๆ</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                                  {selectedInvoice.otherCost.toLocaleString()}
                                </td>
                              </tr>
                            );
                          }
                          return null;
                        })()}

                        {/* Total Row */}
                        <tr style={{ borderTop: '1.5px solid #000000', fontWeight: 'bold' }}>
                          <td colSpan={3} style={{ borderRight: '1px solid #000000', padding: '6px 12px', textAlign: 'right' }}>
                            รวมเงิน (Total)
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '14px' }}>
                            {selectedInvoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Receiver Section */}
                    <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
                      <div style={{ textAlign: 'center', minWidth: '320px' }}>
                        <strong>ผู้รับเงิน</strong> ....................................................................................
                        <div style={{ fontSize: '12px', marginTop: '2px', color: paymentReceiverName ? '#000000' : '#555555' }}>
                          ( {paymentReceiverName || 'ลงชื่อผู้รับเงิน'} )
                        </div>
                      </div>
                    </div>

                    {/* Bottom Note */}
                    <div style={{ fontSize: '12.5px', marginTop: '6px', minHeight: '24px' }}>
                      <strong>*** หมายเหตุ :</strong> {selectedInvoice.otherNote || ''}
                    </div>
                  </div>
                ) : (
                  /* --- OFFICIAL A5 INVOICE TEMPLATE (ใบแจ้งหนี้) --- */
                  <div
                    className="a5-printable-card"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      padding: '16px 20px',
                      border: '1px solid #000000',
                      borderRadius: '2px',
                      fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      lineHeight: 1.4,
                      margin: '0 auto',
                      maxWidth: '720px',
                    }}
                  >
                    {/* Top Header: Book No. & Invoice No. */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                      <span>เล่มที่ : {selectedInvoice.bookNo || selectedInvoice.room.number}</span>
                      <span>เลขที่ : {selectedInvoice.invoiceNoStr || '1'}</span>
                    </div>

                    {/* Black Title Banner: ใบแจ้งหนี้ */}
                    <div
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        padding: '4px 0',
                        letterSpacing: '2px',
                        marginBottom: '14px',
                      }}
                    >
                      ใบแจ้งหนี้
                    </div>

                    {/* Top Right Property Box */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                      <div
                        style={{
                          border: '1.5px solid #000000',
                          padding: '6px 14px',
                          textAlign: 'center',
                          minWidth: '260px',
                          fontSize: '12px',
                          lineHeight: 1.35,
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                          {selectedInvoice.room.floor.building.name}
                        </div>
                        <div>{selectedInvoice.room.floor.building.address || '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110'}</div>
                        <div>โทร. {selectedInvoice.room.floor.building.phone || '096-2624963, 044-633888'}</div>
                      </div>
                    </div>

                    {/* Details Lines */}
                    <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                        <div>
                          <strong style={{ width: '55px', display: 'inline-block' }}>วันที่ :</strong>{' '}
                          {formatThaiDateLong(selectedInvoice.createdAt)}
                        </div>
                        <div style={{ marginRight: '40px', whiteSpace: 'nowrap' }}>
                          <strong style={{ display: 'inline-block' }}>ประจำเดือน :</strong>{' '}
                          {formatThaiMonthOnly(selectedInvoice.billingPeriod)}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ width: '55px', display: 'inline-block' }}>ผู้เช่า :</strong> {selectedInvoice.tenant.name}
                      </div>
                      <div>
                        <strong style={{ width: '55px', display: 'inline-block' }}>ที่อยู่ :</strong> ห้อง {selectedInvoice.room.number}{' '}
                        {(selectedInvoice.room.floor.building.address || '').replace(/^[0-9\/]+\s*/, '')}
                      </div>
                    </div>

                    {/* Main Itemized Table */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                        border: '1.5px solid #000000',
                        marginBottom: '12px',
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #000000', backgroundColor: '#f2f2f2' }}>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                            รายการ
                          </th>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '55px' }}>
                            หน่วยละ
                          </th>
                          <th style={{ borderRight: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '45px' }}>
                            ใช้ไป
                          </th>
                          <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '100px' }}>จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.rentCost > 0 && (
                          <tr style={{ height: '26px' }}>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                              ค่าเช่าเดือน{formatThaiMonthOnly(selectedInvoice.billingPeriod)}
                            </td>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                            <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                            <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                              {selectedInvoice.rentCost.toLocaleString()}
                            </td>
                          </tr>
                        )}

                        <tr style={{ height: '26px' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                            ค่าน้ำ{' '}
                            <span style={{ marginLeft: '40px' }}>
                              ( {selectedInvoice.previousWater} - {selectedInvoice.currentWater} )
                            </span>
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {selectedInvoice.room.waterBillingType === 'FLAT'
                              ? 'เหมาจ่าย'
                              : selectedInvoice.waterRate ??
                                (selectedInvoice.waterCost > 0 && selectedInvoice.currentWater - selectedInvoice.previousWater > 0
                                  ? selectedInvoice.waterCost / (selectedInvoice.currentWater - selectedInvoice.previousWater)
                                  : selectedInvoice.room.floor.building.waterRate)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {Math.max(0, selectedInvoice.currentWater - selectedInvoice.previousWater)}
                          </td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                            {selectedInvoice.waterCost.toLocaleString()}
                          </td>
                        </tr>

                        <tr style={{ height: '26px' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>
                            ค่าไฟ{' '}
                            <span style={{ marginLeft: '40px' }}>
                              ( {selectedInvoice.previousElec} - {selectedInvoice.currentElec} )
                            </span>
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {selectedInvoice.room.elecBillingType === 'FLAT'
                              ? 'เหมาจ่าย'
                              : selectedInvoice.electricityRate ??
                                (selectedInvoice.electricityCost > 0 && selectedInvoice.currentElec - selectedInvoice.previousElec > 0
                                  ? selectedInvoice.electricityCost / (selectedInvoice.currentElec - selectedInvoice.previousElec)
                                  : selectedInvoice.room.floor.building.electricityRate)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>
                            {Math.max(0, selectedInvoice.currentElec - selectedInvoice.previousElec)}
                          </td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                            {selectedInvoice.electricityCost.toLocaleString()}
                          </td>
                        </tr>

                        {/* Itemized Other Fees */}
                        {(() => {
                          let parsedItems: any[] = [];
                          if (selectedInvoice.otherFeeDetails) {
                            try {
                              parsedItems = JSON.parse(selectedInvoice.otherFeeDetails);
                            } catch (e) {
                              parsedItems = [];
                            }
                          }

                          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                            return parsedItems.map((item, idx) => (
                              <tr key={idx} style={{ height: '26px' }}>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>{item.name}</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                                  {item.amount.toLocaleString()}
                                </td>
                              </tr>
                            ));
                          } else if (selectedInvoice.otherCost > 0) {
                            return (
                              <tr style={{ height: '26px' }}>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 10px' }}>ค่าใช้จ่ายอื่นๆ</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ borderRight: '1px solid #000000', padding: '4px 8px', textAlign: 'center' }}>-</td>
                                <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: '500' }}>
                                  {selectedInvoice.otherCost.toLocaleString()}
                                </td>
                              </tr>
                            );
                          }
                          return null;
                        })()}

                        {/* Total Row */}
                        <tr style={{ borderTop: '1.5px solid #000000', fontWeight: 'bold' }}>
                          <td colSpan={3} style={{ borderRight: '1px solid #000000', padding: '6px 12px', textAlign: 'right' }}>
                            รวมเงิน (Total)
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '14px' }}>
                            {selectedInvoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bottom Note */}
                    <div style={{ fontSize: '12.5px', marginTop: '18px', minHeight: '24px' }}>
                      <strong>*** หมายเหตุ :</strong> {selectedInvoice.otherNote || ''}
                    </div>

                    {/* PromptPay QR Section (Optional Toggle) */}
                    {showInvoiceQr && (() => {
                      const bObj = selectedInvoice.room?.floor?.building;
                      const qrImgUrl = bObj?.promptPayQrUrl || (bObj?.promptPayId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bObj.promptPayId)}` : null);
                      const accName = bObj?.promptPayName || bObj?.name || 'ธารทิพย์ อพาร์ทเมนท์';

                      return (
                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #cccccc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#fafafa',
                            padding: '8px 12px',
                            borderRadius: '4px',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#333333' }}>
                            <div style={{ fontWeight: 'bold', color: '#000', fontSize: '12px' }}>📲 สแกนชำระเงินด้วย PromptPay</div>
                            <div>ยอดชำระ: <strong>{selectedInvoice.totalAmount.toLocaleString()} บาท</strong></div>
                            <div>ชื่อบัญชี: <strong>{accName}</strong></div>
                            {bObj?.promptPayId && <div>เลข PromptPay: <strong>{bObj.promptPayId}</strong></div>}
                          </div>
                          {qrImgUrl ? (
                            <img
                              src={qrImgUrl}
                              alt="PromptPay QR Code"
                              style={{ width: '75px', height: '75px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}
                            />
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', padding: '0.4rem', border: '1px dashed #cbd5e1', borderRadius: '4px' }}>
                              ยังไม่ได้ตั้งค่า<br />รูป QR Code
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4.5: EDIT INVOICE MODAL --- */}
      {showEditInvoiceModal && selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '650px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                ✏️ แก้ไขใบแจ้งหนี้ - ห้อง {selectedInvoice.room.number} ({formatThaiBillingPeriod(selectedInvoice.billingPeriod)})
              </h2>
              <button className={styles.modalClose} onClick={() => setShowEditInvoiceModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleEditInvoiceSubmit}>
              <div className={styles.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Status & Due Date */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>สถานะใบแจ้งหนี้ *</label>
                      <select className={styles.formSelect} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="UNPAID">ค้างชำระ (UNPAID)</option>
                        <option value="PAID">ชำระแล้ว (PAID)</option>
                        <option value="OVERDUE">เกินกำหนด (OVERDUE)</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>วันที่ครบกำหนดชำระ *</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Rent & Utility Rates */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                      💧⚡ มิเตอร์น้ำ-ไฟ & อัตราค่าน้ำไฟประจำบิลนี้
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          มิเตอร์น้ำเดิม
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editPrevWater}
                          onChange={(e) => setEditPrevWater(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          มิเตอร์น้ำใหม่
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editCurWater}
                          onChange={(e) => setEditCurWater(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          ค่าน้ำ (บ./หน่วย)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editWaterRate}
                          onChange={(e) => setEditWaterRate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          มิเตอร์ไฟเดิม
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editPrevElec}
                          onChange={(e) => setEditPrevElec(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          มิเตอร์ไฟใหม่
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editCurElec}
                          onChange={(e) => setEditCurElec(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                          ค่าไฟ (บ./หน่วย)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={styles.formInput}
                          value={editElecRate}
                          onChange={(e) => setEditElecRate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rent Cost */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ค่าเช่าห้อง (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      className={styles.formInput}
                      value={editRentCost}
                      onChange={(e) => setEditRentCost(e.target.value)}
                    />
                  </div>

                  {/* Other Fee Items */}
                  <div style={{ border: '1px solid var(--border-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className={styles.formLabel} style={{ marginBottom: 0, fontWeight: 'bold', fontSize: '0.88rem' }}>
                        ➕ รายการย่อยค่าใช้จ่ายอื่นๆ
                      </label>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setEditOtherFeeItems([...editOtherFeeItems, { id: Date.now().toString(), name: '', amount: '' }])}
                      >
                        + เพิ่มรายการ
                      </button>
                    </div>

                    {editOtherFeeItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <input
                          type="text"
                          placeholder="ชื่อรายการ"
                          className={styles.formInput}
                          style={{ flex: 2, padding: '0.4rem', fontSize: '0.85rem' }}
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...editOtherFeeItems];
                            updated[idx].name = e.target.value;
                            setEditOtherFeeItems(updated);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="จำนวนเงิน"
                          className={styles.formInput}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                          value={item.amount}
                          onChange={(e) => {
                            const updated = [...editOtherFeeItems];
                            updated[idx].amount = e.target.value;
                            setEditOtherFeeItems(updated);
                          }}
                        />
                        {editOtherFeeItems.length > 1 && (
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                            onClick={() => setEditOtherFeeItems(editOtherFeeItems.filter((i) => i.id !== item.id))}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Other Note */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>หมายเหตุเพิ่มเติมท้ายบิล A5</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editOtherNote}
                      onChange={(e) => setEditOtherNote(e.target.value)}
                      placeholder="เช่น หมายเหตุพิเศษ"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowEditInvoiceModal(false)}>
                  ❌ ยกเลิก
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  💾 บันทึกการแก้ไขใบแจ้งหนี้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
