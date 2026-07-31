'use client';

import React from 'react';
import { formatThaiDateNumeric, getShortBuildingName, formatPhone, formatIdCard } from '@/lib/thaiDate';

interface TenantTabProps {
  tenantsList: any[];
  refreshTenants: () => void;
  tenantSearchQuery: string;
  setTenantSearchQuery: (val: string) => void;
  tenantBuildingFilter: string;
  setTenantBuildingFilter: (val: string) => void;
  buildings: any[];
  tenantStatusTab: 'ACTIVE' | 'MOVED_OUT';
  setTenantStatusTab: (val: 'ACTIVE' | 'MOVED_OUT') => void;
  tenantsLoading: boolean;
  handleOpenEditTenantModal: (tenant: any) => void;
  styles: any;
}

export default function TenantTab({
  tenantsList,
  refreshTenants,
  tenantSearchQuery,
  setTenantSearchQuery,
  tenantBuildingFilter,
  setTenantBuildingFilter,
  buildings,
  tenantStatusTab,
  setTenantStatusTab,
  tenantsLoading,
  handleOpenEditTenantModal,
  styles,
}: TenantTabProps) {
  return (
    <div className="fade-in">
      {/* Header Banner & Stats */}
      <div className={styles.sectionCard} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👥 การจัดการข้อมูลผู้เช่า ({tenantsList.filter((t) => t.status === 'ACTIVE').length} ผู้เช่าปัจจุบัน)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              ค้นหาข้อมูลผู้เช่า, เบอร์โทรศัพท์ติดต่อ, เลขบัตรประชาชน, และประวัติการย้ายออก
            </p>
          </div>
          <button
            type="button"
            onClick={refreshTenants}
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ fontSize: '0.85rem' }}
          >
            🔄 รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.sectionCard} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="🔎 ค้นหาผู้เช่า (ชื่อ, เบอร์โทร, เลขห้อง, เลขบัตรประชาชน)..."
              value={tenantSearchQuery}
              onChange={(e) => setTenantSearchQuery(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Building Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={tenantBuildingFilter}
              onChange={(e) => setTenantBuildingFilter(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">ทุกอาคาร / ตึก</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {getShortBuildingName(b.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Toggle Switch */}
          <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: 'var(--bg-color)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setTenantStatusTab('ACTIVE')}
              className={styles.btn}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: tenantStatusTab === 'ACTIVE' ? 'var(--primary-color)' : 'transparent',
                color: tenantStatusTab === 'ACTIVE' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: 'none',
              }}
            >
              🟢 ผู้เช่าปัจจุบัน ({tenantsList.filter((t) => t.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setTenantStatusTab('MOVED_OUT')}
              className={styles.btn}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: tenantStatusTab === 'MOVED_OUT' ? '#6b7280' : 'transparent',
                color: tenantStatusTab === 'MOVED_OUT' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: 'none',
              }}
            >
              📜 ประวัติย้ายออก ({tenantsList.filter((t) => t.status === 'MOVED_OUT').length})
            </button>
          </div>
        </div>
      </div>

      {/* Tenants Data Section */}
      <div className={styles.sectionCard}>
        {(() => {
          const filtered = tenantsList.filter((t) => {
            // Status filter
            if (t.status !== tenantStatusTab) return false;
            // Building filter
            if (tenantBuildingFilter !== 'ALL' && t.room?.floor?.building?.id !== tenantBuildingFilter) return false;
            // Search query
            if (tenantSearchQuery) {
              const q = tenantSearchQuery.toLowerCase().trim();
              const nameMatch = (t.name || '').toLowerCase().includes(q);
              const phoneMatch = (t.phone || '').toLowerCase().includes(q);
              const idCardMatch = (t.idCard || '').toLowerCase().includes(q);
              const roomMatch = (t.room?.number || '').toLowerCase().includes(q);
              return nameMatch || phoneMatch || idCardMatch || roomMatch;
            }
            return true;
          });

          if (tenantsLoading) {
            return (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                ⏳ กำลังโหลดข้อมูลผู้เช่า...
              </div>
            );
          }

          if (filtered.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                🔍 ไม่พบข้อมูลผู้เช่าตามเงื่อนไขที่เลือก
              </div>
            );
          }

          return (
            <>
              {/* Desktop View Table */}
              <div className={styles.tenantDesktopTable}>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.meterTable}>
                    <thead>
                      <tr>
                        <th>ห้องพัก</th>
                        <th>อาคาร / ตึก</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>เบอร์โทรศัพท์</th>
                        <th>เลขบัตรประชาชน</th>
                        {tenantStatusTab === 'ACTIVE' ? (
                          <>
                            <th>วันที่เข้าพัก</th>
                            <th>เงินมัดจำประกัน</th>
                            <th>สถานะ</th>
                            <th>จัดการ</th>
                          </>
                        ) : (
                          <>
                            <th>วันที่เข้าพัก</th>
                            <th>วันที่ย้ายออก</th>
                            <th>เงินมัดจำประกัน</th>
                            <th>หมายเหตุ</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            🏠 {t.room?.number || '-'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{getShortBuildingName(t.room?.floor?.building?.name) || '-'}</td>
                          <td style={{ fontWeight: 600 }}>{t.name}</td>
                          <td>
                            {t.phone ? (
                              <a href={`tel:${t.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                📞 {formatPhone(t.phone)}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                            {formatIdCard(t.idCard)}
                          </td>
                          {tenantStatusTab === 'ACTIVE' ? (
                            <>
                              <td style={{ fontSize: '0.85rem' }}>
                                {t.startDate ? formatThaiDateNumeric(t.startDate) : '-'}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {(t.securityDeposit || 0).toLocaleString()} บาท
                              </td>
                              <td>
                                <span className={`${styles.invoiceBadge} ${styles.badgePaid}`}>
                                  พักอาศัยอยู่
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                    onClick={() => handleOpenEditTenantModal(t)}
                                  >
                                    ✏️ แก้ไข
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ fontSize: '0.85rem' }}>
                                {t.startDate ? formatThaiDateNumeric(t.startDate) : '-'}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                                {t.updatedAt ? formatThaiDateNumeric(t.updatedAt) : '-'}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {(t.securityDeposit || 0).toLocaleString()} บาท
                              </td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {t.note || 'ย้ายออกเรียบร้อย'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View Tenant Cards (Explicit Thai Labels) */}
              <div className={styles.tenantMobileList}>
                {filtered.map((t) => (
                  <div key={t.id} className={styles.tenantCard}>
                    <div className={styles.tenantCardHeader}>
                      <div className={styles.tenantCardRoomBadge}>
                        🏠 ห้อง {t.room?.number || '-'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {getShortBuildingName(t.room?.floor?.building?.name) || '-'}
                        </span>
                        <span className={`${styles.invoiceBadge} ${t.status === 'ACTIVE' ? styles.badgePaid : styles.badgeUnpaid}`}>
                          {t.status === 'ACTIVE' ? 'พักอาศัยอยู่' : 'ย้ายออกแล้ว'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.tenantCardBody}>
                      <div className={styles.tenantCardRow}>
                        <span className={styles.tenantCardLabel}>ชื่อผู้เช่า:</span>
                        <span className={styles.tenantCardValue} style={{ fontSize: '0.95rem' }}>{t.name}</span>
                      </div>

                      <div className={styles.tenantCardRow}>
                        <span className={styles.tenantCardLabel}>เบอร์โทรศัพท์:</span>
                        <span className={styles.tenantCardValue}>
                          {t.phone ? (
                            <a href={`tel:${t.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                              {formatPhone(t.phone)}
                            </a>
                          ) : '-'}
                        </span>
                      </div>

                      <div className={styles.tenantCardRow}>
                        <span className={styles.tenantCardLabel}>เงินประกันสัญญา:</span>
                        <span className={styles.tenantCardValue} style={{ color: 'var(--primary-color)' }}>
                          {(t.securityDeposit || 0).toLocaleString()} บาท
                        </span>
                      </div>

                      <div className={styles.tenantCardRow}>
                        <span className={styles.tenantCardLabel}>
                          {tenantStatusTab === 'ACTIVE' ? 'วันเริ่มสัญญา / เข้าพัก:' : 'วันที่เริ่มสัญญา:'}
                        </span>
                        <span className={styles.tenantCardValue}>
                          {t.startDate ? formatThaiDateNumeric(t.startDate) : '-'}
                        </span>
                      </div>

                      {tenantStatusTab === 'MOVED_OUT' && (
                        <div className={styles.tenantCardRow}>
                          <span className={styles.tenantCardLabel}>วันที่ย้ายออก:</span>
                          <span className={styles.tenantCardValue} style={{ color: '#ef4444' }}>
                            {t.updatedAt ? formatThaiDateNumeric(t.updatedAt) : '-'}
                          </span>
                        </div>
                      )}

                      <div className={styles.tenantCardRow}>
                        <span className={styles.tenantCardLabel}>เลขบัตรประชาชน:</span>
                        <span className={styles.tenantCardValue} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {formatIdCard(t.idCard)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.tenantCardActions}>
                      {t.phone && (
                        <a href={`tel:${t.phone}`} className={styles.tenantCardCallBtn}>
                          📞 โทรออก
                        </a>
                      )}
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenEditTenantModal(t)}
                      >
                        ✏️ แก้ไขข้อมูล
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
