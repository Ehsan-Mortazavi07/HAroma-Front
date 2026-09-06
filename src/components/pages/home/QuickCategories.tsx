'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart, Activity, Droplets, ShieldCheck, Gift, Crown, ArrowLeft, ArrowRight } from 'lucide-react';
import { ICategory } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';
import { PATHS } from '@/common/constants/PATHS';

interface QuickCategoriesProps {
  categories: ICategory[];
}

export function QuickCategories({ categories }: QuickCategoriesProps) {
  const { t, isPersian, isRTL } = useTranslation();

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'men-perfumes':
        return <Sparkles className="w-6 h-6 text-[#9f815b]" />;
      case 'women-perfumes':
        return <Heart className="w-6 h-6 text-[#bfa27a]" />;
      case 'unisex-perfumes':
        return <Activity className="w-6 h-6 text-[#7a5d3e]" />;
      case 'body-splash':
        return <Droplets className="w-6 h-6 text-[#9f815b]" />;
      case 'skin-care':
        return <ShieldCheck className="w-6 h-6 text-[#bfa27a]" />;
      case 'gift-sets':
        return <Gift className="w-6 h-6 text-[#d4be9b]" />;
      case 'vip-niche':
        return <Crown className="w-6 h-6 text-[#d4be9b]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#9f815b]" />;
    }
  };

  return (
    <section className="mb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/products?category=${cat.slug}`}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs hover:shadow-md hover:border-[#bfa27a] hover:-translate-y-1 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
              {getIcon(cat.slug)}
            </div>
            <span className="font-bold text-xs sm:text-sm text-[#1d241d] dark:text-[#f7f4ee] group-hover:text-[#9f815b] dark:group-hover:text-[#d4be9b] truncate max-w-full">
              {isPersian ? cat.name : cat.nameEn || cat.name}
            </span>
            <span className="text-[10px] text-[#73695c] dark:text-[#a69c8e] mt-0.5 truncate max-w-full">
              {t.common.viewDetails}
            </span>
          </Link>
        ))}

        {/* See All Pill Button */}
        <Link
          href={PATHS.PRODUCTS}
          className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f0eae0] dark:bg-[#202620] border border-[#bfa27a]/40 shadow-xs hover:shadow-md hover:border-[#bfa27a] hover:-translate-y-1 transition-all text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#bfa27a] text-[#141914] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm border border-[#d4be9b]/30">
            {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </div>
          <span className="font-black text-xs sm:text-sm text-[#141914] dark:text-[#d4be9b]">
            {t.common.seeMore}
          </span>
          <span className="text-[10px] text-[#73695c] dark:text-[#a69c8e] mt-0.5">
            {t.nav.products}
          </span>
        </Link>
      </div>
    </section>
  );
}
