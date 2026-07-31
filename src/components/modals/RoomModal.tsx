'use client';

import React from 'react';
import { formatThaiDateNumeric, formatThaiDateLong, getShortBuildingName, formatPhone, formatIdCard } from '@/lib/thaiDate';

interface RoomModalProps {
  showRoomModal: boolean;
  setShowRoomModal: (val: boolean) => void;
  selectedRoom: any;
  setCheckInWaterMeter: (val: string) => void;
  setCheckInElecMeter: (val: string) => void;
  setCheckInSecurityDeposit: (val: string) => void;
  setCheckInEmergencyRel: (val: string) => void;
  setCheckInUseKeycard: (val: boolean) => void;
  setCheckInKeycardCount: (val: string) => void;
  setCheckInKeycardDeposit: (val: string) => void;
  setCheckInKeycardCode: (val: string) => void;
  setShowCheckInModal: (val: boolean) => void;
  setBookingName: (val: string) => void;
  setBookingPhone: (val: string) => void;
  setBookingIdCard: (val: string) => void;
  setBookingEmail: (val: string) => void;
  setBookingLineId: (val: string) => void;
  setBookingCheckInDate: (val: string) => void;
  setBookingDeposit: (val: string) => void;
  setBookingNote: (val: string) => void;
  setBookingSlipImage: (val: string) => void;
  setBookingMode: (val: 'EXPRESS' | 'FULL') => void;
  setShowBookingModal: (val: boolean) => void;
  refreshDashboardData: () => void;
  handleBookingCheckInSubmit: (bookingId: string) => void;
  handleBookingCancel: (bookingId: string, action: 'REFUND' | 'FORFEIT') => void;
  handleOpenInvoiceModal: (room: any) => void;
  handleOpenCheckOutModal: (tenant: any) => void;
  handleCancelCheckIn?: (tenantId: string) => void;
  handleOpenRoomTransferModal?: (room: any) => void;
  handleOpenReplaceMeterModal?: (room: any) => void;
  modalWaterType: string;
  setModalWaterType: (val: string) => void;
  modalElecType: string;
  setModalElecType: (val: string) => void;
  styles: any;
  Icons: any;
}

