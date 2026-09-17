'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SmoothSwitchProps {
  isSelected: boolean;
  onValueChange: (val: boolean) => void;
  children?: React.ReactNode;
  ariaLabel?: string;
  isRtl?: boolean;
}

/**
 * Shared SmoothSwitch for the admin panel.
 * Uses spring physics so the thumb slides smoothly in both RTL and LTR.
 * Replaces HeroUI <Switch> whose thumb class (group-data-[selected=true]:ms-5)
 * is not compiled by Tailwind v4 from node_modules.
 */
export function SmoothSwitch({
  isSelected,
  onValueChange,
  children,
  ariaLabel,
}: SmoothSwitchProps) {
  return (
    <label
      className="flex items-center gap-2.5 cursor-pointer select-none group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="switch"
        dir="ltr"
        aria-checked={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          onValueChange(!isSelected);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-250 focus-visible:outline-2 focus-visible:outline-brand-gold shadow-2xs ${
          isSelected
            ? 'bg-emerald-500 dark:bg-emerald-600 shadow-sm shadow-emerald-500/20'
            : 'bg-[#ded6c8] dark:bg-[#2e3a2e]'
        }`}
      >
        <motion.span
          animate={{ x: isSelected ? 20 : 0 }}
          transition={{
            type: 'spring',
            stiffness: 520,
            damping: 32,
          }}
          className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md"
        />
      </button>
      {children && (
        <span className="text-xs font-bold text-brand-text group-hover:text-brand-bronze dark:group-hover:text-brand-gold transition-colors">
          {children}
        </span>
      )}
    </label>
  );
}
