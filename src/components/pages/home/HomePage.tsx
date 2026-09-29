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
  const defaultSectionOrder = [
    'hero_banner',
    'trust_features',
    'quick_categories',
    'promo_cards',
    'weekly_bestsellers',
    'featured_perfumes',
    'vip_club_banner',
  ];

  const orderedSectionKeys = defaultSectionOrder
    .filter((key) => {
      const section = sections.find((item) => item.sectionKey === key);
      return !section || section.isVisible;
    })
    .sort((a, b) => {
      const aOrder = sections.find((section) => section.sectionKey === a)?.order;
      const bOrder = sections.find((section) => section.sectionKey === b)?.order;
      const orderDifference = (aOrder ?? defaultSectionOrder.indexOf(a) + 1) - (bOrder ?? defaultSectionOrder.indexOf(b) + 1);
      return orderDifference || defaultSectionOrder.indexOf(a) - defaultSectionOrder.indexOf(b);
    });

  const getSection = (key: string) => sections.find((section) => section.sectionKey === key);

  const renderSection = (key: string) => {
    switch (key) {
      case 'hero_banner':
        return <HeroBanner section={getSection(key)} />;
      case 'trust_features':
        return <TrustFeaturesBar section={getSection(key)} />;
      case 'quick_categories':
        return <QuickCategories categories={categories} />;
      case 'promo_cards':
        return <CampaignBanners section={getSection(key)} />;
      case 'weekly_bestsellers':
        return <WeeklyBestSellers products={bestSellers.length > 0 ? bestSellers : displayFeatured.slice(0, 12)} />;
      case 'featured_perfumes':
        return <YouMightNeedSection products={displayFeatured.slice(0, 20)} />;
      case 'vip_club_banner':
        return <VipClubBanner section={getSection(key)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-14 pb-20 pt-4 sm:space-y-20 sm:pb-24 sm:pt-6">
      {orderedSectionKeys.map((key) => <React.Fragment key={key}>{renderSection(key)}</React.Fragment>)}
    </div>
  );
}
