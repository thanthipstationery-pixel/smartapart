'use client';

import React from 'react';
import { calculateCheckInPayment } from '@/lib/billingRules';
import { formatThaiBillingPeriod, formatThaiDateNumeric, autoFormatPhoneInput, autoFormatIdCardInput } from '@/lib/thaiDate';

interface CheckInModalProps {
  showCheckInModal: boolean;
  setShowCheckInModal: (val: boolean) => void;
  setShowRoomModal: (val: boolean) => void;
  selectedRoom: any;
  handleCheckInSubmit: (e: React.FormEvent) => void;
  isScanningIdCard: boolean;
  handleScanIdCard: (e: React.ChangeEvent<HTMLInputElement>, mode: 'CHECK_IN' | 'BOOKING') => void;
  checkInName: string;
  setCheckInName: (val: string) => void;
  checkInPhone: string;
  setCheckInPhone: (val: string) => void;
  checkInIdCard: string;
  setCheckInIdCard: (val: string) => void;
  checkInAddress: string;
  setCheckInAddress: (val: string) => void;
  checkInWorkplace: string;
  setCheckInWorkplace: (val: string) => void;
  checkInLineId: string;
  setCheckInLineId: (val: string) => void;
  checkInEmergencyName: string;
  setCheckInEmergencyName: (val: string) => void;
  checkInEmergencyRel: string;
  setCheckInEmergencyRel: (val: string) => void;
  checkInEmergencyPhone: string;
  setCheckInEmergencyPhone: (val: string) => void;
  checkInSecurityDeposit: string;
  setCheckInSecurityDeposit: (val: string) => void;
  checkInUseKeycard: boolean;
  setCheckInUseKeycard: (val: boolean) => void;
  checkInKeycardCount: string;
  setCheckInKeycardCount: (val: string) => void;
  checkInKeycardDeposit: string;
  setCheckInKeycardDeposit: (val: string) => void;
  checkInKeycardCode: string;
  setCheckInKeycardCode: (val: string) => void;
  checkInDate: string;
  setCheckInDate: (val: string) => void;
  checkInWaterMeter: string;
  setCheckInWaterMeter: (val: string) => void;
  checkInElecMeter: string;
  setCheckInElecMeter: (val: string) => void;
  checkInNote: string;
  setCheckInNote: (val: string) => void;
  styles: any;
}

