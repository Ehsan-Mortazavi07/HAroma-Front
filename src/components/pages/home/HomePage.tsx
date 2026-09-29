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
  sections?: IPageSection[] | null;
}

export function HomePage({
  products = [],
  featuredProducts = [],
  categories = [],
  bestSellers = [],
  sections = null,
}: HomePageProps) {
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products;
  const defaultSectionOrder = [
    'hero_banner',
    'quick_categories',
    'trust_features',
    'weekly_best_sellers',
    'you_might_need',
    'promo_cards',
    'vip_club_banner',
  ];
  const sectionsByKey = new Map((sections ?? []).map((section) => [section.sectionKey, section]));
  const hasSectionSettings = sections !== null;

  const orderedSectionKeys = defaultSectionOrder
    .filter((key) => {
      return hasSectionSettings ? sectionsByKey.has(key) : true;
    })
    .sort((a, b) => {
      const aOrder = sectionsByKey.get(a)?.order;
      const bOrder = sectionsByKey.get(b)?.order;
      const orderDifference = (aOrder ?? defaultSectionOrder.indexOf(a) + 1) - (bOrder ?? defaultSectionOrder.indexOf(b) + 1);
      return orderDifference || defaultSectionOrder.indexOf(a) - defaultSectionOrder.indexOf(b);
    });

  const getSection = (key: string) => sectionsByKey.get(key);

  const renderSection = (key: string) => {
    switch (key) {
      case 'hero_banner':
        return <HeroBanner section={getSection(key)} />;
      case 'trust_features':
        return <TrustFeaturesBar section={getSection(key)} />;
      case 'quick_categories':
        return <QuickCategories categories={categories} section={getSection(key)} />;
      case 'promo_cards':
        return <CampaignBanners section={getSection(key)} />;
      case 'weekly_best_sellers':
        return <WeeklyBestSellers products={bestSellers.length > 0 ? bestSellers : displayFeatured.slice(0, 12)} section={getSection(key)} />;
      case 'you_might_need':
        return <YouMightNeedSection products={displayFeatured.slice(0, 20)} section={getSection(key)} />;
      case 'vip_club_banner':
        return <VipClubBanner section={getSection(key)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-9 pb-16 pt-4 sm:space-y-12 sm:pb-20 sm:pt-5 lg:space-y-14">
      {orderedSectionKeys.map((key) => <React.Fragment key={key}>{renderSection(key)}</React.Fragment>)}
    </div>
  );
}
