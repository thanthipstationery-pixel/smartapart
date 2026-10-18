const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

async function testMobile() {
  console.log('📱 Testing Mobile Viewport...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Click "ผู้เช่า" on mobile bottom navigation
  console.log('Clicking "ผู้เช่า" in bottom nav...');
  await page.evaluate(() => {
    const bottomNavBtns = Array.from(document.querySelectorAll('button, a'));
    const tenantNav = bottomNavBtns.find(b => b.textContent && b.textContent.includes('ผู้เช่า'));
    if (tenantNav) tenantNav.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-mobile-tenant-tab-active.png') });
  console.log('   📸 Captured: 09-mobile-tenant-tab-active.png');

  // Click "📄 สัญญาเช่า" on the first mobile tenant card
  console.log('Clicking "📄 สัญญาเช่า" on mobile tenant card...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contractBtn = btns.find(b => b.textContent && b.textContent.includes('สัญญาเช่า'));
    if (contractBtn) contractBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-mobile-lease-agreement-modal-active.png') });
  console.log('   📸 Captured: 10-mobile-lease-agreement-modal-active.png');

  await browser.close();
  console.log('📱 Mobile test complete!');
}

testMobile().catch(console.error);
