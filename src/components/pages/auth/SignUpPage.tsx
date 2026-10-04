'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Formik, FormikHelpers } from 'formik';
import { Button, Card, CardBody } from '@heroui/react';
import { Lock, Mail, ShieldCheck, Smartphone, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setAuth } from '@/stores/auth/authSlice';
import { getSignUpSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { getApiErrorMessage, toEnglishDigits, toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { BrandLogo } from '@/components/common/BrandLogo';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { Input } from '@/components/common/DirectionalFields';
import { PasswordInput } from '@/components/common/PasswordInput';
import { useTranslation } from '@/common/i18n';

interface SignUpValues {
  fullName: string;
  phone: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialValues: SignUpValues = {
  fullName: '',
  phone: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const inputClassNames = (invalid: boolean) => ({
  inputWrapper: invalid
    ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors'
    : 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
  input: 'text-sm font-semibold text-brand-text',
});

export function SignUpPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian, isRTL } = useTranslation();
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    document.title = isPersian ? 'عضویت در هاتف آروما | HatefAroma' : 'Sign Up | HatefAroma';
  }, [isPersian]);

  useEffect(() => {
    if (isAuthenticated) router.replace(PATHS.PROFILE);
  }, [isAuthenticated, router]);

  const handleRegister = async (
    values: SignUpValues,
    { setSubmitting }: FormikHelpers<SignUpValues>,
  ) => {
    setLoadingRegister(true);
    setRegisterError('');

    try {
      const phone = toEnglishDigits(values.phone.trim());
      const response = await axiosInstance.post('/auth/register', {
        fullName: values.fullName.trim(),
        phone: phone || undefined,
        username: values.username.trim() || undefined,
        email: values.email.trim() ? values.email.trim().toLowerCase() : undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      dispatch(setAuth({ user: response.data.user }));
      toast.success(isPersian ? `ثبت‌نام با موفقیت انجام شد، خوش آمدید ${response.data.user.fullName}! 🌿` : `Registration successful, welcome ${response.data.user.fullName}!`);
      router.push(PATHS.HOME);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      setRegisterError(message);
      toast.error(message);
    } finally {
      setLoadingRegister(false);
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-2xl">
        <CardBody className="p-0 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <BrandLogo size="md" showText={false} />
            <div>
              <h1 className="text-2xl font-black text-brand-text">{t.auth.signUpTitle}</h1>
              <p className="text-xs text-brand-text-muted mt-1">
                {isPersian ? 'اطلاعات حساب خود را وارد کنید؛ تأیید شماره بعداً از پروفایل انجام می‌شود.' : 'Create your account now. You can verify your phone later in your profile.'}
              </p>
            </div>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={getSignUpSchema(isPersian)}
            onSubmit={handleRegister}
          >
            {({ values, errors, touched, handleChange, handleBlur, submitCount, isSubmitting }) => (
              <Form className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.fullName} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    dir="auto"
                    name="fullName"
                    aria-label={t.auth.fullName}
                    placeholder={isPersian ? 'مثال: احسان مرتضوی' : 'e.g. Ehsan Mortazavi'}
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.fullName && (touched.fullName || submitCount > 0))}
                    classNames={inputClassNames(Boolean(errors.fullName && (touched.fullName || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.fullName || submitCount > 0) && errors.fullName ? String(errors.fullName) : null} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-brand-text" htmlFor="signup-phone">
                      {isPersian ? 'شماره موبایل' : 'Mobile number'}
                    </label>
                    <span className="text-[10px] text-brand-text-muted">{isPersian ? '(اختیاری)' : '(Optional)'}</span>
                  </div>
                  <Input
                    id="signup-phone"
                    dir="ltr"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    aria-label={isPersian ? 'شماره موبایل (اختیاری)' : 'Mobile number (optional)'}
                    placeholder={isPersian ? '۰۹۱۲۳۴۵۶۷۸۹' : '09123456789'}
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<Smartphone className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.phone && (touched.phone || submitCount > 0))}
                    classNames={inputClassNames(Boolean(errors.phone && (touched.phone || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.phone || submitCount > 0) && errors.phone ? String(errors.phone) : null} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-brand-text">{t.auth.username}</label>
                    <span className="text-[10px] text-brand-text-muted">{isPersian ? '(اختیاری؛ خودکار ساخته می‌شود)' : '(Optional; generated if omitted)'}</span>
                  </div>
                  <Input
                    dir="ltr"
                    name="username"
                    aria-label={t.auth.username}
                    placeholder={isPersian ? 'نام کاربری لاتین' : 'username'}
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.username && (touched.username || submitCount > 0))}
                    classNames={inputClassNames(Boolean(errors.username && (touched.username || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.username || submitCount > 0) && errors.username ? String(errors.username) : null} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-brand-text">{t.auth.email}</label>
                    <span className="text-[10px] text-brand-text-muted">{isPersian ? '(اختیاری)' : '(Optional)'}</span>
                  </div>
                  <Input
                    dir="ltr"
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
                    classNames={inputClassNames(Boolean(errors.email && (touched.email || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.email || submitCount > 0) && errors.email ? String(errors.email) : null} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.password} <span className="text-rose-500">*</span>
                  </label>
                  <PasswordInput
                    name="password"
                    isPersian={isPersian}
                    isVisible={showPassword}
                    onToggleVisibility={() => setShowPassword((visible) => !visible)}
                    aria-label={t.auth.password}
                    placeholder={isPersian ? 'حداقل ۱۲ کاراکتر' : 'At least 12 characters'}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<Lock className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.password && (touched.password || submitCount > 0))}
                    classNames={inputClassNames(Boolean(errors.password && (touched.password || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.password || submitCount > 0) && errors.password ? String(errors.password) : null} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.confirmPassword} <span className="text-rose-500">*</span>
                  </label>
                  <PasswordInput
                    name="confirmPassword"
                    isPersian={isPersian}
                    isVisible={showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={t.auth.confirmPassword}
                    placeholder="••••••••••••"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<Lock className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.confirmPassword && (touched.confirmPassword || submitCount > 0))}
                    classNames={inputClassNames(Boolean(errors.confirmPassword && (touched.confirmPassword || submitCount > 0)))}
                  />
                  <AnimatedFieldError error={(touched.confirmPassword || submitCount > 0) && errors.confirmPassword ? String(errors.confirmPassword) : null} />
                </div>

                <p className="text-[11px] text-brand-text-muted leading-relaxed pt-1">
                  {isPersian
                    ? 'شماره موبایل اختیاری است و پس از ورود می‌توانید آن را از پروفایل تأیید کنید.'
                    : 'Your phone number is optional. You can verify it from your profile after signing in.'}
                </p>

                {registerError && (
                  <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-500 font-semibold">
                    {registerError}
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={loadingRegister || isSubmitting}
                  radius="lg"
                  className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                >
                  {!loadingRegister && !isSubmitting && (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isPersian ? 'ثبت‌نام و ورود به سایت' : 'Create account'}</span>
                    </>
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="text-center text-xs text-brand-text-muted pt-2 border-t border-brand-border/60">
            <span>{t.auth.haveAccount} </span>
            <Link href={PATHS.SIGN_IN} className="font-bold text-brand-bronze dark:text-brand-gold hover:underline">
              {t.auth.goToSignIn}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
