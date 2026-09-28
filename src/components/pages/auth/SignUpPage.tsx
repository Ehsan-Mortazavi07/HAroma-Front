'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form } from 'formik';
import { Card, CardBody, Input, Button } from '@heroui/react';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Sparkles,
  KeyRound,
  Clock,
  RotateCcw,
  Edit3,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setAuth } from '@/stores/auth/authSlice';
import { getSignUpSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast, toEnglishDigits, toPersianDigits, getApiErrorMessage, storage } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { BrandLogo } from '@/components/common/BrandLogo';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { AnimatedPasswordToggle } from '@/components/common/AnimatedPasswordToggle';
import { useTranslation } from '@/common/i18n';

type SignUpStep = 'phone' | 'otp' | 'profile';

export function SignUpPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian, isRTL } = useTranslation();

  // If already logged in, redirect to profile
  useEffect(() => {
    if (isAuthenticated || (typeof window !== 'undefined' && storage.getToken())) {
      router.replace(PATHS.PROFILE);
    }
  }, [isAuthenticated, router]);

  // Multi-step Registration Flow
  const [step, setStep] = useState<SignUpStep>('phone');

  // Step 1: Phone State
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);

  // Step 2: OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpCodeError, setOtpCodeError] = useState('');
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Profile State
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [profileValues, setProfileValues] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = isPersian
      ? 'عضویت در هاتف آروما | HatefAroma'
      : 'Sign Up | HatefAroma';
  }, [isPersian]);

  // Countdown Timer for OTP Resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Live countdown timer for phone rate-limit cooldown
  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => {
      setPhoneCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhoneError((err) => (err.includes('ارسال مجدد') || err.includes('صبر کنید') ? '' : err));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  // Auto-focus OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return isPersian ? toPersianDigits(formatted) : formatted;
  };

  // Step 1: Send OTP for Registration
  const handleSendOtp = async (inputPhone?: string) => {
    const targetPhone = inputPhone || phone;
    const clean = toEnglishDigits(targetPhone.trim()).replace(/\D/g, '');

    if (!clean) {
      setPhoneError(isPersian ? 'وارد کردن شماره موبایل ضروری است.' : 'Mobile number is required.');
      return;
    }
    if (!clean.startsWith('09') || clean.length !== 11) {
      setPhoneError(
        isPersian
          ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Mobile number must be 11 digits starting with 09 (e.g. 09123456789).',
      );
      return;
    }

    if (phoneCooldown > 0) return;

    setPhoneError('');
    setLoadingSendOtp(true);

    try {
      const res = await axiosInstance.post('/auth/otp/send', {
        phone: clean,
        purpose: 'register',
      });

      if (res.data.devCode) {
        setDevCode(res.data.devCode);
      }
      setCountdown(res.data.expiresIn || 120);
      setPhoneCooldown(0);
      setStep('otp');
      setOtpCode('');
      setOtpCodeError('');

      toast.success(
        isPersian
          ? 'کد تایید یکبار مصرف با موفقیت ایجاد شد.'
          : 'Verification code sent successfully.',
      );
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      const retryAfter = err?.response?.data?.retryAfter;
      let waitSec = 0;
      if (typeof retryAfter === 'number' && retryAfter > 0) {
        waitSec = retryAfter;
      } else {
        const match = message.match(/(\d+)\s*(?:ثانیه|seconds)/i);
        if (match && match[1]) {
          waitSec = parseInt(match[1], 10);
        }
      }

      if (waitSec > 0) {
        setPhoneCooldown(waitSec);
        setPhoneError(message);
        toast.error(
          isPersian
            ? `لطفاً قبل از ارسال مجدد کد، ${toPersianDigits(waitSec)} ثانیه صبر کنید.`
            : `Please wait ${waitSec} seconds before resending code.`,
        );
      } else {
        setPhoneError(message);
        toast.error(message);
      }
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async () => {
    const cleanPhone = toEnglishDigits(phone.trim()).replace(/\D/g, '');
    const cleanCode = toEnglishDigits(otpCode.trim()).replace(/\D/g, '');

    if (!cleanCode) {
      setOtpCodeError(isPersian ? 'وارد کردن کد تایید ضروری است.' : 'Verification code is required.');
      return;
    }
    if (cleanCode.length < 5) {
      setOtpCodeError(isPersian ? 'کد تایید باید ۵ رقم باشد.' : 'Verification code must be 5 digits.');
      return;
    }

    setOtpCodeError('');
    setLoadingVerifyOtp(true);

    try {
      await axiosInstance.post('/auth/otp/verify', {
        phone: cleanPhone,
        code: cleanCode,
        purpose: 'register',
      });

      toast.success(isPersian ? 'شماره موبایل با موفقیت تایید شد.' : 'Phone verified successfully.');
      setStep('profile');
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setOtpCodeError(message);
      toast.error(message);
    } finally {
      setLoadingVerifyOtp(false);
    }
  };

  // Step 3: Complete Profile & Register
  const handleFinalRegister = async (values: any) => {
    const cleanPhone = toEnglishDigits(phone.trim()).replace(/\D/g, '');
    const cleanCode = toEnglishDigits(otpCode.trim()).replace(/\D/g, '');

    setLoadingRegister(true);
    setRegisterError('');
    setProfileValues(values);

    try {
      const res = await axiosInstance.post('/auth/register', {
        phone: cleanPhone,
        code: cleanCode,
        fullName: values.fullName?.trim(),
        username: values.username?.trim() || undefined,
        email: values.email?.trim() ? values.email.trim().toLowerCase() : undefined,
        password: values.password?.trim() || undefined,
        confirmPassword: values.confirmPassword?.trim() || undefined,
      });

      dispatch(
        setAuth({
          user: res.data.user,
          token: res.data.accessToken,
        }),
      );

      toast.success(
        isPersian
          ? `ثبت‌نام با موفقیت انجام شد، خوش آمدید ${res.data.user.fullName}! 🌿`
          : `Registration successful, welcome ${res.data.user.fullName}!`,
      );
      router.push(PATHS.HOME);
    } catch (err: any) {
      const message = getApiErrorMessage(err);
      setRegisterError(message);
      toast.error(message);
    } finally {
      setLoadingRegister(false);
    }
  };

  if (isAuthenticated || (typeof window !== 'undefined' && storage.getToken())) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-6 px-4">
      <Card className="w-full max-w-md bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-2xl transition-all duration-300 ease-out">
        <CardBody className="p-0 space-y-6">
          {/* Header with Brand Logo */}
          <div className="flex flex-col items-center text-center space-y-3">
            <BrandLogo size="md" showText={false} />
            <div>
              <h1 className="text-2xl font-black text-brand-text">
                {t.auth.signUpTitle}
              </h1>
              <p className="text-xs text-brand-text-muted mt-1">
                {step === 'phone' && (isPersian ? 'برای ثبت‌نام ابتدا شماره موبایل خود را وارد کنید' : 'Enter your phone number to start')}
                {step === 'otp' && (isPersian ? 'کد ۵ رقمی ارسال‌شده را وارد نمایید' : 'Enter the 5-digit verification code')}
                {step === 'profile' && (isPersian ? 'اطلاعات حساب کاربری خود را تکمیل کنید' : 'Complete your profile details')}
              </p>
            </div>
          </div>

          {/* Steps Progress Indicator */}
          <div className="flex items-center justify-between px-2 select-none">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'phone'
                    ? 'bg-brand-gold text-[#141914] shadow-md shadow-brand-gold/30 font-black scale-105'
                    : 'bg-brand-surface-elevated text-brand-gold border border-brand-gold/30'
                }`}
              >
                {step !== 'phone' ? <Check className="w-3.5 h-3.5" /> : (isPersian ? '۱' : '1')}
              </div>
              <span
                className={`text-[11px] font-bold hidden sm:inline ${
                  step === 'phone' ? 'text-brand-text' : 'text-brand-text-muted'
                }`}
              >
                {isPersian ? 'شماره موبایل' : 'Phone'}
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                step === 'otp' || step === 'profile' ? 'bg-brand-gold' : 'bg-brand-border'
              }`}
            />

            {/* Step 2 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'otp'
                    ? 'bg-brand-gold text-[#141914] shadow-md shadow-brand-gold/30 font-black scale-105'
                    : step === 'profile'
                      ? 'bg-brand-surface-elevated text-brand-gold border border-brand-gold/30'
                      : 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border'
                }`}
              >
                {step === 'profile' ? <Check className="w-3.5 h-3.5" /> : (isPersian ? '۲' : '2')}
              </div>
              <span
                className={`text-[11px] font-bold hidden sm:inline ${
                  step === 'otp' ? 'text-brand-text' : 'text-brand-text-muted'
                }`}
              >
                {isPersian ? 'کد تایید' : 'OTP'}
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                step === 'profile' ? 'bg-brand-gold' : 'bg-brand-border'
              }`}
            />

            {/* Step 3 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'profile'
                    ? 'bg-brand-gold text-[#141914] shadow-md shadow-brand-gold/30 font-black scale-105'
                    : 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border'
                }`}
              >
                {isPersian ? '۳' : '3'}
              </div>
              <span
                className={`text-[11px] font-bold hidden sm:inline ${
                  step === 'profile' ? 'text-brand-text' : 'text-brand-text-muted'
                }`}
              >
                {isPersian ? 'مشخصات' : 'Profile'}
              </span>
            </div>
          </div>

          {/* MULTI-STEP PANELS WITH DIRECTIONAL SLIDE & BLUR ANIMATION */}
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 1: PHONE INPUT */}
            {step === 'phone' && (
              <motion.div
                key="signup-step-phone"
                initial={{ opacity: 0, x: isRTL ? 16 : -16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isRTL ? 16 : -16, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {isPersian ? 'شماره موبایل' : 'Mobile Number'}
                  </label>
                  <Input
                    type="tel"
                    aria-label={isPersian ? 'شماره موبایل' : 'Mobile Number'}
                    placeholder={isPersian ? '۰۹۱۲۳۴۵۶۷۸۹' : '09123456789'}
                    maxLength={11}
                    value={phone}
                    onChange={(e) => {
                      const digits = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 11);
                      if (digits !== phone) {
                        setPhoneCooldown(0);
                      }
                      setPhone(digits);
                      if (digits.length === 11 && digits.startsWith('09')) {
                        setPhoneError('');
                      } else if (phoneTouched && !digits) {
                        setPhoneError(isPersian ? 'وارد کردن شماره موبایل ضروری است.' : 'Mobile number is required.');
                      }
                    }}
                    onBlur={() => {
                      setPhoneTouched(true);
                      const clean = toEnglishDigits(phone.trim()).replace(/\D/g, '');
                      if (!clean) {
                        setPhoneError(isPersian ? 'وارد کردن شماره موبایل ضروری است.' : 'Mobile number is required.');
                      } else if (!clean.startsWith('09') || clean.length !== 11) {
                        setPhoneError(
                          isPersian
                            ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
                            : 'Mobile number must be 11 digits starting with 09 (e.g. 09123456789).',
                        );
                      } else if (phoneCooldown <= 0) {
                        setPhoneError('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendOtp();
                      }
                    }}
                    variant="bordered"
                    radius="lg"
                    startContent={<Smartphone className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(phoneError || phoneCooldown > 0)}
                    classNames={{
                      inputWrapper: Boolean(phoneError || phoneCooldown > 0)
                        ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors'
                        : 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                      input: 'text-sm font-bold text-brand-text tracking-wider',
                    }}
                  />
                  <AnimatedFieldError
                    error={phoneCooldown > 0 ? true : phoneError}
                    extra={
                      phoneError && phoneError.includes('وارد شوید') ? (
                        <Link
                          href={PATHS.SIGN_IN}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-gold hover:underline mt-0.5"
                        >
                          <span>{isPersian ? '← ورود به حساب کاربری' : '← Sign in to your account'}</span>
                        </Link>
                      ) : null
                    }
                  >
                    {phoneCooldown > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 leading-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0 animate-pulse" />
                          <span>
                            {isPersian ? (
                              <>
                                لطفاً قبل از ارسال مجدد کد،{' '}
                                <span className="inline-block px-1 font-mono font-black [font-variant-numeric:tabular-nums] text-rose-600 dark:text-rose-400">
                                  {toPersianDigits(phoneCooldown)}
                                </span>{' '}
                                ثانیه صبر کنید.
                              </>
                            ) : (
                              <>
                                Please wait{' '}
                                <span className="inline-block px-1 font-mono font-black [font-variant-numeric:tabular-nums]">
                                  {phoneCooldown}
                                </span>{' '}
                                seconds before resending code.
                              </>
                            )}
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </AnimatedFieldError>
                  <p className="text-[11px] text-brand-text-muted mt-2 leading-relaxed">
                    {isPersian
                      ? 'کد تایید یکبار مصرف جهت اعتبارسنجی شماره شما ارسال خواهد شد.'
                      : 'A one-time verification code will be sent to confirm your number.'}
                  </p>
                </div>

                <Button
                  type="button"
                  onPress={() => handleSendOtp()}
                  isLoading={loadingSendOtp}
                  disabled={phoneCooldown > 0}
                  radius="lg"
                  className={`w-full h-12 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 mt-2 ${
                    phoneCooldown > 0
                      ? 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border opacity-70 cursor-not-allowed shadow-none'
                      : 'bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-brand-gold/20 cursor-pointer'
                  }`}
                >
                  {!loadingSendOtp && (
                    phoneCooldown > 0 ? (
                      <span className="flex items-center gap-1.5 font-bold">
                        <span>{isPersian ? 'ارسال مجدد پس از:' : 'Resend in:'}</span>
                        <span className="font-mono font-black [font-variant-numeric:tabular-nums]">
                          {toPersianDigits(phoneCooldown)} {isPersian ? 'ثانیه' : 's'}
                        </span>
                      </span>
                    ) : (
                      <>
                        <span>{isPersian ? 'ارسال کد تایید' : 'Send Verification Code'}</span>
                        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </>
                    )
                  )}
                </Button>
              </motion.div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <motion.div
                key="signup-step-otp"
                initial={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Phone Header with Edit button */}
                <div className="flex items-center justify-between p-3 bg-brand-surface-elevated rounded-2xl border border-brand-border">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-gold shrink-0" />
                    <div className="text-xs">
                      <span className="text-brand-text-muted">
                        {isPersian ? 'ارسال شده به: ' : 'Sent to: '}
                      </span>
                      <span className="font-bold font-mono text-brand-text tracking-wider">
                        {isPersian ? toPersianDigits(phone) : phone}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setDevCode(null);
                    }}
                    className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isPersian ? 'ویرایش شماره' : 'Edit'}</span>
                  </button>
                </div>

                {/* Dev Test Code Helper */}
                {devCode && (
                  <div
                    onClick={() => {
                      setOtpCode(devCode);
                      if (otpCodeError) setOtpCodeError('');
                    }}
                    className="p-3 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-gold shrink-0 animate-pulse" />
                      <span className="text-xs text-brand-text font-bold">
                        {isPersian ? 'کد تایید تست سیستم:' : 'System Dev Code:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-black tracking-widest text-brand-gold bg-brand-surface px-2.5 py-0.5 rounded-xl border border-brand-gold/20 group-hover:border-brand-gold">
                        {isPersian ? toPersianDigits(devCode) : devCode}
                      </span>
                      <span className="text-[10px] text-brand-text-muted group-hover:text-brand-gold font-medium">
                        ({isPersian ? 'کلیک جهت درج' : 'click to fill'})
                      </span>
                    </div>
                  </div>
                )}

                {/* Code Input */}
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {isPersian ? 'کد ۵ رقمی تایید' : '5-Digit Verification Code'}
                  </label>
                  <Input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    aria-label={isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Verification Code'}
                    placeholder={isPersian ? '۱۲۳۴۵' : '12345'}
                    maxLength={5}
                    value={otpCode}
                    onChange={(e) => {
                      const digits = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 5);
                      setOtpCode(digits);
                      if (digits.length === 5) {
                        setOtpCodeError('');
                      }
                    }}
                    onBlur={() => {
                      if (!otpCode.trim()) {
                        setOtpCodeError(isPersian ? 'وارد کردن کد تایید ضروری است.' : 'Verification code is required.');
                      } else if (otpCode.trim().length < 5) {
                        setOtpCodeError(isPersian ? 'کد تایید باید ۵ رقم باشد.' : 'Verification code must be 5 digits.');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerifyOtp();
                      }
                    }}
                    variant="bordered"
                    radius="lg"
                    startContent={<KeyRound className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(otpCodeError)}
                    classNames={{
                      inputWrapper: Boolean(otpCodeError)
                        ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors'
                        : 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                      input: 'text-center font-mono font-bold text-brand-text tracking-[0.3em] text-base',
                    }}
                  />
                  <AnimatedFieldError error={otpCodeError} />
                </div>

                {/* Countdown Timer & Resend */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {countdown > 0 ? (
                    <div className="flex items-center gap-1.5 text-brand-text-muted">
                      <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span>{isPersian ? 'زمان باقیمانده:' : 'Time remaining:'}</span>
                      <span className="font-mono font-bold text-brand-gold">
                        {formatTimer(countdown)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(phone)}
                      disabled={loadingSendOtp}
                      className="text-brand-gold hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isPersian ? 'ارسال مجدد کد' : 'Resend code'}</span>
                    </button>
                  )}
                </div>

                {/* Next Step Button */}
                <Button
                  type="button"
                  onPress={handleVerifyOtp}
                  isLoading={loadingVerifyOtp}
                  radius="lg"
                  className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                >
                  {!loadingVerifyOtp && (
                    <>
                      <span>{isPersian ? 'تایید و ادامه مرحله بعد' : 'Verify & Continue'}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* STEP 3: PROFILE DETAILS */}
            {step === 'profile' && (
              <motion.div
                key="signup-step-profile"
                initial={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <Formik
                  initialValues={profileValues}
                  validationSchema={getSignUpSchema(isPersian)}
                  onSubmit={handleFinalRegister}
                  enableReinitialize
                >
                  {({ values, errors, touched, handleChange, handleBlur, submitCount }) => (
                    <Form className="space-y-3.5">
                      {/* Full Name (Required) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-brand-text">
                            {t.auth.fullName} <span className="text-rose-500">*</span>
                          </label>
                        </div>
                        <Input
                          dir="auto"
                          name="fullName"
                          type="text"
                          aria-label={t.auth.fullName}
                          placeholder={isPersian ? 'مثال: احسان مرتضوی' : 'e.g. Ehsan Mortazavi'}
                          value={values.fullName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                          isInvalid={Boolean(errors.fullName && (touched.fullName || submitCount > 0))}
                          classNames={{
                            inputWrapper: Boolean(errors.fullName && (touched.fullName || submitCount > 0))
                              ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                              : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text",
                          }}
                        />
                        <AnimatedFieldError error={(touched.fullName || submitCount > 0) && errors.fullName ? String(errors.fullName) : null} />
                      </div>

                      {/* Username (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-brand-text">
                            {t.auth.username}
                          </label>
                          <span className="text-[10px] text-brand-text-muted">
                            {isPersian ? '(اختیاری - خودکار تخصیص می‌یابد)' : '(Optional)'}
                          </span>
                        </div>
                        <Input
                          dir="auto"
                          name="username"
                          type="text"
                          aria-label={t.auth.username}
                          placeholder={isPersian ? 'نام کاربری لاتین (اختیاری)' : 'username (optional)'}
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                          isInvalid={Boolean(errors.username && (touched.username || submitCount > 0))}
                          classNames={{
                            inputWrapper: Boolean(errors.username && (touched.username || submitCount > 0))
                              ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                              : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-mono text-brand-text",
                          }}
                        />
                        <AnimatedFieldError error={(touched.username || submitCount > 0) && errors.username ? String(errors.username) : null} />
                      </div>

                      {/* Email (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-brand-text">
                            {t.auth.email}
                          </label>
                          <span className="text-[10px] text-brand-text-muted">
                            {isPersian ? '(اختیاری - قابل تکمیل در پروفایل)' : '(Optional)'}
                          </span>
                        </div>
                        <Input
                          name="email"
                          type="email"
                          aria-label={t.auth.email}
                          placeholder="email@example.com"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<Mail className="w-4 h-4 text-brand-bronze shrink-0" />}
                          isInvalid={Boolean(errors.email && (touched.email || submitCount > 0))}
                          classNames={{
                            inputWrapper: Boolean(errors.email && (touched.email || submitCount > 0))
                              ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                              : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-mono text-brand-text",
                          }}
                        />
                        <AnimatedFieldError error={(touched.email || submitCount > 0) && errors.email ? String(errors.email) : null} />
                      </div>

                      {/* Password (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-brand-text">
                            {t.auth.password}
                          </label>
                          <span className="text-[10px] text-brand-text-muted">
                            {isPersian ? '(اختیاری - جهت ورود با رمز)' : '(Optional)'}
                          </span>
                        </div>
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          aria-label={t.auth.password}
                          placeholder="••••••••"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<Lock className="w-4 h-4 text-brand-bronze shrink-0" />}
                          endContent={
                            <AnimatedPasswordToggle
                              isVisible={showPassword}
                              onToggle={() => setShowPassword(!showPassword)}
                              ariaLabel={isPersian ? 'تغییر نمایش کلمه عبور' : 'Toggle password visibility'}
                            />
                          }
                          isInvalid={Boolean(errors.password && (touched.password || submitCount > 0))}
                          classNames={{
                            inputWrapper: Boolean(errors.password && (touched.password || submitCount > 0))
                              ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                              : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-mono font-semibold text-brand-text",
                          }}
                        />
                        <AnimatedFieldError error={(touched.password || submitCount > 0) && errors.password ? String(errors.password) : null} />
                      </div>

                      {/* Confirm Password (Only shown if password entered) */}
                      {Boolean(values.password) && (
                        <div>
                          <label className="block text-xs font-bold text-brand-text mb-1.5">
                            {t.auth.confirmPassword} <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            aria-label={t.auth.confirmPassword}
                            placeholder="••••••••"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            variant="bordered"
                            radius="lg"
                            startContent={<Lock className="w-4 h-4 text-brand-bronze shrink-0" />}
                            endContent={
                              <AnimatedPasswordToggle
                                isVisible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                ariaLabel={isPersian ? 'تغییر نمایش تکرار کلمه عبور' : 'Toggle confirm password visibility'}
                              />
                            }
                            isInvalid={Boolean(errors.confirmPassword && (touched.confirmPassword || submitCount > 0))}
                            classNames={{
                              inputWrapper: Boolean(errors.confirmPassword && (touched.confirmPassword || submitCount > 0))
                                ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                                : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                              input: "text-sm font-mono font-semibold text-brand-text",
                            }}
                          />
                          <AnimatedFieldError error={(touched.confirmPassword || submitCount > 0) && errors.confirmPassword ? String(errors.confirmPassword) : null} />
                        </div>
                      )}

                      <p className="text-[11px] text-brand-text-muted leading-relaxed pt-1">
                        {isPersian
                          ? 'نکته: ایمیل، نام کاربری و کلمه عبور را می‌توانید بعداً در پنل پروفایل کاربری خود تکمیل یا ویرایش کنید.'
                          : 'Note: You can complete or edit your username, email, and password later in your profile.'}
                      </p>

                      {registerError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-500">
                          <span className="font-semibold">{registerError}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRegisterError('');
                              setStep('phone');
                            }}
                            className="text-brand-gold font-bold hover:underline shrink-0 mr-2 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isPersian ? 'دریافت مجدد کد تایید' : 'Request new code'}</span>
                            {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      <Button
                        type="submit"
                        isLoading={loadingRegister}
                        radius="lg"
                        className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                      >
                        {!loadingRegister && (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isPersian ? 'تکمیل ثبت‌نام و ورود به سایت' : 'Complete & Sign Up'}</span>
                          </>
                        )}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Login Link */}
          <div className="text-center text-xs text-brand-text-muted pt-2 border-t border-brand-border/60">
            <span>{t.auth.haveAccount} </span>
            <Link
              href={PATHS.SIGN_IN}
              className="font-bold text-brand-bronze dark:text-brand-gold hover:underline"
            >
              {t.auth.goToSignIn}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
