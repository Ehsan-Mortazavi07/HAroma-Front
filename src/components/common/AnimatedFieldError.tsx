'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedFieldErrorProps {
  error?: string | boolean | null;
  className?: string;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export function AnimatedFieldError({ error, className = '', extra, children }: AnimatedFieldErrorProps) {
  const isVisible = Boolean(error);

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{
            opacity: 1,
            height: 'auto',
            marginTop: 6,
            transition: {
              height: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.18, delay: 0.04 },
            },
          }}
          exit={{
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: {
              opacity: { duration: 0.12 },
              height: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
            },
          }}
          className="overflow-hidden"
        >
          {children || (
            <div className="space-y-1.5">
              <p className={`text-[11px] font-bold text-rose-500 flex items-center gap-1.5 leading-normal ${className}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0 animate-pulse" />
                <span>{typeof error === 'string' ? error : ''}</span>
              </p>
              {extra}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
