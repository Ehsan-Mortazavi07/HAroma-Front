'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form } from 'formik';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '@/stores/hooks';
import { setAuth } from '@/stores/auth/authSlice';
import { getSignInSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTranslation } from '@/common/i18n';

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t, isPersian, isRTL } = useTranslation();
  const redirectUrl = searchParams.get('redirect') || PATHS.HOME;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = isPersian
      ? 'ورود به حساب کاربری | هاتف آروما'
      : 'Sign In | HatefAroma';
  }, [isPersian]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
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
      const serverMsg = err?.response?.data?.message;
      let errorMsg = isPersian
        ? serverMsg || 'اطلاعات ورود اشتباه است.'
        : 'Invalid username/email or password.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-6 px-4">
      <Card className="w-full max-w-md bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-2xl">
        <CardBody className="p-0 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <BrandLogo size="md" />
            </div>
            <h1 className="text-2xl font-black text-brand-text">
              {t.auth.signInTitle}
            </h1>
            <p className="text-xs text-brand-text-muted">
              {t.auth.signInSub}
            </p>
          </div>

          <Formik
            initialValues={{ identifier: '', password: '' }}
            validationSchema={getSignInSchema(isPersian)}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    {t.auth.identifier}
                  </label>
                  <Input
                    name="identifier"
                    type="text"
                    aria-label={t.auth.identifier}
                    placeholder={isPersian ? 'نام کاربری، شماره موبایل یا ایمیل' : 'Username, phone or email'}
                    value={values.identifier}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="bordered"
                    radius="lg"
                    startContent={<User className="w-4 h-4 text-brand-bronze shrink-0" />}
                    isInvalid={Boolean(errors.identifier && touched.identifier)}
                    classNames={{
                      inputWrapper: Boolean(errors.identifier && touched.identifier)
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text",
                    }}
                  />
                  {errors.identifier && touched.identifier && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {String(errors.identifier)}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-brand-text">
                      {t.auth.password}
                    </label>
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.info(
                          isPersian
                            ? 'جهت بازیابی رمز با شماره پشتیبانی تماس حاصل فرمایید.'
                            : 'Please contact support for password recovery.',
                        );
                      }}
                      className="text-[11px] text-brand-bronze dark:text-brand-gold hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </Link>
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

                <Button
                  type="submit"
                  isLoading={loading}
                  radius="lg"
                  className="w-full h-12 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-sm transition-all duration-200 ease-out active:scale-98 cursor-pointer mt-2"
                >
                  {!loading && (
                    <>
                      <span>{t.auth.signInBtn}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </Button>
              </Form>
            )}
          </Formik>

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
    </div>
  );
}
