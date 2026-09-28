'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, LogIn, ShieldX } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';

export default function ForbiddenPage() {
  const { isPersian, isRTL } = useTranslation();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    document.title = isPersian ? 'عدم دسترسی | هاتف آروما' : 'Access denied | HatefAroma';
  }, [isPersian]);

  if (!hasMounted) {
    return (
      <section
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-busy="true"
        aria-live="polite"
        className="flex min-h-[62vh] items-center justify-center py-12"
      >
        <LoaderCircle
          aria-hidden="true"
          className="h-7 w-7 animate-spin text-brand-bronze dark:text-brand-gold"
        />
        <span className="sr-only">
          {isPersian ? 'در حال بررسی دسترسی…' : 'Checking access…'}
        </span>
      </section>
    );
  }

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className="flex min-h-[62vh] items-center justify-center py-12 sm:py-16"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-brand-border bg-brand-surface px-6 py-10 text-center shadow-xl shadow-brand-olive/5 sm:px-12 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent"
        />

        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-brand-gold/30 bg-brand-surface-elevated text-brand-bronze shadow-sm dark:text-brand-gold sm:h-24 sm:w-24">
            <ShieldX aria-hidden="true" className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={1.6} />
            <span
              dir="ltr"
              className="absolute -bottom-3 rounded-full border border-brand-border bg-brand-bg px-3 py-1 font-latin text-[11px] font-bold tracking-[0.14em] text-brand-text-muted shadow-sm"
            >
              403
            </span>
          </div>

          <h1 className="mt-8 text-2xl font-black leading-tight text-brand-text sm:text-3xl">
            {isAuthenticated
              ? isPersian
                ? 'دسترسی به این بخش محدود است'
                : 'Access to this area is restricted'
              : isPersian
                ? 'برای ادامه وارد حساب خود شوید'
                : 'Sign in to continue'}
          </h1>

          <p className="mt-4 text-sm font-medium leading-8 text-brand-text-muted sm:text-base">
            {isAuthenticated
              ? isPersian
                ? 'شما دسترسی ندارید؛ برای راهنمایی با پشتیبانی تماس بگیرید.'
                : 'You do not have access. Please contact support for assistance.'
              : isPersian
                ? 'برای مشاهده این صفحه، ابتدا وارد حساب کاربری خود شوید.'
                : 'Please sign in to your account to view this page.'}
          </p>

          {!isAuthenticated && (
            <Link
              href={PATHS.SIGN_IN}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-brand-gold px-7 font-bold text-[#1d241d] shadow-md shadow-brand-gold/10 transition-colors hover:bg-brand-bronze-light active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              <span>{isPersian ? 'ورود به حساب کاربری' : 'Sign in to your account'}</span>
              {isRTL ? (
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              ) : (
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              )}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
