'use client';

import React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
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
  /** Kept for compatibility with callers that used the former anchored confirmation. */
  anchorRect?: DOMRect | null;
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
}) => {
  const close = () => {
    if (isLoading) return;
    onClose?.();
    onOpenChange?.(false);
  };

  const isDanger = confirmColor === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
      backdrop="blur"
      placement="center"
      size="sm"
      classNames={{
        backdrop: 'z-[10010] bg-black/45 backdrop-blur-sm',
        wrapper: 'z-[10011] p-3',
        base: 'w-full max-w-[22rem] rounded-2xl border border-brand-border bg-brand-surface text-brand-text shadow-2xl',
        header: 'gap-3 px-4 pb-2 pt-4',
        body: 'px-4 py-2 text-right text-xs leading-6 text-brand-text-muted [&_strong]:font-black [&_strong]:text-brand-text',
        footer: 'gap-2 border-t border-brand-border/70 px-4 py-3',
      }}
    >
      <ModalContent dir="rtl">
        {() => (
          <>
            <ModalHeader className="flex items-start text-right">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  isDanger
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
                aria-hidden="true"
              >
                {icon || (isDanger ? <Trash2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />)}
              </span>
              <h2 className="min-w-0 flex-1 pt-1 text-sm font-black leading-6 text-brand-text">
                {title}
              </h2>
            </ModalHeader>

            <ModalBody>{typeof description === 'string' ? <p>{description}</p> : description}</ModalBody>

            <ModalFooter>
              <Button
                type="button"
                size="sm"
                radius="lg"
                variant="flat"
                isDisabled={isLoading}
                onPress={close}
                className="h-9 rounded-xl border border-brand-border bg-brand-surface-elevated px-3.5 text-xs font-bold text-brand-text"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                size="sm"
                radius="lg"
                color={confirmColor}
                isLoading={isLoading}
                onPress={() => void onConfirm()}
                className={`h-9 rounded-xl px-4 text-xs font-black ${
                  isDanger ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' : ''
                }`}
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export const AdminConfirmPopover = AdminConfirmModal;
