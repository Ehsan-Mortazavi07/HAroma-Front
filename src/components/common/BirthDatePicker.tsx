'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button, Select, SelectItem } from '@heroui/react';
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
    <div className={`space-y-2 ${className}`}>
      {/* Label and Calendar Switch Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#bfa27a]" />
          <span>{label || (isPersian ? 'تاریخ تولد' : 'Date of Birth')}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {/* Toggle Calendar Button */}
        <Button
          type="button"
          onPress={handleToggleMode}
          isDisabled={disabled}
          variant="flat"
          size="sm"
          radius="full"
          className="h-7 px-3 bg-brand-surface-elevated hover:bg-[#bfa27a]/20 border border-brand-border text-[11px] font-bold text-[#bfa27a] rounded-full active:scale-95 transition-all"
          startContent={<RefreshCw className="w-3 h-3 text-[#9f815b]" />}
        >
          {isPersian
            ? `نمایش به صورت (${calendarMode === 'jalali' ? 'میلادی' : 'شمسی'})`
            : `Display in (${calendarMode === 'jalali' ? 'Gregorian' : 'Jalali'})`}
        </Button>
      </div>

      {/* Selects: Day, Month, Year */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Day Select */}
        <Select
          isDisabled={disabled}
          label={isPersian ? 'روز' : 'Day'}
          labelPlacement="outside"
          size="sm"
          radius="full"
          variant="flat"
          selectedKeys={currentParts.day ? new Set([String(currentParts.day)]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) handlePartChange('day', Number(val));
          }}
          classNames={{
            trigger: 'bg-brand-surface-elevated border border-brand-border font-bold text-xs rounded-full',
          }}
        >
          {days.map((d) => (
            <SelectItem key={String(d)}>
              {isPersian ? toPersianDigits(d) : String(d)}
            </SelectItem>
          ))}
        </Select>

        {/* Month Select */}
        <Select
          isDisabled={disabled}
          label={isPersian ? 'ماه' : 'Month'}
          labelPlacement="outside"
          size="sm"
          radius="full"
          variant="flat"
          selectedKeys={currentParts.month ? new Set([String(currentParts.month)]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) handlePartChange('month', Number(val));
          }}
          classNames={{
            trigger: 'bg-brand-surface-elevated border border-brand-border font-bold text-xs rounded-full',
          }}
        >
          {months.map((m) => (
            <SelectItem key={String(m.index)}>
              {m.name}
            </SelectItem>
          ))}
        </Select>

        {/* Year Select */}
        <Select
          isDisabled={disabled}
          label={isPersian ? 'سال' : 'Year'}
          labelPlacement="outside"
          size="sm"
          radius="full"
          variant="flat"
          selectedKeys={currentParts.year ? new Set([String(currentParts.year)]) : new Set([])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) handlePartChange('year', Number(val));
          }}
          classNames={{
            trigger: 'bg-brand-surface-elevated border border-brand-border font-bold text-xs rounded-full',
          }}
        >
          {years.map((y) => (
            <SelectItem key={String(y)}>
              {isPersian ? toPersianDigits(y) : String(y)}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Dual Date Badge Preview */}
      {value && formattedCurrent && (
        <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-brand-surface-elevated/60 border border-brand-border/60 text-brand-text-muted">
          <span>
            {isPersian ? 'تاریخ انتخابی:' : 'Selected:'}{' '}
            <strong className="text-brand-text font-bold">{formattedCurrent}</strong>
          </span>
          {formattedAlternative && (
            <span className="opacity-80">
              ({calendarMode === 'jalali' ? (isPersian ? 'معادل میلادی: ' : 'Gregorian: ') : (isPersian ? 'معادل شمسی: ' : 'Jalali: ')}
              {formattedAlternative})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
