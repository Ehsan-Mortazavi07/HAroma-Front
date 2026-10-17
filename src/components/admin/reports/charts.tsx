'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Dependency-free SVG charts for the admin reports. Colors come from the
 * validated `--viz-*` tokens in globals.css; text always uses brand text tokens.
 * Time flows left-to-right in both languages, as in Persian financial software.
 */

export const VIZ = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)'];
const EASE = [0.16, 1, 0.3, 1] as const;

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    setWidth(Math.floor(element.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * exponent;
}

/** Rounded so path strings never contain exponent notation, which breaks path morphing. */
const f = (value: number) => Math.round(value * 100) / 100;

/** Monotone cubic (Fritsch–Carlson) path: smooth, but never overshoots below zero or above peaks. */
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length < 3) return points.map(([x, y], index) => `${index ? 'L' : 'M'}${f(x)},${f(y)}`).join(' ');
  const n = points.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / (dx[i] || 1);
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  tangent[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = dx[i] / 3;
    d += ` C${f(x0 + third)},${f(y0 + tangent[i] * third)} ${f(x1 - third)},${f(y1 - tangent[i + 1] * third)} ${f(x1)},${f(y1)}`;
  }
  return d;
}

export function Legend({ series }: { series: ChartSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold">
      {series.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5 text-brand-text">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
          {item.name}
        </span>
      ))}
    </div>
  );
}

interface TrendChartProps {
  data: Record<string, any>[];
  xLabels: string[];
  series: ChartSeries[];
  format: (value: number) => string;
  axisFormat?: (value: number) => string;
  kind?: 'area' | 'line' | 'bar';
  stacked?: boolean;
  height?: number;
  ariaLabel: string;
  emptyLabel?: string;
}

