'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  Button,
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
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/stores/hooks';
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
      <span className="w-4 text-center inline-block">{formattedMins}</span>
      <span className="opacity-70 animate-pulse">:</span>
      <span className="w-4 text-center inline-block">{formattedSecs}</span>
    </span>
  );
}

const maskPhone = (phone?: string) => {
  if (!phone) return '';
  const clean = toEnglishDigits(phone.trim().replace(/\D/g, ''));
  if (clean.length === 11) {
    return toPersianDigits(clean.slice(0, 4) + '***' + clean.slice(7));
  }
  return toPersianDigits(clean);
};

const maskEmail = (email?: string) => {
  if (!email) return '';
  const clean = email.trim();
  const parts = clean.split('@');
  if (parts.length !== 2) return clean;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? name.slice(0, 2) + '*'.repeat(Math.max(3, name.length - 2)) : name + '***';
  return `${maskedName}@${domain}`;
};

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

  // Auth state from Redux store
  const authUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isUserLoggedIn = isAuthenticated && Boolean(authUser);

  // Multi-step Flow: 1 (Choose Channel / Identifier) -> 2 (OTP & New Passwords) -> 3 (Success)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1: Identifier (only for guest / unauthenticated users) & Channel
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [identifierError, setIdentifierError] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [loadingSend, setLoadingSend] = useState(false);

  // Independent cooldown timers & targets for SMS and Email
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [smsTarget, setSmsTarget] = useState('');
  const [smsDevCode, setSmsDevCode] = useState<string | null>(null);

  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailTarget, setEmailTarget] = useState('');
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);

  // Step 2: Verification Code & Passwords
  const [activeChannel, setActiveChannel] = useState<'sms' | 'email'>('sms');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // Initialize or reset form when modal opens / closes
  useEffect(() => {
    if (isOpen) {
      if (isUserLoggedIn) {
        // Default to SMS if available, otherwise Email
        if (authUser?.phone) {
          setChannel('sms');
          setActiveChannel('sms');
        } else if (authUser?.email) {
          setChannel('email');
          setActiveChannel('email');
        }
      } else if (initialIdentifier && !identifier) {
        setIdentifier(initialIdentifier);
      }
    } else {
      // Clear inputs upon closing
      setStep(1);
      setCode('');
      setCodeError('');
      setNewPassword('');
      setNewPasswordError('');
      setConfirmPassword('');
      setConfirmPasswordError('');
      setIdentifierError('');
    }
  }, [isOpen, initialIdentifier, isUserLoggedIn, authUser]);

  // Independent 2-minute countdown timer for SMS
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = setInterval(() => {
      setSmsCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  // Independent 2-minute countdown timer for Email
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Active cooldown for the currently selected channel in Step 1
  const currentStep1Cooldown = channel === 'sms' ? smsCooldown : emailCooldown;

  // Step 1: Request Password Reset Code (for chosen channel)
  const handleSendCode = async (e?: React.FormEvent, overrideChannel?: 'sms' | 'email') => {
    if (e) e.preventDefault();
    const targetChannel = overrideChannel || channel;

    const activeCooldown = targetChannel === 'sms' ? smsCooldown : emailCooldown;
    if (activeCooldown > 0) return;

    setIdentifierError('');

    // If guest, validate identifier
    let cleanId = '';
    if (!isUserLoggedIn) {
      cleanId = identifier.trim();
      if (!cleanId) {
        setIdentifierError(
          isPersian
            ? 'لطفاً شماره موبایل، ایمیل یا نام کاربری حساب خود را وارد کنید.'
            : 'Please enter your mobile phone, email, or username.',
        );
        return;
      }
    }

    setLoadingSend(true);
    try {
      const payload: any = {
        channel: targetChannel,
      };
      if (!isUserLoggedIn) {
        payload.identifier = cleanId;
      }

      const res = await axiosInstance.post('/auth/forgot-password', payload);

      const returnedTarget = res.data?.target || (targetChannel === 'sms' ? authUser?.phone : authUser?.email) || cleanId;
      const returnedDevCode = res.data?.devCode || null;
      const expiry = res.data?.expiresIn || 120;

      if (targetChannel === 'sms') {
        setSmsCooldown(expiry);
        setSmsTarget(returnedTarget);
        setSmsDevCode(returnedDevCode);
        setActiveChannel('sms');
      } else {
        setEmailCooldown(expiry);
        setEmailTarget(returnedTarget);
        setEmailDevCode(returnedDevCode);
        setActiveChannel('email');
      }

      setDirection(1);
      setStep(2);

      toast.success(
        res.data?.message ||
          (isPersian
            ? `کد تایید ۲ دقیقه‌ای ${targetChannel === 'sms' ? 'پیامک' : 'ایمیل'} ارسال شد.`
            : `Verification code sent via ${targetChannel === 'sms' ? 'SMS' : 'Email'}.`),
      );
    } catch (err: any) {
      // Extract live retryAfter if rate-limited within 2 minutes for this channel
      const retryAfter = err?.response?.data?.retryAfter;
      if (typeof retryAfter === 'number' && retryAfter > 0) {
        if (targetChannel === 'sms') {
          setSmsCooldown(retryAfter);
          if (err?.response?.data?.devCode) setSmsDevCode(err.response.data.devCode);
        } else {
          setEmailCooldown(retryAfter);
          if (err?.response?.data?.devCode) setEmailDevCode(err.response.data.devCode);
        }
      } else {
        const msg = err?.response?.data?.message;
        if (typeof msg === 'string') {
          const match = msg.match(/(\d+)\s*ثانیه/);
          if (match && match[1]) {
            const sec = parseInt(match[1], 10);
            if (targetChannel === 'sms') setSmsCooldown(sec);
            else setEmailCooldown(sec);
          }
        }
      }
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setLoadingSend(false);
    }
  };

  // Step 2: Resend Code for the active channel
  const handleResendActiveChannel = async () => {
    const currentActiveCooldown = activeChannel === 'sms' ? smsCooldown : emailCooldown;
    if (currentActiveCooldown > 0 || loadingSend) return;
    await handleSendCode(undefined, activeChannel);
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

    const currentChannelCooldown = activeChannel === 'sms' ? smsCooldown : emailCooldown;
    if (currentChannelCooldown <= 0 && smsCooldown <= 0 && emailCooldown <= 0) {
      setCodeError(
        isPersian
          ? 'کد تایید منقضی شده است. لطفاً روی «ارسال مجدد کد» کلیک کنید.'
          : 'Verification code expired. Please request a new code.',
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
      const payload: any = {
        code: cleanCode,
        newPassword,
        confirmPassword,
        channel: activeChannel,
      };
      if (!isUserLoggedIn) {
        payload.identifier = identifier.trim();
      }

      const res = await axiosInstance.post('/auth/reset-password', payload);

      toast.success(
        res.data?.message ||
          (isPersian
            ? 'رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید با رمز جدید وارد شوید.'
            : 'Password changed successfully.'),
      );

      setDirection(1);
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
      x: dir > 0 ? 12 : -12,
      filter: 'blur(3px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir < 0 ? 12 : -12,
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
        base: 'bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-sm sm:max-w-[400px] mx-4 overflow-hidden',
        header: 'border-b border-brand-border/60 py-3 px-4 sm:px-5 flex items-center justify-between',
        body: 'p-0',
        closeButton: 'hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text rounded-full cursor-pointer top-3 end-3 p-1.5 transition-colors',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-surface-elevated border border-brand-border text-brand-bronze dark:text-brand-gold flex items-center justify-center shrink-0 shadow-2xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-brand-text">
                  {isPersian ? 'بازیابی رمز عبور' : 'Reset Password'}
                </h3>
              </div>
            </ModalHeader>

            <div className="overflow-hidden p-4 sm:p-5">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {/* STEP 1: Enter / Select Destination & Choose Channel */}
                {step === 1 && (
                  <motion.div
                    key="reset-modal-step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <form onSubmit={handleSendCode} className="space-y-3.5">
                      {/* Logged-In User Mode: Locked to their own account; NO input field allowed */}
                      {isUserLoggedIn ? (
                        <div className="space-y-3">
                          {/* Account badge */}
                          <div className="p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-bronze dark:text-brand-gold font-bold text-xs shrink-0 shadow-2xs">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-brand-text truncate">
                                  {authUser?.fullName || authUser?.username}
                                </div>
                                <div className="text-[11px] text-brand-text-muted font-mono truncate" dir="ltr">
                                  @{authUser?.username}
                                </div>
                              </div>
                            </div>
                            <div className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-[10px] font-bold text-brand-text-muted shrink-0">
                              {isPersian ? 'حساب کاربری فعال' : 'Active Account'}
                            </div>
                          </div>

                          {/* Channel selection strictly limited to user's registered phone / email */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-brand-text">
                              {isPersian ? 'نحوه دریافت کد تایید:' : 'Receive Code via:'}
                            </label>

                            <div className="grid grid-cols-1 gap-2">
                              {/* SMS option */}
                              <button
                                type="button"
                                disabled={!authUser?.phone}
                                onClick={() => setChannel('sms')}
                                className={`w-full p-2.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                                  channel === 'sms'
                                    ? 'bg-brand-surface border-brand-gold shadow-xs'
                                    : 'bg-brand-surface-elevated/70 border-brand-border hover:border-brand-border/90'
                                } ${!authUser?.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                    channel === 'sms'
                                      ? 'bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30'
                                      : 'bg-brand-surface border border-brand-border text-brand-text-muted'
                                  }`}>
                                    <Smartphone className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                                      <span>{isPersian ? 'پیامک به شماره موبایل' : 'SMS to Phone'}</span>
                                      {smsCooldown > 0 && (
                                        <span className="text-[10px] text-brand-bronze dark:text-brand-gold font-mono font-black">
                                          (<LiveTimerDisplay seconds={smsCooldown} />)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-brand-text-muted font-mono truncate" dir="ltr">
                                      {authUser?.phone ? maskPhone(authUser.phone) : (isPersian ? 'شماره موبایل ثبت نشده است' : 'No phone registered')}
                                    </div>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  channel === 'sms' ? 'border-brand-gold bg-brand-gold text-[#141914]' : 'border-brand-border'
                                }`}>
                                  {channel === 'sms' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </button>

                              {/* Email option */}
                              <button
                                type="button"
                                disabled={!authUser?.email}
                                onClick={() => setChannel('email')}
                                className={`w-full p-2.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                                  channel === 'email'
                                    ? 'bg-brand-surface border-brand-gold shadow-xs'
                                    : 'bg-brand-surface-elevated/70 border-brand-border hover:border-brand-border/90'
                                } ${!authUser?.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                    channel === 'email'
                                      ? 'bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30'
                                      : 'bg-brand-surface border border-brand-border text-brand-text-muted'
                                  }`}>
                                    <Mail className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                                      <span>{isPersian ? 'ارسال به آدرس ایمیل' : 'Send to Email'}</span>
                                      {emailCooldown > 0 && (
                                        <span className="text-[10px] text-brand-bronze dark:text-brand-gold font-mono font-black">
                                          (<LiveTimerDisplay seconds={emailCooldown} />)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-brand-text-muted font-mono truncate" dir="ltr">
                                      {authUser?.email ? maskEmail(authUser.email) : (isPersian ? 'ایمیل ثبت نشده است' : 'No email registered')}
                                    </div>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  channel === 'email' ? 'border-brand-gold bg-brand-gold text-[#141914]' : 'border-brand-border'
                                }`}>
                                  {channel === 'email' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Guest / Unauthenticated Mode: Requires typing identifier */
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                              <span>{isPersian ? 'موبایل، ایمیل یا نام کاربری:' : 'Mobile, Email or Username:'}</span>
                            </label>
                            <Input
                              dir="auto"
                              aria-label={isPersian ? 'موبایل، ایمیل یا نام کاربری' : 'Mobile, Email or Username'}
                              placeholder={isPersian ? '۰۹۱۲۳۴۵۶۷۸۹ یا info@example.com' : '09123456789 or info@example.com'}
                              value={identifier}
                              onValueChange={(val) => {
                                setIdentifier(val);
                                if (identifierError) setIdentifierError('');
                              }}
                              variant="bordered"
                              radius="full"
                              classNames={{
                                inputWrapper:
                                  'h-10 px-4 bg-brand-surface-elevated/70 dark:bg-brand-surface-elevated/40 border border-brand-border hover:border-brand-bronze/80 dark:hover:border-brand-gold/80 focus-within:!border-brand-bronze dark:focus-within:!border-brand-gold rounded-full shadow-2xs transition-colors',
                                input: 'text-sm font-semibold text-brand-text text-start',
                              }}
                            />
                            <AnimatedFieldError error={identifierError} />
                          </div>

                          {/* Curved Pill Segmented Channel Control */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-text">
                              {isPersian ? 'نحوه دریافت کد تایید:' : 'Receive Code via:'}
                            </label>
                            <div className="grid grid-cols-2 p-1 rounded-full bg-brand-surface-elevated border border-brand-border relative h-9.5">
                              {/* Option 1: Mobile / SMS */}
                              <button
                                type="button"
                                onClick={() => setChannel('sms')}
                                className={`relative h-full flex items-center justify-center gap-2 rounded-full text-xs transition-colors cursor-pointer z-10 ${
                                  channel === 'sms'
                                    ? 'font-black text-brand-text'
                                    : 'font-semibold text-brand-text-muted hover:text-brand-text'
                                }`}
                              >
                                {channel === 'sms' && (
                                  <motion.div
                                    layoutId="resetPassActivePill"
                                    className="absolute inset-0 bg-brand-surface rounded-full border border-brand-border shadow-xs -z-10"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                  />
                                )}
                                <Smartphone className={`w-3.5 h-3.5 shrink-0 ${channel === 'sms' ? 'text-brand-bronze dark:text-brand-gold' : 'opacity-70'}`} />
                                <span>{isPersian ? 'پیامک همراه' : 'SMS'}</span>
                              </button>

                              {/* Option 2: Email */}
                              <button
                                type="button"
                                onClick={() => setChannel('email')}
                                className={`relative h-full flex items-center justify-center gap-2 rounded-full text-xs transition-colors cursor-pointer z-10 ${
                                  channel === 'email'
                                    ? 'font-black text-brand-text'
                                    : 'font-semibold text-brand-text-muted hover:text-brand-text'
                                }`}
                              >
                                {channel === 'email' && (
                                  <motion.div
                                    layoutId="resetPassActivePill"
                                    className="absolute inset-0 bg-brand-surface rounded-full border border-brand-border shadow-xs -z-10"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                  />
                                )}
                                <Mail className={`w-3.5 h-3.5 shrink-0 ${channel === 'email' ? 'text-brand-bronze dark:text-brand-gold' : 'opacity-70'}`} />
                                <span>{isPersian ? 'ارسال به ایمیل' : 'Email'}</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Cooldown Alert for current channel */}
                      <AnimatePresence>
                        {currentStep1Cooldown > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2 text-xs overflow-hidden shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-brand-text font-bold min-w-0 text-xs">
                                <Clock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0 animate-spin" />
                                <span className="truncate">
                                  {isPersian
                                    ? `کد ${channel === 'sms' ? 'پیامک' : 'ایمیل'} قبلی معتبر است. ارسال مجدد:`
                                    : `${channel === 'sms' ? 'SMS' : 'Email'} code active. Resend in:`}
                                </span>
                              </div>
                              <div className="bg-brand-surface px-2 py-0.5 rounded-full text-brand-bronze dark:text-brand-gold border border-brand-border shrink-0 font-black">
                                <LiveTimerDisplay seconds={currentStep1Cooldown} className="text-xs" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-brand-border/60 text-[11px]">
                              <span className="text-brand-text-muted font-medium">
                                {isPersian
                                  ? `کد ${channel === 'sms' ? 'پیامک' : 'ایمیل'} را دارید؟`
                                  : 'Have code?'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChannel(channel);
                                  setDirection(1);
                                  setStep(2);
                                }}
                                className="font-black text-brand-bronze dark:text-brand-gold hover:underline cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <span>{isPersian ? 'ثبت کد و تغییر رمز' : 'Enter Code'}</span>
                                {isPersian ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Step 1 Actions */}
                      <div className="flex gap-2.5 pt-1">
                        <Button
                          type="submit"
                          isLoading={loadingSend}
                          disabled={currentStep1Cooldown > 0}
                          radius="full"
                          startContent={!loadingSend && <Send className="w-3.5 h-3.5 shrink-0" />}
                          className={`flex-1 h-10 text-xs font-black transition-all rounded-full shadow-md ${
                            currentStep1Cooldown > 0
                              ? 'bg-brand-surface-elevated text-brand-text-muted/60 border border-brand-border opacity-70 cursor-not-allowed shadow-none'
                              : 'bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-brand-gold/20 cursor-pointer active:scale-98'
                          }`}
                        >
                          {loadingSend ? (
                            isPersian ? 'در حال صدور...' : 'Sending...'
                          ) : currentStep1Cooldown > 0 ? (
                            <span className="flex items-center gap-1.5 font-bold">
                              <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                              <LiveTimerDisplay seconds={currentStep1Cooldown} className="text-xs" />
                            </span>
                          ) : (
                            isPersian
                              ? `ارسال کد به ${channel === 'sms' ? 'شماره موبایل' : 'ایمیل'}`
                              : `Send Code via ${channel === 'sms' ? 'SMS' : 'Email'}`
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          radius="full"
                          onPress={onClose}
                          className="h-10 px-5 bg-brand-surface-elevated hover:bg-brand-surface border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-colors active:scale-98"
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
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <form onSubmit={handleResetPassword} className="space-y-3">
                      {/* Channel Switcher in Step 2: Allows switching between SMS and Email verification codes */}
                      <div className="grid grid-cols-2 p-1 rounded-full bg-brand-surface-elevated border border-brand-border relative h-9">
                        {/* Tab 1: SMS */}
                        <button
                          type="button"
                          onClick={() => setActiveChannel('sms')}
                          className={`relative h-full flex items-center justify-center gap-1.5 rounded-full text-xs transition-colors cursor-pointer z-10 ${
                            activeChannel === 'sms'
                              ? 'font-black text-brand-text'
                              : 'font-semibold text-brand-text-muted hover:text-brand-text'
                          }`}
                        >
                          {activeChannel === 'sms' && (
                            <motion.div
                              layoutId="step2ChannelPill"
                              className="absolute inset-0 bg-brand-surface rounded-full border border-brand-border shadow-xs -z-10"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                          )}
                          <Smartphone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <span>{isPersian ? 'کد پیامک' : 'SMS Code'}</span>
                          {smsCooldown > 0 && (
                            <span className="text-[10px] font-mono text-brand-bronze dark:text-brand-gold">
                              (<LiveTimerDisplay seconds={smsCooldown} />)
                            </span>
                          )}
                        </button>

                        {/* Tab 2: Email */}
                        <button
                          type="button"
                          onClick={() => setActiveChannel('email')}
                          className={`relative h-full flex items-center justify-center gap-1.5 rounded-full text-xs transition-colors cursor-pointer z-10 ${
                            activeChannel === 'email'
                              ? 'font-black text-brand-text'
                              : 'font-semibold text-brand-text-muted hover:text-brand-text'
                          }`}
                        >
                          {activeChannel === 'email' && (
                            <motion.div
                              layoutId="step2ChannelPill"
                              className="absolute inset-0 bg-brand-surface rounded-full border border-brand-border shadow-xs -z-10"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                          )}
                          <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <span>{isPersian ? 'کد ایمیل' : 'Email Code'}</span>
                          {emailCooldown > 0 && (
                            <span className="text-[10px] font-mono text-brand-bronze dark:text-brand-gold">
                              (<LiveTimerDisplay seconds={emailCooldown} />)
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Active Channel Destination Info & Live Timer Strip */}
                      {(() => {
                        const target = activeChannel === 'sms' ? smsTarget : emailTarget;
                        const cooldown = activeChannel === 'sms' ? smsCooldown : emailCooldown;
                        const devCode = activeChannel === 'sms' ? smsDevCode : emailDevCode;

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-brand-surface-elevated border border-brand-border text-xs">
                              <div className="flex items-center gap-1.5 min-w-0 text-brand-text-muted">
                                <span className="truncate">
                                  {activeChannel === 'sms'
                                    ? (isPersian ? 'کد ارسالی به:' : 'To:')
                                    : (isPersian ? 'کد ارسالی به ایمیل:' : 'To Email:')}
                                </span>
                                <span className="font-mono text-brand-text dir-ltr font-black truncate">
                                  {target || (isUserLoggedIn ? (activeChannel === 'sms' ? maskPhone(authUser?.phone) : maskEmail(authUser?.email)) : identifier)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Clock className={`w-3.5 h-3.5 ${cooldown > 0 ? 'text-brand-bronze dark:text-brand-gold animate-pulse' : 'text-rose-500'}`} />
                                <LiveTimerDisplay
                                  seconds={cooldown}
                                  className={cooldown > 0 ? 'text-brand-bronze dark:text-brand-gold text-xs' : 'text-rose-500 text-xs'}
                                />
                              </div>
                            </div>

                            {/* Dev Code Quick Fill (testing) */}
                            {devCode && (
                              <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-brand-surface-elevated border border-brand-border text-xs text-brand-text">
                                <span className="font-bold">
                                  {isPersian
                                    ? `🔑 کد تست (${activeChannel === 'sms' ? 'پیامک' : 'ایمیل'}):`
                                    : `🔑 Dev Code (${activeChannel}):`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCode(devCode)}
                                  className="font-mono font-black hover:underline cursor-pointer bg-brand-surface border border-brand-border px-2.5 py-0.5 rounded-full text-brand-bronze dark:text-brand-gold hover:border-brand-gold transition-colors"
                                >
                                  {devCode} {isPersian ? '(کلیک)' : '(fill)'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* OTP Code Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-brand-text flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <span>
                              {isPersian
                                ? `کد تایید ${activeChannel === 'sms' ? 'پیامک' : 'ایمیل'}:`
                                : `5-Digit ${activeChannel === 'sms' ? 'SMS' : 'Email'} Code:`}
                            </span>
                          </label>

                          {/* Resend / Send button for active channel */}
                          {(() => {
                            const cooldown = activeChannel === 'sms' ? smsCooldown : emailCooldown;
                            const target = activeChannel === 'sms' ? smsTarget : emailTarget;
                            const isNeverSent = !target && cooldown === 0;

                            return (
                              <button
                                type="button"
                                disabled={cooldown > 0 || loadingSend}
                                onClick={handleResendActiveChannel}
                                className={`font-bold flex items-center gap-1 transition-colors ${
                                  cooldown > 0
                                    ? 'text-brand-text-muted cursor-not-allowed opacity-60'
                                    : 'text-brand-bronze dark:text-brand-gold hover:underline cursor-pointer font-black'
                                }`}
                              >
                                <RotateCcw className={`w-3 h-3 ${loadingSend ? 'animate-spin' : ''}`} />
                                <span>
                                  {cooldown > 0 ? (
                                    <span className="flex items-center gap-1">
                                      <span>{isPersian ? 'ارسال مجدد:' : 'Resend:'}</span>
                                      <LiveTimerDisplay seconds={cooldown} className="text-xs" />
                                    </span>
                                  ) : isNeverSent ? (
                                    isPersian
                                      ? `ارسال کد به ${activeChannel === 'sms' ? 'پیامک' : 'ایمیل'}`
                                      : `Send ${activeChannel === 'sms' ? 'SMS' : 'Email'} Code`
                                  ) : isPersian ? (
                                    'ارسال مجدد کد'
                                  ) : (
                                    'Resend Code'
                                  )}
                                </span>
                              </button>
                            );
                          })()}
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
                          radius="full"
                          classNames={{
                            inputWrapper:
                              'h-10 px-4 bg-brand-surface-elevated/70 dark:bg-brand-surface-elevated/40 border border-brand-border hover:border-brand-bronze/80 dark:hover:border-brand-gold/80 focus-within:!border-brand-bronze dark:focus-within:!border-brand-gold rounded-full shadow-2xs transition-colors',
                            input: 'text-center tracking-[0.3em] text-sm font-mono font-black text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={codeError} />
                      </div>

                      {/* New Password Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-text flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
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
                          radius="full"
                          endContent={
                            <AnimatedPasswordToggle
                              isVisible={showNewPassword}
                              onToggle={() => setShowNewPassword((prev) => !prev)}
                              ariaLabel={isPersian ? 'تغییر نمایش رمز جدید' : 'Toggle new password visibility'}
                            />
                          }
                          classNames={{
                            inputWrapper:
                              'h-10 px-4 bg-brand-surface-elevated/70 dark:bg-brand-surface-elevated/40 border border-brand-border hover:border-brand-bronze/80 dark:hover:border-brand-gold/80 focus-within:!border-brand-bronze dark:focus-within:!border-brand-gold rounded-full shadow-2xs transition-colors',
                            input: 'text-sm font-semibold text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={newPasswordError} />
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-text flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
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
                          radius="full"
                          endContent={
                            <AnimatedPasswordToggle
                              isVisible={showConfirmPassword}
                              onToggle={() => setShowConfirmPassword((prev) => !prev)}
                              ariaLabel={isPersian ? 'تغییر نمایش تکرار رمز جدید' : 'Toggle confirm password visibility'}
                            />
                          }
                          classNames={{
                            inputWrapper:
                              'h-10 px-4 bg-brand-surface-elevated/70 dark:bg-brand-surface-elevated/40 border border-brand-border hover:border-brand-bronze/80 dark:hover:border-brand-gold/80 focus-within:!border-brand-bronze dark:focus-within:!border-brand-gold rounded-full shadow-2xs transition-colors',
                            input: 'text-sm font-semibold text-brand-text',
                          }}
                        />
                        <AnimatedFieldError error={confirmPasswordError} />
                      </div>

                      {/* Step 2 Actions */}
                      <div className="flex gap-2.5 pt-1">
                        <Button
                          type="submit"
                          isLoading={loadingReset}
                          radius="full"
                          startContent={!loadingReset && <Check className="w-3.5 h-3.5 shrink-0" />}
                          className="flex-1 h-10 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs rounded-full cursor-pointer shadow-md shadow-brand-gold/20 active:scale-98"
                        >
                          {loadingReset
                            ? (isPersian ? 'در حال ثبت...' : 'Saving...')
                            : (isPersian ? 'تغییر و ثبت رمز عبور' : 'Set Password')}
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          radius="full"
                          onPress={() => {
                            setDirection(-1);
                            setStep(1);
                          }}
                          className="h-10 px-5 bg-brand-surface-elevated hover:bg-brand-surface border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-colors active:scale-98"
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
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="py-4 text-center space-y-3.5"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-brand-text">
                        {isPersian ? 'رمز عبور با موفقیت تغییر یافت' : 'Password Successfully Reset'}
                      </h4>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'رمز عبور جدید حساب شما فعال شد. اکنون می‌توانید با رمز جدید وارد شوید.'
                          : 'Your password has been updated. You can now log in.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      radius="full"
                      onPress={onClose}
                      className="w-full h-10 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs rounded-full cursor-pointer shadow-md shadow-brand-gold/20 active:scale-98"
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
