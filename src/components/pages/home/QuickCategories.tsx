'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import {
  Sparkles,
  Heart,
  Activity,
  Droplets,
  ShieldCheck,
  Gift,
  Crown,
  ArrowLeft,
  ArrowRight,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ICategory } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';
import { PATHS } from '@/common/constants/PATHS';

interface QuickCategoriesProps {
  categories: ICategory[];
}

export function QuickCategories({ categories }: QuickCategoriesProps) {
  const { t, isPersian, isRTL } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'next' | 'prev') => {
    if (!scrollRef.current) return;
    const distance = 280;
    const factor = isRTL ? (direction === 'next' ? -1 : 1) : (direction === 'next' ? 1 : -1);
    scrollRef.current.scrollBy({ left: factor * distance, behavior: 'smooth' });
  };

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'men-perfumes':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
      case 'women-perfumes':
        return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4be9b]" />;
      case 'unisex-perfumes':
        return <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#a69c8e]" />;
      case 'body-splash':
        return <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
      case 'skin-care':
        return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4be9b]" />;
      case 'gift-sets':
        return <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
      case 'vip-niche':
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4be9b]" />;
      default:
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
    }
  };

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-surface-elevated text-brand-gold flex items-center justify-center border border-brand-gold/30 shadow-xs">
            <Layers className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-text">
              {t.home.quickCategories}
            </h2>
            <p className="text-xs text-brand-text-muted">
              {t.home.quickCategoriesSub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scroll Navigation Controls for Desktop */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('prev')}
              className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border hover:border-brand-gold/60 text-brand-text flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
              aria-label="قبلی"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('next')}
              className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border hover:border-brand-gold/60 text-brand-text flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
              aria-label="بعدی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            href={PATHS.PRODUCTS}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-bronze dark:text-brand-gold hover:text-brand-bronze-dark dark:hover:text-brand-text transition-colors"
          >
            <span>{t.common.seeMore}</span>
            {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </Link>
        </div>
      </div>

      {/* Horizontal Scrollable Categories Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-0.5 scroll-smooth"
      >
        {categories.map((cat) => (
          <div key={cat._id} className="shrink-0 w-28 sm:w-32 lg:w-36 snap-start">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="h-full"
            >
              <Card
                as={Link}
                href={`/products?category=${cat.slug}`}
                isPressable
                className="w-full h-full bg-brand-surface border border-brand-border/70 hover:border-brand-gold/80 shadow-2xs hover:shadow-md transition-all text-center rounded-2xl"
              >
                <CardBody className="flex flex-col items-center justify-center p-3 sm:p-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-center mb-2 shadow-2xs">
                    {getIcon(cat.slug)}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-brand-text truncate max-w-full">
                    {isPersian ? cat.name : cat.nameEn || cat.name}
                  </span>
                  <span className="text-[10px] text-brand-text-muted mt-0.5 truncate max-w-full">
                    {t.common.viewDetails}
                  </span>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        ))}

        {/* See All Pill Card */}
        <div className="shrink-0 w-28 sm:w-32 lg:w-36 snap-start">
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="h-full"
          >
            <Card
              as={Link}
              href={PATHS.PRODUCTS}
              isPressable
              className="w-full h-full bg-brand-surface-elevated border border-brand-gold/40 hover:border-brand-gold shadow-2xs hover:shadow-md transition-all text-center rounded-2xl"
            >
              <CardBody className="flex flex-col items-center justify-center p-3 sm:p-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-gold text-[#141914] flex items-center justify-center mb-2 shadow-sm border border-brand-bronze-light/30">
                  {isRTL ? <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <span className="font-black text-xs sm:text-sm text-[#141914] dark:text-brand-gold truncate max-w-full">
                  {t.common.seeMore}
                </span>
                <span className="text-[10px] text-brand-text-muted mt-0.5 truncate max-w-full">
                  {t.nav.products}
                </span>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
