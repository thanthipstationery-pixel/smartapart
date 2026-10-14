'use client';

import React, { useState, useEffect } from 'react';
import { getShortBuildingName } from '@/lib/thaiDate';

interface GovBillTabProps {
  buildings: any[];
  styles: any;
}

export default function GovBillTab({ buildings, styles }: GovBillTabProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [period, setPeriod] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // default to last month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [waterBillTotal, setWaterBillTotal] = useState<string>('');
  const [waterUnitsTotal, setWaterUnitsTotal] = useState<string>('');
  const [elecBillTotal, setElecBillTotal] = useState<string>('');
  const [elecUnitsTotal, setElecUnitsTotal] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const maxMonth = new Date().toISOString().slice(0, 7);

  // Computed rates
  const waterRate = (parseFloat(waterBillTotal || '0') / (parseFloat(waterUnitsTotal || '1') || 1)).toFixed(2);
  const elecRate = (parseFloat(elecBillTotal || '0') / (parseFloat(elecUnitsTotal || '1') || 1)).toFixed(2);

  // Initialize selected building
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  // Fetch existing data
  useEffect(() => {
    if (!selectedBuildingId || !period) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/buildings/monthly-utility?buildingId=${selectedBuildingId}&period=${period}`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data && data.waterBillTotal !== undefined) {
            setWaterBillTotal(data.waterBillTotal.toString());
            setWaterUnitsTotal(data.waterUnitsTotal.toString());
            setElecBillTotal(data.elecBillTotal.toString());
            setElecUnitsTotal(data.elecUnitsTotal.toString());
          } else {
            setWaterBillTotal('');
            setWaterUnitsTotal('');
            setElecBillTotal('');
            setElecUnitsTotal('');
          }
        } else {
           setWaterBillTotal('');
           setWaterUnitsTotal('');
           setElecBillTotal('');
           setElecUnitsTotal('');
        }
      } catch (error) {
        console.error('Error fetching gov utility data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedBuildingId, period]);

  const handleSave = async () => {
    if (!selectedBuildingId || !period) return;
    setIsSaving(true);
    try {
      const payload = {
        buildingId: selectedBuildingId,
        period,
        waterBillTotal: parseFloat(waterBillTotal || '0'),
        waterUnitsTotal: parseFloat(waterUnitsTotal || '0'),
        elecBillTotal: parseFloat(elecBillTotal || '0'),
        elecUnitsTotal: parseFloat(elecUnitsTotal || '0')
      };

      const res = await fetch('/api/buildings/monthly-utility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('บันทึกข้อมูลบิลส่วนกลางเรียบร้อยแล้ว');
      } else {
        const err = await res.json() as any;
        alert('เกิดข้อผิดพลาด: ' + (err.error || 'ไม่สามารถบันทึกได้'));
      }
    } catch (error) {
      console.error('Error saving gov utility data:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className={styles.sectionCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 className={styles.sectionTitle} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🏛️</span> บันทึกบิลน้ำ-ไฟจากการไฟฟ้า/ประปา (ส่วนกลาง)
        </h3>

        <div className={styles.formGrid} style={{ marginBottom: "2rem" }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>เลือกอาคาร</label>
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>รอบบิล (เดือน)</label>
            <input
              type="month"
              value={period}
              max={maxMonth}
              onChange={(e) => setPeriod(e.target.value)}
              className={styles.formInput}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Water Section */}
            <div style={{ padding: '1.5rem', border: 'none', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', boxShadow: "var(--shadow-card)" }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💧</span> บิลการประปา
              </h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ยอดบิลรวม (บาท)</label>
                  <input
                    type="number"
                    value={waterBillTotal}
                    onChange={(e) => setWaterBillTotal(e.target.value)}
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>หน่วยที่ใช้รวม (หน่วย)</label>
                  <input
                    type="number"
                    value={waterUnitsTotal}
                    onChange={(e) => setWaterUnitsTotal(e.target.value)}
                    className={styles.formInput}
                    placeholder="0"
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-inset)', textAlign: 'center', fontWeight: 600 }}>
                ต้นทุนเฉลี่ย: <span style={{ color: 'var(--secondary-color)', fontSize: '1.2rem' }}>{waterRate}</span> บาท/หน่วย
              </div>
            </div>

            {/* Elec Section */}
            <div style={{ padding: '1.5rem', border: 'none', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', boxShadow: "var(--shadow-card)" }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚡</span> บิลการไฟฟ้า
              </h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ยอดบิลรวม (บาท)</label>
                  <input
                    type="number"
                    value={elecBillTotal}
                    onChange={(e) => setElecBillTotal(e.target.value)}
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>หน่วยที่ใช้รวม (หน่วย)</label>
                  <input
                    type="number"
                    value={elecUnitsTotal}
                    onChange={(e) => setElecUnitsTotal(e.target.value)}
                    className={styles.formInput}
                    placeholder="0"
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-inset)', textAlign: 'center', fontWeight: 600 }}>
                ต้นทุนเฉลี่ย: <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>{elecRate}</span> บาท/หน่วย
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSave}
                disabled={isSaving}
                style={{ minWidth: '150px' }}
              >
                {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
