'use client';

import React from 'react';
import { validateCheckOutNotice } from '@/lib/billingRules';
import { formatThaiDateLong, formatThaiDateNumeric } from '@/lib/thaiDate';

interface CheckOutModalProps {
  showCheckOutModal: boolean;
  setShowCheckOutModal: (val: boolean) => void;
  selectedRoom: any;
  activeCheckOutTenant: any;
  handleCheckOutSubmit: (e: React.FormEvent) => void;
  checkOutActionType: 'RECORD_NOTICE_ONLY' | 'FINAL_CHECKOUT';
  setCheckOutActionType: (val: 'RECORD_NOTICE_ONLY' | 'FINAL_CHECKOUT') => void;
  checkOutNoticeDate: string;
  setCheckOutNoticeDate: (val: string) => void;
  checkOutDate: string;
  setCheckOutDate: (val: string) => void;
  checkOutOverrideForfeit: boolean;
  setCheckOutOverrideForfeit: (val: boolean) => void;
  checkOutFinalWater: string;
  setCheckOutFinalWater: (val: string) => void;
  checkOutFinalElec: string;
  setCheckOutFinalElec: (val: string) => void;
  checkOutKeycardsReturned: string;
  setCheckOutKeycardsReturned: (val: string) => void;
  checkOutRefundProratedRent: boolean;
  setCheckOutRefundProratedRent: (val: boolean) => void;
  checkOutCleaningFee: string;
  setCheckOutCleaningFee: (val: string) => void;
  checkOutRepairFee: string;
  setCheckOutRepairFee: (val: string) => void;
  checkOutOtherDeductions: string;
  setCheckOutOtherDeductions: (val: string) => void;
  checkOutNote: string;
  setCheckOutNote: (val: string) => void;
  showCheckOutReceiptModal: boolean;
  setShowCheckOutReceiptModal: (val: boolean) => void;
  checkOutReceiptData: any;
  styles: any;
}

