'use client';

import React from 'react';
import { getShortBuildingName } from '@/lib/thaiDate';

interface SettingsTabProps {
  propName: string;
  setPropName: (val: string) => void;
  propPhone: string;
  setPropPhone: (val: string) => void;
  propEmail: string;
  setPropEmail: (val: string) => void;
  propAddress: string;
  setPropAddress: (val: string) => void;
  propLineId: string;
  setPropLineId: (val: string) => void;
  propGeminiApiKey: string;
  setPropGeminiApiKey: (val: string) => void;
  showGeminiKey: boolean;
  setShowGeminiKey: (val: boolean) => void;
  refreshPropertyData: () => void;
  refreshDashboardData: () => void;
  settingsBuildingId: string;
  setSettingsBuildingId: (val: string) => void;
  buildings: any[];
  selectedBuildingId: string;
  setSelectedBuildingId: (val: string) => void;
  roomsSearchQuery: string;
  setRoomsSearchQuery: (val: string) => void;
  showRoomsAdvancedFilters: boolean;
  setShowRoomsAdvancedFilters: (val: boolean) => void;
  roomsTypeFilter: string;
  setRoomsTypeFilter: (val: string) => void;
  roomsWaterFilter: string;
  setRoomsWaterFilter: (val: string) => void;
  roomsElecFilter: string;
  setRoomsElecFilter: (val: string) => void;
  roomsStatusFilter: string;
  setRoomsStatusFilter: (val: string) => void;
  activeBuilding: any;
  handleRoomClick: (roomId: string) => void;
  styles: any;
}

