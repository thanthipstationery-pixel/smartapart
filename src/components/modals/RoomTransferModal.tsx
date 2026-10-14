'use client';

import React, { useState, useEffect } from 'react';
import { formatThaiDateNumeric, getShortBuildingName } from '@/lib/thaiDate';
import { calculateCheckInPayment } from '@/lib/billingRules';

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

  // Financial States
  const [otherFees, setOtherFees] = useState<{ id: string; name: string; amount: string }[]>([
    { id: '1', name: '', amount: '' }
  ]);
  
  const [keycardAction, setKeycardAction] = useState<'NONE' | 'KEEP' | 'REPLACE' | 'RETURN'>('KEEP');
  const [newKeycardCount, setNewKeycardCount] = useState<number>(0);
  const [newKeycardDeposit, setNewKeycardDeposit] = useState<number>(0);
  const [oldKeycardRefund, setOldKeycardRefund] = useState<number>(0);
  
  const [manualNetTotal, setManualNetTotal] = useState('');
  const [newSecurityDeposit, setNewSecurityDeposit] = useState<number>(0);

  const activeTenant = selectedRoom?.tenants?.[0];
  const targetRoom = vacantRooms.find((r) => r.id === targetRoomId);

  // Initialization effects
  useEffect(() => {
    if (activeTenant) {
      setNewKeycardCount(activeTenant.keycardCount || 0);
      setNewKeycardDeposit(activeTenant.keycardDeposit || 0);
      setOldKeycardRefund(activeTenant.keycardDeposit || 0);
    }
  }, [activeTenant]);

  useEffect(() => {
    if (targetRoom) {
      setNewSecurityDeposit(targetRoom.basePrice || 0);
    } else {
      setNewSecurityDeposit(0);
    }
  }, [targetRoom]);

  if (!showTransferModal || !selectedRoom) return null;

  // Live Financial Breakdown
  const waterRate = selectedRoom.floor?.building?.waterRate || 18;
  const elecRate = selectedRoom.floor?.building?.electricityRate || 8;
  
  let derivedPrevWater = 0;
  let derivedPrevElec = 0;
  if (selectedRoom.currentWater !== undefined && selectedRoom.currentWater !== null) {
    derivedPrevWater = selectedRoom.currentWater;
    derivedPrevElec = selectedRoom.currentElec;
  } else if (selectedRoom.prevWater !== undefined && selectedRoom.prevWater !== null) {
    derivedPrevWater = selectedRoom.prevWater;
    derivedPrevElec = selectedRoom.prevElec;
  } else if (selectedRoom.readings && selectedRoom.readings.length > 0) {
    derivedPrevWater = selectedRoom.readings[0].waterValue;
    derivedPrevElec = selectedRoom.readings[0].electricityValue;
  }

  const finalWaterNum = sourceWater !== '' ? parseFloat(sourceWater) : derivedPrevWater;
  const finalElecNum = sourceElec !== '' ? parseFloat(sourceElec) : derivedPrevElec;
  
  const waterUnits = Math.max(0, finalWaterNum - derivedPrevWater);
  const elecUnits = Math.max(0, finalElecNum - derivedPrevElec);
  const waterCost = waterUnits * waterRate;
  const elecCost = elecUnits * elecRate;

  // Old room rent credit
  const outD = new Date(transferDate || new Date().toISOString().split('T')[0]);
  const daysInMonth = new Date(outD.getFullYear(), outD.getMonth() + 1, 0).getDate();
  const currentDay = outD.getDate();
  const remainingDays = Math.max(0, daysInMonth - currentDay);
  const oldDailyRent = (selectedRoom.basePrice || 0) / daysInMonth;
  const proratedOldRentCredit = Math.round(oldDailyRent * remainingDays);

  const oldSecurityDeposit = activeTenant?.securityDeposit || 0;

  // New room check-in calculation
  let checkInCalc = null;
  let proratedNewRent = 0;
  let nextMonthFullRent = 0;
  if (targetRoom) {
    checkInCalc = calculateCheckInPayment(transferDate, targetRoom.basePrice, newSecurityDeposit);
    proratedNewRent = checkInCalc.currentMonthRent;
    nextMonthFullRent = checkInCalc.nextMonthRent;
  }

  const depositDifference = newSecurityDeposit - oldSecurityDeposit;
  
  const otherFeesTotal = otherFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
  
  let keycardNet = 0;
  if (activeTenant?.keycardCount > 0) {
    if (keycardAction === 'REPLACE' || keycardAction === 'NONE') {
       keycardNet = newKeycardDeposit - oldKeycardRefund;
    } else if (keycardAction === 'RETURN') {
       keycardNet = -oldKeycardRefund;
    } else if (keycardAction === 'KEEP') {
       keycardNet = 0;
    }
  }

  const netTotal = proratedNewRent + nextMonthFullRent + waterCost + elecCost + otherFeesTotal - proratedOldRentCredit + depositDifference + keycardNet;
  const displayNetTotal = manualNetTotal !== '' ? parseFloat(manualNetTotal) : netTotal;

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
        invoiceData: {
          proratedOldRentCredit,
          proratedNewRent,
          nextMonthFullRent,
          waterCost,
          elecCost,
          otherFeeDetails: otherFees.filter(f => f.name.trim() !== '' && parseFloat(f.amount) > 0).map(f => ({ name: f.name, amount: parseFloat(f.amount) })),
          newSecurityDeposit,
          keycardAction,
          keycardRefund: oldKeycardRefund,
          newKeycardDeposit,
          newKeycardCount,
          netTotal: displayNetTotal,
          ruleCode: checkInCalc?.ruleCode,
          billingPeriod: checkInCalc?.billingPeriod,
          waterRate,
          elecRate
        }
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
      <div className={styles.modalCard} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🔄 ทำรายการย้ายห้องพัก - ห้อง {selectedRoom.number}</h2>
          <button className={styles.modalClose} type="button" onClick={() => setShowTransferModal(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.modalBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>👤 ผู้เช่า: {activeTenant?.name || '-'}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📞 {activeTenant?.phone || '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                    💵 มัดจำประกันสัญญาเดิม: {(activeTenant?.securityDeposit || 0).toLocaleString()} ฿
                  </span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                    🔑 มัดจำคีย์การ์ดเดิม: {(activeTenant?.keycardDeposit || 0).toLocaleString()} ฿ ({activeTenant?.keycardCount || 0} ใบ)
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  ห้องเดิม: <strong>{getShortBuildingName(selectedRoom.floor?.building?.name)} ห้อง {selectedRoom.number}</strong> - ค่าเช่า {selectedRoom.basePrice?.toLocaleString()} บ./เดือน
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เลือกห้องพักใหม่ปลายทาง (เฉพาะห้องว่าง) *</label>
                <select className={styles.formSelect} required value={targetRoomId} onChange={(e) => setTargetRoomId(e.target.value)}>
                  <option value="">-- เลือกห้องว่าง --</option>
                  {vacantRooms.map((r) => {
                    const shortName = getShortBuildingName(r.buildingName);
                    const roomType = r.type === 'AC' ? 'แอร์' : r.type === 'FAN' ? 'พัดลม' : r.type;
                    return (
                      <option key={r.id} value={r.id}>
                        {shortName} ห้อง {r.number} {roomType ? `(${roomType})` : ''} - ค่าเช่า {r.basePrice.toLocaleString()} บ./เดือน
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  วันที่ทำรายการย้ายห้อง (มีผลกับการคิดเงิน) <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiDateNumeric(transferDate)})</span> *
                </label>
                <input type="date" required className={styles.formInput} value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
              </div>

              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                มิเตอร์และค่าใช้จ่ายห้องเดิม ({selectedRoom.number})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>💧 มิเตอร์น้ำวันย้ายออก (เดิม {derivedPrevWater})</label>
                  <input type="number" step="any" className={styles.formInput} value={sourceWater} onChange={(e) => setSourceWater(e.target.value)} placeholder="ค่าน้ำสุดท้าย" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>⚡ มิเตอร์ไฟวันย้ายออก (เดิม {derivedPrevElec})</label>
                  <input type="number" step="any" className={styles.formInput} value={sourceElec} onChange={(e) => setSourceElec(e.target.value)} placeholder="ค่าไฟสุดท้าย" />
                </div>
              </div>
              
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '-0.5rem' }}>
                รายการค่าใช้จ่าย / หักลบเพิ่มเติม (ห้องเดิม)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {otherFees.map((fee, idx) => (
                  <div key={fee.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="ชื่อรายการ (เช่น ค่าทำความสะอาด)"
                      value={fee.name}
                      onChange={(e) => {
                        const newFees = [...otherFees];
                        newFees[idx].name = e.target.value;
                        setOtherFees(newFees);
                      }}
                      style={{ flex: 2 }}
                    />
                    <input
                      type="number"
                      className={styles.formInput}
                      placeholder="จำนวนเงิน"
                      value={fee.amount}
                      onChange={(e) => {
                        const newFees = [...otherFees];
                        newFees[idx].amount = e.target.value;
                        setOtherFees(newFees);
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setOtherFees(otherFees.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOtherFees([...otherFees, { id: Math.random().toString(36).substr(2, 9), name: '', amount: '' }])}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--status-info)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span> เพิ่มรายการค่าใช้จ่าย
                </button>
              </div>

              {targetRoom && (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                    ข้อมูลสำหรับห้องใหม่ ({targetRoom.number})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>มัดจำประกันสัญญาห้องใหม่ (บาท) *</label>
                      <input type="number" required className={styles.formInput} value={newSecurityDeposit} onChange={(e) => setNewSecurityDeposit(Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>💧 มิเตอร์น้ำเริ่มต้น (ห้องใหม่)</label>
                      <input type="number" step="any" className={styles.formInput} value={targetWater} onChange={(e) => setTargetWater(e.target.value)} placeholder="ค่าน้ำเริ่มต้น" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>⚡ มิเตอร์ไฟเริ่มต้น (ห้องใหม่)</label>
                      <input type="number" step="any" className={styles.formInput} value={targetElec} onChange={(e) => setTargetElec(e.target.value)} placeholder="ค่าไฟเริ่มต้น" />
                    </div>
                  </div>
                </>
              )}

              {activeTenant?.keycardCount > 0 && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.5rem' }}>🔑 จัดการคีย์การ์ดเดิม ({activeTenant.keycardCount} ใบ)</div>
                  <div className={styles.formGroup}>
                    <select className={styles.formSelect} value={keycardAction} onChange={(e) => setKeycardAction(e.target.value as any)}>
                      <option value="KEEP">ใช้คีย์การ์ดเดิม (โอนย้ายมัดจำปกติ)</option>
                      <option value="RETURN">คืนคีย์การ์ด (รับเงินมัดจำคืน)</option>
                      <option value="REPLACE">ทำคีย์การ์ดใหม่ (คืนของเก่า & จ่ายมัดจำใหม่)</option>
                      <option value="NONE">ไม่โอนย้ายข้อมูลคีย์การ์ด</option>
                    </select>
                  </div>
                  {(keycardAction === 'REPLACE' || keycardAction === 'RETURN') && (
                    <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                      <label className={styles.formLabel}>ยอดคืนมัดจำคีย์การ์ดเดิม (บาท)</label>
                      <input type="number" className={styles.formInput} value={oldKeycardRefund} onChange={(e) => setOldKeycardRefund(Number(e.target.value))} />
                    </div>
                  )}
                  {keycardAction === 'REPLACE' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>จำนวนคีย์การ์ดใหม่</label>
                        <input type="number" className={styles.formInput} value={newKeycardCount} onChange={(e) => setNewKeycardCount(Number(e.target.value))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>มัดจำคีย์การ์ดใหม่ (บาท)</label>
                        <input type="number" className={styles.formInput} value={newKeycardDeposit} onChange={(e) => setNewKeycardDeposit(Number(e.target.value))} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>📝 หมายเหตุเพิ่มเติม</label>
                <input type="text" className={styles.formInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ย้ายเนื่องจากต้องการห้องชั้นล่าง" />
              </div>

              {targetRoom && (
                <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#38bdf8', marginBottom: '0.6rem', borderBottom: '1px solid #334155', paddingBottom: '0.4rem' }}>
                    📊 สรุปค่าใช้จ่ายการย้ายห้อง (Live Preview)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <div>
                      💰 คืนค่าเช่าห้องเดิมส่วนเฉลี่ย ({remainingDays} วัน): <strong style={{ color: '#4ade80' }}>-{proratedOldRentCredit.toLocaleString()} ฿</strong>
                    </div>
                    <div>
                      💧 ค่าน้ำห้องเดิม ({waterUnits} หน่วย): <strong style={{ color: waterCost > 0 ? '#f87171' : '#fff' }}>+{waterCost.toLocaleString()} ฿</strong>
                    </div>
                    <div>
                      🏠 ค่าเช่าห้องใหม่เดือนปัจจุบัน (Rule {checkInCalc?.ruleCode.replace('RULE_', '').replace('_', '.')}): <strong style={{ color: proratedNewRent > 0 ? '#f87171' : '#fff' }}>+{proratedNewRent.toLocaleString()} ฿</strong>
                    </div>
                    <div>
                      ⚡ ค่าไฟห้องเดิม ({elecUnits} หน่วย): <strong style={{ color: elecCost > 0 ? '#f87171' : '#fff' }}>+{elecCost.toLocaleString()} ฿</strong>
                    </div>
                    {nextMonthFullRent > 0 && (
                      <div>
                        🏠 ค่าเช่าห้องใหม่เดือนล่วงหน้า: <strong style={{ color: '#f87171' }}>+{nextMonthFullRent.toLocaleString()} ฿</strong>
                      </div>
                    )}
                    {otherFees.filter(f => parseFloat(f.amount) > 0).map((f, idx) => (
                      <div key={`summary-fee-${idx}`}>
                        📝 {f.name || 'ค่าใช้จ่ายเพิ่มเติม'}: <strong style={{ color: '#f87171' }}>+{parseFloat(f.amount).toLocaleString()} ฿</strong>
                      </div>
                    ))}
                    <div>
                      💵 ส่วนต่างมัดจำห้อง (ใหม่-เดิม): <strong style={{ color: depositDifference > 0 ? '#f87171' : depositDifference < 0 ? '#4ade80' : '#fff' }}>{depositDifference > 0 ? '+' : ''}{depositDifference.toLocaleString()} ฿</strong>
                    </div>
                    {activeTenant?.keycardCount > 0 && keycardAction !== 'KEEP' && (
                       <div>
                         🔑 ส่วนต่างคีย์การ์ด: <strong style={{ color: keycardNet > 0 ? '#f87171' : keycardNet < 0 ? '#4ade80' : '#fff' }}>{keycardNet > 0 ? '+' : ''}{keycardNet.toLocaleString()} ฿</strong>
                       </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid #334155' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>ยอดสุทธิ {netTotal >= 0 ? '(ต้องชำระเพิ่ม)' : '(คืนเงินผู้เช่า)'}:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: netTotal > 0 ? '#f87171' : netTotal < 0 ? '#4ade80' : '#fff' }}>
                      {Math.abs(netTotal).toLocaleString()} บาท
                    </span>
                  </div>

                  <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #334155', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>แก้ไขยอดชำระสุทธิ (กรณีต้องการปัดเศษหรือปรับลด):</label>
                    <input
                      type="number"
                      style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#ffffff', width: '120px' }}
                      value={manualNetTotal}
                      onChange={(e) => setManualNetTotal(e.target.value)}
                      placeholder={netTotal.toString()}
                    />
                  </div>
                </div>
              )}
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
              style={{ backgroundColor: 'var(--accent-purple)' }}
            >
              {submitting ? '⏳ กำลังย้ายห้อง...' : '🚀 ยืนยันการย้ายห้องพัก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

