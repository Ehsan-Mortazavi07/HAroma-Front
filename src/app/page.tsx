import React from 'react';
import { HomePage } from '@/components/pages/home/HomePage';
import {
  getFeaturedProducts,
  getBestSellerProducts,
  getCategories,
  getPageSections,
} from '@/common/api/catalog';

export const revalidate = 60; // ISR 60s

export default async function Page() {
  const [categories, featuredProducts, bestSellers, sections] = await Promise.all([
    getCategories(),
    getFeaturedProducts(16),
    getBestSellerProducts(16),
    getPageSections(),
  ]);

  return (
    <HomePage
      categories={categories}
      featuredProducts={featuredProducts}
      bestSellers={bestSellers}
      sections={sections}
    />
  );
}
