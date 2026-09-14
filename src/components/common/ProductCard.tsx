'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Zap } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
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

  const brandObj =
    product.brands && product.brands.length > 0
      ? product.brands[0]
      : product.brand;
  const brandName = brandObj
    ? isPersian
      ? brandObj.name
      : brandObj.nameEn || brandObj.name
    : null;

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
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="h-full"
    >
      <Card className="h-full group relative flex flex-col justify-between bg-brand-surface rounded-3xl p-4 border border-brand-border shadow-sm hover:shadow-xl hover:border-brand-gold transition-colors duration-300">
        {/* Badges */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-start">
          {product.isVipOnly && <VipBadge size="sm" text={t.common.vipOnly} />}
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-brand-bronze text-[#f7f4ee] shadow-sm border border-brand-gold/40">
              {isPersian
                ? `${toPersianDigits(discountPercent)}٪ تخفیف`
                : `${discountPercent}% OFF`}
            </span>
          )}
        </div>

        {/* Top Media */}
        <Link
          href={PATHS.PRODUCT(product.slug)}
          className="block relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-brand-surface-elevated mb-3"
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
          <div className="absolute inset-0 bg-gradient-to-t from-brand-olive/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div>
            {/* Brand/Category & Volume */}
            <div className="flex items-center justify-between text-[11px] font-bold text-brand-text-muted mb-1">
              <span className="truncate">
                {brandName ? (
                  <span className="text-brand-bronze dark:text-brand-gold font-extrabold">{brandName}</span>
                ) : (
                  categoryName
                )}
              </span>
              {volumeAttr && <span className="font-mono shrink-0 ml-1">{formatVolume(volumeAttr)}</span>}
            </div>

            {/* Product Title */}
            <Link
              href={PATHS.PRODUCT(product.slug)}
              className="font-bold text-sm text-brand-text hover:text-brand-bronze dark:hover:text-brand-gold transition-colors line-clamp-2 leading-snug"
            >
              {isPersian ? product.title : product.titleEn || product.title}
            </Link>
          </div>

          {/* Rating & In-Stock Status */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-extrabold text-[11px] text-brand-text">
                {isPersian ? toPersianDigits(product.rating || 4.8) : (product.rating || 4.8)}
              </span>
            </div>

            <div className="text-[11px] font-bold text-brand-bronze dark:text-brand-gold">
              {product.inStock ? t.common.inStock : t.common.outOfStock}
            </div>
          </div>

          {/* Pricing & Cart Action */}
          <div className="pt-2 border-t border-brand-border flex items-center justify-between gap-2">
            {/* Price */}
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-[11px] text-brand-text-muted line-through">
                  {formatToman(product.price, isPersian)}
                </span>
              )}
              <span className="font-black text-sm text-brand-text dark:text-brand-gold">
                {hasDiscount
                  ? formatToman(product.discountPrice, isPersian)
                  : formatToman(product.price, isPersian)}
              </span>
            </div>

            {/* Add to Cart / Counter */}
            <QuantityCounter product={product} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
