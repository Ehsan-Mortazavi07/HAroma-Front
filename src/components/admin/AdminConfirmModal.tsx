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
  confirmText = 'بله، حذف کن',
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

    const menuWidth = 205;
    const menuEstimatedHeight = 240;

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setCoords({
        top: Math.max(20, (window.innerHeight - menuEstimatedHeight) / 2),
        left: Math.max(20, (window.innerWidth - menuWidth) / 2),
        isFlipped: false,
      });
      return;
    }

    let isFlipped = false;
    let top = rect.bottom + 6;

    // If near bottom of screen, flip above the button
    if (top + menuEstimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - menuEstimatedHeight - 6);
      isFlipped = true;
    }

    // Horizontal placement:
    // In RTL, align right edge of menu with right edge of button
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

          {/* Anchored Popover Menu (Y > X) */}
          <motion.div
            initial={{
              opacity: 0,
              y: coords.isFlipped ? 8 : -8,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: coords.isFlipped ? 6 : -6,
              scale: 0.94,
            }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: 205,
              zIndex: 99999,
              transformOrigin: coords.isFlipped ? 'bottom center' : 'top center',
            }}
            className="admin-confirm-popover-card bg-brand-surface dark:bg-[#182018] border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-2xl shadow-black/35 p-3 flex flex-col items-center text-center select-none"
            dir="rtl"
          >
            {/* Top Warning Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2 border ${
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

            {/* Title */}
            <h4 className="font-black text-xs text-brand-text text-center tracking-tight leading-snug mb-1">
              {title}
            </h4>

            {/* Description / Target item */}
            <div className="text-[11px] text-brand-text-muted text-center leading-relaxed px-0.5 mb-3 w-full space-y-1 [&_p]:text-center [&_strong]:text-brand-text [&_strong]:font-black [&_.text-rose-500]:text-[10px] [&_.text-rose-500]:mt-1 [&_.text-rose-500]:leading-tight">
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>

            {/* Vertical Actions (Stacked Column - Y > X) */}
            <div className="w-full flex flex-col gap-1.5 pt-1 border-t border-brand-border/60">
              <Button
                size="sm"
                radius="lg"
                color={confirmColor}
                isLoading={isLoading}
                onPress={onConfirm}
                className={`w-full h-8 font-black text-xs cursor-pointer shadow-sm active:scale-95 transition-all rounded-xl ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : ''
                }`}
              >
                {confirmText}
              </Button>
              <Button
                size="sm"
                radius="lg"
                variant="flat"
                isDisabled={isLoading}
                onPress={handleClose}
                className="w-full h-7.5 font-bold text-[11px] bg-brand-surface-elevated/70 hover:bg-brand-surface-elevated text-brand-text border border-brand-border/60 cursor-pointer rounded-xl active:scale-95 transition-all"
              >
                {cancelText}
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
