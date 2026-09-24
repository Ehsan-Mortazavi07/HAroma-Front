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

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      backdrop="blur"
      placement="center"
      classNames={{
        base: 'bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-md mx-4 overflow-hidden',
        header: 'border-b border-brand-border pb-3.5 pt-5 px-6',
        body: 'py-5 px-6',
        footer: 'border-t border-brand-border pt-3.5 pb-5 px-6',
        closeButton: 'hover:bg-brand-surface-elevated text-brand-text-muted rounded-xl cursor-pointer top-4 start-auto end-4',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0 shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-brand-text">
                  {isPersian ? 'بازیابی و تغییر رمز عبور' : 'Reset Password'}
                </h3>
                <p className="text-[11px] text-brand-text-muted font-normal mt-0.5">
                  {step === 1 && (isPersian ? 'مرحله اول: مشخصات حساب و کانال دریافت کد' : 'Step 1: Account & Delivery Channel')}
                  {step === 2 && (isPersian ? 'مرحله دوم: اعتبارسنجی کد و تعیین رمز جدید' : 'Step 2: Verification & New Password')}
                  {step === 3 && (isPersian ? 'پایان: تغییر موفقیت‌آمیز رمز عبور' : 'Complete: Password Reset')}
                </p>
              </div>
            </ModalHeader>

            {/* STEP 1: Enter Identifier & Choose Channel */}
            {step === 1 && (
              <form onSubmit={handleSendCode}>
                <ModalBody className="space-y-4">
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    {isPersian
                      ? 'شماره موبایل، ایمیل یا نام کاربری خود را وارد کنید و مشخص فرمایید کد به کدام کانال ارسال شود:'
                      : 'Enter your mobile phone, email, or username, and select where you would like to receive the code:'}
                  </p>

                  {/* Identifier Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span>{isPersian ? 'موبایل / ایمیل / نام کاربری' : 'Mobile / Email / Username'}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      aria-label={isPersian ? 'موبایل، ایمیل یا نام کاربری' : 'Mobile, Email or Username'}
                      placeholder={isPersian ? 'مثلاً: ۰۹۱۲۳۴۵۶۷۸۹ یا info@example.com' : 'e.g. 09123456789 or user@example.com'}
                      value={identifier}
                      onValueChange={(val) => {
                        setIdentifier(val);
                        if (identifierError) setIdentifierError('');
                      }}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper:
                          'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                        input: 'text-xs font-semibold text-brand-text text-start',
                      }}
                    />
                    <AnimatedFieldError error={identifierError} />
                  </div>

                  {/* Redesigned Channel Selection with Fluid Sliding Animation */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'کانال دریافت کد تایید:' : 'Verification Channel:'}
                      </label>
                      <span className="text-[11px] font-bold text-brand-gold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {channel === 'sms'
                          ? isPersian
                            ? 'پیامک تلفن همراه'
                            : 'Mobile SMS'
                          : isPersian
                          ? 'ارسال به ایمیل'
                          : 'Email'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-brand-surface-elevated/70 border border-brand-border relative">
                      {/* Option 1: Mobile / SMS */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setChannel('sms')}
                        className={`relative p-3.5 rounded-xl text-start transition-all cursor-pointer flex flex-col gap-2 z-10 ${
                          channel === 'sms'
                            ? 'text-brand-text'
                            : 'text-brand-text-muted hover:text-brand-text'
                        }`}
                      >
                        {channel === 'sms' && (
                          <motion.div
                            layoutId="activeChannelHighlight"
                            className="absolute inset-0 bg-brand-surface rounded-xl border-2 border-brand-gold shadow-md shadow-brand-gold/15 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              channel === 'sms'
                                ? 'bg-brand-gold text-[#141914] shadow-xs scale-105'
                                : 'bg-brand-surface text-brand-text-muted border border-brand-border'
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              channel === 'sms'
                                ? 'bg-brand-gold text-[#141914] scale-100'
                                : 'border border-brand-border text-transparent scale-90'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black leading-snug">
                            {isPersian ? 'پیامک به شماره همراه' : 'SMS to Phone'}
                          </div>
                          <div className="text-[10px] text-brand-text-muted mt-0.5 leading-tight">
                            {isPersian ? 'ارسال سریع کد با پیامک' : 'Instant mobile SMS'}
                          </div>
                        </div>
                      </motion.button>

                      {/* Option 2: Email */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setChannel('email')}
                        className={`relative p-3.5 rounded-xl text-start transition-all cursor-pointer flex flex-col gap-2 z-10 ${
                          channel === 'email'
                            ? 'text-brand-text'
                            : 'text-brand-text-muted hover:text-brand-text'
                        }`}
                      >
                        {channel === 'email' && (
                          <motion.div
                            layoutId="activeChannelHighlight"
                            className="absolute inset-0 bg-brand-surface rounded-xl border-2 border-brand-gold shadow-md shadow-brand-gold/15 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              channel === 'email'
                                ? 'bg-brand-gold text-[#141914] shadow-xs scale-105'
                                : 'bg-brand-surface text-brand-text-muted border border-brand-border'
                            }`}
                          >
                            <Mail className="w-4 h-4" />
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              channel === 'email'
                                ? 'bg-brand-gold text-[#141914] scale-100'
                                : 'border border-brand-border text-transparent scale-90'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black leading-snug">
                            {isPersian ? 'ارسال به آدرس ایمیل' : 'Send to Email'}
                          </div>
                          <div className="text-[10px] text-brand-text-muted mt-0.5 leading-tight">
                            {isPersian ? 'ثبت و صدور در دیتابیس' : 'Save to database'}
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Live Cooldown Error Alert (If requested again within 2 minutes) */}
                  <AnimatePresence>
                    {step1Cooldown > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold min-w-0">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                            <span className="truncate">
                              {isPersian
                                ? 'کد قبلی معتبر است. زمان تا امکان ارسال مجدد:'
                                : 'Previous code active. Cooldown remaining:'}
                            </span>
                          </div>
                          <div className="bg-amber-500/20 px-2.5 py-1 rounded-xl text-amber-800 dark:text-amber-200 shrink-0">
                            <LiveTimerDisplay seconds={step1Cooldown} className="text-xs" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[11px]">
                          <span className="text-brand-text-muted">
                            {isPersian ? 'کد ارسالی را در اختیار دارید؟' : 'Already have the code?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetDestination(identifier.trim());
                              setStep(2);
                            }}
                            className="font-black text-brand-gold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{isPersian ? 'ثبت کد و تغییر رمز عبور' : 'Enter Code'}</span>
                            {isPersian ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ModalBody>

                <ModalFooter className="flex gap-2.5">
                  <Button
                    type="submit"
                    isLoading={loadingSend}
                    disabled={step1Cooldown > 0}
                    radius="lg"
                    startContent={!loadingSend && <Send className="w-4 h-4 shrink-0" />}
                    className={`flex-1 h-11 text-xs font-black shadow-md rounded-2xl transition-all ${
                      step1Cooldown > 0
                        ? 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border opacity-70 cursor-not-allowed'
                        : 'bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-brand-gold/20 cursor-pointer'
                    }`}
                  >
                    {loadingSend ? (
                      isPersian ? 'در حال صدور و ارسال...' : 'Sending...'
                    ) : step1Cooldown > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                        <LiveTimerDisplay seconds={step1Cooldown} className="text-xs" />
                      </span>
                    ) : (
                      isPersian ? 'ارسال کد تایید' : 'Send Verification Code'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="flat"
                    radius="lg"
                    onPress={onClose}
                    className="h-11 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </Button>
                </ModalFooter>
              </form>
            )}

            {/* STEP 2: Verify Code + New Password + Confirm Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword}>
                <ModalBody className="space-y-4">
                  {/* Destination Info Box & Live 2-Min Countdown */}
                  <div className="p-3.5 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-text-muted">
                        {channel === 'sms'
                          ? (isPersian ? 'کد تایید به شماره زیر ارسال شد:' : 'Code sent to phone:')
                          : (isPersian ? 'کد تایید برای ایمیل زیر صادر شد:' : 'Code generated for email:')}
                      </span>
                      <span className="font-bold text-brand-text dir-ltr">{targetDestination}</span>
                    </div>

                    {/* Live 2-Minute Timer Pill with Stable Tabular Font */}
                    <div className="flex items-center justify-between pt-1 border-t border-brand-border/60">
                      <div className="flex items-center gap-1.5">
                        <Clock
                          className={`w-3.5 h-3.5 ${
                            countdown > 0 ? 'text-brand-gold animate-pulse' : 'text-rose-500'
                          }`}
                        />
                        <span className="text-[11px] font-semibold text-brand-text-muted">
                          {isPersian ? 'اعتبار کد تایید (۲ دقیقه):' : 'Code validity (2 min):'}
                        </span>
                      </div>

                      {countdown > 0 ? (
                        <Chip
                          size="sm"
                          classNames={{
                            base: 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-black text-xs px-2.5 h-6 rounded-lg',
                          }}
                        >
                          <LiveTimerDisplay seconds={countdown} className="text-xs text-brand-gold" />
                        </Chip>
                      ) : (
                        <Chip
                          size="sm"
                          classNames={{
                            base: 'bg-rose-500/15 text-rose-500 border border-rose-500/30 font-black text-[11px] px-2 h-6 rounded-lg',
                          }}
                        >
                          {isPersian ? 'منقضی شده' : 'Expired'}
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Dev Code Quick Badge (Convenient for Local/Testing) */}
                  {devCode && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-bold text-[11px]">
                        {isPersian ? '🔑 کد دریافتی (محیط تست):' : '🔑 Dev Code:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCode(devCode)}
                        className="font-mono font-black text-xs bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      >
                        {devCode} {isPersian ? '(کلیک جهت درج)' : '(Click to fill)'}
                      </button>
                    </div>
                  )}

                  {/* OTP Code Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                        <span>{isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Code'}</span>
                        <span className="text-rose-500">*</span>
                      </label>

                      {/* Resend Code Button - Enabled when countdown === 0 */}
                      <button
                        type="button"
                        disabled={countdown > 0 || loadingSend}
                        onClick={handleResendCode}
                        className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          countdown > 0
                            ? 'text-brand-text-muted cursor-not-allowed opacity-60'
                            : 'text-brand-gold hover:underline cursor-pointer'
                        }`}
                      >
                        <RotateCcw className={`w-3 h-3 ${loadingSend ? 'animate-spin' : ''}`} />
                        <span>
                          {countdown > 0 ? (
                            <span className="flex items-center gap-1">
                              <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                              <LiveTimerDisplay seconds={countdown} className="text-[11px]" />
                            </span>
                          ) : isPersian ? (
                            'درخواست مجدد کد'
                          ) : (
                            'Resend Code'
                          )}
                        </span>
                      </button>
                    </div>

                    <Input
                      aria-label={isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Code'}
                      placeholder="•••••"
                      maxLength={6}
                      value={code}
                      onValueChange={(val) => {
                        setCode(toEnglishDigits(val).replace(/\D/g, '').slice(0, 5));
                        if (codeError) setCodeError('');
                      }}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper:
                          'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                        input: 'text-center tracking-widest text-base font-black text-brand-text font-mono',
                      }}
                    />
                    <AnimatedFieldError error={codeError} />
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span>{isPersian ? 'کلمه عبور جدید (حداقل ۶ کاراکتر)' : 'New Password (min 6 chars)'}</span>
                      <span className="text-rose-500">*</span>
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
                      radius="lg"
                      endContent={
                        <AnimatedPasswordToggle
                          isVisible={showNewPassword}
                          onToggle={() => setShowNewPassword((prev) => !prev)}
                          ariaLabel={isPersian ? 'تغییر نمایش رمز جدید' : 'Toggle new password visibility'}
                        />
                      }
                      classNames={{
                        inputWrapper:
                          'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                        input: 'text-xs font-semibold text-brand-text',
                      }}
                    />
                    <AnimatedFieldError error={newPasswordError} />
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span>{isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password'}</span>
                      <span className="text-rose-500">*</span>
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
                      radius="lg"
                      endContent={
                        <AnimatedPasswordToggle
                          isVisible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((prev) => !prev)}
                          ariaLabel={isPersian ? 'تغییر نمایش تکرار رمز جدید' : 'Toggle confirm password visibility'}
                        />
                      }
                      classNames={{
                        inputWrapper:
                          'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                        input: 'text-xs font-semibold text-brand-text',
                      }}
                    />
                    <AnimatedFieldError error={confirmPasswordError} />
                  </div>
                </ModalBody>

                <ModalFooter className="flex gap-2.5">
                  <Button
                    type="submit"
                    isLoading={loadingReset}
                    radius="lg"
                    startContent={!loadingReset && <Check className="w-4 h-4 shrink-0" />}
                    className="flex-1 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer"
                  >
                    {loadingReset
                      ? (isPersian ? 'در حال ثبت...' : 'Saving...')
                      : (isPersian ? 'تغییر و ثبت کلمه عبور' : 'Set New Password')}
                  </Button>
                  <Button
                    type="button"
                    variant="flat"
                    radius="lg"
                    onPress={() => {
                      setStep(1);
                      if (countdown > 0) {
                        setStep1Cooldown(countdown);
                      }
                    }}
                    className="h-11 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                  >
                    {isPersian ? 'مرحله قبل' : 'Back'}
                  </Button>
                </ModalFooter>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {step === 3 && (
              <>
                <ModalBody className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-base font-black text-brand-text">
                      {isPersian ? 'رمز عبور با موفقیت تغییر یافت' : 'Password Successfully Reset'}
                    </h4>
                    <p className="text-xs text-brand-text-muted leading-relaxed max-w-xs mx-auto">
                      {isPersian
                        ? 'کلمه عبور حساب کاربری شما به‌روزرسانی شد. اکنون می‌توانید با اطلاعات جدید خود وارد شوید.'
                        : 'Your account password has been updated. You can now log in with your new password.'}
                    </p>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    radius="lg"
                    onPress={onClose}
                    className="w-full h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer"
                  >
                    {isPersian ? 'متوجه شدم و بستن' : 'Done & Close'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
