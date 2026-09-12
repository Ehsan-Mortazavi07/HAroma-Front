'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, RefreshCw, ChevronDown } from 'lucide-react';
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatIsoDate,
  parseIsoDate,
  formatDisplayBirthDate,
  JALALI_MONTHS_FA,
  JALALI_MONTHS_EN,
  GREGORIAN_MONTHS_FA,
  GREGORIAN_MONTHS_EN,
} from '@/common/utils/date';
import { toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

interface BirthDatePickerProps {
  value?: string | null;
  onChange: (isoDate: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function BirthDatePicker({
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  className = '',
}: BirthDatePickerProps) {
  const { isPersian } = useTranslation();

  // Mode: 'jalali' (شمسی) or 'gregorian' (میلادی)
  const [calendarMode, setCalendarMode] = useState<'jalali' | 'gregorian'>(
    isPersian ? 'jalali' : 'gregorian',
  );
  const [userOverriddenMode, setUserOverriddenMode] = useState(false);

  // Sync calendar mode with site language unless manually toggled by the user
  useEffect(() => {
    if (!userOverriddenMode) {
      setCalendarMode(isPersian ? 'jalali' : 'gregorian');
    }
  }, [isPersian, userOverriddenMode]);

  // Parse current ISO value
  const parsedIso = useMemo(() => parseIsoDate(value), [value]);

  // Derived current day, month, year depending on calendarMode
  const currentParts = useMemo(() => {
    if (!parsedIso) return { year: '', month: '', day: '' };
    const [gy, gm, gd] = parsedIso;
    if (calendarMode === 'jalali') {
      const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
      return { year: jy, month: jm, day: jd };
    } else {
      return { year: gy, month: gm, day: gd };
    }
  }, [parsedIso, calendarMode]);

  // Year ranges
  const years = useMemo(() => {
    const list: number[] = [];
    if (calendarMode === 'jalali') {
      for (let y = 1404; y >= 1315; y--) list.push(y);
    } else {
      for (let y = 2025; y >= 1935; y--) list.push(y);
    }
    return list;
  }, [calendarMode]);

  // Month names
  const months = useMemo(() => {
    if (calendarMode === 'jalali') {
      return (isPersian ? JALALI_MONTHS_FA : JALALI_MONTHS_EN).map((name, index) => ({
        index: index + 1,
        name,
      }));
    } else {
      return (isPersian ? GREGORIAN_MONTHS_FA : GREGORIAN_MONTHS_EN).map((name, index) => ({
        index: index + 1,
        name,
      }));
    }
  }, [calendarMode, isPersian]);

  // Days list (1 to 31)
  const days = useMemo(() => {
    let maxDays = 31;
    if (calendarMode === 'jalali') {
      if (currentParts.month && typeof currentParts.month === 'number') {
        if (currentParts.month > 6 && currentParts.month <= 11) maxDays = 30;
        else if (currentParts.month === 12) maxDays = 29;
      }
    } else {
      if (currentParts.month && typeof currentParts.month === 'number') {
        if ([4, 6, 9, 11].includes(currentParts.month)) maxDays = 30;
        else if (currentParts.month === 2) maxDays = 29;
      }
    }
    const list: number[] = [];
    for (let d = 1; d <= maxDays; d++) list.push(d);
    return list;
  }, [calendarMode, currentParts.month]);

  // Handlers for individual dropdown changes
  const handlePartChange = (type: 'year' | 'month' | 'day', val: number) => {
    let y = currentParts.year ? Number(currentParts.year) : calendarMode === 'jalali' ? 1375 : 1996;
    let m = currentParts.month ? Number(currentParts.month) : 1;
    let d = currentParts.day ? Number(currentParts.day) : 1;

    if (type === 'year') y = val;
    if (type === 'month') m = val;
    if (type === 'day') d = val;

    if (calendarMode === 'jalali') {
      const [gy, gm, gd] = jalaliToGregorian(y, m, d);
      onChange(formatIsoDate(gy, gm, gd));
    } else {
      onChange(formatIsoDate(y, m, d));
    }
  };

  const handleToggleMode = () => {
    setUserOverriddenMode(true);
    setCalendarMode((prev) => (prev === 'jalali' ? 'gregorian' : 'jalali'));
  };

  const formattedAlternative = useMemo(() => {
    if (!value) return '';
    const otherMode = calendarMode === 'jalali' ? 'gregorian' : 'jalali';
    return formatDisplayBirthDate(value, otherMode, isPersian);
  }, [value, calendarMode, isPersian]);

  const formattedCurrent = useMemo(() => {
    if (!value) return '';
    return formatDisplayBirthDate(value, calendarMode, isPersian);
  }, [value, calendarMode, isPersian]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Calendar Switch Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="text-xs font-bold text-brand-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-bronze shrink-0" />
          <span>{label || (isPersian ? 'تاریخ تولد' : 'Date of Birth')}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
          <span className="text-[11px] font-semibold text-brand-text-muted">
            ({calendarMode === 'jalali' ? (isPersian ? 'تقویم خورشیدی' : 'Solar Jalali') : (isPersian ? 'تقویم میلادی' : 'Gregorian')})
          </span>
        </label>

        {/* Toggle Calendar Button */}
        <button
          type="button"
          onClick={handleToggleMode}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-surface-elevated hover:bg-brand-border/60 text-brand-bronze dark:text-brand-gold border border-brand-border text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-bronze shrink-0" />
          <span>
            {calendarMode === 'jalali'
              ? isPersian ? 'تغییر به میلادی' : 'Switch to Gregorian'
              : isPersian ? 'تغییر به شمسی' : 'Switch to Solar (Jalali)'}
          </span>
        </button>
      </div>

      {/* 3 Balanced, Elegant Inputs: Day, Month, Year */}
      <div className="grid grid-cols-3 gap-3">
        {/* Day Select */}
        <div>
          <label className="block text-[11px] font-bold mb-1 text-brand-text-muted">
            {isPersian ? 'روز' : 'Day'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={currentParts.day ? String(currentParts.day) : ''}
              onChange={(e) => {
                if (e.target.value) handlePartChange('day', Number(e.target.value));
              }}
              className="w-full h-11 px-3.5 pr-8 rtl:pr-3.5 rtl:pl-8 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text appearance-none cursor-pointer focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all disabled:opacity-50"
            >
              <option value="" disabled>
                {isPersian ? 'انتخاب روز' : 'Day'}
              </option>
              {days.map((d) => (
                <option key={`day-${d}`} value={String(d)} className="bg-brand-surface text-brand-text">
                  {isPersian ? toPersianDigits(d) : String(d)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-brand-bronze pointer-events-none absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 shrink-0" />
          </div>
        </div>

        {/* Month Select */}
        <div>
          <label className="block text-[11px] font-bold mb-1 text-brand-text-muted">
            {isPersian ? 'ماه' : 'Month'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={currentParts.month ? String(currentParts.month) : ''}
              onChange={(e) => {
                if (e.target.value) handlePartChange('month', Number(e.target.value));
              }}
              className="w-full h-11 px-3.5 pr-8 rtl:pr-3.5 rtl:pl-8 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text appearance-none cursor-pointer focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all disabled:opacity-50"
            >
              <option value="" disabled>
                {isPersian ? 'انتخاب ماه' : 'Month'}
              </option>
              {months.map((m) => (
                <option key={`month-${m.index}`} value={String(m.index)} className="bg-brand-surface text-brand-text">
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-brand-bronze pointer-events-none absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 shrink-0" />
          </div>
        </div>

        {/* Year Select */}
        <div>
          <label className="block text-[11px] font-bold mb-1 text-brand-text-muted">
            {isPersian ? 'سال' : 'Year'}
          </label>
          <div className="relative">
            <select
              disabled={disabled}
              value={currentParts.year ? String(currentParts.year) : ''}
              onChange={(e) => {
                if (e.target.value) handlePartChange('year', Number(e.target.value));
              }}
              className="w-full h-11 px-3.5 pr-8 rtl:pr-3.5 rtl:pl-8 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text appearance-none cursor-pointer focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all disabled:opacity-50"
            >
              <option value="" disabled>
                {isPersian ? 'انتخاب سال' : 'Year'}
              </option>
              {years.map((y) => (
                <option key={`year-${y}`} value={String(y)} className="bg-brand-surface text-brand-text">
                  {isPersian ? toPersianDigits(y) : String(y)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-brand-bronze pointer-events-none absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 shrink-0" />
          </div>
        </div>
      </div>

      {/* Dual Date Badge Preview */}
      {value && formattedCurrent && (
        <div className="flex items-center justify-between gap-2 text-xs px-4 py-2.5 rounded-2xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              {isPersian ? 'تاریخ انتخابی:' : 'Selected Date:'}{' '}
              <strong className="text-brand-text font-bold">{formattedCurrent}</strong>
            </span>
          </div>
          {formattedAlternative && (
            <span className="text-[11px] font-medium text-brand-bronze dark:text-brand-gold">
              ({calendarMode === 'jalali' ? (isPersian ? 'معادل میلادی: ' : 'Gregorian: ') : (isPersian ? 'معادل شمسی: ' : 'Solar: ')}
              {formattedAlternative})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
