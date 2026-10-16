'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'reset-password';
  user?: any; // The user object being edited or reset
  currentUserId?: string;
  totalOwners?: number;
  onSuccess: () => void; // Callback to refresh user list
  styles: any;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  mode,
  user,
  currentUserId,
  totalOwners = 1,
  onSuccess,
  styles,
}: UserManagementModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OWNER' | 'STAFF' | 'VIEWER'>('STAFF');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reset password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSelf = Boolean(user && currentUserId && (user.id === currentUserId));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
      if (mode === 'create') {
        setName('');
        setUsername('');
        setPassword('');
        setRole('STAFF');
        setPhone('');
        setIsActive(true);
      } else if (mode === 'edit' && user) {
        setName(user.name || '');
        setUsername(user.username || '');
        setRole(user.role || 'STAFF');
        setPhone(user.phone || '');
        setIsActive(user.isActive !== false);
      } else if (mode === 'reset-password') {
        setNewPassword('');
        setConfirmNewPassword('');
      }
    }
  }, [isOpen, mode, user]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    if (loading) return;
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'create') {
      const cleanName = name.trim();
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanName) {
        setErrorMessage('กรุณาระบุชื่อ-นามสกุล');
        return;
      }
      if (!cleanUsername) {
        setErrorMessage('กรุณาระบุชื่อผู้ใช้สำหรับเข้าระบบ');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('รหัสผ่านเริ่มต้นต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            username: cleanUsername,
            password,
            role,
            phone: phone.trim() || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) {
          setErrorMessage(data?.error || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
          setLoading(false);
          return;
        }

        setSuccessMessage('เพิ่มผู้ใช้งานใหม่สำเร็จเรียบร้อยแล้ว');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'edit') {
      if (!user?.id) return;
      const cleanName = name.trim();
      if (!cleanName) {
        setErrorMessage('กรุณาระบุชื่อ-นามสกุล');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            role: isSelf ? undefined : role,
            phone: phone.trim() || null,
            isActive: isSelf ? undefined : isActive,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) {
          setErrorMessage(data?.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
          setLoading(false);
          return;
        }

        setSuccessMessage('อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'reset-password') {
      if (!user?.id) return;
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPassword,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) {
          setErrorMessage(data?.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
          setLoading(false);
          return;
        }

        setSuccessMessage('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    }
  };

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modalCard} style={{ maxWidth: mode === 'reset-password' ? '460px' : '540px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>
              {mode === 'create' ? '👤➕' : (mode === 'edit' ? '✏️' : '🔑')}
            </span>
            <div>
              <h2 className={styles.modalTitle} style={{ fontSize: '1.15rem', margin: 0 }}>
                {mode === 'create' && 'เพิ่มผู้ใช้งานใหม่ (Add User)'}
                {mode === 'edit' && `แก้ไขข้อมูลผู้ใช้งาน: ${user?.name || ''}`}
                {mode === 'reset-password' && `ตั้งรหัสผ่านใหม่สำหรับ: ${user?.name || ''}`}
              </h2>
              {mode === 'reset-password' && user?.username && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  บัญชีผู้ใช้ @{user.username}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            onClick={handleClose}
            disabled={loading}
            aria-label="ปิดหน้าต่าง"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMessage && (
              <div className={`${styles.modalAlert} ${styles.modalAlertError}`} role="alert">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className={`${styles.modalAlert} ${styles.modalAlertSuccess}`} role="alert">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* MODE: CREATE */}
              {mode === 'create' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      ชื่อ-นามสกุล (Display Name) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      disabled={loading || !!successMessage}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      ชื่อผู้ใช้สำหรับเข้าระบบ (Username) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="เช่น somchai (ภาษาอังกฤษตัวพิมพ์เล็กหรือตัวเลข)"
                      disabled={loading || !!successMessage}
                      autoCapitalize="none"
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      ชื่อผู้ใช้จะถูกแปลงเป็นตัวพิมพ์เล็กโดยอัตโนมัติ
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      รหัสผ่านเริ่มต้น (Initial Password) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      disabled={loading || !!successMessage}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      บทบาทและสิทธิ์ (Role) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <select
                      className={styles.formSelect}
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      disabled={loading || !!successMessage}
                    >
                      <option value="OWNER">👑 เจ้าของหอพัก (Owner) - จัดการได้ทุกส่วน รวมตั้งค่าระบบและผู้ใช้</option>
                      <option value="STAFF">👔 พนักงาน (Staff) - จดมิเตอร์ ออกบิล รับชำระ จัดการผู้เช่า</option>
                      <option value="VIEWER">👁️ ผู้ตรวจการ (Viewer) - ดูข้อมูลและพิมพ์เอกสารเท่านั้น (Read-Only)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 0812345678 (ระบุหรือไม่ก็ได้)"
                      disabled={loading || !!successMessage}
                    />
                  </div>
                </>
              )}

              {/* MODE: EDIT */}
              {mode === 'edit' && user && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ชื่อผู้ใช้เข้าระบบ (Username)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={`@${user.username}`}
                      disabled
                      style={{ opacity: 0.7, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      ชื่อ-นามสกุล (Display Name) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      disabled={loading || !!successMessage}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      บทบาทและสิทธิ์ (Role) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <select
                      className={styles.formSelect}
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      disabled={isSelf || loading || !!successMessage}
                      style={isSelf ? { opacity: 0.7, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                    >
                      <option value="OWNER">👑 เจ้าของหอพัก (Owner) - จัดการได้ทุกส่วน รวมตั้งค่าระบบและผู้ใช้</option>
                      <option value="STAFF">👔 พนักงาน (Staff) - จดมิเตอร์ ออกบิล รับชำระ จัดการผู้เช่า</option>
                      <option value="VIEWER">👁️ ผู้ตรวจการ (Viewer) - ดูข้อมูลและพิมพ์เอกสารเท่านั้น (Read-Only)</option>
                    </select>
                    {isSelf && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        🔒 ไม่สามารถเปลี่ยนระดับสิทธิ์ของตนเองได้
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 0812345678"
                      disabled={loading || !!successMessage}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>สถานะการใช้งาน (Status)</label>
                    <select
                      className={styles.formSelect}
                      value={isActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                      disabled={isSelf || loading || !!successMessage}
                      style={isSelf ? { opacity: 0.7, backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' } : undefined}
                    >
                      <option value="ACTIVE">🟢 ใช้งานอยู่ (Active)</option>
                      <option value="INACTIVE">⚪ ระงับการใช้งานชั่วคราว (Inactive)</option>
                    </select>
                    {isSelf && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        🔒 ไม่สามารถระงับการใช้งานบัญชีของตนเองได้
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* MODE: RESET PASSWORD */}
              {mode === 'reset-password' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่"
                      disabled={loading || !!successMessage}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      ยืนยันรหัสผ่านใหม่ <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      disabled={loading || !!successMessage}
                      minLength={6}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="checkbox"
                      id="userShowPasswordToggle"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label
                      htmlFor="userShowPasswordToggle"
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      แสดงรหัสผ่าน
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleClose}
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading || !!successMessage}
            >
              {loading ? (
                '⏳ กำลังดำเนินการ...'
              ) : (
                <>
                  {mode === 'create' && '➕ สร้างผู้ใช้งาน'}
                  {mode === 'edit' && '💾 บันทึกการแก้ไข'}
                  {mode === 'reset-password' && '🔑 ตั้งรหัสผ่านใหม่'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
