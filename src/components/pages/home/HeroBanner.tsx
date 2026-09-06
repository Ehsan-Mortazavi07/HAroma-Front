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
  const sectionRef = React.useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-3xl bg-[#181f18] text-[#f7f4ee] p-6 sm:p-10 lg:p-14 mb-10 shadow-2xl border border-brand-gold/30 group"
    >
      {/* Interactive Cursor-Tracking Golden Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0.45,
          background: isHovered
            ? `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 190, 155, 0.22), rgba(159, 129, 91, 0.08) 40%, transparent 75%)`
            : `radial-gradient(600px circle at 70% 35%, rgba(212, 190, 155, 0.14), transparent 70%)`,
        }}
      />

      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-bronze/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#202820] border border-brand-gold/40 text-xs font-extrabold text-[#d4be9b] shadow-sm">
            <Crown className="w-4 h-4 text-brand-gold" />
            <span>{t.hero.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight text-[#f7f4ee]">
            {t.hero.titleMain}{' '}
            <span className="text-[#d4be9b] font-black">{t.hero.titleBrand}</span>{' '}
            {t.hero.titleEnd}
          </h1>

          <p className="text-sm sm:text-base text-[#e6dcce] max-w-xl leading-relaxed font-medium">
            {t.hero.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={PATHS.PRODUCTS}
              className="px-7 py-3.5 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-sm shadow-xl shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all duration-300 ease-out flex items-center gap-2"
            >
              <span>{t.hero.shopNow}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>

            <Link
              href={PATHS.VIP}
              className="px-6 py-3.5 rounded-2xl font-bold bg-[#202820] hover:bg-[#2c372c] text-[#f7f4ee] text-sm border border-brand-gold/40 transition-all duration-300 ease-out flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95"
            >
              <Crown className="w-4 h-4 text-brand-gold" />
              <span>{t.hero.joinVip}</span>
            </Link>
          </div>

          {/* Quick Perks Pill */}
          <div className="pt-4 border-t border-[#2e3a2e] flex flex-wrap gap-4 text-xs font-semibold text-[#e6dcce]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>{t.common.authenticityGuarantee}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>{t.common.installment4x}</span>
            </div>
          </div>
        </div>

        {/* Right Hero Image Card */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-sm h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-brand-gold/30">
            <Image
              src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop"
              alt="Hatef Aroma Niche Perfume"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141914]/90 via-transparent to-transparent" />

            {/* Floating Glassmorphism Badge */}
            <div className="absolute bottom-4 right-4 left-4 p-4 rounded-2xl bg-[#1c231c]/90 backdrop-blur-md border border-brand-gold/40 shadow-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-brand-gold">{t.hero.vipOffer}</div>
                <div className="text-[11px] text-[#e6dcce] font-medium">{t.home.nicheGoldCollection}</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-gold text-[#141914] font-black text-xs shadow-sm">
                {t.hero.discount35}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
