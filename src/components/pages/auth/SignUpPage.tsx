'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field } from 'formik';
import { Lock, User, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
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
        email: values.email,
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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-6">
        {/* Header with Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo size="md" showText={false} />
          <div>
            <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
              {t.auth.signUpTitle}
            </h1>
            <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
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
          {({ errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.fullName}
                </label>
                <div className="relative">
                  <Field
                    name="fullName"
                    type="text"
                    placeholder={isPersian ? 'مثال: احسان مرتضوی' : 'e.g. Ehsan Mortazavi'}
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <User className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.fullName && touched.fullName && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.fullName as string}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.username}
                </label>
                <div className="relative">
                  <Field
                    name="username"
                    type="text"
                    placeholder={isPersian ? 'نام کاربری لاتین' : 'username'}
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <User className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.username && touched.username && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.username as string}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Field
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <Mail className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.email && touched.email && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.email as string}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Field
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <Lock className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.password && touched.password && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.password as string}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Field
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <Lock className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.confirmPassword as string}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] shadow-lg shadow-[#9f815b]/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
              >
                {loading ? (
                  <span>{t.common.loading}</span>
                ) : (
                  <>
                    <span>{t.auth.signUpBtn}</span>
                    {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="text-center text-xs text-[#73695c] dark:text-[#a69c8e] pt-2">
          <span>{t.auth.haveAccount} </span>
          <Link
            href={PATHS.SIGN_IN}
            className="font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline"
          >
            {t.auth.goToSignIn}
          </Link>
        </div>
      </div>
    </div>
  );
}
