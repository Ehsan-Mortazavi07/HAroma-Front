'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronDown,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Button, Input, Skeleton } from '@heroui/react';
import { catalogApi } from '@/common/api/catalog';
import { IProduct, IBrand } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BrandItem {
  id: string;
  name: string;
  nameEn?: string;
  subtitle: string;
  image: string;
  slug: string;
}

// Curated luxury perfume houses for "برندها"
const defaultBrands: BrandItem[] = [
  {
    id: 'creed',
    name: 'کرید',
    nameEn: 'Creed',
    subtitle: 'خانه عطر سلطنتی و اصیل بریتانیایی؛ شاهکار اونتوس و سیلور مانتین',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=200&auto=format&fit=crop',
    slug: 'creed',
  },
  {
    id: 'tom-ford',
    name: 'تام فورد',
    nameEn: 'Tom Ford',
    subtitle: 'کالکشن خصوصی و نیش؛ روایح اشرافی، چرمی، دودی و وانیلی',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=200&auto=format&fit=crop',
    slug: 'tom-ford',
  },
  {
    id: 'xerjoff',
    name: 'زرجوف',
    nameEn: 'Xerjoff',
    subtitle: 'عطرسازی لوکس نیش ایتالیا؛ کالکشن کازاموراتی و اکسنتو',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop',
    slug: 'xerjoff',
  },
  {
    id: 'amouage',
    name: 'آمواژ',
    nameEn: 'Amouage',
    subtitle: 'هدیه پادشاهان؛ عود خالص، کندر اصیل و کندوی اشرافی عمان',
    image: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?q=80&w=200&auto=format&fit=crop',
    slug: 'amouage',
  },
  {
    id: 'mfk',
    name: 'میسون فرانسیس کورکجان',
    nameEn: 'Maison Francis Kurkdjian',
    subtitle: 'ظرافت بی‌انتهای پاریسی و جادوی کیمیاگری باکارات رژ ۵۴۰',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=200&auto=format&fit=crop',
    slug: 'maison-francis-kurkdjian',
  },
  {
    id: 'dior',
    name: 'دیور',
    nameEn: 'Dior',
    subtitle: 'نماد اصالت و شکوه اشرافی فرانسه؛ کالکشن ساواج و جادور',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop',
    slug: 'dior',
  },
  {
    id: 'chanel',
    name: 'شنل',
    nameEn: 'Chanel',
    subtitle: 'جاودانگی دنیای عطر؛ بلو شنل، کوکو مادمازل و چنس تندروود',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=200&auto=format&fit=crop',
    slug: 'chanel',
  },
  {
    id: 'parfums-de-marly',
    name: 'پارفومز د مارلی',
    nameEn: 'Parfums de Marly',
    subtitle: 'شکوه دربار لوئی پانزدهم؛ لیتون، هرود، دلینا و پگاسوس سلطنتی',
    image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=200&auto=format&fit=crop',
    slug: 'parfums-de-marly',
  },
];

// Categories filter chips («بخش»)
const filterCategories = [
  { id: 'all', title: 'همه', slug: '' },
  { id: 'men', title: 'عطر مردانه', slug: 'men-perfumes' },
  { id: 'women', title: 'عطر زنانه', slug: 'women-perfumes' },
  { id: 'vip', title: 'کالکشن VIP', slug: 'vip-niche' },
  { id: 'unisex', title: 'عطر یونیسکس', slug: 'unisex-perfumes' },
  { id: 'oriental', title: 'روایح گرم و شرقی', slug: 'oriental' },
  { id: 'summer', title: 'روایح خنک', slug: 'summer' },
  { id: 'gift', title: 'ست کادویی', slug: 'gift-sets' },
  { id: 'miniature', title: 'دکانت و سمپل', slug: 'miniature' },
  { id: 'home', title: 'خوشبوکننده محیط', slug: 'home-fragrance' },
  { id: 'body', title: 'بادی اسپلش', slug: 'body-splash' },
  { id: 'skin', title: 'مراقبت پوست و مو', slug: 'skin-care' },
];

