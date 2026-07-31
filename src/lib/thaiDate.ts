// Strict Thai Date & Buddhist Era (พ.ศ.) Formatting Utility

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Formats a Date object or ISO string into "DD/MM/YYYY" (พ.ศ.) e.g. "08/08/2569"
 */
export function formatThaiDateNumeric(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yearBE = d.getFullYear() + 543;
  
  return `${day}/${month}/${yearBE}`;
}

/**
 * Formats a Date object or ISO string into "D MMMM YYYY" (พ.ศ.) e.g. "8 กรกฎาคม 2569"
 */
export function formatThaiDateLong(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const monthName = THAI_MONTHS[d.getMonth()];
  const yearBE = d.getFullYear() + 543;

  return `${day} ${monthName} ${yearBE}`;
}

/**
 * Formats a billing period "YYYY-MM" (e.g. "2026-07") into Thai month & BE year e.g. "กรกฎาคม 2569"
 */
export function formatThaiBillingPeriod(billingPeriodStr: string | null | undefined): string {
  if (!billingPeriodStr) return '-';
  const [yearStr, monthStr] = billingPeriodStr.split('-');
  const yearNum = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return billingPeriodStr;
  }

  const monthName = THAI_MONTHS[monthNum - 1];
  const yearBE = yearNum + 543;
  return `${monthName} ${yearBE}`;
}

/**
 * Formats a billing period "YYYY-MM" into month name only e.g. "กรกฎาคม"
 */
export function formatThaiMonthOnly(billingPeriodStr: string | null | undefined): string {
  if (!billingPeriodStr) return '-';
  const [, monthStr] = billingPeriodStr.split('-');
  const monthNum = parseInt(monthStr);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return billingPeriodStr;
  }

  return THAI_MONTHS[monthNum - 1];
}

/**
 * Strips common suffixes (อพาร์ทเม้นท์, อพาร์ทเม้น, ฯลฯ) for UI display e.g. "ธารทิพย์ อพาร์ทเม้นท์" -> "ธารทิพย์"
 */
export function getShortBuildingName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\s*(อพาร์ทเม้นท์|อพาร์ทเม้น|อพาร์ทเมนท์|อพาร์ทเมน|อพาร์ตเมนต์|เรสซิเดนซ์|คอนโด|แมนชั่น)\s*/gi, '').trim();
}

/**
 * Formats phone number into "xxx-xxx-xxxx" e.g. "089-112-2222"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Formats Thai ID card number into "x xxxx xxxxx xx x" e.g. "1 2345 67890 12 3"
 */
export function formatIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '-';
  const cleaned = idCard.replace(/[^0-9]/g, '');
  if (cleaned.length === 13) {
    return `${cleaned[0]} ${cleaned.slice(1, 5)} ${cleaned.slice(5, 10)} ${cleaned.slice(10, 12)} ${cleaned[12]}`;
  }
  return idCard;
}

/**
 * Auto-formats phone input while typing e.g. "0891122222" -> "089-112-2222"
 */
export function autoFormatPhoneInput(val: string): string {
  if (!val) return '';
  const digits = val.replace(/[^0-9]/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Auto-formats Thai ID Card input while typing e.g. "1234567890123" -> "1 2345 67890 12 3"
 */
export function autoFormatIdCardInput(val: string): string {
  if (!val) return '';
  const digits = val.replace(/[^0-9]/g, '').slice(0, 13);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits[0]} ${digits.slice(1)}`;
  if (digits.length <= 10) return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5, 10)} ${digits.slice(10)}`;
  return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 12)} ${digits[12]}`;
}

