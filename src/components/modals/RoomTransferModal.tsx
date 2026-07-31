'use client';

import React, { useState } from 'react';
import { formatThaiDateNumeric } from '@/lib/thaiDate';

interface RoomTransferModalProps {
  showTransferModal: boolean;
  setShowTransferModal: (val: boolean) => void;
  selectedRoom: any;
  vacantRooms: any[];
  handleExecuteTransfer: (data: any) => Promise<void>;
  styles: any;
}

export default function RoomTransferModal({
  showTransferModal,
  setShowTransferModal,
  selectedRoom,
  vacantRooms,
  handleExecuteTransfer,
  styles,
}: RoomTransferModalProps) {
  const [targetRoomId, setTargetRoomId] = useState('');
  const [sourceWater, setSourceWater] = useState('');
  const [sourceElec, setSourceElec] = useState('');
  const [targetWater, setTargetWater] = useState('');
  const [targetElec, setTargetElec] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!showTransferModal || !selectedRoom) return null;

  const activeTenant = selectedRoom.tenants?.[0];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoomId) return alert('กรุณาเลือกห้องพักปลายทาง');
    setSubmitting(true);
    try {
      await handleExecuteTransfer({
        targetRoomId,
        sourceWaterMeter: sourceWater,
        sourceElecMeter: sourceElec,
        targetWaterMeter: targetWater,
        targetElecMeter: targetElec,
        transferDate,
        note,
      });
      setShowTransferModal(false);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการย้ายห้องพัก');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🔄 ทำรายการย้ายห้องพัก - ห้อง {selectedRoom.number}</h2>
          <button className={styles.modalClose} onClick={() => setShowTransferModal(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  ผู้เช่า: <strong>{activeTenant?.name || '-'}</strong> (เบอร์โทร: {activeTenant?.phone || '-'})
                </div>
                <div>
                  ห้องเดิม: <strong>{selectedRoom.number} ({selectedRoom.floor?.building?.name})</strong>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เลือกห้องพักใหม่ปลายทาง (เฉพาะห้องว่าง) *</label>
                <select
                  className={styles.formSelect}
                  required
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                >
                  <option value="">-- เลือกห้องว่าง --</option>
                  {vacantRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      ห้อง {r.number} ({r.floor?.building?.name}) - ค่าเช่า {r.basePrice.toLocaleString()} บ./เดือน
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์น้ำวันย้ายออก (ห้องเดิม {selectedRoom.number})</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.formInput}
                    value={sourceWater}
                    onChange={(e) => setSourceWater(e.target.value)}
                    placeholder="ค่าน้ำสุดท้าย"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์ไฟวันย้ายออก (ห้องเดิม {selectedRoom.number})</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.formInput}
                    value={sourceElec}
                    onChange={(e) => setSourceElec(e.target.value)}
                    placeholder="ค่าไฟสุดท้าย"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์น้ำเริ่มต้น (ห้องใหม่)</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.formInput}
                    value={targetWater}
                    onChange={(e) => setTargetWater(e.target.value)}
                    placeholder="ค่าน้ำเริ่มต้น"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>มิเตอร์ไฟเริ่มต้น (ห้องใหม่)</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.formInput}
                    value={targetElec}
                    onChange={(e) => setTargetElec(e.target.value)}
                    placeholder="ค่าไฟเริ่มต้น"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  วันที่ทำรายการย้ายห้อง <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(transferDate)})</span> *
                </label>
                <input
                  type="date"
                  required
                  className={styles.formInput}
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ย้ายเนื่องจากต้องการห้องชั้นล่าง"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btn} onClick={() => setShowTransferModal(false)}>
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ backgroundColor: '#7c3aed' }}
            >
              {submitting ? '⏳ กำลังย้ายห้อง...' : '🚀 ยืนยันการย้ายห้องพัก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
