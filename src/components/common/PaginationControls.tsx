'use client';

import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toPersianDigits } from '@/common/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  isPersian: boolean;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return pages.reduce<Array<number | 'ellipsis'>>((result, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      result.push('ellipsis');
    }
    result.push(page);
    return result;
  }, []);
}

export function PaginationControls({
  currentPage,
  totalPages,
  isPersian,
  onPageChange,
  ariaLabel,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const previousPageLabel = isPersian ? 'صفحه قبلی' : 'Previous page';
  const nextPageLabel = isPersian ? 'صفحه بعدی' : 'Next page';
  const PreviousIcon = isPersian ? ChevronRight : ChevronLeft;
  const NextIcon = isPersian ? ChevronLeft : ChevronRight;
  const pageItems = getVisiblePages(currentPage, totalPages);

  const controlClassName =
    'min-w-10 h-10 rounded-xl border border-brand-border bg-brand-surface text-brand-text shadow-xs transition-colors hover:bg-brand-surface-elevated disabled:opacity-40';

  return (
    <nav
      aria-label={ariaLabel || (isPersian ? 'صفحه‌بندی' : 'Pagination')}
      dir={isPersian ? 'rtl' : 'ltr'}
      className="flex items-center gap-1.5"
    >
      <Button
        isIconOnly
        size="sm"
        radius="lg"
        variant="bordered"
        isDisabled={currentPage <= 1}
        onPress={() => onPageChange(currentPage - 1)}
        aria-label={previousPageLabel}
        title={previousPageLabel}
        className={controlClassName}
      >
        <PreviousIcon className="h-4 w-4" aria-hidden="true" />
      </Button>

      {pageItems.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="flex h-10 min-w-6 items-center justify-center text-sm font-bold text-brand-text-muted"
          >
            …
          </span>
        ) : (
          <Button
            key={page}
            size="sm"
            radius="lg"
            variant={page === currentPage ? 'solid' : 'bordered'}
            aria-label={isPersian ? `صفحه ${toPersianDigits(page)}` : `Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            onPress={() => onPageChange(page)}
            className={
              page === currentPage
                ? 'min-w-10 h-10 rounded-xl border border-brand-gold bg-brand-gold px-3 text-sm font-black text-[#141914] shadow-sm shadow-brand-gold/30 ring-1 ring-brand-gold/25'
                : `${controlClassName} px-3 text-sm font-bold`
            }
          >
            {isPersian ? toPersianDigits(page) : page}
          </Button>
        ),
      )}

      <Button
        isIconOnly
        size="sm"
        radius="lg"
        variant="bordered"
        isDisabled={currentPage >= totalPages}
        onPress={() => onPageChange(currentPage + 1)}
        aria-label={nextPageLabel}
        title={nextPageLabel}
        className={controlClassName}
      >
        <NextIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
