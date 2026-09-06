'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { IProduct } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

interface WeeklyBestSellersProps {
  products: IProduct[];
}

export function WeeklyBestSellers({ products }: WeeklyBestSellersProps) {
  const { t, isPersian, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t.home.allCategories },
    { id: 'men-perfumes', label: t.nav.menPerfumes },
    { id: 'women-perfumes', label: t.nav.womenPerfumes },
    { id: 'body-splash', label: t.nav.bodySplash },
    { id: 'skin-care', label: t.nav.skinCare },
    { id: 'vip-niche', label: t.nav.vipClub },
  ];

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'vip-niche') return p.isVipOnly;
    return p.categories?.some((c) => c.slug === activeTab);
  });

  return (
    <section className="mb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#202620] text-[#d4be9b] flex items-center justify-center border border-[#bfa27a]/30 shadow-md">
            <Award className="w-5 h-5 text-[#bfa27a]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
              {t.home.bestSellers}
            </h2>
            <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
              {t.home.bestSellersSub}
            </p>
          </div>
        </div>

        <Link
          href={PATHS.PRODUCTS}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#9f815b] dark:text-[#d4be9b] hover:text-[#7a5d3e] dark:hover:text-[#f7f4ee] transition-colors self-end sm:self-auto"
        >
          <span>{t.common.seeMore}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" role="tablist" aria-label={t.home.bestSellers}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#bfa27a] text-[#141914] shadow-sm font-black'
                : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#73695c] dark:text-[#a69c8e] hover:bg-[#f0eae0] dark:hover:bg-[#283228] border border-[#e6dcce] dark:border-[#2e3a2e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 text-center bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] text-xs">
          {t.home.noProducts}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
