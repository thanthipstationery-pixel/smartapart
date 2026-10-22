const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="text"]', 'tester');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'));
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('รายงาน (Reports)'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('รายงานสรุปการเงินรายปี'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const printBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('พิมพ์รายงาน'));
    if (printBtn) printBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const measurements = await page.evaluate(() => {
    const sheet = document.querySelector('[class*="AnnualReportModal"][class*="a4Sheet"]');
    if (!sheet) return null;
    const body = sheet.querySelector('[class*="sheetBody"]');
    const footer = sheet.querySelector('[class*="sheetFooter"]');
    const table = sheet.querySelector('table');
    return {
      sheetHeight: sheet.clientHeight,
      bodyHeight: body.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      tableHeight: table.offsetHeight,
      footerHeight: footer?.offsetHeight,
      availableRemaining: sheet.clientHeight - body.scrollHeight - (footer?.offsetHeight || 0)
    };
  });

  console.log('Annual Sheet measurements:', JSON.stringify(measurements, null, 2));

  await browser.close();
})();
