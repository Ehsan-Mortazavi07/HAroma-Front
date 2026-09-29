'use client';

import {
  Pagination,
  PaginationItem,
  type PaginationItemRenderProps,
} from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toPersianDigits } from '@/common/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  isPersian: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  ariaLabel?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  isPersian,
  onPageChange,
  isLoading = false,
  ariaLabel,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const previousPageLabel = isPersian ? 'صفحه قبلی' : 'Previous page';
  const nextPageLabel = isPersian ? 'صفحه بعدی' : 'Next page';
  const PreviousIcon = isPersian ? ChevronRight : ChevronLeft;
  const NextIcon = isPersian ? ChevronLeft : ChevronRight;

  const renderItem = (item: PaginationItemRenderProps) => {
    const isPrevious = item.value === 'prev';
    const isNext = item.value === 'next';
    const isEllipsis = item.value === 'dots';
    const isDisabled =
      isLoading ||
      (isPrevious && currentPage <= 1) ||
      (isNext && currentPage >= totalPages);
    const label = isPrevious
      ? previousPageLabel
      : isNext
        ? nextPageLabel
        : isEllipsis
          ? isPersian
            ? `رفتن به صفحه ${toPersianDigits(item.page)}`
            : `Jump to page ${item.page}`
          : isPersian
            ? `صفحه ${toPersianDigits(item.page)}`
            : `Page ${item.page}`;

    return (
      <PaginationItem
        key={item.key}
        ref={item.ref}
        value={item.value}
        isActive={item.isActive}
        isDisabled={isDisabled}
        onPress={item.onPress}
        getAriaLabel={() => label}
        className={`flex h-10 min-w-10 cursor-pointer select-none items-center justify-center rounded-xl border px-3 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
          item.isActive
            ? 'border-brand-gold bg-brand-gold text-[#141914] shadow-sm shadow-brand-gold/25'
            : 'border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-elevated'
        } ${isDisabled ? 'pointer-events-none opacity-40' : ''}`}
      >
        {isPrevious ? (
          <PreviousIcon className="h-4 w-4" aria-hidden="true" />
        ) : isNext ? (
          <NextIcon className="h-4 w-4" aria-hidden="true" />
        ) : isEllipsis ? (
          <span aria-hidden="true">…</span>
        ) : (
          <span>{isPersian ? toPersianDigits(item.page) : item.page}</span>
        )}
      </PaginationItem>
    );
  };

  return (
    <Pagination
      aria-label={ariaLabel || (isPersian ? 'صفحه‌بندی' : 'Pagination')}
      dir={isPersian ? 'rtl' : 'ltr'}
      total={totalPages}
      page={currentPage}
      onChange={onPageChange}
      showControls
      siblings={1}
      boundaries={1}
      renderItem={renderItem}
      classNames={{
        base: 'max-w-full',
        wrapper: 'relative flex items-center gap-1.5 p-0',
        cursor: 'rounded-xl bg-brand-gold shadow-sm shadow-brand-gold/25',
      }}
    />
  );
}
