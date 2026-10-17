import { toPersianDigits } from '@/common/utils';
import { gregorianToJalali, jalaliToGregorian, JALALI_MONTHS_FA, JALALI_MONTHS_EN } from '@/common/utils/date';
import type { Granularity, ReportRangeParams } from '@/common/api/reports';

/** Iran has used a fixed UTC+03:30 offset since 2022. */
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export const digits = (value: number | string, isPersian: boolean) =>
  isPersian ? toPersianDigits(value) : String(value);

export function formatNumber(value: number | null | undefined, isPersian: boolean, fractionDigits = 0): string {
  const number = Number(value) || 0;
  const text = number.toLocaleString('en-US', { maximumFractionDigits: fractionDigits });
  return isPersian ? toPersianDigits(text) : text;
}

export function formatMoney(value: number | null | undefined, isPersian: boolean): string {
  return `${formatNumber(value, isPersian)} ${isPersian ? 'تومان' : 'T'}`;
}

/** Short money for axes and tiles: 12.5M, ۱۲٫۵ میلیون. */
export function formatCompact(value: number | null | undefined, isPersian: boolean): string {
  const number = Number(value) || 0;
  const abs = Math.abs(number);
  const units: [number, string, string][] = [
    [1e9, 'میلیارد', 'B'],
    [1e6, 'میلیون', 'M'],
    [1e3, 'هزار', 'K'],
  ];
  for (const [size, fa, en] of units) {
    if (abs >= size) {
      const scaled = (number / size).toLocaleString('en-US', { maximumFractionDigits: abs / size >= 100 ? 0 : 1 });
      return isPersian ? `${toPersianDigits(scaled)} ${fa}` : `${scaled}${en}`;
    }
  }
  return formatNumber(number, isPersian);
}

export function formatPercent(value: number | null | undefined, isPersian: boolean): string {
  return `${formatNumber(value, isPersian, 1)}${isPersian ? '٪' : '%'}`;
}

export function formatDuration(totalSeconds: number | null | undefined, isPersian: boolean): string {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (isPersian) {
    if (h) parts.push(`${toPersianDigits(h)} ساعت`);
    if (m) parts.push(`${toPersianDigits(m)} دقیقه`);
    if (!h && (s || !parts.length)) parts.push(`${toPersianDigits(s)} ثانیه`);
    return parts.join(' و ');
  }
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && (s || !parts.length)) parts.push(`${s}s`);
  return parts.join(' ');
}

/** Compact duration for chart axes: 45s, 3:20, 1:05:00 (۴۵ث ، ۳:۲۰). */
export function formatDurationShort(totalSeconds: number | null | undefined, isPersian: boolean): string {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  const text = h ? `${h}:${pad(m)}:${pad(s)}` : m ? `${m}:${pad(s)}` : `${s}${isPersian ? 'ث' : 's'}`;
  return isPersian ? toPersianDigits(text) : text;
}

export function formatDateTime(iso: string | null | undefined, isPersian: boolean, withTime = true): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(isPersian ? 'fa-IR' : 'en-GB', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: isPersian ? 'long' : 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Turns a Jalali bucket label from the API (`1404/07/12`, `مهر 1404`, `1404`) into the viewer's language. */
export function formatBucketLabel(label: string, granularity: Granularity, isPersian: boolean): string {
  if (isPersian) return toPersianDigits(label);
  if (granularity === 'month') {
    const [monthName, year] = label.split(' ');
    const index = JALALI_MONTHS_FA.indexOf(monthName);
    return index >= 0 ? `${JALALI_MONTHS_EN[index]} ${year}` : label;
  }
  return label;
}

// ---------------------------------------------------------------------------
// Ranges (all boundaries are Tehran-local midnights)
// ---------------------------------------------------------------------------

function tehranParts(date: Date): [number, number, number] {
  const local = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  return [local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate()];
}

export function tehranMidnight(date: Date): Date {
  const [y, m, d] = tehranParts(date);
  return new Date(Date.UTC(y, m - 1, d) - TEHRAN_OFFSET_MS);
}

export function jalaliToInstant(jy: number, jm: number, jd: number): Date {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd) - TEHRAN_OFFSET_MS);
}

export function instantToJalali(date: Date): [number, number, number] {
  return gregorianToJalali(...tehranParts(date));
}

export type RangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'all'
  | 'custom';

export const RANGE_PRESETS: { key: Exclude<RangePreset, 'custom'>; fa: string; en: string }[] = [
  { key: 'today', fa: 'امروز', en: 'Today' },
  { key: 'yesterday', fa: 'دیروز', en: 'Yesterday' },
  { key: '7d', fa: '۷ روز اخیر', en: 'Last 7 days' },
  { key: '30d', fa: '۳۰ روز اخیر', en: 'Last 30 days' },
  { key: '90d', fa: '۹۰ روز اخیر', en: 'Last 90 days' },
  { key: 'thisMonth', fa: 'این ماه', en: 'This month' },
  { key: 'lastMonth', fa: 'ماه گذشته', en: 'Last month' },
  { key: 'thisYear', fa: 'امسال', en: 'This year' },
  { key: 'lastYear', fa: 'سال گذشته', en: 'Last year' },
  { key: 'all', fa: 'کل دوران', en: 'All time' },
];

