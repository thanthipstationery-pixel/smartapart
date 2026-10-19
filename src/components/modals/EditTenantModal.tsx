'use client';

import React from 'react';
import { formatThaiDateNumeric, autoFormatPhoneInput, autoFormatIdCardInput } from '@/lib/thaiDate';
import WorkplaceAddressFields from './WorkplaceAddressFields';

interface EditTenantModalProps {
  showEditTenantModal: boolean;
  setShowEditTenantModal: (val: boolean) => void;
  editingTenant: any;
  handleSaveTenantInfo: (e: React.FormEvent) => void;
  handleEditTenantSubmit?: (e: React.FormEvent) => void;
  isScanningIdCard?: boolean;
  handleScanIdCard?: (
    e: React.ChangeEvent<HTMLInputElement>,
    mode?: any
  ) => void;

  // Primary Tenant
  editTenantName: string;
  setEditTenantName: (val: string) => void;
  editTenantNickname?: string;
  setEditTenantNickname?: (val: string) => void;
  editTenantAge?: string;
  setEditTenantAge?: (val: string) => void;
  editTenantPhone: string;
  setEditTenantPhone: (val: string) => void;
  editTenantIdCard: string;
  setEditTenantIdCard: (val: string) => void;
  editTenantIdCardImage?: string;
  setEditTenantIdCardImage?: (val: string) => void;
  editTenantLineId: string;
  setEditTenantLineId: (val: string) => void;
  editTenantEmail: string;
  setEditTenantEmail: (val: string) => void;
  editTenantAddress: string;
  setEditTenantAddress: (val: string) => void;
  editTenantWorkplace: string;
  setEditTenantWorkplace: (val: string) => void;

  // Primary Tenant Emergency Contact
  editTenantEmergencyName: string;
  setEditTenantEmergencyName: (val: string) => void;
  editTenantEmergencyRel: string;
  setEditTenantEmergencyRel: (val: string) => void;
  editTenantEmergencyPhone: string;
  setEditTenantEmergencyPhone: (val: string) => void;

  // Co-Tenant (Tenant 2)
  editTenantShowSecondTenant?: boolean;
  setEditTenantShowSecondTenant?: (val: boolean) => void;
  editTenantSecondTenantName?: string;
  setEditTenantSecondTenantName?: (val: string) => void;
  editTenantSecondTenantNickname?: string;
  setEditTenantSecondTenantNickname?: (val: string) => void;
  editTenantSecondTenantAge?: string;
  setEditTenantSecondTenantAge?: (val: string) => void;
  editTenantSecondTenantIdCard?: string;
  setEditTenantSecondTenantIdCard?: (val: string) => void;
  editTenantSecondTenantAddress?: string;
  setEditTenantSecondTenantAddress?: (val: string) => void;
  editTenantSecondTenantPhone?: string;
  setEditTenantSecondTenantPhone?: (val: string) => void;
  editTenantSecondTenantWorkplace?: string;
  setEditTenantSecondTenantWorkplace?: (val: string) => void;
  editTenantSecondTenantEmergencyName?: string;
  setEditTenantSecondTenantEmergencyName?: (val: string) => void;
  editTenantSecondTenantEmergencyRel?: string;
  setEditTenantSecondTenantEmergencyRel?: (val: string) => void;
  editTenantSecondTenantEmergencyPhone?: string;
  setEditTenantSecondTenantEmergencyPhone?: (val: string) => void;
  editTenantSecondTenantIdCardImage?: string;
  setEditTenantSecondTenantIdCardImage?: (val: string) => void;

  // Contract Configuration
  editTenantContractNumber?: string;
  setEditTenantContractNumber?: (val: string) => void;
  editTenantContractDuration?: string;
  setEditTenantContractDuration?: (val: string) => void;
  editTenantRoomRentShare?: string;
  setEditTenantRoomRentShare?: (val: string) => void;
  editTenantAssetRentShare?: string;
  setEditTenantAssetRentShare?: (val: string) => void;

