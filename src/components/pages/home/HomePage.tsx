import React from 'react';
import { IProduct, ICategory, IPageSection } from '@/common/interfaces';
import { HeroBanner } from './HeroBanner';
import { TrustFeaturesBar } from './TrustFeaturesBar';
import { QuickCategories } from './QuickCategories';
import { YouMightNeedSection } from './YouMightNeedSection';
import { CampaignBanners } from './CampaignBanners';
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
    <div className="space-y-14 pb-20 pt-4 sm:space-y-20 sm:pb-24 sm:pt-6">
      {isSectionVisible('hero_banner') && <HeroBanner />}
      <TrustFeaturesBar />
      {isSectionVisible('quick_categories') && <QuickCategories categories={categories} />}
      {isSectionVisible('weekly_bestsellers') && (
        <WeeklyBestSellers
          products={bestSellers.length > 0 ? bestSellers : displayFeatured.slice(0, 12)}
        />
      )}
      {isSectionVisible('promo_cards') && <CampaignBanners />}
      {isSectionVisible('featured_perfumes') && (
        <YouMightNeedSection products={displayFeatured.slice(0, 20)} />
      )}
      {isSectionVisible('vip_club_banner') && <VipClubBanner />}
    </div>
  );
}
