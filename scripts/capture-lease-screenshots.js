const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureLeaseScreenshots() {
  console.log('🚀 Starting Dedicated Lease Agreement Verification & Screenshot Capture...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Go to Tenant Tab
    console.log('2️⃣ Navigating to Tenant Tab...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tenantTab = tabs.find(b => b.textContent && b.textContent.includes('ผู้เช่า'));
      if (tenantTab) tenantTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-desktop-tenant-tab.png') });
    console.log('   📸 Captured: 01-desktop-tenant-tab.png');

    // 3. Click "📄 สัญญาเช่า" on the first tenant row
    console.log('3️⃣ Clicking "📄 สัญญาเช่า" on first tenant...');
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const leaseBtn = btns.find(b => b.textContent && b.textContent.includes('📄 สัญญา') && b.offsetParent !== null);
      if (leaseBtn) {
        leaseBtn.click();
        return true;
      }
      return false;
    });
    console.log('   Clicked lease button:', clicked);
    await new Promise(r => setTimeout(r, 2000));

    // 4. Capture Desktop Lease Agreement Modal (Page 1)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-lease-modal-page1.png') });
    console.log('   📸 Captured: 02-lease-modal-page1.png (Page 1: สัญญาเช่าห้องพัก ข้อมูลคู่สัญญา)');

    // 5. Scroll down to Page 2 (Clauses 1-13)
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="previewScroll"]');
      if (scrollEl) scrollEl.scrollTop = 1150;
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-lease-modal-page2.png') });
    console.log('   📸 Captured: 03-lease-modal-page2.png (Page 2: ข้อตกลง ๑๓ ข้อ)');

    // 5.1 Scroll down to Page 3 (Signatures with elevated line and centered name)
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="previewScroll"]');
      if (scrollEl) scrollEl.scrollTop = 2250;
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03b-lease-modal-page3-signatures.png') });
    console.log('   📸 Captured: 03b-lease-modal-page3-signatures.png (Page 3: ลายมือชื่อคู่สัญญา)');

    // 6. Scroll down to Page 4 (Asset agreement: clause 2.1 1,000 THB + clause 2.2 asset share)
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="previewScroll"]');
      if (scrollEl) scrollEl.scrollTop = 3400;
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-lease-modal-page4.png') });
    console.log('   📸 Captured: 04-lease-modal-page4.png (Page 4: สัญญาเช่าทรัพย์สิน ค่าห้อง ๑,๐๐๐ บ.)');

    // 7. Scroll down to Page 6 (Rules: 18 clauses)
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="previewScroll"]');
      if (scrollEl) scrollEl.scrollTop = 5300;
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-lease-modal-page6-rules.png') });
    console.log('   📸 Captured: 05-lease-modal-page6-rules.png (Page 6: กฎระเบียบ ๑๘ ข้อ)');

    // 8. Scroll down to Page 7 (ID card attachment)
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="previewScroll"]');
      if (scrollEl) scrollEl.scrollTop = 6400;
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-lease-modal-page7-idcard.png') });
    console.log('   📸 Captured: 06-lease-modal-page7-idcard.png (Page 7: สำเนาบัตรประชาชนผู้เช่า)');

    // 9. Switch to Mobile Viewport (iPhone 14 / 390x844)
    console.log('9️⃣ Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 1000));

    // Close any open desktop modal if present
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title*="ปิด"], [class*="modalClose"], button[aria-label="close"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click "ผู้เช่า" tab on mobile bottom navigation
    await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const tenantBtn = allButtons.find(b => b.textContent && b.textContent.includes('ผู้เช่า'));
      if (tenantBtn) tenantBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-mobile-tenant-list-cards.png') });
    console.log('   📸 Captured: 08-mobile-tenant-list-cards.png (Mobile tenant cards with contract buttons)');

    // Open Lease Agreement Modal from Mobile Tenant Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const leaseBtn = btns.find(b => b.textContent && b.textContent.includes('สัญญาเช่า'));
      if (leaseBtn) leaseBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-mobile-lease-agreement-modal.png') });
    console.log('   📸 Captured: 07-mobile-lease-agreement-modal.png (Mobile responsiveness)');

    console.log('✅ ALL SCREENSHOTS SUCCESSFULLY CAPTURED!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureLeaseScreenshots();
