'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, Select, SelectItem, Switch, Button, Skeleton } from '@heroui/react';
import { Filter, SlidersHorizontal, Sparkles, X, Check } from 'lucide-react';
import { IProduct, ICategory, IBrand } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { useAppSelector } from '@/stores/hooks';
import { toPersianDigits } from '@/common/utils';
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

interface SmoothSwitchProps {
  isSelected: boolean;
  onValueChange: (val: boolean) => void;
  ariaLabel?: string;
  isRtl?: boolean;
}

function SmoothSwitch({ isSelected, onValueChange, ariaLabel, isRtl }: SmoothSwitchProps) {
  // In RTL, the track start is on the right; active state slides to the left (-20px)
  // In LTR, the track start is on the left; active state slides to the right (+20px)
  const translateX = isRtl ? (isSelected ? -20 : 0) : (isSelected ? 20 : 0);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onValueChange(!isSelected);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-brand-gold shadow-2xs ${
        isSelected
          ? 'bg-brand-gold shadow-sm shadow-brand-gold/30'
          : 'bg-[#ded6c8] dark:bg-[#2e3a2e]'
      }`}
    >
      <motion.span
        animate={{ x: translateX }}
        transition={{
          type: 'spring',
          stiffness: 550,
          damping: 32,
        }}
        className={`pointer-events-none block h-5 w-5 rounded-full shadow-md transition-colors duration-200 ${
          isSelected
            ? 'bg-[#141914]'
            : 'bg-white dark:bg-[#141914]'
        }`}
      />
    </button>
  );
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
  const [brandsLoading, setBrandsLoading] = useState(true);

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
      } finally {
        setBrandsLoading(false);
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

  const updateFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    updateFilterUrl('category', slug);
  };

  const handleBrandSelect = (slug: string) => {
    setSelectedBrand(slug);
    updateFilterUrl('brand', slug);
  };

  const handleSortSelect = (sortKey: string) => {
    setSelectedSort(sortKey);
    updateFilterUrl('sort', sortKey);
  };

  const handleInStockToggle = (val: boolean) => {
    setInStockOnly(val);
    updateFilterUrl('inStock', val ? 'true' : '');
  };

  const handleVipToggle = (val: boolean) => {
    setIsVipOnly(val);
    updateFilterUrl('vip', val ? 'true' : '');
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
      : 'Luxury Niche Fragrances | HatefAroma';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border/60 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            {isPersian ? 'فروشگاه عطر و ادکلن‌های نیش' : 'Luxury Perfumes & Niche Fragrances'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1 font-medium">
            {isPersian
              ? `نمایش ${toPersianDigits(total)} محصول با ضمانت اصالت ۱۰۰٪ فیزیکی`
              : `Showing ${total} genuine products`}
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-3">
          <Button
            onPress={() => setIsMobileFilterOpen(true)}
            variant="flat"
            radius="full"
            className="lg:hidden flex items-center gap-2 h-10 px-4 rounded-full bg-brand-surface border border-brand-border/60 text-xs font-bold text-brand-text cursor-pointer transition-transform active:scale-95"
          >
            <Filter className="w-4 h-4 text-brand-bronze" />
            <span>{isPersian ? 'فیلترها' : 'Filters'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Select
              aria-label={isPersian ? 'مرتب‌سازی بر اساس' : 'Sort by'}
              selectedKeys={new Set([selectedSort])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) handleSortSelect(selected);
              }}
              startContent={<SlidersHorizontal className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />}
              disallowEmptySelection
              variant="bordered"
              radius="full"
              size="sm"
              className="w-48"
              classNames={{
                trigger: "h-10 min-h-10 px-4 bg-brand-surface border border-brand-border/60 hover:border-brand-gold/80 rounded-full shadow-2xs text-xs font-bold text-brand-text transition-all duration-200",
                value: "text-xs font-bold text-brand-text",
                popoverContent: "bg-brand-surface border border-brand-border/60 text-brand-text rounded-2xl shadow-xl p-1",
              }}
            >
              {sortOptions.map((opt) => (
                <SelectItem key={opt.id} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
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
            <div className="flex items-center justify-between pb-4 border-b border-brand-border/60 lg:hidden mb-4">
              <h3 className="font-bold text-lg text-brand-text">{isPersian ? 'فیلتر محصولات' : 'Filters'}</h3>
              <Button
                isIconOnly
                variant="flat"
                radius="full"
                onPress={() => setIsMobileFilterOpen(false)}
                className="bg-brand-surface-elevated text-brand-text cursor-pointer active:scale-95 transition-transform"
                aria-label={isPersian ? 'بستن فیلترها' : 'Close filters'}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}

          <Card className="bg-brand-surface p-5 rounded-3xl border border-brand-border/60 shadow-xs">
            <CardBody className="p-0 space-y-5">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-black text-sm text-brand-text">
                    {isPersian ? 'دسته‌بندی‌ها' : 'Categories'}
                  </h3>
                  <AnimatePresence>
                    {selectedCategory && (
                      <motion.button
                        initial={{ opacity: 0, x: isPersian ? -6 : 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isPersian ? -6 : 6 }}
                        transition={{ duration: 0.18 }}
                        type="button"
                        onClick={() => handleCategorySelect('')}
                        className="text-[11px] font-bold text-brand-bronze dark:text-brand-gold hover:underline cursor-pointer"
                      >
                        {isPersian ? 'حذف فیلتر' : 'Reset'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-none" role="listbox" aria-label={isPersian ? 'دسته‌بندی‌ها' : 'Categories'}>
                  <div className="relative">
                    {selectedCategory === '' && (
                      <motion.div
                        layoutId="activeCategoryIndicator"
                        className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/40 rounded-full shadow-2xs pointer-events-none"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('')}
                      className={`relative z-10 w-full flex items-center justify-between h-9 px-3.5 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer ${
                        selectedCategory === ''
                          ? 'text-brand-bronze-dark dark:text-brand-gold font-black'
                          : 'text-brand-text-muted hover:bg-brand-surface-elevated/80 hover:text-brand-text'
                      }`}
                    >
                      <span>{isPersian ? 'همه دسته‌بندی‌ها' : 'All Categories'}</span>
                      <AnimatePresence>
                        {selectedCategory === '' && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <Check className="w-3.5 h-3.5 shrink-0 text-brand-bronze dark:text-brand-gold" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>

                  {categories
                    .filter((cat) => !cat.parentId)
                    .map((parentCat) => {
                      const subCats = categories.filter(
                        (c) =>
                          c.parentId === parentCat._id ||
                          (typeof c.parentId === 'object' && c.parentId && (c.parentId as any)._id === parentCat._id),
                      );

                      const isParentActive = selectedCategory === parentCat.slug;

                      return (
                        <div key={parentCat._id} className="space-y-0.5">
                          <div className="relative">
                            {isParentActive && (
                              <motion.div
                                layoutId="activeCategoryIndicator"
                                className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/40 rounded-full shadow-2xs pointer-events-none"
                                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleCategorySelect(parentCat.slug)}
                              className={`relative z-10 w-full flex items-center justify-between h-9 px-3.5 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer ${
                                isParentActive
                                  ? 'text-brand-bronze-dark dark:text-brand-gold font-black'
                                  : 'text-brand-text-muted hover:bg-brand-surface-elevated/80 hover:text-brand-text'
                              }`}
                            >
                              <span dir="auto" className="truncate">{isPersian ? parentCat.name : parentCat.nameEn || parentCat.name}</span>
                              <AnimatePresence>
                                {isParentActive && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                  >
                                    <Check className="w-3.5 h-3.5 shrink-0 text-brand-bronze dark:text-brand-gold" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          </div>

                          {subCats.map((sub) => {
                            const isSubActive = selectedCategory === sub.slug;
                            return (
                              <div key={sub._id} className="relative">
                                {isSubActive && (
                                  <motion.div
                                    layoutId="activeCategoryIndicator"
                                    className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/30 rounded-full pointer-events-none"
                                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCategorySelect(sub.slug)}
                                  className={`relative z-10 w-full flex items-center justify-between h-8 rounded-full text-[11px] font-medium transition-colors duration-200 cursor-pointer ${
                                    isPersian ? 'pr-6 pl-3' : 'pl-6 pr-3'
                                  } ${
                                    isSubActive
                                      ? 'text-brand-bronze-dark dark:text-brand-gold font-black'
                                      : 'text-brand-text-muted/80 hover:text-brand-text hover:bg-brand-surface-elevated/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-brand-gold' : 'bg-brand-border'}`} />
                                    <span dir="auto" className="truncate">{isPersian ? sub.name : sub.nameEn || sub.name}</span>
                                  </div>
                                  <AnimatePresence>
                                    {isSubActive && (
                                      <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                      >
                                        <Check className="w-3 h-3 shrink-0 text-brand-bronze dark:text-brand-gold" />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Brands Filter */}
              <div className="pt-4 border-t border-brand-border/60">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-black text-sm text-brand-text">
                    {isPersian ? 'برندها و خانه‌های عطر' : 'Fragrance Brands'}
                  </h3>
                  <AnimatePresence>
                    {selectedBrand && (
                      <motion.button
                        initial={{ opacity: 0, x: isPersian ? -6 : 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isPersian ? -6 : 6 }}
                        transition={{ duration: 0.18 }}
                        type="button"
                        onClick={() => handleBrandSelect('')}
                        className="text-[11px] font-bold text-brand-bronze dark:text-brand-gold hover:underline cursor-pointer"
                      >
                        {isPersian ? 'حذف فیلتر' : 'Reset'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {brandsLoading && brands.length === 0 ? (
                  <div className="space-y-2 animate-pulse py-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 rounded-full bg-brand-surface-elevated/70" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-none" role="listbox" aria-label={isPersian ? 'برندها' : 'Brands'}>
                    <div className="relative">
                      {selectedBrand === '' && (
                        <motion.div
                          layoutId="activeBrandIndicator"
                          className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/40 rounded-full shadow-2xs pointer-events-none"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleBrandSelect('')}
                        className={`relative z-10 w-full flex items-center justify-between h-9 px-3.5 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer ${
                          selectedBrand === ''
                            ? 'text-brand-bronze-dark dark:text-brand-gold font-black'
                            : 'text-brand-text-muted hover:bg-brand-surface-elevated/80 hover:text-brand-text'
                        }`}
                      >
                        <span>{isPersian ? 'همه برندها' : 'All Brands'}</span>
                        <AnimatePresence>
                          {selectedBrand === '' && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                            >
                              <Check className="w-3.5 h-3.5 shrink-0 text-brand-bronze dark:text-brand-gold" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>

                    {brands.map((b) => {
                      const isBrandActive = selectedBrand === b.slug;
                      const logoSrc = b.logo
                        ? b.logo.startsWith('http')
                          ? b.logo
                          : `http://127.0.0.1:7731${b.logo}`
                        : null;

                      const initialLetter = (b.name || 'B').trim().charAt(0).toUpperCase();

                      return (
                        <div key={b._id} className="relative">
                          {isBrandActive && (
                            <motion.div
                              layoutId="activeBrandIndicator"
                              className="absolute inset-0 bg-brand-gold/15 border border-brand-gold/40 rounded-full shadow-2xs pointer-events-none"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleBrandSelect(b.slug)}
                            className={`relative z-10 w-full flex items-center justify-between h-9 px-3 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer ${
                              isBrandActive
                                ? 'text-brand-bronze-dark dark:text-brand-gold font-black'
                                : 'text-brand-text-muted hover:bg-brand-surface-elevated/80 hover:text-brand-text'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt=""
                                  className="w-4 h-4 rounded-full object-contain shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold flex items-center justify-center text-[9px] font-black shrink-0">
                                  {initialLetter}
                                </span>
                              )}
                              <span dir="auto" className="truncate">{isPersian ? b.name : b.nameEn || b.name}</span>
                            </div>
                            <AnimatePresence>
                              {isBrandActive && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                >
                                  <Check className="w-3.5 h-3.5 shrink-0 text-brand-bronze dark:text-brand-gold" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Toggle Switches */}
              <div className="pt-4 border-t border-brand-border/60 space-y-2">
                <div
                  onClick={() => handleInStockToggle(!inStockOnly)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-surface-elevated/50 hover:bg-brand-surface-elevated/80 transition-colors cursor-pointer select-none group active:scale-[0.99]"
                >
                  <span className="text-xs font-bold text-brand-text group-hover:text-brand-bronze dark:group-hover:text-brand-gold transition-colors">
                    {isPersian ? 'فقط کالاهای موجود' : 'In-Stock Only'}
                  </span>
                  <SmoothSwitch
                    isSelected={inStockOnly}
                    onValueChange={handleInStockToggle}
                    ariaLabel={isPersian ? 'فقط کالاهای موجود' : 'In-Stock Only'}
                    isRtl={isPersian}
                  />
                </div>

                <div
                  onClick={() => handleVipToggle(!isVipOnly)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-surface-elevated/50 hover:bg-brand-surface-elevated/80 transition-colors cursor-pointer select-none group active:scale-[0.99]"
                >
                  <span className="text-xs font-bold text-brand-bronze dark:text-brand-gold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isPersian ? 'فقط محصولات ویژه VIP' : 'VIP Exclusive Only'}
                  </span>
                  <SmoothSwitch
                    isSelected={isVipOnly}
                    onValueChange={handleVipToggle}
                    ariaLabel={isPersian ? 'فقط محصولات ویژه VIP' : 'VIP Exclusive Only'}
                    isRtl={isPersian}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </aside>

        {/* Product Cards Grid */}
        <main className="lg:col-span-3">
          {products.length === 0 && loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-80 rounded-3xl bg-brand-surface border border-brand-border/60"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center bg-brand-surface rounded-3xl border border-brand-border/60">
              <CardBody className="p-0 items-center space-y-3">
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
                <Button
                  onPress={() => {
                    handleCategorySelect('');
                    handleBrandSelect('');
                    handleInStockToggle(false);
                    handleVipToggle(false);
                  }}
                  radius="full"
                  className="mt-2 h-10 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  {isPersian ? 'پاک کردن فیلترها' : 'Clear Filters'}
                </Button>
              </CardBody>
            </Card>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