export default function SettingsTab({
  propName,
  setPropName,
  propPhone,
  setPropPhone,
  propEmail,
  setPropEmail,
  propAddress,
  setPropAddress,
  propLineId,
  setPropLineId,
  propGeminiApiKey,
  setPropGeminiApiKey,
  showGeminiKey,
  setShowGeminiKey,
  refreshPropertyData,
  refreshDashboardData,
  settingsBuildingId,
  setSettingsBuildingId,
  buildings,
  selectedBuildingId,
  setSelectedBuildingId,
  roomsSearchQuery,
  setRoomsSearchQuery,
  showRoomsAdvancedFilters,
  setShowRoomsAdvancedFilters,
  roomsTypeFilter,
  setRoomsTypeFilter,
  roomsWaterFilter,
  setRoomsWaterFilter,
  roomsElecFilter,
  setRoomsElecFilter,
  roomsStatusFilter,
  setRoomsStatusFilter,
  activeBuilding,
  handleRoomClick,
  styles,
}: SettingsTabProps) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Section 0: Global Property & AI API Key Settings */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>🏢 ตั้งค่าข้อมูลกิจการ & Google Gemini AI Key (Property & System Settings)</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await fetch('/api/property', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: propName,
                  phone: propPhone,
                  email: propEmail,
                  address: propAddress,
                  lineId: propLineId,
                  geminiApiKey: propGeminiApiKey,
                }),
              });
              if (res.ok) {
                alert('บันทึกตั้งค่ากิจการและ Gemini API Key สำเร็จ');
                refreshPropertyData();
              } else {
                const d = await res.json();
                alert(d.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
              }
            } catch (err) {
              console.error(err);
              alert('เชื่อมต่อระบบล้มเหลว');
            }
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ชื่อกิจการ / อพาร์ทเมนท์หลัก *</label>
              <input
                type="text"
                className={styles.formInput}
                value={propName}
                onChange={(e) => setPropName(e.target.value)}
                placeholder="เช่น พักดี อพาร์ทเมนท์"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>เบอร์โทรศัพท์ติดต่อหลัก</label>
              <input
                type="text"
                className={styles.formInput}
                value={propPhone}
                onChange={(e) => setPropPhone(e.target.value)}
                placeholder="เช่น 02-123-4567"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Line ID หลัก</label>
              <input
                type="text"
                className={styles.formInput}
                value={propLineId}
                onChange={(e) => setPropLineId(e.target.value)}
                placeholder="เช่น @pakdee"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>อีเมลติดต่อ</label>
              <input
                type="email"
                className={styles.formInput}
                value={propEmail}
                onChange={(e) => setPropEmail(e.target.value)}
                placeholder="contact@pakdee.com"
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.formLabel}>ที่อยู่อพาร์ทเมนท์หลัก (พิมพ์บนหัวบิลใบเสร็จ)</label>
              <input
                type="text"
                className={styles.formInput}
                value={propAddress}
                onChange={(e) => setPropAddress(e.target.value)}
                placeholder="กรอกบ้านเลขที่/ถนน/ตำบล/อำเภอ/จังหวัด"
              />
            </div>
          </div>

          {/* Premium AI Gemini API Key Setting Box */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-color)' }}>
                    Google Gemini API Key
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    สแกนบัตรประชาชนด้วย AI อัตโนมัติ (ใช้งานฟรี 1,500 ครั้ง/วัน)
                  </div>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--primary-color)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>ขอรับ API Key ฟรีจาก Google AI Studio</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </a>
            </div>

            {/* Premium Integrated Input Group with Zero Mobile Overflow */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={propGeminiApiKey}
                  onChange={(e) => setPropGeminiApiKey(e.target.value)}
                  placeholder="วาง API Key เช่น AIzaSy..."
                  style={{
                    flex: '1 1 0%',
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-color)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.65rem 0.9rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderLeft: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    height: '100%',
                  }}
                >
                  {showGeminiKey ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                      <span>ซ่อน</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span>แสดง</span>
                    </>
                  )}
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--primary-color)' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>เมื่อบันทึกแล้ว ระบบจะเปิดใช้งานการอ่านภาพบัตรประชาชนและใบขับขี่อัตโนมัติทันที</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>บันทึกตั้งค่ากิจการ & Gemini API Key</span>
          </button>
        </form>
      </div>

      {/* Section 1: Building & Utilities Rate Settings */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>ตั้งค่าอัตราสาธารณูปโภคและข้อมูลติดต่อประจำตึก (Building & Utility Settings)</h2>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>เลือกอาคารที่ต้องการตั้งค่า:</span>
          <select
            value={settingsBuildingId}
            onChange={(e) => setSettingsBuildingId(e.target.value)}
            className={styles.formInput}
            style={{ maxWidth: '300px', padding: '0.5rem' }}
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {getShortBuildingName(b.name)}
              </option>
            ))}
          </select>
        </div>

        {(() => {
          const b = buildings.find((x) => x.id === settingsBuildingId);
          if (!b) {
            return <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กรุณาเลือกตึกที่ต้องการตั้งค่าด้านบน</p>;
          }

          return (
            <div
              key={b.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                background: 'var(--card-bg)',
                maxWidth: '800px',
              }}
            >
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: 'var(--primary-color)' }}>
                ตั้งค่าอาคาร: {b.name}
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem('bName') as HTMLInputElement).value;
                  const wRate = (form.elements.namedItem('wRate') as HTMLInputElement).value;
                  const eRate = (form.elements.namedItem('eRate') as HTMLInputElement).value;
                  const minWater = (form.elements.namedItem('minWater') as HTMLInputElement).value;
                  const lFee = (form.elements.namedItem('lFee') as HTMLInputElement).value;
                  const phone = (form.elements.namedItem('bPhone') as HTMLInputElement).value;
                  const email = (form.elements.namedItem('bEmail') as HTMLInputElement).value;
                  const address = (form.elements.namedItem('bAddress') as HTMLTextAreaElement).value;
                  const lineId = (form.elements.namedItem('bLineId') as HTMLInputElement).value;
                  const promptPayId = (form.elements.namedItem('bPromptPayId') as HTMLInputElement).value;
                  const promptPayName = (form.elements.namedItem('bPromptPayName') as HTMLInputElement).value;
                  const promptPayQrUrl = (form.elements.namedItem('bPromptPayQrUrl') as HTMLInputElement).value;

                  try {
                    const res = await fetch('/api/buildings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: b.id,
                        name,
                        waterRate: parseFloat(wRate),
                        electricityRate: parseFloat(eRate),
                        minimumWaterCost: parseFloat(minWater),
                        lateFee: parseFloat(lFee),
                        phone,
                        email,
                        address,
                        lineId,
                        promptPayId,
                        promptPayName,
                        promptPayQrUrl,
                      }),
                    });
                    if (res.ok) {
                      alert(`อัปเดตตั้งค่า ${name} สำเร็จ`);
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
                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ชื่ออาคาร *</label>
                  <input
                    type="text"
                    name="bName"
                    defaultValue={b.name}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ที่ตั้งอาคาร (แสดงบนหัวบิลใบแจ้งหนี้)</label>
                  <textarea
                    name="bAddress"
                    defaultValue={b.address || ''}
                    className={styles.formInput}
                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>เบอร์โทรติดต่อ</label>
                    <input
                      type="text"
                      name="bPhone"
                      defaultValue={b.phone || ''}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>Line ID</label>
                    <input
                      type="text"
                      name="bLineId"
                      defaultValue={b.lineId || ''}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>อีเมลติดต่อ</label>
                  <input
                    type="email"
                    name="bEmail"
                    defaultValue={b.email || ''}
                    className={styles.formInput}
                  />
                </div>

                <h4 style={{ margin: '1.25rem 0 0.75rem 0', paddingBottom: '0.25rem', borderBottom: '1px dashed var(--border-color)', fontSize: '0.95rem', fontWeight: 600 }}>
                  📲 ตั้งค่า PromptPay QR Code รับเงินประจำตึก
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>เลข PromptPay (เบอร์โทร/เลขบัตร)</label>
                    <input
                      type="text"
                      name="bPromptPayId"
                      inputMode="numeric"
                      pattern="[0-9-]*"
                      placeholder="เช่น 0962624963"
                      defaultValue={b.promptPayId || ''}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ชื่อบัญชี PromptPay</label>
                    <input
                      type="text"
                      name="bPromptPayName"
                      placeholder="เช่น ธารทิพย์ อพาร์ทเมนท์"
                      defaultValue={b.promptPayName || b.name || ''}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
                  <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>รูปภาพ PromptPay QR Code (อัปโหลดรูปประจำตึก)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      name="bPromptPayQrUrl"
                      id={`qrUrl-${b.id}`}
                      placeholder="https://... หรืออัปโหลดรูปฝั่งขวา"
                      defaultValue={b.promptPayQrUrl || ''}
                      className={styles.formInput}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <label
                      className={styles.btn}
                      style={{
                        margin: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📷 อัปโหลดรูป QR
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(evt) => {
                          const file = evt.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const targetInput = document.getElementById(`qrUrl-${b.id}`) as HTMLInputElement;
                              if (targetInput && e.target?.result) {
                                targetInput.value = e.target.result as string;
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <h4 style={{ margin: '1.25rem 0 0.75rem 0', paddingBottom: '0.25rem', borderBottom: '1px dashed var(--border-color)', fontSize: '0.95rem', fontWeight: 600 }}>ตั้งค่าอัตราสาธารณูปโภค</h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ค่าน้ำ (บาท/หน่วย) *</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      name="wRate"
                      defaultValue={b.waterRate}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ค่าไฟ (บาท/หน่วย) *</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      name="eRate"
                      defaultValue={b.electricityRate}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ค่าน้ำขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      name="minWater"
                      defaultValue={b.minimumWaterCost || 0}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>ค่าปรับชำระล่าช้า (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      name="lFee"
                      defaultValue={b.lateFee || 0}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  บันทึกการตั้งค่าอาคาร
                </button>
              </form>
            </div>
          );
        })()}
      </div>

      {/* Section 2: Room List & Settings */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>ข้อมูลห้องพักและราคาเช่ารายห้อง (Rooms List & Rates)</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          💡 คลิกห้องใดห้องหนึ่งในแผนผังตึกหรือเลือกดูที่ตารางด้านล่างนี้ เพื่อแก้ไขราคาค่าเช่า, ประเภทพัดลม/แอร์, การตั้งค่าน้ำ และการตั้งค่าไฟรายห้องได้โดยตรง
        </p>

        {/* Advanced Responsive Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Row 1: Building & Search */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>อาคาร</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className={styles.formInput}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.formLabel} style={{ fontSize: '0.85rem', fontWeight: 600 }}>เลขห้อง</label>
              <input
                type="text"
                placeholder="พิมพ์เลขห้องเพื่อค้นหา..."
                value={roomsSearchQuery}
                onChange={(e) => setRoomsSearchQuery(e.target.value)}
                className={styles.formInput}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Filter Control Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-start', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFilterPill} ${showRoomsAdvancedFilters ? styles.btnPrimary : styles.btnSecondary}`}
              onClick={() => setShowRoomsAdvancedFilters(!showRoomsAdvancedFilters)}
            >
              <span>{showRoomsAdvancedFilters ? '▲ ซ่อนการกรอง' : '▼ แสดงการกรองขั้นสูง'}</span>
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnFilterPill} ${styles.btnSecondary}`}
              onClick={() => {
                setRoomsSearchQuery('');
                setRoomsTypeFilter('ALL');
                setRoomsWaterFilter('ALL');
                setRoomsElecFilter('ALL');
                setRoomsStatusFilter('ALL');
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* Row 2: Advanced Dropdowns */}
          {showRoomsAdvancedFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ประเภทห้องพัก</label>
                <select
                  value={roomsTypeFilter}
                  onChange={(e) => setRoomsTypeFilter(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="AC">แอร์</option>
                  <option value="FAN">พัดลม</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>การคิดค่าน้ำ</label>
                <select
                  value={roomsWaterFilter}
                  onChange={(e) => setRoomsWaterFilter(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="METER">ตามระบบ</option>
                  <option value="FLAT">เหมาจ่าย</option>
                  <option value="CUSTOM">กำหนดเอง</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>การคิดค่าไฟ</label>
                <select
                  value={roomsElecFilter}
                  onChange={(e) => setRoomsElecFilter(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="METER">ตามระบบ</option>
                  <option value="FLAT">เหมาจ่าย</option>
                  <option value="CUSTOM">กำหนดเอง</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>สถานะห้องพัก</label>
                <select
                  value={roomsStatusFilter}
                  onChange={(e) => setRoomsStatusFilter(e.target.value)}
                  className={styles.formInput}
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="OCCUPIED">มีผู้เช่า</option>
                  <option value="BOOKED">จองแล้ว</option>
                  <option value="VACANT">ว่าง</option>
                  <option value="MAINTENANCE">ปิดปรับปรุง</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {activeBuilding && (() => {
          let filteredRooms = activeBuilding.floors.flatMap((f: any) =>
            f.rooms.map((r: any) => ({ ...r, floorNumber: f.number }))
          );

          // 1. Filter by Room Number Search
          if (roomsSearchQuery.trim()) {
            const query = roomsSearchQuery.toLowerCase();
            filteredRooms = filteredRooms.filter((room: any) =>
              room.number.toLowerCase().includes(query)
            );
          }

          // 2. Filter by Room Type
          if (roomsTypeFilter !== 'ALL') {
            filteredRooms = filteredRooms.filter((room: any) => room.type === roomsTypeFilter);
          }

          // 3. Filter by Water Billing Type
          if (roomsWaterFilter !== 'ALL') {
            filteredRooms = filteredRooms.filter((room: any) => room.waterBillingType === roomsWaterFilter);
          }

          // 4. Filter by Elec Billing Type
          if (roomsElecFilter !== 'ALL') {
            filteredRooms = filteredRooms.filter((room: any) => room.elecBillingType === roomsElecFilter);
          }

          // 5. Filter by Status
          if (roomsStatusFilter !== 'ALL') {
            filteredRooms = filteredRooms.filter((room: any) => room.status === roomsStatusFilter);
          }

          return (
            <>
              {/* ─── Desktop Table ─── */}
              <div className={styles.roomsDesktopTable} style={{ overflowX: 'auto' }}>
                <table className={styles.meterTable}>
                  <thead>
                    <tr>
                      <th>ห้อง</th>
                      <th>ประเภทห้อง</th>
                      <th>ราคาค่าเช่า (บาท)</th>
                      <th>การคิดค่าน้ำ</th>
                      <th>ราคา</th>
                      <th>การคิดค่าไฟ</th>
                      <th>ราคา</th>
                      <th>สถานะห้อง</th>
                      <th>แก้ไข</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                          🔍 ไม่พบห้องพักที่ตรงตามเงื่อนไขการค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((room: any) => (
                        <tr key={room.id}>
                          <td style={{ fontWeight: 'bold' }}>{room.number}</td>
                          <td>
                            <span className={`${styles.invoiceBadge} ${room.type === 'AC' ? styles.badgePaid : styles.badgeUnpaid}`} style={{ fontSize: '0.8rem' }}>
                              {room.type === 'AC' ? 'แอร์' : 'พัดลม'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{room.basePrice.toLocaleString()} บาท</td>
                          <td>
                            {room.waterBillingType === 'FLAT' ? 'เหมาจ่าย' : room.waterBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {room.waterBillingType === 'METER'
                              ? `${activeBuilding.waterRate} บาท/หน่วย`
                              : `${room.flatWaterCost || 0} บาท`}
                          </td>
                          <td>
                            {room.elecBillingType === 'FLAT' ? 'เหมาจ่าย' : room.elecBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {room.elecBillingType === 'METER'
                              ? `${activeBuilding.electricityRate} บาท/หน่วย`
                              : `${room.flatElecCost || 0} บาท`}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color:
                                  room.status === 'OCCUPIED'
                                    ? 'var(--status-occupied)'
                                    : room.status === 'VACANT'
                                    ? 'var(--status-vacant)'
                                    : 'var(--text-secondary)',
                              }}
                            >
                              {room.status === 'OCCUPIED' ? 'มีผู้เช่า' : room.status === 'VACANT' ? 'ว่าง' : 'ปิดปรับปรุง'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`${styles.btn} ${styles.btnSecondary}`}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => {
                                handleRoomClick(room.id);
                              }}
                            >
                              ตั้งค่าห้อง
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── Mobile Card List ─── */}
              <div className={styles.roomsMobileList}>
                {filteredRooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    🔍 ไม่พบห้องพักที่ตรงตามเงื่อนไขการค้นหา
                  </div>
                ) : (
                  filteredRooms.map((room: any) => {
                    const waterLabel =
                      room.waterBillingType === 'FLAT' ? 'เหมาจ่าย' :
                      room.waterBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ';
                    const waterValue =
                      room.waterBillingType === 'METER'
                        ? `${activeBuilding.waterRate} บาท/หน่วย`
                        : `${room.flatWaterCost || 0} บาท/เดือน`;

                    const elecLabel =
                      room.elecBillingType === 'FLAT' ? 'เหมาจ่าย' :
                      room.elecBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ';
                    const elecValue =
                      room.elecBillingType === 'METER'
                        ? `${activeBuilding.electricityRate} บาท/หน่วย`
                        : `${room.flatElecCost || 0} บาท/เดือน`;

                    const statusColor =
                      room.status === 'OCCUPIED' ? 'var(--status-occupied)' :
                      room.status === 'VACANT' ? 'var(--status-vacant)' :
                      room.status === 'BOOKED' ? 'var(--status-booked)' :
                      'var(--text-secondary)';

                    const statusLabel =
                      room.status === 'OCCUPIED' ? 'มีผู้เช่า' :
                      room.status === 'VACANT' ? 'ว่าง' :
                      room.status === 'BOOKED' ? 'จองแล้ว' : 'ปิดปรับปรุง';

                    return (
                      <div key={room.id} className={styles.roomRateCard}>
                        {/* Header */}
                        <div className={styles.roomRateCardHeader}>
                          <span className={styles.roomRateCardRoomNumber}>
                            🏠 ห้อง {room.number}
                          </span>
                          <div className={styles.roomRateCardBadges}>
                            <span className={`${styles.invoiceBadge} ${room.type === 'AC' ? styles.badgePaid : styles.badgeUnpaid}`}>
                              {room.type === 'AC' ? '❄️ แอร์' : '🌀 พัดลม'}
                            </span>
                            <span
                              className={styles.invoiceBadge}
                              style={{
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                border: `1px solid ${statusColor}40`
                              }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        {/* Rent Price */}
                        <div className={styles.roomRateCardPrice}>
                          <span className={styles.roomRateCardPriceLabel}>ค่าเช่ารายเดือน</span>
                          <span className={styles.roomRateCardPriceValue}>
                            {room.basePrice.toLocaleString()} บาท
                          </span>
                        </div>

                        {/* Utilities */}
                        <div className={styles.roomRateCardUtilities}>
                          <div className={styles.roomRateCardUtilityRow}>
                            <span className={styles.roomRateCardUtilityLabel}>💧 ค่าน้ำ ({waterLabel})</span>
                            <span className={styles.roomRateCardUtilityValue}>{waterValue}</span>
                          </div>
                          <div className={styles.roomRateCardUtilityRow}>
                            <span className={styles.roomRateCardUtilityLabel}>⚡ ค่าไฟ ({elecLabel})</span>
                            <span className={styles.roomRateCardUtilityValue}>{elecValue}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className={styles.roomRateCardAction}>
                          <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => handleRoomClick(room.id)}
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            ⚙️ ตั้งค่าห้อง
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
