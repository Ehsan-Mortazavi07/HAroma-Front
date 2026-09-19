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
      size="sm"
      hideCloseButton={true}
      motionProps={modalMotionProps}
      classNames={{
        backdrop: 'bg-transparent backdrop-blur-none pointer-events-none hidden',
        wrapper: 'fixed inset-0 z-50 flex items-center justify-center p-4 !bg-transparent !rounded-none pointer-events-auto admin-confirm-modal-wrapper lg:ps-[min(25vw,400px)]',
        base: 'm-auto max-w-[340px] w-full bg-brand-surface dark:bg-[#182018] border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-[26px] shadow-2xl overflow-hidden p-0',
        header: 'p-0 pt-6 pb-2 px-5 flex flex-col items-center justify-center text-center',
        body: 'p-0 py-1.5 px-5 text-center',
        footer: 'p-0 pt-3.5 pb-5 px-5 flex items-center justify-center w-full',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="p-0 pt-6 pb-2 px-5 flex flex-col items-center justify-center text-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mb-3 border ${
                  isDanger
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/10'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {icon || <AlertTriangle className="w-5 h-5" />}
              </div>
              <h3 className="font-black text-sm text-brand-text text-center tracking-tight leading-snug">
                {title}
              </h3>
            </ModalHeader>

            <ModalBody className="p-0 py-1.5 px-5 text-center">
              <div className="text-xs text-brand-text-muted leading-relaxed text-center space-y-1.5 [&_p]:text-center [&_strong]:text-brand-text [&_strong]:font-bold">
                {typeof description === 'string' ? <p>{description}</p> : description}
              </div>
            </ModalBody>

            <ModalFooter className="p-0 pt-3.5 pb-5 px-5 flex items-center justify-center w-full">
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <Button
                  variant="flat"
                  radius="lg"
                  size="sm"
                  isDisabled={isLoading}
                  onPress={handleClose}
                  className="font-bold text-xs bg-brand-surface-elevated/70 hover:bg-brand-surface-elevated text-brand-text border border-brand-border/60 cursor-pointer rounded-xl h-9 active:scale-95 transition-all"
                >
                  {cancelText}
                </Button>
                <Button
                  color={confirmColor}
                  radius="lg"
                  size="sm"
                  isLoading={isLoading}
                  onPress={onConfirm}
                  className={`font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all rounded-xl h-9 ${
                    isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25' : ''
                  }`}
                >
                  {confirmText}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
