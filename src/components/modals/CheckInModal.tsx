'use client';

import React, { useEffect } from 'react';
import { calculateCheckInPayment } from '@/lib/billingRules';
import {
  formatThaiBillingPeriod,
  formatThaiDateNumeric,
  autoFormatPhoneInput,
  autoFormatIdCardInput,
} from '@/lib/thaiDate';

interface CheckInModalProps {
  showCheckInModal: boolean;
  setShowCheckInModal: (val: boolean) => void;
  setShowRoomModal: (val: boolean) => void;
  selectedRoom: any;
  handleCheckInSubmit: (e: React.FormEvent) => void;
  isScanningIdCard: boolean;
  handleScanIdCard: (
    e: React.ChangeEvent<HTMLInputElement>,
    mode?: any
  ) => void;

  // Primary Tenant
  checkInName: string;
  setCheckInName: (val: string) => void;
  checkInNickname?: string;
  setCheckInNickname?: (val: string) => void;
  checkInAge?: string;
  setCheckInAge?: (val: string) => void;
  checkInPhone: string;
  setCheckInPhone: (val: string) => void;
  checkInIdCard: string;
  setCheckInIdCard: (val: string) => void;
  checkInIdCardImage?: string;
  setCheckInIdCardImage?: (val: string) => void;
  checkInAddress: string;
  setCheckInAddress: (val: string) => void;
  checkInWorkplace: string;
  setCheckInWorkplace: (val: string) => void;
  checkInLineId: string;
  setCheckInLineId: (val: string) => void;

  // Primary Tenant Emergency Contact
  checkInEmergencyName: string;
  setCheckInEmergencyName: (val: string) => void;
  checkInEmergencyRel: string;
  setCheckInEmergencyRel: (val: string) => void;
  checkInEmergencyPhone: string;
  setCheckInEmergencyPhone: (val: string) => void;

  // Co-Tenant (Tenant 2)
  checkInShowSecondTenant?: boolean;
  setCheckInShowSecondTenant?: (val: boolean) => void;
  checkInSecondTenantName?: string;
  setCheckInSecondTenantName?: (val: string) => void;
  checkInSecondTenantNickname?: string;
  setCheckInSecondTenantNickname?: (val: string) => void;
  checkInSecondTenantAge?: string;
  setCheckInSecondTenantAge?: (val: string) => void;
  checkInSecondTenantIdCard?: string;
  setCheckInSecondTenantIdCard?: (val: string) => void;
  checkInSecondTenantAddress?: string;
  setCheckInSecondTenantAddress?: (val: string) => void;
  checkInSecondTenantPhone?: string;
  setCheckInSecondTenantPhone?: (val: string) => void;
  checkInSecondTenantWorkplace?: string;
  setCheckInSecondTenantWorkplace?: (val: string) => void;
  checkInSecondTenantEmergencyName?: string;
  setCheckInSecondTenantEmergencyName?: (val: string) => void;
  checkInSecondTenantEmergencyRel?: string;
  setCheckInSecondTenantEmergencyRel?: (val: string) => void;
  checkInSecondTenantEmergencyPhone?: string;
  setCheckInSecondTenantEmergencyPhone?: (val: string) => void;
  checkInSecondTenantIdCardImage?: string;
  setCheckInSecondTenantIdCardImage?: (val: string) => void;

  // Contract Configuration
  checkInContractNumber?: string;
  setCheckInContractNumber?: (val: string) => void;
  checkInContractDuration?: string;
  setCheckInContractDuration?: (val: string) => void;
  checkInRoomRentShare?: string;
  setCheckInRoomRentShare?: (val: string) => void;
  checkInAssetRentShare?: string;
  setCheckInAssetRentShare?: (val: string) => void;

  // Deposits, Keycard, Meters, etc.
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
  isViewer?: boolean;
}

