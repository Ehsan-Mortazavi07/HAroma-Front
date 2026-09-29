'use client';

import { usePointerGlow } from '@/common/hooks/usePointerGlow';
import { DEFAULT_HERO_BANNER, resolveHomepageLink } from '@/common/constants/homepage-content';
import { resolveMediaUrl } from '@/common/constants/URL';
import { IPageSection } from '@/common/interfaces';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Sparkles, ArrowLeft, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function HeroBanner({ section }: { section?: IPageSection }) {
  const { t, isRTL } = useTranslation();
  const { glowRef, onPointerEnter, onPointerMove, onPointerLeave } = usePointerGlow<HTMLElement>();
  const banner = section?.banners?.[0] ?? DEFAULT_HERO_BANNER;
  const title = isRTL
    ? banner.title || `${t.hero.titleMain} ${t.hero.titleBrand} ${t.hero.titleEnd}`.trim()
    : banner.titleEn || `${t.hero.titleMain} ${t.hero.titleBrand} ${t.hero.titleEnd}`.trim();
  const brandName = isRTL ? 'هاتف آروما' : 'Hatef Aroma';
  const brandIndex = title.indexOf(brandName);
  const highlightedTitle = brandIndex < 0 ? title : (
    <>
      {title.slice(0, brandIndex)}
      <span className="font-black text-[#d4be9b]">{brandName}</span>
      {title.slice(brandIndex + brandName.length)}
    </>
  );
  const description = isRTL ? banner.subtitle || t.hero.description : banner.subtitleEn || t.hero.description;
  const imageUrl = resolveMediaUrl(banner.imageUrl || DEFAULT_HERO_BANNER.imageUrl);

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="relative overflow-hidden rounded-3xl bg-[#181f18] text-[#f7f4ee] p-5 sm:p-8 lg:p-12 shadow-2xl border border-brand-gold/30 group"
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out"
        style={{
          background: 'radial-gradient(600px circle at 70% 35%, rgba(212, 190, 155, 0.14), transparent 70%)',
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
            <span>{isRTL ? banner.badge || t.hero.tag : banner.badgeEn || t.hero.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight text-[#f7f4ee]">
            {highlightedTitle}
          </h1>

          <p className="text-sm sm:text-base text-[#e6dcce] max-w-xl leading-relaxed font-medium">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              as={Link}
              href={resolveHomepageLink(banner.link, PATHS.PRODUCTS)}
              radius="full"
              className="px-7 py-3.5 h-12 font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-sm shadow-xl shadow-brand-gold/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <span>{t.hero.shopNow}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>

            <Button
              as={Link}
              href={PATHS.VIP}
              radius="full"
              variant="bordered"
              className="px-6 py-3.5 h-12 font-bold bg-[#202820] hover:bg-[#2c372c] text-[#f7f4ee] text-sm border border-brand-gold/40 flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <Crown className="w-4 h-4 text-brand-gold" />
              <span>{t.hero.joinVip}</span>
            </Button>
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
          <div className="relative w-full max-w-sm h-64 sm:h-80 lg:h-96 rounded-3xl overflow-hidden shadow-2xl border border-brand-gold/30">
            <Image
              src={imageUrl}
              alt={title}
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
