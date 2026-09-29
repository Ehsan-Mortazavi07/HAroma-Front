'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Button, Chip, Modal, ModalBody, ModalContent } from '@heroui/react';
import { IProduct, IProductVariant } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { addToCart, updateQuantity, removeFromCart } from '@/stores/cart/cartSlice';
import { VipBadge } from '@/components/common/VipBadge';
import { ProductCard } from '@/components/common/ProductCard';
import { useTranslation } from '@/common/i18n';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ProductDetailPageProps {
  product: IProduct;
  relatedProducts?: IProduct[];
}

export function getLocalizedVariantTitle(title?: string, isPersian = true): string {
  if (!title) return '';
  if (isPersian) return title;

  const map: Record<string, string> = {
    'حجم ۵۰ میلی‌لیتر': '50 ml Bottle',
    'حجم ۱۰۰ میلی‌لیتر (استاندارد)': '100 ml (Standard)',
    'حجم ۲۰۰ میلی‌لیتر (جامبو)': '200 ml (Jumbo)',
    'دستریز اورجینال ۱۰ میل': '10 ml Original Decant',
    'تستر اورجینال': 'Original Tester',
    'حجم ۳۰ میل': '30 ml Bottle',
    'حجم ۵۰ میل': '50 ml Bottle',
    'حجم ۱۰۰ میل': '100 ml Standard',
    'حجم ۲۰۰ میل': '200 ml Jumbo',
    'حجم ۲۵۰ میل': '250 ml Bottle',
    'دستریز ۱۰ میل': '10 ml Decant',
  };

  if (map[title]) return map[title];

  let en = title;
  en = en.replace(/حجم\s*([0-9۰-۹]+)\s*(میلی‌لیتر|میل)/gi, '$1 ml');
  en = en.replace(/\(استاندارد\)/g, '(Standard)');
  en = en.replace(/\(جامبو\)/g, '(Jumbo)');
  en = en.replace(/دستریز\s*(اورجینال)?\s*([0-9۰-۹]+)\s*میل/gi, '$2 ml Decant');
  en = en.replace(/تستر\s*(اورجینال)?/gi, 'Original Tester');
  en = en.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  return en.trim();
}

const attributeKeyTranslations: Record<string, string> = {
  scent_nature: 'Scent Nature',
  scent_family: 'Scent Family',
  longevity: 'Longevity',
  sillage: 'Sillage',
  volume: 'Volume',
  origin_country: 'Origin Country',
  season: 'Suitable Season',
  gender: 'Gender',
};

const attributeTermTranslations: Record<string, string> = {
  'شرقی': 'Oriental',
  'گلی': 'Floral',
  'چوبی': 'Woody',
  'مرکباتی': 'Citrus',
  'میوه‌ای': 'Fruity',
  'چایپر': 'Chypre',
  'سرخسی': 'Fougère',
  'ادویه‌ای': 'Spicy',
  'چرمی': 'Leather',
  'معطر': 'Aromatic',
  'آروماتیک': 'Aromatic',
  'دودی': 'Smoky',
  'وانیلی': 'Vanilla',
  'شیرین': 'Sweet',
  'تلخ': 'Bitter',
  'خنک': 'Fresh & Cool',
  'گرم': 'Warm',
  'معتدل': 'Moderate',
  'تند': 'Sharp',
  'پودری': 'Powdery',
  'دریایی': 'Aquatic',
  'سبز': 'Green',
  'گیاهی': 'Herbal',
  'مشکی': 'Musky',
  'کهربایی': 'Ambery',

  'بسیار طولانی (بیش از ۲۴ ساعت)': 'Very Long Lasting (24h+)',
  'طولانی (۱۲ تا ۲۴ ساعت)': 'Long Lasting (12-24h)',
  'متوسط (۶ تا ۱۲ ساعت)': 'Moderate (6-12h)',
  'ملایم (۳ تا ۶ ساعت)': 'Soft (3-6h)',

  'بسیار قوی (رد بوی فوق‌العاده)': 'Enormous / Heavy',
  'قوی و محسوس': 'Strong & Noticeable',
  'متوسط و متوازن': 'Moderate & Balanced',
  'ملایم و صمیمی': 'Intimate / Soft',

  'فرانسه': 'France',
  'ایتالیا': 'Italy',
  'انگلستان': 'United Kingdom',
  'آمریکا': 'United States',
  'عمان': 'Oman',
  'سوئیس': 'Switzerland',
  'امارات': 'United Arab Emirates',
  'کانادا': 'Canada',
  'آلمان': 'Germany',
  'اسپانیا': 'Spain',

  'پاییز و زمستان': 'Fall & Winter',
  'بهار و تابستان': 'Spring & Summer',
  'چهار فصل': 'All Seasons',
  'پاییز': 'Autumn / Fall',
  'زمستان': 'Winter',
  'بهار': 'Spring',
  'تابستان': 'Summer',

  'مردانه': 'Men / Masculine',
  'زنانه': 'Women / Feminine',
  'یونیسکس (مشترک)': 'Unisex',
  'یونیسکس': 'Unisex',
};

