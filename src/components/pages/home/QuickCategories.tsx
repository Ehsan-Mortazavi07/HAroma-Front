'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import { Sparkles, Heart, Activity, Droplets, ShieldCheck, Gift, Crown, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { ICategory } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';
import { PATHS } from '@/common/constants/PATHS';

interface QuickCategoriesProps {
  categories: ICategory[];
}

export function QuickCategories({ categories }: QuickCategoriesProps) {
  const { t, isPersian, isRTL } = useTranslation();

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
      <div className="flex items-center justify-between mb-5">
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

        <Link
          href={PATHS.PRODUCTS}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-bronze dark:text-brand-gold hover:text-brand-bronze-dark dark:hover:text-brand-text transition-colors"
        >
          <span>{t.common.seeMore}</span>
          {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
        {categories.map((cat) => (
          <motion.div
            key={cat._id}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
                <span className="text-[10px] text-brand-text-muted mt-0.5 truncate max-w-full hidden sm:block">
                  {t.common.viewDetails}
                </span>
              </CardBody>
            </Card>
          </motion.div>
        ))}

        {/* See All Pill Card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
              <span className="font-black text-xs sm:text-sm text-[#141914] dark:text-brand-gold">
                {t.common.seeMore}
              </span>
              <span className="text-[10px] text-brand-text-muted mt-0.5 hidden sm:block">
                {t.nav.products}
              </span>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
