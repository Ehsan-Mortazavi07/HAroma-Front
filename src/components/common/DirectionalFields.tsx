'use client';

import React from 'react';
import { Input as HeroInput, Textarea as HeroTextarea } from '@heroui/react';

type TextDirection = 'auto' | 'ltr' | 'rtl';
type InputProps = React.ComponentPropsWithoutRef<typeof HeroInput>;
type TextareaProps = React.ComponentPropsWithoutRef<typeof HeroTextarea>;

function firstStrongDirection(text: string): Exclude<TextDirection, 'auto'> | undefined {
  for (const character of text) {
    if (/[\u05d0-\u05ea\u0620-\u064a\u066e-\u06d3\u0750-\u077f\u08a0-\u08c9\ufb1d-\ufdff\ufe70-\ufefc]/u.test(character)) {
      return 'rtl';
    }
    if (/[a-z\u00c0-\u02af]/iu.test(character)) return 'ltr';
  }

  return undefined;
}

function resolveDirection(
  direction: TextDirection | undefined,
  value: unknown,
  defaultValue: unknown,
  placeholder: unknown,
): TextDirection | undefined {
  if (direction === 'ltr' || direction === 'rtl') return direction;

  const hasControlledValue = value !== undefined && value !== null;
  const currentValue = hasControlledValue ? value : defaultValue;
  const currentText = currentValue === undefined || currentValue === null ? '' : String(currentValue);
  const placeholderText = placeholder === undefined || placeholder === null ? '' : String(placeholder);

  if (currentText.trim()) {
    if (!hasControlledValue) return direction ?? 'auto';
    return firstStrongDirection(currentText) ?? firstStrongDirection(placeholderText) ?? direction ?? 'auto';
  }

  return firstStrongDirection(placeholderText) ?? direction;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function DirectionalInput(props, ref) {
  const dir = resolveDirection(props.dir, props.value, props.defaultValue, props.placeholder);

  return <HeroInput {...props} dir={dir} ref={ref} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function DirectionalTextarea(props, ref) {
  const dir = resolveDirection(props.dir, props.value, props.defaultValue, props.placeholder);

  return <HeroTextarea {...props} dir={dir} ref={ref} />;
});
