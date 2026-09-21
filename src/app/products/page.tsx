import React from 'react';
import { ProductsPage } from '@/components/pages/products/ProductsPage';
import { getProducts, getCategories } from '@/common/api/catalog';

interface ProductsRouteProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    vip?: string;
    inStock?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: 'کاتالوگ عطر و ادکلن‌های اصل | هاتف آروما',
  description: 'خرید اینترنتی انواع عطر و ادکلن مردانه، زنانه، یونیسکس و نیش با ضمانت اصالت فیزیکی و ارسال فوری.',
};

export default async function ProductsRoute({ searchParams }: ProductsRouteProps) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const search = resolvedParams.q;
  const isVipOnly = resolvedParams.vip === 'true';
  const inStock = resolvedParams.inStock === 'true';
  const sortBy = resolvedParams.sortBy || 'newest';
  const page = Math.max(1, Number(resolvedParams.page) || 1);
  const pageSize = 12;

  const [productsRes, categories] = await Promise.all([
    getProducts({
      category,
      q: search,
      isVipOnly: isVipOnly ? true : undefined,
      inStock: inStock ? true : undefined,
      sortBy,
      page,
      pageSize,
    }),
    getCategories(),
  ]);

  return (
    <ProductsPage
      initialProducts={productsRes.items}
      categories={categories}
      initialTotal={productsRes.total}
      initialPage={page}
      pageSize={pageSize}
      initialTotalPages={productsRes.totalPages || Math.ceil((productsRes.total || 0) / pageSize) || 1}
    />
  );
}
