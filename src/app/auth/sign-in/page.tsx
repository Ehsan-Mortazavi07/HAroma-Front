import React, { Suspense } from 'react';
import { SignInPage } from '@/components/pages/auth/SignInPage';

export const metadata = {
  title: 'ورود به حساب کاربری | هاتف آروما',
};

export default function SignInRoute() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">در حال بارگذاری...</div>}>
      <SignInPage />
    </Suspense>
  );
}