export default function CheckOutModal({
  showCheckOutModal,
  setShowCheckOutModal,
  selectedRoom,
  activeCheckOutTenant,
  handleCheckOutSubmit,
  checkOutActionType,
  setCheckOutActionType,
  checkOutNoticeDate,
  setCheckOutNoticeDate,
  checkOutDate,
  setCheckOutDate,
  checkOutOverrideForfeit,
  setCheckOutOverrideForfeit,
  checkOutFinalWater,
  setCheckOutFinalWater,
  checkOutFinalElec,
  setCheckOutFinalElec,
  checkOutKeycardsReturned,
  setCheckOutKeycardsReturned,
  checkOutRefundProratedRent,
  setCheckOutRefundProratedRent,
  checkOutCleaningFee,
  setCheckOutCleaningFee,
  checkOutRepairFee,
  setCheckOutRepairFee,
  checkOutOtherDeductions,
  setCheckOutOtherDeductions,
  checkOutNote,
  setCheckOutNote,
  showCheckOutReceiptModal,
  setShowCheckOutReceiptModal,
  checkOutReceiptData,
  styles,
}: CheckOutModalProps) {
  return (
    <>
      {/* --- MODAL 2.2: CHECK-OUT & DEPOSIT DEDUCTION MODAL --- */}
      {showCheckOutModal && selectedRoom && activeCheckOutTenant && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '680px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ fontSize: '1.15rem' }}>
                🚪 การจัดการย้ายออก - ห้อง {selectedRoom.number} ({selectedRoom.floor?.building?.name || ''})
              </h2>
              <button className={styles.modalClose} onClick={() => setShowCheckOutModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCheckOutSubmit}>
              <div className={styles.modalBody} style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                {/* 🔀 Mode Action Switcher */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-color)',
                    padding: '0.35rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCheckOutActionType('RECORD_NOTICE_ONLY')}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: checkOutActionType === 'RECORD_NOTICE_ONLY' ? '#3b82f6' : 'transparent',
                      color: checkOutActionType === 'RECORD_NOTICE_ONLY' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    📌 1. บันทึกแจ้งล่วงหน้า (ยังไม่คืนห้อง)
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckOutActionType('FINAL_CHECKOUT')}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: checkOutActionType === 'FINAL_CHECKOUT' ? '#ef4444' : 'transparent',
                      color: checkOutActionType === 'FINAL_CHECKOUT' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    🏁 2. คืนห้อง & สรุปมัดจำ (วันออกจริง)
                  </button>
                </div>

                {/* ผู้เช่า & เงินมัดจำเดิม */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>👤 ผู้เช่า: {activeCheckOutTenant.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📞 {activeCheckOutTenant.phone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                      💵 มัดจำประกันสัญญา: {(activeCheckOutTenant.securityDeposit || 0).toLocaleString()} ฿
                    </span>
                    <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                      🔑 มัดจำคีย์การ์ด: {(activeCheckOutTenant.keycardDeposit || 0).toLocaleString()} ฿ (
                      {activeCheckOutTenant.keycardCount || 0} ใบ)
                    </span>
                  </div>
                </div>

                {/* STEP 1: วันที่แจ้งย้ายออก & วันที่คาดว่าจะย้ายออกจริง */}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    1️⃣ วันที่ผู้เช่าแจ้ง & วันที่กำหนดจะย้ายออกจริง (กฎแจ้งล่วงหน้า 30 วัน)
                  </div>

                  <div className={styles.formGrid} style={{ marginBottom: '0.75rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>📅 วันที่ผู้เช่าแจ้งย้ายออก *</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={checkOutNoticeDate}
                        onChange={(e) => setCheckOutNoticeDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>🚪 วันที่ย้ายออกจริง / คาดว่าจะย้ายออก *</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Notice Check Live Status Box */}
                  {(() => {
                    const check = validateCheckOutNotice(
                      activeCheckOutTenant.startDate,
                      checkOutDate || new Date().toISOString().split('T')[0],
                      checkOutNoticeDate || checkOutDate || new Date().toISOString().split('T')[0],
                      checkOutOverrideForfeit
                    );

                    return (
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: check.meetsNoticePeriod ? '#f0fdf4' : checkOutOverrideForfeit ? '#fefce8' : '#fef2f2',
                          border: `1.5px solid ${check.meetsNoticePeriod ? '#86efac' : checkOutOverrideForfeit ? '#fde047' : '#fca5a5'}`,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '0.88rem',
                            color: check.meetsNoticePeriod ? '#166534' : checkOutOverrideForfeit ? '#854d0e' : '#991b1b',
                            marginBottom: '0.3rem',
                          }}
                        >
                          {check.warningMessage} (แจ้งล่วงหน้า {check.noticeGivenDays} วัน)
                        </div>

                        {!check.meetsNoticePeriod && checkOutActionType === 'FINAL_CHECKOUT' && (
                          <div style={{ marginTop: '0.4rem', borderTop: '1px dashed #fca5a5', paddingTop: '0.4rem' }}>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#854d0e',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checkOutOverrideForfeit}
                                onChange={(e) => setCheckOutOverrideForfeit(e.target.checked)}
                              />
                              <span>🔓 ผ่อนปรน / ยินยอมคืนเงินมัดจำประกัน (กรณีมีเหตุจำเป็นพิเศษ)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* MODE 1 UI: RECORD NOTICE ONLY */}
                {checkOutActionType === 'RECORD_NOTICE_ONLY' && (
                  <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e40af', marginBottom: '0.4rem' }}>
                      📌 สำหรับบันทึกรับแจ้งย้ายออกล่วงหน้า (ยังไม่คืนห้องวันนี้)
                    </div>
                    <p style={{ fontSize: '0.83rem', color: '#1e3a8a', margin: 0, lineHeight: 1.5 }}>
                      ระบบจะบันทึกวันที่แจ้งและปักป้ายเตือน <strong>"📌 แจ้งย้ายออก"</strong> ไว้ที่แผนผังห้องพัก
                      เพื่อให้เปิดรับผู้เช่าใหม่หรือรับจองล่วงหน้าได้ทันที โดยที่ห้องพักจะยังคงเปิดใช้งานปกติจนกว่าจะถึงวันย้ายออกจริง
                    </p>

                    <div className={styles.formGroup} style={{ marginTop: '0.85rem' }}>
                      <label className={styles.formLabel}>📝 หมายเหตุการแจ้งย้ายออก</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkOutNote}
                        onChange={(e) => setCheckOutNote(e.target.value)}
                        placeholder="เช่น ผู้เช่าแจ้งย้ายออกเนื่องจากเรียนจบ/ย้ายที่ทำงาน"
                      />
                    </div>
                  </div>
                )}

                {/* MODE 2 UI: FINAL CHECKOUT SETTLEMENT */}
                {checkOutActionType === 'FINAL_CHECKOUT' && (
                  <>
                    {/* STEP 2: มิเตอร์น้ำ-ไฟวันย้ายออกจริง */}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        2️⃣ จดมิเตอร์น้ำ-ไฟฟ้า ณ วันย้ายออกจริง
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>💧 มิเตอร์น้ำวันย้ายออก (เดิม {selectedRoom.prevWater ?? 0}) *</label>
                          <input
                            type="number"
                            step="any"
                            className={styles.formInput}
                            value={checkOutFinalWater}
                            onChange={(e) => setCheckOutFinalWater(e.target.value)}
                            placeholder="ระบุเลขมิเตอร์น้ำ"
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>⚡ มิเตอร์ไฟวันย้ายออก (เดิม {selectedRoom.prevElec ?? 0}) *</label>
                          <input
                            type="number"
                            step="any"
                            className={styles.formInput}
                            value={checkOutFinalElec}
                            onChange={(e) => setCheckOutFinalElec(e.target.value)}
                            placeholder="ระบุเลขมิเตอร์ไฟ"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: คีย์การ์ดประตู */}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        3️⃣ การคืนคีย์การ์ดประตู
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          จำนวนคีย์การ์ดที่นำมาคืน (จากทั้งหมด {activeCheckOutTenant.keycardCount || 0} ใบ)
                        </label>
                        <select
                          className={styles.formSelect}
                          value={checkOutKeycardsReturned}
                          onChange={(e) => setCheckOutKeycardsReturned(e.target.value)}
                        >
                          {Array.from({ length: (activeCheckOutTenant.keycardCount || 0) + 1 }, (_, i) => (
                            <option key={i} value={i}>
                              คืน {i} ใบ {i === activeCheckOutTenant.keycardCount ? '(คืนครบถ้วน)' : i === 0 ? '(ไม่นำมาคืน)' : '(คืนไม่ครบ)'}
                            </option>
                          ))}
                        </select>
                        {activeCheckOutTenant.keycardCount > 0 && (
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: parseInt(checkOutKeycardsReturned) === activeCheckOutTenant.keycardCount ? '#16a34a' : '#d97706',
                              marginTop: '0.25rem',
                            }}
                          >
                            💡 คืนมัดจำคีย์การ์ด:{' '}
                            {(
                              (parseInt(checkOutKeycardsReturned || '0') / activeCheckOutTenant.keycardCount) *
                              activeCheckOutTenant.keycardDeposit
                            ).toLocaleString()}{' '}
                            ฿
                            {parseInt(checkOutKeycardsReturned) < activeCheckOutTenant.keycardCount &&
                              ` (หัก ${
                                activeCheckOutTenant.keycardDeposit -
                                (parseInt(checkOutKeycardsReturned || '0') / activeCheckOutTenant.keycardCount) *
                                  activeCheckOutTenant.keycardDeposit
                              } ฿ เป็นค่าบัตรหาย)`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* STEP 4: ตัวเลือกคืนค่าเช่าเฉลี่ย & หักค่าใช้จ่าย */}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        4️⃣ การปรับสมดุลค่าเช่า & ค่าใช้จ่ายเพิ่มเติม
                      </div>

                      {/* Prorated Rent Refund Checkbox */}
                      {(() => {
                        const outD = new Date(checkOutDate || new Date().toISOString().split('T')[0]);
                        const daysInMonth = new Date(outD.getFullYear(), outD.getMonth() + 1, 0).getDate();
                        const currentDay = outD.getDate();
                        const remainingDays = Math.max(0, daysInMonth - currentDay);
                        const dailyRent = (selectedRoom.basePrice || 0) / daysInMonth;
                        const calcRefund = Math.round(dailyRent * remainingDays);

                        return (
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: 'var(--radius-md)',
                              marginBottom: '0.85rem',
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                color: '#15803d',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checkOutRefundProratedRent}
                                onChange={(e) => setCheckOutRefundProratedRent(e.target.checked)}
                              />
                              <span>💰 คำนวณคืนค่าเช่าส่วนเฉลี่ยสำหรับ {remainingDays} วันที่ไม่ได้อยู่จริงในเดือนนี้</span>
                            </label>
                            {checkOutRefundProratedRent && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#166534', paddingLeft: '1.5rem' }}>
                                💡 ค่าเช่าเดือนนี้ {selectedRoom.basePrice?.toLocaleString()} ฿ ÷ {daysInMonth} วัน = วันละ {dailyRent.toFixed(1)}{' '}
                                ฿ ➔ <strong>คืนเงิน {calcRefund.toLocaleString()} บาท ({remainingDays} วัน)</strong>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>🧹 ค่าทำความสะอาด (บาท)</label>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={checkOutCleaningFee}
                            onChange={(e) => setCheckOutCleaningFee(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>🛠️ ค่าซ่อมแซม/ของชำรุด (บาท)</label>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={checkOutRepairFee}
                            onChange={(e) => setCheckOutRepairFee(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>📑 ค่าบริการอื่นๆ (บาท)</label>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={checkOutOtherDeductions}
                            onChange={(e) => setCheckOutOtherDeductions(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                          <label className={styles.formLabel}>📝 หมายเหตุการย้ายออก</label>
                          <input
                            type="text"
                            className={styles.formInput}
                            value={checkOutNote}
                            onChange={(e) => setCheckOutNote(e.target.value)}
                            placeholder="เช่น สภาพห้องเรียบร้อยดี คืนคีย์การ์ดครบ"
                          />
                        </div>
                      </div>
                    </div>

                    {/* STEP 5: Real-time Financial Breakdown Table */}
                    {(() => {
                      const waterRate = selectedRoom.floor?.building?.waterRate || 18;
                      const elecRate = selectedRoom.floor?.building?.electricityRate || 8;
                      const prevWater = selectedRoom.prevWater || 0;
                      const prevElec = selectedRoom.prevElec || 0;
                      const finalWaterNum = checkOutFinalWater ? parseFloat(checkOutFinalWater) : prevWater;
                      const finalElecNum = checkOutFinalElec ? parseFloat(checkOutFinalElec) : prevElec;
                      const waterUnits = Math.max(0, finalWaterNum - prevWater);
                      const elecUnits = Math.max(0, finalElecNum - prevElec);
                      const waterCost = waterUnits * waterRate;
                      const elecCost = elecUnits * elecRate;

                      const check = validateCheckOutNotice(
                        activeCheckOutTenant.startDate,
                        checkOutDate || new Date().toISOString().split('T')[0],
                        checkOutNoticeDate || checkOutDate || new Date().toISOString().split('T')[0],
                        checkOutOverrideForfeit
                      );

                      const secDeposit = check.shouldForfeitDeposit ? 0 : activeCheckOutTenant.securityDeposit || 0;
                      const kcCount = activeCheckOutTenant.keycardCount || 0;
                      const kcDeposit = activeCheckOutTenant.keycardDeposit || 0;
                      const kcReturned = parseInt(checkOutKeycardsReturned || '0');
                      const kcRefund = kcCount > 0 ? (kcReturned / kcCount) * kcDeposit : 0;
                      const cleanFee = parseFloat(checkOutCleaningFee || '0');
                      const repFee = parseFloat(checkOutRepairFee || '0');
                      const othDed = parseFloat(checkOutOtherDeductions || '0');

                      let proratedRefund = 0;
                      if (checkOutRefundProratedRent) {
                        const outD = new Date(checkOutDate || new Date().toISOString().split('T')[0]);
                        const daysInMonth = new Date(outD.getFullYear(), outD.getMonth() + 1, 0).getDate();
                        const currentDay = outD.getDate();
                        const remainingDays = Math.max(0, daysInMonth - currentDay);
                        const dailyRent = (selectedRoom.basePrice || 0) / daysInMonth;
                        proratedRefund = Math.round(dailyRent * remainingDays);
                      }

                      const totalRefundable = secDeposit + kcRefund + proratedRefund;
                      const totalDeductions = waterCost + elecCost + cleanFee + repFee + othDed;
                      const netRefund = totalRefundable - totalDeductions;

                      return (
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              color: '#38bdf8',
                              marginBottom: '0.6rem',
                              borderBottom: '1px solid #334155',
                              paddingBottom: '0.4rem',
                            }}
                          >
                            📊 สรุปการคิดเงินคืนมัดจำสุทธิ (Settlement Breakdown)
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.4rem 1rem',
                              fontSize: '0.85rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <div>
                              ➕ มัดจำประกันสัญญา:{' '}
                              <strong style={{ color: secDeposit > 0 ? '#4ade80' : '#f87171' }}>
                                {secDeposit > 0 ? `+${secDeposit.toLocaleString()} ฿` : '0 ฿ (ริบมัดจำ)'}
                              </strong>
                            </div>
                            <div>
                              💧 ค่าน้ำ ({waterUnits} หน่วย x {waterRate}฿):{' '}
                              <strong style={{ color: '#f87171' }}>-{waterCost.toLocaleString()} ฿</strong>
                            </div>
                            <div>
                              ➕ มัดจำคีย์การ์ด (คืน {kcReturned}/{kcCount}):{' '}
                              <strong style={{ color: '#4ade80' }}>+{kcRefund.toLocaleString()} ฿</strong>
                            </div>
                            <div>
                              ⚡ ค่าไฟ ({elecUnits} หน่วย x {elecRate}฿):{' '}
                              <strong style={{ color: '#f87171' }}>-{elecCost.toLocaleString()} ฿</strong>
                            </div>
                            {checkOutRefundProratedRent && (
                              <div>
                                ➕ คืนค่าเช่าส่วนเฉลี่ย: <strong style={{ color: '#4ade80' }}>+{proratedRefund.toLocaleString()} ฿</strong>
                              </div>
                            )}
                            <div>
                              🧹 ค่าทำความสะอาด: <strong style={{ color: '#f87171' }}>-{cleanFee.toLocaleString()} ฿</strong>
                            </div>
                            <div>
                              🛠️ ค่าซ่อมแซม/อื่นๆ: <strong style={{ color: '#f87171' }}>-{(repFee + othDed).toLocaleString()} ฿</strong>
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '0.6rem',
                              borderTop: '1px solid #334155',
                            }}
                          >
                            <span style={{ fontSize: '1rem', fontWeight: 600 }}>💰 ยอดเงินคืนสุทธิให้ผู้เช่า:</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: netRefund >= 0 ? '#4ade80' : '#f87171' }}>
                              {netRefund >= 0
                                ? `${netRefund.toLocaleString()} บาท`
                                : `ผู้เช่าต้องจ่ายเพิ่ม ${Math.abs(netRefund).toLocaleString()} บาท`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              <div className={styles.modalFooter} style={{ marginTop: '1rem' }}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowCheckOutModal(false)}>
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${
                    checkOutActionType === 'RECORD_NOTICE_ONLY' ? styles.btnSecondary : styles.btnPrimary
                  }`}
                  style={checkOutActionType === 'RECORD_NOTICE_ONLY' ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}
                >
                  {checkOutActionType === 'RECORD_NOTICE_ONLY'
                    ? '📌 บันทึกรับแจ้งย้ายออกล่วงหน้า'
                    : '🚪 ยืนยันคืนห้องพัก & พิมพ์ใบสรุป A5'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2.3: CHECK-OUT SUMMARY RECEIPT MODAL --- */}
      {showCheckOutReceiptModal && checkOutReceiptData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '650px', backgroundColor: '#fff', color: '#0f172a' }}>
            <div className={styles.modalHeader} style={{ borderBottom: '2px solid #e2e8f0' }}>
              <h2 className={styles.modalTitle} style={{ color: '#0f172a' }}>
                📄 ใบสรุปการย้ายออกและคืนเงินมัดจำ
              </h2>
              <button className={styles.modalClose} onClick={() => setShowCheckOutReceiptModal(false)}>
                &times;
              </button>
            </div>

            <div className={styles.modalBody} id="printable-checkout-receipt" style={{ padding: '1.5rem' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>{checkOutReceiptData.buildingName}</h3>
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>ใบสรุปการย้ายออกและการเคลียร์เงินมัดจำ (Check-out Settlement Receipt)</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  วันที่ทำรายการ: {formatThaiDateLong(checkOutReceiptData.checkOutDate)}
                </p>
              </div>

              {/* Tenant info */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem',
                }}
              >
                <div>
                  <strong>ห้องพัก:</strong> ห้อง {checkOutReceiptData.roomNumber}
                </div>
                <div>
                  <strong>ชื่อผู้เช่า:</strong> คุณ{checkOutReceiptData.tenantName}
                </div>
                <div>
                  <strong>เบอร์โทรศัพท์:</strong> {checkOutReceiptData.tenantPhone}
                </div>
                <div>
                  <strong>วันที่ย้ายออก:</strong> {formatThaiDateNumeric(checkOutReceiptData.checkOutDate)}
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>รายการ</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>💵 เงินมัดจำประกันสัญญาเช่า</td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                      +{checkOutReceiptData.secDeposit.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      🔑 คืนเงินมัดจำคีย์การ์ด ({checkOutReceiptData.kcReturned}/{checkOutReceiptData.kcCount} ใบ)
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                      +{checkOutReceiptData.kcRefund.toLocaleString()} ฿
                    </td>
                  </tr>
                  {checkOutReceiptData.proratedRefundAmount > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem 0.6rem' }}>💰 คืนเงินค่าเช่าส่วนเฉลี่ย (วันที่ไม่ได้อยู่จริง)</td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                        +{checkOutReceiptData.proratedRefundAmount.toLocaleString()} ฿
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      💧 ค่าน้ำเดือนสุดท้าย ({checkOutReceiptData.prevWater} ➔ {checkOutReceiptData.finalWaterNum} ={' '}
                      {checkOutReceiptData.waterUnits} หน่วย)
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#dc2626' }}>
                      -{checkOutReceiptData.waterCost.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      ⚡ ค่าไฟเดือนสุดท้าย ({checkOutReceiptData.prevElec} ➔ {checkOutReceiptData.finalElecNum} ={' '}
                      {checkOutReceiptData.elecUnits} หน่วย)
                    </td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#dc2626' }}>
                      -{checkOutReceiptData.elecCost.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>🧹 ค่าทำความสะอาดห้องพัก</td>
                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#dc2626' }}>
                      -{checkOutReceiptData.cleanFee.toLocaleString()} ฿
                    </td>
                  </tr>
                  {(checkOutReceiptData.repFee > 0 || checkOutReceiptData.othDed > 0) && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem 0.6rem' }}>🛠️ ค่าซ่อมแซม/ความเสียหายอุปกรณ์</td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#dc2626' }}>
                        -{(checkOutReceiptData.repFee + checkOutReceiptData.othDed).toLocaleString()} ฿
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Box */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '2px solid #0284c7',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>💰 ยอดเงินคืนมัดจำสุทธิ:</span>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    color: checkOutReceiptData.netRefund >= 0 ? '#16a34a' : '#dc2626',
                  }}
                >
                  {checkOutReceiptData.netRefund >= 0
                    ? `${checkOutReceiptData.netRefund.toLocaleString()} บาท`
                    : `ต้องจ่ายเพิ่ม ${Math.abs(checkOutReceiptData.netRefund).toLocaleString()} บาท`}
                </span>
              </div>

              {/* Signature lines */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  marginTop: '2rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: '#475569',
                }}
              >
                <div>
                  <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', margin: '0 auto 0.5rem auto', height: '40px' }}></div>
                  <p>(ลงชื่อผู้เช่า คืนห้องพักเรียบร้อย)</p>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', margin: '0 auto 0.5rem auto', height: '40px' }}></div>
                  <p>(ลงชื่อผู้ให้เช่า / เจ้าของหอพัก)</p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowCheckOutReceiptModal(false)}>
                ✖️ ปิดหน้าต่าง
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.print()}>
                🖨️ พิมพ์เอกสารใบสรุป
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
