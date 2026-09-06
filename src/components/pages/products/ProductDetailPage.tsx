'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Zap,
  ShieldCheck,
  Crown,
  Clock,
  CheckCircle2,
  Share2,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { IProduct, IProductVariant } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { addToCart } from '@/stores/cart/cartSlice';
import { toggleCartDrawer } from '@/stores/ui/uiSlice';
import { VipBadge } from '@/components/common/VipBadge';
import { ProductCard } from '@/components/common/ProductCard';
import { useTranslation } from '@/common/i18n';

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
  const user = useAppSelector((state) => state.auth.user);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const mainCategory =
    product.categories && product.categories.length > 0
      ? product.categories[0]
      : null;

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

  const handleBuyNow = () => {
    dispatch(
      addToCart({
        product,
        quantity: 1,
        selectedVariant: selectedVariant || undefined,
        selectedAttributes: selectedVariant ? selectedVariant.title : undefined,
      }),
    );
    dispatch(toggleCartDrawer(true));
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
    <div className="min-h-screen py-6 sm:py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#73695c] dark:text-[#a69c8e] mb-8 overflow-x-auto">
        <Link href={PATHS.HOME} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b]">
          {t.nav.home}
        </Link>
        <span>/</span>
        <Link href={PATHS.PRODUCTS} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b]">
          {t.nav.products}
        </Link>
        {mainCategory && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${mainCategory.slug}`}
              className="hover:text-[#9f815b] dark:hover:text-[#d4be9b]"
            >
              {isPersian ? mainCategory.name : mainCategory.nameEn || mainCategory.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-bold text-[#1d241d] dark:text-[#f7f4ee] truncate max-w-xs">
          {isPersian ? product.title : product.titleEn || product.title}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-10 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs mb-12 items-start">
        {/* Left Column: Image Gallery & Thumbnails */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="relative w-full h-80 sm:h-96 md:h-[450px] rounded-3xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e]">
            <Image
              src={images[selectedImageIndex]}
              alt={product.title}
              fill
              priority
              className="object-cover object-center"
            />
            {/* Free Delivery Ribbon */}
            <div className="absolute top-4 right-4 z-10 px-3.5 py-1.5 rounded-xl bg-[#202620] text-[#d4be9b] text-xs font-bold shadow-md flex items-center gap-1.5 border border-[#bfa27a]/30">
              <Zap className="w-3.5 h-3.5 fill-current text-[#bfa27a]" />
              <span>{t.common.fastDelivery}</span>
            </div>

            {product.isVipOnly && (
              <div className="absolute top-4 left-4 z-10">
                <VipBadge size="md" text={t.productDetail.vipExclusive} />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-18 h-18 rounded-2xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#bfa27a] shadow-md scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] mb-1">
              {mainCategory
                ? isPersian
                  ? mainCategory.name
                  : mainCategory.nameEn || mainCategory.name
                : isPersian
                ? 'عطر و ادکلن نیش'
                : 'Luxury Niche Perfumes'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1d241d] dark:text-[#f7f4ee] leading-snug">
              {isPersian ? product.title : product.titleEn || product.title}
            </h1>
            {product.titleEn && isPersian && (
              <div className="text-sm font-semibold text-[#73695c] dark:text-[#a69c8e] mt-1 font-sans">
                {product.titleEn}
              </div>
            )}
          </div>

          {/* Ratings & Reviews */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-extrabold text-sm">
                {isPersian ? toPersianDigits(product.rating || 5) : (product.rating || 5)}
              </span>
            </div>
            <span className="text-[#73695c] dark:text-[#a69c8e]">
              ({isPersian ? toPersianDigits(product.reviewCount || 64) : (product.reviewCount || 64)}{' '}
              {isPersian ? 'دیدگاه ثبت شده' : 'reviews'})
            </span>
            <span className="text-[#e6dcce] dark:text-[#2e3a2e]">|</span>
            <span
              className={`font-bold ${
                isAvailable
                  ? 'text-[#9f815b] dark:text-[#d4be9b]'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isAvailable
                ? isPersian
                  ? `${t.productDetail.inStock} (${toPersianDigits(activeStockCount || 10)} عدد)`
                  : `In Stock at Hatef Aroma Vault (${activeStockCount || 10} units)`
                : t.common.outOfStock}
            </span>
          </div>

          {/* Multi-Volume / Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#f8f5f0]/80 dark:bg-[#242c24]/80 border border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#1d241d] dark:text-[#f7f4ee] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#9f815b]" />
                  <span>{isPersian ? 'انتخاب حجم / تنوع محصول:' : 'Select Volume / Bottle Size:'}</span>
                </span>
                {selectedVariant && (
                  <span className="text-[#9f815b] dark:text-[#d4be9b] font-black text-xs">
                    {getLocalizedVariantTitle(selectedVariant.title, isPersian)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
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
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 border min-w-[100px] ${
                        isSelected
                          ? 'bg-[#bfa27a] text-[#141914] border-[#d4be9b] shadow-md scale-105 font-black'
                          : isOutOfStock
                          ? 'opacity-40 line-through bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border-[#e6dcce] dark:border-[#2e3a2e] cursor-not-allowed'
                          : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                      }`}
                    >
                      <span className={isSelected ? 'text-[#141914]' : ''}>{localizedTitle}</span>
                      <span
                        className={`text-[11px] font-mono ${
                          isSelected
                            ? 'text-[#141914] font-black'
                            : 'text-[#9f815b] dark:text-[#d4be9b]'
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
          <div className="p-5 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-baseline justify-between">
            <div>
              <span className="text-xs text-[#73695c] dark:text-[#a69c8e] block mb-1">
                {isPersian ? 'قیمت برای مصرف‌کننده:' : 'Retail Price:'}
              </span>
              {hasDiscount ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#73695c] dark:text-[#a69c8e] line-through">
                    {formatToman(activePrice, isPersian)}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#1d241d] dark:text-[#d4be9b]">
                    {formatToman(activeDiscountPrice, isPersian)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-[#1d241d] dark:text-[#d4be9b]">
                  {formatToman(activePrice, isPersian)}
                </span>
              )}
            </div>

            {hasDiscount && (
              <span className="px-3 py-1 rounded-full bg-[#9f815b] text-[#f7f4ee] text-xs font-black">
                {isPersian
                  ? `${toPersianDigits(
                      Math.round(((activePrice - (activeDiscountPrice || 0)) / activePrice) * 100),
                    )}٪ تخفیف`
                  : `${Math.round(
                      ((activePrice - (activeDiscountPrice || 0)) / activePrice) * 100,
                    )}% OFF`}
              </span>
            )}
          </div>

          {/* Dynamic Attributes Table */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#1d241d] dark:text-[#f7f4ee]">
                {t.productDetail.specifications}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.attributes.map((attr, idx) => {
                  const formatted = formatAttributeDisplay(attr);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs"
                    >
                      <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] mb-0.5 font-medium">
                        {formatted.name}
                      </div>
                      <div className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                        {formatted.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="flex-1 py-4 rounded-2xl font-black bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] shadow-lg shadow-[#9f815b]/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-[#d4be9b]/30"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t.productDetail.addToCart}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!isAvailable}
              className="px-6 py-4 rounded-2xl font-bold bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] border border-[#bfa27a]/40 text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPersian ? 'خرید فوری' : 'Buy Now'}
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#73695c] dark:text-[#a69c8e]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#9f815b]" />
              <span>{t.common.authenticityGuarantee}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#9f815b]" />
              <span>{t.common.returnGuarantee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Tab */}
      {activeDescription && (
        <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-10 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] mb-12 space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'توضیحات و هرم بویایی عطر' : 'Fragrance Profile & Review'}
          </h3>
          <div
            dir={isDescPersian ? 'rtl' : 'ltr'}
            className={`text-sm text-[#73695c] dark:text-[#a69c8e] leading-relaxed space-y-2 ${
              isDescPersian ? 'text-right' : 'text-left'
            } [&_p]:mb-2 [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:text-[#1d241d] dark:[&_h3]:text-[#f7f4ee] [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:mr-5 rtl:[&_ul]:mr-5 ltr:[&_ul]:ml-5 [&_ul]:space-y-1.5 [&_li]:text-xs sm:[&_li]:text-sm [&_strong]:text-[#1d241d] dark:[&_strong]:text-[#f7f4ee]`}
            dangerouslySetInnerHTML={{ __html: activeDescription }}
          />
        </div>
      )}

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {t.productDetail.relatedProducts}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
