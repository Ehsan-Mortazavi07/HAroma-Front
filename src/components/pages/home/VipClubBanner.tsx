'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function VipClubBanner() {
  const { t, isPersian, isRTL } = useTranslation();

  const perks = [
    t.vip.permanentDiscountPerkSub,
    t.vip.freeShippingPerkSub,
    t.vip.samplesPerkSub,
    t.vip.consultationPerkSub,
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171d17] via-[#202620] to-[#121712] text-[#f7f4ee] p-8 sm:p-12 mb-16 shadow-2xl border border-[#bfa27a]/40">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#9f815b]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a342a] border border-[#bfa27a]/50 text-[#d4be9b] text-xs font-black">
            <Crown className="w-4 h-4 fill-current text-[#bfa27a]" />
            <span>{t.vip.title}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-snug">
            {t.home.vipBannerTitle}
            <span className="block gold-gradient-text text-lg sm:text-xl font-bold mt-1">
              {t.home.vipBannerSub}
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {perks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#e6dcce] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#bfa27a] shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href={PATHS.VIP}
              className="px-7 py-3.5 rounded-2xl font-black bg-gradient-to-r from-[#d4be9b] via-[#bfa27a] to-[#9f815b] hover:from-[#f7f4ee] hover:to-[#bfa27a] text-[#1d241d] text-sm shadow-xl shadow-[#9f815b]/25 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4 fill-current text-[#1d241d]" />
              <span>{t.home.vipBannerBtn}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-center">
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-[#2a342a] to-[#121712] border-2 border-[#bfa27a]/40 p-4 flex items-center justify-center shadow-2xl">
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop"
                alt="VIP Niche Perfume"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-2 px-4 py-1.5 rounded-full bg-[#bfa27a] text-[#1d241d] font-black text-xs shadow-lg flex items-center gap-1 border border-[#f7f4ee]/40">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{t.home.nicheGoldCollection}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
