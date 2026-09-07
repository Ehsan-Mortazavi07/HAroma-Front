import { toPersianDigits } from './index';

/**
 * Pure mathematical Jalali (Shamsi) <-> Gregorian (Miladi) Date Converter
 * Zero external dependencies. High performance & leap-year accuracy.
 */

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return [gy, gm, gd];
}

export const JALALI_MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const JALALI_MONTHS_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
];

export const GREGORIAN_MONTHS_FA = [
  'ژانویه',
  'فوریه',
  'مارس',
  'آوریل',
  'مه',
  'ژوئن',
  'ژوئیه',
  'اوت',
  'سپتامبر',
  'اکتبر',
  'نوامبر',
  'دسامبر',
];

export const GREGORIAN_MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Parses an ISO string "YYYY-MM-DD" or standard timestamp to [year, month, day]
 */
export function parseIsoDate(iso?: string | null): [number, number, number] | null {
  if (!iso) return null;
  const match = String(iso).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return [y, m, d];
}

/**
 * Formats [gy, gm, gd] as ISO "YYYY-MM-DD"
 */
export function formatIsoDate(gy: number, gm: number, gd: number): string {
  const mStr = gm < 10 ? `0${gm}` : `${gm}`;
  const dStr = gd < 10 ? `0${gd}` : `${gd}`;
  return `${gy}-${mStr}-${dStr}`;
}

/**
 * Converts Jalali date to ISO "YYYY-MM-DD"
 */
export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return formatIsoDate(gy, gm, gd);
}

/**
 * Converts ISO "YYYY-MM-DD" to Jalali [jy, jm, jd]
 */
export function isoToJalali(iso?: string | null): [number, number, number] | null {
  const parsed = parseIsoDate(iso);
  if (!parsed) return null;
  return gregorianToJalali(parsed[0], parsed[1], parsed[2]);
}

/**
 * Human-readable formatted string of a birthDate
 */
export function formatDisplayBirthDate(
  iso: string | undefined | null,
  mode: 'jalali' | 'gregorian',
  isPersian: boolean,
): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '';

  if (mode === 'jalali') {
    const [jy, jm, jd] = gregorianToJalali(parsed[0], parsed[1], parsed[2]);
    const monthName = isPersian ? JALALI_MONTHS_FA[jm - 1] : JALALI_MONTHS_EN[jm - 1];
    if (isPersian) {
      return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
    }
    return `${jd} ${monthName} ${jy}`;
  } else {
    const [gy, gm, gd] = parsed;
    const monthName = isPersian ? GREGORIAN_MONTHS_FA[gm - 1] : GREGORIAN_MONTHS_EN[gm - 1];
    if (isPersian) {
      return `${toPersianDigits(gd)} ${monthName} ${toPersianDigits(gy)}`;
    }
    return `${monthName} ${gd}, ${gy}`;
  }
}
