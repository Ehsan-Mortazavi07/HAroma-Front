'use client';

import React, { useState, useEffect } from 'react';
import { Input, InputProps } from '@heroui/react';
import { toEnglishDigits, toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export interface AdminPriceInputProps extends Omit<InputProps, 'value' | 'onChange' | 'onValueChange' | 'errorMessage'> {
  value: number | string | undefined | null;
  onValueChange?: (value: number) => void;
  onChange?: (e: any) => void;
  label?: string;
  showWords?: boolean;
  currencyLabel?: string;
  min?: number;
  max?: number;
  errorMessage?: React.ReactNode;
}

export const AdminPriceInput: React.FC<AdminPriceInputProps> = ({
  value,
  onValueChange,
  onChange,
  label,
  showWords,
  currencyLabel,
  placeholder,
  isRequired,
  isInvalid,
  errorMessage,
  className,
  classNames,
  isDisabled,
  ...rest
}) => {
  const { isPersian, isRTL } = useTranslation();

  // Parse numeric value safely
  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = toEnglishDigits(String(val)).replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  const numericValue = parseNum(value);

  // Format number with standard commas (e.g. 290,000 or ۲۹۰,۰۰۰)
  const formatDisplay = (num: number, hasInput: boolean): string => {
    if (!hasInput || num === 0) {
      if (value === 0 || value === '0') {
        return isPersian ? '۰' : '0';
      }
      return '';
    }
    const enFormatted = num.toLocaleString('en-US');
    return isPersian ? toPersianDigits(enFormatted) : enFormatted;
  };

  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatDisplay(numericValue, value !== undefined && value !== null && value !== '')
  );

  useEffect(() => {
    const nextNum = parseNum(value);
    const hasInput = value !== undefined && value !== null && value !== '';
    setDisplayValue(formatDisplay(nextNum, hasInput));
  }, [value, isPersian]);

  const handleInputChange = (rawInput: string) => {
    const cleanDigits = toEnglishDigits(rawInput).replace(/[^0-9]/g, '');
    const nextNum = cleanDigits === '' ? 0 : parseInt(cleanDigits, 10);

    if (cleanDigits === '') {
      setDisplayValue('');
    } else {
      const enFormatted = nextNum.toLocaleString('en-US');
      setDisplayValue(isPersian ? toPersianDigits(enFormatted) : enFormatted);
    }

    if (onValueChange) {
      onValueChange(nextNum);
    }
    if (onChange) {
      onChange(nextNum);
    }
  };

  const defaultWrapperClass = isInvalid
    ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors'
    : 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold hover:!border-[#d4be9b] rounded-2xl shadow-xs transition-colors';
  const defaultInputClass = 'text-sm font-bold text-brand-text text-start font-mono';
  const defaultLabelClass = `text-xs font-bold text-brand-text mb-1.5 block ${
    isRTL ? 'text-right' : 'text-left'
  }`;

  return (
    <div>
      <Input
        type="text"
        inputMode="numeric"
        variant="bordered"
        label={label}
        labelPlacement="outside-top"
        placeholder={placeholder || (isPersian ? 'مثال: ۵۰۰,۰۰۰' : 'e.g. 500,000')}
        value={displayValue}
        onValueChange={handleInputChange}
        isRequired={isRequired}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        className={className}
        classNames={{
          label: defaultLabelClass,
          inputWrapper: defaultWrapperClass,
          input: defaultInputClass,
          ...classNames,
        }}
        {...rest}
      />
      {isInvalid && errorMessage && (
        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
