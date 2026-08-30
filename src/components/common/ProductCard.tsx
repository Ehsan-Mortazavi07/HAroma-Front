'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Zap } from 'lucide-react';
import { IProduct } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits } from '@/common/utils';
import { QuantityCounter } from './QuantityCounter';
import { VipBadge } from './VipBadge';
import { useTranslation } from '@/common/i18n';

interface ProductCardProps {
  product: IProduct;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';

export function ProductCard({ product }: ProductCardProps) {
  const { t, isPersian } = useTranslation();
  const [imgSrc, setImgSrc] = useState<string>(
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0].startsWith('http')
        ? product.images[0]
        : `http://127.0.0.1:7731${product.images[0]}`
      : fallbackImage,
  );

  const categoryName =
    product.categories && product.categories.length > 0
      ? isPersian
        ? product.categories[0].name
        : product.categories[0].nameEn || product.categories[0].name
      : isPersian
      ? 'عطر و ادکلن'
      : 'Perfumes';

  const volumeAttr = product.attributes?.find((a) => a.key === 'volume')?.value;

  const formatVolume = (val?: string) => {
    if (!val) return null;
    if (isPersian) {
      return val.includes('میل') ? val : `${val} میل`;
    } else {
      const numOnly = val.replace(/[^0-9۰-۹]/g, '');
      const enDigits = numOnly.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      return enDigits ? `${enDigits} ml` : val;
    }
  };

  const hasDiscount =
    product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col justify-between bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-4 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-sm hover:shadow-xl hover:border-[#bfa27a] transition-all duration-300">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-start">
        {product.isVipOnly && <VipBadge size="sm" text={t.common.vipOnly} />}
        {hasDiscount && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#9f815b] text-[#f7f4ee] shadow-sm border border-[#bfa27a]/40">
            {isPersian
              ? `${toPersianDigits(discountPercent)}٪ تخفیف`
              : `${discountPercent}% OFF`}
          </span>
        )}
      </div>

      {/* Top Media */}
      <Link
        href={PATHS.PRODUCT(product.slug)}
        className="block relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] mb-3"
      >
        <Image
          src={imgSrc}
          alt={isPersian ? product.title : product.titleEn || product.title}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgSrc(fallbackImage)}
        />
        {/* Soft Gold Shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#202620]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category & Volume */}
          <div className="flex items-center justify-between text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e] mb-1">
            <span>{categoryName}</span>
            {volumeAttr && <span className="font-mono">{formatVolume(volumeAttr)}</span>}
          </div>

          {/* Product Title */}
          <Link
            href={PATHS.PRODUCT(product.slug)}
            className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee] hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors line-clamp-2 leading-snug"
          >
            {isPersian ? product.title : product.titleEn || product.title}
          </Link>
        </div>

        {/* Rating & In-Stock Status */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-extrabold text-[11px] text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? toPersianDigits(product.rating || 4.8) : (product.rating || 4.8)}
            </span>
          </div>

          <div className="text-[11px] font-bold text-[#9f815b] dark:text-[#d4be9b]">
            {product.inStock ? t.common.inStock : t.common.outOfStock}
          </div>
        </div>

        {/* Pricing & Cart Action */}
        <div className="pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e] line-through">
                {formatToman(product.price, isPersian)}
              </span>
            )}
            <span className="font-black text-sm text-[#1d241d] dark:text-[#d4be9b]">
              {hasDiscount
                ? formatToman(product.discountPrice, isPersian)
                : formatToman(product.price, isPersian)}
            </span>
          </div>

          {/* Add to Cart / Counter */}
          <QuantityCounter product={product} />
        </div>
      </div>
    </div>
  );
}
