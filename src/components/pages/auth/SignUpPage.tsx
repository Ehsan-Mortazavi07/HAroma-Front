'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form } from 'formik';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Lock, User, Mail, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '@/stores/hooks';
import { setAuth } from '@/stores/auth/authSlice';
import { getSignUpSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTranslation } from '@/common/i18n';

export function SignUpPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isPersian, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = isPersian
      ? 'عضویت در هاتف آروما | HatefAroma'
      : 'Sign Up | HatefAroma';
  }, [isPersian]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', {
        fullName: values.fullName,
        username: values.username,
        email: values.email?.trim() ? values.email.trim().toLowerCase() : undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
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
      const serverMsg = err?.response?.data?.message;
      let errorMsg = isPersian
        ? serverMsg || 'خطا در فرآیند ثبت‌نام.'
        : 'Registration failed. An account with this email or username may already exist.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-6 px-4">
      <Card className="w-full max-w-md bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-2xl">
        <CardBody className="p-0 space-y-6">
          {/* Header with Brand Logo */}
          <div className="flex flex-col items-center text-center space-y-3">
            <BrandLogo size="md" showText={false} />
            <div>
              <h1 className="text-2xl font-black text-brand-text">
                {t.auth.signUpTitle}
              </h1>
              <p className="text-xs text-brand-text-muted mt-1">
                {t.auth.signUpSub}
              </p>
            </div>
          </div>

          <Formik
            initialValues={{
              fullName: '',
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={getSignUpSchema(isPersian)}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.fullName}
                  </label>
                  <Input
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
                    isInvalid={Boolean(errors.fullName && touched.fullName)}
                    classNames={{
                      inputWrapper: Boolean(errors.fullName && touched.fullName)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text",
                    }}
                  />
                  {errors.fullName && touched.fullName && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.fullName)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.username}
                  </label>
                  <Input
                    name="username"
                    type="text"
                    aria-label={t.auth.username}
                    placeholder={isPersian ? 'نام کاربری لاتین' : 'username'}
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.username && touched.username)}
                    classNames={{
                      inputWrapper: Boolean(errors.username && touched.username)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-mono text-brand-text",
                    }}
                  />
                  {errors.username && touched.username && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.username)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {isPersian ? 'ایمیل (اختیاری)' : 'Email (Optional)'}
                  </label>
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
                    isInvalid={Boolean(errors.email && touched.email)}
                    classNames={{
                      inputWrapper: Boolean(errors.email && touched.email)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-mono text-brand-text",
                    }}
                  />
                  {errors.email && touched.email && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.email)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.password}
                  </label>
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
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    isInvalid={Boolean(errors.password && touched.password)}
                    classNames={{
                      inputWrapper: Boolean(errors.password && touched.password)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-mono font-semibold text-brand-text",
                    }}
                  />
                  {errors.password && touched.password && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.password)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.confirmPassword}
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
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="focus:outline-none text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer"
                        aria-label="toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    isInvalid={Boolean(errors.confirmPassword && touched.confirmPassword)}
                    classNames={{
                      inputWrapper: Boolean(errors.confirmPassword && touched.confirmPassword)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-mono font-semibold text-brand-text",
                    }}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.confirmPassword)}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  radius="lg"
                  className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                >
                  {!loading && (
                    <>
                      <span>{t.auth.signUpBtn}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="text-center text-xs text-brand-text-muted pt-2">
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