export default function CheckInModal({
  showCheckInModal,
  setShowCheckInModal,
  setShowRoomModal,
  selectedRoom,
  handleCheckInSubmit,
  isScanningIdCard,
  handleScanIdCard,

  // Primary Tenant
  checkInName,
  setCheckInName,
  checkInNickname = '',
  setCheckInNickname,
  checkInAge = '',
  setCheckInAge,
  checkInPhone,
  setCheckInPhone,
  checkInIdCard,
  setCheckInIdCard,
  checkInIdCardImage = '',
  setCheckInIdCardImage,
  checkInAddress,
  setCheckInAddress,
  checkInWorkplace,
  setCheckInWorkplace,
  checkInLineId,
  setCheckInLineId,

  // Primary Tenant Emergency
  checkInEmergencyName,
  setCheckInEmergencyName,
  checkInEmergencyRel,
  setCheckInEmergencyRel,
  checkInEmergencyPhone,
  setCheckInEmergencyPhone,

  // Co-Tenant (Tenant 2)
  checkInShowSecondTenant = false,
  setCheckInShowSecondTenant,
  checkInSecondTenantName = '',
  setCheckInSecondTenantName,
  checkInSecondTenantNickname = '',
  setCheckInSecondTenantNickname,
  checkInSecondTenantAge = '',
  setCheckInSecondTenantAge,
  checkInSecondTenantIdCard = '',
  setCheckInSecondTenantIdCard,
  checkInSecondTenantAddress = '',
  setCheckInSecondTenantAddress,
  checkInSecondTenantPhone = '',
  setCheckInSecondTenantPhone,
  checkInSecondTenantWorkplace = '',
  setCheckInSecondTenantWorkplace,
  checkInSecondTenantEmergencyName = '',
  setCheckInSecondTenantEmergencyName,
  checkInSecondTenantEmergencyRel = '',
  setCheckInSecondTenantEmergencyRel,
  checkInSecondTenantEmergencyPhone = '',
  setCheckInSecondTenantEmergencyPhone,
  checkInSecondTenantIdCardImage = '',
  setCheckInSecondTenantIdCardImage,

  // Contract Configuration
  checkInContractNumber = '',
  setCheckInContractNumber,
  checkInContractDuration = '6',
  setCheckInContractDuration,
  checkInRoomRentShare = '1000',
  setCheckInRoomRentShare,
  checkInAssetRentShare = '',
  setCheckInAssetRentShare,

  // Deposits & Keycards
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
  isViewer = false,
}: CheckInModalProps) {
  // Ensure default contract number and rent share are initialized when modal is visible
  useEffect(() => {
    if (showCheckInModal && selectedRoom) {
      if (!checkInContractNumber && setCheckInContractNumber) {
        const defaultContract = `${selectedRoom.number}/${new Date().getFullYear() + 543}`;
        setCheckInContractNumber(defaultContract);
      }
      if ((!checkInRoomRentShare || checkInRoomRentShare === '') && setCheckInRoomRentShare) {
        setCheckInRoomRentShare('1000');
      }
      if ((!checkInAssetRentShare || checkInAssetRentShare === '') && setCheckInAssetRentShare) {
        const rShare = parseFloat(checkInRoomRentShare || '1000') || 1000;
        const autoAsset = Math.max(0, (selectedRoom.basePrice || 0) - rShare);
        setCheckInAssetRentShare(String(autoAsset));
      }
    }
  }, [showCheckInModal, selectedRoom]);

  if (!showCheckInModal || !selectedRoom) return null;

  // Auto-calculated end date based on checkInDate and checkInContractDuration
  const durationMonthsNum = parseInt(checkInContractDuration || '6', 10) || 6;
  let formattedEndDate = '-';
  if (checkInDate) {
    const parts = checkInDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const endDateObj = new Date(y, m, d);
      if (!isNaN(endDateObj.getTime())) {
        endDateObj.setMonth(endDateObj.getMonth() + durationMonthsNum);
        const yBE = endDateObj.getFullYear() + 543;
        const mStr = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const dStr = String(endDateObj.getDate()).padStart(2, '0');
        formattedEndDate = `${dStr}/${mStr}/${yBE}`;
      }
    }
  }

  const roomPrice = selectedRoom.basePrice || 0;
  const currentRoomRentShare = parseFloat(checkInRoomRentShare || '1000') || 1000;
  const currentAssetRentShare =
    checkInAssetRentShare !== undefined && checkInAssetRentShare !== ''
      ? parseFloat(checkInAssetRentShare) || 0
      : Math.max(0, roomPrice - currentRoomRentShare);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '780px', width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>📝 ลงทะเบียนผู้เช่าใหม่ - ห้อง {selectedRoom.number}</h2>
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

        <form
          onSubmit={(e) => {
            if (isViewer) {
              e.preventDefault();
              alert('บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์ทำสัญญาเข้าพัก');
              return;
            }
            handleCheckInSubmit(e);
          }}
        >
          <div className={styles.modalBody}>
            {/* AI ID Card OCR Camera Banner */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--status-info-bg, #eff6ff)',
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
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--status-info, #1e40af)' }}>
                    สแกนบัตรประชาชนด้วย AI อัตโนมัติ (Auto-fill)
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#3b82f6' }}>
                    ถ่ายรูปหรืออัปโหลดภาพบัตรฯ ระบบจะกรอกชื่อ เลขบัตร 13 หลัก ที่อยู่ และฝังลายน้ำความปลอดภัย PDPA ให้อัตโนมัติ
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

            {/* Primary Tenant ID Card Photo Preview with Security Watermark Badge */}
            {checkInIdCardImage && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={checkInIdCardImage}
                    alt="รูปถ่ายบัตรประชาชนผู้เช่าหลัก"
                    style={{
                      width: '120px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 700, fontSize: '0.88rem' }}>
                      <span>✓</span> ฝังลายน้ำรักษาความปลอดภัยเรียบร้อย
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>
                      🔒 ลายน้ำระบุการใช้งานเฉพาะสัญญาเช่าห้องพัก ป้องกันตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <label
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ margin: 0, cursor: 'pointer', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  >
                    📷 ถ่ายใหม่
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleScanIdCard(e, 'CHECK_IN')}
                      style={{ display: 'none' }}
                      disabled={isScanningIdCard}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCheckInIdCardImage && setCheckInIdCardImage('')}
                    className={`${styles.btn} ${styles.btnDanger}`}
                    style={{ margin: 0, fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  >
                    🗑️ ลบรูป
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 1: ข้อมูลส่วนตัวผู้เช่าหลัก */}
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
              👤 <span>ข้อมูลส่วนตัวผู้เช่าหลัก (ผู้เช่าคนที่ ๑)</span>
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
                <label className={styles.formLabel}>ชื่อเล่น</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInNickname}
                  onChange={(e) => setCheckInNickname && setCheckInNickname(e.target.value)}
                  placeholder="เช่น แนน, บอย"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>อายุ (ปี)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className={styles.formInput}
                  value={checkInAge}
                  onChange={(e) => setCheckInAge && setCheckInAge(e.target.value)}
                  placeholder="เช่น 25"
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
                <label className={styles.formLabel}>Line ID</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInLineId}
                  onChange={(e) => setCheckInLineId(e.target.value)}
                  placeholder="กรอกไอดีไลน์"
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>ที่อยู่ตามบัตรประชาชน</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInAddress}
                  onChange={(e) => setCheckInAddress(e.target.value)}
                  placeholder="กรอกบ้านเลขที่/หมู่/ตำบล/อำเภอ/จังหวัด"
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>สถานที่ทำงาน / สถานศึกษา</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={checkInWorkplace}
                  onChange={(e) => setCheckInWorkplace(e.target.value)}
                  placeholder="ระบุสถานที่ทำงานหรือโรงเรียน/มหาลัย"
                />
              </div>
            </div>

            {/* SECTION 2: ผู้ติดต่อกรณีฉุกเฉิน (ผู้เช่าหลัก) */}
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

            {/* SECTION 3: ข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย) - Collapsible Accordion */}
            <div
              style={{
                marginBottom: '1.25rem',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: checkInShowSecondTenant ? '#f8fafc' : '#ffffff',
                transition: 'all 0.2s ease',
              }}
            >
              <button
                type="button"
                onClick={() => setCheckInShowSecondTenant && setCheckInShowSecondTenant(!checkInShowSecondTenant)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: checkInShowSecondTenant ? '#eff6ff' : '#f1f5f9',
                  border: 'none',
                  borderBottom: checkInShowSecondTenant ? '1px solid #bfdbfe' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: checkInShowSecondTenant ? '#1d4ed8' : '#334155',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👥</span>
                  <span>
                    {checkInShowSecondTenant
                      ? 'ข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย)'
                      : '[ + เพิ่มข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย) ]'}
                  </span>
                  {checkInShowSecondTenant && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                      }}
                    >
                      เปิดข้อมูล
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {checkInShowSecondTenant ? '▲ ยุบซ่อน' : '▼ ขยาย'}
                </span>
              </button>

              {checkInShowSecondTenant && (
                <div style={{ padding: '1rem' }}>
                  {/* AI OCR Banner for Co-tenant */}
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 0.9rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>📷</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1e40af' }}>
                          สแกนบัตรประชาชนผู้ร่วมพักอาศัยด้วย AI
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
                          ถ่ายรูปบัตรคนที่ ๒ ระบบจะช่วยอ่านชื่อ เลขบัตร และที่อยู่ พร้อมฝังลายน้ำ PDPA
                        </div>
                      </div>
                    </div>
                    <label
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                    >
                      {isScanningIdCard ? '⚡ กำลังสแกน...' : '✨ สแกนบัตรคนที่ ๒'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleScanIdCard(e, 'SECOND_TENANT')}
                        style={{ display: 'none' }}
                        disabled={isScanningIdCard}
                      />
                    </label>
                  </div>

                  {/* Co-tenant Card Photo Preview */}
                  {checkInSecondTenantIdCardImage && (
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={checkInSecondTenantIdCardImage}
                          alt="รูปถ่ายบัตรประชาชนผู้เช่าคนที่ ๒"
                          style={{
                            width: '100px',
                            height: '62px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #cbd5e1',
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontWeight: 600, fontSize: '0.82rem' }}>
                            <span>✓</span> ฝังลายน้ำรักษาความปลอดภัยเรียบร้อย
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            🔒 ป้องกันข้อมูลส่วนบุคคลตาม PDPA
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <label
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          style={{ margin: 0, cursor: 'pointer', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                        >
                          📷 ถ่ายใหม่
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleScanIdCard(e, 'SECOND_TENANT')}
                            style={{ display: 'none' }}
                            disabled={isScanningIdCard}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCheckInSecondTenantIdCardImage && setCheckInSecondTenantIdCardImage('')}
                          className={`${styles.btn} ${styles.btnDanger}`}
                          style={{ margin: 0, fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                        >
                          🗑️ ลบรูป
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Co-Tenant Form Grid */}
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>ชื่อ-นามสกุล (ผู้เช่าคนที่ ๒)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantName}
                        onChange={(e) => setCheckInSecondTenantName && setCheckInSecondTenantName(e.target.value)}
                        placeholder="ชื่อ-นามสกุล ผู้ร่วมพักอาศัย"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>ชื่อเล่น</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantNickname}
                        onChange={(e) => setCheckInSecondTenantNickname && setCheckInSecondTenantNickname(e.target.value)}
                        placeholder="เช่น โจ้"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>อายุ (ปี)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        className={styles.formInput}
                        value={checkInSecondTenantAge}
                        onChange={(e) => setCheckInSecondTenantAge && setCheckInSecondTenantAge(e.target.value)}
                        placeholder="เช่น 24"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        className={styles.formInput}
                        value={checkInSecondTenantPhone}
                        onChange={(e) => setCheckInSecondTenantPhone && setCheckInSecondTenantPhone(autoFormatPhoneInput(e.target.value))}
                        placeholder="081-234-5678"
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
                        value={checkInSecondTenantIdCard}
                        onChange={(e) => setCheckInSecondTenantIdCard && setCheckInSecondTenantIdCard(autoFormatIdCardInput(e.target.value))}
                        placeholder="1 2345 67890 12 3"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>สถานที่ทำงาน / สถานศึกษา</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantWorkplace}
                        onChange={(e) => setCheckInSecondTenantWorkplace && setCheckInSecondTenantWorkplace(e.target.value)}
                        placeholder="ระบุที่ทำงานหรือสถานศึกษา"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.formLabel}>ที่อยู่ตามบัตรประชาชน</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantAddress}
                        onChange={(e) => setCheckInSecondTenantAddress && setCheckInSecondTenantAddress(e.target.value)}
                        placeholder="บ้านเลขที่/หมู่/ตำบล/อำเภอ/จังหวัด"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>ชื่อผู้ติดต่อฉุกเฉิน (คนที่ ๒)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantEmergencyName}
                        onChange={(e) => setCheckInSecondTenantEmergencyName && setCheckInSecondTenantEmergencyName(e.target.value)}
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>ความสัมพันธ์</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={checkInSecondTenantEmergencyRel}
                        onChange={(e) => setCheckInSecondTenantEmergencyRel && setCheckInSecondTenantEmergencyRel(e.target.value)}
                        placeholder="เช่น แม่, เพื่อน, พี่สาว"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>เบอร์โทรฉุกเฉิน</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        className={styles.formInput}
                        value={checkInSecondTenantEmergencyPhone}
                        onChange={(e) => setCheckInSecondTenantEmergencyPhone && setCheckInSecondTenantEmergencyPhone(autoFormatPhoneInput(e.target.value))}
                        placeholder="081-234-5678"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: ข้อมูลสัญญาเช่า & สัดส่วนค่าเช่า (Contract Configuration Box) */}
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
              📜 <span>การตั้งค่าสัญญาเช่า & สัดส่วนค่าเช่า (Lease Agreement)</span>
            </div>

            <div
              style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #0284c7',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className={styles.formGrid} style={{ marginBottom: '0.75rem' }}>
                {/* Contract Number */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>เลขที่สัญญาเช่า</span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultContract = `${selectedRoom.number}/${new Date().getFullYear() + 543}`;
                        setCheckInContractNumber && setCheckInContractNumber(defaultContract);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284c7',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      ค่าเริ่มต้น ({selectedRoom.number}/{new Date().getFullYear() + 543})
                    </button>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={checkInContractNumber}
                    onChange={(e) => setCheckInContractNumber && setCheckInContractNumber(e.target.value)}
                    placeholder={`${selectedRoom.number}/${new Date().getFullYear() + 543}`}
                  />
                </div>

                {/* Duration Pills + Custom Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ระยะเวลาสัญญา (เดือน)</label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['1', '3', '6', '12'].map((dur) => {
                      const isSelected = (checkInContractDuration || '6') === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setCheckInContractDuration && setCheckInContractDuration(dur)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {dur} เดือน
                        </button>
                      );
                    })}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        style={{ width: '65px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                        className={styles.formInput}
                        value={checkInContractDuration}
                        onChange={(e) => setCheckInContractDuration && setCheckInContractDuration(e.target.value)}
                        placeholder="กำหนดเอง"
                      />
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>เดือน</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-calculated End Date Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #bfdbfe',
                  marginBottom: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span>📅 <strong>วันเริ่มสัญญา:</strong> {formatThaiDateNumeric(checkInDate)}</span>
                <span>
                  🏁 <strong>วันสิ้นสุดสัญญา (อัตโนมัติ):</strong>{' '}
                  <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.92rem' }}>{formattedEndDate}</span>{' '}
                  ({durationMonthsNum} เดือน)
                </span>
              </div>

              {/* Rent Share Breakdown Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>⚖️</span> <span>การแบ่งสัดส่วนค่าเช่า (ค่าห้องพัก & ค่าเช่าทรัพย์สิน)</span>
                </div>
                <div className={styles.formGrid} style={{ marginBottom: '0.5rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                      🏢 ค่าเช่าห้องพัก (บาท/เดือน)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={styles.formInput}
                      value={checkInRoomRentShare}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCheckInRoomRentShare && setCheckInRoomRentShare(val);
                        const rNum = parseFloat(val) || 0;
                        setCheckInAssetRentShare && setCheckInAssetRentShare(String(Math.max(0, roomPrice - rNum)));
                      }}
                      placeholder="1000"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                      🛋️ ค่าเช่าทรัพย์สิน/เฟอร์นิเจอร์ (บาท/เดือน)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={styles.formInput}
                      value={checkInAssetRentShare}
                      onChange={(e) => setCheckInAssetRentShare && setCheckInAssetRentShare(e.target.value)}
                      placeholder={String(Math.max(0, roomPrice - currentRoomRentShare))}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                    color: '#64748b',
                    paddingTop: '0.4rem',
                    borderTop: '1px dashed #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>
                    ค่าเช่าห้องพัก <strong>{currentRoomRentShare.toLocaleString()} บ.</strong> + ค่าเช่าทรัพย์สิน{' '}
                    <strong>{currentAssetRentShare.toLocaleString()} บ.</strong>
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    รวมค่าเช่ารายเดือน:{' '}
                    <span style={{ color: '#0284c7', fontSize: '0.98rem' }}>{roomPrice.toLocaleString()} บาท</span>
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 5: เงินประกัน & คีย์การ์ด */}
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
                  placeholder={`เช่น ${selectedRoom.basePrice}`}
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

            {/* SECTION 6: วันที่ย้ายเข้า มิเตอร์แรกเข้า และหมายเหตุ */}
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
              ⚡ <span>มิเตอร์แรกเข้า & สรุปยอดเงิน</span>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
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
                      <span style={{ fontWeight: 'bold', color: 'var(--status-info-text, #0369a1)', fontSize: '0.92rem' }}>
                        💡 สรุปการคิดเงินแรกเข้า: {calc.ruleName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.6rem',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-lg, 9999px)',
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
                        borderRadius: 'var(--radius-md)',
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
            <button
              type="submit"
              disabled={isViewer}
              title={isViewer ? 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์ทำสัญญาเข้าพัก' : undefined}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={isViewer ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            >
              {isViewer ? '🔒 โหมดตรวจการ (อ่านอย่างเดียว)' : '📝 ยืนยันสัญญาเช่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
