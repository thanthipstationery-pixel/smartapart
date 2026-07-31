'use client';

import React from 'react';
import { getShortBuildingName, formatPhone } from '@/lib/thaiDate';

interface FloorMapTabProps {
  selectedBuildingId: string;
  setSelectedBuildingId: (val: string) => void;
  buildings: any[];
  mapSearchQuery: string;
  setMapSearchQuery: (val: string) => void;
  activeBuilding: any;
  handleRoomClick: (roomId: string) => void;
  styles: any;
}

export default function FloorMapTab({
  selectedBuildingId,
  setSelectedBuildingId,
  buildings,
  mapSearchQuery,
  setMapSearchQuery,
  activeBuilding,
  handleRoomClick,
  styles,
}: FloorMapTabProps) {
  return (
    <div className="fade-in">
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: 'var(--status-vacant)', backgroundColor: 'var(--status-vacant-bg)' }}></div>
          <span>ห้องว่าง (Vacant)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: 'var(--status-booked)', backgroundColor: 'var(--status-booked-bg)' }}></div>
          <span>จองแล้ว (Booked)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: 'var(--status-occupied)', backgroundColor: 'var(--status-occupied-bg)' }}></div>
          <span>มีผู้เช่า (Occupied)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: 'var(--status-unpaid)', backgroundColor: 'var(--status-unpaid-bg)' }}></div>
          <span>ค้างชำระ (Overdue)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: '#f59e0b', backgroundColor: '#fef3c7' }}></div>
          <span>📌 แจ้งย้ายออก (Notice Out)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ borderColor: 'var(--status-maintenance)', backgroundColor: 'var(--status-maintenance-bg)' }}></div>
          <span>ปิดปรับปรุง (Maintenance)</span>
        </div>
      </div>

      {/* Building Selection (Responsive: Dropdown for Mobile, Tabs for Desktop) */}
      <div className={styles.mobileBuildingSelector} style={{ marginBottom: '1rem' }}>
        <label className={styles.formLabel} style={{ fontWeight: 600, fontSize: '0.85rem' }}>เลือกอาคาร / ตึก:</label>
        <select
          value={selectedBuildingId}
          onChange={(e) => setSelectedBuildingId(e.target.value)}
          className={styles.formInput}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} (เช่า {b.stats.occupied} / จอง {b.stats.booked || 0} / รวม {b.stats.total} ห้อง)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.desktopBuildingSelector} style={{ marginBottom: '1rem' }}>
        <div className={styles.buildingTabs}>
          {buildings.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBuildingId(b.id)}
              className={`${styles.buildingTab} ${selectedBuildingId === b.id ? styles.buildingTabActive : ''}`}
            >
              {getShortBuildingName(b.name)} (เช่า {b.stats.occupied} / จอง {b.stats.booked || 0} / รวม {b.stats.total})
            </button>
          ))}
        </div>
      </div>

      {/* Room Search Query Field */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔎 ค้นหาห้องพักในตึกนี้ (เช่น 101, แอร์, จองแล้ว, ชื่อผู้เช่า/ผู้จอง)..."
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            className={styles.formInput}
            style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      </div>

      {/* Building Rooms Display */}
      {activeBuilding && (
        <div className={styles.sectionCard}>
          <div className={styles.floorContainer}>
            {/* Floor rows listed backwards so highest floor is at the top visually */}
            {[...activeBuilding.floors].reverse().map((floor: any) => (
              <div key={floor.id} className={styles.floorRow}>
                <div className={styles.floorHeader}>ชั้นที่ {floor.number}</div>
                <div className={styles.roomsGrid}>
                  {floor.rooms.map((room: any) => {
                    const isMatch = (() => {
                      if (!mapSearchQuery) return true;
                      const query = mapSearchQuery.toLowerCase().trim();
                      const roomNum = room.number.toLowerCase();
                      const roomType = room.type === 'AC' ? 'แอร์' : 'พัดลม';
                      const tenantName = room.activeTenant ? room.activeTenant.name.toLowerCase() : '';
                      const bookingName = room.activeBooking ? room.activeBooking.customerName.toLowerCase() : '';
                      const hasNotice = Boolean(room.activeTenant && (room.activeTenant.noticeDate || room.activeTenant.expectedCheckOutDate));
                      const status = room.status === 'OCCUPIED' ? (hasNotice ? 'แจ้งย้ายออก แจ้งออก' : 'มีผู้เช่า') : (room.status === 'BOOKED' ? 'จองแล้ว' : (room.status === 'MAINTENANCE' ? 'ปิดปรับปรุง' : 'ว่าง'));
                      
                      return roomNum.includes(query) || 
                             roomType.includes(query) || 
                             tenantName.includes(query) || 
                             bookingName.includes(query) || 
                             status.includes(query);
                    })();
                    let roomStyle = '';
                    let statusText = 'ว่าง';
                    if (room.status === 'OCCUPIED') {
                      if (room.hasUnpaidInvoice) {
                        roomStyle = styles.roomUnpaid;
                        statusText = 'ค้างชำระ';
                      } else {
                        roomStyle = styles.roomOccupied;
                        statusText = 'มีผู้เช่า';
                      }
                    } else if (room.status === 'BOOKED') {
                      statusText = room.activeBooking ? `จอง: ${room.activeBooking.customerName}` : 'จองแล้ว';
                    } else if (room.status === 'MAINTENANCE') {
                      roomStyle = styles.roomMaintenance;
                      statusText = 'ปิดปรับปรุง';
                    } else {
                      roomStyle = styles.roomVacant;
                      statusText = 'ว่าง';
                    }

                    const tooltipText = room.status === 'BOOKED' && room.activeBooking
                      ? `👤 ผู้จอง: ${room.activeBooking.customerName}\n📞 เบอร์โทร: ${room.activeBooking.customerPhone}\n💵 มัดจำ: ${room.activeBooking.depositAmount.toLocaleString()} บาท\n📅 นัดย้ายเข้า: ${new Date(room.activeBooking.expectedCheckInDate).toLocaleDateString('th-TH')}`
                      : room.status === 'OCCUPIED' && room.activeTenant
                      ? `👤 ผู้เช่า: ${room.activeTenant.name}\n📞 เบอร์โทร: ${room.activeTenant.phone || '-'}\n📅 วันที่เข้าพัก: ${room.activeTenant.startDate ? new Date(room.activeTenant.startDate).toLocaleDateString('th-TH') : '-'}${room.activeTenant.expectedCheckOutDate ? `\n📌 แจ้งย้ายออกวันที่: ${new Date(room.activeTenant.expectedCheckOutDate).toLocaleDateString('th-TH')}` : ''}\n💳 สถานะบิล: ${room.hasUnpaidInvoice ? '⚠️ มีบิลค้างชำระ' : '✅ ปกติ (ชำระแล้ว)'}`
                      : statusText;

                    return (
                      <div
                        key={room.id}
                        className={`${styles.roomBox} ${roomStyle} custom-tooltip-wrapper`}
                        style={{
                          opacity: isMatch ? 1 : 0.15,
                          pointerEvents: isMatch ? 'auto' : 'none',
                          transition: 'opacity 0.2s',
                          ...(room.status === 'BOOKED' ? { borderColor: 'var(--status-booked)', backgroundColor: 'var(--status-booked-bg)', color: 'var(--status-booked)' } : {})
                        }}
                        onClick={() => handleRoomClick(room.id)}
                        title={tooltipText}
                        tabIndex={0}
                      >
                        {room.status === 'BOOKED' && room.activeBooking && (
                          <div className="custom-tooltip-balloon">
                            <div>👤 <strong>{room.activeBooking.customerName}</strong></div>
                            <div>📞 เบอร์: {room.activeBooking.customerPhone}</div>
                            <div>💵 มัดจำ: {room.activeBooking.depositAmount.toLocaleString()} บาท</div>
                            <div>📅 นัดย้ายเข้า: {new Date(room.activeBooking.expectedCheckInDate).toLocaleDateString('th-TH')}</div>
                          </div>
                        )}
                        {room.status === 'OCCUPIED' && room.activeTenant && (
                          <div className="custom-tooltip-balloon">
                            <div>👤 <strong>{room.activeTenant.name}</strong></div>
                            <div>📞 เบอร์: {room.activeTenant.phone || '-'}</div>
                            {room.activeTenant.startDate && (
                              <div>📅 เข้าพัก: {new Date(room.activeTenant.startDate).toLocaleDateString('th-TH')}</div>
                            )}
                            {room.activeTenant.expectedCheckOutDate && (
                              <div style={{ color: '#fbbf24', fontWeight: 600 }}>📌 กำหนดออก: {new Date(room.activeTenant.expectedCheckOutDate).toLocaleDateString('th-TH')}</div>
                            )}
                            <div style={{ marginTop: '2px' }}>
                              {room.hasUnpaidInvoice ? (
                                <span style={{ color: '#f87171', fontWeight: 600 }}>⚠️ มีบิลค้างชำระ</span>
                              ) : (
                                <span style={{ color: '#4ade80', fontWeight: 600 }}>✅ ปกติ (ไม่มีบิลค้าง)</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className={styles.roomBoxHeader}>
                          <div className={styles.roomNumber}>{room.number}</div>
                          <span className={styles.roomType}>
                            {room.type === 'AC' ? 'แอร์' : 'พัดลม'}
                          </span>
                        </div>

                        {/* Middle section — fixed 1-line truncated name + phone */}
                        <div style={{ margin: '0.15rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
                          {room.status === 'OCCUPIED' && room.activeTenant && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                              {/* ชื่อ 1 บรรทัด ตัด ... อัตโนมัติ */}
                              <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                              }}>
                                {room.activeTenant.name}
                              </div>
                              {room.activeTenant.phone && (
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-secondary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                }}>
                                  📞 {formatPhone(room.activeTenant.phone)}
                                </div>
                              )}
                            </div>
                          )}
                          {room.status === 'BOOKED' && room.activeBooking && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: 'var(--status-booked)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                              }}>
                                👤 {room.activeBooking.customerName}
                              </div>
                              {room.activeBooking.customerPhone && (
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--status-booked)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                  opacity: 0.85,
                                }}>
                                  📞 {room.activeBooking.customerPhone}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom section for status badge */}
                        {room.status === 'OCCUPIED' && room.activeTenant && (room.activeTenant.expectedCheckOutDate || room.activeTenant.noticeDate) ? (
                          <div style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            padding: '0.12rem 0.3rem',
                            borderRadius: '4px',
                            border: '1px solid #fde047',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'center',
                            width: '100%'
                          }}>
                            📌 แจ้งออก {room.activeTenant.expectedCheckOutDate ? new Date(room.activeTenant.expectedCheckOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''}
                          </div>
                        ) : (
                          <div className={styles.roomStatusBadge} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }} title={statusText}>
                            {statusText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