export default function RoomModal({
  showRoomModal,
  setShowRoomModal,
  selectedRoom,
  setCheckInWaterMeter,
  setCheckInElecMeter,
  setCheckInSecurityDeposit,
  setCheckInEmergencyRel,
  setCheckInUseKeycard,
  setCheckInKeycardCount,
  setCheckInKeycardDeposit,
  setCheckInKeycardCode,
  setShowCheckInModal,
  setBookingName,
  setBookingPhone,
  setBookingIdCard,
  setBookingEmail,
  setBookingLineId,
  setBookingCheckInDate,
  setBookingDeposit,
  setBookingNote,
  setBookingSlipImage,
  setBookingMode,
  setShowBookingModal,
  refreshDashboardData,
  handleBookingCheckInSubmit,
  handleBookingCancel,
  handleOpenInvoiceModal,
  handleOpenCheckOutModal,
  handleCancelCheckIn,
  handleOpenRoomTransferModal,
  handleOpenReplaceMeterModal,
  modalWaterType,
  setModalWaterType,
  modalElecType,
  setModalElecType,
  styles,
  Icons,
}: RoomModalProps) {
  if (!showRoomModal || !selectedRoom) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            ห้อง {selectedRoom.number} - {getShortBuildingName(selectedRoom.floor.building.name)} (ชั้น {selectedRoom.floor.number})
          </h2>
          <button className={styles.modalClose} onClick={() => setShowRoomModal(false)}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Compact Room metadata bar */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              marginBottom: '1.25rem',
              backgroundColor: 'var(--bg-color)',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>ประเภทห้อง:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {selectedRoom.type === 'AC' ? 'ห้องปรับอากาศ (แอร์)' : 'ห้องธรรมดา (พัดลม)'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>ค่าเช่ารายเดือน:</span>{' '}
              <strong style={{ color: 'var(--primary-color)' }}>{selectedRoom.basePrice.toLocaleString()} บาท</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>สถานะ:</span>
              <span
                className={`${styles.invoiceBadge}`}
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor:
                    selectedRoom.status === 'VACANT'
                      ? 'var(--status-vacant-bg)'
                      : selectedRoom.status === 'OCCUPIED'
                      ? 'var(--status-occupied-bg)'
                      : selectedRoom.status === 'BOOKED'
                      ? '#fff3cd'
                      : 'var(--status-maintenance-bg)',
                  color:
                    selectedRoom.status === 'VACANT'
                      ? 'var(--status-vacant)'
                      : selectedRoom.status === 'OCCUPIED'
                      ? 'var(--status-occupied)'
                      : selectedRoom.status === 'BOOKED'
                      ? '#856404'
                      : 'var(--status-maintenance)',
                }}
              >
                {selectedRoom.status === 'VACANT'
                  ? 'ห้องว่าง'
                  : selectedRoom.status === 'OCCUPIED'
                  ? 'มีผู้เช่า'
                  : selectedRoom.status === 'BOOKED'
                  ? 'จองแล้ว'
                  : 'ปิดปรับปรุง'}
              </span>
            </div>
          </div>

          {/* Status Specific Info */}
          {selectedRoom.status === 'VACANT' ? (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>ไม่มีผู้เช่าเข้าพัก</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    const latestReading = selectedRoom.readings?.[0];
                    const waterVal = latestReading ? latestReading.waterValue : selectedRoom.currentWater ?? selectedRoom.prevWater ?? 0;
                    const elecVal = latestReading ? latestReading.electricityValue : selectedRoom.currentElec ?? selectedRoom.prevElec ?? 0;
                    setCheckInWaterMeter(waterVal.toString());
                    setCheckInElecMeter(elecVal.toString());
                    setCheckInSecurityDeposit(selectedRoom.basePrice ? selectedRoom.basePrice.toString() : '');
                    setCheckInEmergencyRel('');
                    setCheckInUseKeycard(false);
                    setCheckInKeycardCount('0');
                    setCheckInKeycardDeposit('0');
                    setCheckInKeycardCode('');
                    setShowRoomModal(false);
                    setShowCheckInModal(true);
                  }}
                >
                  <Icons.User /> ลงทะเบียนผู้เช่าใหม่
                </button>

                <button
                  className={`${styles.btn}`}
                  style={{ backgroundColor: '#ffc107', color: '#000', fontWeight: 600 }}
                  onClick={() => {
                    setBookingName('');
                    setBookingPhone('');
                    setBookingIdCard('');
                    setBookingEmail('');
                    setBookingLineId('');
                    setBookingCheckInDate(new Date().toISOString().split('T')[0]);
                    setBookingDeposit('');
                    setBookingNote('');
                    setBookingSlipImage('');
                    setBookingMode('EXPRESS');
                    setShowRoomModal(false);
                    setShowBookingModal(true);
                  }}
                >
                  📅 จองห้องพัก
                </button>

                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={async () => {
                    if (confirm('เปลี่ยนสถานะห้องพักเป็น "ปิดปรับปรุง/ซ่อมบำรุง" ใช่หรือไม่?')) {
                      const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'MAINTENANCE' }),
                      });
                      if (res.ok) {
                        setShowRoomModal(false);
                        refreshDashboardData();
                      }
                    }
                  }}
                >
                  ปิดปรับปรุงห้องพัก
                </button>
              </div>
            </div>
          ) : selectedRoom.status === 'BOOKED' ? (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600, color: '#856404' }}>📌 รายละเอียดการจองห้องพัก</h4>
              {selectedRoom.bookings && selectedRoom.bookings.find((b: any) => b.status === 'ACTIVE') ? (
                (() => {
                  const activeB = selectedRoom.bookings.find((b: any) => b.status === 'ACTIVE');
                  return (
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#fff8e6',
                        border: '1px solid #ffeba8',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        color: '#1e293b',
                      }}
                    >
                      <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontWeight: 600, color: '#0f172a' }}>
                        👤 ผู้จอง: {activeB.customerName}
                      </p>
                      <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#334155' }}>
                        📞 เบอร์โทรศัพท์: {formatPhone(activeB.customerPhone)}
                      </p>
                      {activeB.customerIdCard && (
                        <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.3rem', fontFamily: 'monospace' }}>
                          🪪 เลขบัตรประชาชน: {formatIdCard(activeB.customerIdCard)}
                        </p>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.3rem' }}>
                        📅 กำหนดวันย้ายเข้า: {new Date(activeB.expectedCheckInDate).toLocaleDateString('th-TH')}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>
                        💵 เงินมัดจำการจอง: {activeB.depositAmount.toLocaleString()} บาท
                      </p>
                      {activeB.note && (
                        <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.3rem', fontStyle: 'italic' }}>
                          📝 หมายเหตุ: {activeB.note}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <button
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          onClick={() => handleBookingCheckInSubmit(activeB.id)}
                        >
                          📝 ทำสัญญาเข้าพัก (Check-in)
                        </button>
                        <button
                          className={`${styles.btn}`}
                          style={{ backgroundColor: '#17a2b8', color: '#fff' }}
                          onClick={() => handleBookingCancel(activeB.id, 'REFUND')}
                        >
                          ↩️ ยกเลิก (คืนมัดจำ)
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger}`}
                          onClick={() => handleBookingCancel(activeB.id, 'FORFEIT')}
                        >
                          ❌ ยกเลิก (ริบมัดจำ)
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลการจองที่ใช้งานอยู่</p>
              )}
            </div>
          ) : selectedRoom.status === 'OCCUPIED' && selectedRoom.tenants[0] ? (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>ข้อมูลผู้เช่าปัจจุบัน</h4>

              {/* 📌 Notice Out Alert Banner */}
              {(selectedRoom.tenants[0].noticeDate || selectedRoom.tenants[0].expectedCheckOutDate) && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef3c7',
                    border: '1.5px solid #fde047',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    color: '#92400e',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📌 ผู้เช่าแจ้งย้ายออกล่วงหน้าแล้ว
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>
                      📅 แจ้งเมื่อ: <strong>{selectedRoom.tenants[0].noticeDate ? formatThaiDateNumeric(selectedRoom.tenants[0].noticeDate) : '-'}</strong>
                    </span>
                    <span>
                      🚪 วันย้ายออกจริง: <strong>{selectedRoom.tenants[0].expectedCheckOutDate ? formatThaiDateNumeric(selectedRoom.tenants[0].expectedCheckOutDate) : '-'}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(2, 132, 199, 0.04)',
                }}
              >
                <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '1rem' }}>
                  <Icons.User /> <strong>{selectedRoom.tenants[0].name}</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                    <Icons.Phone /> <strong style={{ color: 'var(--primary-color)' }}>{formatPhone(selectedRoom.tenants[0].phone)}</strong>
                  </p>
                  {selectedRoom.tenants[0].phone && (
                    <a
                      href={`tel:${selectedRoom.tenants[0].phone}`}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', textDecoration: 'none' }}
                    >
                      📞 โทรออก
                    </a>
                  )}
                </div>
                {selectedRoom.tenants[0].idCard && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontFamily: 'monospace' }}>
                    🪪 เลขบัตรประชาชน: {formatIdCard(selectedRoom.tenants[0].idCard)}
                  </p>
                )}
                {selectedRoom.tenants[0].address && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    🏠 ที่อยู่: {selectedRoom.tenants[0].address}
                  </p>
                )}
                {selectedRoom.tenants[0].workplace && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    🏢 ที่ทำงาน/ศึกษา: {selectedRoom.tenants[0].workplace}
                  </p>
                )}
                {selectedRoom.tenants[0].emergencyName && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.4rem 0 0.3rem 0', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#fff1f2', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fecdd3' }}>
                    <p style={{ fontSize: '0.85rem', color: '#e11d48', fontWeight: 600, margin: 0 }}>
                      🚨 ผู้ติดต่อฉุกเฉิน: {selectedRoom.tenants[0].emergencyName} ({selectedRoom.tenants[0].emergencyRel || 'ญาติ'}) - {formatPhone(selectedRoom.tenants[0].emergencyPhone)}
                    </p>
                    {selectedRoom.tenants[0].emergencyPhone && (
                      <a
                        href={`tel:${selectedRoom.tenants[0].emergencyPhone}`}
                        className={`${styles.btn}`}
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', backgroundColor: '#e11d48', color: '#ffffff', textDecoration: 'none' }}
                      >
                        📞 โทร
                      </a>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>
                    💵 เงินมัดจำประกัน: {(selectedRoom.tenants[0].securityDeposit || 0).toLocaleString()} ฿
                  </span>
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                    🔑 คีย์การ์ด ({selectedRoom.tenants[0].keycardCount || 0} ใบ): มัดจำ {(selectedRoom.tenants[0].keycardDeposit || 0).toLocaleString()} ฿ {selectedRoom.tenants[0].keycardCode ? `[${selectedRoom.tenants[0].keycardCode}]` : ''}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    📅 เริ่มทำสัญญา: {formatThaiDateNumeric(selectedRoom.tenants[0].startDate)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleOpenInvoiceModal(selectedRoom)}>
                  ออกบิลค่าเช่า/น้ำไฟ
                </button>
                {handleOpenRoomTransferModal && (
                  <button
                    className={`${styles.btn}`}
                    style={{ backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold' }}
                    onClick={() => handleOpenRoomTransferModal(selectedRoom)}
                  >
                    🔄 ย้ายห้องพัก
                  </button>
                )}
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleOpenCheckOutModal(selectedRoom.tenants[0])}>
                  🚪 แจ้งย้ายออก & คิดเงินคืนมัดจำ (Check-out)
                </button>
                {handleCancelCheckIn && (
                  <button
                    className={`${styles.btn}`}
                    style={{ backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold' }}
                    onClick={() => handleCancelCheckIn(selectedRoom.tenants[0].id)}
                  >
                    🗑️ ยกเลิกการเข้าพัก
                  </button>
                )}
                {handleOpenReplaceMeterModal && (
                  <button
                    className={`${styles.btn}`}
                    style={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold' }}
                    onClick={() => handleOpenReplaceMeterModal(selectedRoom)}
                  >
                    🔧 เปลี่ยนมิเตอร์น้ำ/ไฟ
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>ห้องพักอยู่ระหว่างปิดปรับปรุง</h4>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={async () => {
                  const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'VACANT' }),
                  });
                  if (res.ok) {
                    setShowRoomModal(false);
                    refreshDashboardData();
                  }
                }}
              >
                เปิดให้เช่าห้องพัก (เปิดใช้งานห้อง)
              </button>
            </div>
          )}

          {/* Edit Room Settings Form */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>แก้ไขราคาและการตั้งค่าห้องพัก</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const rentPrice = (form.elements.namedItem('rentPrice') as HTMLInputElement).value;
                const roomType = (form.elements.namedItem('roomType') as HTMLSelectElement).value;
                const waterType = (form.elements.namedItem('waterType') as HTMLSelectElement).value;
                const flatWater = (form.elements.namedItem('flatWater') as HTMLInputElement).value;
                const elecType = (form.elements.namedItem('elecType') as HTMLSelectElement).value;
                const flatElec = (form.elements.namedItem('flatElec') as HTMLInputElement).value;

                try {
                  const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      basePrice: parseFloat(rentPrice),
                      type: roomType,
                      waterBillingType: waterType,
                      flatWaterCost: parseFloat(flatWater || '0'),
                      elecBillingType: elecType,
                      flatElecCost: parseFloat(flatElec || '0'),
                    }),
                  });
                  if (res.ok) {
                    alert('อัปเดตการตั้งค่าห้องพักสำเร็จ');
                    setShowRoomModal(false);
                    refreshDashboardData();
                  } else {
                    const d = await res.json();
                    alert(d.error || 'เกิดข้อผิดพลาด');
                  }
                } catch (err) {
                  console.error(err);
                  alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                    ราคาค่าเช่า (บาท/เดือน) *
                  </label>
                  <input
                    type="number"
                    name="rentPrice"
                    defaultValue={selectedRoom.basePrice}
                    className={styles.formInput}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                    ประเภทห้องพัก *
                  </label>
                  <select
                    name="roomType"
                    defaultValue={selectedRoom.type}
                    className={styles.formInput}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  >
                    <option value="FAN">ห้องธรรมดา (พัดลม)</option>
                    <option value="AC">ห้องปรับอากาศ (แอร์)</option>
                  </select>
                </div>

                {/* Water Config */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                    การคิดค่าน้ำ *
                  </label>
                  <select
                    name="waterType"
                    value={modalWaterType}
                    className={styles.formInput}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                    onChange={(e) => setModalWaterType(e.target.value)}
                  >
                    <option value="METER">ตามระบบ</option>
                    <option value="FLAT">เหมาจ่าย</option>
                    <option value="CUSTOM">กำหนดเอง</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  {modalWaterType === 'METER' ? (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ค่าน้ำตามระบบ (บาท/หน่วย)
                      </label>
                      <input
                        key="water-meter-input"
                        type="text"
                        value={`${selectedRoom.floor.building.waterRate} บาท/หน่วย`}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
                        disabled
                      />
                      <input type="hidden" name="flatWater" value="0" />
                    </>
                  ) : modalWaterType === 'FLAT' ? (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                        ค่าน้ำเหมาจ่าย (บาท/เดือน) *
                      </label>
                      <input
                        key="water-flat-input"
                        type="number"
                        name="flatWater"
                        defaultValue={selectedRoom.flatWaterCost || 0}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                        ค่าน้ำกำหนดเองเริ่มต้น (บาท/เดือน) *
                      </label>
                      <input
                        key="water-custom-input"
                        type="number"
                        name="flatWater"
                        defaultValue={selectedRoom.flatWaterCost || 0}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                        required
                      />
                    </>
                  )}
                </div>

                {/* Electricity Config */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                    การคิดค่าไฟ *
                  </label>
                  <select
                    name="elecType"
                    value={modalElecType}
                    className={styles.formInput}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                    onChange={(e) => setModalElecType(e.target.value)}
                  >
                    <option value="METER">ตามระบบ</option>
                    <option value="FLAT">เหมาจ่าย</option>
                    <option value="CUSTOM">กำหนดเอง</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  {modalElecType === 'METER' ? (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ค่าไฟตามระบบ (บาท/หน่วย)
                      </label>
                      <input
                        key="elec-meter-input"
                        type="text"
                        value={`${selectedRoom.floor.building.electricityRate} บาท/หน่วย`}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
                        disabled
                      />
                      <input type="hidden" name="flatElec" value="0" />
                    </>
                  ) : modalElecType === 'FLAT' ? (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                        ค่าไฟเหมาจ่าย (บาท/เดือน) *
                      </label>
                      <input
                        key="elec-flat-input"
                        type="number"
                        name="flatElec"
                        defaultValue={selectedRoom.flatElecCost || 0}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label className={styles.formLabel} style={{ fontSize: '0.8rem' }}>
                        ค่าไฟกำหนดเองเริ่มต้น (บาท/เดือน) *
                      </label>
                      <input
                        key="elec-custom-input"
                        type="number"
                        name="flatElec"
                        defaultValue={selectedRoom.flatElecCost || 0}
                        className={styles.formInput}
                        style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Dual Action Buttons Footer: Cancel & Save */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{
                    flex: '1 1 120px',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                  }}
                  onClick={() => setShowRoomModal(false)}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className={styles.btn}
                  style={{
                    flex: '2 1 200px',
                    backgroundColor: 'var(--primary-color)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  💾 บันทึกข้อมูลราคาและค่าห้องพัก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
