'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
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
          <div className="w-10 h-10 rounded-2xl bg-brand-olive text-brand-gold flex items-center justify-center border border-brand-gold/30 shadow-md">
            <Award className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-text">
              {t.home.bestSellers}
            </h2>
            <p className="text-xs text-brand-text-muted">
              {t.home.bestSellersSub}
            </p>
          </div>
        </div>

        <Link
          href={PATHS.PRODUCTS}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-bronze dark:text-brand-gold hover:text-brand-bronze-dark dark:hover:text-brand-text transition-colors self-end sm:self-auto"
        >
          <span>{t.common.seeMore}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" role="tablist" aria-label={t.home.bestSellers}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              size="sm"
              radius="full"
              role="tab"
              aria-selected={isActive}
              onPress={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ease-out h-9 ${
                isActive
                  ? 'bg-brand-gold text-[#141914] shadow-sm font-black'
                  : 'bg-brand-surface text-brand-text-muted hover:bg-brand-surface-elevated border border-brand-border'
              }`}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-8 text-center bg-brand-surface rounded-3xl border border-brand-border text-brand-text-muted text-xs">
          <CardBody className="p-0">
            {t.home.noProducts}
          </CardBody>
        </Card>
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
