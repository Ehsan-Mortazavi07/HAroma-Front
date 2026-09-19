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
import { motion } from 'framer-motion';
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
    initial: {
      scale: 0.92,
      opacity: 0,
      y: 16,
    },
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        scale: {
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        y: {
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        opacity: {
          duration: 0.28,
          ease: 'easeOut' as const,
        },
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.22,
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
        base: 'm-auto max-w-[340px] w-full bg-brand-surface dark:bg-[#182018] border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-[26px] shadow-2xl overflow-hidden p-0 transform-gpu will-change-transform',
        header: 'p-0 pt-6 pb-2 px-5 flex flex-col items-center justify-center text-center',
        body: 'p-0 py-1.5 px-5 text-center',
        footer: 'p-0 pt-3.5 pb-5 px-5 flex items-center justify-center w-full',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="p-0 pt-6 pb-2 px-5 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.42,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.06,
                }}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mb-3 border transform-gpu ${
                  isDanger
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-md shadow-rose-500/10'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-md shadow-amber-500/10'
                }`}
              >
                {/* Soft breathing ambient halo behind warning icon */}
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.2, 0.45, 0.2],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.35,
                  }}
                  className={`absolute inset-0 rounded-2xl pointer-events-none ${
                    isDanger ? 'bg-rose-500/20' : 'bg-amber-500/20'
                  }`}
                />
                <span className="relative z-10 flex items-center justify-center">
                  {icon || <AlertTriangle className="w-5 h-5" />}
                </span>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.09 }}
                className="font-black text-sm text-brand-text text-center tracking-tight leading-snug"
              >
                {title}
              </motion.h3>
            </ModalHeader>

            <ModalBody className="p-0 py-1.5 px-5 text-center">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                className="text-xs text-brand-text-muted leading-relaxed text-center space-y-1.5 [&_p]:text-center [&_strong]:text-brand-text [&_strong]:font-bold"
              >
                {typeof description === 'string' ? <p>{description}</p> : description}
              </motion.div>
            </ModalBody>

            <ModalFooter className="p-0 pt-3.5 pb-5 px-5 flex items-center justify-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                className="grid grid-cols-2 gap-2.5 w-full"
              >
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
              </motion.div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
