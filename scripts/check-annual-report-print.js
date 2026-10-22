const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '..', 'screenshots', 'report_annual');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  console.log('Logging in as tester...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="text"]', 'tester');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  // Navigate to Report tab
  console.log('Navigating to Reports tab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('รายงาน (Reports)'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Switch to รายงานสรุปการเงินรายปี
  console.log('Switching to รายงานสรุปการเงินรายปี tab...');
  await page.evaluate(() => {
    const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('รายงานสรุปการเงินรายปี'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Click "พิมพ์รายงาน" button
  console.log('Clicking พิมพ์รายงาน button...');
  await page.evaluate(() => {
    const printBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('พิมพ์รายงาน'));
    if (printBtn) printBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Capture preview modal screen
  await page.screenshot({ path: path.join(OUT, '01-annual-modal-preview.png') });
  console.log('Saved 01-annual-modal-preview.png');

  // Find A4 sheets
  const sheetElements = await page.$$('[class*="AnnualReportModal"][class*="a4Sheet"]');
  console.log('Number of A4 sheets found in Annual modal:', sheetElements.length);

  if (sheetElements.length >= 1) {
    await sheetElements[0].screenshot({ path: path.join(OUT, '02-annual-sheet-1.png') });
    console.log('Saved 02-annual-sheet-1.png');
  }

  // Extract sheet details
  const reportSummary = await page.evaluate(() => {
    const sheet = document.querySelector('[class*="AnnualReportModal"][class*="a4Sheet"]');
    if (!sheet) return null;

    const title = sheet.querySelector('[class*="pageHeaderTitle"]')?.textContent || '';
    const monthRows = Array.from(sheet.querySelectorAll('[class*="monthRow"]')).map(r => r.textContent.trim());
    const monthTotals = Array.from(sheet.querySelectorAll('[class*="monthTotalRow"]')).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | '));
    const grandTotal = Array.from(sheet.querySelectorAll('[class*="grandTotalRow"] td')).map(td => td.textContent.trim()).join(' | ');
    const footer = sheet.querySelector('[class*="sheetFooter"]')?.textContent.trim() || '';

    return {
      title,
      monthCount: monthRows.length,
      sampleMonths: monthRows.slice(0, 4),
      sampleMonthTotals: monthTotals.slice(0, 3),
      grandTotal,
      footer
    };
  });
  console.log('Annual Report Details:\n', JSON.stringify(reportSummary, null, 2));

  // Test standalone popup printing HTML into PDF
  const popupHtml = await page.evaluate(() => {
    const sheet = document.querySelector('[class*="AnnualReportModal"][class*="a4Sheet"]');
    if (!sheet) return '';

    let moduleCss = '';
    Array.from(document.styleSheets).forEach((s) => {
      let rules;
      try { rules = s.cssRules; } catch { return; }
      Array.from(rules).forEach((rule) => {
        if (rule.type === CSSRule.STYLE_RULE && rule.cssText.includes('AnnualReportModal')) {
          moduleCss += rule.cssText + '\n';
        }
      });
    });

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: Arial, 'Sarabun', 'Segoe UI', Tahoma, sans-serif;
    }
    ${moduleCss}
    [class*="AnnualReportModal"][class*="a4Sheet"] {
      width: 210mm !important;
      height: 296mm !important;
      max-height: 296mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  </style>
</head>
<body>
  ${sheet.outerHTML}
</body>
</html>`;
  });

  const printPage = await browser.newPage();
  await printPage.setContent(popupHtml, { waitUntil: 'load' });
  await printPage.pdf({
    path: path.join(OUT, 'annual-report-print.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('Saved annual-report-print.pdf');

  // Verify PDF page count
  const pdfBytes = fs.readFileSync(path.join(OUT, 'annual-report-print.pdf'));
  const pdfText = pdfBytes.toString('latin1');
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  const pdfPageCount = pageMatches ? pageMatches.length : 0;
  console.log('Annual PDF Page count:', pdfPageCount);

  if (pdfPageCount === 1) {
    console.log('SUCCESS: Strictly 1 page generated! Perfect fit with zero overflow.');
  } else {
    console.log('WARNING: Expected 1 page, got', pdfPageCount);
  }

  await browser.close();
})();