  editTenantNote: string;
  setEditTenantNote: (val: string) => void;
  editTenantStartDate?: string;
  setEditTenantStartDate?: (val: string) => void;
  editTenantSaving: boolean;
  styles: any;
  isViewer?: boolean;
}

export default function EditTenantModal({
  showEditTenantModal,
  setShowEditTenantModal,
  editingTenant,
  handleSaveTenantInfo,
  handleEditTenantSubmit,
  isScanningIdCard = false,
  handleScanIdCard,

  // Primary Tenant
  editTenantName,
  setEditTenantName,
  editTenantNickname = '',
  setEditTenantNickname,
  editTenantAge = '',
  setEditTenantAge,
  editTenantPhone,
  setEditTenantPhone,
  editTenantIdCard,
  setEditTenantIdCard,
  editTenantIdCardImage = '',
  setEditTenantIdCardImage,
  editTenantLineId,
  setEditTenantLineId,
  editTenantEmail,
  setEditTenantEmail,
  editTenantAddress,
  setEditTenantAddress,
  editTenantWorkplace,
  setEditTenantWorkplace,

  // Primary Tenant Emergency
  editTenantEmergencyName,
  setEditTenantEmergencyName,
  editTenantEmergencyRel,
  setEditTenantEmergencyRel,
  editTenantEmergencyPhone,
  setEditTenantEmergencyPhone,

  // Co-Tenant (Tenant 2)
  editTenantShowSecondTenant = false,
  setEditTenantShowSecondTenant,
  editTenantSecondTenantName = '',
  setEditTenantSecondTenantName,
  editTenantSecondTenantNickname = '',
  setEditTenantSecondTenantNickname,
  editTenantSecondTenantAge = '',
  setEditTenantSecondTenantAge,
  editTenantSecondTenantIdCard = '',
  setEditTenantSecondTenantIdCard,
  editTenantSecondTenantAddress = '',
  setEditTenantSecondTenantAddress,
  editTenantSecondTenantPhone = '',
  setEditTenantSecondTenantPhone,
  editTenantSecondTenantWorkplace = '',
  setEditTenantSecondTenantWorkplace,
  editTenantSecondTenantEmergencyName = '',
  setEditTenantSecondTenantEmergencyName,
  editTenantSecondTenantEmergencyRel = '',
  setEditTenantSecondTenantEmergencyRel,
  editTenantSecondTenantEmergencyPhone = '',
  setEditTenantSecondTenantEmergencyPhone,
  editTenantSecondTenantIdCardImage = '',
  setEditTenantSecondTenantIdCardImage,

  // Contract Configuration
  editTenantContractNumber = '',
  setEditTenantContractNumber,
  editTenantContractDuration = '6',
  setEditTenantContractDuration,
  editTenantRoomRentShare = '1000',
  setEditTenantRoomRentShare,
  editTenantAssetRentShare = '',
  setEditTenantAssetRentShare,

  editTenantNote,
  setEditTenantNote,
  editTenantStartDate,
  setEditTenantStartDate,
  editTenantSaving,
  styles,
  isViewer = false,
}: EditTenantModalProps) {
  if (!showEditTenantModal || !editingTenant) return null;

  // Auto-calculated end date based on editTenantStartDate and editTenantContractDuration
  const durationMonthsNum = parseInt(editTenantContractDuration || '6', 10) || 6;
  let formattedEndDate = '-';
  if (editTenantStartDate) {
    const parts = editTenantStartDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const endD = new Date(y, m, d);
      if (!isNaN(endD.getTime())) {
        endD.setMonth(endD.getMonth() + durationMonthsNum);
        const yBE = endD.getFullYear() + 543;
        const mStr = String(endD.getMonth() + 1).padStart(2, '0');
        const dStr = String(endD.getDate()).padStart(2, '0');
        formattedEndDate = `${dStr}/${mStr}/${yBE}`;
      }
    }
  }

  const roomPrice = editingTenant.room?.basePrice || 0;
  const currentRoomRentShare = parseFloat(editTenantRoomRentShare || '1000') || 1000;
  const currentAssetRentShare =
    editTenantAssetRentShare !== undefined && editTenantAssetRentShare !== ''
      ? parseFloat(editTenantAssetRentShare) || 0
      : Math.max(0, roomPrice - currentRoomRentShare);

  const onSubmitHandler = handleEditTenantSubmit || handleSaveTenantInfo;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '780px', width: '95vw', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div className={styles.modalHeader} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className={styles.modalTitle} style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✏️ แก้ไขข้อมูลผู้เช่า & สัญญาเช่า - ห้อง {editingTenant.room?.number || ''} ({editingTenant.room?.floor?.building?.name || ''})
          </h2>
          <button className={styles.modalClose} onClick={() => setShowEditTenantModal(false)}>
            &times;
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (isViewer) {
              e.preventDefault();
              alert('บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์แก้ไขข้อมูลผู้เช่า');
              return;
            }
            onSubmitHandler(e);
          }}
        >
          <div className={styles.modalBody} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category 1: Tenant Personal Details */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  👤 1. ข้อมูลส่วนตัวผู้เช่าหลัก (ผู้เช่าคนที่ ๑)
                </h3>
                {handleScanIdCard && (
                  <label
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                  >
                    {isScanningIdCard ? '⚡ กำลังสแกน...' : '📷 สแกน/ถ่ายบัตร AI'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleScanIdCard(e, 'EDIT_TENANT')}
                      style={{ display: 'none' }}
                      disabled={isScanningIdCard}
                    />
                  </label>
                )}
              </div>

              {/* Primary Tenant ID Card Photo Preview with Security Watermark */}
              {editTenantIdCardImage && (
                <div
                  style={{
                    marginBottom: '0.85rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={editTenantIdCardImage}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 700, fontSize: '0.88rem' }}>
                        <span>✓</span> ฝังลายน้ำรักษาความปลอดภัยเรียบร้อย
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>
                        🔒 เอกสารได้รับการฝังลายน้ำความปลอดภัยตามมาตรฐาน PDPA
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {handleScanIdCard && (
                      <label
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ margin: 0, cursor: 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        📷 ถ่ายใหม่
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleScanIdCard(e, 'EDIT_TENANT')}
                          style={{ display: 'none' }}
                          disabled={isScanningIdCard}
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditTenantIdCardImage && setEditTenantIdCardImage('')}
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ margin: 0, fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    >
                      🗑️ ลบรูป
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      ชื่อ-นามสกุล ผู้เช่า *
                    </label>
                    <input
                      type="text"
                      required
                      value={editTenantName}
                      onChange={(e) => setEditTenantName(e.target.value)}
                      className={styles.formInput}
                      placeholder="นาย/นาง/นางสาว สมชาย ใจดี"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      ชื่อเล่น
                    </label>
                    <input
                      type="text"
                      value={editTenantNickname}
                      onChange={(e) => setEditTenantNickname && setEditTenantNickname(e.target.value)}
                      className={styles.formInput}
                      placeholder="เช่น แนน, บอย"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      อายุ (ปี)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={editTenantAge}
                      onChange={(e) => setEditTenantAge && setEditTenantAge(e.target.value)}
                      className={styles.formInput}
                      placeholder="เช่น 25"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      เบอร์โทรศัพท์ติดต่อ *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9-]*"
                      required
                      value={editTenantPhone}
                      onChange={(e) => setEditTenantPhone(autoFormatPhoneInput(e.target.value))}
                      className={styles.formInput}
                      placeholder="081-234-5678"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      เลขบัตรประชาชน / พาสปอร์ต
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      maxLength={17}
                      value={editTenantIdCard}
                      onChange={(e) => setEditTenantIdCard(autoFormatIdCardInput(e.target.value))}
                      className={styles.formInput}
                      placeholder="1 2345 67890 12 3"
                    />
                  </div>
                  {setEditTenantStartDate && (
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        📅 วันที่เริ่มสัญญาเช่า <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(editTenantStartDate)})</span> *
                      </label>
                      <input
                        type="date"
                        required
                        value={editTenantStartDate || ''}
                        onChange={(e) => setEditTenantStartDate(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      Line ID
                    </label>
                    <input
                      type="text"
                      value={editTenantLineId}
                      onChange={(e) => setEditTenantLineId(e.target.value)}
                      className={styles.formInput}
                      placeholder="สมชายLINE"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      อีเมล (Email)
                    </label>
                    <input
                      type="email"
                      value={editTenantEmail}
                      onChange={(e) => setEditTenantEmail(e.target.value)}
                      className={styles.formInput}
                      placeholder="tenant@example.com"
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                    ที่อยู่เดิม / ตามบัตรประชาชน
                  </label>
                  <input
                    type="text"
                    value={editTenantAddress}
                    onChange={(e) => setEditTenantAddress(e.target.value)}
                    className={styles.formInput}
                    placeholder="เลขที่ หมู่ ตำบล อำเภอ จังหวัด"
                  />
                </div>

                <WorkplaceAddressFields
                  value={editTenantWorkplace}
                  onChange={(val) => setEditTenantWorkplace(val)}
                  idCardAddress={editTenantAddress}
                  styles={styles}
                />
              </div>
            </div>

            {/* Category 2: Co-Tenant (Second Tenant) Accordion */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setEditTenantShowSecondTenant && setEditTenantShowSecondTenant(!editTenantShowSecondTenant)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: editTenantShowSecondTenant ? '#eff6ff' : '#f8fafc',
                  border: 'none',
                  borderBottom: editTenantShowSecondTenant ? '1px solid #bfdbfe' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: editTenantShowSecondTenant ? '#1d4ed8' : '#334155',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👥</span>
                  <span>
                    {editTenantShowSecondTenant
                      ? 'ข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย)'
                      : '[ + ข้อมูลผู้เช่าคนที่ ๒ (ผู้ร่วมพักอาศัย) ]'}
                  </span>
                  {editTenantShowSecondTenant && (
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
                      ระบุข้อมูล
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {editTenantShowSecondTenant ? '▲ ยุบซ่อน' : '▼ ขยาย'}
                </span>
              </button>

              {editTenantShowSecondTenant && (
                <div style={{ padding: '1rem' }}>
                  {/* AI OCR Banner for Second Tenant in Edit Modal */}
                  {handleScanIdCard && (
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
                        <span style={{ fontSize: '1.25rem' }}>📷</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e40af' }}>
                            สแกนบัตรประชาชนผู้ร่วมพักอาศัยด้วย AI
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#3b82f6' }}>
                            อ่านชื่อ เลขบัตร และที่อยู่ พร้อมฝังลายน้ำ PDPA
                          </div>
                        </div>
                      </div>
                      <label
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                      >
                        {isScanningIdCard ? '⚡ กำลังสแกน...' : '✨ สแกนบัตรคนที่ ๒'}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleScanIdCard(e, 'EDIT_SECOND_TENANT')}
                          style={{ display: 'none' }}
                          disabled={isScanningIdCard}
                        />
                      </label>
                    </div>
                  )}

                  {/* Second Tenant ID Card Preview */}
                  {editTenantSecondTenantIdCardImage && (
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
                          src={editTenantSecondTenantIdCardImage}
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
                        {handleScanIdCard && (
                          <label
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ margin: 0, cursor: 'pointer', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                          >
                            📷 ถ่ายใหม่
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleScanIdCard(e, 'EDIT_SECOND_TENANT')}
                              style={{ display: 'none' }}
                              disabled={isScanningIdCard}
                            />
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditTenantSecondTenantIdCardImage && setEditTenantSecondTenantIdCardImage('')}
                          className={`${styles.btn} ${styles.btnDanger}`}
                          style={{ margin: 0, fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                        >
                          🗑️ ลบรูป
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        ชื่อ-นามสกุล (ผู้เช่าคนที่ ๒)
                      </label>
                      <input
                        type="text"
                        value={editTenantSecondTenantName}
                        onChange={(e) => setEditTenantSecondTenantName && setEditTenantSecondTenantName(e.target.value)}
                        className={styles.formInput}
                        placeholder="ชื่อ-นามสกุล ผู้ร่วมพักอาศัย"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        ชื่อเล่น
                      </label>
                      <input
                        type="text"
                        value={editTenantSecondTenantNickname}
                        onChange={(e) => setEditTenantSecondTenantNickname && setEditTenantSecondTenantNickname(e.target.value)}
                        className={styles.formInput}
                        placeholder="เช่น โจ้"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        อายุ (ปี)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editTenantSecondTenantAge}
                        onChange={(e) => setEditTenantSecondTenantAge && setEditTenantSecondTenantAge(e.target.value)}
                        className={styles.formInput}
                        placeholder="เช่น 24"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        value={editTenantSecondTenantPhone}
                        onChange={(e) => setEditTenantSecondTenantPhone && setEditTenantSecondTenantPhone(autoFormatPhoneInput(e.target.value))}
                        className={styles.formInput}
                        placeholder="081-234-5678"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        เลขบัตรประชาชน
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9 ]*"
                        maxLength={17}
                        value={editTenantSecondTenantIdCard}
                        onChange={(e) => setEditTenantSecondTenantIdCard && setEditTenantSecondTenantIdCard(autoFormatIdCardInput(e.target.value))}
                        className={styles.formInput}
                        placeholder="1 2345 67890 12 3"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0, gridColumn: '1 / -1' }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        ที่อยู่ตามบัตรประชาชน
                      </label>
                      <input
                        type="text"
                        value={editTenantSecondTenantAddress}
                        onChange={(e) => setEditTenantSecondTenantAddress && setEditTenantSecondTenantAddress(e.target.value)}
                        className={styles.formInput}
                        placeholder="บ้านเลขที่/หมู่/ตำบล/อำเภอ/จังหวัด"
                      />
                    </div>
                    <WorkplaceAddressFields
                      value={editTenantSecondTenantWorkplace}
                      onChange={(val) => setEditTenantSecondTenantWorkplace && setEditTenantSecondTenantWorkplace(val)}
                      idCardAddress={editTenantSecondTenantAddress}
                      styles={styles}
                      label="ที่อยู่ปัจจุบัน / ที่ทำงาน / สถานศึกษา (ผู้เช่าคนที่ ๒)"
                    />
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        ชื่อผู้ติดต่อฉุกเฉิน (คนที่ ๒)
                      </label>
                      <input
                        type="text"
                        value={editTenantSecondTenantEmergencyName}
                        onChange={(e) => setEditTenantSecondTenantEmergencyName && setEditTenantSecondTenantEmergencyName(e.target.value)}
                        className={styles.formInput}
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        ความสัมพันธ์
                      </label>
                      <input
                        type="text"
                        value={editTenantSecondTenantEmergencyRel}
                        onChange={(e) => setEditTenantSecondTenantEmergencyRel && setEditTenantSecondTenantEmergencyRel(e.target.value)}
                        className={styles.formInput}
                        placeholder="เช่น แม่, พี่สาว, เพื่อน"
                      />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                        เบอร์โทรฉุกเฉิน
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        value={editTenantSecondTenantEmergencyPhone}
                        onChange={(e) => setEditTenantSecondTenantEmergencyPhone && setEditTenantSecondTenantEmergencyPhone(autoFormatPhoneInput(e.target.value))}
                        className={styles.formInput}
                        placeholder="081-234-5678"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category 3: Contract Configuration & Rent Breakdown */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid #0284c7' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📜 2. ข้อมูลสัญญาเช่า & สัดส่วนค่าเช่า
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {/* Contract Number */}
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>เลขที่สัญญาเช่า</span>
                    <button
                      type="button"
                      onClick={() => {
                        const roomNum = editingTenant.room?.number || '';
                        const defaultContract = roomNum ? `${roomNum}/${new Date().getFullYear() + 543}` : '';
                        setEditTenantContractNumber && setEditTenantContractNumber(defaultContract);
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
                      ค่าเริ่มต้น
                    </button>
                  </label>
                  <input
                    type="text"
                    value={editTenantContractNumber}
                    onChange={(e) => setEditTenantContractNumber && setEditTenantContractNumber(e.target.value)}
                    className={styles.formInput}
                    placeholder="เช่น 101/2569"
                  />
                </div>

                {/* Contract Duration */}
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                    ระยะเวลาสัญญา (เดือน)
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['1', '3', '6', '12'].map((dur) => {
                      const isSelected = (editTenantContractDuration || '6') === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setEditTenantContractDuration && setEditTenantContractDuration(dur)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {dur} ด.
                        </button>
                      );
                    })}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        style={{ width: '60px', padding: '0.3rem 0.45rem', fontSize: '0.82rem' }}
                        className={styles.formInput}
                        value={editTenantContractDuration}
                        onChange={(e) => setEditTenantContractDuration && setEditTenantContractDuration(e.target.value)}
                        placeholder="กำหนดเอง"
                      />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>เดือน</span>
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
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #bfdbfe',
                  marginBottom: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#1e40af',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span>📅 <strong>วันเริ่มสัญญา:</strong> {formatThaiDateNumeric(editTenantStartDate)}</span>
                <span>
                  🏁 <strong>วันสิ้นสุดสัญญา:</strong>{' '}
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{formattedEndDate}</span> ({durationMonthsNum} เดือน)
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                      🏢 ค่าเช่าห้องพัก (บาท/เดือน)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={styles.formInput}
                      value={editTenantRoomRentShare}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditTenantRoomRentShare && setEditTenantRoomRentShare(val);
                        const rNum = parseFloat(val) || 0;
                        setEditTenantAssetRentShare && setEditTenantAssetRentShare(String(Math.max(0, roomPrice - rNum)));
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
                      value={editTenantAssetRentShare}
                      onChange={(e) => setEditTenantAssetRentShare && setEditTenantAssetRentShare(e.target.value)}
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
                    ค่าห้อง <strong>{currentRoomRentShare.toLocaleString()} บ.</strong> + ค่าทรัพย์สิน{' '}
                    <strong>{currentAssetRentShare.toLocaleString()} บ.</strong>
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    รวมค่าเช่ารายเดือน:{' '}
                    <span style={{ color: '#0284c7', fontSize: '0.95rem' }}>{roomPrice.toLocaleString()} บาท</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Category 4: Emergency Contact */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--status-warning, #d97706)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📞 3. ผู้ติดต่อกรณีฉุกเฉิน (ผู้เช่าหลัก)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                    ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={editTenantEmergencyName}
                    onChange={(e) => setEditTenantEmergencyName(e.target.value)}
                    className={styles.formInput}
                    placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                  />
                </div>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                    ความสัมพันธ์
                  </label>
                  <input
                    type="text"
                    value={editTenantEmergencyRel}
                    onChange={(e) => setEditTenantEmergencyRel(e.target.value)}
                    className={styles.formInput}
                    placeholder="เช่น พ่อ, แม่, พี่สาว, เพื่อน"
                  />
                </div>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                    เบอร์โทรศัพท์ฉุกเฉิน
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9-]*"
                    value={editTenantEmergencyPhone}
                    onChange={(e) => setEditTenantEmergencyPhone(autoFormatPhoneInput(e.target.value))}
                    className={styles.formInput}
                    placeholder="081-234-5678"
                  />
                </div>
              </div>
            </div>

            {/* Category 5: Notes */}
            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                📝 หมายเหตุเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={editTenantNote}
                onChange={(e) => setEditTenantNote(e.target.value)}
                className={styles.formInput}
                placeholder="บันทึกรายละเอียดเพิ่มเติมเกี่ยวกับผู้เช่ารายนี้..."
              />
            </div>
          </div>

          <div className={styles.modalFooter} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className={styles.btn} onClick={() => setShowEditTenantModal(false)}>
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={editTenantSaving || isViewer}
              title={isViewer ? 'บัญชีโหมดตรวจการ (Read-Only) ไม่มีสิทธิ์แก้ไขข้อมูลผู้เช่า' : undefined}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={isViewer ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            >
              {isViewer ? '🔒 โหมดตรวจการ (อ่านอย่างเดียว)' : editTenantSaving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
