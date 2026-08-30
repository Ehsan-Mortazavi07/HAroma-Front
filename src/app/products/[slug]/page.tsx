import React from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/components/pages/products/ProductDetailPage';
import { getProductBySlug, getRelatedProducts } from '@/common/api/catalog';

interface ProductDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailRouteProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'محصول یافت نشد | هاتف آروما' };

  return {
    title: `${product.title} (${product.titleEn || ''}) | هاتف آروما`,
    description: product.shortDescription || product.description?.slice(0, 160),
  };
}

export default async function ProductDetailRoute({ params }: ProductDetailRouteProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product._id);

  return <ProductDetailPage product={product} relatedProducts={related} />;
}
