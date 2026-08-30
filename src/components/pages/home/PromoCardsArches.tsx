'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Crown, Sparkles, Truck, ArrowLeft, ArrowRight } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function PromoCardsArches() {
  const { t, isPersian, isRTL } = useTranslation();

  const promoCards = [
    {
      id: 'gift',
      tag: isPersian ? 'هدیه ویژه' : 'Gift Sets',
      title: isPersian ? 'پک‌های کادویی لوکس' : 'Luxury Gift Sets',
      subtitle: isPersian
        ? 'بهترین هدیه برای عزیزان با امکان انتخاب از تمام محصولات'
        : 'Present a gift card and let them choose their favorite scent',
      bgClass: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#2e3a2e]',
      iconBg: 'bg-[#bfa27a] text-[#1d241d]',
      icon: Gift,
      image: 'https://images.unsplash.com/photo-1512290900672-1f55b9ab0128?q=80&w=600&auto=format&fit=crop',
      href: '/products?category=gift-sets',
    },
    {
      id: 'vip',
      tag: isPersian ? 'تخفیف ویژه VIP' : 'VIP 30% Off',
      title: isPersian ? 'باشگاه مشتریان طلایی' : 'VIP Gold Club',
      subtitle: isPersian
        ? 'تخفیف‌های دائمی، ارسال رایگان و دسترسی به عطرهای نیش'
        : 'Enjoy exclusive discounts on all types of luxury & niche perfumes',
      bgClass: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#bfa27a]/50',
      iconBg: 'bg-[#9f815b] text-[#f7f4ee]',
      icon: Crown,
      image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop',
      href: PATHS.VIP,
    },
    {
      id: 'consultation',
      tag: isPersian ? 'مشاوره بویایی' : 'Expert Advice',
      title: isPersian ? 'انتخاب رایحه امضا' : 'Fragrance Advice',
      subtitle: isPersian
        ? 'طراحی امضای بویایی اختصاصی بر اساس تیپ شخصیتی شما'
        : 'Consult with expert perfumers to find your signature scent',
      bgClass: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#2e3a2e]',
      iconBg: 'bg-[#bfa27a] text-[#1d241d]',
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop',
      href: PATHS.PRODUCTS,
    },
    {
      id: 'shipping',
      tag: isPersian ? 'ارسال رایگان' : 'Free Ship',
      title: isPersian ? 'ارسال فوق‌سریع و ایمن' : 'Fast & Free Delivery',
      subtitle: isPersian
        ? 'برای کلیه سفارش‌های بالای ۱ میلیون تومان در سراسر ایران'
        : 'Free express shipping on all orders over standard threshold',
      bgClass: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#2e3a2e]',
      iconBg: 'bg-[#202620] text-[#d4be9b]',
      icon: Truck,
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
      href: PATHS.PRODUCTS,
    },
  ];

  return (
    <section className="mb-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {promoCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              className={`group flex flex-col justify-between rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:border-[#bfa27a] hover:-translate-y-1 transition-all ${card.bgClass}`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] border border-[#bfa27a]/30">
                    {card.tag}
                  </span>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${card.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-black text-base mb-1.5 line-clamp-1">{card.title}</h3>
                <p className="text-xs text-[#73695c] dark:text-[#a69c8e] line-clamp-2 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              {/* Arch Media Container */}
              <div className="mt-5 relative w-full h-36 rounded-2xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e]">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1 group-hover:underline">
                    <span>{t.common.seeMore}</span>
                    {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
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
