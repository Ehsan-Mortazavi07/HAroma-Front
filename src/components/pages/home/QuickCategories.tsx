'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import { Sparkles, Heart, Activity, Droplets, ShieldCheck, Gift, Crown, ArrowLeft, ArrowRight } from 'lucide-react';
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
        return <Sparkles className="w-6 h-6 text-[#bfa27a]" />;
      case 'women-perfumes':
        return <Heart className="w-6 h-6 text-[#d4be9b]" />;
      case 'unisex-perfumes':
        return <Activity className="w-6 h-6 text-[#a69c8e]" />;
      case 'body-splash':
        return <Droplets className="w-6 h-6 text-[#bfa27a]" />;
      case 'skin-care':
        return <ShieldCheck className="w-6 h-6 text-[#d4be9b]" />;
      case 'gift-sets':
        return <Gift className="w-6 h-6 text-[#bfa27a]" />;
      case 'vip-niche':
        return <Crown className="w-6 h-6 text-[#d4be9b]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#bfa27a]" />;
    }
  };

  return (
    <section className="mb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {categories.map((cat) => (
          <motion.div
            key={cat._id}
            whileHover={{ y: -5, scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <Card
              as={Link}
              href={`/products?category=${cat.slug}`}
              isPressable
              className="w-full h-full bg-brand-surface border border-brand-border hover:border-brand-gold/80 shadow-xs hover:shadow-lg transition-colors text-center rounded-2xl"
            >
              <CardBody className="flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-center mb-2.5 shadow-xs">
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
        ))}

        {/* See All Pill Button */}
        <motion.div
          whileHover={{ y: -5, scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <Card
            as={Link}
            href={PATHS.PRODUCTS}
            isPressable
            className="w-full h-full bg-brand-surface-elevated border border-brand-gold/40 hover:border-brand-gold shadow-xs hover:shadow-lg transition-colors text-center rounded-2xl"
          >
            <CardBody className="flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold text-[#141914] flex items-center justify-center mb-2.5 shadow-sm border border-brand-bronze-light/30">
                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </div>
              <span className="font-black text-xs sm:text-sm text-[#141914] dark:text-brand-gold">
                {t.common.seeMore}
              </span>
              <span className="text-[10px] text-brand-text-muted mt-0.5">
                {t.nav.products}
              </span>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
