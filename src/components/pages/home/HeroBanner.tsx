'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function HeroBanner() {
  const { t, isPersian, isRTL } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#262f26] via-[#202620] to-[#141914] text-[#f7f4ee] p-6 sm:p-10 lg:p-14 mb-10 shadow-2xl border border-[#3e4c3e]">
      {/* Background Decorative Rings with Bronze Gold and Olive Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#9f815b]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#bfa27a]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2a342a] border border-[#bfa27a]/40 text-xs font-extrabold text-[#d4be9b] shadow-sm">
            <Crown className="w-4 h-4 text-[#bfa27a]" />
            <span>{t.hero.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
            {t.hero.titleMain}{' '}
            <span className="gold-gradient-text">{t.hero.titleBrand}</span>{' '}
            {t.hero.titleEnd}
          </h1>

          <p className="text-sm sm:text-base text-[#e6dcce]/90 max-w-xl leading-relaxed">
            {t.hero.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={PATHS.PRODUCTS}
              className="px-7 py-3.5 rounded-2xl font-black bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] text-sm shadow-xl shadow-[#9f815b]/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>{t.hero.shopNow}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>

            <Link
              href={PATHS.VIP}
              className="px-6 py-3.5 rounded-2xl font-bold bg-[#2a342a] hover:bg-[#344034] text-[#f7f4ee] text-sm border border-[#bfa27a]/40 transition-all flex items-center gap-2 shadow-sm"
            >
              <Crown className="w-4 h-4 text-[#d4be9b]" />
              <span>{t.hero.joinVip}</span>
            </Link>
          </div>

          {/* Quick Perks Pill */}
          <div className="pt-4 border-t border-[#344034] flex flex-wrap gap-4 text-xs font-semibold text-[#e6dcce]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#bfa27a]" />
              <span>{t.common.authenticityGuarantee}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#bfa27a]" />
              <span>{t.common.installment4x}</span>
            </div>
          </div>
        </div>

        {/* Right Hero Image Card */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-sm h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-[#bfa27a]/30">
            <Image
              src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop"
              alt="Hatef Aroma Niche Perfume"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141914]/90 via-transparent to-transparent" />

            {/* Floating Glassmorphism Badge */}
            <div className="absolute bottom-4 right-4 left-4 p-4 rounded-2xl bg-[#202620]/90 backdrop-blur-md border border-[#bfa27a]/40 shadow-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-[#d4be9b]">{t.hero.vipOffer}</div>
                <div className="text-[11px] text-[#e6dcce]">{t.home.nicheGoldCollection}</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#d4be9b] to-[#9f815b] text-[#1d241d] font-black text-xs shadow-sm">
                {t.hero.discount35}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
