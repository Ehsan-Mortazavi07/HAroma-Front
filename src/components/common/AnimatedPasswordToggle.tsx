'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface AnimatedPasswordToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  className?: string;
}

export function AnimatedPasswordToggle({
  isVisible,
  onToggle,
  ariaLabel = 'تغییر نمایش کلمه عبور',
  className = '',
}: AnimatedPasswordToggleProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`text-brand-text-muted hover:text-brand-gold focus:outline-none cursor-pointer p-1.5 rounded-xl relative z-10 flex items-center justify-center transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isVisible ? (
          <motion.span
            key="eye-off"
            initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 25 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center justify-center text-brand-gold"
          >
            <EyeOff className="w-4 h-4 pointer-events-none" />
          </motion.span>
        ) : (
          <motion.span
            key="eye"
            initial={{ opacity: 0, scale: 0.6, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: -25 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center justify-center text-brand-text-muted hover:text-brand-gold"
          >
            <Eye className="w-4 h-4 pointer-events-none" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
