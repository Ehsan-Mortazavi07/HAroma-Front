'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
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

  // Dropdown open state: 'day' | 'month' | 'year' | null
  const [openDropdown, setOpenDropdown] = useState<'day' | 'month' | 'year' | null>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside (capture phase guarantees event interception)
  useEffect(() => {
    if (!openDropdown) return;

    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (openDropdown === 'day' && dayRef.current && !dayRef.current.contains(target)) {
        setOpenDropdown(null);
      } else if (openDropdown === 'month' && monthRef.current && !monthRef.current.contains(target)) {
        setOpenDropdown(null);
      } else if (openDropdown === 'year' && yearRef.current && !yearRef.current.contains(target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  // Auto-scroll selected item into view when dropdown opens
  useEffect(() => {
    if (openDropdown && listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [openDropdown]);

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
    setOpenDropdown(null);
  };

  const handleToggleMode = () => {
    setUserOverriddenMode(true);
    setCalendarMode((prev) => (prev === 'jalali' ? 'gregorian' : 'jalali'));
    setOpenDropdown(null);
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

  const currentMonthName = useMemo(() => {
    if (!currentParts.month) return '';
    const m = months.find((item) => item.index === Number(currentParts.month));
    return m ? m.name : '';
  }, [currentParts.month, months]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label and Calendar Switch Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0" />
          <span className="text-xs font-bold text-brand-text">
            {label || (isPersian ? 'تاریخ تولد' : 'Date of Birth')}
          </span>
          {required && <span className="text-rose-500 font-bold">*</span>}
          <Chip
            size="sm"
            variant="flat"
            classNames={{
              base: "bg-brand-surface-elevated border border-brand-border h-6 px-2.5 text-[11px] font-bold text-brand-text-muted rounded-xl",
              content: "px-0"
            }}
          >
            {calendarMode === 'jalali'
              ? isPersian ? 'تقویم خورشیدی' : 'Solar Jalali'
              : isPersian ? 'تقویم میلادی' : 'Gregorian'}
          </Chip>
        </div>

        {/* Toggle Calendar Button */}
        <Button
          type="button"
          onPress={handleToggleMode}
          isDisabled={disabled}
          size="sm"
          variant="flat"
          radius="lg"
          startContent={<RefreshCw className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />}
          className="bg-brand-surface-elevated hover:bg-brand-border/60 text-brand-bronze dark:text-brand-gold border border-brand-border text-[11px] font-bold h-8.5 px-3.5 transition-all shadow-xs rounded-xl cursor-pointer"
        >
          {calendarMode === 'jalali'
            ? isPersian ? 'تغییر به تقویم میلادی' : 'Switch to Gregorian'
            : isPersian ? 'تغییر به تقویم شمسی' : 'Switch to Solar (Jalali)'}
        </Button>
      </div>

      {/* 3 Proportional In-Place RTL Dropdowns (3 cols Day, 5 cols Month, 4 cols Year) */}
      <div className={`grid grid-cols-12 gap-3 relative transition-all duration-200 ${openDropdown ? 'pb-72' : 'pb-0'}`}>
        {/* Day Select (3 cols) */}
        <div ref={dayRef} className="col-span-12 sm:col-span-3 space-y-1.5 relative">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'روز' : 'Day'}
          </label>
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}
              className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
                openDropdown === 'day'
                  ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                  : 'border-brand-border hover:border-brand-gold/70'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`text-xs font-bold truncate ${currentParts.day ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                {currentParts.day ? (isPersian ? toPersianDigits(currentParts.day) : currentParts.day) : (isPersian ? 'روز' : 'Day')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                  openDropdown === 'day' ? 'rotate-180 text-brand-gold' : 'opacity-70'
                }`}
              />
            </button>

            {/* Custom Day Dropdown Menu */}
            {openDropdown === 'day' && (
              <div
                ref={listRef}
                className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-0.5 overscroll-contain"
              >
                {days.map((d) => {
                  const isSelected = Number(currentParts.day) === d;
                  return (
                    <button
                      key={`day-${d}`}
                      data-selected={isSelected ? 'true' : 'false'}
                      type="button"
                      onClick={() => handlePartChange('day', d)}
                      className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-gold text-[#141914]'
                          : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                      }`}
                    >
                      <span>{isPersian ? toPersianDigits(d) : d}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Month Select (5 cols) */}
        <div ref={monthRef} className="col-span-12 sm:col-span-5 space-y-1.5 relative">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'ماه' : 'Month'}
          </label>
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
                openDropdown === 'month'
                  ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                  : 'border-brand-border hover:border-brand-gold/70'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`text-xs font-bold truncate ${currentParts.month ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                {currentMonthName || (isPersian ? 'انتخاب ماه' : 'Month')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                  openDropdown === 'month' ? 'rotate-180 text-brand-gold' : 'opacity-70'
                }`}
              />
            </button>

            {/* Custom Month Dropdown Menu */}
            {openDropdown === 'month' && (
              <div
                ref={listRef}
                className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-0.5 overscroll-contain"
              >
                {months.map((m) => {
                  const isSelected = Number(currentParts.month) === m.index;
                  return (
                    <button
                      key={`month-${m.index}`}
                      data-selected={isSelected ? 'true' : 'false'}
                      type="button"
                      onClick={() => handlePartChange('month', m.index)}
                      className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-gold text-[#141914]'
                          : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                      }`}
                    >
                      <span>{m.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Year Select (4 cols) */}
        <div ref={yearRef} className="col-span-12 sm:col-span-4 space-y-1.5 relative">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'سال' : 'Year'}
          </label>
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
              className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
                openDropdown === 'year'
                  ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                  : 'border-brand-border hover:border-brand-gold/70'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`text-xs font-bold truncate ${currentParts.year ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                {currentParts.year ? (isPersian ? toPersianDigits(currentParts.year) : currentParts.year) : (isPersian ? 'سال' : 'Year')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                  openDropdown === 'year' ? 'rotate-180 text-brand-gold' : 'opacity-70'
                }`}
              />
            </button>

            {/* Custom Year Dropdown Menu */}
            {openDropdown === 'year' && (
              <div
                ref={listRef}
                className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-0.5 overscroll-contain"
              >
                {years.map((y) => {
                  const isSelected = Number(currentParts.year) === y;
                  return (
                    <button
                      key={`year-${y}`}
                      data-selected={isSelected ? 'true' : 'false'}
                      type="button"
                      onClick={() => handlePartChange('year', y)}
                      className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-gold text-[#141914]'
                          : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                      }`}
                    >
                      <span>{isPersian ? toPersianDigits(y) : y}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Date Badge Preview */}
      {value && formattedCurrent && (
        <div className="flex items-center justify-between gap-3 text-xs px-4.5 py-3 rounded-2xl bg-brand-surface-elevated/70 border border-brand-border text-brand-text-muted shadow-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              {isPersian ? 'تاریخ انتخابی:' : 'Selected Date:'}{' '}
              <strong className="text-brand-text font-black">{formattedCurrent}</strong>
            </span>
          </div>
          {formattedAlternative && (
            <Chip
              size="sm"
              variant="flat"
              startContent={<Sparkles className="w-3 h-3 text-brand-gold" />}
              classNames={{
                base: "bg-brand-gold/10 border border-brand-gold/25 text-brand-bronze dark:text-brand-gold text-[11px] font-medium h-6 rounded-xl",
                content: "font-semibold"
              }}
            >
              {calendarMode === 'jalali' ? (isPersian ? 'معادل میلادی: ' : 'Gregorian: ') : (isPersian ? 'معادل شمسی: ' : 'Solar: ')}
              {formattedAlternative}
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}