export function presetRange(preset: Exclude<RangePreset, 'custom'>, now = new Date()): { from: Date; to: Date } {
  const today = tehranMidnight(now);
  const [jy, jm] = instantToJalali(now);
  switch (preset) {
    case 'today':
      return { from: today, to: now };
    case 'yesterday':
      return { from: new Date(today.getTime() - DAY_MS), to: today };
    case '7d':
      return { from: new Date(today.getTime() - 6 * DAY_MS), to: now };
    case '30d':
      return { from: new Date(today.getTime() - 29 * DAY_MS), to: now };
    case '90d':
      return { from: new Date(today.getTime() - 89 * DAY_MS), to: now };
    case 'thisMonth':
      return { from: jalaliToInstant(jy, jm, 1), to: now };
    case 'lastMonth': {
      const start = jm === 1 ? jalaliToInstant(jy - 1, 12, 1) : jalaliToInstant(jy, jm - 1, 1);
      return { from: start, to: jalaliToInstant(jy, jm, 1) };
    }
    case 'thisYear':
      return { from: jalaliToInstant(jy, 1, 1), to: now };
    case 'lastYear':
      return { from: jalaliToInstant(jy - 1, 1, 1), to: jalaliToInstant(jy, 1, 1) };
    case 'all':
      return { from: jalaliToInstant(jy - 5, 1, 1), to: now };
  }
}

export function defaultGranularity(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  return days <= 62 ? 'day' : days <= 750 ? 'month' : 'year';
}

export function toRangeParams(from: Date, to: Date, granularity: Granularity): ReportRangeParams {
  return { from: from.toISOString(), to: to.toISOString(), granularity };
}

/** Short Jalali label for range buttons: ۱۲ مهر ۱۴۰۵ / 12 Mehr 1405. */
export function formatJalaliLabel(date: Date, isPersian = true): string {
  const [jy, jm, jd] = instantToJalali(date);
  return isPersian
    ? `${toPersianDigits(jd)} ${JALALI_MONTHS_FA[jm - 1]} ${toPersianDigits(jy)}`
    : `${jd} ${JALALI_MONTHS_EN[jm - 1]} ${jy}`;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const ORDER_STATUS_LABELS: Record<string, [string, string]> = {
  pending: ['در انتظار', 'Pending'],
  processing: ['در حال پردازش', 'Processing'],
  shipped: ['ارسال شده', 'Shipped'],
  delivered: ['تحویل شده', 'Delivered'],
  cancelled: ['لغو شده', 'Cancelled'],
};

export const PAYMENT_LABELS: Record<string, [string, string]> = {
  online: ['پرداخت آنلاین', 'Online'],
  cod: ['پرداخت در محل', 'Cash on delivery'],
  installment: ['اقساطی', 'Installment'],
};

export const DEVICE_LABELS: Record<string, [string, string]> = {
  mobile: ['موبایل', 'Mobile'],
  desktop: ['دسکتاپ', 'Desktop'],
  tablet: ['تبلت', 'Tablet'],
};

export const PAGE_TYPE_LABELS: Record<string, [string, string]> = {
  home: ['صفحه اصلی', 'Home'],
  products: ['فهرست محصولات', 'Catalog'],
  product: ['صفحه محصول', 'Product page'],
  cart: ['سبد خرید', 'Cart'],
  checkout: ['تسویه حساب', 'Checkout'],
  vip: ['باشگاه VIP', 'VIP club'],
  profile: ['پروفایل', 'Profile'],
  auth: ['ورود / ثبت‌نام', 'Sign in / up'],
  blog: ['وبلاگ', 'Blog'],
  about: ['درباره ما', 'About'],
  consultation: ['مشاوره', 'Consultation'],
  other: ['سایر', 'Other'],
};

export const PERIOD_LABELS: Record<string, [string, string]> = {
  today: ['امروز', 'Today'],
  yesterday: ['دیروز', 'Yesterday'],
  last7Days: ['۷ روز اخیر', 'Last 7 days'],
  thisMonth: ['این ماه', 'This month'],
  lastMonth: ['ماه گذشته', 'Last month'],
  thisYear: ['امسال', 'This year'],
  lastYear: ['سال گذشته', 'Last year'],
  allTime: ['کل دوران', 'All time'],
};

export const label = (map: Record<string, [string, string]>, key: string, isPersian: boolean) =>
  map[key]?.[isPersian ? 0 : 1] ?? key;

export function referrerLabel(name: string, isPersian: boolean) {
  if (name === '(direct)') return isPersian ? 'ورود مستقیم' : 'Direct';
  return name;
}

/** Downloads rows as a UTF-8 CSV that Excel opens with Persian text intact. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
