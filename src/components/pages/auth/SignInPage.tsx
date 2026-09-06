'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field } from 'formik';
import { Lock, User, ArrowLeft, ArrowRight } from 'lucide-react';
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

  const handleQuickLogin = (identifier: string, pass: string) => {
    handleSubmit({ identifier, password: pass });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {t.auth.signInTitle}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
            {t.auth.signInSub}
          </p>
        </div>

        <Formik
          initialValues={{ identifier: '', password: '' }}
          validationSchema={getSignInSchema(isPersian)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-1.5">
                  {t.auth.identifier}
                </label>
                <div className="relative">
                  <Field
                    name="identifier"
                    type="text"
                    placeholder={isPersian ? 'admin یا ایمیل' : 'admin or admin@hatefaroma.com'}
                    className="w-full h-12 pr-11 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <User className="w-4 h-4 absolute right-4 top-4 text-[#73695c] dark:text-[#a69c8e]" />
                </div>
                {errors.identifier && touched.identifier && (
                  <div className="text-[11px] text-rose-500 mt-1 font-bold">
                    {errors.identifier as string}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]">
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
                    className="text-[11px] text-[#9f815b] dark:text-[#d4be9b] hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl font-black bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-[#9f815b]/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
              >
                {loading ? (
                  <span>{t.common.loading}</span>
                ) : (
                  <>
                    <span>{t.auth.signInBtn}</span>
                    {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>

        {/* Quick Demo Logins Bar */}
        <div className="pt-4 border-t border-[#e6dcce] dark:border-[#2e3a2e] space-y-2">
          <div className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e] text-center">
            {t.auth.quickLoginTitle}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin', 'Admin@123456')}
              type="button"
              className="px-2.5 py-2 rounded-xl bg-[#202620] hover:bg-[#2c352c] text-[#d4be9b] text-[11px] font-bold transition-all border border-[#bfa27a]/30 shadow-xs active:scale-98"
            >
              {isPersian ? '👑 مدیر کل (Admin)' : '👑 Super Admin'}
            </button>
            <button
              onClick={() => handleQuickLogin('editor', 'Editor@123456')}
              type="button"
              className="px-2.5 py-2 rounded-xl bg-[#202620] hover:bg-[#2c352c] text-[#d4be9b] text-[11px] font-bold transition-all border border-[#bfa27a]/30 shadow-xs active:scale-98"
            >
              {isPersian ? '✏️ ادیتور (Editor)' : '✏️ Product Editor'}
            </button>
            <button
              onClick={() => handleQuickLogin('vipuser', 'Vip@123456')}
              type="button"
              className="px-2.5 py-2 rounded-xl bg-[#f0eae0] dark:bg-[#242c24] text-[#9f815b] dark:text-[#d4be9b] text-[11px] font-bold hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] transition-all border border-[#e6dcce] dark:border-[#2e3a2e] active:scale-98"
            >
              {isPersian ? '⭐ کاربر VIP' : '⭐ VIP Member'}
            </button>
            <button
              onClick={() => handleQuickLogin('normaluser', 'User@123456')}
              type="button"
              className="px-2.5 py-2 rounded-xl bg-[#f0eae0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] text-[11px] font-bold hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] transition-all border border-[#e6dcce] dark:border-[#2e3a2e] active:scale-98"
            >
              {isPersian ? '👤 کاربر عادی' : '👤 Normal User'}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#73695c] dark:text-[#a69c8e] pt-2">
          <span>{t.auth.noAccount} </span>
          <Link
            href={PATHS.SIGN_UP}
            className="font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline"
          >
            {t.auth.createAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}
