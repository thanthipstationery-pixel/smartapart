// Pay-In-Advance & Pro-Rated Billing Rules (1.1, 1.2, 1.3)

export interface CheckInPaymentCalculation {
  ruleCode: 'RULE_1_1' | 'RULE_1_2' | 'RULE_1_3';
  ruleName: string;
  moveInDay: number;
  daysInMonth: number;
  remainingDays: number;
  dailyRate: number;
  currentMonthRent: number;
  nextMonthRent: number;
  securityDeposit: number;
  totalInitialPayment: number;
  billingPeriod: string; // YYYY-MM
  nextBillingPeriod: string; // YYYY-MM
  description: string;
  formulaDetails: string;
}

/**
 * Calculates check-in initial payment based on landlord rules 1.1, 1.2, 1.3
 */
export function calculateCheckInPayment(
  startDateInput: Date | string,
  roomPrice: number,
  customDeposit?: number
): CheckInPaymentCalculation {
  const startDate = new Date(startDateInput);
  const year = startDate.getFullYear();
  const month = startDate.getMonth(); // 0-indexed
  const moveInDay = startDate.getDate();

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = daysInMonth - moveInDay + 1;

  // Pro-rated daily rate
  const rawDailyRate = roomPrice / daysInMonth;
  const dailyRate = Math.round(rawDailyRate);
  const proRatedCurrentMonthRent = Math.round(dailyRate * remainingDays);

  const securityDeposit = customDeposit !== undefined && !isNaN(customDeposit) ? customDeposit : roomPrice;

  // Formats "YYYY-MM"
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // Next month "YYYY-MM"
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  if (moveInDay <= 5) {
    // Rule 1.1: Day 1 - 5 -> Full current month + Deposit
    return {
      ruleCode: 'RULE_1_1',
      ruleName: 'เข้าอยู่วันที่ 1 - 5',
      moveInDay,
      daysInMonth,
      remainingDays,
      dailyRate,
      currentMonthRent: roomPrice,
      nextMonthRent: 0,
      securityDeposit,
      totalInitialPayment: roomPrice + securityDeposit,
      billingPeriod: currentMonthStr,
      nextBillingPeriod: nextMonthStr,
      description: 'คิดค่าเช่าเต็มเดือนปัจจุบัน + ค่ามัดจำประกัน',
      formulaDetails: `ค่าเช่าเต็มเดือน ${roomPrice.toLocaleString()} บ. + ค่ามัดจำ ${securityDeposit.toLocaleString()} บ.`,
    };
  } else if (moveInDay <= 19) {
    // Rule 1.2: Day 6 - 19 -> Pro-rated current month + Deposit
    return {
      ruleCode: 'RULE_1_2',
      ruleName: 'เข้าอยู่วันที่ 6 - 19',
      moveInDay,
      daysInMonth,
      remainingDays,
      dailyRate,
      currentMonthRent: proRatedCurrentMonthRent,
      nextMonthRent: 0,
      securityDeposit,
      totalInitialPayment: proRatedCurrentMonthRent + securityDeposit,
      billingPeriod: currentMonthStr,
      nextBillingPeriod: nextMonthStr,
      description: 'คิดค่าเช่าเฉลี่ยรายวันตามวันที่เหลือในเดือน + ค่ามัดจำประกัน',
      formulaDetails: `${roomPrice.toLocaleString()} ÷ ${daysInMonth} วัน = ${dailyRate} บ./วัน × ${remainingDays} วันที่เหลือ = ${proRatedCurrentMonthRent.toLocaleString()} บ. + ค่ามัดจำ ${securityDeposit.toLocaleString()} บ.`,
    };
  } else {
    // Rule 1.3: Day 20 - End of Month -> Pro-rated current month + Deposit + Full Next Month Rent
    const totalPayment = proRatedCurrentMonthRent + securityDeposit + roomPrice;
    return {
      ruleCode: 'RULE_1_3',
      ruleName: 'เข้าอยู่วันที่ 20 เป็นต้นไป',
      moveInDay,
      daysInMonth,
      remainingDays,
      dailyRate,
      currentMonthRent: proRatedCurrentMonthRent,
      nextMonthRent: roomPrice,
      securityDeposit,
      totalInitialPayment: totalPayment,
      billingPeriod: nextMonthStr, // Issued for Next Month
      nextBillingPeriod: nextMonthStr,
      description: 'คิดค่าเช่าเฉลี่ยรายวันเดือนนี้ + ค่ามัดจำประกัน + ค่าเช่าเต็มเดือนถัดไป (รวบเป็นบิลเดือนถัดไป)',
      formulaDetails: `ค่าเช่าเฉลี่ยเดือนนี้ ${proRatedCurrentMonthRent.toLocaleString()} บ. + ค่ามัดจำ ${securityDeposit.toLocaleString()} บ. + ค่าเช่าเดือนถัดไป ${roomPrice.toLocaleString()} บ.`,
    };
  }
}

/**
 * Returns default billing period for monthly invoices under Pay-In-Advance model (e.g. issuing in July returns August "YYYY-MM")
 */
export function getPayInAdvanceBillingPeriod(baseDate: Date = new Date()): string {
  const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Validates check-out 1-month notice period (30 days) and returns deposit status
 */
export function validateCheckOutNotice(
  startDateInput: Date | string,
  checkOutDateInput: Date | string,
  noticeDateInput?: Date | string,
  overrideForfeit: boolean = false
): {
  noticeGivenDays: number;
  meetsNoticePeriod: boolean;
  shouldForfeitDeposit: boolean;
  warningMessage: string;
} {
  const checkOutDate = new Date(checkOutDateInput);
  const noticeDate = noticeDateInput ? new Date(noticeDateInput) : checkOutDate;

  // Calculate difference in days between checkOutDate and noticeDate
  const diffMs = checkOutDate.getTime() - noticeDate.getTime();
  const noticeGivenDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const meetsNoticePeriod = noticeGivenDays >= 30;
  const shouldForfeitDeposit = !meetsNoticePeriod && !overrideForfeit;

  let warningMessage = '';
  if (!meetsNoticePeriod) {
    if (overrideForfeit) {
      warningMessage = '⚠️ แจ้งย้ายออกน้อยกว่า 1 เดือน แต่ได้รับการผ่อนปรน/อนุญาตคืนเงินมัดจำประกัน';
    } else {
      warningMessage = '⚠️ แจ้งย้ายออกน้อยกว่า 1 เดือน (ตามกฎระบบจะไม่คืนค่าประกันห้องเช่า)';
    }
  } else {
    warningMessage = '✅ แจ้งย้ายออกล่วงหน้าครบ 1 เดือน (30 วันขึ้นไป)';
  }

  return {
    noticeGivenDays,
    meetsNoticePeriod,
    shouldForfeitDeposit,
    warningMessage,
  };
}