function translateAttributeValue(val: string): string {
  if (!val) return '';
  if (attributeTermTranslations[val]) {
    return attributeTermTranslations[val];
  }

  const volMatch = val.match(/^([0-9۰-۹]+)\s*(میل|میلی‌لیتر)?$/);
  if (volMatch) {
    const num = volMatch[1].replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    return `${num} ml`;
  }

  let translated = val;
  translated = translated.replace(/\s+و\s+/g, ' & ');

  for (const [faTerm, enTerm] of Object.entries(attributeTermTranslations)) {
    if (faTerm.length > 1) {
      translated = translated.split(faTerm).join(enTerm);
    }
  }

  return translated.trim();
}

export function ProductDetailPage({ product, relatedProducts = [] }: ProductDetailPageProps) {
  const dispatch = useAppDispatch();
  const { t, isPersian } = useTranslation();
  const reduceMotion = useReducedMotion();
  const user = useAppSelector((state) => state.auth.user);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    const title = isPersian ? product.title : product.titleEn || product.title;
    document.title = `${title} | ${isPersian ? 'هاتف آروما' : 'HatefAroma'}`;
  }, [product, isPersian]);

  // Default Variant selection
  const defaultVariant =
    product.variants && product.variants.length > 0
      ? product.variants.find((v) => v.isDefault) || product.variants[0]
      : null;

  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(defaultVariant);

  // Dynamic pricing and inventory calculations
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeDiscountPrice = selectedVariant
    ? selectedVariant.discountPrice
    : product.discountPrice;

  const hasDiscount =
    Boolean(activeDiscountPrice && activeDiscountPrice > 0 && activeDiscountPrice < activePrice);

  const currentPrice = hasDiscount ? activeDiscountPrice! : activePrice;
  const activeStockCount = selectedVariant ? selectedVariant.stockCount : product.stockCount;
  const isAvailable = selectedVariant
    ? selectedVariant.inStock && selectedVariant.stockCount > 0
    : product.inStock && (product.stockCount === undefined || product.stockCount > 0);

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) =>
          img.startsWith('http') ? img : `http://127.0.0.1:7731${img}`,
        )
      : ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop'];

  useEffect(() => {
    if (!isImagePreviewOpen || images.length < 2) return;

    const handlePreviewKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImagePreviewOpen(false);
        return;
      }

      const nextKeys = isPersian ? ['ArrowLeft', 'ArrowDown'] : ['ArrowRight', 'ArrowDown'];
      const previousKeys = isPersian ? ['ArrowRight', 'ArrowUp'] : ['ArrowLeft', 'ArrowUp'];

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        setSelectedImageIndex((index) => (index + 1) % images.length);
      } else if (previousKeys.includes(event.key)) {
        event.preventDefault();
        setSelectedImageIndex((index) => (index - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handlePreviewKeyDown);
    return () => window.removeEventListener('keydown', handlePreviewKeyDown);
  }, [images.length, isImagePreviewOpen, isPersian]);

  const mainCategory =
    product.categories && product.categories.length > 0
      ? product.categories[0]
      : null;

  const cartItems = useAppSelector((state) => state.cart.items);
  const currentCartItem = cartItems.find((item) => {
    if (item.product._id !== product._id) return false;
    if (selectedVariant) {
      return item.selectedVariant?.id === selectedVariant.id;
    }
    return !item.selectedVariant;
  });
  const cartQuantity = currentCartItem ? currentCartItem.quantity : 0;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        product,
        quantity: 1,
        selectedVariant: selectedVariant || undefined,
        selectedAttributes: selectedVariant ? selectedVariant.title : undefined,
      }),
    );
    const variantTitle = selectedVariant ? getLocalizedVariantTitle(selectedVariant.title, isPersian) : '';
    toast.success(
      isPersian
        ? `«${product.title}${variantTitle ? ` (${variantTitle})` : ''}» به سبد خرید اضافه شد.`
        : `"${product.titleEn || product.title}${variantTitle ? ` (${variantTitle})` : ''}" added to your shopping cart.`,
    );
  };

  const handleIncrement = () => {
    if (activeStockCount !== undefined && cartQuantity >= activeStockCount) {
      toast.error(
        isPersian ? 'حداکثر موجودی این محصول در انبار انتخاب شده است.' : 'Maximum stock reached.',
      );
      return;
    }
    dispatch(
      addToCart({
        product,
        quantity: 1,
        selectedVariant: selectedVariant || undefined,
        selectedAttributes: selectedVariant ? selectedVariant.title : undefined,
      }),
    );
  };

  const handleDecrement = () => {
    if (cartQuantity > 1) {
      dispatch(
        updateQuantity({
          productId: product._id,
          variantId: selectedVariant?.id,
          quantity: cartQuantity - 1,
        }),
      );
    } else if (cartQuantity === 1) {
      dispatch(
        removeFromCart({
          productId: product._id,
          variantId: selectedVariant?.id,
        }),
      );
      toast.info(
        isPersian ? 'محصول از سبد خرید حذف شد.' : 'Item removed from your cart.',
      );
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: isPersian ? product.title : product.titleEn || product.title,
            url: window.location.href,
          });
          return;
        } catch {
          // User cancelled or share failed
        }
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        toast.success(isPersian ? 'لینک محصول با موفقیت کپی شد.' : 'Product link copied to clipboard.');
      }
    }
  };

  const formatAttributeDisplay = (attr: { key?: string; name?: string; value: string; unit?: string }) => {
    const rawKey = attr.key || '';
    const name = isPersian ? (attr.name || rawKey) : (attributeKeyTranslations[rawKey] || attr.name || rawKey);
    const val = isPersian ? attr.value : translateAttributeValue(attr.value);
    let unit = attr.unit || '';
    if (!isPersian && unit === 'میل') unit = 'ml';

    const hasUnitAlready =
      val.toLowerCase().includes(unit.toLowerCase()) ||
      (unit === 'میل' && val.includes('میل')) ||
      (unit === 'ml' && val.toLowerCase().includes('ml'));

    const displayVal = hasUnitAlready || !unit ? val : `${val} ${unit}`.trim();
    return { name, value: displayVal };
  };

  // Check active description based on language
  const activeDescription = isPersian
    ? product.description
    : product.descriptionEn || product.description;

  const isDescPersian = Boolean(activeDescription && /[\u0600-\u06FF]/.test(activeDescription));

  return (
    <div className="min-h-screen py-3 sm:py-8 pb-28 sm:pb-12">
      {/* Mobile Top Navigation Bar (Shown on small screens) */}
      <div className="flex sm:hidden items-center justify-between gap-2 mb-3 px-1">
        <Link
          href={mainCategory ? `/products?category=${mainCategory.slug}` : PATHS.PRODUCTS}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-text-muted hover:text-brand-gold transition-colors py-1"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 text-brand-gold" />
          <span>{mainCategory ? (isPersian ? mainCategory.name : mainCategory.nameEn || mainCategory.name) : t.nav.products}</span>
        </Link>

        <button
          onClick={handleShare}
          aria-label={isPersian ? 'اشتراک‌گذاری' : 'Share'}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-surface border border-brand-border/60 text-brand-text-muted hover:text-brand-gold active:scale-90 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Desktop Breadcrumbs (Hidden on mobile) */}
      <nav className="hidden sm:flex flex-wrap items-center gap-2 text-xs text-brand-text-muted mb-6">
        <Link href={PATHS.HOME} className="hover:text-brand-gold transition-colors">
          {t.nav.home}
        </Link>
        <span className="text-brand-border">/</span>
        <Link href={PATHS.PRODUCTS} className="hover:text-brand-gold transition-colors">
          {t.nav.products}
        </Link>
        {mainCategory && (
          <>
            <span className="text-brand-border">/</span>
            <Link
              href={`/products?category=${mainCategory.slug}`}
              className="hover:text-brand-gold transition-colors"
            >
              {isPersian ? mainCategory.name : mainCategory.nameEn || mainCategory.name}
            </Link>
          </>
        )}
        <span className="text-brand-border">/</span>
        <span className="font-bold text-brand-text truncate max-w-xs">
          {isPersian ? product.title : product.titleEn || product.title}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 items-start gap-6 rounded-2xl border border-brand-border/60 bg-brand-surface p-3.5 shadow-xs sm:mb-12 sm:gap-10 sm:rounded-3xl sm:p-7 lg:grid-cols-12 lg:gap-12 lg:p-10 mb-8">
        {/* Left Column: Image Gallery & Thumbnails */}
        <div className="lg:col-span-5 space-y-3 sm:space-y-4 lg:sticky lg:top-24">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/70 sm:aspect-[4/3] sm:rounded-3xl md:h-[450px]">
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(true)}
              aria-label={isPersian ? 'نمایش بزرگ تصویر محصول' : 'Enlarge product image'}
              className="absolute inset-0 z-0 cursor-zoom-in"
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={`${product._id}-${selectedImageIndex}`}
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[selectedImageIndex]}
                    alt={isPersian ? product.title : product.titleEn || product.title}
                    fill
                    priority
                    className="pointer-events-none object-contain p-2.5 sm:object-cover sm:p-0"
                  />
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Fast Delivery Ribbon */}
            <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10">
              <Chip
                size="sm"
                variant="solid"
                startContent={<Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-brand-gold" />}
                className="bg-[#202620]/95 text-[#f7f4ee] text-[10px] sm:text-xs font-bold shadow-md border border-brand-gold/50 h-6 sm:h-7"
              >
                {t.common.fastDelivery}
              </Chip>
            </div>

            {/* VIP Only Badge */}
            {product.isVipOnly && (
              <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10">
                <VipBadge size="sm" text={t.productDetail.vipExclusive} />
              </div>
            )}

            {/* Mobile Image Index Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 sm:hidden px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[#f7f4ee] text-[10px] font-bold z-10">
                {isPersian
                  ? `${toPersianDigits(selectedImageIndex + 1)} / ${toPersianDigits(images.length)}`
                  : `${selectedImageIndex + 1} / ${images.length}`}
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`Thumbnail ${idx + 1}`}
                  className={`relative w-14 h-14 sm:w-18 sm:h-18 p-0 rounded-xl sm:rounded-2xl overflow-hidden bg-brand-surface-elevated shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-brand-gold shadow-md scale-105 ring-2 ring-brand-gold/30'
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-7">
          <div className="order-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-brand-bronze">
                {mainCategory
                  ? isPersian
                    ? mainCategory.name
                    : mainCategory.nameEn || mainCategory.name
                  : isPersian
                  ? 'عطر و ادکلن نیش'
                  : 'Luxury Niche Perfumes'}
              </span>

              {(() => {
                const brandsList =
                  product.brands && product.brands.length > 0
                    ? product.brands
                    : product.brand
                    ? [product.brand]
                    : [];
                if (brandsList.length === 0) return null;
                return (
                  <>
                    <span className="text-brand-border text-xs">•</span>
                    <div className="inline-flex flex-wrap items-center gap-1.5">
                      {brandsList.map((b) => (
                        <Chip
                          key={b._id || b.slug}
                          as={Link}
                          href={`/products?brand=${b.slug}`}
                          size="sm"
                          variant="flat"
                          className="cursor-pointer bg-[#f0eae0] text-[#9f815b] dark:bg-[#242c24] dark:text-[#d4be9b] border border-[#bfa27a]/30 hover:border-[#bfa27a] font-bold text-[10px] sm:text-xs h-5 sm:h-6"
                        >
                          {isPersian ? b.name : b.nameEn || b.name}
                        </Chip>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-text leading-snug">
              {isPersian ? product.title : product.titleEn || product.title}
            </h1>
            {product.titleEn && isPersian && (
              <div className="text-xs sm:text-sm font-semibold text-brand-text-muted mt-0.5 font-latin">
                {product.titleEn}
              </div>
            )}
          </div>

          {/* Ratings & Stock Status */}
          <div className="order-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span className="font-extrabold text-xs sm:text-sm">
                {isPersian ? toPersianDigits(product.rating || 5) : (product.rating || 5)}
              </span>
            </div>
            <span className="text-brand-text-muted text-[11px] sm:text-xs">
              ({isPersian ? toPersianDigits(product.reviewCount || 64) : (product.reviewCount || 64)}{' '}
              {isPersian ? 'دیدگاه' : 'reviews'})
            </span>
            <span className="text-brand-border">•</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${selectedVariant?.id || 'product'}-${isAvailable}`}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                aria-live="polite"
                className={`text-[11px] font-bold sm:text-xs ${
                  isAvailable ? 'text-brand-bronze' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isAvailable
                  ? isPersian
                    ? `${t.productDetail.inStock} (${toPersianDigits(activeStockCount || 10)} عدد)`
                    : `In Stock at Vault (${activeStockCount || 10} units)`
                  : t.common.outOfStock}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Multi-Volume / Variant Selector (Mobile-Optimized Grid) */}
          {product.variants && product.variants.length > 0 && (
            <div className="order-3 space-y-2.5 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/80 p-3.5 sm:rounded-3xl sm:p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-brand-text flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-bronze" />
                  <span className="text-xs">{isPersian ? 'انتخاب حجم و مدل:' : 'Select Volume / Bottle:'}</span>
                </span>
                {selectedVariant && (
                  <span className="text-brand-bronze font-black text-[11px] sm:text-xs truncate max-w-[150px]">
                    {getLocalizedVariantTitle(selectedVariant.title, isPersian)}
                  </span>
                )}
              </div>

              {/* Grid on mobile (<640px) gives 50/50 equal width; flex-wrap on desktop */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 pt-1">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOutOfStock = v.stockCount <= 0 || !v.inStock;
                  const vPrice = v.discountPrice || v.price;
                  const localizedTitle = getLocalizedVariantTitle(v.title, isPersian);

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(v)}
                      aria-pressed={isSelected}
                      className={`relative isolate flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border px-2.5 py-2 text-center transition-[border-color,box-shadow] duration-300 ease-luxury motion-reduce:transition-none sm:min-w-[135px] sm:w-auto sm:rounded-2xl sm:px-4 sm:py-3 ${
                        isSelected
                          ? 'border-brand-gold font-black shadow-md ring-2 ring-brand-gold/40'
                          : isOutOfStock
                          ? 'cursor-not-allowed border-brand-border bg-brand-surface-elevated text-brand-text-muted opacity-40 line-through'
                          : 'border-brand-border bg-brand-surface text-brand-text hover:border-brand-gold/80 hover:shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId={`selected-variant-${product._id}`}
                          aria-hidden="true"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 520, damping: 42 }
                          }
                          className="absolute inset-0 z-0 rounded-[inherit] bg-brand-gold"
                        />
                      )}
                      <span
                        className={`relative z-10 leading-tight text-[11px] transition-colors duration-200 sm:text-xs ${
                          isSelected
                            ? 'text-[#141914] font-black'
                            : 'text-brand-text font-bold'
                        }`}
                      >
                        {localizedTitle}
                      </span>
                      <span
                        className={`relative z-10 mt-0.5 whitespace-nowrap text-[11px] font-extrabold transition-colors duration-200 sm:text-xs ${
                          isSelected
                            ? 'text-[#141914]'
                            : 'text-brand-bronze dark:text-brand-gold'
                        }`}
                      >
                        {formatToman(vPrice, isPersian)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Box */}
          <div className="order-4 overflow-hidden rounded-2xl border border-brand-border/60 bg-brand-surface-elevated p-3.5 sm:rounded-3xl sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedVariant?.id || 'base-price'}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[3.5rem] items-center justify-between gap-2"
              >
                <div>
                  <span className="mb-0.5 block text-[11px] text-brand-text-muted sm:mb-1 sm:text-xs">
                    {isPersian ? 'قیمت برای مصرف‌کننده:' : 'Retail Price:'}
                  </span>
                  {hasDiscount ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs text-brand-text-muted line-through sm:text-sm">
                        {formatToman(activePrice, isPersian)}
                      </span>
                      <span className="text-xl font-black text-brand-text sm:text-3xl">
                        {formatToman(activeDiscountPrice, isPersian)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-black text-brand-text sm:text-3xl">
                      {formatToman(activePrice, isPersian)}
                    </span>
                  )}
                </div>

                {hasDiscount && (
                  <span className="shrink-0 rounded-full bg-brand-bronze px-2.5 py-1 text-[11px] font-black text-[#f7f4ee] shadow-xs sm:px-3 sm:text-xs">
                    {isPersian
                      ? `${toPersianDigits(
                          Math.round(((activePrice - (activeDiscountPrice || 0)) / activePrice) * 100),
                        )}٪ تخفیف`
                      : `${Math.round(
                          ((activePrice - (activeDiscountPrice || 0)) / activePrice) * 100,
                        )}% OFF`}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dynamic Attributes Table (Specifications Grid) */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="order-6 space-y-2">
              <h4 className="font-bold text-xs text-brand-text">
                {t.productDetail.specifications}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {product.attributes.map((attr, idx) => {
                  const formatted = formatAttributeDisplay(attr);
                  const hasMultipleValues =
                    (attr.values && attr.values.length > 1) ||
                    (attr.value && attr.value.includes('،'));
                  const valList =
                    attr.values && attr.values.length > 0
                      ? attr.values
                      : attr.value
                      ? attr.value.split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
                      : [];

                  return (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-brand-surface-elevated border border-brand-border/60 text-xs flex flex-col justify-between transition-colors hover:border-brand-gold/50"
                    >
                      <div className="text-[10px] sm:text-[11px] text-brand-text-muted mb-1 font-medium truncate">
                        {formatted.name}
                      </div>
                      {hasMultipleValues && valList.length > 1 ? (
                        <div className="flex flex-wrap gap-1">
                          {valList.map((item, vIdx) => (
                            <span
                              key={vIdx}
                              className="px-1.5 py-0.5 rounded-md bg-brand-surface text-brand-text border border-brand-border text-[10px] sm:text-[11px] font-bold"
                            >
                              {isPersian ? item : translateAttributeValue(item)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="font-bold text-brand-text text-[11px] sm:text-xs leading-snug line-clamp-2">
                          {formatted.value}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline Action Buttons (Zero Layout Shift with Fluid Motion) */}
          <div className="order-5 border-t border-brand-border/60 pt-2 sm:pt-4">
            <div className="relative w-full h-12 sm:h-14">
              <AnimatePresence mode="wait" initial={false}>
                {cartQuantity > 0 ? (
                  <motion.div
                    key="stepper-active-bar"
                    initial={{ opacity: 0, y: 5, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.985 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex items-center justify-between gap-3 px-3 sm:px-5 rounded-xl sm:rounded-full bg-brand-surface-elevated border border-brand-border/80 shadow-xs"
                  >
                    {/* Stepper Controller */}
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-brand-surface border border-brand-border/60 rounded-full p-0.5 sm:p-1 shadow-2xs">
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="light"
                        onPress={handleIncrement}
                        isDisabled={activeStockCount !== undefined && cartQuantity >= activeStockCount}
                        className="w-7 h-7 sm:w-8 sm:h-8 min-w-7 sm:min-w-8 rounded-full text-brand-bronze dark:text-brand-gold hover:bg-brand-gold/15 active:scale-90 transition-transform"
                        aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </Button>

                      <motion.span
                        key={cartQuantity}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="min-w-[28px] sm:min-w-[32px] text-center font-black text-sm sm:text-base text-brand-text select-none"
                      >
                        {isPersian ? toPersianDigits(cartQuantity) : cartQuantity}
                      </motion.span>

                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="light"
                        onPress={handleDecrement}
                        className="w-7 h-7 sm:w-8 sm:h-8 min-w-7 sm:min-w-8 rounded-full text-brand-text-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-transform"
                        aria-label={
                          cartQuantity === 1
                            ? (isPersian ? 'حذف از سبد خرید' : 'Remove from cart')
                            : (isPersian ? 'کاهش تعداد' : 'Decrease quantity')
                        }
                      >
                        {cartQuantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </Button>
                    </div>

                    {/* Center Reassurance Pill on Desktop */}
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-brand-bronze dark:text-brand-gold">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{isPersian ? 'در سبد خرید شما ثبت شد' : 'Added to your cart'}</span>
                    </div>

                    {/* View Cart & Checkout Button */}
                    <Link
                      href={PATHS.CART}
                      className="inline-flex items-center justify-center gap-1.5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs px-3.5 sm:px-5 h-8 sm:h-9 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>{t.cart.viewCart || (isPersian ? 'مشاهده سبد خرید' : 'View Cart')}</span>
                      <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add-to-cart-wrapper"
                    initial={{ opacity: 0, y: 5, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.985 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                  >
                    <Button
                      size="lg"
                      radius="full"
                      color="warning"
                      onPress={handleAddToCart}
                      isDisabled={!isAvailable}
                      startContent={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />}
                      className="w-full h-full font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md hover:shadow-lg shadow-brand-gold/25 text-xs sm:text-sm cursor-pointer rounded-xl sm:rounded-full transition-all duration-300 hover:scale-[1.005] active:scale-[0.98]"
                    >
                      {t.productDetail.addToCart}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="order-7 grid grid-cols-2 gap-2 pt-1 text-[11px] text-brand-text-muted sm:gap-3 sm:text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-brand-surface-elevated/50 sm:bg-transparent sm:p-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-bronze shrink-0" />
              <span className="truncate">{t.common.authenticityGuarantee}</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-brand-surface-elevated/50 sm:bg-transparent sm:p-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-bronze shrink-0" />
              <span className="truncate">{t.common.returnGuarantee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Tab */}
      {activeDescription && (
        <div className="bg-brand-surface p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-brand-border/60 mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-xl font-black text-brand-text">
            {isPersian ? 'توضیحات و هرم بویایی عطر' : 'Fragrance Profile & Review'}
          </h3>
          <div
            dir={isDescPersian ? 'rtl' : 'ltr'}
            className={`text-xs sm:text-sm text-brand-text-muted leading-relaxed space-y-2 ${
              isDescPersian ? 'text-right' : 'text-left'
            } [&_p]:mb-2 [&_h3]:text-xs sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:text-brand-text [&_h3]:mt-3 sm:[&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:mr-4 rtl:[&_ul]:mr-4 ltr:[&_ul]:ml-4 [&_ul]:space-y-1 [&_li]:text-xs sm:[&_li]:text-sm [&_strong]:text-brand-text`}
            dangerouslySetInnerHTML={{ __html: activeDescription }}
          />
        </div>
      )}

      {/* Related Products Grid (2 columns on mobile, 4 on desktop) */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-brand-text">
            {t.productDetail.relatedProducts}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isImagePreviewOpen}
        onOpenChange={setIsImagePreviewOpen}
        size="5xl"
        backdrop="blur"
        hideCloseButton
        classNames={{
          backdrop: 'bg-black/80 backdrop-blur-md',
          wrapper: 'p-3 sm:p-6',
          base: 'bg-transparent shadow-none max-w-[96vw] my-0 overflow-visible',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="relative">
              <Button
                isIconOnly
                type="button"
                onPress={onClose}
                aria-label={isPersian ? 'بستن تصویر' : 'Close image preview'}
                className="absolute -top-3 -right-3 z-10 min-w-10 w-10 h-10 rounded-full bg-brand-surface text-brand-text border border-brand-border shadow-lg"
              >
                <X className="w-5 h-5" />
              </Button>
              <ModalBody className="p-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                <div
                  dir={isPersian ? 'rtl' : 'ltr'}
                  className="flex h-[min(82vh,900px)] w-[min(92vw,1200px)] flex-col gap-3 sm:flex-row"
                >
                  <div className="relative order-1 min-h-0 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={isPersian ? 'بستن پیش‌نمایش تصویر' : 'Close image preview'}
                      className="absolute inset-0 cursor-zoom-out"
                    >
                      <Image
                        src={images[selectedImageIndex]}
                        alt={isPersian ? product.title : product.titleEn || product.title}
                        fill
                        sizes="(max-width: 640px) 92vw, 80vw"
                        className="pointer-events-none object-contain"
                      />
                    </button>
                  </div>
                  {images.length > 1 && (
                    <div
                      role="group"
                      aria-label={isPersian ? 'تصاویر دیگر محصول' : 'Other product images'}
                      className="order-2 flex shrink-0 gap-2 overflow-x-auto pb-1 sm:w-16 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0"
                    >
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          aria-label={
                            isPersian
                              ? `نمایش تصویر ${toPersianDigits(index + 1)}`
                              : `Show image ${index + 1}`
                          }
                          aria-pressed={selectedImageIndex === index}
                          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-14 sm:w-14 ${
                            selectedImageIndex === index
                              ? 'border-brand-gold'
                              : 'border-brand-border/60 hover:border-brand-gold/70'
                          }`}
                        >
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Mobile Sticky Bottom Action Bar (Floating Purchase Island) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface/95 backdrop-blur-lg border-t border-brand-border/80 px-4 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Price & Selected Variant Summary */}
          <div className="flex flex-col min-w-0">
            {selectedVariant && (
              <span className="text-[10px] text-brand-text-muted font-bold truncate max-w-[140px]">
                {getLocalizedVariantTitle(selectedVariant.title, isPersian)}
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-brand-text">
                {formatToman(currentPrice, isPersian)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-brand-text-muted line-through">
                  {formatToman(activePrice, isPersian)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action / Stepper Button */}
          <div className="flex items-center shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              {cartQuantity > 0 ? (
                <motion.div
                  key="mobile-stepper"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-1.5 bg-brand-surface-elevated border border-brand-border/80 rounded-full p-1 shadow-2xs"
                >
                  <Button
                    isIconOnly
                    size="sm"
                    radius="full"
                    variant="light"
                    onPress={handleIncrement}
                    isDisabled={activeStockCount !== undefined && cartQuantity >= activeStockCount}
                    className="w-7 h-7 min-w-7 rounded-full text-brand-bronze dark:text-brand-gold active:scale-90"
                    aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Button>
                  <motion.span
                    key={cartQuantity}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.12 }}
                    className="min-w-[20px] text-center font-black text-xs text-brand-text select-none"
                  >
                    {isPersian ? toPersianDigits(cartQuantity) : cartQuantity}
                  </motion.span>
                  <Button
                    isIconOnly
                    size="sm"
                    radius="full"
                    variant="light"
                    onPress={handleDecrement}
                    className="w-7 h-7 min-w-7 rounded-full text-brand-text-muted hover:text-brand-text active:scale-90"
                    aria-label={isPersian ? 'کاهش تعداد' : 'Decrease quantity'}
                  >
                    {cartQuantity === 1 ? (
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    )}
                  </Button>
                  <Link
                    href={PATHS.CART}
                    className="inline-flex items-center justify-center bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-[11px] px-3 h-7 min-w-0 rounded-full shadow-2xs active:scale-95 transition-transform"
                  >
                    {t.cart.viewCart || (isPersian ? 'سبد' : 'Cart')}
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="mobile-add-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <Button
                    size="md"
                    radius="full"
                    onPress={handleAddToCart}
                    isDisabled={!isAvailable}
                    startContent={<ShoppingBag className="w-4 h-4" />}
                    className="h-10 px-4 font-black bg-brand-gold text-[#141914] shadow-md shadow-brand-gold/20 text-xs rounded-full cursor-pointer active:scale-95 transition-transform"
                  >
                    {t.productDetail.addToCart}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
