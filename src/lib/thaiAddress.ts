export interface ParsedThaiAddress {
  placeName: string;
  houseNo: string;
  moo: string;
  road: string;
  subdistrict: string;
  district: string;
  province: string;
  phone: string;
  raw: string;
}

/**
 * Parses a Thai address or workplace string into structured components
 * matching the official apartment lease agreement fields.
 */
export function parseThaiAddress(addressStr?: string | null): ParsedThaiAddress {
  if (!addressStr || !addressStr.trim()) {
    return {
      placeName: '',
      houseNo: '',
      moo: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      phone: '',
      raw: '',
    };
  }

  const clean = addressStr.trim();
  const mooMatch = clean.match(/(?:หมู่ที่|หมู่|ม\.)\s*([^\s,]+)/);
  const roadMatch = clean.match(/(?:ถนน|ถ\.)\s*([^\s,]+)/);
  const subMatch = clean.match(/(?:ตำบล|แขวง|ต\.)\s*([^\s,]+)/);
  const distMatch = clean.match(/(?:อำเภอ|เขต|อ\.)\s*([^\s,]+)/);
  const provMatch = clean.match(/(?:จังหวัด|จ\.)\s*([^\s,]+)/);
  const phoneMatch = clean.match(/(?:โทรศัพท์|โทร\.?|เบอร์)\s*([0-9\u0E50-\u0E59-]+)/);

  let placeName = '';
  let houseNo = '';
  const firstPart = clean
    .split(
      /(?:หมู่ที่|หมู่|ม\.|ถนน|ถ\.|ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.|โทรศัพท์|โทร\.?|เบอร์)/
    )[0]
    ?.trim();

  if (firstPart) {
    const houseMatch = firstPart.match(
      /^(.*?)\s*(?:บ้านเลขที่|เลขที่)\s*([^\s,]+)$/
    );
    if (houseMatch) {
      placeName = houseMatch[1].trim();
      houseNo = houseMatch[2].trim();
    } else {
      const trailingNum = firstPart.match(
        /^(.*?)\s+([0-9\u0E50-\u0E59][0-9\u0E50-\u0E59/.-]*)$/
      );
      if (trailingNum && trailingNum[1].trim()) {
        placeName = trailingNum[1].trim();
        houseNo = trailingNum[2].trim();
      } else if (/^[0-9\u0E50-\u0E59]/.test(firstPart)) {
        houseNo = firstPart;
      } else {
        placeName = firstPart;
      }
    }
  }

  return {
    placeName:
      placeName ||
      (!houseNo &&
      !mooMatch &&
      !roadMatch &&
      !subMatch &&
      !distMatch &&
      !provMatch &&
      !phoneMatch
        ? clean
        : ''),
    houseNo,
    moo: mooMatch ? mooMatch[1] : '',
    road: roadMatch ? roadMatch[1] : '',
    subdistrict: subMatch ? subMatch[1] : '',
    district: distMatch ? distMatch[1] : '',
    province: provMatch ? provMatch[1] : '',
    phone: phoneMatch ? phoneMatch[1] : '',
    raw: clean,
  };
}

/**
 * Formats structured workplace / current address fields into a single
 * standardized string for storage in the existing `workplace` column.
 */
export function formatWorkplaceAddress(fields: Partial<ParsedThaiAddress>): string {
  const parts: string[] = [];
  const clean = (v?: string) => (v ? v.trim().replace(/\s+/g, ' ') : '');

  const placeName = clean(fields.placeName);
  const houseNo = clean(fields.houseNo);
  const road = clean(fields.road);
  const moo = clean(fields.moo);
  const subdistrict = clean(fields.subdistrict);
  const district = clean(fields.district);
  const province = clean(fields.province);
  const phone = clean(fields.phone);

  if (placeName) parts.push(placeName);
  if (houseNo) parts.push(`เลขที่ ${houseNo}`);
  if (road) parts.push(`ถ.${road}`);
  if (moo) parts.push(`ม.${moo}`);
  if (subdistrict) parts.push(`ต.${subdistrict}`);
  if (district) parts.push(`อ.${district}`);
  if (province) parts.push(`จ.${province}`);
  if (phone) parts.push(`โทร.${phone}`);

  return parts.join(' ');
}
