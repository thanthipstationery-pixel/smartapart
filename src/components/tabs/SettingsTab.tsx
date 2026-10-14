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
  const [visualStyle, setVisualStyle] = React.useState('claymorphism');

  React.useEffect(() => {
    const current = document.documentElement.getAttribute('data-style') || 'claymorphism';
    setVisualStyle(current);
  }, []);

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value;
    setVisualStyle(newStyle);
    document.documentElement.setAttribute('data-style', newStyle);
    localStorage.setItem('visualStyle', newStyle);
  };

  // Database backup and restore state
  const [isExporting, setIsExporting] = React.useState(false);
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = React.useState(false);
  const [confirmChecked, setConfirmChecked] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) {
        let errText = 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์สำรองข้อมูล';
        try {
          const d = (await res.json()) as any;
          if (d && d.error) errText = d.error;
        } catch {
          // Response might not be JSON
        }
        alert(errText);
        return;
      }

      let filename = `smartapart_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '').trim();
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Backup download error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดาวน์โหลดไฟล์สำรอง');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.name.toLowerCase().endsWith('.sql')) {
        alert('กรุณาเลือกไฟล์สำรองข้อมูลที่มีนามสกุล .sql เท่านั้น');
        e.target.value = '';
        setRestoreFile(null);
        return;
      }
      setRestoreFile(file);
      setConfirmChecked(false);
    } else {
      setRestoreFile(null);
    }
  };

  const handleOpenRestoreModal = () => {
    if (!restoreFile) {
      alert('กรุณาเลือกไฟล์สำรองข้อมูล (.sql) ก่อนดำเนินการ');
      return;
    }
    setConfirmChecked(false);
    setIsRestoreModalOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!restoreFile) return;
    if (!confirmChecked) {
      alert('กรุณาติ๊กยอมรับเงื่อนไขการกู้คืนข้อมูลก่อนดำเนินการ');
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', restoreFile);

      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
      });

      const data = ((await res.json().catch(() => null))) as any;
      if (res.ok && data?.success) {
        alert('✅ ' + (data?.message || 'กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว'));
        setIsRestoreModalOpen(false);
        setRestoreFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        refreshDashboardData();
      } else {
        alert('❌ เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล: ' + (data?.error || res.statusText || 'เกิดข้อผิดพลาด'));
      }
    } catch (err: any) {
      console.error('Database restore error:', err);
      alert('❌ การเชื่อมต่อล้มเหลว: ' + (err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'));
    } finally {
      setIsRestoring(false);
    }
  };


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
                const d = await res.json() as any;
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

          {/* Global Theme Switcher Setting Box */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-color)',
              border: 'var(--glass-border, 1px solid var(--border-color))',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-inset)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎨 สไตล์แอปพลิเคชัน (App Visual Style)
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  เลือกรูปแบบดีไซน์การแสดงผลของแอปพลิเคชันที่ต้องการ
                </p>
              </div>
              <select
                value={visualStyle}
                onChange={handleStyleChange}
                className={styles.formSelect}
                style={{ width: 'auto', minWidth: '200px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
              >
                <option value="claymorphism">☁️ Claymorphism (นุ่มฟู 3 มิติ)</option>
                <option value="flat">🔲 Flat / Minimalist (แบนเรียบ)</option>
                <option value="glass">🧊 Glassmorphism (กระจกโปร่งแสง)</option>
              </select>
            </div>
          </div>

          {/* Premium AI Gemini API Key Setting Box */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-inset)',
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
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--status-info), #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: 'var(--shadow-sm)',
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
                  boxShadow: 'var(--shadow-inset)',
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
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
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
                  const useDynamicUtilityRate = (form.elements.namedItem('bUseDynamicUtilityRate') as HTMLInputElement).checked;

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
                        useDynamicUtilityRate,
                      }),
                    });
                    if (res.ok) {
                      alert(`อัปเดตตั้งค่า ${name} สำเร็จ`);
                      refreshDashboardData();
                    } else {
                      const d = await res.json() as any;
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
                        backgroundColor: 'var(--status-info-text)',
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

                <div className={styles.formGroup} style={{ marginBottom: '1.25rem', padding: '1.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-inset)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      name="bUseDynamicUtilityRate"
                      defaultChecked={b.useDynamicUtilityRate}
                      style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                    />
                    เปิดใช้งานระบบคำนวณค่าน้ำ-ไฟตามกฎหมาย สคบ. (Dynamic Rate)
                  </label>
                  <p style={{ margin: '0.5rem 0 0 2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    หากเปิดใช้งาน ระบบจะคำนวณบิลค่าน้ำ-ไฟแบบขั้นบันไดหรือตามเงื่อนไขที่กฎหมายกำหนด
                  </p>
                </div>

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
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-inset)',
            padding: '1.5rem',
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
                            <span
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-block',
                                ...(room.waterBillingType === 'FLAT'
                                  ? { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                                  : room.waterBillingType === 'CUSTOM'
                                  ? { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                                  : { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-text)' }),
                              }}
                            >
                              {room.waterBillingType === 'FLAT' ? 'เหมาจ่าย' : room.waterBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {room.waterBillingType === 'METER'
                              ? `${activeBuilding.waterRate} บาท/หน่วย`
                              : `${room.flatWaterCost || 0} บาท`}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-block',
                                ...(room.elecBillingType === 'FLAT'
                                  ? { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                                  : room.elecBillingType === 'CUSTOM'
                                  ? { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                                  : { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-text)' }),
                              }}
                            >
                              {room.elecBillingType === 'FLAT' ? 'เหมาจ่าย' : room.elecBillingType === 'CUSTOM' ? 'กำหนดเอง' : 'ตามระบบ'}
                            </span>
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
                            <span className={styles.roomRateCardUtilityLabel} style={{ display: 'flex', alignItems: 'center' }}>
                              💧 ค่าน้ำ
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  marginLeft: '0.4rem',
                                  ...(room.waterBillingType === 'FLAT'
                                    ? { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                                    : room.waterBillingType === 'CUSTOM'
                                    ? { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                                    : { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-text)' }),
                                }}
                              >
                                {waterLabel}
                              </span>
                            </span>
                            <span className={styles.roomRateCardUtilityValue}>{waterValue}</span>
                          </div>
                          <div className={styles.roomRateCardUtilityRow}>
                            <span className={styles.roomRateCardUtilityLabel} style={{ display: 'flex', alignItems: 'center' }}>
                              ⚡ ค่าไฟ
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  marginLeft: '0.4rem',
                                  ...(room.elecBillingType === 'FLAT'
                                    ? { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                                    : room.elecBillingType === 'CUSTOM'
                                    ? { backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                                    : { backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-text)' }),
                                }}
                              >
                                {elecLabel}
                              </span>
                            </span>
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

      {/* Section 3: Database & Backups */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            🗄️
          </div>
          <div>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              จัดการฐานข้อมูลและสำรองข้อมูล (Database & Backups)
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              สำรองข้อมูลฐานข้อมูลและกู้คืนข้อมูลแบบ 1-Click สำหรับจัดการข้อมูลทั้งหมดของระบบ (Property, อาคาร, ห้องพัก, ผู้เช่า, บิล, มิเตอร์ และการชำระเงิน)
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Card 1: Database Backup */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-inset)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📦</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  สำรองข้อมูลฐานข้อมูล (Database Backup)
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                สำรองข้อมูลทั้งหมดของระบบออกมาเป็นไฟล์ SQL (.sql) รวมทั้งข้อมูลกิจการ, อาคาร, ห้องพัก, ผู้เช่า, บันทึกมิเตอร์, ใบแจ้งหนี้ และประวัติการรับชำระเงินทั้งหมด เพื่อเก็บรักษาหรือย้ายเครื่อง
              </p>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--status-info-bg, rgba(59, 130, 246, 0.08))',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--status-info-text, #1e40af)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                <span>
                  คำแนะนำ: ควรสำรองข้อมูลเป็นประจำทุกสิ้นเดือน หรือก่อนเริ่มรอบบิลใหม่ เพื่อป้องกันการสูญหายของข้อมูล
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
              }}
            >
              {isExporting ? (
                <>
                  <svg
                    style={{ animation: 'spin 1s linear infinite' }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  <span>กำลังดาวน์โหลดไฟล์สำรอง...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>📥 ดาวน์โหลดไฟล์สำรอง (.sql)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Database Restore */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-inset)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  กู้คืนข้อมูลจากไฟล์สำรอง (Database Restore)
                </h3>
              </div>

              {/* แถบเตือนสีส้มแดง */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--status-danger-bg, #fef2f2)',
                  border: '1px solid var(--status-danger, #ef4444)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  color: 'var(--status-danger-text, #991b1b)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                    คำเตือน: การกู้คืนจะล้างข้อมูลเดิมและแทนที่ด้วยข้อมูลจากไฟล์สำรองทั้งหมด
                  </strong>
                  <span>กรุณาตรวจสอบไฟล์ให้ถูกต้องก่อนดำเนินการ ข้อมูลปัจจุบันที่ไม่ตรงกับไฟล์สำรองจะสูญหายถาวร</span>
                </div>
              </div>

              {/* File input group */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  className={styles.formLabel}
                  style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}
                >
                  เลือกไฟล์สำรอง (.sql) ที่ต้องการกู้คืน:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  className={styles.formInput}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--card-bg)',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                {restoreFile && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--card-bg)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm, 6px)',
                      border: '1px dashed var(--border-color)',
                    }}
                  >
                    <span>📄 {restoreFile.name} ({formatFileSize(restoreFile.size)})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger, #ef4444)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      ✕ นำออก
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenRestoreModal}
              disabled={!restoreFile}
              className={`${styles.btn} ${styles.btnDanger}`}
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: !restoreFile ? 'not-allowed' : 'pointer',
                opacity: !restoreFile ? 0.5 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>⚠️ กู้คืนข้อมูลทันที</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {isRestoreModalOpen && restoreFile && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div
            className={styles.modalCard}
            style={{
              maxWidth: '520px',
              border: '2px solid var(--status-danger, #ef4444)',
            }}
          >
            <div className={styles.modalHeader} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3
                className={styles.modalTitle}
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  color: 'var(--status-danger, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⚠️</span>
                <span>ยืนยันการกู้คืนฐานข้อมูล</span>
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => {
                  if (!isRestoring) setIsRestoreModalOpen(false);
                }}
                disabled={isRestoring}
                aria-label="ปิด"
                style={{ cursor: isRestoring ? 'not-allowed' : 'pointer', opacity: isRestoring ? 0.4 : 1 }}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody} style={{ padding: '1.5rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--status-danger-bg, #fef2f2)',
                  border: '1px solid var(--status-danger, #ef4444)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  color: 'var(--status-danger-text, #991b1b)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🛑</span>
                  <span>การดำเนินการนี้มีความเสี่ยงสูงมาก</span>
                </div>
                <div>
                  การกู้คืนจะล้างข้อมูลเดิมในระบบทั้งหมด (ข้อมูลกิจการ, อาคาร, ห้องพัก, ผู้เช่า, บันทึกมิเตอร์, ใบแจ้งหนี้, ประวัติชำระเงิน)
                  และเขียนทับด้วยข้อมูลจากไฟล์สำรอง <strong>ไม่สามารถย้อนกลับ (Undo) ได้</strong>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  boxShadow: 'var(--shadow-inset)',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  รายละเอียดไฟล์สำรองข้อมูล:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📄 ชื่อไฟล์:</span>
                  <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{restoreFile.name}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>📊 ขนาดไฟล์:</span>
                  <span style={{ fontWeight: 600 }}>{formatFileSize(restoreFile.size)}</span>

                  <span style={{ color: 'var(--text-secondary)' }}>🕒 วันที่แก้ไข:</span>
                  <span>{new Date(restoreFile.lastModified).toLocaleString('th-TH')}</span>
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: confirmChecked ? 'rgba(239, 68, 68, 0.08)' : 'var(--card-bg)',
                  border: `1px solid ${confirmChecked ? 'var(--status-danger, #ef4444)' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    disabled={isRestoring}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '1px',
                      cursor: isRestoring ? 'not-allowed' : 'pointer',
                      accentColor: 'var(--status-danger, #ef4444)',
                      flexShrink: 0,
                    }}
                  />
                  <span>ฉันเข้าใจและยืนยันว่าการกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด</span>
                </label>
              </div>

              {isRestoring && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--status-info-bg, #eff6ff)',
                    border: '1px solid var(--status-info, #3b82f6)',
                    color: 'var(--status-info-text, #1e40af)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg
                    style={{ animation: 'spin 1s linear infinite' }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  <span>กำลังกู้คืนข้อมูลฐานข้อมูล... กรุณารอสักครู่ ห้ามปิดหรือรีเฟรชหน้านี้</span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter} style={{ borderTop: '1px solid var(--border-color)', gap: '0.75rem' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={isRestoring}
                style={{ cursor: isRestoring ? 'not-allowed' : 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleConfirmRestore}
                disabled={!confirmChecked || isRestoring}
                style={{
                  cursor: !confirmChecked || isRestoring ? 'not-allowed' : 'pointer',
                  opacity: !confirmChecked || isRestoring ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isRestoring ? 'กำลังกู้คืน...' : 'ยืนยันการเขียนทับและกู้คืนข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

