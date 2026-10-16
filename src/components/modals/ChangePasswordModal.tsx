'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/dashboard.module.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  username,
}: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setShowPasswords(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validation
    if (!currentPassword.trim()) {
      setErrorMessage('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    if (!newPassword) {
      setErrorMessage('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        setErrorMessage(data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        setLoading(false);
        return;
      }

      setSuccessMessage('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modalCard} style={{ maxWidth: '440px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔑</span>
            <div>
              <h2 className={styles.modalTitle} style={{ fontSize: '1.15rem', margin: 0 }}>
                เปลี่ยนรหัสผ่าน
              </h2>
              {username && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  สำหรับบัญชี @{username}
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="currentPassword">
                  รหัสผ่านปัจจุบัน <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                </label>
                <input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  className={styles.formInput}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  disabled={loading || !!successMessage}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="newPassword">
                  รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                </label>
                <input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  className={styles.formInput}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  disabled={loading || !!successMessage}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="confirmPassword">
                  ยืนยันรหัสผ่านใหม่ <span style={{ color: 'var(--status-unpaid)' }}>*</span>
                </label>
                <input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  className={styles.formInput}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  disabled={loading || !!successMessage}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="showPasswordsToggle"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label
                  htmlFor="showPasswordsToggle"
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
              {loading ? '⏳ กำลังบันทึก...' : '💾 บันทึกรหัสผ่านใหม่'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
