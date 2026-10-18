/**
 * Verification test script for Client-side Watermark Burn-in & Image Compression Utility
 * (src/lib/idCardWatermark.ts)
 */

const assert = require('assert');

async function runTests() {
  console.log('======================================================');
  console.log('Testing: src/lib/idCardWatermark.ts');
  console.log('======================================================');

  // Test 1: Module dynamic import and export verification
  console.log('\n[Test 1] Importing module and verifying exports...');
  const watermarkModule = await import('../src/lib/idCardWatermark.ts');
  assert(
    typeof watermarkModule.compressAndWatermarkIdCard === 'function',
    'compressAndWatermarkIdCard should be exported as a function'
  );
  console.log('  ✓ compressAndWatermarkIdCard function is exported correctly');

  // Test 2: Input validation - rejection on missing/falsy file
  console.log('\n[Test 2] Verifying error rejection on missing file...');
  try {
    await watermarkModule.compressAndWatermarkIdCard(null);
    assert.fail('Should have rejected when file is null');
  } catch (err) {
    assert(err instanceof Error);
    assert.match(err.message, /กรุณาระบุไฟล์รูปภาพ/);
    console.log('  ✓ Rejects properly with message:', err.message);
  }

  // Test 3: Environment check rejection when DOM is missing
  console.log('\n[Test 3] Verifying environment guard when DOM APIs are absent...');
  // Ensure global DOM is undefined for this test
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalFileReader = global.FileReader;
  const originalImage = global.Image;

  delete global.window;
  delete global.document;
  delete global.FileReader;
  delete global.Image;

  try {
    const dummyBlob = new Blob(['fake content'], { type: 'image/jpeg' });
    await watermarkModule.compressAndWatermarkIdCard(dummyBlob);
    assert.fail('Should have rejected in non-browser environment');
  } catch (err) {
    assert(err instanceof Error);
    assert.match(err.message, /สภาพแวดล้อมเบราว์เซอร์/);
    console.log('  ✓ Rejects non-browser environment properly:', err.message);
  }

  // Test 4: Simulated Canvas processing with image > 1200px (downscaling test)
  console.log('\n[Test 4] Verifying image scaling (>1200px downscaled to 1200px) & watermark burn-in...');
  let canvasDrawnWidth = 0;
  let canvasDrawnHeight = 0;
  let drawnTexts = [];
  let strokeTexts = [];
  let rotateAngle = 0;
  let dataUrlMimeType = '';
  let dataUrlQuality = 0;

  // Mock DOM environment
  global.window = {};
  global.FileReader = class MockFileReader {
    readAsDataURL(blob) {
      setTimeout(() => {
        this.result = 'data:image/jpeg;base64,mockimagedata';
        if (this.onload) this.onload();
      }, 5);
    }
  };

  global.Image = class MockImage {
    constructor() {
      this.width = 2400; // Original high-res image
      this.height = 1600;
    }
    set src(val) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 5);
    }
  };

  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        const canvas = {
          width: 0,
          height: 0,
          getContext(type) {
            if (type === '2d') {
              return {
                drawImage: (img, x, y, w, h) => {
                  canvasDrawnWidth = w;
                  canvasDrawnHeight = h;
                },
                save: () => {},
                restore: () => {},
                translate: (x, y) => {},
                rotate: (rad) => {
                  rotateAngle = rad;
                },
                measureText: (text) => ({ width: text.length * 15 }),
                beginPath: () => {},
                moveTo: (x, y) => {},
                lineTo: (x, y) => {},
                stroke: () => {},
                strokeText: (text, x, y) => {
                  strokeTexts.push(text);
                },
                fillText: (text, x, y) => {
                  drawnTexts.push(text);
                },
                font: '',
                textAlign: '',
                textBaseline: '',
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
              };
            }
            return null;
          },
          toDataURL(mime, quality) {
            dataUrlMimeType = mime;
            dataUrlQuality = quality;
            return `data:${mime};base64,watermarked_test_result`;
          },
        };
        return canvas;
      }
      return null;
    },
  };

  const mockFile = new Blob(['mock-data'], { type: 'image/jpeg' });
  const result1 = await watermarkModule.compressAndWatermarkIdCard(mockFile, 'ธารทิพย์อพาร์ทเมนท์');

  assert.strictEqual(canvasDrawnWidth, 1200, 'Width should be scaled down to 1200');
  assert.strictEqual(canvasDrawnHeight, 800, 'Height should be scaled proportionally (2400x1600 -> 1200x800)');
  assert.strictEqual(dataUrlMimeType, 'image/jpeg', 'MIME type must be image/jpeg');
  assert.strictEqual(dataUrlQuality, 0.82, 'Default quality should be 0.82');
  assert.strictEqual(
    drawnTexts[0],
    'ใช้สำหรับทำสัญญาเช่าห้องพัก ธารทิพย์อพาร์ทเมนท์ เท่านั้น',
    'Watermark text should match custom apartment name'
  );
  assert.strictEqual(
    strokeTexts[0],
    'ใช้สำหรับทำสัญญาเช่าห้องพัก ธารทิพย์อพาร์ทเมนท์ เท่านั้น',
    'Outline stroke text should match custom apartment name'
  );
  // -30 degrees in radians = -30 * PI / 180 = -PI / 6 ~= -0.523598
  assert(Math.abs(rotateAngle - (-Math.PI / 6)) < 0.001, 'Rotation should be -30 degrees (-PI/6 rad)');
  assert(result1.startsWith('data:image/jpeg;base64,'), 'Result should be base64 Data URL');

  console.log('  ✓ Scaled dimensions: 2400x1600 ->', `${canvasDrawnWidth}x${canvasDrawnHeight}`);
  console.log('  ✓ Watermark text applied:', drawnTexts[0]);
  console.log('  ✓ Watermark rotation angle (rad):', rotateAngle.toFixed(4));
  console.log('  ✓ Output JPEG format verified with quality:', dataUrlQuality);

  // Test 5: Default apartment name fallback when empty or omitted
  console.log('\n[Test 5] Verifying default apartment name fallback...');
  drawnTexts = [];
  strokeTexts = [];
  await watermarkModule.compressAndWatermarkIdCard(mockFile);
  assert.strictEqual(
    drawnTexts[0],
    'ใช้สำหรับทำสัญญาเช่าห้องพัก อพาร์ทเมนท์ เท่านั้น',
    'Watermark text should use default "อพาร์ทเมนท์"'
  );
  console.log('  ✓ Default watermark text applied:', drawnTexts[0]);

  // Test 6: Image width <= 1200px should preserve dimensions
  console.log('\n[Test 6] Verifying small image dimension preservation (<1200px)...');
  global.Image = class SmallMockImage {
    constructor() {
      this.width = 900;
      this.height = 600;
    }
    set src(val) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 5);
    }
  };

  canvasDrawnWidth = 0;
  canvasDrawnHeight = 0;
  await watermarkModule.compressAndWatermarkIdCard(mockFile, 'วิชุดาเพลส');
  assert.strictEqual(canvasDrawnWidth, 900, 'Original width 900 should be preserved');
  assert.strictEqual(canvasDrawnHeight, 600, 'Original height 600 should be preserved');
  console.log('  ✓ Preserved dimensions: 900x600');

  // Test 7: Error handling for corrupted image
  console.log('\n[Test 7] Verifying error handling when image is corrupt or fails to load...');
  global.Image = class FailingMockImage {
    set src(val) {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('Corrupted image'));
      }, 5);
    }
  };

  try {
    await watermarkModule.compressAndWatermarkIdCard(mockFile, 'ทดสอบ');
    assert.fail('Should have rejected corrupted image');
  } catch (err) {
    assert(err instanceof Error);
    assert.match(err.message, /รูปภาพไม่ถูกต้องหรือไม่สามารถเปิดได้/);
    console.log('  ✓ Rejection for corrupted image verified:', err.message);
  }

  // Test 8: Error handling for FileReader error
  console.log('\n[Test 8] Verifying error handling on file read error...');
  global.FileReader = class FailingMockFileReader {
    readAsDataURL(blob) {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('Read failed'));
      }, 5);
    }
  };

  try {
    await watermarkModule.compressAndWatermarkIdCard(mockFile, 'ทดสอบ');
    assert.fail('Should have rejected read error');
  } catch (err) {
    assert(err instanceof Error);
    assert.match(err.message, /ไม่สามารถอ่านไฟล์รูปภาพได้/);
    console.log('  ✓ Rejection for file read error verified:', err.message);
  }

  // Restore globals
  global.window = originalWindow;
  global.document = originalDocument;
  global.FileReader = originalFileReader;
  global.Image = originalImage;

  console.log('\n======================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (8/8 assertions valid)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
