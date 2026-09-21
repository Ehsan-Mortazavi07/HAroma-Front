'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'danger' | 'warning' | 'primary' | 'default' | 'success';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  anchorRect?: DOMRect | null;
}

// Global pointerdown tracker to capture the bounding rect of whatever button was clicked
let globalLastTriggerRect: DOMRect | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      const target = (e.target as HTMLElement)?.closest('button, [role="button"], a');
      if (target && !target.closest('.admin-confirm-popover-card')) {
        globalLastTriggerRect = target.getBoundingClientRect();
      }
    },
    true
  );
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  confirmText = 'بله، حذف',
  cancelText = 'انصراف',
  confirmColor = 'danger',
  icon,
  isLoading = false,
  onConfirm,
  anchorRect,
}) => {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    isFlipped: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    if (isLoading) return;
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const rect =
      anchorRect ||
      globalLastTriggerRect ||
      ((document.activeElement as HTMLElement)?.closest?.('button') || (document.activeElement as HTMLElement))?.getBoundingClientRect?.();

    // Horizontal dimensions (X > Y)
    const menuWidth = 310;
    const menuEstimatedHeight = 125;

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setCoords({
        top: Math.max(20, (window.innerHeight - menuEstimatedHeight) / 2),
        left: Math.max(20, (window.innerWidth - menuWidth) / 2),
        isFlipped: false,
      });
      return;
    }

    let isFlipped = false;
    let top = rect.bottom + 8;

    // If near bottom of viewport, flip above the button
    if (top + menuEstimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - menuEstimatedHeight - 8);
      isFlipped = true;
    }

    // Horizontal alignment:
    // In RTL, align right edge of menu to right edge of button if space permits;
    // Otherwise align left edge with button left
    let left: number;
    if (rect.right - menuWidth >= 12) {
      left = rect.right - menuWidth;
    } else {
      left = rect.left;
    }

    // Clamp horizontally to stay completely within viewport
    left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, left));

    setCoords({ top, left, isFlipped });
  }, [isOpen, anchorRect]);

  // Close on outside scroll, resize, or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (!isLoading) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading]);

  if (!mounted) return null;

  const isDanger = confirmColor === 'danger';

  return createPortal(
    <AnimatePresence>
      {isOpen && coords && (
        <>
          {/* Invisible click-catcher overlay to close on outside click without screen dimming */}
          <div
            className="fixed inset-0 z-[99998] bg-transparent cursor-default"
            onClick={handleClose}
          />

          {/* Anchored Horizontal Popover Menu (X > Y) with ultra-smooth Apple easing */}
          <motion.div
            initial={{
              opacity: 0,
              y: coords.isFlipped ? 12 : -12,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: coords.isFlipped ? 8 : -8,
              scale: 0.97,
            }}
            transition={{
              duration: 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: 310,
              zIndex: 99999,
              transformOrigin: coords.isFlipped ? 'bottom center' : 'top center',
            }}
            className="admin-confirm-popover-card bg-brand-surface/95 dark:bg-[#182018]/95 backdrop-blur-xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-2xl shadow-black/25 p-3.5 flex flex-col justify-between select-none transform-gpu will-change-transform"
            dir="rtl"
          >
            {/* Top Row: Icon + Title & Description (Side-by-side) */}
            <div className="flex items-start gap-2.5 w-full text-right">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                  isDanger
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-xs'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-xs'
                }`}
              >
                {icon || (
                  isDanger ? (
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-black text-xs text-brand-text tracking-tight leading-snug truncate">
                  {title}
                </h4>
                <div className="text-[11px] text-brand-text-muted leading-relaxed mt-0.5 space-y-0.5 line-clamp-2 [&_strong]:text-brand-text [&_strong]:font-black [&_.text-rose-500]:text-[10px]">
                  {typeof description === 'string' ? <p>{description}</p> : description}
                </div>
              </div>
            </div>

            {/* Bottom Row: Actions (Side-by-side Horizontally) */}
            <div className="flex items-center justify-end gap-2 w-full mt-3 pt-2.5 border-t border-brand-border/60">
              <Button
                size="sm"
                radius="lg"
                variant="flat"
                isDisabled={isLoading}
                onPress={handleClose}
                className="h-8 px-3.5 font-bold text-xs bg-brand-surface-elevated/70 hover:bg-brand-surface-elevated text-brand-text border border-brand-border/60 cursor-pointer rounded-xl active:scale-95 transition-all"
              >
                {cancelText}
              </Button>
              <Button
                size="sm"
                radius="lg"
                color={confirmColor}
                isLoading={isLoading}
                onPress={onConfirm}
                className={`h-8 px-4 font-black text-xs cursor-pointer shadow-sm active:scale-95 transition-all rounded-xl ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : ''
                }`}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const AdminConfirmPopover = AdminConfirmModal;
