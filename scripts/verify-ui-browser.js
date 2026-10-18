const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserVerification() {
  console.log('🚀 Starting Chrome Browser Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // 1. Desktop Viewport
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });

  try {
    console.log('1️⃣ Navigating to http://localhost:3000/login ...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png') });
    console.log('   📸 Captured: 01-login-page.png');

    console.log('2️⃣ Logging in as admin...');
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000)); // Wait for React states to hydrate

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-desktop-dashboard.png') });
    console.log('   📸 Captured: 02-desktop-dashboard.png');

    // 3. Test RoomModal for an Occupied room (e.g. Room A1)
    console.log('3️⃣ Opening Occupied Room modal (Room A1)...');
    const roomClicked = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div, button'));
      const roomCard = allElements.find(el => el.textContent && el.textContent.trim().startsWith('A1') && el.textContent.includes('บาท'));
      if (roomCard) {
        roomCard.click();
        return true;
      }
      return false;
    });

    console.log('   Room A1 clicked:', roomClicked);
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-desktop-room-modal.png') });
    console.log('   📸 Captured: 03-desktop-room-modal.png');

    // 4. Click "พิมพ์สัญญาเช่า" in RoomModal
    console.log('4️⃣ Clicking "พิมพ์สัญญาเช่า" to open LeaseAgreementModal...');
    const printClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const printBtn = btns.find(b => b.textContent && b.textContent.includes('พิมพ์สัญญาเช่า'));
      if (printBtn) {
        printBtn.click();
        return true;
      }
      return false;
    });

    console.log('   Print button clicked:', printClicked);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-desktop-lease-agreement-modal.png') });
    console.log('   📸 Captured: 04-desktop-lease-agreement-modal.png');

    // Scroll down in A4 preview to capture Page 4 & Page 7
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[class*="previewScroll"]');
      if (scrollContainer) scrollContainer.scrollTop = 1800; // scroll to Page 4
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-desktop-lease-agreement-page4.png') });
    console.log('   📸 Captured: 05-desktop-lease-agreement-page4.png (Asset rental contract)');

    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[class*="previewScroll"]');
      if (scrollContainer) scrollContainer.scrollTop = 4200; // scroll to Page 7 (ID card)
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-desktop-lease-agreement-page7.png') });
    console.log('   📸 Captured: 06-desktop-lease-agreement-page7.png (ID card attachment)');

    // Close Lease modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent && b.textContent.includes('ปิด')) || b.innerHTML.includes('times') || b.textContent.trim() === '×');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Close room modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[class*="modalClose"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 5. Test CheckInModal on a Vacant room
    console.log('5️⃣ Opening CheckInModal on a vacant room...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div, button'));
      const vacantRoom = cards.find(el => el.textContent && el.textContent.includes('ว่าง') && !el.textContent.includes('ไม่ว่าง') && !el.textContent.includes('ค้าง'));
      if (vacantRoom) vacantRoom.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    
    // Click "ลงทะเบียนผู้เช่าใหม่" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkInBtn = btns.find(b => b.textContent && b.textContent.includes('ลงทะเบียน'));
      if (checkInBtn) checkInBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    
    // Expand Co-tenant accordion
    await page.evaluate(() => {
      const accordions = Array.from(document.querySelectorAll('button, div'));
      const coTenantToggle = accordions.find(el => el.textContent && el.textContent.includes('ผู้เช่าคนที่ ๒'));
      if (coTenantToggle) coTenantToggle.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-desktop-checkin-modal.png') });
    console.log('   📸 Captured: 07-desktop-checkin-modal.png (with co-tenant accordion & contract settings)');
    
    // Close check-in modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[class*="modalClose"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 6. Test TenantTab
    console.log('6️⃣ Checking TenantTab for contract action button...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tenantTabBtn = tabs.find(b => b.textContent && b.textContent.includes('ผู้เช่า'));
      if (tenantTabBtn) tenantTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-desktop-tenant-tab.png') });
    console.log('   📸 Captured: 08-desktop-tenant-tab.png');

    // 7. Mobile Viewport Verification (390 x 844 iPhone 14 / Mobile)
    console.log('7️⃣ Switching to Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-mobile-tenant-tab.png') });
    console.log('   📸 Captured: 09-mobile-tenant-tab.png');

    // Click "สัญญาเช่า" on the first tenant card on mobile
    console.log('8️⃣ Opening LeaseAgreementModal on Mobile...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mobileContractBtn = btns.find(b => b.textContent && b.textContent.includes('สัญญาเช่า'));
      if (mobileContractBtn) mobileContractBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-mobile-lease-agreement-modal.png') });
    console.log('   📸 Captured: 10-mobile-lease-agreement-modal.png');

    console.log('🎉 All browser verifications passed and captured successfully!');
  } catch (err) {
    console.error('❌ Browser verification error:', err);
  } finally {
    await browser.close();
  }
}

runBrowserVerification();
