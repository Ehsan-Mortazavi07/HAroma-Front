'use client';

import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { ICategory } from '@/common/interfaces';

const ROOT_CATEGORY = '__root_category__';

const softDropdownMotionProps = {
  variants: {
    initial: { opacity: 0, y: -10, scale: 0.98 },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        y: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
        scale: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
        opacity: { duration: 0.26, ease: 'easeOut' as const },
      },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.98,
      transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] as const },
    },
  },
};

interface CategoryParentSelectProps {
  categories: ICategory[];
  selectedId: string;
  onChange: (categoryId: string) => void;
  isPersian: boolean;
  isRTL: boolean;
  excludedIds?: ReadonlySet<string>;
}

export function CategoryParentSelect({
  categories,
  selectedId,
  onChange,
  isPersian,
  isRTL,
  excludedIds,
}: CategoryParentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootLabel = isPersian ? 'دسته‌بندی سطح اصلی (بدون والد)' : 'Main category (no parent)';
  const options = [
    { key: ROOT_CATEGORY, label: rootLabel },
    ...categories
      .filter((category) => !excludedIds?.has(category._id))
      .map((category) => ({
        key: category._id,
        label: isPersian ? category.name : category.nameEn || category.name,
      })),
  ];
  const selectedOption = options.find(
    (option) => option.key === (selectedId || ROOT_CATEGORY),
  ) ?? options[0];

  return (
    <div className="w-full space-y-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="text-xs font-bold text-brand-text">
        {isPersian ? 'دسته والد (اختیاری برای ساب‌کتگوری)' : 'Parent category (optional)'}
      </p>
      <Dropdown
        placement="bottom-end"
        offset={8}
        shouldBlockScroll={false}
        onOpenChange={setIsOpen}
        motionProps={softDropdownMotionProps}
        classNames={{
          base: 'p-0',
          content:
            'z-[10020] min-w-[min(20rem,calc(100vw-2rem))] p-1.5 bg-brand-surface/98 dark:bg-[#161c16]/98 backdrop-blur-2xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-xl will-change-transform',
        }}
      >
        <DropdownTrigger>
          <Button
            type="button"
            radius="full"
            variant="bordered"
            dir={isRTL ? 'rtl' : 'ltr'}
            aria-label={isPersian ? 'انتخاب دسته والد' : 'Choose parent category'}
            aria-expanded={isOpen}
            className={`h-11 w-full min-w-0 justify-between gap-3 rounded-full border px-4 text-xs font-bold text-brand-text shadow-xs transition-all duration-200 active:scale-[0.98] ${
              isOpen
                ? 'border-brand-gold/70 bg-brand-surface-elevated'
                : 'border-brand-border bg-brand-surface-elevated/80 hover:border-brand-gold/70 hover:bg-brand-surface-elevated'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-brand-gold" />
              <span className="truncate text-start">{selectedOption.label}</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-brand-text-muted transition-transform duration-300 ease-out ${
                isOpen ? 'rotate-180 text-brand-gold' : ''
              }`}
            />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={isPersian ? 'گزینه‌های دسته والد' : 'Parent category options'}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="admin-category-parent-menu max-h-[min(22.5rem,55vh)] overflow-y-auto overscroll-contain p-1"
          onAction={(key) => onChange(key === ROOT_CATEGORY ? '' : String(key))}
        >
          {options.map((option) => {
            const isSelected = option.key === (selectedId || ROOT_CATEGORY);
            return (
              <DropdownItem
                key={option.key}
                textValue={option.label}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-150 ${
                  isSelected
                    ? 'bg-brand-gold/15 font-bold text-brand-gold'
                    : 'font-medium text-brand-text hover:bg-brand-surface-elevated'
                }`}
                endContent={
                  isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-brand-gold" /> : null
                }
              >
                <span className="truncate">{option.label}</span>
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
