'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Skeleton,
} from '@heroui/react';
import { Filter, SlidersHorizontal, Sparkles, X, Check, ChevronDown } from 'lucide-react';
import { IProduct, ICategory, IBrand } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useAppSelector } from '@/stores/hooks';
import { toPersianDigits } from '@/common/utils';
import { catalogApi } from '@/common/api/catalog';

// Unified fluid motion variants matching Navbar Profile Dropdown
const floatingPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -14,
    scale: 0.985,
    transition: {
      duration: 0.22,
      ease: 'easeInOut',
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: 'easeOut',
      staggerChildren: 0.025,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.985,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

interface ProductsPageProps {
  initialData?: {
    items: IProduct[];
    total: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  initialProducts?: IProduct[];
  initialTotal?: number;
  initialPage?: number;
  pageSize?: number;
  initialTotalPages?: number;
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
  initialPage = 1,
  pageSize = 12,
  initialTotalPages = 1,
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
  const [currentPage, setCurrentPage] = useState<number>(
    initialPage || Number(searchParams.get('page')) || 1,
  );
  const [totalPages, setTotalPages] = useState<number>(
    initialTotalPages || Math.ceil((initialTotal || initialData?.total || 0) / pageSize) || 1,
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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!isSortOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

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

  const isFirstMount = useRef(true);

  // Sync state when URL searchParams change (e.g. from Footer / Navbar / Breadcrumbs)
  useEffect(() => {
    const urlCat = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    const urlSort = searchParams.get('sort') || 'newest';
    const urlStock = searchParams.get('inStockOnly') === 'true' || searchParams.get('inStock') === 'true';
    const urlVip = searchParams.get('isVipOnly') === 'true' || searchParams.get('vip') === 'true';
    const urlQ = searchParams.get('q') || '';
    const urlPage = Math.max(1, Number(searchParams.get('page')) || 1);

    setSelectedCategory(urlCat);
    setSelectedBrand(urlBrand);
    setSelectedSort(urlSort);
    setInStockOnly(urlStock);
    setIsVipOnly(urlVip);
    setSearchQuery(urlQ);
    setCurrentPage(urlPage);
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
    setCurrentPage(1);
    updateFilterUrl('category', slug);
    updateFilterUrl('page', '');
  };

  const handleBrandSelect = (slug: string) => {
    setSelectedBrand(slug);
    setCurrentPage(1);
    updateFilterUrl('brand', slug);
    updateFilterUrl('page', '');
  };

  const handleSortSelect = (sortKey: string) => {
    setSelectedSort(sortKey);
    setCurrentPage(1);
    updateFilterUrl('sort', sortKey);
    updateFilterUrl('page', '');
  };

  const handleInStockToggle = (val: boolean) => {
    setInStockOnly(val);
    setCurrentPage(1);
    updateFilterUrl('inStock', val ? 'true' : '');
    updateFilterUrl('page', '');
  };

  const handleVipToggle = (val: boolean) => {
    setIsVipOnly(val);
    setCurrentPage(1);
    updateFilterUrl('vip', val ? 'true' : '');
    updateFilterUrl('page', '');
  };

  const fetchFilteredProducts = async (pageToFetch = currentPage) => {
    setLoading(true);
    try {
      const res = await catalogApi.getProducts({
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        sort: selectedSort,
        inStockOnly: inStockOnly || undefined,
        isVipOnly: isVipOnly || undefined,
        q: searchQuery || undefined,
        page: pageToFetch,
        pageSize,
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / pageSize) || 1);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateFilterUrl('page', newPage > 1 ? String(newPage) : '');
    fetchFilteredProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchFilteredProducts(1);
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

          <div className="relative" ref={sortDropdownRef}>
            <Button
              radius="full"
              variant="flat"
              onPress={() => setIsSortOpen(!isSortOpen)}
              className={`h-10 px-4 rounded-full border text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                isSortOpen
                  ? 'bg-brand-gold text-[#141914] border-transparent'
                  : 'bg-brand-surface hover:bg-brand-surface-elevated border-brand-border/70 hover:border-brand-gold text-brand-text'
              }`}
              aria-label={isPersian ? 'مرتب‌سازی بر اساس' : 'Sort by'}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isSortOpen ? 'text-[#141914]' : 'text-brand-bronze dark:text-brand-gold'}`} />
              <span>{sortOptions.find((opt) => opt.id === selectedSort)?.label || (isPersian ? 'مرتب‌سازی' : 'Sort')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-[#141914]' : 'text-brand-text-muted'}`} />
            </Button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  key="sort-dropdown-card"
                  variants={floatingPanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full mt-2 left-0 z-50 w-52 bg-brand-surface/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-brand-border/70 dark:border-[#2e3a2e] rounded-2xl p-1.5 shadow-2xl overflow-hidden text-right"
                >
                  <div className="flex flex-col gap-1">
                    {sortOptions.map((opt) => {
                      const isSelected = selectedSort === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleSortSelect(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-right ${
                            isSelected
                              ? 'bg-brand-gold/20 text-brand-bronze-dark dark:text-brand-gold font-black'
                              : 'text-brand-text hover:bg-brand-surface-elevated/80 dark:hover:bg-[#242c24]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              key={`${selectedBrand || 'all'}-${selectedCategory || 'all'}-${selectedSort}-${inStockOnly}-${isVipOnly}`}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.02,
                  },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.98 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-brand-border/60">
              <div className="text-xs font-bold text-brand-text-muted">
                {isPersian
                  ? `صفحه ${toPersianDigits(currentPage)} از ${toPersianDigits(totalPages)} (مجموع ${toPersianDigits(total)} محصول)`
                  : `Page ${currentPage} of ${totalPages} (${total} total products)`}
              </div>

              <PaginationControls
                totalPages={totalPages}
                currentPage={currentPage}
                isPersian={isPersian}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {totalPages <= 1 && total > 0 && (
            <div className="flex items-center justify-center mt-10 pt-6 border-t border-brand-border/60">
              <span className="text-xs font-bold text-brand-text-muted">
                {isPersian
                  ? `نمایش تمام ${toPersianDigits(products.length)} محصول در این صفحه`
                  : `Showing all ${products.length} products on this page`}
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
