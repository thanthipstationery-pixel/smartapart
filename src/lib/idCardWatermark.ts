/**
 * Utility to compress an ID card image and permanently burn a diagonal security watermark
 * onto the image canvas before uploading to the server for PDPA compliance.
 */

export interface WatermarkOptions {
  /** Apartment name to embed in security text. Defaults to 'อพาร์ทเมนท์' */
  apartmentName?: string;
  /** Maximum image width in pixels. Defaults to 1200 */
  maxWidth?: number;
  /** JPEG quality compression ratio (0.0 to 1.0). Defaults to 0.82 */
  quality?: number;
  /** Watermark rotation in degrees (negative for counter-clockwise). Defaults to -30 */
  rotationDegrees?: number;
}

/**
 * Compresses an ID card image client-side and burns a diagonal legal security watermark
 * on the HTML canvas, returning a Base64 JPEG data URL.
 *
 * Watermark Text: "ใช้สำหรับทำสัญญาเช่าห้องพัก [ชื่ออพาร์ทเมนท์] เท่านั้น"
 *
 * @param file - File or Blob object representing the uploaded ID card photo.
 * @param apartmentNameOrOptions - Apartment name or WatermarkOptions configuration.
 * @returns Promise resolving to a Base64 data URL string (`data:image/jpeg;base64,...`)
 */
export async function compressAndWatermarkIdCard(
  file: File | Blob,
  apartmentNameOrOptions?: string | WatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('กรุณาระบุไฟล์รูปภาพ'));
    }

    // Ensure DOM / Canvas API availability
    if (
      typeof window === 'undefined' &&
      (typeof document === 'undefined' ||
        typeof FileReader === 'undefined' ||
        typeof Image === 'undefined')
    ) {
      return reject(new Error('ฟังก์ชันนี้ต้องทำงานบนสภาพแวดล้อมเบราว์เซอร์ที่มี Canvas API'));
    }

    let apartmentName = 'อพาร์ทเมนท์';
    let maxWidth = 1200;
    let quality = 0.82;
    let rotationDegrees = -30;

    if (typeof apartmentNameOrOptions === 'string') {
      if (apartmentNameOrOptions.trim()) {
        apartmentName = apartmentNameOrOptions.trim();
      }
    } else if (apartmentNameOrOptions && typeof apartmentNameOrOptions === 'object') {
      if (apartmentNameOrOptions.apartmentName?.trim()) {
        apartmentName = apartmentNameOrOptions.apartmentName.trim();
      }
      if (
        typeof apartmentNameOrOptions.maxWidth === 'number' &&
        apartmentNameOrOptions.maxWidth > 0
      ) {
        maxWidth = apartmentNameOrOptions.maxWidth;
      }
      if (
        typeof apartmentNameOrOptions.quality === 'number' &&
        apartmentNameOrOptions.quality > 0 &&
        apartmentNameOrOptions.quality <= 1
      ) {
        quality = apartmentNameOrOptions.quality;
      }
      if (typeof apartmentNameOrOptions.rotationDegrees === 'number') {
        rotationDegrees = apartmentNameOrOptions.rotationDegrees;
      }
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      try {
        const img = new Image();
        img.onerror = () => reject(new Error('รูปภาพไม่ถูกต้องหรือไม่สามารถเปิดได้'));
        img.onload = () => {
          try {
            // Target width: maxWidth (1200px max)
            let width = img.width;
            let height = img.height;

            if (width <= 0 || height <= 0) {
              return reject(new Error('ขนาดรูปภาพไม่ถูกต้อง'));
            }

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              return reject(new Error('ไม่สามารถสร้าง canvas context ได้'));
            }

            // Draw original resized image
            ctx.drawImage(img, 0, 0, width, height);

            // Security Watermark Drawing
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate((rotationDegrees * Math.PI) / 180);

            const watermarkText = `ใช้สำหรับทำสัญญาเช่าห้องพัก ${apartmentName} เท่านั้น`;
            const fontSize = Math.max(22, Math.round(width / 32));
            ctx.font = `bold ${fontSize}px 'Sarabun', 'TH Sarabun New', Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Measure text for dual security lines
            const textMetrics = ctx.measureText(watermarkText);
            const textWidth = textMetrics.width;
            const lineYOffset = fontSize * 0.9;
            const linePadding = 20;

            // Dual security lines above and below
            ctx.beginPath();
            ctx.moveTo(-textWidth / 2 - linePadding, -lineYOffset);
            ctx.lineTo(textWidth / 2 + linePadding, -lineYOffset);
            ctx.moveTo(-textWidth / 2 - linePadding, lineYOffset);
            ctx.lineTo(textWidth / 2 + linePadding, lineYOffset);
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)'; // Translucent red
            ctx.lineWidth = Math.max(2, Math.round(fontSize / 14));
            ctx.stroke();

            // Clear borders (white outline) & translucent red text fill
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; // White glow/border
            ctx.lineWidth = Math.max(3, Math.round(fontSize / 8));
            ctx.strokeText(watermarkText, 0, 0);

            ctx.fillStyle = 'rgba(220, 38, 38, 0.55)'; // Translucent red
            ctx.fillText(watermarkText, 0, 0);

            ctx.restore();

            // Export as JPEG with 0.82 quality (~100-200 KB)
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (err) {
            reject(
              err instanceof Error
                ? err
                : new Error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ')
            );
          }
        };

        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('ข้อมูลรูปภาพไม่ถูกต้อง'));
        }
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ')
        );
      }
    };

    reader.readAsDataURL(file);
  });
}
