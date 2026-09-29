'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  useRouter,
  useSearchParams } from 'next/navigation';
import { Formik,
  Form } from 'formik';
import { Card,
  CardBody,
  Button,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  KeyRound,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Edit3,
  Clock,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setAuth } from '@/stores/auth/authSlice';
import { getSignInSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast, toPersianDigits, toEnglishDigits, getApiErrorMessage, storage } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { BrandLogo } from '@/components/common/BrandLogo';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { PasswordInput } from '@/components/common/PasswordInput';
import { ResetPasswordModal } from '@/components/common/ResetPasswordModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/common/i18n';

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian, isRTL } = useTranslation();
  const redirectUrl = searchParams.get('redirect') || PATHS.HOME;

  // If already logged in, redirect to profile or target page
  useEffect(() => {
    if (isAuthenticated || (typeof window !== 'undefined' && storage.getToken())) {
      const destination = redirectUrl && !redirectUrl.startsWith('/auth') ? redirectUrl : PATHS.PROFILE;
      router.replace(destination);
    }
  }, [isAuthenticated, redirectUrl, router]);

  // Active Login Method: 'otp' | 'password'
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');

  // Reset Password Modal State
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Password Login State
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCodeError, setOtpCodeError] = useState('');
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = isPersian
      ? 'ورود به حساب کاربری | هاتف آروما'
      : 'Sign In | HatefAroma';
  }, [isPersian]);

  // Countdown timer for OTP resend
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

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return isPersian ? toPersianDigits(formatted) : formatted;
  };

  // Handle Send OTP
  const handleSendOtp = async (targetPhone?: string) => {
    const rawNumber = targetPhone || phone;
    const cleanNumber = toEnglishDigits(rawNumber.trim()).replace(/\D/g, '');

    setPhoneTouched(true);
    if (!cleanNumber) {
      setPhoneError(isPersian ? 'وارد کردن شماره موبایل ضروری است.' : 'Phone number is required.');
      return;
    }

    if (!cleanNumber.startsWith('09') || cleanNumber.length !== 11) {
      setPhoneError(
        isPersian
          ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Phone number must be 11 digits starting with 09 (e.g. 09123456789).',
      );
      return;
    }

    if (phoneCooldown > 0) return;

    setPhoneError('');
    setLoadingSendOtp(true);
    try {
      const res = await axiosInstance.post('/auth/otp/send', {
        phone: cleanNumber,
        purpose: 'login',
      });

      if (res.data?.devCode) {
        setDevCode(res.data.devCode);
      }
      setCountdown(res.data?.expiresIn || 120);
      setPhoneCooldown(0);
      setOtpStep('verify');
      setOtpCode('');
      setOtpCodeError('');

      toast.success(
        isPersian
          ? res.data.message || 'کد تایید یکبار مصرف ارسال شد.'
          : 'Verification code generated successfully.',
      );

      // Focus on OTP input after short delay
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    } catch (err: any) {
      const serverMsg = getApiErrorMessage(err);
      const retryAfter = err?.response?.data?.retryAfter;
      let waitSec = 0;
      if (typeof retryAfter === 'number' && retryAfter > 0) {
        waitSec = retryAfter;
      } else {
        const match = serverMsg.match(/(\d+)\s*(?:ثانیه|seconds)/i);
        if (match && match[1]) {
          waitSec = parseInt(match[1], 10);
        }
      }

      if (waitSec > 0) {
        setPhoneCooldown(waitSec);
        setPhoneError(serverMsg);
        toast.error(
          isPersian
            ? `لطفاً قبل از ارسال مجدد کد، ${toPersianDigits(waitSec)} ثانیه صبر کنید.`
            : `Please wait ${waitSec} seconds before resending code.`,
        );
      } else {
        setPhoneError(serverMsg);
        toast.error(serverMsg);
      }
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // Handle Verify OTP
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
      const res = await axiosInstance.post('/auth/otp/verify', {
        phone: cleanPhone,
        code: cleanCode,
      });

      dispatch(
        setAuth({
          user: res.data.user,
          token: res.data.accessToken,
        }),
      );

      toast.success(
        res.data.isNewUser
          ? isPersian
            ? `ثبت‌نام و ورود با موفقیت انجام شد! خوش آمدید 🌿`
            : 'Account registered and logged in successfully!'
          : isPersian
            ? `خوش آمدید، ${res.data.user.fullName}! 🌿`
            : `Welcome back, ${res.data.user.fullName}!`,
      );

      if (res.data.user.role === 'admin' || res.data.user.role === 'editor') {
        router.push(PATHS.ADMIN_DASHBOARD);
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      const serverMsg = getApiErrorMessage(err);
      setOtpCodeError(
        serverMsg ||
          (isPersian ? 'کد تایید وارد شده نامعتبر یا منقضی است.' : 'Invalid or expired code.'),
      );
      toast.error(serverMsg || (isPersian ? 'کد تایید نامعتبر است.' : 'Invalid verification code.'));
    } finally {
      setLoadingVerifyOtp(false);
    }
  };

  // Handle Password Login
  const handlePasswordSubmit = async (values: any, { setFieldError, setFieldTouched }: any) => {
    setLoadingPassword(true);
    try {
      const res = await axiosInstance.post('/auth/login', {
        identifier: values.identifier,
        password: values.password,
      });

      dispatch(
        setAuth({
          user: res.data.user,
          token: res.data.accessToken,
        }),
      );

      toast.success(
        isPersian
          ? `خوش آمدید، ${res.data.user.fullName}! 🌿`
          : `Welcome back, ${res.data.user.fullName}!`,
      );

      if (res.data.user.role === 'admin' || res.data.user.role === 'editor') {
        router.push(PATHS.ADMIN_DASHBOARD);
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      const serverMsg = getApiErrorMessage(err);
      if (serverMsg.includes('رمز عبور') || serverMsg.includes('پسورد')) {
        setFieldError('password', serverMsg);
        setFieldTouched('password', true, false);
      } else {
        setFieldError('identifier', serverMsg);
        setFieldTouched('identifier', true, false);
      }
      toast.error(serverMsg);
    } finally {
      setLoadingPassword(false);
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
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <BrandLogo size="md" />
            </div>
            <h1 className="text-2xl font-black text-brand-text">
              {t.auth.signInTitle}
            </h1>
            <p className="text-xs text-brand-text-muted">
              {isPersian
                ? 'برای تجربه خرید سریع و اختصاصی وارد حساب خود شوید'
                : 'Sign in to access your luxury shopping experience'}
            </p>
          </div>

          {/* Authentication Method Selector */}
          <div className="relative bg-brand-surface-elevated/90 p-1.5 rounded-2xl border border-brand-border flex gap-1 select-none">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setOtpStep('phone');
              }}
              className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer z-0 ${
                authMethod === 'otp'
                  ? 'text-[#141914] font-black'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {authMethod === 'otp' && (
                <motion.div
                  layoutId="activeAuthMethodPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-brand-gold rounded-xl shadow-md shadow-brand-gold/25"
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>{isPersian ? 'کد یکبار مصرف' : 'OTP Login'}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer z-0 ${
                authMethod === 'password'
                  ? 'text-[#141914] font-black'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {authMethod === 'password' && (
                <motion.div
                  layoutId="activeAuthMethodPill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-brand-gold rounded-xl shadow-md shadow-brand-gold/25"
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{isPersian ? 'کلمه عبور' : 'Password'}</span>
              </span>
            </button>
          </div>

          {/* TAB CONTENT PANELS WITH DIRECTIONAL SLIDE & BLUR ANIMATION */}
          <AnimatePresence mode="wait" initial={false}>
            {authMethod === 'otp' ? (
              <motion.div
                key="auth-tab-otp"
                initial={{ opacity: 0, x: isRTL ? 16 : -16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isRTL ? 16 : -16, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {otpStep === 'phone' ? (
                    /* Step 1: Input Phone */
                    <motion.div
                      key="otp-step-phone"
                      initial={{ opacity: 0, x: isRTL ? 14 : -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRTL ? 14 : -14 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
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
                            phoneError && phoneError.includes('ثبت‌نام') ? (
                              <Link
                                href={PATHS.SIGN_UP}
                                className="inline-flex items-center gap-1 text-xs font-bold text-brand-gold hover:underline mt-0.5"
                              >
                                <span>{isPersian ? '← ایجاد حساب کاربری جدید' : '← Create new account'}</span>
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
                            ? 'کد یکبار مصرف تنها برای شماره‌های ثبت‌نام شده در سایت ارسال خواهد شد.'
                            : 'Verification code is only sent to accounts registered on the website.'}
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
                  ) : (
                    /* Step 2: Verify Code */
                    <motion.div
                      key="otp-step-verify"
                      initial={{ opacity: 0, x: isRTL ? -14 : 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRTL ? -14 : 14 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
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
                            setOtpStep('phone');
                            setDevCode(null);
                          }}
                          className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isPersian ? 'ویرایش شماره' : 'Edit'}</span>
                        </button>
                      </div>

                      {/* Dev Test Code Helper (Since no SMS gateway is used yet) */}
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

                      {/* Verify & Enter Button */}
                      <Button
                        type="button"
                        onPress={handleVerifyOtp}
                        isLoading={loadingVerifyOtp}
                        radius="lg"
                        className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                      >
                        {!loadingVerifyOtp && (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isPersian ? 'تایید و ورود به حساب' : 'Verify & Sign In'}</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* TAB 2: PASSWORD AUTHENTICATION */
              <motion.div
                key="auth-tab-password"
                initial={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: isRTL ? -16 : 16, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <Formik
                  initialValues={{ identifier: '', password: '' }}
                  validationSchema={getSignInSchema(isPersian)}
                  onSubmit={handlePasswordSubmit}
                  enableReinitialize
                >
                  {({ values, errors, touched, handleChange, handleBlur, setFieldValue, submitCount }) => (
                    <Form className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-text mb-1.5">
                          {t.auth.identifier}
                        </label>
                        <Input
                          dir="auto"
                          name="identifier"
                          type="text"
                          aria-label={t.auth.identifier}
                          placeholder={isPersian ? 'نام کاربری، شماره موبایل یا ایمیل' : 'Username, phone or email'}
                          value={values.identifier}
                          onChange={(e) => {
                            const val = toEnglishDigits(e.target.value);
                            if (/^0\d*$/.test(val)) {
                              setFieldValue('identifier', val.replace(/\D/g, '').slice(0, 11));
                            } else {
                              handleChange(e);
                            }
                          }}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                          isInvalid={Boolean(errors.identifier && (touched.identifier || submitCount > 0))}
                          classNames={{
                            inputWrapper: Boolean(errors.identifier && (touched.identifier || submitCount > 0))
                              ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                              : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text",
                          }}
                        />
                        <AnimatedFieldError error={(touched.identifier || submitCount > 0) && errors.identifier ? String(errors.identifier) : null} />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-brand-text">
                            {t.auth.password}
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsResetPasswordOpen(true);
                            }}
                            className="text-[11px] text-brand-bronze dark:text-brand-gold hover:underline cursor-pointer bg-transparent border-0 p-0"
                          >
                            {t.auth.forgotPassword}
                          </button>
                        </div>
                        <PasswordInput
                          name="password"
                          isPersian={isPersian}
                          isVisible={showPassword}
                          onToggleVisibility={() => setShowPassword((prev) => !prev)}
                          aria-label={t.auth.password}
                          placeholder="••••••••"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          variant="bordered"
                          radius="lg"
                          startContent={<Lock className="w-4 h-4 text-brand-bronze shrink-0" />}
                          toggleAriaLabel={isPersian ? 'تغییر نمایش کلمه عبور' : 'Toggle password visibility'}
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

                      <Button
                        type="submit"
                        isLoading={loadingPassword}
                        radius="lg"
                        className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                      >
                        {!loadingPassword && (
                          <>
                            <span>{t.auth.signInBtn}</span>
                            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </>
                        )}
                      </Button>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Register Link */}
          <div className="text-center text-xs text-brand-text-muted pt-2 border-t border-brand-border/60">
            <span>{t.auth.noAccount} </span>
            <Link
              href={PATHS.SIGN_UP}
              className="font-bold text-brand-bronze dark:text-brand-gold hover:underline"
            >
              {t.auth.createAccount}
            </Link>
          </div>
        </CardBody>
      </Card>

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        initialIdentifier={phone || ''}
      />
    </div>
  );
}
