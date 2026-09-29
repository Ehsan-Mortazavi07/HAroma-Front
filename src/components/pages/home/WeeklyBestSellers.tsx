'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { IPageSection, IProduct } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';
import { useDraggableScroll } from '@/common/hooks/useDraggableScroll';

interface WeeklyBestSellersProps {
  products: IProduct[];
  section?: IPageSection;
}

export function WeeklyBestSellers({ products, section }: WeeklyBestSellersProps) {
  const { t, isPersian, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const { scrollRef, canScrollPrev, canScrollNext, handleScroll, dragHandlers } = useDraggableScroll({
    isRTL,
    friction: 0.88,
  });
  const title = isPersian ? section?.title || t.home.bestSellers : section?.titleEn || t.home.bestSellers;
  const subtitle = isPersian ? section?.subtitle || t.home.bestSellersSub : section?.subtitleEn || t.home.bestSellersSub;

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
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-surface-elevated text-brand-gold flex items-center justify-center border border-brand-gold/30 shadow-xs">
            <Award className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-text">
              {title}
            </h2>
            <p className="text-xs text-brand-text-muted">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Link
            href={PATHS.PRODUCTS}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-bronze dark:text-brand-gold hover:text-brand-bronze-dark dark:hover:text-brand-text transition-colors"
          >
            <span>{t.common.seeMore}</span>
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              size="sm"
              aria-label={isPersian ? 'قبلی' : 'Previous'}
              isDisabled={!canScrollPrev}
              onPress={() => handleScroll('prev', 280)}
              className="w-8 h-8 min-w-8 bg-brand-surface border border-brand-border/80 hover:border-brand-gold hover:bg-brand-surface-elevated text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              size="sm"
              aria-label={isPersian ? 'بعدی' : 'Next'}
              isDisabled={!canScrollNext}
              onPress={() => handleScroll('next', 280)}
              className="w-8 h-8 min-w-8 bg-brand-surface border border-brand-border/80 hover:border-brand-gold hover:bg-brand-surface-elevated text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-3 mb-5 sm:mb-6 scrollbar-none" role="tablist" aria-label={t.home.bestSellers}>
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
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ease-out h-8 sm:h-9 ${
                isActive
                  ? 'bg-brand-gold text-[#141914] shadow-xs font-black'
                  : 'bg-brand-surface text-brand-text-muted hover:bg-brand-surface-elevated border border-brand-border/70'
              }`}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Products Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
      {filteredProducts.length === 0 ? (
        <Card className="p-8 text-center bg-brand-surface rounded-3xl border border-brand-border text-brand-text-muted text-xs">
          <CardBody className="p-0">
            {t.home.noProducts}
          </CardBody>
        </Card>
      ) : (
        <div
          ref={scrollRef}
          {...dragHandlers}
          style={{ touchAction: 'pan-y' }}
          aria-label={title}
          className="flex items-stretch gap-3 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory py-2 px-0.5 select-none cursor-grab active:cursor-grabbing sm:gap-4 lg:gap-5"
        >
          {filteredProducts.map((product) => (
            <div key={product._id} className="flex w-[min(78vw,236px)] shrink-0 snap-start flex-col sm:w-[230px] lg:w-[245px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