export function TrendChart({
  data,
  xLabels,
  series,
  format,
  axisFormat = format,
  kind = 'area',
  stacked = false,
  height = 240,
  ariaLabel,
  emptyLabel,
}: TrendChartProps) {
  const [containerRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, '');
  // The entry animation plays once per chart structure. Later data changes (live refresh,
  // range switch) morph the existing shapes instead of redrawing them from scratch.
  const [introDone, setIntroDone] = useState(false);
  const lastWidth = useRef(0);
  const resizing = lastWidth.current !== 0 && lastWidth.current !== width;
  useEffect(() => {
    lastWidth.current = width;
  });
  useEffect(() => {
    if (width <= 0) return;
    const timer = window.setTimeout(() => setIntroDone(true), 1200);
    return () => window.clearTimeout(timer);
  }, [width > 0]);
  const structureKey = `${kind}-${stacked ? 's' : 'g'}-${data.length}-${series.map((item) => item.key).join('.')}`;
  const morph = { duration: reduceMotion || resizing ? 0 : 0.65, ease: EASE };

  const padding = { top: 16, right: 12, bottom: 30, left: 68 };
  const innerWidth = Math.max(10, width - padding.left - padding.right);
  const innerHeight = height - padding.top - padding.bottom;
  const count = data.length;

  const values = data.map((point) =>
    stacked
      ? series.reduce((sum, item) => sum + (Number(point[item.key]) || 0), 0)
      : Math.max(0, ...series.map((item) => Number(point[item.key]) || 0)),
  );
  const rawMax = Math.max(0, ...values);
  const isEmpty = rawMax === 0;
  // Integer series (counts) need at least 4 so the 5 gridlines get distinct whole-number labels.
  const integerData = data.every((point) => series.every((item) => Number.isInteger(Number(point[item.key]) || 0)));
  const max = integerData ? Math.max(4, niceMax(rawMax)) : niceMax(rawMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((step) => step * max);
  const y = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;

  const band = count ? innerWidth / count : innerWidth;
  const x = (index: number) =>
    kind === 'bar'
      ? padding.left + band * index + band / 2
      : count <= 1
        ? padding.left + innerWidth / 2
        : padding.left + (index / (count - 1)) * innerWidth;

  const labelEvery = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(innerWidth / 78))));

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const index =
      kind === 'bar' ? Math.floor(px / band) : count <= 1 ? 0 : Math.round((px / innerWidth) * (count - 1));
    setHover(Math.min(count - 1, Math.max(0, index)));
  };

  const barWidth = Math.max(3, Math.min(40, band * 0.6));
  const tooltipX = hover !== null ? x(hover) : 0;
  const tooltipOnLeft = tooltipX > width * 0.58;

  return (
    <div ref={containerRef} className="relative w-full select-none" dir="ltr">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          <defs>
            {series.map((item, index) => (
              <linearGradient key={item.key} id={`${gradientId}-${index}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick, index) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--viz-grid)"
                strokeWidth={1}
                strokeDasharray={index === 0 ? undefined : '3 5'}
              />
              <text x={padding.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={10} fontWeight={600} fill="var(--viz-axis)">
                {axisFormat(tick)}
              </text>
            </g>
          ))}

          {xLabels.map((text, index) =>
            // Always label the last bucket, dropping a regular label that would collide with it.
            (index % labelEvery === 0 && count - 1 - index >= Math.ceil(labelEvery * 0.7)) || index === count - 1 ? (
              <text key={index} x={x(index)} y={height - 8} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--viz-axis)">
                {text}
              </text>
            ) : null,
          )}

          {kind === 'bar' && hover !== null && (
            <rect
              x={padding.left + band * hover + 2}
              y={padding.top}
              width={Math.max(0, band - 4)}
              height={innerHeight}
              rx={8}
              fill="var(--brand-text)"
              opacity={0.05}
            />
          )}

          {kind === 'bar' && !isEmpty && (
            <g key={structureKey}>
              {data.map((point, index) => {
                let base = 0;
                const stackTotal = values[index];
                return series.map((item, seriesIndex) => {
                  const value = Number(point[item.key]) || 0;
                  if (value <= 0) return null;
                  const widthEach = stacked ? barWidth : Math.max(2, barWidth / series.length - 2);
                  const offset = stacked ? 0 : (seriesIndex - (series.length - 1) / 2) * (widthEach + 2);
                  const top = y((stacked ? base : 0) + value);
                  const bottom = y(stacked ? base : 0);
                  if (stacked) base += value;
                  const isTop = !stacked || Math.abs(base - stackTotal) < 1e-9;
                  const gap = stacked && seriesIndex > 0 ? 2 : 0;
                  const h = Math.max(1.5, bottom - top - gap);
                  const left = x(index) + offset - widthEach / 2;
                  const r = isTop ? Math.min(5, widthEach / 2, h) : 0;
                  const shape = (barTop: number, barHeight: number, radius: number) =>
                    `M${f(left)},${f(barTop + barHeight)} V${f(barTop + radius)} Q${f(left)},${f(barTop)} ${f(left + radius)},${f(barTop)} H${f(left + widthEach - radius)} Q${f(left + widthEach)},${f(barTop)} ${f(left + widthEach)},${f(barTop + radius)} V${f(barTop + barHeight)} Z`;
                  const settled = shape(top, h, r);
                  const flat = shape(top + h - 1, 1, Math.min(r, 0.5));
                  return (
                    <motion.path
                      key={`${index}-${item.key}`}
                      fill={item.color}
                      initial={reduceMotion ? false : { d: flat }}
                      animate={{ d: settled }}
                      transition={{ ...morph, delay: introDone || reduceMotion ? 0 : Math.min(0.4, index * 0.025) }}
                      style={{ opacity: hover === null || hover === index ? 1 : 0.4, transition: 'opacity 150ms ease' }}
                    />
                  );
                });
              })}
            </g>
          )}

          {kind !== 'bar' && !isEmpty && (
            <g key={structureKey}>
              {series.map((item, seriesIndex) => {
                const points = data.map((point, index) => [x(index), y(Number(point[item.key]) || 0)] as [number, number]);
                if (!points.length) return null;
                const flatPoints = points.map(([px]) => [px, y(0)] as [number, number]);
                const closeArea = (path: string, list: [number, number][]) =>
                  `${path} L${f(list[list.length - 1][0])},${f(y(0))} L${f(list[0][0])},${f(y(0))} Z`;
                const line = smoothPath(points);
                const flatLine = smoothPath(flatPoints);
                return (
                  <g key={item.key}>
                    {kind === 'area' && (
                      <motion.path
                        fill={`url(#${gradientId}-${seriesIndex})`}
                        initial={reduceMotion ? false : { d: closeArea(flatLine, flatPoints), opacity: 0 }}
                        animate={{ d: closeArea(line, points), opacity: 1 }}
                        transition={{ d: { ...morph, delay: introDone ? 0 : seriesIndex * 0.06 }, opacity: { duration: 0.6 } }}
                      />
                    )}
                    <motion.path
                      fill="none"
                      stroke={item.color}
                      strokeWidth={2.25}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      initial={reduceMotion ? false : { d: flatLine }}
                      animate={{ d: line }}
                      transition={{ ...morph, delay: introDone || reduceMotion ? 0 : seriesIndex * 0.06 }}
                    />
                    {count <= 1 && <circle cx={points[0][0]} cy={points[0][1]} r={4} fill={item.color} />}
                  </g>
                );
              })}
            </g>
          )}

          {hover !== null && kind !== 'bar' && !isEmpty && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={padding.top} y2={padding.top + innerHeight} stroke="var(--viz-axis)" strokeOpacity={0.6} strokeDasharray="3 3" />
              {series.map((item) => (
                <circle
                  key={item.key}
                  cx={x(hover)}
                  cy={y(Number(data[hover]?.[item.key]) || 0)}
                  r={5}
                  fill={item.color}
                  stroke="var(--brand-surface)"
                  strokeWidth={2.5}
                />
              ))}
            </g>
          )}

          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onPointerMove={isEmpty ? undefined : onPointerMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}

      {isEmpty && width > 0 && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: padding.top + innerHeight / 2 - 14 }}>
          <span dir="auto" className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] font-bold text-brand-text-muted">
            {emptyLabel || '—'}
          </span>
        </div>
      )}

      {hover !== null && data[hover] && (
        <div
          dir="auto"
          style={tooltipOnLeft ? { right: width - tooltipX + 14 } : { left: tooltipX + 14 }}
          className="pointer-events-none absolute top-1 z-10 min-w-[170px] rounded-2xl border border-brand-border bg-brand-surface/95 px-3 py-2.5 text-[11px] shadow-xl backdrop-blur"
        >
          <div className="mb-1.5 font-black text-brand-text">{xLabels[hover]}</div>
          <div className="space-y-1">
            {series.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-text-muted">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="font-black text-brand-text">{format(Number(data[hover][item.key]) || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface DonutSlice {
  key: string;
  name: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  format,
  centerLabel,
  size = 172,
  isPersian = false,
}: {
  slices: DonutSlice[];
  format: (value: number) => string;
  centerLabel: string;
  size?: number;
  isPersian?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const thickness = 20;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = slices.filter((slice) => slice.value > 0);
  const gap = visible.length > 1 ? 3 : 0;
  const active = slices.find((slice) => slice.key === hover);
  const percent = (value: number) => {
    const rounded = total ? Math.round((value / total) * 100) : 0;
    return isPersian ? `${rounded.toLocaleString('fa-IR')}٪` : `${rounded}%`;
  };

  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--viz-grid)" strokeWidth={thickness} />
          {total > 0 &&
            visible.map((slice, index) => {
              const length = (slice.value / total) * circumference;
              const dash = Math.max(0.5, length - gap);
              const start = offset;
              offset += length;
              return (
                <motion.circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={hover === slice.key ? thickness + 4 : thickness}
                  strokeLinecap="butt"
                  strokeDashoffset={-start}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${dash} ${circumference - dash}`, opacity: hover === null || hover === slice.key ? 1 : 0.35 }}
                  transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : index * 0.12, ease: EASE }}
                  onPointerEnter={() => setHover(slice.key)}
                  onPointerLeave={() => setHover(null)}
                  style={{ cursor: 'default' }}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="line-clamp-1 text-[10px] font-bold text-brand-text-muted">{active ? active.name : centerLabel}</span>
          <span className="text-base font-black text-brand-text">{format(active ? active.value : total)}</span>
          {active && <span className="text-[10px] font-bold text-brand-text-muted">{percent(active.value)}</span>}
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1 text-xs">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className={`flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 transition-colors ${hover === slice.key ? 'bg-brand-surface-elevated' : ''}`}
            onPointerEnter={() => setHover(slice.key)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-brand-text">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2">
              <span className="font-black text-brand-text">{format(slice.value)}</span>
              <span className="min-w-[38px] rounded-full bg-brand-surface-elevated px-1.5 py-0.5 text-center text-[10px] font-bold text-brand-text-muted">
                {total ? percent(slice.value) : '—'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface BarListItem {
  key: string;
  label: React.ReactNode;
  value: number;
  display?: string;
  sub?: string;
  onClick?: () => void;
}

export function BarList({ items, format, empty }: { items: BarListItem[]; format: (value: number) => string; empty: string }) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(1, ...items.map((item) => item.value));
  if (!items.length) return <p className="py-8 text-center text-xs font-semibold text-brand-text-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => {
        const content = (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-semibold text-brand-text">{item.label}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <span className="font-black text-brand-text">{item.display ?? format(item.value)}</span>
                {item.sub && (
                  <span className="rounded-full bg-brand-surface-elevated px-1.5 py-0.5 text-[10px] font-bold text-brand-text-muted">{item.sub}</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-surface-elevated">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--viz-1)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : index * 0.04, ease: EASE }}
              />
            </div>
          </>
        );
        return (
          <li key={item.key}>
            {item.onClick ? (
              <button type="button" onClick={item.onClick} className="w-full rounded-xl px-1.5 py-1 text-start transition-colors hover:bg-brand-surface-elevated/70">
                {content}
              </button>
            ) : (
              <div className="px-1.5 py-1">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Heatmap({
  matrix,
  rowLabels,
  format,
  isPersian,
}: {
  matrix: number[][];
  rowLabels: string[];
  format: (value: number) => string;
  isPersian: boolean;
}) {
  const [hover, setHover] = useState<{ row: number; hour: number } | null>(null);
  const max = Math.max(1, ...matrix.flat());
  const hourLabel = (hour: number) => (isPersian ? hour.toLocaleString('fa-IR') : String(hour));
  const cellColor = (value: number) =>
    value
      ? `color-mix(in srgb, var(--viz-1) ${Math.round(18 + (value / max) * 82)}%, var(--brand-surface-elevated))`
      : 'var(--brand-surface-elevated)';

  return (
    <div>
      <div className="grid items-center gap-[3px]" style={{ gridTemplateColumns: 'auto repeat(24, minmax(0, 1fr))' }} dir="ltr">
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className="text-center text-[9px] font-semibold text-brand-text-muted">
            {hour % 3 === 0 ? hourLabel(hour) : ''}
          </span>
        ))}
        {matrix.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <span className="whitespace-nowrap pe-2 text-end text-[10px] font-bold text-brand-text-muted" dir="auto">
              {rowLabels[rowIndex]}
            </span>
            {row.map((value, hour) => {
              const active = hover?.row === rowIndex && hover?.hour === hour;
              return (
                <motion.span
                  key={hour}
                  className="aspect-square min-h-[10px] rounded-[4px]"
                  style={{ background: cellColor(value), outline: active ? '2px solid var(--brand-text)' : 'none', outlineOffset: 1 }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: (rowIndex * 24 + hour) * 0.002 }}
                  onPointerEnter={() => setHover({ row: rowIndex, hour })}
                  onPointerLeave={() => setHover(null)}
                  aria-label={`${rowLabels[rowIndex]} ${hourLabel(hour)}: ${format(value)}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-brand-text-muted">
        <span dir="auto" className="min-h-[16px] font-bold text-brand-text">
          {hover
            ? `${rowLabels[hover.row]} · ${isPersian ? `ساعت ${hourLabel(hover.hour)}` : `${hover.hour}:00`} — ${format(matrix[hover.row][hover.hour])}`
            : <span className="font-semibold text-brand-text-muted">{isPersian ? 'برای دیدن جزئیات روی خانه‌ها بروید' : 'Hover a cell for details'}</span>}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {isPersian ? 'کم' : 'Low'}
          {[18, 45, 72, 100].map((step) => (
            <span key={step} className="h-2.5 w-4 rounded-[3px]" style={{ background: `color-mix(in srgb, var(--viz-1) ${step}%, var(--brand-surface-elevated))` }} />
          ))}
          {isPersian ? 'زیاد' : 'High'}
        </span>
      </div>
    </div>
  );
}

export function Funnel({
  steps,
  format,
  isPersian,
}: {
  steps: { key: string; label: string; value: number }[];
  format: (value: number) => string;
  isPersian: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const first = steps[0]?.value || 0;
  const pct = (value: number) => (isPersian ? `${value.toLocaleString('fa-IR')}٪` : `${value}%`);
  return (
    <ol className="space-y-3.5">
      {steps.map((step, index) => {
        const previous = index ? steps[index - 1].value : step.value;
        const fromPrevious = previous ? Math.round((step.value / previous) * 1000) / 10 : 0;
        const fromStart = first ? (step.value / first) * 100 : 0;
        return (
          <li key={step.key}>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-2 font-bold text-brand-text">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-surface-elevated text-[10px] font-black text-brand-text-muted">
                  {isPersian ? (index + 1).toLocaleString('fa-IR') : index + 1}
                </span>
                {step.label}
              </span>
              <span className="inline-flex items-center gap-2">
                {index > 0 && (
                  <span className="rounded-full bg-brand-surface-elevated px-2 py-0.5 text-[10px] font-bold text-brand-text-muted">
                    {isPersian ? `${pct(fromPrevious)} از مرحله قبل` : `${pct(fromPrevious)} of previous`}
                  </span>
                )}
                <span className="min-w-[28px] text-end text-sm font-black text-brand-text">{format(step.value)}</span>
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-brand-surface-elevated">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `color-mix(in srgb, var(--viz-1) ${100 - index * 15}%, var(--brand-surface-elevated))` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(step.value ? 1.5 : 0, fromStart)}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : index * 0.1, ease: EASE }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
