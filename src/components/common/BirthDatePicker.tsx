'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { Select, SelectItem, Button, Chip } from '@heroui/react';
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

        {/* HeroUI Toggle Calendar Button */}
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

      {/* 3 Balanced Selects with Golden Ratio (3 cols Day, 5 cols Month, 4 cols Year) */}
      <div className="grid grid-cols-12 gap-3">
        {/* Day Select (3 cols) */}
        <div className="col-span-12 sm:col-span-3 space-y-1.5">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'روز' : 'Day'}
          </label>
          <Select
            aria-label={isPersian ? 'روز تولد' : 'Birth Day'}
            placeholder={isPersian ? 'روز' : 'Day'}
            isDisabled={disabled}
            selectedKeys={currentParts.day ? [String(currentParts.day)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) handlePartChange('day', Number(selected));
            }}
            variant="bordered"
            radius="lg"
            size="md"
            selectorIcon={<ChevronDown className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0 opacity-70" />}
            classNames={{
              base: "w-full",
              trigger: "h-12 px-3.5 bg-brand-surface border border-brand-border hover:border-brand-gold/80 data-[focus=true]:border-brand-gold rounded-2xl shadow-xs transition-colors",
              value: "text-xs font-bold text-brand-text text-start",
              popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto",
            }}
            listboxProps={{
              itemClasses: {
                base: [
                  "rounded-xl",
                  "text-xs font-medium text-brand-text text-start",
                  "py-2 px-3",
                  "transition-colors",
                  "data-[hover=true]:bg-brand-gold/15",
                  "data-[hover=true]:text-brand-gold",
                  "data-[selected=true]:bg-brand-gold/20",
                  "data-[selected=true]:text-brand-gold",
                  "data-[selected=true]:font-bold",
                ],
              },
            }}
          >
            {days.map((d) => (
              <SelectItem
                key={String(d)}
                textValue={isPersian ? toPersianDigits(d) : String(d)}
              >
                {isPersian ? toPersianDigits(d) : String(d)}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Month Select (5 cols) */}
        <div className="col-span-12 sm:col-span-5 space-y-1.5">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'ماه' : 'Month'}
          </label>
          <Select
            aria-label={isPersian ? 'ماه تولد' : 'Birth Month'}
            placeholder={isPersian ? 'انتخاب ماه' : 'Month'}
            isDisabled={disabled}
            selectedKeys={currentParts.month ? [String(currentParts.month)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) handlePartChange('month', Number(selected));
            }}
            variant="bordered"
            radius="lg"
            size="md"
            selectorIcon={<ChevronDown className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0 opacity-70" />}
            classNames={{
              base: "w-full",
              trigger: "h-12 px-3.5 bg-brand-surface border border-brand-border hover:border-brand-gold/80 data-[focus=true]:border-brand-gold rounded-2xl shadow-xs transition-colors",
              value: "text-xs font-bold text-brand-text text-start",
              popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto",
            }}
            listboxProps={{
              itemClasses: {
                base: [
                  "rounded-xl",
                  "text-xs font-medium text-brand-text text-start",
                  "py-2 px-3",
                  "transition-colors",
                  "data-[hover=true]:bg-brand-gold/15",
                  "data-[hover=true]:text-brand-gold",
                  "data-[selected=true]:bg-brand-gold/20",
                  "data-[selected=true]:text-brand-gold",
                  "data-[selected=true]:font-bold",
                ],
              },
            }}
          >
            {months.map((m) => (
              <SelectItem
                key={String(m.index)}
                textValue={m.name}
              >
                {m.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Year Select (4 cols) */}
        <div className="col-span-12 sm:col-span-4 space-y-1.5">
          <label className="block text-xs font-bold text-brand-text-muted px-1">
            {isPersian ? 'سال' : 'Year'}
          </label>
          <Select
            aria-label={isPersian ? 'سال تولد' : 'Birth Year'}
            placeholder={isPersian ? 'سال' : 'Year'}
            isDisabled={disabled}
            selectedKeys={currentParts.year ? [String(currentParts.year)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) handlePartChange('year', Number(selected));
            }}
            variant="bordered"
            radius="lg"
            size="md"
            selectorIcon={<ChevronDown className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0 opacity-70" />}
            classNames={{
              base: "w-full",
              trigger: "h-12 px-3.5 bg-brand-surface border border-brand-border hover:border-brand-gold/80 data-[focus=true]:border-brand-gold rounded-2xl shadow-xs transition-colors",
              value: "text-xs font-bold text-brand-text text-start",
              popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl p-1.5 max-h-56 overflow-y-auto",
            }}
            listboxProps={{
              className: "max-h-56",
              itemClasses: {
                base: [
                  "rounded-xl",
                  "text-xs font-medium text-brand-text text-start",
                  "py-2 px-3",
                  "transition-colors",
                  "data-[hover=true]:bg-brand-gold/15",
                  "data-[hover=true]:text-brand-gold",
                  "data-[selected=true]:bg-brand-gold/20",
                  "data-[selected=true]:text-brand-gold",
                  "data-[selected=true]:font-bold",
                ],
              },
            }}
          >
            {years.map((y) => (
              <SelectItem
                key={String(y)}
                textValue={isPersian ? toPersianDigits(y) : String(y)}
              >
                {isPersian ? toPersianDigits(y) : String(y)}
              </SelectItem>
            ))}
          </Select>
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
