'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

export interface SmoothCheckboxProps {
  isSelected?: boolean;
  isIndeterminate?: boolean;
  onValueChange?: (val: boolean) => void;
  children?: React.ReactNode;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  className?: string;
}

/**
 * Shared SmoothCheckbox for the admin panel & store.
 * Built with HeroUI minimal luxury design language:
 * - Perfectly curved corners (rounded-[7px])
 * - Apple-grade fluid spring animations for check/indeterminate states
 * - High-contrast gold & charcoal active states
 * - Fully accessible keyboard navigation (Space / Enter)
 */
export function SmoothCheckbox({
  isSelected = false,
  isIndeterminate = false,
  onValueChange,
  children,
  ariaLabel,
  size = 'md',
  isDisabled = false,
  className = '',
}: SmoothCheckboxProps) {
  const isChecked = isSelected || isIndeterminate;

  const sizeClasses = {
    sm: {
      box: 'w-[18px] h-[18px] rounded-[6px]',
      icon: 'w-3 h-3',
      stroke: 2.6,
    },
    md: {
      box: 'w-5 h-5 rounded-[7px]',
      icon: 'w-3.5 h-3.5',
      stroke: 3,
    },
    lg: {
      box: 'w-6 h-6 rounded-lg',
      icon: 'w-4 h-4',
      stroke: 3.2,
    },
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (onValueChange) {
      onValueChange(!isSelected);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (onValueChange) {
        onValueChange(!isSelected);
      }
    }
  };

  return (
    <label
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group tap-highlight-transparent ${
        isDisabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''
      } ${className}`}
      aria-label={ariaLabel}
    >
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={isIndeterminate ? 'mixed' : isSelected}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onKeyDown={handleKeyDown}
        whileTap={isDisabled ? undefined : { scale: 0.88 }}
        className={`relative shrink-0 flex items-center justify-center cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2 border-[1.5px] ${
          sizeClasses.box
        } ${
          isChecked
            ? 'bg-brand-gold border-brand-gold text-[#141914] shadow-xs shadow-brand-gold/30'
            : 'bg-brand-surface border-[#ded6c8] dark:border-[#2e3a2e] group-hover:border-brand-gold/80 group-hover:bg-brand-gold/5'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isSelected ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 560,
                damping: 32,
              }}
              className="flex items-center justify-center pointer-events-none"
            >
              <Check
                className={`${sizeClasses.icon} text-[#141914]`}
                strokeWidth={sizeClasses.stroke}
              />
            </motion.div>
          ) : isIndeterminate ? (
            <motion.div
              key="minus"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 560,
                damping: 32,
              }}
              className="flex items-center justify-center pointer-events-none"
            >
              <Minus
                className={`${sizeClasses.icon} text-[#141914]`}
                strokeWidth={sizeClasses.stroke + 0.5}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.button>

      {children && (
        <span className="text-xs font-semibold text-brand-text group-hover:text-brand-bronze dark:group-hover:text-brand-gold transition-colors">
          {children}
        </span>
      )}
    </label>
  );
}
