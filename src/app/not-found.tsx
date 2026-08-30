'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export default function NotFound() {
  const { isPersian, isRTL } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 rounded-3xl bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] flex items-center justify-center mb-6 border border-[#bfa27a]/30 shadow-lg animate-bounce">
        <Compass className="w-12 h-12" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-[#1d241d] dark:text-[#f7f4ee] mb-3">
        {isPersian ? '۴۰۴ - صفحه یافت نشد' : '404 - Page Not Found'}
      </h1>

      <p className="text-xs sm:text-sm text-[#73695c] dark:text-[#a69c8e] max-w-md mb-8 leading-relaxed">
        {isPersian
          ? 'متاسفانه صفحه‌ای که به دنبال آن بودید در فروشگاه هاتف آروما پیدا نشد یا آدرس آن تغییر کرده است.'
          : 'Sorry, the page you are looking for does not exist or has been moved.'}
      </p>

      <Link
        href={PATHS.HOME}
        className="px-8 py-3.5 rounded-2xl font-black bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] text-sm shadow-xl shadow-[#9f815b]/20 flex items-center gap-2 transition-all active:scale-98"
      >
        <Home className="w-4 h-4" />
        <span>{isPersian ? 'بازگشت به صفحه اصلی' : 'Return to Home'}</span>
        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </Link>
    </div>
  );
}
