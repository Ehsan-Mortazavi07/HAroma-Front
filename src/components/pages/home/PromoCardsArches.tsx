'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Crown, Sparkles, Truck, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardBody, Chip } from '@heroui/react';
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
      bgClass: 'bg-brand-surface text-brand-text border-brand-border',
      iconBg: 'bg-brand-gold text-[#141914]',
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
      bgClass: 'bg-brand-surface text-brand-text border-brand-gold/40',
      iconBg: 'bg-brand-bronze text-[#f7f4ee]',
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
      bgClass: 'bg-brand-surface text-brand-text border-brand-border',
      iconBg: 'bg-brand-gold text-[#141914]',
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
      bgClass: 'bg-brand-surface text-brand-text border-brand-border',
      iconBg: 'bg-brand-olive text-brand-gold',
      icon: Truck,
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
      href: PATHS.PRODUCTS,
    },
  ];

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-surface-elevated text-brand-gold flex items-center justify-center border border-brand-gold/30 shadow-xs">
            <Sparkles className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-text">
              {isPersian ? 'خدمات و امتیازات ویژه' : 'Exclusive Privileges'}
            </h2>
            <p className="text-xs text-brand-text-muted">
              {isPersian
                ? 'از بسته‌بندی‌های کادویی لوکس تا مشاوره تخصصی و ارسال ایمن'
                : 'Luxury gift packaging, expert advice & secure delivery'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {promoCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              as={Link}
              href={card.href}
              isPressable
              className={`group flex flex-col justify-between rounded-2xl sm:rounded-3xl p-0 border shadow-2xs hover:shadow-xl hover:border-brand-gold hover:-translate-y-1 transition-all duration-300 ease-out ${card.bgClass}`}
            >
              <CardBody className="p-4 sm:p-5 lg:p-6 flex flex-col justify-between h-full">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Chip
                      variant="bordered"
                      size="sm"
                      className="bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold border-brand-gold/30 font-black text-xs"
                    >
                      {card.tag}
                    </Chip>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs ${card.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-black text-sm sm:text-base mb-1.5 line-clamp-1">{card.title}</h3>
                  <p className="text-xs text-brand-text-muted line-clamp-2 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                {/* Arch Media Container */}
                <div className="mt-4 sm:mt-5 relative w-full h-32 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-border">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1 group-hover:underline">
                      <span>{t.common.seeMore}</span>
                      {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
