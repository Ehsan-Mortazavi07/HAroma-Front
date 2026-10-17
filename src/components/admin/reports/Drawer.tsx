'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Full-height side panel rendered into <body>, so admin layout transforms and
 * the global HeroUI modal overrides in rtl-heroui.css cannot clip or offset it.
 * Slides in from the inline-end edge (left in RTL, right in LTR).
 */
export function Drawer({
  open,
  onClose,
  isRTL,
  title,
  subtitle,
  leading,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  isRTL: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const offscreen = isRTL ? '-100%' : '100%';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 end-0 flex w-full max-w-[min(960px,100vw)] flex-col border-brand-border bg-brand-bg text-brand-text shadow-2xl sm:inset-y-3 sm:end-3 sm:w-[calc(100vw-1.5rem)] sm:rounded-[28px] sm:border"
            initial={reduceMotion ? { opacity: 0 } : { x: offscreen, opacity: 0.6 }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: offscreen, opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-brand-border px-4 py-4 sm:px-6">
              {leading}
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black">{title}</div>
                {subtitle && <div className="mt-0.5 truncate text-[11px] font-semibold text-brand-text-muted">{subtitle}</div>}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border text-brand-text-muted transition-colors hover:border-brand-gold hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand-gold"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