export default function CheckInModal({
  showCheckInModal,
  setShowCheckInModal,
  setShowRoomModal,
  selectedRoom,
  handleCheckInSubmit,
  isScanningIdCard,
  handleScanIdCard,
  checkInName,
  setCheckInName,
  checkInPhone,
  setCheckInPhone,
  checkInIdCard,
  setCheckInIdCard,
  checkInAddress,
  setCheckInAddress,
  checkInWorkplace,
  setCheckInWorkplace,
  checkInLineId,
  setCheckInLineId,
  checkInEmergencyName,
  setCheckInEmergencyName,
  checkInEmergencyRel,
  setCheckInEmergencyRel,
  checkInEmergencyPhone,
  setCheckInEmergencyPhone,
  checkInSecurityDeposit,
  setCheckInSecurityDeposit,
  checkInUseKeycard,
  setCheckInUseKeycard,
  checkInKeycardCount,
  setCheckInKeycardCount,
  checkInKeycardDeposit,
  setCheckInKeycardDeposit,
  checkInKeycardCode,
  setCheckInKeycardCode,
  checkInDate,
  setCheckInDate,
  checkInWaterMeter,
  setCheckInWaterMeter,
  checkInElecMeter,
  setCheckInElecMeter,
  checkInNote,
  setCheckInNote,
  styles,
}: CheckInModalProps) {
  if (!showCheckInModal || !selectedRoom) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>ลงทะเบียนผู้เช่าใหม่ - ห้อง {selectedRoom.number}</h2>
          <button
            className={styles.modalClose}
            onClick={() => {
              setShowCheckInModal(false);
              setShowRoomModal(true);
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleCheckInSubmit}>
          <div className={styles.modalBody}>
            {/* AI ID Card OCR Camera Banner */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1e40af' }}>
                    สแกนบัตรประชาชนด้วย AI อัตโนมัติ (Auto-fill)
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#3b82f6' }}>
                    ถ่ายรูปหรืออัปโหลดภาพบัตรฯ ระบบจะกรอกชื่อ เลขบัตร 13 หลัก และที่ให้อัตโนมัติ
                  </div>
                </div>
              </div>
              <label
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
              >
                {isScanningIdCard ? '⚡ กำลังสแกน...' : '✨ ถ่ายรูป / อัปโหลดบัตร'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleScanIdCard(e, 'CHECK_IN')}
                  style={{ display: 'none' }}
                  disabled={isScanningIdCard}
                />
              </label>
            </div>

            {/* SECTION 1: ข้อมูลส่วนตัว */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: '#1e293b',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.4rem',
              }}
            >
              👤 <span>ข้อมูลส่วนตัวผู้เช่า</span>
            </div>
            <div className={styles.formGrid} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInName}
                  onChange={(e) => setCheckInName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุลจริง"
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
                  value={checkInPhone}
                  onChange={(e) => setCheckInPhone(autoFormatPhoneInput(e.target.value))}
                  placeholder="081-234-5678"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เลขบัตรประชาชน</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={17}
                  className={styles.formInput}
                  value={checkInIdCard}
                  onChange={(e) => setCheckInIdCard(autoFormatIdCardInput(e.target.value))}
                  placeholder="1 2345 67890 12 3"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ที่อยู่ตามบัตรประชาชน</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInAddress}
                  onChange={(e) => setCheckInAddress(e.target.value)}
                  placeholder="กรอกบ้านเลขที่/หมู่/ตำบล/อำเภอ/จังหวัด"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>สถานที่ทำงาน / สถานศึกษา</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInWorkplace}
                  onChange={(e) => setCheckInWorkplace(e.target.value)}
                  placeholder="ระบุสถานที่ทำงานหรือโรงเรียน/มหาลัย"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Line ID</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInLineId}
                  onChange={(e) => setCheckInLineId(e.target.value)}
                  placeholder="กรอกไอดีไลน์"
                />
              </div>
            </div>

            {/* SECTION 2: ผู้ติดต่อกรณีฉุกเฉิน */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: '#1e293b',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.4rem',
              }}
            >
              🚨 <span>ผู้ติดต่อกรณีฉุกเฉิน (Emergency Contact)</span>
            </div>
            <div className={styles.formGrid} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อผู้ติดต่อฉุกเฉิน</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInEmergencyName}
                  onChange={(e) => setCheckInEmergencyName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล ผู้ติดต่อกรณีฉุกเฉิน"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ความสัมพันธ์</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInEmergencyRel}
                  onChange={(e) => setCheckInEmergencyRel(e.target.value)}
                  placeholder="เช่น พ่อ, แม่, พี่สาว, เพื่อน"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เบอร์โทรศัพท์ฉุกเฉิน</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  className={styles.formInput}
                  value={checkInEmergencyPhone}
                  onChange={(e) => setCheckInEmergencyPhone(autoFormatPhoneInput(e.target.value))}
                  placeholder="081-234-5678"
                />
              </div>
            </div>

            {/* SECTION 3: เงินประกัน & คีย์การ์ด */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: '#1e293b',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.4rem',
              }}
            >
              🔑 <span>เงินประกันสัญญา & มัดจำคีย์การ์ด</span>
            </div>
            <div className={styles.formGrid} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>💵 เงินประกันสัญญาเช่า (บาท)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={styles.formInput}
                  value={checkInSecurityDeposit}
                  onChange={(e) => setCheckInSecurityDeposit(e.target.value)}
                  placeholder="เช่น 3000"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>🔑 การใช้คีย์การ์ดเข้า-ออกประตู</label>
                <select
                  className={styles.formSelect}
                  value={checkInUseKeycard ? 'YES' : 'NO'}
                  onChange={(e) => {
                    const hasKc = e.target.value === 'YES';
                    setCheckInUseKeycard(hasKc);
                    if (!hasKc) {
                      setCheckInKeycardCount('0');
                      setCheckInKeycardDeposit('0');
                      setCheckInKeycardCode('');
                    } else {
                      setCheckInKeycardCount('1');
                      setCheckInKeycardDeposit('100');
                    }
                  }}
                >
                  <option value="NO">ไม่มีการใช้งานคีย์การ์ด</option>
                  <option value="YES">มีการใช้งานคีย์การ์ด</option>
                </select>
              </div>

              {checkInUseKeycard && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>🔑 จำนวนคีย์การ์ดที่รับไป (ใบ)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={styles.formInput}
                      value={checkInKeycardCount}
                      onChange={(e) => setCheckInKeycardCount(e.target.value)}
                      placeholder="เช่น 1 หรือ 2"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>💳 ยอดเงินมัดจำคีย์การ์ดรวม (บาท)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={styles.formInput}
                      value={checkInKeycardDeposit}
                      onChange={(e) => setCheckInKeycardDeposit(e.target.value)}
                      placeholder="เช่น 100 หรือ 200"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.formLabel}>🏷️ รหัส/เลขบัตรคีย์การ์ด (ถ้ามี)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={checkInKeycardCode}
                      onChange={(e) => setCheckInKeycardCode(e.target.value)}
                      placeholder="เช่น #001, #002"
                    />
                  </div>
                </>
              )}
            </div>

            {/* SECTION 4: วันที่เช่า มิเตอร์แรกเข้า และหมายเหตุ */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: '#1e293b',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.4rem',
              }}
            >
              ⚡ <span>มิเตอร์แรกเข้า & หมายเหตุ</span>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  วันที่ย้ายเข้าทำสัญญา <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(checkInDate)})</span> *
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                />
              </div>

              {/* Live Check-In Payment Calculation Box */}
              {(() => {
                const parsedDeposit =
                  checkInSecurityDeposit !== '' && !isNaN(parseFloat(checkInSecurityDeposit))
                    ? parseFloat(checkInSecurityDeposit)
                    : selectedRoom.basePrice;

                const calc = calculateCheckInPayment(
                  checkInDate || new Date().toISOString().split('T')[0],
                  selectedRoom.basePrice,
                  parsedDeposit
                );

                const kcDepNum = checkInUseKeycard && checkInKeycardDeposit ? parseFloat(checkInKeycardDeposit) : 0;
                const grandTotal = calc.totalInitialPayment + kcDepNum;

                return (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '0.85rem 1rem',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #0284c7',
                      borderRadius: 'var(--radius-md)',
                      margin: '0.25rem 0 0.75rem 0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.4rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '0.92rem' }}>
                        💡 สรุปการคิดเงินแรกเข้า: {calc.ruleName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.6rem',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        ออกบิลใบแรกประจำเดือน {formatThaiBillingPeriod(calc.billingPeriod)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: '#334155',
                        marginBottom: '0.5rem',
                        lineHeight: 1.5,
                        backgroundColor: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      📌 <strong>รายละเอียด:</strong> {calc.formulaDetails}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        borderTop: '1px dashed #cbd5e1',
                        paddingTop: '0.5rem',
                        marginTop: '0.4rem',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>💰 ยอดรับชำระวันแรกเข้ารวมสุทธิ:</span>
                      <span style={{ color: '#0284c7', fontSize: '1.15rem', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                        {grandTotal.toLocaleString()}&nbsp;บาท
                      </span>
                    </div>
                  </div>
                );
              })()}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>💧 เลขมิเตอร์น้ำเริ่มต้นสัญญา *</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  className={styles.formInput}
                  value={checkInWaterMeter}
                  onChange={(e) => setCheckInWaterMeter(e.target.value)}
                  placeholder="เช่น 15.0"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>⚡ เลขมิเตอร์ไฟเริ่มต้นสัญญา *</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  className={styles.formInput}
                  value={checkInElecMeter}
                  onChange={(e) => setCheckInElecMeter(e.target.value)}
                  placeholder="เช่น 122.0"
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>📝 หมายเหตุ/ข้อตกลงพิเศษ</label>
                <textarea
                  className={styles.formInput}
                  rows={2}
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="ระบุหมายเหตุหรือข้อตกลงพิเศษ (ถ้ามี)"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setShowCheckInModal(false);
                setShowRoomModal(true);
              }}
            >
              ❌ ยกเลิก
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              📝 ยืนยันสัญญาเช่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
