'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
    return <div aria-busy="true" className="min-h-[45vh]" />;
  }

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className="flex min-h-[55vh] items-center justify-center py-12"
    >
      <div className="w-full max-w-xl rounded-3xl border border-brand-border bg-brand-surface px-6 py-10 text-center shadow-sm sm:px-10">
        {isAuthenticated ? (
          <p className="text-lg font-bold leading-9 text-brand-text">
            {isPersian
              ? 'شما دسترسی ندارید و با پشتیبانی تماس بگیرید.'
              : 'You do not have access. Please contact support.'}
          </p>
        ) : (
          <div className="space-y-6">
            <p className="text-lg font-bold leading-9 text-brand-text">
              {isPersian
                ? 'برای ادامه، ابتدا وارد حساب کاربری خود شوید.'
                : 'Please sign in to your account to continue.'}
            </p>
            <Link
              href={PATHS.SIGN_IN}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand-gold px-7 font-bold text-[#1d241d] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {isPersian ? 'ورود / عضویت' : 'Sign in'}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
