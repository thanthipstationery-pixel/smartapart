# Specification: Room Booking System (ระบบจองห้องพัก)

## Overview
ระบบจองห้องพักสำหรับจัดการห้องพักที่ถูกจองไว้ก่อนล่วงหน้า ป้องกันการจองซ้ำ และรองรับการทำสัญญาเช่าจริง หรือการยกเลิกริบ/คืนเงินมัดจำ

## Key Features

### 1. สถานะห้องพัก (Room Status)
- เพิ่มสถานะห้องพักใหม่: `"BOOKED"` (แสดงป้ายกำกับในระบบว่า **"จองแล้ว"** ด้วยสีส้ม/เหลือง)
- สถานะห้องเดิม: `"VACANT"` (ห้องว่าง), `"OCCUPIED"` (มีผู้เช่า), `"MAINTENANCE"` (ปิดปรับปรุง)

### 2. รูปแบบฟอร์มการจอง 2 โหมด (Dual-Mode Booking Form)
- **⚡ โหมดจองด่วน (Express Booking)**:
  - เหมาะสำหรับรับสายโทรศัพท์ (เสร็จสิ้นใน 10 วินาที)
  - ฟิลด์ที่ต้องกรอก: ชื่อผู้จอง (`customerName`), เบอร์โทร (`customerPhone`), กำหนดวันย้ายเข้า (`expectedCheckInDate`), จำนวนเงินมัดจำ (`depositAmount` - ค่าเริ่มต้น 0)
- **📋 โหมดจองแบบเต็ม (Full Booking)**:
  - เหมาะสำหรับมีเอกสาร/สลิปครบถ้วน
  - ฟิลด์เพิ่มเติม: เลขบัตรประชาชน (`customerIdCard`), Line ID (`customerLineId`), อีเมล (`customerEmail`), ช่องทางการชำระเงิน (`paymentMethod`), แนบสลิปโอนเงิน (`slipImage`), หมายเหตุ (`note`)

### 3. ตารางฐานข้อมูล (Database Schema)
เพิ่ม model `Booking` ใน `prisma/schema.prisma`:
```prisma
model Booking {
  id                  String   @id @default(uuid())
  roomId              String
  room                Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  customerName        String
  customerPhone       String
  customerIdCard      String?
  customerEmail       String?
  customerLineId      String?
  bookingDate         DateTime @default(now())
  expectedCheckInDate DateTime
  depositAmount       Float    @default(0)
  paymentMethod       String?  // "CASH", "TRANSFER"
  slipImage           String?
  note                String?
  status              String   @default("ACTIVE") // "ACTIVE", "CHECKED_IN", "CANCELLED_REFUNDED", "CANCELLED_FORFEITED"
  createdAt           DateTime @default(now())
}
```
และเพิ่มฟิลด์ `bookings Booking[]` ใน `model Room`.

### 4. API Endpoints
- `POST /api/bookings`: สร้างรายการจองใหม่ และอัปเดต `Room.status` เป็น `"BOOKED"`
- `GET /api/bookings?roomId=xxx`: ดึงข้อมูลการจองของห้อง
- `POST /api/bookings/[id]/check-in`: แปลงรายการจองเป็นสัญญาเช่าจริง (`Tenant`) และเปลี่ยน `Room.status` เป็น `"OCCUPIED"`
- `POST /api/bookings/[id]/cancel`: ยกเลิกรายการจองด้วย action `"REFUND"` หรือ `"FORFEIT"` และคืน `Room.status` เป็น `"VACANT"`

### 5. การทำรายการบน UI (Room Card / Detail Modal)
- **ห้องว่าง (VACANT)**: เพิ่มปุ่ม **"จองห้องพัก"** เปิดฟอร์มจองแบบ 2 โหมด
- **ห้องจองแล้ว (BOOKED)**: แสดงรายละเอียดการจอง พร้อม 3 ปุ่มปฏิบัติการ:
  1. 📝 **"ทำสัญญาเข้าพัก (Check-in)"**: ดึงชื่อ, เบอร์โทร, และเงินมัดจำจองไปตั้งต้นในฟอร์มทำสัญญา
  2. ✏️ **"แก้ไขข้อมูลการจอง"**: อัปเดตข้อมูลหรือแนบสลิปย้อนหลัง
  3. ❌ **"ยกเลิกการจอง"**: เลือกระหว่างคืนมัดจำหรือริบมัดจำ แล้วคืนห้องเป็น `"VACANT"`
