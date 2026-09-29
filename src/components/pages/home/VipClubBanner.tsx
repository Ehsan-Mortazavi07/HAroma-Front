'use client';

import { usePointerGlow } from '@/common/hooks/usePointerGlow';
import { DEFAULT_VIP_BANNER, DEFAULT_VIP_PERKS, resolveHomepageLink } from '@/common/constants/homepage-content';
import { resolveMediaUrl } from '@/common/constants/URL';
import { IPageSection } from '@/common/interfaces';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function VipClubBanner({ section }: { section?: IPageSection }) {
  const { t, isPersian, isRTL } = useTranslation();
  const { glowRef, onPointerEnter, onPointerMove, onPointerLeave } = usePointerGlow<HTMLElement>();
  const banner = section?.banners?.[0] ?? DEFAULT_VIP_BANNER;
  const title = isPersian ? banner.title || t.home.vipBannerTitle : banner.titleEn || t.home.vipBannerTitle;
  const subtitle = isPersian ? banner.subtitle || t.home.vipBannerSub : banner.subtitleEn || t.home.vipBannerSub;
  const badge = isPersian ? banner.badge || t.vip.title : banner.badgeEn || t.vip.title;
  const imageUrl = resolveMediaUrl(banner.imageUrl || DEFAULT_VIP_BANNER.imageUrl);

  const defaultPerks = [
    t.vip.permanentDiscountPerkSub,
    t.vip.freeShippingPerkSub,
    t.vip.samplesPerkSub,
    t.vip.consultationPerkSub,
  ];
  const configuredPerks = isPersian ? section?.config?.perksFa : section?.config?.perksEn;
  const perks: string[] = Array.isArray(configuredPerks) && configuredPerks.length
    ? configuredPerks
    : isPersian ? DEFAULT_VIP_PERKS.fa : defaultPerks;

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#181f18] text-[#f7f4ee] p-6 sm:p-10 lg:p-12 shadow-2xl border border-brand-gold/30 group w-full"
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out"
        style={{
          background: 'radial-gradient(600px circle at 80% 30%, rgba(212, 190, 155, 0.14), transparent 70%)',
        }}
      />

      {/* Decorative Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#9f815b]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-5">
          <Chip
            startContent={<Crown className="w-4 h-4 fill-current text-[#d4be9b]" />}
            variant="bordered"
            className="bg-[#202820] border-brand-gold/40 text-[#d4be9b] text-xs font-black h-8 px-3"
          >
            {badge}
          </Chip>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-snug text-[#f7f4ee]">
            {title}
            <span className="block text-[#d4be9b] text-lg sm:text-xl font-bold mt-1">
              {subtitle}
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {perks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#e6dcce] font-medium">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button
              as={Link}
              href={resolveHomepageLink(banner.link, PATHS.VIP)}
              radius="full"
              className="px-7 py-3.5 h-12 font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-sm shadow-xl shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all duration-300 ease-out flex items-center gap-2 border border-[#d4be9b]/30"
            >
              <Crown className="w-4 h-4 fill-current text-[#141914]" />
              <span>{t.home.vipBannerBtn}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-center">
          <div className="relative w-40 h-40 sm:w-52 sm:h-52 lg:w-60 lg:h-60 rounded-full bg-[#202620] border-2 border-brand-gold/40 p-3 sm:p-4 flex items-center justify-center shadow-2xl">
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image
                src={imageUrl}
                alt="VIP Niche Perfume"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-2 px-4 py-1.5 rounded-full bg-brand-gold text-[#141914] font-black text-xs shadow-lg flex items-center gap-1 border border-[#f7f4ee]/40">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{t.home.nicheGoldCollection}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
