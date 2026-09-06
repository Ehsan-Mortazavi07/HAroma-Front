'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, Sparkles, X, Check } from 'lucide-react';
import { IProduct, ICategory, IBrand } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { useAppSelector } from '@/stores/hooks';
import { formatToman, toPersianDigits } from '@/common/utils';
import { catalogApi } from '@/common/api/catalog';

interface ProductsPageProps {
  initialData?: {
    items: IProduct[];
    total: number;
    page?: number;
    pageSize?: number;
  };
  initialProducts?: IProduct[];
  initialTotal?: number;
  categories: ICategory[];
}

export function ProductsPage({
  initialData,
  initialProducts,
  initialTotal,
  categories,
}: ProductsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPersian = useAppSelector((state) => state.ui.lang === 'fa');

  const [products, setProducts] = useState<IProduct[]>(
    initialProducts || initialData?.items || [],
  );
  const [total, setTotal] = useState(
    initialTotal !== undefined ? initialTotal : initialData?.total || 0,
  );
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<IBrand[]>([]);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || '',
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(
    searchParams.get('brand') || '',
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    searchParams.get('sort') || 'newest',
  );
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    searchParams.get('inStockOnly') === 'true' || searchParams.get('inStock') === 'true',
  );
  const [isVipOnly, setIsVipOnly] = useState<boolean>(
    searchParams.get('isVipOnly') === 'true' || searchParams.get('vip') === 'true',
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('q') || '',
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await catalogApi.getBrands();
        setBrands(res || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadBrands();
  }, []);

  // Sync state when URL searchParams change (e.g. from Footer / Navbar / Breadcrumbs)
  useEffect(() => {
    const urlCat = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    const urlSort = searchParams.get('sort') || 'newest';
    const urlStock = searchParams.get('inStockOnly') === 'true' || searchParams.get('inStock') === 'true';
    const urlVip = searchParams.get('isVipOnly') === 'true' || searchParams.get('vip') === 'true';
    const urlQ = searchParams.get('q') || '';

    setSelectedCategory(urlCat);
    setSelectedBrand(urlBrand);
    setSelectedSort(urlSort);
    setInStockOnly(urlStock);
    setIsVipOnly(urlVip);
    setSearchQuery(urlQ);
  }, [searchParams]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleBrandSelect = (slug: string) => {
    setSelectedBrand(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('brand', slug);
    } else {
      params.delete('brand');
    }
    router.push(`/products?${params.toString()}`);
  };

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getProducts({
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        sort: selectedSort,
        inStockOnly: inStockOnly || undefined,
        isVipOnly: isVipOnly || undefined,
        q: searchQuery || undefined,
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedCategory, selectedBrand, selectedSort, inStockOnly, isVipOnly, searchQuery]);

  useEffect(() => {
    document.title = isPersian
      ? 'فروشگاه عطر و ادکلن‌های نیش | هاتف آروما'
      : 'Luxury Niche Perfumes | HatefAroma';
  }, [isPersian]);

  const sortOptions = [
    { id: 'newest', label: isPersian ? 'جدیدترین‌ها' : 'Newest' },
    { id: 'price_asc', label: isPersian ? 'ارزان‌ترین' : 'Price: Low to High' },
    { id: 'price_desc', label: isPersian ? 'گران‌ترین' : 'Price: High to Low' },
    { id: 'best_sellers', label: isPersian ? 'پرفروش‌ترین‌ها' : 'Best Sellers' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            {isPersian ? 'فروشگاه عطر و ادکلن‌های نیش' : 'Luxury Perfumes & Niche Fragrances'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? `نمایش ${toPersianDigits(total)} محصول با ضمانت اصالت ۱۰۰٪ فیزیکی`
              : `Showing ${total} genuine products`}
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-surface border border-brand-border text-xs font-bold text-brand-text"
          >
            <Filter className="w-4 h-4 text-brand-bronze" />
            <span>{isPersian ? 'فیلترها' : 'Filters'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-text-muted hidden sm:inline-block">
              {isPersian ? 'مرتب‌سازی:' : 'Sort by:'}
            </span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-brand-surface text-brand-text text-xs font-bold border border-brand-border focus:ring-2 focus:ring-brand-gold cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`lg:block lg:sticky lg:top-24 ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-brand-surface p-6 overflow-y-auto'
              : 'hidden'
          } lg:p-0 lg:bg-transparent lg:dark:bg-transparent space-y-6`}
        >
          {isMobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-brand-border lg:hidden">
              <h3 className="font-bold text-lg text-brand-text">{isPersian ? 'فیلتر محصولات' : 'Filters'}</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 rounded-xl bg-brand-surface-elevated text-brand-text"
                aria-label={isPersian ? 'بستن فیلترها' : 'Close filters'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-xs space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-black text-sm text-brand-text mb-3">
                {isPersian ? 'دسته‌بندی‌ها' : 'Categories'}
              </h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto" role="listbox" aria-label={isPersian ? 'دسته‌بندی‌ها' : 'Categories'}>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-brand-gold text-brand-olive font-black shadow-sm'
                      : 'text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text'
                  }`}
                >
                  <span>{isPersian ? 'همه دسته‌بندی‌ها' : 'All Categories'}</span>
                  {selectedCategory === '' && <Check className="w-3.5 h-3.5" />}
                </button>

                {categories
                  .filter((cat) => !cat.parentId)
                  .map((parentCat) => {
                    const subCats = categories.filter(
                      (c) =>
                        c.parentId === parentCat._id ||
                        (typeof c.parentId === 'object' && c.parentId && (c.parentId as any)._id === parentCat._id),
                    );

                    return (
                      <React.Fragment key={parentCat._id}>
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(parentCat.slug)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedCategory === parentCat.slug
                              ? 'bg-brand-gold text-brand-olive font-black shadow-sm'
                              : 'text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text'
                          }`}
                        >
                          <span>{isPersian ? parentCat.name : parentCat.nameEn || parentCat.name}</span>
                          {selectedCategory === parentCat.slug && <Check className="w-3.5 h-3.5" />}
                        </button>

                        {subCats.map((sub) => (
                          <button
                            key={sub._id}
                            type="button"
                            onClick={() => handleCategorySelect(sub.slug)}
                            className={`w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isPersian ? 'mr-3.5 pr-2 border-r-2' : 'ml-3.5 pl-2 border-l-2'
                            } ${
                              selectedCategory === sub.slug
                                ? 'border-brand-gold text-brand-gold font-black bg-brand-gold/10'
                                : 'border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-text-muted'
                            }`}
                          >
                            <span>↳ {isPersian ? sub.name : sub.nameEn || sub.name}</span>
                            {selectedCategory === sub.slug && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </React.Fragment>
                    );
                  })}
              </div>
            </div>

            {/* Brands Filter */}
            {brands.length > 0 && (
              <div className="pt-4 border-t border-brand-border">
                <h3 className="font-black text-sm text-brand-text mb-3">
                  {isPersian ? 'برندها و خانه‌های عطر' : 'Fragrance Brands'}
                </h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto" role="listbox" aria-label={isPersian ? 'برندها' : 'Brands'}>
                  <button
                    type="button"
                    onClick={() => handleBrandSelect('')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedBrand === ''
                        ? 'bg-brand-gold text-brand-olive font-black shadow-sm'
                        : 'text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text'
                    }`}
                  >
                    <span>{isPersian ? 'همه برندها' : 'All Brands'}</span>
                    {selectedBrand === '' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {brands.map((b) => (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => handleBrandSelect(b.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBrand === b.slug
                          ? 'bg-brand-gold text-brand-olive font-black shadow-sm'
                          : 'text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {b.logo && (
                          <img src={b.logo} alt="" className="w-4 h-4 object-contain" />
                        )}
                        <span>{isPersian ? b.name : b.nameEn || b.name}</span>
                      </div>
                      {selectedBrand === b.slug && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Toggle Switches */}
            <div className="pt-4 border-t border-brand-border space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-brand-text">
                  {isPersian ? 'فقط کالاهای موجود' : 'In-Stock Only'}
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-brand-bronze rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-brand-bronze flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPersian ? 'فقط محصولات ویژه VIP' : 'VIP Exclusive Only'}
                </span>
                <input
                  type="checkbox"
                  checked={isVipOnly}
                  onChange={(e) => setIsVipOnly(e.target.checked)}
                  className="w-4 h-4 accent-brand-bronze rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Product Cards Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-3xl bg-brand-surface animate-pulse border border-brand-border"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-brand-surface rounded-3xl border border-brand-border space-y-3">
              <div className="w-16 h-16 rounded-full bg-brand-surface-elevated flex items-center justify-center mx-auto text-brand-bronze">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-brand-text">
                {isPersian ? 'محصولی با این مشخصات یافت نشد' : 'No products match your criteria'}
              </h3>
              <p className="text-xs text-brand-text-muted">
                {isPersian
                  ? 'لطفاً فیلترها را تغییر داده یا از بخش جستجو استفاده نمایید.'
                  : 'Try adjusting your search or filter options.'}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setInStockOnly(false);
                  setIsVipOnly(false);
                }}
                className="px-5 py-2 rounded-xl bg-brand-olive text-brand-champagne font-bold text-xs hover:bg-brand-olive/90 transition-colors border border-brand-gold/30"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
