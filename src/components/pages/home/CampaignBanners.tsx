'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Crown, Gift, Sparkles, Truck } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { DEFAULT_CAMPAIGN_BANNERS, resolveHomepageLink } from '@/common/constants/homepage-content';
import { resolveMediaUrl } from '@/common/constants/URL';
import { IPageSection, IPageSectionBanner } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';

const bannerIcons = { gift: Gift, vip: Crown, consultation: Sparkles, shipping: Truck };

export function CampaignBanners({ section }: { section?: IPageSection }) {
  const { t, isPersian, isRTL } = useTranslation();
  const reduceMotion = useReducedMotion();
  const banners = section?.banners?.length ? section.banners : DEFAULT_CAMPAIGN_BANNERS;
  const title = isPersian ? section?.title || 'خدمات و پیشنهادهای ویژه' : section?.titleEn || 'Services & Special Offers';
  const subtitle = isPersian
    ? section?.subtitle || 'برای انتخاب رایحه، هدیه‌دادن و خریدی آسوده‌تر'
    : section?.subtitleEn || 'A little help choosing, gifting, and shopping with confidence';

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className="w-full">
      <div className="mb-5 flex flex-col gap-2 border-b border-brand-border pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-black text-brand-text sm:text-2xl">
          {title}
        </h2>
        <p className="max-w-xl text-xs leading-6 text-brand-text-muted sm:text-sm">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {banners.map((banner: IPageSectionBanner, index) => {
          const id = banner.id || DEFAULT_CAMPAIGN_BANNERS[index]?.id || 'gift';
          const fallback = DEFAULT_CAMPAIGN_BANNERS.find((item) => item.id === id) || DEFAULT_CAMPAIGN_BANNERS[index] || DEFAULT_CAMPAIGN_BANNERS[0];
          const Icon = bannerIcons[id as keyof typeof bannerIcons] || Gift;
          const cardTitle = isPersian ? banner.title || fallback.title : banner.titleEn || fallback.titleEn;
          const cardDescription = isPersian ? banner.subtitle || fallback.subtitle : banner.subtitleEn || fallback.subtitleEn;
          const badge = isPersian ? banner.badge || fallback.badge : banner.badgeEn || fallback.badgeEn;
          const href = resolveHomepageLink(banner.link, PATHS.PRODUCTS);

          return (
            <motion.div
              key={id}
              initial={false}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="h-full rounded-3xl"
            >
              <Link
                href={href}
                className="group relative isolate flex h-full min-h-[17rem] overflow-hidden rounded-3xl border border-brand-border bg-brand-olive p-5 text-[#f7f4ee] shadow-xs transition-[border-color,box-shadow] duration-300 hover:border-brand-gold/70 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg sm:min-h-[19rem] sm:p-7 lg:min-h-[21rem]"
              >
                <Image
                  src={resolveMediaUrl(banner.imageUrl || fallback.imageUrl)}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 45vw"
                  className="-z-20 object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                />
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 -z-10 ${
                    isRTL
                      ? 'bg-gradient-to-l from-[#141914]/95 via-[#141914]/70 to-[#141914]/10'
                      : 'bg-gradient-to-r from-[#141914]/95 via-[#141914]/70 to-[#141914]/10'
                  }`}
                />

                <div className="relative z-10 flex w-full flex-col justify-between gap-8">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-gold/45 bg-[#202620]/95 px-3 py-1.5 text-[11px] font-bold text-[#f7f4ee] shadow-sm sm:text-xs">
                    <Icon aria-hidden="true" className="h-4 w-4 text-brand-gold" />
                    {badge}
                  </span>

                  <div className="max-w-md">
                    <h3 className="text-xl font-black leading-snug sm:text-2xl lg:text-3xl">
                      {cardTitle}
                    </h3>
                    <p className="mt-2 max-w-lg text-xs font-medium leading-6 text-[#e6dcce] sm:text-sm sm:leading-7">
                      {cardDescription}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-brand-gold transition-colors group-hover:text-brand-bronze-light sm:text-sm">
                      {t.common.seeMore}
                      {isRTL ? (
                        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      ) : (
                        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
