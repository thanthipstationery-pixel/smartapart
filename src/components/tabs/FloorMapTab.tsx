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
  const normalizedQuery = mapSearchQuery.trim().toLowerCase();
  const legendFilters = [
    { label: 'ห้องว่าง (Vacant)', shortLabel: 'ห้องว่าง', keyword: 'ว่าง', border: 'var(--status-vacant)', bg: 'var(--status-vacant-bg)' },
    { label: 'จองแล้ว (Booked)', shortLabel: 'จองแล้ว', keyword: 'จองแล้ว', border: 'var(--status-booked)', bg: 'var(--status-booked-bg)' },
    { label: 'มีผู้เช่า (Occupied)', shortLabel: 'มีผู้เช่า', keyword: 'มีผู้เช่า', border: 'var(--status-occupied)', bg: 'var(--status-occupied-bg)' },
    { label: 'ค้างชำระ (Overdue)', shortLabel: 'ค้างชำระ', keyword: 'ค้างชำระ', border: 'var(--status-unpaid)', bg: 'var(--status-unpaid-bg)' },
    { label: '📌 แจ้งย้ายออก', shortLabel: '📌 แจ้งย้ายออก', keyword: 'แจ้งย้ายออก', border: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    { label: 'ปิดปรับปรุง (Maint.)', shortLabel: 'ปิดปรับปรุง', keyword: 'ปิดปรับปรุง', border: 'var(--status-maintenance)', bg: 'var(--status-maintenance-bg)' },
  ];

  const checkRoomMatch = (room: any) => {
    if (!normalizedQuery) return true;
    const roomNum = (room.number || '').toLowerCase();
    const roomType = room.type === 'AC' ? 'แอร์' : 'พัดลม';
    const tenantName = room.activeTenant ? (room.activeTenant.name || '').toLowerCase() : '';
    const bookingName = room.activeBooking ? (room.activeBooking.customerName || '').toLowerCase() : '';
    const hasNotice = Boolean(room.activeTenant && (room.activeTenant.noticeDate || room.activeTenant.expectedCheckOutDate));
    const statusTokens: string[] = [];
    if (room.status === 'OCCUPIED') {
      statusTokens.push('มีผู้เช่า');
      if (hasNotice) statusTokens.push('แจ้งย้ายออก', 'แจ้งออก');
      if (room.hasUnpaidInvoice) statusTokens.push('ค้างชำระ');
    } else if (room.status === 'BOOKED') {
      statusTokens.push('จองแล้ว');
    } else if (room.status === 'MAINTENANCE') {
      statusTokens.push('ปิดปรับปรุง');
    } else {
      statusTokens.push('ว่าง', 'ห้องว่าง');
    }

    if (normalizedQuery === 'ว่าง' || normalizedQuery === 'ห้องว่าง') {
      return room.status === 'VACANT';
    }

    return (
      roomNum.includes(normalizedQuery) ||
      roomType.includes(normalizedQuery) ||
      tenantName.includes(normalizedQuery) ||
      bookingName.includes(normalizedQuery) ||
      statusTokens.some((t) => t.includes(normalizedQuery))
    );
  };

  const allBuildingRooms = activeBuilding
    ? (activeBuilding.floors || []).flatMap((f: any) => f.rooms || [])
    : [];
  const matchedRoomsCount = allBuildingRooms.filter(checkRoomMatch).length;

  return (
    <div className="fade-in">
      {/* Interactive Status Legend (Click to Quick-Filter) */}
      <div className={styles.legend}>
        {legendFilters.map((item) => {
          const isActive = normalizedQuery === item.keyword.toLowerCase();
          return (
            <div
              key={item.keyword}
              className={styles.legendItem}
              onClick={() => setMapSearchQuery(isActive ? '' : item.keyword)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMapSearchQuery(isActive ? '' : item.keyword);
                }
              }}
              title={isActive ? 'คลิกอีกครั้งเพื่อแสดงทุกห้อง' : `คลิกเพื่อกรองเฉพาะ "${item.shortLabel}"`}
              style={{
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? `1.5px solid ${item.border}` : '1px solid transparent',
                backgroundColor: isActive ? item.bg : 'transparent',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              <div
                className={styles.legendDot}
                style={{ borderColor: item.border, backgroundColor: item.bg }}
              />
              <span>{item.label}</span>
            </div>
          );
        })}
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
              {getShortBuildingName(b.name)} (เช่า {b.stats.occupied} / จอง {b.stats.booked || 0} / รวม {b.stats.total} ห้อง)
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

      {/* Room Search Query Field + Clear Filter Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔎 ค้นหาห้องพักในตึกนี้ (เช่น 101, แอร์, ว่าง, จองแล้ว, ชื่อผู้เช่า)..."
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              className={styles.formInput}
              style={{
                width: '100%',
                padding: mapSearchQuery ? '0.65rem 2.5rem 0.65rem 1rem' : '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
              }}
            />
            {mapSearchQuery && (
              <button
                type="button"
                onClick={() => setMapSearchQuery('')}
                aria-label="ล้างคำค้นหา"
                title="ล้างตัวกรอง"
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {mapSearchQuery && (
            <button
              type="button"
              onClick={() => setMapSearchQuery('')}
              className={`${styles.btn} ${styles.btnSecondary}`}
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: '1px solid var(--primary-color)',
                color: 'var(--primary-color)',
              }}
            >
              ✕ แสดงทุกห้อง ({allBuildingRooms.length})
            </button>
          )}
        </div>

        {/* Active Filter Notice Banner */}
        {normalizedQuery && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.6rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, var(--card-bg))',
              border: '1px solid color-mix(in srgb, var(--primary-color) 35%, var(--border-color))',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', color: 'var(--text-primary)' }}>
              <span>🔍 กำลังกรองเฉพาะ:</span>
              <strong style={{ color: 'var(--primary-color)', background: 'var(--card-bg)', padding: '0.12rem 0.55rem', borderRadius: '999px', border: '1px solid var(--border-color)' }}>
                &ldquo;{mapSearchQuery}&rdquo;
              </strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                (ตรงเงื่อนไข {matchedRoomsCount} จาก {allBuildingRooms.length} ห้องในตึกนี้)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMapSearchQuery('')}
              style={{
                border: 'none',
                background: 'var(--primary-color)',
                color: '#ffffff',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* Building Rooms Display */}
      {activeBuilding && (
        <div className={styles.sectionCard}>
          <div className={styles.floorContainer}>
            {/* Floor rows listed in ascending order */}
            {[...activeBuilding.floors].map((floor: any) => (
              <div key={floor.id} className={styles.floorRow}>
                <div className={styles.floorHeader}>ชั้นที่ {floor.number}</div>
                <div className={styles.roomsGrid}>
                  {floor.rooms.map((room: any) => {
                    const isMatch = checkRoomMatch(room);
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
                              <div style={{ color: 'var(--status-warning)', fontWeight: 600 }}>📌 กำหนดออก: {new Date(room.activeTenant.expectedCheckOutDate).toLocaleDateString('th-TH')}</div>
                            )}
                            <div style={{ marginTop: '2px' }}>
                              {room.hasUnpaidInvoice ? (
                                <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>⚠️ มีบิลค้างชำระ</span>
                              ) : (
                                <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✅ ปกติ (ไม่มีบิลค้าง)</span>
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
                            backgroundColor: 'var(--status-warning-bg)',
                            color: '#b45309',
                            padding: '0.12rem 0.3rem',
                            borderRadius: 'var(--radius-md)',
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
