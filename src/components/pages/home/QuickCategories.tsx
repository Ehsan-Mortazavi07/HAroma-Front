'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardBody, Button } from '@heroui/react';
import { MEDIA_BASE_URL } from '@/common/constants/URL';
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
  Flame,
  Compass,
  Wind,
} from 'lucide-react';
import { ICategory, IPageSection } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';
import { PATHS } from '@/common/constants/PATHS';
import { useDraggableScroll } from '@/common/hooks/useDraggableScroll';

interface QuickCategoriesProps {
  categories: ICategory[];
  section?: IPageSection;
}

export function QuickCategories({ categories, section }: QuickCategoriesProps) {
  const { t, isPersian, isRTL } = useTranslation();

  const {
    scrollRef,
    canScrollPrev,
    canScrollNext,
    handleScroll,
    dragHandlers,
  } = useDraggableScroll({ isRTL, friction: 0.88 });

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
      case 'decants-samples':
        return <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
      case 'travel-sprays':
        return <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
      case 'oriental-oud':
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />;
      case 'candles-diffusers':
        return <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4be9b]" />;
      case 'hair-mist':
        return <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-[#a69c8e]" />;
      default:
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#bfa27a]" />;
    }
  };
  const title = isPersian ? section?.title || t.home.quickCategories : section?.titleEn || t.home.quickCategories;
  const subtitle = isPersian ? section?.subtitle || t.home.quickCategoriesSub : section?.subtitleEn || t.home.quickCategoriesSub;

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
              {title}
            </h2>
            <p className="text-xs text-brand-text-muted">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scroll Navigation Controls with HeroUI Buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              size="sm"
              aria-label={isPersian ? 'قبلی' : 'Previous'}
              isDisabled={!canScrollPrev}
              onPress={() => handleScroll('prev', 280)}
              className="w-8 h-8 min-w-8 bg-brand-surface border border-brand-border/80 hover:border-brand-gold hover:bg-brand-surface-elevated text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              size="sm"
              aria-label={isPersian ? 'بعدی' : 'Next'}
              isDisabled={!canScrollNext}
              onPress={() => handleScroll('next', 280)}
              className="w-8 h-8 min-w-8 bg-brand-surface border border-brand-border/80 hover:border-brand-gold hover:bg-brand-surface-elevated text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
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

      {/* Horizontal Draggable & Scrollable Categories Track */}
      <div
        ref={scrollRef}
        {...dragHandlers}
        style={{ touchAction: 'pan-y' }}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory py-2 px-0.5 select-none cursor-grab active:cursor-grabbing"
      >
        {categories.map((cat) => (
          <div key={cat._id} className="shrink-0 w-28 sm:w-32 lg:w-36 snap-start">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="h-full"
            >
              <Card
                as={Link}
                href={`/products?category=${cat.slug}`}
                isPressable
                className="w-full h-full bg-brand-surface border border-brand-border/70 hover:border-brand-gold/80 shadow-2xs hover:shadow-md transition-all text-center rounded-2xl select-none"
              >
                <CardBody className="flex flex-col items-center justify-center p-3 sm:p-4 select-none">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-center mb-2 shadow-2xs pointer-events-none relative overflow-hidden shrink-0">
                    {cat.image ? (
                      <Image
                        src={
                          cat.image.startsWith('http://') || cat.image.startsWith('https://')
                            ? cat.image
                            : `${MEDIA_BASE_URL}${cat.image.startsWith('/') ? '' : '/'}${cat.image}`
                        }
                        alt={isPersian ? cat.name : cat.nameEn || cat.name}
                        fill
                        sizes="(max-width: 640px) 40px, 48px"
                        className="object-cover p-1 rounded-xl sm:rounded-2xl"
                        unoptimized
                      />
                    ) : (
                      getIcon(cat.slug)
                    )}
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
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="h-full"
          >
            <Card
              as={Link}
              href={PATHS.PRODUCTS}
              isPressable
              className="w-full h-full bg-brand-surface-elevated border border-brand-gold/40 hover:border-brand-gold shadow-2xs hover:shadow-md transition-all text-center rounded-2xl select-none"
            >
              <CardBody className="flex flex-col items-center justify-center p-3 sm:p-4 select-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-gold text-[#141914] flex items-center justify-center mb-2 shadow-sm border border-brand-bronze-light/30 pointer-events-none">
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
