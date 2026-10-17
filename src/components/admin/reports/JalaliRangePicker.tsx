'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { JALALI_MONTHS_EN, JALALI_MONTHS_FA, jalaliToGregorian } from '@/common/utils/date';
import { toPersianDigits } from '@/common/utils';
import { instantToJalali, jalaliToInstant } from './format';

type Day = [number, number, number];

const WEEKDAYS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const WEEKDAYS_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

const keyOf = ([y, m, d]: Day) => y * 10_000 + m * 100 + d;

function monthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const [ay, am, ad] = jalaliToGregorian(jy, 12, 1);
  const [by, bm, bd] = jalaliToGregorian(jy + 1, 1, 1);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

/** Column of the 1st of the month in a Saturday-first week. */
function firstColumn(jy: number, jm: number): number {
  const weekday = new Date(jalaliToInstant(jy, jm, 1).getTime() + TEHRAN_OFFSET_MS).getUTCDay();
  return (weekday + 1) % 7;
}

function shiftMonth(jy: number, jm: number, delta: number): [number, number] {
  const index = jy * 12 + (jm - 1) + delta;
  return [Math.floor(index / 12), (index % 12) + 1];
}

export function JalaliRangePicker({
  isPersian,
  initialFrom,
  initialTo,
  onApply,
  onClose,
}: {
  isPersian: boolean;
  /** Tehran-midnight start of the range. */
  initialFrom: Date;
  /** Exclusive end instant. */
  initialTo: Date;
  onApply: (from: Date, toExclusive: Date) => void;
  onClose: () => void;
}) {
  const today = useMemo(() => instantToJalali(new Date()), []);
  const [start, setStart] = useState<Day | null>(() => instantToJalali(initialFrom));
  const [end, setEnd] = useState<Day | null>(() => instantToJalali(new Date(initialTo.getTime() - 1)));
  const [hoverDay, setHoverDay] = useState<Day | null>(null);
  // `view` is the later (current) month; the earlier one is shown beside it on wide screens.
  const [view, setView] = useState<[number, number]>(() => {
    const [ey, em] = end || today;
    return [ey, em];
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const digits = (value: number | string) => (isPersian ? toPersianDigits(value) : String(value));
  const months = isPersian ? JALALI_MONTHS_FA : JALALI_MONTHS_EN;
  const tr = (fa: string, en: string) => (isPersian ? fa : en);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        const trigger = (event.target as HTMLElement).closest('[data-range-trigger]');
        if (!trigger) onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const pick = (day: Day) => {
    if (!start || end) {
      setStart(day);
      setEnd(null);
    } else if (keyOf(day) < keyOf(start)) {
      setStart(day);
    } else {
      setEnd(day);
    }
  };

  const apply = () => {
    if (!start) return;
    const last = end || start;
    const from = jalaliToInstant(...start);
    const toExclusive = new Date(jalaliToInstant(...last).getTime() + DAY_MS);
    onApply(from, toExclusive > new Date() ? new Date() : toExclusive);
  };

  const rangeEnd = end || (start && hoverDay && keyOf(hoverDay) >= keyOf(start) ? hoverDay : null);
  const lowKey = start ? keyOf(start) : 0;
  const highKey = rangeEnd ? keyOf(rangeEnd) : lowKey;
  const todayKey = keyOf(today);
  const [earlierYear, earlierMonth] = shiftMonth(view[0], view[1], -1);
  const canGoNext = keyOf([view[0], view[1], 1]) < keyOf([today[0], today[1], 1]);
  const years = Array.from({ length: 8 }, (_, index) => today[0] - index);
  const formatDay = (day: Day | null) =>
    day ? `${digits(day[2])} ${months[day[1] - 1]} ${digits(day[0])}` : tr('—', '—');
  const span = start ? Math.round((jalaliToInstant(...(rangeEnd || start)).getTime() - jalaliToInstant(...start).getTime()) / DAY_MS) + 1 : 0;

  const renderMonth = (jy: number, jm: number, hideOnMobile: boolean) => {
    const length = monthLength(jy, jm);
    const offset = firstColumn(jy, jm);
    return (
      <div className={hideOnMobile ? 'hidden sm:block' : ''}>
        <div className="mb-2 text-center text-xs font-black text-brand-text">
          {months[jm - 1]} {digits(jy)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {(isPersian ? WEEKDAYS_FA : WEEKDAYS_EN).map((weekday) => (
            <span key={weekday} className="pb-1 text-[10px] font-bold text-brand-text-muted">
              {weekday}
            </span>
          ))}
          {Array.from({ length: offset }, (_, index) => (
            <span key={`pad-${index}`} />
          ))}
          {Array.from({ length }, (_, index) => {
            const day: Day = [jy, jm, index + 1];
            const key = keyOf(day);
            const disabled = key > todayKey;
            const isStart = start && key === lowKey;
            const isEnd = rangeEnd && key === highKey;
            const inRange = start && rangeEnd && key > lowKey && key < highKey;
            const column = (offset + index) % 7;
            return (
              <div
                key={key}
                className={`relative flex h-9 items-center justify-center ${
                  inRange || (isStart && rangeEnd && highKey > lowKey) || (isEnd && highKey > lowKey) ? 'bg-brand-gold/15' : ''
                } ${isStart && highKey > lowKey ? 'rounded-s-full' : ''} ${isEnd && highKey > lowKey ? 'rounded-e-full' : ''} ${
                  inRange && column === 0 ? 'rounded-s-full' : ''
                } ${inRange && column === 6 ? 'rounded-e-full' : ''}`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  onPointerEnter={() => setHoverDay(day)}
                  aria-pressed={!!(isStart || isEnd)}
                  aria-label={formatDay(day)}
                  className={`relative z-[1] flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                    isStart || isEnd
                      ? 'bg-brand-gold text-[#141914] shadow-sm'
                      : key === todayKey
                        ? 'text-brand-text ring-1 ring-brand-gold hover:bg-brand-surface-elevated'
                        : 'text-brand-text hover:bg-brand-surface-elevated'
                  }`}
                >
                  {digits(index + 1)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectClass =
    'h-8 rounded-full border border-brand-border bg-brand-surface-elevated px-3 text-xs font-bold text-brand-text outline-none focus:border-brand-gold';

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label={tr('انتخاب بازه تاریخ', 'Choose a date range')}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute end-3 top-full z-40 mt-2 w-[min(640px,calc(100%-1.5rem))] rounded-3xl border border-brand-border bg-brand-surface p-4 shadow-2xl"
      onPointerLeave={() => setHoverDay(null)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setView(shiftMonth(view[0], view[1], -1))}
            aria-label={tr('ماه قبل', 'Previous month')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-text-muted hover:border-brand-gold hover:text-brand-text"
          >
            {isPersian ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <select aria-label={tr('ماه', 'Month')} value={view[1]} onChange={(event) => setView([view[0], Number(event.target.value)])} className={selectClass}>
            {months.map((month, index) => (
              <option key={month} value={index + 1} disabled={view[0] === today[0] && index + 1 > today[1]}>
                {month}
              </option>
            ))}
          </select>
          <select
            aria-label={tr('سال', 'Year')}
            value={view[0]}
            onChange={(event) => {
              const year = Number(event.target.value);
              setView([year, year === today[0] ? Math.min(view[1], today[1]) : view[1]]);
            }}
            className={selectClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {digits(year)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setView(shiftMonth(view[0], view[1], 1))}
            aria-label={tr('ماه بعد', 'Next month')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-text-muted hover:border-brand-gold hover:text-brand-text disabled:opacity-30"
          >
            {isPersian ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setView([today[0], today[1]]);
          }}
          className="rounded-full px-3 py-1 text-[11px] font-bold text-brand-bronze hover:bg-brand-surface-elevated dark:text-brand-gold"
        >
          {tr('برو به امروز', 'Go to today')}
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {renderMonth(earlierYear, earlierMonth, true)}
        {renderMonth(view[0], view[1], false)}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-brand-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[11px] font-semibold text-brand-text-muted">
          {start ? (
            <>
              <span className="font-black text-brand-text">{formatDay(start)}</span>
              {' '}{tr('تا', 'to')}{' '}
              <span className="font-black text-brand-text">{formatDay(rangeEnd || start)}</span>
              <span className="ms-2 rounded-full bg-brand-surface-elevated px-2 py-0.5 font-bold">
                {tr(`${digits(span)} روز`, `${span} day${span === 1 ? '' : 's'}`)}
              </span>
            </>
          ) : (
            tr('روز شروع را انتخاب کنید', 'Pick a start day')
          )}
          {start && !end && <div className="mt-1">{tr('حالا روز پایان را انتخاب کنید (یا همین یک روز را اعمال کنید).', 'Now pick an end day (or apply this single day).')}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-brand-border px-4 text-xs font-bold text-brand-text-muted hover:text-brand-text"
          >
            <X className="h-3.5 w-3.5" />
            {tr('انصراف', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={!start}
            onClick={apply}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-gold px-5 text-xs font-black text-[#141914] transition-colors hover:bg-[#d4be9b] disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            {tr('اعمال بازه', 'Apply range')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
