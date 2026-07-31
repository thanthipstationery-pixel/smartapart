'use client';

import React, { useState } from 'react';
import { formatThaiDateNumeric } from '@/lib/thaiDate';

interface ReplaceMeterModalProps {
  showReplaceMeterModal: boolean;
  setShowReplaceMeterModal: (val: boolean) => void;
  selectedRoom: any;
  onSuccess?: () => void;
  styles: any;
}

export default function ReplaceMeterModal({
  showReplaceMeterModal,
  setShowReplaceMeterModal,
  selectedRoom,
  onSuccess,
  styles,
}: ReplaceMeterModalProps) {
  const [meterType, setMeterType] = useState<'WATER' | 'ELEC' | 'BOTH'>('WATER');
  
  // Latest recorded meter values
  const latestReading = selectedRoom?.readings && selectedRoom.readings.length > 0 ? selectedRoom.readings[0] : null;
  const prevWaterVal = latestReading ? latestReading.waterValue : 0;
  const prevElecVal = latestReading ? latestReading.electricityValue : 0;

  const [oldWaterFinal, setOldWaterFinal] = useState<string>('');
  const [newWaterStart, setNewWaterStart] = useState<string>('0');
  const [oldElecFinal, setOldElecFinal] = useState<string>('');
  const [newElecStart, setNewElecStart] = useState<string>('0');
  const [replacementDate, setReplacementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!showReplaceMeterModal || !selectedRoom) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/rooms/${selectedRoom.id}/replace-meter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterType,
          oldWaterFinal: oldWaterFinal !== '' ? parseFloat(oldWaterFinal) : null,
          newWaterStart: newWaterStart !== '' ? parseFloat(newWaterStart) : 0,
          oldElecFinal: oldElecFinal !== '' ? parseFloat(oldElecFinal) : null,
          newElecStart: newElecStart !== '' ? parseFloat(newElecStart) : 0,
          replacementDate,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนมิเตอร์');
      }

      alert('✅ บันทึกเปลี่ยนมิเตอร์ใหม่เรียบร้อยแล้ว');
      setShowReplaceMeterModal(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('❌ ' + (err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Calculations
  const oldWaterUnits = oldWaterFinal !== '' && !isNaN(parseFloat(oldWaterFinal)) ? Math.max(0, parseFloat(oldWaterFinal) - prevWaterVal) : 0;
  const oldElecUnits = oldElecFinal !== '' && !isNaN(parseFloat(oldElecFinal)) ? Math.max(0, parseFloat(oldElecFinal) - prevElecVal) : 0;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '620px', width: '95vw' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔧 บันทึกเปลี่ยนมิเตอร์น้ำ/ไฟ - ห้อง {selectedRoom.number}
          </h2>
          <button className={styles.modalClose} onClick={() => setShowReplaceMeterModal(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Meter Type Switcher */}
            <div>
              <label className={styles.formLabel} style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                เลือกประเภทมิเตอร์ที่ต้องการเปลี่ยน *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMeterType('WATER')}
                  style={{
                    padding: '0.6rem 0.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: meterType === 'WATER' ? '#0284c7' : 'var(--bg-color)',
                    color: meterType === 'WATER' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  💧 เปลี่ยนมิเตอร์น้ำ
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('ELEC')}
                  style={{
                    padding: '0.6rem 0.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: meterType === 'ELEC' ? '#eab308' : 'var(--bg-color)',
                    color: meterType === 'ELEC' ? '#000000' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ⚡ เปลี่ยนมิเตอร์ไฟ
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('BOTH')}
                  style={{
                    padding: '0.6rem 0.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: meterType === 'BOTH' ? '#8b5cf6' : 'var(--bg-color)',
                    color: meterType === 'BOTH' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🔄 เปลี่ยนทั้งน้ำและไฟ
                </button>
              </div>
            </div>

            {/* WATER METER SECTION */}
            {(meterType === 'WATER' || meterType === 'BOTH') && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid #7dd3fc',
                  backgroundColor: '#f0f9ff',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  💧 มิเตอร์น้ำประปา (Water Meter)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                      เลขถอดมิเตอร์น้ำเก่า (ครั้งสุดท้าย) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      required
                      placeholder={`เลขเดิมล่าสุดคือ ${prevWaterVal}`}
                      value={oldWaterFinal}
                      onChange={(e) => setOldWaterFinal(e.target.value)}
                      className={styles.formInput}
                      style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                      (ใช้ไปจากมิเตอร์เดิม: {oldWaterUnits} หน่วย)
                    </span>
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                      เลขเริ่มต้นมิเตอร์น้ำใหม่ *
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      required
                      placeholder="ปกติคือ 0"
                      value={newWaterStart}
                      onChange={(e) => setNewWaterStart(e.target.value)}
                      className={styles.formInput}
                      style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ELEC METER SECTION */}
            {(meterType === 'ELEC' || meterType === 'BOTH') && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid #fde047',
                  backgroundColor: '#fefce8',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontWeight: 600, color: '#854d0e', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  ⚡ มิเตอร์ไฟฟ้า (Electricity Meter)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                      เลขถอดมิเตอร์ไฟเก่า (ครั้งสุดท้าย) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      required
                      placeholder={`เลขเดิมล่าสุดคือ ${prevElecVal}`}
                      value={oldElecFinal}
                      onChange={(e) => setOldElecFinal(e.target.value)}
                      className={styles.formInput}
                      style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#854d0e' }}>
                      (ใช้ไปจากมิเตอร์เดิม: {oldElecUnits} หน่วย)
                    </span>
                  </div>

                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                      เลขเริ่มต้นมิเตอร์ไฟใหม่ *
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      required
                      placeholder="ปกติคือ 0"
                      value={newElecStart}
                      onChange={(e) => setNewElecStart(e.target.value)}
                      className={styles.formInput}
                      style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                  วันที่ทำรายการเปลี่ยนมิเตอร์ ({formatThaiDateNumeric(replacementDate)}) *
                </label>
                <input
                  type="date"
                  required
                  value={replacementDate}
                  onChange={(e) => setReplacementDate(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                />
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.82rem' }}>
                  หมายเหตุ / เหตุผลการเปลี่ยน
                </label>
                <input
                  type="text"
                  placeholder="เช่น มิเตอร์น้ำหมุนค้าง / ชำรุด"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Smart Summary Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>คำอธิบายระบบ:</strong> ระบบจะบันทึกเลขเริ่มต้นของมิเตอร์ใหม่ไว้เป็นฐานในการจดครั้งต่อไปทันที และเมื่อถึงสิ้นเดือนที่ออกบิล ใบแจ้งหนี้จะนำหน่วยการใช้งานจากมิเตอร์เก่ามารวมกับมิเตอร์ใหม่อัตโนมัติ พร้อมลงหมายเหตุบนใบเสร็จ A5 ให้อย่างชัดเจน
            </div>
          </div>

          <div className={styles.modalFooter} style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setShowReplaceMeterModal(false)}
              disabled={isSubmitting}
            >
              ❌ ยกเลิก
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ กำลังบันทึก...' : '💾 ยืนยันการบันทึกเปลี่ยนมิเตอร์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
