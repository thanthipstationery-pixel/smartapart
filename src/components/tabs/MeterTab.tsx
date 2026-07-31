'use client';

import React from 'react';
import { getShortBuildingName, formatThaiBillingPeriod } from '@/lib/thaiDate';

interface MeterTabProps {
  selectedBuildingId: string;
  setSelectedBuildingId: (val: string) => void;
  buildings: any[];
  meterPeriod: string;
  setMeterPeriod: (val: string) => void;
  meterSearchQuery: string;
  setMeterSearchQuery: (val: string) => void;
  meterStatusFilter: string;
  setMeterStatusFilter: (val: any) => void;
  meterEntryMode: string;
  setMeterEntryMode: (val: any) => void;
  setBulkBillPeriod: (val: string) => void;
  setShowBulkBillModal: (val: boolean) => void;
  fetchBulkRooms: (period: string) => void;
  handleSaveAllMeters: () => void;
  activeBuilding: any;
  invoices: any[];
  meterStatus: string;
  meterErrors: any;
  waterReadings: any;
  elecReadings: any;
  handleMeterInput: (roomId: string, type: 'water' | 'elec', val: string) => void;
  handleSingleMeterSubmit: (roomId: string, prevWater: number, prevElec: number) => void;
  styles: any;
}

export default function MeterTab({
  selectedBuildingId,
  setSelectedBuildingId,
  buildings,
  meterPeriod,
  setMeterPeriod,
  meterSearchQuery,
  setMeterSearchQuery,
  meterStatusFilter,
  setMeterStatusFilter,
  meterEntryMode,
  setMeterEntryMode,
  setBulkBillPeriod,
  setShowBulkBillModal,
  fetchBulkRooms,
  handleSaveAllMeters,
  activeBuilding,
  invoices,
  meterStatus,
  meterErrors,
  waterReadings,
  elecReadings,
  handleMeterInput,
  handleSingleMeterSubmit,
  styles,
}: MeterTabProps) {
  return (
    <div className="fade-in">
      {/* Meter Reading Filter Card */}
      <div className={styles.meterFilterCard}>
        <div className={styles.meterFilterGrid}>
          {/* 1. Building Select */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>เลือกอาคาร / ตึก</label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%' }}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{getShortBuildingName(b.name)}</option>
              ))}
            </select>
          </div>

          {/* 2. Billing Period */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              รอบบิลเดือนที่จด <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>({formatThaiBillingPeriod(meterPeriod)})</span>
            </label>
            <input
              type="month"
              value={meterPeriod}
              onChange={(e) => setMeterPeriod(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%' }}
            />
          </div>

          {/* 3. Search Room */}
          <div className={`${styles.formGroup} ${styles.meterFilterSearchField}`}>
            <label className={styles.formLabel}>🔎 ค้นหาห้องพัก</label>
            <input
              type="text"
              placeholder="พิมพ์เลขห้อง..."
              value={meterSearchQuery}
              onChange={(e) => setMeterSearchQuery(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%' }}
            />
          </div>

          {/* 4. Room Status Filter */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>กรองสถานะห้อง</label>
            <select
              value={meterStatusFilter}
              onChange={(e) => setMeterStatusFilter(e.target.value as any)}
              className={styles.formInput}
              style={{ width: '100%' }}
            >
              <option value="OCCUPIED">มีคนเช่า (Occupied)</option>
              <option value="UNRECORDED">เฉพาะห้องที่ยังไม่ได้จด</option>
              <option value="ALL">ทั้งหมด (All)</option>
              <option value="BOOKED">จองแล้ว (Booked)</option>
              <option value="VACANT">ห้องว่าง (Vacant)</option>
            </select>
          </div>

          {/* 5. Meter Entry Mode */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>⚙ รูปแบบการจด</label>
            <select
              value={meterEntryMode}
              onChange={(e) => setMeterEntryMode(e.target.value as any)}
              className={styles.formInput}
              style={{ width: '100%' }}
            >
              <option value="BOTH">จดน้ำและไฟพร้อมกัน</option>
              <option value="WATER">จดเฉพาะค่าน้ำ (Water Only)</option>
              <option value="ELEC">จดเฉพาะค่าไฟ (Elec Only)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.meterFilterActionsRow}>
          <button
            type="button"
            onClick={() => {
              setBulkBillPeriod(meterPeriod);
              setShowBulkBillModal(true);
              fetchBulkRooms(meterPeriod);
            }}
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ ออกใบแจ้งหนี้ทุกห้อง
          </button>

          <button
            className={`${styles.btn} ${styles.btnSuccess}`}
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
            onClick={handleSaveAllMeters}
          >
            💾 บันทึกที่กรอกทั้งหมด (Save All)
          </button>
        </div>
      </div>

      {/* List rooms to enter meter */}
      {activeBuilding && (() => {
        const filteredRooms = activeBuilding.floors.flatMap((f: any) => f.rooms).filter((room: any) => {
          const hasRecorded = room.isMeterRecorded === true;
          // 1. Status Filter
          if (meterStatusFilter === 'OCCUPIED' && room.status !== 'OCCUPIED') return false;
          if (meterStatusFilter === 'BOOKED' && room.status !== 'BOOKED') return false;
          if (meterStatusFilter === 'VACANT' && room.status !== 'VACANT') return false;
          if (meterStatusFilter === 'UNRECORDED' && (room.status !== 'OCCUPIED' || hasRecorded)) return false;

          // 2. Search Query Filter
          if (!meterSearchQuery) return true;
          return room.number.toLowerCase().includes(meterSearchQuery.toLowerCase());
        });

        return (
          <div className={styles.sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                บันทึกมิเตอร์ตึก: {activeBuilding.name} (ค่าน้ำ {activeBuilding.waterRate} บ., ค่าไฟ {activeBuilding.electricityRate} บ.)
              </h3>
              {meterSearchQuery && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  พบผลการค้นหา {filteredRooms.length} ห้อง
                </span>
              )}
            </div>

            {filteredRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                🔍 ไม่พบห้องพักเลขที่ "{meterSearchQuery}" ในอาคารนี้
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className={styles.meterDesktopTable}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.meterTable}>
                      <thead>
                        <tr>
                          <th>ห้องพัก</th>
                          <th>ประเภท</th>
                          <th>ผู้เช่า</th>
                          {(meterEntryMode === 'BOTH' || meterEntryMode === 'WATER') && (
                            <>
                              <th>มิเตอร์น้ำครั้งก่อน</th>
                              <th>มิเตอร์น้ำครั้งใหม่</th>
                            </>
                          )}
                          {(meterEntryMode === 'BOTH' || meterEntryMode === 'ELEC') && (
                            <>
                              <th>มิเตอร์ไฟครั้งก่อน</th>
                              <th>มิเตอร์ไฟครั้งใหม่</th>
                            </>
                          )}
                          <th>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRooms.map((room: any) => {
                          const isSaved = meterStatus.includes(`roomId-${room.id}-saved`);
                          const roomInvoice = invoices.find(
                            (inv: any) => inv.roomId === room.id && inv.billingPeriod === meterPeriod
                          );
                          const isInvoicePaid = roomInvoice && (roomInvoice.status === 'PAID' || roomInvoice.status === 'PARTIAL');
                          const isVacantRoom = room.status !== 'OCCUPIED' && !room.activeTenant;
                          const isLocked = isInvoicePaid || isVacantRoom;
                          const hasRecord = room.currentWater !== null && room.currentWater !== undefined;

                          return (
                            <tr key={room.id} style={isVacantRoom ? { opacity: 0.7 } : undefined}>
                              <td style={{ fontWeight: 'bold' }}>{room.number}</td>
                              <td>{room.type === 'AC' ? 'แอร์' : 'พัดลม'}</td>
                              <td>
                                <span style={{ fontSize: '0.85rem', color: room.status === 'OCCUPIED' ? 'var(--primary-color)' : 'inherit' }}>
                                  {room.status === 'OCCUPIED' ? (room.activeTenant ? room.activeTenant.name : 'มีผู้เช่า') : '-'}
                                </span>
                              </td>
                              {(meterEntryMode === 'BOTH' || meterEntryMode === 'WATER') && (
                                <>
                                  <td>{room.prevWater}</td>
                                  <td>
                                    <input
                                      type="number"
                                      step="any"
                                      inputMode="decimal"
                                      pattern="[0-9.]*"
                                      disabled={isLocked}
                                      className={`${styles.meterInput} ${meterErrors[room.id] === 'water' ? styles.meterInputError : ''}`}
                                      placeholder={isVacantRoom ? "ห้องว่าง" : "เลขใหม่"}
                                      value={waterReadings[room.id] !== undefined ? waterReadings[room.id] : (room.currentWater !== null && room.currentWater !== undefined ? room.currentWater.toString() : '')}
                                      onChange={(e) => handleMeterInput(room.id, 'water', e.target.value)}
                                      style={isLocked ? { opacity: 0.65, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                                    />
                                  </td>
                                </>
                              )}
                              {(meterEntryMode === 'BOTH' || meterEntryMode === 'ELEC') && (
                                <>
                                  <td>{room.prevElec}</td>
                                  <td>
                                    <input
                                      type="number"
                                      step="any"
                                      inputMode="decimal"
                                      pattern="[0-9.]*"
                                      disabled={isLocked}
                                      className={`${styles.meterInput} ${meterErrors[room.id] === 'elec' ? styles.meterInputError : ''}`}
                                      placeholder={isVacantRoom ? "ห้องว่าง" : "เลขใหม่"}
                                      value={elecReadings[room.id] !== undefined ? elecReadings[room.id] : (room.currentElec !== null && room.currentElec !== undefined ? room.currentElec.toString() : '')}
                                      onChange={(e) => handleMeterInput(room.id, 'elec', e.target.value)}
                                      style={isLocked ? { opacity: 0.65, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                                    />
                                  </td>
                                </>
                              )}
                              <td>
                                {isVacantRoom ? (
                                  <button
                                    disabled
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', minWidth: '75px', opacity: 0.6, cursor: 'not-allowed' }}
                                  >
                                    🔒 ห้องว่าง
                                  </button>
                                ) : isInvoicePaid ? (
                                  <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', minWidth: '75px', opacity: 0.8 }}
                                    onClick={() => alert('ไม่สามารถแก้ไขมิเตอร์รอบบิลนี้ได้ เนื่องจากห้องนี้มีการออกใบเสร็จรับเงิน/ชำระเงินเรียบร้อยแล้ว')}
                                  >
                                    🔒 ชำระแล้ว
                                  </button>
                                ) : (
                                  <button
                                    className={`${styles.btn} ${hasRecord ? styles.btnWarning : (isSaved ? styles.btnSuccess : styles.btnPrimary)}`}
                                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', minWidth: '75px' }}
                                    onClick={() => handleSingleMeterSubmit(room.id, room.prevWater, room.prevElec)}
                                  >
                                    {hasRecord ? '✏️ แก้ไข' : (isSaved ? '✔ บันทึกแล้ว' : 'บันทึก')}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View Cards */}
                <div className={styles.meterMobileList}>
                  {filteredRooms.map((room: any) => {
                    const isSaved = meterStatus.includes(`roomId-${room.id}-saved`);
                    const roomInvoice = invoices.find(
                      (inv: any) => inv.roomId === room.id && inv.billingPeriod === meterPeriod
                    );
                    const isInvoicePaid = roomInvoice && (roomInvoice.status === 'PAID' || roomInvoice.status === 'PARTIAL');
                    const isVacantRoom = room.status !== 'OCCUPIED' && !room.activeTenant;
                    const isLocked = isInvoicePaid || isVacantRoom;
                    const hasRecord = room.currentWater !== null && room.currentWater !== undefined;

                    return (
                      <div key={room.id} className={styles.meterCard} style={isVacantRoom ? { opacity: 0.7 } : undefined}>
                        <div className={styles.meterCardHeader}>
                          <div className={styles.meterCardTitle}>ห้อง {room.number}</div>
                          <div className={styles.meterCardSubtitle}>
                            {room.type === 'AC' ? 'แอร์' : 'พัดลม'} • {room.status === 'OCCUPIED' ? (room.activeTenant ? room.activeTenant.name : 'มีผู้เช่า') : 'ห้องว่าง'}
                          </div>
                        </div>

                        <div className={styles.meterGrid} style={meterEntryMode !== 'BOTH' ? { gridTemplateColumns: '1fr' } : undefined}>
                          {(meterEntryMode === 'BOTH' || meterEntryMode === 'WATER') && (
                            <div className={styles.meterCol}>
                              <div className={styles.meterLabel}>💧 น้ำประปา</div>
                              <div className={styles.meterPrev}>เดิม: {room.prevWater}</div>
                              <input
                                type="number"
                                step="any"
                                inputMode="decimal"
                                pattern="[0-9.]*"
                                disabled={isLocked}
                                className={`${styles.meterInput} ${meterErrors[room.id] === 'water' ? styles.meterInputError : ''}`}
                                placeholder={isVacantRoom ? "ห้องว่าง" : "เลขใหม่"}
                                value={waterReadings[room.id] !== undefined ? waterReadings[room.id] : (room.currentWater !== null && room.currentWater !== undefined ? room.currentWater.toString() : (room.prevWater !== undefined && room.prevWater !== null ? room.prevWater.toString() : ''))}
                                onChange={(e) => handleMeterInput(room.id, 'water', e.target.value)}
                                style={isLocked ? { opacity: 0.65, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                              />
                            </div>
                          )}

                          {(meterEntryMode === 'BOTH' || meterEntryMode === 'ELEC') && (
                            <div className={styles.meterCol}>
                              <div className={styles.meterLabel}>⚡ ไฟฟ้า</div>
                              <div className={styles.meterPrev}>เดิม: {room.prevElec}</div>
                              <input
                                type="number"
                                step="any"
                                inputMode="decimal"
                                pattern="[0-9.]*"
                                disabled={isLocked}
                                className={`${styles.meterInput} ${meterErrors[room.id] === 'elec' ? styles.meterInputError : ''}`}
                                placeholder={isVacantRoom ? "ห้องว่าง" : "เลขใหม่"}
                                value={elecReadings[room.id] !== undefined ? elecReadings[room.id] : (room.currentElec !== null && room.currentElec !== undefined ? room.currentElec.toString() : (room.prevElec !== undefined && room.prevElec !== null ? room.prevElec.toString() : ''))}
                                onChange={(e) => handleMeterInput(room.id, 'elec', e.target.value)}
                                style={isLocked ? { opacity: 0.65, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                              />
                            </div>
                          )}
                        </div>

                        {isVacantRoom ? (
                          <button
                            disabled
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
                          >
                            🔒 ห้องว่าง (ไม่มีผู้เช่า)
                          </button>
                        ) : isInvoicePaid ? (
                          <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}
                            onClick={() => alert('ไม่สามารถแก้ไขมิเตอร์รอบบิลนี้ได้ เนื่องจากห้องนี้มีการออกใบเสร็จรับเงิน/ชำระเงินเรียบร้อยแล้ว')}
                          >
                            🔒 ชำระเงินแล้ว (ห้ามแก้ไข)
                          </button>
                        ) : (
                          <button
                            className={`${styles.btn} ${hasRecord ? styles.btnWarning : (isSaved ? styles.btnSuccess : styles.btnPrimary)}`}
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
                            onClick={() => handleSingleMeterSubmit(room.id, room.prevWater, room.prevElec)}
                          >
                            {hasRecord ? '✏️ แก้ไข' : (isSaved ? '✔ บันทึกแล้ว' : 'บันทึกข้อมูล')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
