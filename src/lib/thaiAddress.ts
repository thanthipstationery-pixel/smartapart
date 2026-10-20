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

  // Protect known acronyms with placeholders before parsing address tokens
  // e.g. อบต. -> __OBT__, อบจ. -> __OBJ__, บจก. -> __BJK__, บมจ. -> __BMJ__, หจก. -> __HJK__, รพ.สต. -> __RPST__
  const protectedClean = clean
    .replace(/อบต\./g, '___OBT___')
    .replace(/อบจ\./g, '___OBJ___')
    .replace(/บจก\./g, '___BJK___')
    .replace(/บมจ\./g, '___BMJ___')
    .replace(/หจก\./g, '___HJK___')
    .replace(/รพ\.สต\./g, '___RPST___');

  const unprotect = (str?: string) =>
    (str || '')
      .replace(/___OBT___/g, 'อบต.')
      .replace(/___OBJ___/g, 'อบจ.')
      .replace(/___BJK___/g, 'บจก.')
      .replace(/___BMJ___/g, 'บมจ.')
      .replace(/___HJK___/g, 'หจก.')
      .replace(/___RPST___/g, 'รพ.สต.')
      .trim();

  // Moo: Only matches if followed by numbers (digits or Thai digits)
  const mooMatch = protectedClean.match(
    /(?:หมู่ที่|หมู่)\s*([0-9\u0E50-\u0E59]+)|(?:\s|^)ม\.\s*([0-9\u0E50-\u0E59]+)/
  );
  const mooValue = mooMatch ? mooMatch[1] || mooMatch[2] || '' : '';

  // Road: ถนน or ถ. preceded by whitespace or boundary
  const roadMatch = protectedClean.match(/(?:ถนน|(?:\s|^)ถ\.)\s*([^\s,]+)/);
  const roadValue = roadMatch ? roadMatch[1] : '';

  // Subdistrict: ตำบล, แขวง, or ต. (preceded by whitespace/boundary, not inside acronym)
  const subMatch = protectedClean.match(/(?:ตำบล|แขวง|(?:\s|^)ต\.)\s*([^\s,]+)/);
  const subValue = subMatch ? subMatch[1] : '';

  // District: อำเภอ, เขต, or อ. (preceded by whitespace/boundary, not inside acronym)
  const distMatch = protectedClean.match(/(?:อำเภอ|เขต|(?:\s|^)อ\.)\s*([^\s,]+)/);
  const distValue = distMatch ? distMatch[1] : '';

  // Province: จังหวัด or จ. (preceded by whitespace/boundary, not inside acronym)
  const provMatch = protectedClean.match(/(?:จังหวัด|(?:\s|^)จ\.)\s*([^\s,]+)/);
  const provValue = provMatch ? provMatch[1] : '';

  // Phone
  const phoneMatch = protectedClean.match(
    /(?:โทรศัพท์|โทร\.?|เบอร์)\s*([0-9\u0E50-\u0E59-]+)/
  );
  const phoneValue = phoneMatch ? phoneMatch[1] : '';

  // Splitting address tokens to get the leading placeName / houseNo
  const delimiterRegex =
    /(?:หมู่ที่\s*[0-9\u0E50-\u0E59]+|หมู่\s*[0-9\u0E50-\u0E59]+|(?:\s|^)ม\.\s*[0-9\u0E50-\u0E59]+|ถนน|(?:\s|^)ถ\.|ตำบล|แขวง|(?:\s|^)ต\.|อำเภอ|เขต|(?:\s|^)อ\.|จังหวัด|(?:\s|^)จ\.|โทรศัพท์|โทร\.?|เบอร์)/;

  let placeName = '';
  let houseNo = '';

  const firstPart = unprotect(protectedClean.split(delimiterRegex)[0]?.trim());

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

  // If there are no structured subfields found, placeName should simply be the entire raw string
  const hasSubfields = Boolean(
    houseNo ||
      mooValue ||
      roadValue ||
      subValue ||
      distValue ||
      provValue ||
      phoneValue
  );

  return {
    placeName: hasSubfields ? unprotect(placeName) : clean,
    houseNo: unprotect(houseNo),
    moo: unprotect(mooValue),
    road: unprotect(roadValue),
    subdistrict: unprotect(subValue),
    district: unprotect(distValue),
    province: unprotect(provValue),
    phone: phoneValue,
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
