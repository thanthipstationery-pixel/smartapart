const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '..', 'screenshots', 'pages');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1700, deviceScaleFactor: 1.5 });
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('ผู้เช่า'));
      if (t) t.click();
    });
    await sleep(1500);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent && x.textContent.includes('สัญญาเช่า'));
      if (b) b.click();
    });
    await sleep(2000);
    // zoom 100%
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent && x.textContent.trim() === '100%');
      if (b) b.click();
    });
    await sleep(800);
    const sheets = await page.$$('[class*="a4Sheet"]');
    console.log('sheets:', sheets.length);
    let i = 1;
    for (const s of sheets) {
      await s.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await sleep(400);
      await s.screenshot({ path: path.join(OUT, `page-${i}.png`) });
      console.log('captured page', i);
      i++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
