'use client';

import React from 'react';
import { Input } from '@/components/common/DirectionalFields';
import { AnimatedPasswordToggle } from '@/components/common/AnimatedPasswordToggle';

type BaseInputProps = React.ComponentProps<typeof Input>;

interface PasswordInputProps extends Omit<BaseInputProps, 'dir' | 'type' | 'endContent'> {
  isPersian: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
  toggleAriaLabel?: string;
}

export function PasswordInput({
  isPersian,
  isVisible,
  onToggleVisibility,
  toggleAriaLabel,
  value,
  defaultValue,
  onChange,
  onValueChange,
  ...props
}: PasswordInputProps) {
  const hasValue = String(value ?? defaultValue ?? '').length > 0;
  const shouldShowValue = hasValue && isVisible;
  const handleValueChange = (nextValue: string) => {
    if (!nextValue && isVisible) onToggleVisibility();
    onValueChange?.(nextValue);
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onValueChange && !event.currentTarget.value && isVisible) onToggleVisibility();
    onChange?.(event);
  };

  return (
    <Input
      {...props}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? handleChange : undefined}
      onValueChange={onValueChange ? handleValueChange : undefined}
      dir={isPersian ? 'rtl' : 'ltr'}
      type={shouldShowValue ? 'text' : 'password'}
      endContent={
        hasValue ? (
          <AnimatedPasswordToggle
            isVisible={shouldShowValue}
            onToggle={onToggleVisibility}
            ariaLabel={toggleAriaLabel || (isPersian ? 'تغییر نمایش کلمه عبور' : 'Toggle password visibility')}
          />
        ) : null
      }
    />
  );
}
