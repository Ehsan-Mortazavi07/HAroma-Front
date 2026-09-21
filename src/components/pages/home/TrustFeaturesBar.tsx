'use client';

import React from 'react';
import { ShieldCheck, Truck, CreditCard, Sparkles } from 'lucide-react';
import { useTranslation } from '@/common/i18n';

export function TrustFeaturesBar() {
  const { isPersian } = useTranslation();

  const features = [
    {
      id: 'guarantee',
      icon: ShieldCheck,
      title: isPersian ? 'ضمانت اصالت ۱۰۰٪ فیزیکی' : '100% Genuine Authenticity',
      description: isPersian
        ? 'سنجش بارکد رسمی و ضمانت سلامت کالا'
        : 'Official batch code & original perfume verification',
    },
    {
      id: 'delivery',
      icon: Truck,
      title: isPersian ? 'ارسال سریع و ایمن' : 'Fast & Insured Delivery',
      description: isPersian
        ? 'بسته‌بندی ضربه‌گیر ویژه در سراسر کشور'
        : 'Protective luxury packaging across the country',
    },
    {
      id: 'installment',
      icon: CreditCard,
      title: isPersian ? 'پرداخت اقساطی ۴ ماهه' : '4x Interest-Free Installments',
      description: isPersian
        ? 'خرید بدون ضامن و کارمزد با اسنپ‌پی'
        : 'Split your payment in 4 installments with SnapPay',
    },
    {
      id: 'consultation',
      icon: Sparkles,
      title: isPersian ? 'مشاوره تخصصی بویایی' : 'Expert Scent Concierge',
      description: isPersian
        ? 'راهنمای انتخاب رایحه امضا متناسب با سلیقه شما'
        : 'Discover your signature scent with certified perfumers',
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-brand-surface border border-brand-border/70 hover:border-brand-gold/60 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-surface-elevated border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-xs sm:text-sm text-brand-text truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-brand-text-muted truncate mt-0.5 font-medium hidden sm:block">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
