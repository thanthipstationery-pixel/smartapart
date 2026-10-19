'use client';

import React, { useState, useEffect } from 'react';
import {
  parseThaiAddress,
  formatWorkplaceAddress,
  ParsedThaiAddress,
} from '@/lib/thaiAddress';
import { autoFormatPhoneInput } from '@/lib/thaiDate';

interface WorkplaceAddressFieldsProps {
  value: string;
  onChange?: (val: string) => void;
  idCardAddress?: string;
  styles: any;
  label?: string;
}

export default function WorkplaceAddressFields({
  value,
  onChange,
  idCardAddress = '',
  styles,
  label = 'ที่อยู่ปัจจุบัน / ที่ทำงาน / สถานศึกษา (สำหรับระบุในสัญญาเช่า)',
}: WorkplaceAddressFieldsProps) {
  const [fields, setFields] = useState<ParsedThaiAddress>(() =>
    parseThaiAddress(value)
  );
  const [lastSyncedValue, setLastSyncedValue] = useState<string>(value || '');

  useEffect(() => {
    const incoming = value || '';
    if (incoming !== lastSyncedValue) {
      setFields(parseThaiAddress(incoming));
      setLastSyncedValue(incoming);
    }
  }, [value, lastSyncedValue]);

  const updateField = (key: keyof ParsedThaiAddress, nextVal: string) => {
    const updated = { ...fields, [key]: nextVal };
    setFields(updated);
    const formatted = formatWorkplaceAddress(updated);
    setLastSyncedValue(formatted);
    if (onChange) {
      onChange(formatted);
    }
  };

  const handleCopyFromIdCard = () => {
    if (!idCardAddress || !idCardAddress.trim()) return;
    const parsedIdAddr = parseThaiAddress(idCardAddress);
    const updated: ParsedThaiAddress = {
      ...fields,
      houseNo: parsedIdAddr.houseNo || fields.houseNo,
      road: parsedIdAddr.road || fields.road,
      moo: parsedIdAddr.moo || fields.moo,
      subdistrict: parsedIdAddr.subdistrict || fields.subdistrict,
      district: parsedIdAddr.district || fields.district,
      province: parsedIdAddr.province || fields.province,
    };
    setFields(updated);
    const formatted = formatWorkplaceAddress(updated);
    setLastSyncedValue(formatted);
    if (onChange) {
      onChange(formatted);
    }
  };

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-sm, 8px)',
        padding: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.55rem',
        }}
      >
        <label
          className={styles.formLabel}
          style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '0.86rem' }}
        >
          🏢 {label}
        </label>
        {idCardAddress && idCardAddress.trim() !== '' && (
          <button
            type="button"
            onClick={handleCopyFromIdCard}
            style={{
              background: '#eff6ff',
              border: '1px solid #93c5fd',
              color: '#1d4ed8',
              borderRadius: '6px',
              padding: '0.22rem 0.6rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="คัดลอกเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด จากที่อยู่ตามบัตรประชาชน"
          >
            📋 ใช้ที่อยู่ตามบัตรประชาชน
          </button>
        )}
      </div>

      {/* Main Workplace / School / Occupation Name */}
      <div className={styles.formGroup} style={{ marginBottom: '0.6rem' }}>
        <input
          type="text"
          className={styles.formInput}
          value={fields.placeName}
          onChange={(e) => updateField('placeName', e.target.value)}
          placeholder="ชื่อสถานที่ทำงาน / สถานศึกษา / อาชีพ (เช่น โรงพยาบาลนางรอง, บจก. ซีพี ออลล์, ค้าขาย)"
        />
      </div>

      {/* Sub-fields matching the exact columns on Page 1 of the lease contract */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: '0.5rem',
        }}
      >
        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            เลขที่
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.houseNo}
            onChange={(e) => updateField('houseNo', e.target.value)}
            placeholder="เช่น 123/4"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            ถนน
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.road}
            onChange={(e) => updateField('road', e.target.value)}
            placeholder="เช่น โชคชัย-เดชอุดม"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            หมู่ที่
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.moo}
            onChange={(e) => updateField('moo', e.target.value)}
            placeholder="เช่น 2"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            ตำบล/แขวง
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.subdistrict}
            onChange={(e) => updateField('subdistrict', e.target.value)}
            placeholder="เช่น นางรอง"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            อำเภอ/เขต
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.district}
            onChange={(e) => updateField('district', e.target.value)}
            placeholder="เช่น นางรอง"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            จังหวัด
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={fields.province}
            onChange={(e) => updateField('province', e.target.value)}
            placeholder="เช่น บุรีรัมย์"
          />
        </div>

        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel} style={{ fontSize: '0.76rem', color: '#475569' }}>
            โทรศัพท์ (ที่ทำงาน)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9-]*"
            className={styles.formInput}
            value={fields.phone}
            onChange={(e) => updateField('phone', autoFormatPhoneInput(e.target.value))}
            placeholder="เช่น 044-631-xxx"
          />
        </div>
      </div>
    </div>
  );
}
