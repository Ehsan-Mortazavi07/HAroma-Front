'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

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
}

const modalMotionProps = {
  variants: {
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    exit: {
      scale: 0.96,
      opacity: 0,
      y: 6,
      transition: {
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  },
};

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  confirmText = 'تایید و ادامه',
  cancelText = 'انصراف',
  confirmColor = 'danger',
  icon,
  isLoading = false,
  onConfirm,
}) => {
  const handleClose = () => {
    if (isLoading) return;
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const isDanger = confirmColor === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isLoading && onOpenChange) onOpenChange(open);
      }}
      onClose={handleClose}
      backdrop="transparent"
      placement="center"
      size="md"
      motionProps={modalMotionProps}
      classNames={{
        backdrop: 'bg-transparent backdrop-blur-none pointer-events-none',
        base: 'bg-brand-surface/98 dark:bg-[#161c16]/98 border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-3xl shadow-2xl mx-4 overflow-hidden',
        header: 'border-b border-brand-border/60 pb-3 pt-5 px-6 flex items-center gap-3',
        body: 'py-5 px-6',
        footer: 'border-t border-brand-border/60 pt-3 pb-5 px-6 flex justify-end gap-2.5',
        closeButton: 'hover:bg-brand-surface-elevated text-brand-text-muted rounded-xl cursor-pointer top-4 end-4',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDanger
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/10'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {icon || <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-base text-brand-text">{title}</h3>
              </div>
            </ModalHeader>

            <ModalBody className="py-4">
              <div className="text-sm text-brand-text-muted leading-relaxed space-y-2">
                {typeof description === 'string' ? <p>{description}</p> : description}
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-end gap-2.5">
              <Button
                variant="light"
                radius="lg"
                size="md"
                isDisabled={isLoading}
                onPress={handleClose}
                className="font-bold text-xs bg-transparent hover:bg-brand-surface-elevated text-brand-text border border-brand-border/60 cursor-pointer rounded-2xl"
              >
                {cancelText}
              </Button>
              <Button
                color={confirmColor}
                radius="lg"
                size="md"
                isLoading={isLoading}
                onPress={onConfirm}
                className={`font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all rounded-2xl ${
                  isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25' : ''
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