const sortOptions = [
  { label: 'جدیدترین', value: 'newest' },
  { label: 'ارزان‌ترین', value: 'price_asc' },
  { label: 'گران‌ترین', value: 'price_desc' },
  { label: 'محبوب‌ترین', value: 'popular' },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { isPersian } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const [brands, setBrands] = useState<BrandItem[]>(defaultBrands);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load brands dynamically on mount
  useEffect(() => {
    let isMounted = true;
    catalogApi
      .getBrands()
      .then((data: IBrand[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped: BrandItem[] = data.map((b, idx) => {
            const fallback = defaultBrands[idx % defaultBrands.length];
            return {
              id: b._id || b.slug || `brand-${idx}`,
              name: b.name,
              nameEn: b.nameEn || '',
              subtitle: b.description || fallback.subtitle,
              image: b.image || b.logo || fallback.image,
              slug: b.slug,
            };
          });
          setBrands(mapped);
        }
      })
      .catch(() => {
        // Fallback to default luxury brands
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto focus input on open & lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
      setSelectedCategory('');
      setInStockOnly(false);
      setIsSortDropdownOpen(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    if (!isSortDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  // Live search debounced
  useEffect(() => {
    if (!isOpen) return;

    // If query is empty and no specific category selected and inStock not toggled, show brands
    if (!searchQuery.trim() && !selectedCategory && !inStockOnly) {
      setProducts([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const params: Record<string, any> = {
          limit: 8,
        };
        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (selectedCategory) params.category = selectedCategory;
        if (inStockOnly) params.inStock = true;
        if (selectedSort) params.sort = selectedSort;

        const res = await catalogApi.getProducts(params);
        if (res?.items) {
          setProducts(res.items);
          setTotalResults(res.total || res.items.length);
        } else if (Array.isArray(res)) {
          setProducts(res.slice(0, 8));
          setTotalResults(res.length);
        } else {
          setProducts([]);
          setTotalResults(0);
        }
      } catch (err) {
        console.error('Search error:', err);
        setProducts([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }, 240);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, inStockOnly, selectedSort, isOpen]);

  const handleNavigateToAllResults = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (inStockOnly) params.set('inStockOnly', 'true');
    if (selectedSort !== 'newest') params.set('sort', selectedSort);

    router.push(`/products?${params.toString()}`);
    onClose();
  };

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory((prev) => (prev === slug ? '' : slug));
  };

  const activeSortLabel =
    sortOptions.find((opt) => opt.value === selectedSort)?.label || 'جدیدترین';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container: FIXED HEIGHT (h-[650px] max-h-[88vh]) to avoid jumpy resizing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative w-full max-w-2xl h-[650px] max-h-[88vh] bg-[#fcfbf9]/98 dark:bg-[#151a15]/98 backdrop-blur-3xl border border-[#e6dcce] dark:border-[#2e3a2e] rounded-[32px] p-5 sm:p-7 shadow-2xl z-10 flex flex-col overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Input */}
            <div className="relative w-full shrink-0">
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNavigateToAllResults();
                  }
                }}
                placeholder="نام محصول، برند یا رایحه موردنظر را بنویسید..."
                radius="full"
                size="lg"
                variant="flat"
                startContent={
                  <Search className="w-5 h-5 text-[#73695c] dark:text-[#a69c8e] shrink-0 pointer-events-none mr-1" />
                }
                endContent={
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {searchQuery && (
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="light"
                        onPress={() => setSearchQuery('')}
                        className="w-7 h-7 min-w-7 text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e3a2e]"
                        aria-label="پاک کردن متن"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <span className="hidden sm:inline-block text-[10px] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#3e4c3e] bg-white/60 dark:bg-transparent rounded-md px-1.5 py-0.5 font-mono select-none">
                      ESC
                    </span>
                  </div>
                }
                classNames={{
                  base: 'w-full',
                  mainWrapper: 'h-13 sm:h-14',
                  inputWrapper:
                    'bg-[#f0eae0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#3e4c3e] hover:border-[#9f815b]/60 dark:hover:border-[#bfa27a]/60 data-[focus=true]:border-[#9f815b] dark:data-[focus=true]:border-[#bfa27a] data-[focus=true]:bg-white dark:data-[focus=true]:bg-[#242c24] h-13 sm:h-14 px-4 transition-all shadow-inner rounded-full',
                  input:
                    '!border-none !outline-none !shadow-none !ring-0 !bg-transparent text-sm font-medium text-[#1d241d] dark:text-[#f7f4ee] placeholder:text-[#73695c] dark:placeholder:text-[#a69c8e] placeholder:font-normal focus:!outline-none focus:!ring-0 focus:!border-none [appearance:none] [-webkit-appearance:none] pr-2',
                  innerWrapper: '!bg-transparent',
                }}
              />
            </div>

            {/* Filter Chips Section («بخش») & Controls */}
            <div className="mt-4 shrink-0 relative z-20">
              <div className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e] mb-2 pr-1">
                بخش
              </div>

              {/* Chips row */}
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-0.5">
                {filterCategories.map((cat) => {
                  const isActive =
                    cat.slug === ''
                      ? selectedCategory === ''
                      : selectedCategory === cat.slug;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#bfa27a] text-[#141914] border-[#bfa27a] shadow-sm shadow-[#bfa27a]/20 scale-102'
                          : 'bg-[#f0eae0] dark:bg-[#242c24]/80 hover:bg-[#e5ded2] dark:hover:bg-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee] border-[#e6dcce] dark:border-[#3e4c3e]'
                      }`}
                    >
                      {cat.title}
                    </button>
                  );
                })}
              </div>

              {/* Sub-filters row: In-stock toggle & Downward Sorting */}
              <div className="flex items-center justify-between mt-3 pt-1 text-xs">
                {/* Sort Dropdown (Opens DOWNWARDS) */}
                <div className="relative z-30" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0eae0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#3e4c3e] hover:border-[#9f815b]/50 dark:hover:border-[#bfa27a]/50 text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee] transition-all cursor-pointer select-none"
                  >
                    <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                      مرتب‌سازی:
                    </span>
                    <span className="font-bold text-[#1d241d] dark:text-[#e6dcce]">
                      {activeSortLabel}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#73695c] dark:text-[#a69c8e] transition-transform duration-200 ${
                        isSortDropdownOpen
                          ? 'rotate-180 text-[#9f815b] dark:text-[#bfa27a]'
                          : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu - OPENS DOWNWARDS (top-full mt-2) */}
                  <AnimatePresence>
                    {isSortDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#1f261f] border border-[#e6dcce] dark:border-[#3e4c3e] rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1"
                      >
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSelectedSort(opt.value);
                              setIsSortDropdownOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs text-right font-bold transition-colors flex items-center justify-between cursor-pointer ${
                              selectedSort === opt.value
                                ? 'bg-[#bfa27a] text-[#141914]'
                                : 'text-[#1d241d] dark:text-[#e6dcce] hover:bg-[#f0eae0] dark:hover:bg-[#283228] hover:text-[#9f815b] dark:hover:text-[#bfa27a]'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selectedSort === opt.value && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* In-Stock Toggle */}
                <button
                  type="button"
                  onClick={() => setInStockOnly((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
                    inStockOnly
                      ? 'bg-[#bfa27a]/15 border-[#bfa27a] text-[#9f815b] dark:text-[#bfa27a]'
                      : 'bg-[#f0eae0] dark:bg-[#242c24] border-[#e6dcce] dark:border-[#3e4c3e] text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      inStockOnly ? 'bg-[#bfa27a]' : 'bg-[#73695c] dark:bg-[#a69c8e]'
                    }`}
                  />
                  <span>فقط موجود</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e6dcce] dark:bg-[#2e3a2e] my-3.5 shrink-0" />

            {/* Results / Brands Section (flex-1 min-h-0: maintains rock-solid fixed height!) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Header of results */}
              <div className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e] mb-2.5 pr-1 flex items-center justify-between shrink-0 select-none">
                <span>
                  {searchQuery.trim() || selectedCategory || inStockOnly
                    ? `نتایج جست‌وجو (${isPersian ? toPersianDigits(totalResults) : totalResults} مورد)`
                    : 'برندها'}
                </span>
                {totalResults > 0 && (
                  <button
                    onClick={handleNavigateToAllResults}
                    className="text-[11px] font-bold text-[#9f815b] dark:text-[#bfa27a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده همه</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Scrollable list container */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {/* Case 1: Empty Query & No Filters -> Valira-style "برندها" list */}
                {!searchQuery.trim() && !selectedCategory && !inStockOnly ? (
                  <div className="space-y-1.5 pb-2">
                    {brands.map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/products?brand=${brand.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-transparent hover:bg-[#f0eae0] dark:hover:bg-[#242c24]/90 border border-transparent hover:border-[#e6dcce] dark:hover:border-[#3e4c3e] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-[#f0eae0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#3e4c3e] group-hover:border-[#9f815b] dark:group-hover:border-[#bfa27a]/60 transition-colors shrink-0">
                            <Image
                              src={brand.image}
                              alt={brand.name}
                              fill
                              sizes="50px"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee] group-hover:text-[#9f815b] dark:group-hover:text-[#bfa27a] transition-colors truncate">
                                {brand.name}
                              </span>
                              {brand.nameEn && (
                                <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-sans">
                                  {brand.nameEn}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e] group-hover:text-[#1d241d] dark:group-hover:text-[#e6dcce] transition-colors truncate mt-0.5 font-medium">
                              {brand.subtitle}
                            </span>
                          </div>
                        </div>

                        <ArrowLeft className="w-4 h-4 text-[#73695c] dark:text-[#a69c8e] group-hover:text-[#9f815b] dark:group-hover:text-[#bfa27a] group-hover:-translate-x-1.5 transition-all shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                ) : isLoading ? (
                  /* Loading Skeletons */
                  <div className="space-y-2 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#f0eae0]/50 dark:bg-[#242c24]/50 border border-[#e6dcce]/50 dark:border-[#3e4c3e]/50 gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Skeleton className="w-12 h-12 rounded-2xl bg-[#e6dcce]/70 dark:bg-[#2e3a2e]" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="w-3/5 h-3.5 rounded-lg bg-[#e6dcce]/70 dark:bg-[#2e3a2e]" />
                            <Skeleton className="w-2/5 h-2.5 rounded-lg bg-[#e6dcce]/70 dark:bg-[#2e3a2e]" />
                          </div>
                        </div>
                        <Skeleton className="w-16 h-4 rounded-lg bg-[#e6dcce]/70 dark:bg-[#2e3a2e]" />
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  /* Empty Results State */
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-[#f0eae0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#3e4c3e] flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-[#73695c] dark:text-[#a69c8e]" />
                    </div>
                    <h4 className="font-black text-sm text-[#1d241d] dark:text-[#f7f4ee] mb-1">
                      محصولی با این مشخصات یافت نشد
                    </h4>
                    <p className="text-xs text-[#73695c] dark:text-[#a69c8e] max-w-xs mb-5">
                      می‌توانید کلمه کلیدی دیگری را بنویسید یا فیلتر دسته‌بندی را تغییر دهید.
                    </p>
                    <Button
                      as={Link}
                      href={PATHS.PRODUCTS}
                      onPress={onClose}
                      radius="full"
                      className="bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] font-black text-xs px-6 h-9 shadow-sm"
                    >
                      مشاهده تمام محصولات
                    </Button>
                  </div>
                ) : (
                  /* Product Search Results */
                  <div className="space-y-2 pb-2">
                    {products.map((prod) => {
                      const price =
                        prod.discountPrice && prod.discountPrice > 0
                          ? prod.discountPrice
                          : prod.price;
                      const prodImage =
                        prod.images && prod.images.length > 0
                          ? prod.images[0].startsWith('http')
                            ? prod.images[0]
                            : `http://127.0.0.1:7731${prod.images[0]}`
                          : 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';

                      return (
                        <Link
                          key={prod._id}
                          href={`${PATHS.PRODUCTS}/${prod.slug || prod._id}`}
                          onClick={onClose}
                          className="group flex items-center justify-between p-3 rounded-2xl bg-[#f0eae0]/50 dark:bg-[#242c24]/50 hover:bg-[#f0eae0] dark:hover:bg-[#242c24] border border-[#e6dcce]/80 dark:border-[#3e4c3e]/70 hover:border-[#9f815b]/60 dark:hover:border-[#bfa27a]/60 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-[#181f18] border border-[#e6dcce] dark:border-[#3e4c3e] group-hover:border-[#9f815b]/60 dark:group-hover:border-[#bfa27a]/60 transition-colors shrink-0">
                              <Image
                                src={prodImage}
                                alt={prod.title}
                                fill
                                sizes="50px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-[#1d241d] dark:text-[#f7f4ee] group-hover:text-[#9f815b] dark:group-hover:text-[#bfa27a] transition-colors truncate">
                                {isPersian
                                  ? prod.title
                                  : prod.titleEn || prod.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                                {prod.brand && <span>{prod.brand.name}</span>}
                                {prod.inStock ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    موجود
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                                    ناموجود
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 mr-3">
                            <div className="text-left sm:text-right">
                              <div className="text-xs sm:text-sm font-black text-[#1d241d] dark:text-[#f7f4ee]">
                                {formatToman(price, isPersian)}
                              </div>
                              {prod.discountPrice && prod.discountPrice > 0 && (
                                <div className="text-[10px] text-[#73695c] dark:text-[#a69c8e] line-through">
                                  {formatToman(prod.price, isPersian)}
                                </div>
                              )}
                            </div>
                            <ArrowLeft className="w-4 h-4 text-[#73695c] dark:text-[#a69c8e] group-hover:text-[#9f815b] dark:group-hover:text-[#bfa27a] group-hover:-translate-x-1.5 transition-all shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Bar */}
            {(searchQuery.trim() || selectedCategory || inStockOnly) && (
              <div className="mt-3 pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between text-xs shrink-0 select-none">
                <span className="text-[#73695c] dark:text-[#a69c8e]">
                  نمایش {isPersian ? toPersianDigits(products.length) : products.length} از{' '}
                  {isPersian ? toPersianDigits(totalResults) : totalResults} نتیجه
                </span>
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleNavigateToAllResults}
                  className="font-bold text-[#9f815b] dark:text-[#bfa27a] hover:text-[#7a5d3e] dark:hover:text-[#d4be9b] flex items-center gap-1.5 px-3 cursor-pointer"
                  endContent={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  مشاهده تمام نتایج در صفحه محصولات
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

