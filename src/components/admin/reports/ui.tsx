'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Download, Info, Minus } from 'lucide-react';
import { downloadCsv, formatPercent } from './format';

export function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`min-w-0 rounded-3xl border border-brand-border bg-brand-surface p-4 shadow-xs sm:p-6 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-bronze dark:text-brand-gold">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-black text-brand-text">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] font-medium leading-5 text-brand-text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </motion.section>
  );
}

/**
 * Headline number with change versus the previous period of equal length.
 * `lowerIsBetter` flips the colour for metrics such as bounce rate.
 */
export function KpiTile({
  label,
  value,
  current,
  previous,
  hint,
  icon: Icon,
  lowerIsBetter = false,
  isPersian,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  current?: number;
  previous?: number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  lowerIsBetter?: boolean;
  isPersian: boolean;
  emphasis?: boolean;
}) {
  // No baseline (previous period empty) means a percentage change would be meaningless.
  const hasDelta = current !== undefined && previous !== undefined && (previous !== 0 || current === 0);
  const change = hasDelta ? (previous ? ((current - previous) / Math.abs(previous)) * 100 : current ? 100 : 0) : 0;
  const direction = !hasDelta || Math.abs(change) < 0.05 ? 'flat' : change > 0 ? 'up' : 'down';
  const good = direction === 'flat' ? null : (direction === 'up') !== lowerIsBetter;
  const DeltaIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-3xl border p-3.5 transition-colors sm:p-5 ${
        emphasis
          ? 'border-brand-gold/40 bg-gradient-to-br from-brand-gold/15 via-brand-surface to-brand-surface'
          : 'border-brand-border bg-brand-surface hover:border-brand-gold/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-brand-text-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-brand-bronze dark:text-brand-gold" />}
      </div>
      <div className={`${emphasis ? 'text-xl sm:text-2xl' : 'text-base sm:text-xl'} break-words font-black leading-tight text-brand-text`}>{value}</div>
      <div className="flex min-h-[18px] flex-wrap items-center gap-1.5 text-[10px] font-semibold text-brand-text-muted">
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-black ${
              good === null
                ? 'bg-brand-surface-elevated text-brand-text-muted'
                : good
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}
          >
            <DeltaIcon className="h-3 w-3" />
            {formatPercent(Math.abs(change), isPersian)}
          </span>
        )}
        {hasDelta && <span>{isPersian ? 'نسبت به دوره قبل' : 'vs previous period'}</span>}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}

/** Two labelled numbers in one tile, avoiding ambiguous "a / b" ordering in RTL. */
export function ValuePair({ items }: { items: { value: string; label: string }[] }) {
  return (
    <span className="flex flex-wrap items-end gap-x-3 gap-y-1">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-baseline gap-1">
          {index > 0 && <span className="me-2 h-5 w-px self-center bg-brand-border" aria-hidden />}
          <span>{item.value}</span>
          <span className="text-[11px] font-bold text-brand-text-muted">{item.label}</span>
        </span>
      ))}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-brand-border bg-brand-surface-elevated p-1 scrollbar-none">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={`shrink-0 whitespace-nowrap rounded-full font-bold transition-colors disabled:opacity-40 ${
            size === 'sm' ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
          } ${
            value === option.value
              ? 'bg-brand-gold text-[#141914] shadow-sm'
              : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Raw value for sorting and CSV export. */
  value?: (row: T) => string | number | null | undefined;
  align?: 'start' | 'end';
  sortable?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  isPersian,
  csvName,
  empty,
  onRowClick,
  initialSort,
  maxRows,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  isPersian: boolean;
  csvName?: string;
  empty: string;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  maxRows?: number;
}) {
  const [sort, setSort] = useState(initialSort || null);
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.value) return rows;
    return [...rows].sort((a, b) => {
      const av = column.value!(a);
      const bv = column.value!(b);
      const result =
        typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'fa');
      return sort.dir === 'asc' ? result : -result;
    });
  }, [rows, columns, sort]);

  const visible = maxRows && !expanded ? sorted.slice(0, maxRows) : sorted;

  const exportCsv = () => {
    const exportable = columns.filter((column) => column.value);
    downloadCsv(
      `${csvName || 'report'}.csv`,
      exportable.map((column) => column.header),
      sorted.map((row) => exportable.map((column) => column.value!(row))),
    );
  };

  return (
    <div>
      {csvName && rows.length > 0 && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1 text-[11px] font-bold text-brand-text-muted transition-colors hover:border-brand-gold hover:text-brand-text"
          >
            <Download className="h-3.5 w-3.5" />
            {isPersian ? 'خروجی اکسل (CSV)' : 'Export CSV'}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-brand-border">
        <table className="w-full min-w-max text-xs">
          <thead className="bg-brand-surface-elevated">
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const sortable = column.sortable !== false && !!column.value;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`whitespace-nowrap px-3 py-2.5 font-bold text-brand-text-muted ${column.align === 'end' ? 'text-end' : 'text-start'}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => setSort({ key: column.key, dir: active && sort?.dir === 'desc' ? 'asc' : 'desc' })}
                        className={`inline-flex items-center gap-1 hover:text-brand-text ${active ? 'text-brand-text' : ''}`}
                      >
                        {column.header}
                        {active ? (sort?.dir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-brand-text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-t border-brand-border transition-colors hover:bg-brand-surface-elevated/60 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap px-3 py-2.5 font-semibold text-brand-text ${column.align === 'end' ? 'text-end' : 'text-start'}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {maxRows && sorted.length > maxRows && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 w-full rounded-full py-1.5 text-[11px] font-bold text-brand-bronze hover:bg-brand-surface-elevated dark:text-brand-gold"
        >
          {expanded
            ? isPersian ? 'نمایش کمتر' : 'Show less'
            : isPersian ? `نمایش همه (${sorted.length.toLocaleString('fa-IR')} ردیف)` : `Show all (${sorted.length} rows)`}
        </button>
      )}
    </div>
  );
}

export function LoadingGrid({ tiles = 8 }: { tiles?: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: tiles }, (_, index) => (
          <div key={index} className="h-[112px] animate-pulse rounded-3xl bg-brand-surface-elevated" />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-3xl bg-brand-surface-elevated" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-3xl bg-brand-surface-elevated" />
        <div className="h-[260px] animate-pulse rounded-3xl bg-brand-surface-elevated" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center">
      <Info className="h-6 w-6 text-rose-600 dark:text-rose-400" />
      <p className="text-sm font-bold text-brand-text">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-brand-gold px-5 py-2 text-xs font-black text-[#141914] hover:bg-[#d4be9b]"
      >
        {retryLabel}
      </button>
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-brand-surface-elevated px-3 py-2 text-[11px] font-medium leading-5 text-brand-text-muted">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
