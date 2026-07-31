# Mobile Tenant Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the mobile view of Tenant Management (`TenantTab.tsx`) into modern Mobile Tenant Cards with explicit Thai text labels (`เงินประกัน:`, `วันเข้าพัก:`, `เบอร์โทร:`, `📞 โทรออก`) and responsive CSS while keeping the full 9-column desktop table for large screens.

**Architecture:** Add responsive `.tenantMobileList` and `.tenantCard` CSS classes in `dashboard.module.css`. Update `TenantTab.tsx` to conditionally show `.tenantMobileList` on mobile screens and `.tenantDesktopTable` on desktop screens. Ensure explicit Thai labels without ambiguous bare icons.

**Tech Stack:** React 19, Next.js 16 (App Router), CSS Modules (`dashboard.module.css`), Puppeteer for verification.

## Global Constraints

- Preserve all existing desktop 9-column table functionality.
- Explicit Thai text labels for all money/date/contact data (`เงินประกัน:`, `วันเข้าพัก:`, `เบอร์โทร:`, `เลขบัตรประชาชน:`).
- Direct phone call action button (`<a href="tel:phone">📞 โทรออก</a>`).
- Clean, compact segmented filter control for status tabs (`🟢 ผู้เช่าปัจจุบัน` / `📜 ประวัติย้ายออก`).

---

### Task 1: Add Mobile Tenant Card CSS in `dashboard.module.css`

**Files:**
- Modify: `d:\AI\SmartApart\src\app\dashboard.module.css`

- [ ] **Step 1: Add `.tenantDesktopTable` and `.tenantMobileList` CSS rules**

Add to `src/app/dashboard.module.css`:
```css
/* Tenant Management Responsive Layout */
.tenantDesktopTable {
  display: block;
}

.tenantMobileList {
  display: none;
}

@media (max-width: 768px) {
  .tenantDesktopTable {
    display: none;
  }

  .tenantMobileList {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .tenantCard {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tenantCardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.6rem;
  }

  .tenantCardRoomBadge {
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .tenantCardBody {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    font-size: 0.88rem;
  }

  .tenantCardRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tenantCardLabel {
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.82rem;
  }

  .tenantCardValue {
    color: var(--text-primary);
    font-weight: 600;
  }

  .tenantCardActions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border-color);
  }

  .tenantCardCallBtn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.5rem;
    border-radius: var(--radius-md);
    background-color: var(--primary-color);
    color: #ffffff !important;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    text-align: center;
  }
}
```

---

### Task 2: Implement Responsive Mobile Tenant Cards with Explicit Thai Labels in `TenantTab.tsx`

**Files:**
- Modify: `d:\AI\SmartApart\src\components\tabs\TenantTab.tsx`

- [ ] **Step 1: Wrap Desktop Table in `.tenantDesktopTable`**
- [ ] **Step 2: Add `.tenantMobileList` section with explicit Thai labels**

Render Mobile Tenant Cards when filtered list is mapped:
```tsx
{/* Mobile View Cards */}
<div className={styles.tenantMobileList}>
  {filtered.map((t) => (
    <div key={t.id} className={styles.tenantCard}>
      <div className={styles.tenantCardHeader}>
        <div className={styles.tenantCardRoomBadge}>
          🏠 ห้อง {t.room?.number || '-'}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
            {t.room?.floor?.building?.name || '-'}
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
                {t.phone}
              </a>
            ) : '-'}
          </span>
        </div>

        <div className={styles.tenantCardRow}>
          <span className={styles.tenantCardLabel}>เงินประกันสัญญา:</span>
          <span className={styles.tenantCardValue}>{(t.securityDeposit || 0).toLocaleString()} บาท</span>
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
            {t.idCard || '-'}
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
```

---

### Task 3: Verify Build & Capture Mobile View Screenshot in Chrome

**Files:**
- Run: `cmd /c "npm run build"`
- Run: `cmd /c "node scratch/test_chrome.js"`

- [ ] **Step 1: Test TypeScript build**
- [ ] **Step 2: Take Chrome mobile screenshot & verify explicit Thai labels**
