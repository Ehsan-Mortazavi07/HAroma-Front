'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Chip,
} from '@heroui/react';
import {
  KeyRound,
  Smartphone,
  Mail,
  Hash,
  Lock,
  Check,
  Send,
  RotateCcw,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPasswordToggle } from '@/components/common/AnimatedPasswordToggle';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import axiosInstance from '@/common/axiosInstance';
import { toast, toPersianDigits, toEnglishDigits, getApiErrorMessage } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

/**
 * LiveTimerDisplay Component
 * Displays minutes and seconds in stable tabular numbers format with Vazirmatn font
 * Prevents horizontal jitter and fixes digit alignment
 */
export function LiveTimerDisplay({
  seconds,
  className = '',
}: {
  seconds: number;
  className?: string;
}) {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  const formattedMins = toPersianDigits(mins.toString().padStart(2, '0'));
  const formattedSecs = toPersianDigits(secs.toString().padStart(2, '0'));

  return (
    <span
      className={`inline-flex items-center justify-center gap-0.5 font-sans font-black [font-variant-numeric:tabular-nums] [font-feature-settings:'tnum'] tracking-wider select-none ${className}`}
      dir="ltr"
    >
      <span className="w-4.5 text-center inline-block">{formattedMins}</span>
      <span className="opacity-70 animate-pulse">:</span>
      <span className="w-4.5 text-center inline-block">{formattedSecs}</span>
    </span>
  );
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  initialIdentifier = '',
  onSuccess,
}: ResetPasswordModalProps) {
  const { isPersian } = useTranslation();

  // Multi-step Flow: 1 (Identifier & Channel) -> 2 (OTP & New Passwords) -> 3 (Success)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1: Identifier & Delivery Channel
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [identifierError, setIdentifierError] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [loadingSend, setLoadingSend] = useState(false);
  const [step1Cooldown, setStep1Cooldown] = useState(0);

  // Step 2: Verification Code & Passwords
  const [targetDestination, setTargetDestination] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // Synchronize initial identifier
  useEffect(() => {
    if (isOpen) {
      if (initialIdentifier && !identifier) {
        setIdentifier(initialIdentifier);
      }
    } else {
      // Reset state on modal close
      setStep(1);
      setCode('');
      setCodeError('');
      setNewPassword('');
      setNewPasswordError('');
      setConfirmPassword('');
      setConfirmPasswordError('');
      setDevCode(null);
      setCountdown(0);
      setStep1Cooldown(0);
      setIdentifierError('');
    }
  }, [isOpen, initialIdentifier]);

  // Live 2-minute (120s) countdown timer in Step 2
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Live Cooldown countdown timer in Step 1 (when user enters phone again before 2 minutes)
  useEffect(() => {
    if (step1Cooldown <= 0) return;
    const timer = setInterval(() => {
      setStep1Cooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step1Cooldown]);

  // Step 1: Request Password Reset Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step1Cooldown > 0) return;
    setIdentifierError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setIdentifierError(
        isPersian
          ? 'لطفاً شماره موبایل، ایمیل یا نام کاربری حساب خود را وارد کنید.'
          : 'Please enter your mobile phone, email, or username.',
      );
      return;
    }

    setLoadingSend(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', {
        identifier: cleanId,
        channel,
      });

      setTargetDestination(res.data?.target || cleanId);
      setDevCode(res.data?.devCode || null);
      const expiry = res.data?.expiresIn || 120;
      setCountdown(expiry);
      setStep1Cooldown(0);
      setStep(2);

      toast.success(
        res.data?.message ||
          (isPersian
            ? 'کد تایید ۲ دقیقه‌ای بازیابی رمز عبور ارسال شد.'
            : 'Password reset code has been dispatched.'),
      );
    } catch (err: any) {
      // Extract live retryAfter if rate-limited within 2 minutes
      const retryAfter = err?.response?.data?.retryAfter;
      if (typeof retryAfter === 'number' && retryAfter > 0) {
        setStep1Cooldown(retryAfter);
        setCountdown(retryAfter);
        if (err?.response?.data?.devCode) {
          setDevCode(err.response.data.devCode);
        }
      } else {
        const msg = err?.response?.data?.message;
        if (typeof msg === 'string') {
          const match = msg.match(/(\d+)\s*ثانیه/);
          if (match && match[1]) {
            const sec = parseInt(match[1], 10);
            setStep1Cooldown(sec);
            setCountdown(sec);
          }
        }
      }
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setLoadingSend(false);
    }
  };

  // Resend Code (Available when 2-minute timer reaches 0)
  const handleResendCode = async () => {
    if (countdown > 0 || loadingSend) return;

    setLoadingSend(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', {
        identifier: identifier.trim(),
        channel,
      });

      setCountdown(res.data?.expiresIn || 120);
      setDevCode(res.data?.devCode || null);
      setCode('');
      setCodeError('');

      toast.success(
        res.data?.message ||
          (isPersian ? 'کد تایید جدید با موفقیت ارسال شد.' : 'A new code has been sent.'),
      );
    } catch (err: any) {
      const retryAfter = err?.response?.data?.retryAfter;
      if (typeof retryAfter === 'number' && retryAfter > 0) {
        setCountdown(retryAfter);
      }
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setLoadingSend(false);
    }
  };

  // Step 2: Verify Code and Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    const cleanCode = toEnglishDigits(code.trim());
    if (!cleanCode || cleanCode.length < 4) {
      setCodeError(isPersian ? 'کد تایید وارد شده نامعتبر است.' : 'Invalid verification code.');
      return;
    }

    if (countdown <= 0) {
      setCodeError(
        isPersian
          ? 'کد تایید منقضی شده است. لطفاً روی دکمه «ارسال مجدد کد» کلیک کنید.'
          : 'Verification code has expired. Please request a new code.',
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setNewPasswordError(
        isPersian ? 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(
        isPersian ? 'رمز عبور جدید و تکرار آن مطابقت ندارند.' : 'Passwords do not match.',
      );
      return;
    }

    setLoadingReset(true);
    try {
      const res = await axiosInstance.post('/auth/reset-password', {
        identifier: identifier.trim(),
        code: cleanCode,
        newPassword,
        confirmPassword,
      });

      toast.success(
        res.data?.message ||
          (isPersian
            ? 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.'
            : 'Password changed successfully.'),
      );

      setStep(3);
      onSuccess?.();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setLoadingReset(false);
    }
  };

  const stepVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 14 : -14,
      filter: 'blur(3px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir < 0 ? 14 : -14,
      filter: 'blur(3px)',
    }),
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      backdrop="blur"
      placement="center"
      classNames={{
        base: 'bg-brand-surface border border-brand-border/80 text-brand-text rounded-2xl shadow-xl max-w-sm sm:max-w-[390px] mx-4 overflow-hidden',
        header: 'border-b border-brand-border/60 py-2.5 px-3.5 sm:px-4',
        body: 'p-0',
        closeButton: 'hover:bg-brand-surface-elevated text-brand-text-muted rounded-md cursor-pointer top-2 end-2 p-1.5',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-gold/10 border border-brand-gold/25 text-brand-gold flex items-center justify-center shrink-0">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs text-brand-text">
                  {isPersian ? 'بازیابی رمز عبور' : 'Reset Password'}
                </h3>
              </div>
              <span className="text-[10px] text-brand-text-muted font-mono font-medium ltr:mr-6 rtl:ml-6">
                {step === 1 && (isPersian ? 'مرحله ۱ از ۲' : '1 of 2')}
                {step === 2 && (isPersian ? 'مرحله ۲ از ۲' : '2 of 2')}
                {step === 3 && '✓'}
              </span>
            </ModalHeader>

            <div className="overflow-hidden p-3.5 sm:p-4">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {/* STEP 1: Enter Identifier & Choose Channel */}
                {step === 1 && (
                  <motion.div
                    key="reset-modal-step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <form onSubmit={handleSendCode} className="space-y-3">
                      {/* Identifier Input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-brand-text-muted flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-brand-gold shrink-0 opacity-80" />
                          <span>{isPersian ? 'موبایل، ایمیل یا نام کاربری:' : 'Mobile, Email or Username:'}</span>
                        </label>
                        <Input
                          aria-label={isPersian ? 'موبایل، ایمیل یا نام کاربری' : 'Mobile, Email or Username'}
                          placeholder={isPersian ? '۰۹۱۲۳۴۵۶۷۸۹ یا info@example.com' : '09123456789 or info@example.com'}
                          value={identifier}
                          onValueChange={(val) => {
                            setIdentifier(val);
                            if (identifierError) setIdentifierError('');
                          }}
                          variant="bordered"
                          radius="md"
                          classNames={{
                            inputWrapper:
                              'h-9 px-3 bg-brand-surface-elevated/40 border border-brand-border/70 hover:border-brand-gold/60 focus-within:!border-brand-gold rounded-lg shadow-none transition-colors',
                            input: 'text-xs text-brand-text text-start',
                          }}
                        />
                        <AnimatedFieldError error={identifierError} />
                      </div>

                      {/* Minimal Segmented Channel Control */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-brand-text-muted">
                          {isPersian ? 'نحوه دریافت کد تایید:' : 'Receive Code via:'}
                        </label>
                        <div className="grid grid-cols-2 p-0.5 rounded-lg bg-brand-surface-elevated border border-brand-border/70 relative h-8.5">
                          {/* Option 1: Mobile / SMS */}
                          <button
                            type="button"
                            onClick={() => setChannel('sms')}
                            className={`relative h-full flex items-center justify-center gap-1.5 rounded-md text-[11px] transition-colors cursor-pointer z-10 ${
                              channel === 'sms'
                                ? 'font-bold text-brand-text'
                                : 'font-medium text-brand-text-muted hover:text-brand-text'
                            }`}
                          >
                            {channel === 'sms' && (
                              <motion.div
                                layoutId="resetPassActivePill"
                                className="absolute inset-0 bg-brand-surface rounded-md border border-brand-border shadow-xs -z-10"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}
                            <Smartphone className="w-3.5 h-3.5 opacity-80" />
                            <span>{isPersian ? 'پیامک همراه' : 'SMS'}</span>
                          </button>

                          {/* Option 2: Email */}
                          <button
                            type="button"
                            onClick={() => setChannel('email')}
                            className={`relative h-full flex items-center justify-center gap-1.5 rounded-md text-[11px] transition-colors cursor-pointer z-10 ${
                              channel === 'email'
                                ? 'font-bold text-brand-text'
                                : 'font-medium text-brand-text-muted hover:text-brand-text'
                            }`}
                          >
                            {channel === 'email' && (
                              <motion.div
                                layoutId="resetPassActivePill"
                                className="absolute inset-0 bg-brand-surface rounded-md border border-brand-border shadow-xs -z-10"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}
                            <Mail className="w-3.5 h-3.5 opacity-80" />
                            <span>{isPersian ? 'ارسال به ایمیل' : 'Email'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Cooldown Error Alert */}
                      <AnimatePresence>
                        {step1Cooldown > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium min-w-0 text-[10px]">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0 animate-spin" />
                                <span className="truncate">
                                  {isPersian
                                    ? 'کد قبلی هنوز معتبر است. زمان تا ارسال مجدد:'
                                    : 'Code active. Resend in:'}
                                </span>
                              </div>
                              <div className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-200 shrink-0 font-bold">
                                <LiveTimerDisplay seconds={step1Cooldown} className="text-[10px]" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[10px]">
                              <span className="text-brand-text-muted">
                                {isPersian ? 'کد ارسالی را در اختیار دارید؟' : 'Have code?'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetDestination(identifier.trim());
                                  setDirection(1);
                                  setStep(2);
                                }}
                                className="font-bold text-brand-gold hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <span>{isPersian ? 'ثبت کد و تغییر رمز' : 'Enter Code'}</span>
                                {isPersian ? <ArrowLeft className="w-2.5 h-2.5" /> : <ArrowRight className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Step 1 Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="submit"
                          isLoading={loadingSend}
                          disabled={step1Cooldown > 0}
                          radius="md"
                          startContent={!loadingSend && <Send className="w-3 h-3 shrink-0" />}
                          className={`flex-1 h-8.5 text-xs font-bold transition-all ${
                            step1Cooldown > 0
                              ? 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border opacity-70 cursor-not-allowed'
                              : 'bg-brand-gold hover:bg-[#d4be9b] text-[#141914] cursor-pointer'
                          }`}
                        >
                          {loadingSend ? (
                            isPersian ? 'در حال صدور...' : 'Sending...'
                          ) : step1Cooldown > 0 ? (
                            <span className="flex items-center gap-1 font-bold">
                              <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                              <LiveTimerDisplay seconds={step1Cooldown} className="text-[10px]" />
                            </span>
                          ) : (
                            isPersian ? 'ارسال کد تایید' : 'Send Code'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          radius="md"
                          onPress={onClose}
                          className="h-8.5 px-3.5 bg-brand-surface-elevated border border-brand-border/70 text-brand-text text-xs cursor-pointer"
                        >
                          {isPersian ? 'انصراف' : 'Cancel'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Verify Code + New Passwords */}
                {step === 2 && (
                  <motion.div
                    key="reset-modal-step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <form onSubmit={handleResetPassword} className="space-y-2.5">
                      {/* Destination Info & Timer Strip */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-brand-surface-elevated/50 border border-brand-border/60 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 text-brand-text-muted">
                          <span className="truncate">
                            {channel === 'sms'
                              ? (isPersian ? 'کد ارسالی به:' : 'To:')
                              : (isPersian ? 'کد برای ایمیل:' : 'To:')}
                          </span>
                          <span className="font-mono text-brand-text dir-ltr font-bold truncate">
                            {targetDestination}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className={`w-3 h-3 ${countdown > 0 ? 'text-brand-gold animate-pulse' : 'text-rose-500'}`} />
                          <LiveTimerDisplay
                            seconds={countdown}
                            className={countdown > 0 ? 'text-brand-gold text-[10px]' : 'text-rose-500 text-[10px]'}
                          />
                        </div>
                      </div>

                      {/* Dev Code Quick Fill (testing) */}
                      {devCode && (
                        <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
                          <span className="font-medium">{isPersian ? '🔑 کد تست:' : '🔑 Dev Code:'}</span>
                          <button
                            type="button"
                            onClick={() => setCode(devCode)}
                            className="font-mono font-bold hover:underline cursor-pointer bg-amber-500/20 px-1.5 py-0.5 rounded"
                          >
                            {devCode} {isPersian ? '(کلیک)' : '(fill)'}
                          </button>
                        </div>
                      )}

                      {/* OTP Code Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <label className="font-medium text-brand-text-muted flex items-center gap-1">
                            <Hash className="w-3 h-3 text-brand-gold opacity-80 shrink-0" />
                            <span>{isPersian ? 'کد ۵ رقمی تایید:' : '5-Digit Code:'}</span>
                          </label>

                          {/* Resend button */}
                          <button
                            type="button"
                            disabled={countdown > 0 || loadingSend}
                            onClick={handleResendCode}
                            className={`font-medium flex items-center gap-1 transition-colors ${
                              countdown > 0
                                ? 'text-brand-text-muted cursor-not-allowed opacity-60'
                                : 'text-brand-gold hover:underline cursor-pointer font-bold'
                            }`}
                          >
                            <RotateCcw className={`w-2.5 h-2.5 ${loadingSend ? 'animate-spin' : ''}`} />
                            <span>
                              {countdown > 0 ? (
                                <span className="flex items-center gap-1">
                                  <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                                  <LiveTimerDisplay seconds={countdown} className="text-[10px]" />
                                </span>
                              ) : isPersian ? (
                                'ارسال مجدد کد'
                              ) : (
                                'Resend Code'
                              )}
                            </span>
                          </button>
                        </div>

                        <Input
                          aria-label={isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Code'}
                          placeholder="•••••"
                          maxLength={5}
                          value={code}
                          onValueChange={(val) => {
                            setCode(toEnglishDigits(val).replace(/\D/g, '').slice(0, 5));
                            if (codeError) setCodeError('');
                          }}
                          variant="bordered"
                          radius="md"
                          classNames={{
                            inputWrapper:
                              'h-9 px-3 bg-brand-surface-elevated/40 border border-brand-border/70 hover:border-brand-gold/60 focus-within:!border-brand-gold rounded-lg shadow-none transition-colors',
                            input: 'text-center tracking-[0.25em] text-sm font-mono font-bold text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={codeError} />
                      </div>

                      {/* New Password Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-brand-text-muted flex items-center gap-1">
                          <Lock className="w-3 h-3 text-brand-gold opacity-80 shrink-0" />
                          <span>{isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر):' : 'New Password (min 6 chars):'}</span>
                        </label>
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          aria-label={isPersian ? 'رمز عبور جدید' : 'New Password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onValueChange={(val) => {
                            setNewPassword(val);
                            if (newPasswordError) setNewPasswordError('');
                          }}
                          variant="bordered"
                          radius="md"
                          endContent={
                            <AnimatedPasswordToggle
                              isVisible={showNewPassword}
                              onToggle={() => setShowNewPassword((prev) => !prev)}
                              ariaLabel={isPersian ? 'تغییر نمایش رمز جدید' : 'Toggle new password visibility'}
                            />
                          }
                          classNames={{
                            inputWrapper:
                              'h-9 px-3 bg-brand-surface-elevated/40 border border-brand-border/70 hover:border-brand-gold/60 focus-within:!border-brand-gold rounded-lg shadow-none transition-colors',
                            input: 'text-xs text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={newPasswordError} />
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-brand-text-muted flex items-center gap-1">
                          <Lock className="w-3 h-3 text-brand-gold opacity-80 shrink-0" />
                          <span>{isPersian ? 'تکرار رمز عبور جدید:' : 'Confirm Password:'}</span>
                        </label>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          aria-label={isPersian ? 'تکرار رمز عبور جدید' : 'Confirm New Password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onValueChange={(val) => {
                            setConfirmPassword(val);
                            if (confirmPasswordError) setConfirmPasswordError('');
                          }}
                          variant="bordered"
                          radius="md"
                          endContent={
                            <AnimatedPasswordToggle
                              isVisible={showConfirmPassword}
                              onToggle={() => setShowConfirmPassword((prev) => !prev)}
                              ariaLabel={isPersian ? 'تغییر نمایش تکرار رمز جدید' : 'Toggle confirm password visibility'}
                            />
                          }
                          classNames={{
                            inputWrapper:
                              'h-9 px-3 bg-brand-surface-elevated/40 border border-brand-border/70 hover:border-brand-gold/60 focus-within:!border-brand-gold rounded-lg shadow-none transition-colors',
                            input: 'text-xs text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={confirmPasswordError} />
                      </div>

                      {/* Step 2 Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="submit"
                          isLoading={loadingReset}
                          radius="md"
                          startContent={!loadingReset && <Check className="w-3 h-3 shrink-0" />}
                          className="flex-1 h-8.5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs cursor-pointer shadow-xs"
                        >
                          {loadingReset
                            ? (isPersian ? 'در حال ثبت...' : 'Saving...')
                            : (isPersian ? 'تغییر و ثبت رمز عبور' : 'Set Password')}
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          radius="md"
                          onPress={() => {
                            setDirection(-1);
                            setStep(1);
                            if (countdown > 0) {
                              setStep1Cooldown(countdown);
                            }
                          }}
                          className="h-8.5 px-3 bg-brand-surface-elevated border border-brand-border/70 text-brand-text text-xs cursor-pointer"
                        >
                          {isPersian ? 'مرحله قبل' : 'Back'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: Success Screen */}
                {step === 3 && (
                  <motion.div
                    key="reset-modal-step-3"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="py-3 text-center space-y-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-brand-text">
                        {isPersian ? 'رمز عبور با موفقیت تغییر یافت' : 'Password Successfully Reset'}
                      </h4>
                      <p className="text-[11px] text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'رمز عبور جدید حساب شما فعال شد. اکنون می‌توانید وارد شوید.'
                          : 'Your password has been updated. You can now log in.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      radius="md"
                      onPress={onClose}
                      className="w-full h-8.5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {isPersian ? 'بستن' : 'Close'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
