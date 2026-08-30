'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { IProduct } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

interface YouMightNeedSectionProps {
  products: IProduct[];
}

export function YouMightNeedSection({ products }: YouMightNeedSectionProps) {
  const { t, isRTL } = useTranslation();

  return (
    <section className="mb-14">
      {/* Header with See More */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#202620] text-[#d4be9b] flex items-center justify-center border border-[#bfa27a]/30 shadow-md">
            <Sparkles className="w-5 h-5 text-[#bfa27a]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
              {t.home.curatedPicks}
            </h2>
            <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
              {t.home.curatedPicksSub}
            </p>
          </div>
        </div>

        <Link
          href={PATHS.PRODUCTS}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9f815b] dark:text-[#d4be9b] hover:text-[#7a5d3e] dark:hover:text-[#f7f4ee] transition-colors"
        >
          <span>{t.common.seeMore}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
