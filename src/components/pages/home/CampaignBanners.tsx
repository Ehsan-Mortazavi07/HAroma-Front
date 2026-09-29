'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Crown, Gift, Sparkles, Truck } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function CampaignBanners() {
  const { t, isPersian, isRTL } = useTranslation();

  const banners = [
    {
      id: 'gift',
      tag: isPersian ? 'هدیه ویژه' : 'Gift Sets',
      title: isPersian ? 'پک‌های کادویی لوکس' : 'Luxury Gift Sets',
      description: isPersian
        ? 'بهترین هدیه برای عزیزان با امکان انتخاب از تمام محصولات'
        : 'Present a gift card and let them choose their favorite scent',
      image: 'https://images.unsplash.com/photo-1512290900672-1f55b9ab0128?q=80&w=900&auto=format&fit=crop',
      href: '/products?category=gift-sets',
      icon: Gift,
    },
    {
      id: 'vip',
      tag: isPersian ? 'تخفیف ویژه VIP' : 'VIP 30% Off',
      title: isPersian ? 'باشگاه مشتریان طلایی' : 'VIP Gold Club',
      description: isPersian
        ? 'تخفیف‌های دائمی، ارسال رایگان و دسترسی به عطرهای نیش'
        : 'Enjoy exclusive discounts on luxury and niche fragrances',
      image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=900&auto=format&fit=crop',
      href: PATHS.VIP,
      icon: Crown,
    },
    {
      id: 'consultation',
      tag: isPersian ? 'مشاوره بویایی' : 'Expert Advice',
      title: isPersian ? 'انتخاب رایحه امضا' : 'Find Your Signature Scent',
      description: isPersian
        ? 'طراحی امضای بویایی اختصاصی بر اساس تیپ شخصیتی شما'
        : 'Get expert guidance to discover a fragrance that feels like you',
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=900&auto=format&fit=crop',
      href: PATHS.PRODUCTS,
      icon: Sparkles,
    },
    {
      id: 'shipping',
      tag: isPersian ? 'ارسال رایگان' : 'Free Shipping',
      title: isPersian ? 'ارسال سریع و ایمن' : 'Fast, Secure Delivery',
      description: isPersian
        ? 'برای سفارش‌های بالای ۱ میلیون تومان در سراسر ایران'
        : 'Free delivery on orders over the qualifying amount',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop',
      href: PATHS.PRODUCTS,
      icon: Truck,
    },
  ];

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className="w-full">
      <div className="mb-5 flex flex-col gap-2 border-b border-brand-border pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-black text-brand-text sm:text-2xl">
          {isPersian ? 'خدمات و پیشنهادهای ویژه' : 'Services & Special Offers'}
        </h2>
        <p className="max-w-xl text-xs leading-6 text-brand-text-muted sm:text-sm">
          {isPersian
            ? 'برای انتخاب رایحه، هدیه‌دادن و خریدی آسوده‌تر'
            : 'A little help choosing, gifting, and shopping with confidence'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {banners.map((banner) => {
          const Icon = banner.icon;

          return (
            <Link
              key={banner.id}
              href={banner.href}
              className="group relative isolate flex min-h-[17rem] overflow-hidden rounded-3xl border border-brand-border bg-brand-olive p-5 text-[#f7f4ee] shadow-xs transition-[transform,border-color,box-shadow] duration-500 ease-luxury hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg sm:min-h-[19rem] sm:p-7 lg:min-h-[21rem]"
            >
              <Image
                src={banner.image}
                alt=""
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 45vw"
                className="-z-20 object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.04]"
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
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-gold/35 bg-[#202620]/90 px-3 py-1.5 text-[11px] font-bold text-brand-champagne sm:text-xs">
                  <Icon aria-hidden="true" className="h-4 w-4 text-brand-gold" />
                  {banner.tag}
                </span>

                <div className="max-w-md">
                  <h3 className="text-xl font-black leading-snug sm:text-2xl lg:text-3xl">
                    {banner.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-xs font-medium leading-6 text-[#e6dcce] sm:text-sm sm:leading-7">
                    {banner.description}
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
          );
        })}
      </div>
    </section>
  );
}
