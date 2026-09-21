'use client';

import React from 'react';
import { IProduct, ICategory, IPageSection } from '@/common/interfaces';
import { HeroBanner } from './HeroBanner';
import { TrustFeaturesBar } from './TrustFeaturesBar';
import { QuickCategories } from './QuickCategories';
import { YouMightNeedSection } from './YouMightNeedSection';
import { PromoCardsArches } from './PromoCardsArches';
import { WeeklyBestSellers } from './WeeklyBestSellers';
import { VipClubBanner } from './VipClubBanner';

interface HomePageProps {
  products?: IProduct[];
  featuredProducts?: IProduct[];
  categories: ICategory[];
  bestSellers: IProduct[];
  sections?: IPageSection[];
}

export function HomePage({
  products = [],
  featuredProducts = [],
  categories = [],
  bestSellers = [],
  sections = [],
}: HomePageProps) {
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products;

  // Helper to check section visibility from backend PageSection model
  const isSectionVisible = (key: string) => {
    if (!sections || sections.length === 0) return true;
    const found = sections.find((s) => s.sectionKey === key);
    return found ? found.isVisible : true;
  };

  return (
    <div className="min-h-screen space-y-12 sm:space-y-16 pb-16 pt-2 sm:pt-4">
      {isSectionVisible('hero_banner') && <HeroBanner />}
      <TrustFeaturesBar />
      {isSectionVisible('quick_categories') && <QuickCategories categories={categories} />}
      {isSectionVisible('featured_perfumes') && (
        <YouMightNeedSection products={displayFeatured.slice(0, 20)} />
      )}
      {isSectionVisible('promo_cards') && <PromoCardsArches />}
      {isSectionVisible('weekly_bestsellers') && (
        <WeeklyBestSellers
          products={bestSellers.length > 0 ? bestSellers : displayFeatured.slice(0, 12)}
        />
      )}
      {isSectionVisible('vip_club_banner') && <VipClubBanner />}
    </div>
  );
}
