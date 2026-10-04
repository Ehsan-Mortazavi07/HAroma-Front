'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import type { IOrder } from '@/common/interfaces';
import { getOrderStatusLabel } from '@/components/common/OrderDetailsPanel';

type OrderStatusValue = IOrder['status'] | '';

interface OrderStatusSelectProps {
  value: OrderStatusValue;
  onChange: (value: OrderStatusValue) => void;
  isPersian: boolean;
  includeAll?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  compact?: boolean;
  ariaLabel?: string;
}

const statusIcons = {
  '': Filter,
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
} as const;

const statusColors = {
  '': 'text-brand-text-muted',
  pending: 'text-amber-500',
  processing: 'text-blue-500',
  shipped: 'text-purple-500',
  delivered: 'text-emerald-500',
  cancelled: 'text-rose-500',
} as const;

const orderStatuses: IOrder['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function OrderStatusSelect({
  value,
  onChange,
  isPersian,
  includeAll = false,
  disabled = false,
  loading = false,
  className = '',
  compact = false,
  ariaLabel,
}: OrderStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: OrderStatusValue[] = includeAll ? ['', ...orderStatuses] : orderStatuses;
  const selectedValue = options.includes(value) ? value : (includeAll ? '' : 'pending');
  const SelectedIcon = statusIcons[selectedValue];
  const label = selectedValue
    ? getOrderStatusLabel(selectedValue, isPersian)
    : (isPersian ? 'همه وضعیت‌ها' : 'All statuses');

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel || label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-2 rounded-full border bg-brand-surface-elevated text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? 'h-9 min-h-9 px-3' : 'h-11 min-h-11 px-4'
        } ${
          isOpen
            ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-xs'
            : 'border-brand-border hover:border-brand-gold/70 shadow-xs'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {loading ? (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand-gold/30 border-t-brand-gold" aria-hidden="true" />
          ) : (
            <SelectedIcon className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} shrink-0 ${statusColors[selectedValue]}`} />
          )}
          <span className={`truncate font-bold text-brand-text ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {label}
          </span>
        </span>
        <ChevronDown
          className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 text-brand-bronze transition-transform duration-200 dark:text-brand-gold ${isOpen ? 'rotate-180 text-brand-gold' : 'opacity-70'}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            aria-label={ariaLabel || (isPersian ? 'وضعیت سفارش' : 'Order status')}
            className="absolute right-0 top-full z-[80] mt-2 max-h-64 w-full min-w-52 space-y-1 overflow-y-auto rounded-2xl border border-brand-border bg-brand-surface p-1.5 shadow-2xl"
          >
            {options.map((option) => {
              const OptionIcon = statusIcons[option];
              const optionLabel = option
                ? getOrderStatusLabel(option, isPersian)
                : (isPersian ? 'همه وضعیت‌ها' : 'All statuses');
              const isSelected = option === selectedValue;
              return (
                <button
                  key={option || 'all'}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start transition-colors ${compact ? 'text-[10px]' : 'text-xs'} font-bold ${
                    isSelected
                      ? 'bg-brand-gold text-[#141914]'
                      : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <OptionIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[#141914]' : statusColors[option]}`} />
                    <span className="truncate">{optionLabel}</span>
                  </span>
                  {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#141914]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
