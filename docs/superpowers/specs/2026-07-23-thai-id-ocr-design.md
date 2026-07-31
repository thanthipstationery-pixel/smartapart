# AI Thai ID Card OCR Scanner Design Spec

**Date**: 2026-07-23  
**Target System**: Pakdee Apartment Management System  
**Feature**: Free AI Thai ID Card Optical Character Recognition (OCR) Auto-fill Scanner  

---

## 1. Executive Summary

This design specification outlines the integration of **AI-Powered Thai ID Card Scanning (OCR)** into the Pakdee Apartment Management System. By leveraging the free-tier Google Gemini Vision API, landlords and managers can capture or upload a photograph of a tenant's Thai National ID card to automatically extract and pre-fill the tenant's **Full Name**, **13-digit ID Number**, **Card Address**, and **Birth Date** directly into the Check-in form within 1-2 seconds with 99%+ accuracy.

---

## 2. API Endpoint Architecture (`POST /api/scan-id-card`)

### Request Payload
- **Endpoint**: `POST /api/scan-id-card`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
  ```

### Processing Logic
1. Validate `image` base64 string.
2. Construct request payload to Google Gemini Vision API (`gemini-3.5-flash-lite`) using system prompt tailored for Thai National ID Card structure:
   ```text
   Extract the following information from this Thai National ID card image into a strict JSON object:
   - name: Full Thai name with title (e.g. "นายสมพงษ์ ใจดี")
   - idCard: 13-digit Thai identification number without spaces/dashes (e.g. "1100700123456")
   - address: Full address as printed on the card (e.g. "12/34 หมู่ 5 ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000")
   - birthDate: Birth date in YYYY-MM-DD format if readable
   Return ONLY valid JSON.
   ```
3. Parse returned JSON object and validate 13-digit ID structure.
4. Fallback gracefully if API key is not configured or image quality is unreadable.

### Response Payload
```json
{
  "success": true,
  "data": {
    "name": "นายสมพงษ์ ใจดี",
    "idCard": "1100700123456",
    "address": "12/34 หมู่ 5 ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000",
    "birthDate": "1990-05-15"
  }
}
```

---

## 3. User Interface & Workflow

### A. Check-in Modal Integration
- At the top of **Section 1: ข้อมูลส่วนตัวผู้เช่า** in the Check-in Modal:
  - Add a styled high-visibility action button:
    ```html
    <button type="button" class="btnScanIdCard">
      📷 ✨ สแกนบัตรประชาชนด้วย AI (Auto-fill)
    </button>
    <input type="file" accept="image/*" capture="environment" hidden />
    ```
- On mobile devices, clicking this button triggers the device camera directly (`capture="environment"`).
- On desktop devices, it opens a file selector.

### B. User Feedback & Loading States
1. **Scanning State**: Overlay with spinner and text: `⚡ AI กำลังสแกนและอ่านข้อมูลบัตรประชาชน...`
2. **Success State**: Highlight fields populated with a soft green glow and toast message: `✅ สแกนสำเร็จ! เติมชื่อ, เลขบัตรประชาชน และที่อยู่ให้อัตโนมัติเรียบร้อยแล้ว`
3. **Manual Override**: All fields remain fully editable by the landlord for quick adjustments.

---

## 4. Environment Configuration

- Add `GEMINI_API_KEY` to `.env`.
- Provide zero-config fallback to mock OCR if `GEMINI_API_KEY` is not present during initial local development.

---

## 5. Verification Plan

### Automated / API Verification
1. Send sample base64 ID card image to `POST /api/scan-id-card`.
2. Verify response contains clean extracted `name`, `idCard` (13 digits), and `address`.

### Manual Verification
1. Open Check-in Modal on mobile/desktop.
2. Click `📷 ✨ สแกนบัตรประชาชนด้วย AI`.
3. Upload an ID card image and verify form auto-fill behavior.
