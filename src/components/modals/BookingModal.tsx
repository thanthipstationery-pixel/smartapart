'use client';

import React from 'react';
import { formatThaiDateNumeric, autoFormatPhoneInput, autoFormatIdCardInput } from '@/lib/thaiDate';

interface BookingModalProps {
  showBookingModal: boolean;
  setShowBookingModal: (val: boolean) => void;
  setShowRoomModal: (val: boolean) => void;
  selectedRoom: any;
  bookingMode: 'EXPRESS' | 'FULL';
  setBookingMode: (val: 'EXPRESS' | 'FULL') => void;
  handleBookingSubmit: (e: React.FormEvent) => void;
  isScanningIdCard: boolean;
  handleScanIdCard: (e: React.ChangeEvent<HTMLInputElement>, mode: 'CHECK_IN' | 'BOOKING') => void;
  bookingName: string;
  setBookingName: (val: string) => void;
  bookingPhone: string;
  setBookingPhone: (val: string) => void;
  bookingCheckInDate: string;
  setBookingCheckInDate: (val: string) => void;
  bookingDeposit: string;
  setBookingDeposit: (val: string) => void;
  bookingIdCard: string;
  setBookingIdCard: (val: string) => void;
  bookingLineId: string;
  setBookingLineId: (val: string) => void;
  bookingEmail: string;
  setBookingEmail: (val: string) => void;
  bookingPaymentMethod: string;
  setBookingPaymentMethod: (val: string) => void;
  bookingNote: string;
  setBookingNote: (val: string) => void;
  styles: any;
}

export default function BookingModal({
  showBookingModal,
  setShowBookingModal,
  setShowRoomModal,
  selectedRoom,
  bookingMode,
  setBookingMode,
  handleBookingSubmit,
  isScanningIdCard,
  handleScanIdCard,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingCheckInDate,
  setBookingCheckInDate,
  bookingDeposit,
  setBookingDeposit,
  bookingIdCard,
  setBookingIdCard,
  bookingLineId,
  setBookingLineId,
  bookingEmail,
  setBookingEmail,
  bookingPaymentMethod,
  setBookingPaymentMethod,
  bookingNote,
  setBookingNote,
  styles,
}: BookingModalProps) {
  if (!showBookingModal || !selectedRoom) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>จองห้องพัก - ห้อง {selectedRoom.number}</h2>
          <button
            className={styles.modalClose}
            onClick={() => {
              setShowBookingModal(false);
              setShowRoomModal(true);
            }}
          >
            &times;
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            className={styles.btn}
            style={{
              flex: 1,
              backgroundColor: bookingMode === 'EXPRESS' ? '#ffc107' : 'var(--bg-color)',
              color: bookingMode === 'EXPRESS' ? '#000' : 'var(--text-secondary)',
              fontWeight: 'bold',
              border: '1px solid var(--border-color)',
            }}
            onClick={() => setBookingMode('EXPRESS')}
          >
            ⚡ จองด่วน (Express)
          </button>
          <button
            type="button"
            className={styles.btn}
            style={{
              flex: 1,
              backgroundColor: bookingMode === 'FULL' ? 'var(--primary-color)' : 'var(--bg-color)',
              color: bookingMode === 'FULL' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 'bold',
              border: '1px solid var(--border-color)',
            }}
            onClick={() => setBookingMode('FULL')}
          >
            📋 จองแบบเต็ม (Full)
          </button>
        </div>

        <form onSubmit={handleBookingSubmit}>
          <div className={styles.modalBody}>
            {/* AI ID Card OCR Camera Banner for Booking */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📷</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#856404' }}>สแกนบัตรประชาชนอัตโนมัติ (Auto-fill)</div>
                  <div style={{ fontSize: '0.8rem', color: '#b78103' }}>ถ่ายรูปหรืออัปโหลดรูปบัตรเพื่อกรอกชื่อและเลขบัตรประชาชนอัตโนมัติ</div>
                </div>
              </div>
              <label
                className={`${styles.btn}`}
                style={{
                  margin: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  fontWeight: 600,
                }}
              >
                {isScanningIdCard ? '⚡ กำลังสแกน...' : '✨ ถ่ายรูป / อัปโหลดบัตร'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleScanIdCard(e, 'BOOKING')}
                  style={{ display: 'none' }}
                  disabled={isScanningIdCard}
                />
              </label>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อ-นามสกุล ผู้จอง *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  placeholder="กรอกชื่อผู้จอง"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  className={styles.formInput}
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(autoFormatPhoneInput(e.target.value))}
                  placeholder="081-234-5678"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  กำหนดวันย้ายเข้า <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(bookingCheckInDate)})</span> *
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={bookingCheckInDate}
                  onChange={(e) => setBookingCheckInDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>จำนวนเงินมัดจำ (บาท)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={styles.formInput}
                  value={bookingDeposit}
                  onChange={(e) => setBookingDeposit(e.target.value)}
                  placeholder="เช่น 1000 (ใส่ 0 หากยังไม่โอน)"
                />
              </div>

              {bookingMode === 'FULL' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>เลขบัตรประชาชน</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      maxLength={17}
                      className={styles.formInput}
                      value={bookingIdCard}
                      onChange={(e) => setBookingIdCard(autoFormatIdCardInput(e.target.value))}
                      placeholder="1 2345 67890 12 3"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Line ID</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={bookingLineId}
                      onChange={(e) => setBookingLineId(e.target.value)}
                      placeholder="กรอกไอดีไลน์"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>อีเมล</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ช่องทางการชำระเงินมัดจำ</label>
                    <select
                      className={styles.formInput}
                      value={bookingPaymentMethod}
                      onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">💵 เงินสด</option>
                      <option value="TRANSFER">🏦 โอนเงินผ่านธนาคาร</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.formLabel}>หมายเหตุเพิ่มเติม</label>
                    <textarea
                      className={styles.formInput}
                      rows={2}
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setShowBookingModal(false);
                setShowRoomModal(true);
              }}
            >
              ❌ ยกเลิก
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ backgroundColor: '#ffc107', color: '#000', fontWeight: 'bold' }}
            >
              📅 ยืนยันบันทึกการจอง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
