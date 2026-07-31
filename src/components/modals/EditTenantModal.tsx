'use client';

import React from 'react';
import { formatThaiDateNumeric, autoFormatPhoneInput, autoFormatIdCardInput } from '@/lib/thaiDate';

interface EditTenantModalProps {
  showEditTenantModal: boolean;
  setShowEditTenantModal: (val: boolean) => void;
  editingTenant: any;
  handleSaveTenantInfo: (e: React.FormEvent) => void;
  editTenantName: string;
  setEditTenantName: (val: string) => void;
  editTenantPhone: string;
  setEditTenantPhone: (val: string) => void;
  editTenantIdCard: string;
  setEditTenantIdCard: (val: string) => void;
  editTenantLineId: string;
  setEditTenantLineId: (val: string) => void;
  editTenantEmail: string;
  setEditTenantEmail: (val: string) => void;
  editTenantAddress: string;
  setEditTenantAddress: (val: string) => void;
  editTenantWorkplace: string;
  setEditTenantWorkplace: (val: string) => void;
  editTenantEmergencyName: string;
  setEditTenantEmergencyName: (val: string) => void;
  editTenantEmergencyRel: string;
  setEditTenantEmergencyRel: (val: string) => void;
  editTenantEmergencyPhone: string;
  setEditTenantEmergencyPhone: (val: string) => void;
  editTenantNote: string;
  setEditTenantNote: (val: string) => void;
  editTenantStartDate?: string;
  setEditTenantStartDate?: (val: string) => void;
  editTenantSaving: boolean;
  styles: any;
}

export default function EditTenantModal({
  showEditTenantModal,
  setShowEditTenantModal,
  editingTenant,
  handleSaveTenantInfo,
  editTenantName,
  setEditTenantName,
  editTenantPhone,
  setEditTenantPhone,
  editTenantIdCard,
  setEditTenantIdCard,
  editTenantLineId,
  setEditTenantLineId,
  editTenantEmail,
  setEditTenantEmail,
  editTenantAddress,
  setEditTenantAddress,
  editTenantWorkplace,
  setEditTenantWorkplace,
  editTenantEmergencyName,
  setEditTenantEmergencyName,
  editTenantEmergencyRel,
  setEditTenantEmergencyRel,
  editTenantEmergencyPhone,
  setEditTenantEmergencyPhone,
  editTenantNote,
  setEditTenantNote,
  editTenantStartDate,
  setEditTenantStartDate,
  editTenantSaving,
  styles,
}: EditTenantModalProps) {
  if (!showEditTenantModal || !editingTenant) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '680px', width: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div className={styles.modalHeader} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className={styles.modalTitle} style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✏️ แก้ไขข้อมูลผู้เช่า - ห้อง {editingTenant.room?.number || ''} ({editingTenant.room?.floor?.building?.name || ''})
          </h2>
          <button className={styles.modalClose} onClick={() => setShowEditTenantModal(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveTenantInfo}>
          <div className={styles.modalBody} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category 1: Tenant Personal Details */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                👤 1. ข้อมูลส่วนตัวผู้เช่าหลัก & วันเริ่มสัญญา
              </h3>

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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      ที่อยู่เดิม / ตามทะเบียนบ้าน
                    </label>
                    <input
                      type="text"
                      value={editTenantAddress}
                      onChange={(e) => setEditTenantAddress(e.target.value)}
                      className={styles.formInput}
                      placeholder="เลขที่ หมู่ ตำบล อำเภอ จังหวัด"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem' }}>
                      สถานที่ทำงาน / สถานศึกษา
                    </label>
                    <input
                      type="text"
                      value={editTenantWorkplace}
                      onChange={(e) => setEditTenantWorkplace(e.target.value)}
                      className={styles.formInput}
                      placeholder="บริษัท/โรงเรียน/มหาลัย..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category 2: Emergency Contact */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📞 2. ผู้ติดต่อกรณีฉุกเฉิน
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

            {/* Category 3: Notes */}
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
            <button type="submit" disabled={editTenantSaving} className={`${styles.btn} ${styles.btnPrimary}`}>
              {editTenantSaving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
