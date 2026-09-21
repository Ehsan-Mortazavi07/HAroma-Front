'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardBody, Button } from '@heroui/react';
import { IProduct } from '@/common/interfaces';
import { ProductCard } from '@/components/common/ProductCard';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';
import { useDraggableScroll } from '@/common/hooks/useDraggableScroll';

interface YouMightNeedSectionProps {
  products: IProduct[];
}

export function YouMightNeedSection({ products }: YouMightNeedSectionProps) {
  const { t, isPersian, isRTL } = useTranslation();

  const {
    scrollRef,
    canScrollPrev,
    canScrollNext,
    handleScroll,
    dragHandlers,
  } = useDraggableScroll({ isRTL, friction: 0.88 });

  return (
    <section className="w-full">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-surface-elevated text-brand-gold flex items-center justify-center border border-brand-gold/30 shadow-xs">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-brand-text">
                {isPersian ? 'پیشنهاد شگفت‌انگیز و منتخب' : t.home.curatedPicks}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-bronze text-[#f7f4ee] border border-brand-gold/40 shadow-xs">
                <Sparkles className="w-3 h-3 text-brand-gold" />
                <span>{isPersian ? 'تخفیف‌های ویژه' : 'Special Deals'}</span>
              </span>
            </div>
            <p className="text-xs text-brand-text-muted mt-0.5">
              {isPersian
                ? 'شاهکارهای اصیل عطر با تخفیف استثنایی و ضمانت اصالت ۱۰۰٪ فیزیکی'
                : t.home.curatedPicksSub}
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
              onPress={() => handleScroll('prev', 290)}
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
              onPress={() => handleScroll('next', 290)}
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

      {/* Horizontal Draggable & Scrollable Products Carousel */}
      <div
        ref={scrollRef}
        {...dragHandlers}
        style={{ touchAction: 'pan-y' }}
        className="flex items-stretch gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory py-2.5 px-0.5 select-none cursor-grab active:cursor-grabbing"
      >
        {products.map((product) => (
          <div
            key={product._id}
            className="shrink-0 w-[215px] sm:w-[245px] md:w-[270px] snap-start h-auto flex flex-col select-none"
          >
            <ProductCard product={product} />
          </div>
        ))}

        {/* Explore All Card at the end */}
        <div className="shrink-0 w-[180px] sm:w-[210px] snap-start h-auto flex flex-col justify-center select-none">
          <Card
            as={Link}
            href={PATHS.PRODUCTS}
            isPressable
            className="w-full h-full min-h-[300px] sm:min-h-[340px] flex flex-col items-center justify-center p-6 text-center rounded-2xl sm:rounded-3xl bg-brand-surface-elevated border border-brand-gold/40 hover:border-brand-gold shadow-2xs hover:shadow-md transition-all group select-none"
          >
            <CardBody className="p-0 flex flex-col items-center justify-center gap-3 select-none">
              <div className="w-12 h-12 rounded-full bg-brand-gold text-[#141914] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform pointer-events-none">
                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </div>
              <span className="font-black text-sm text-brand-text dark:text-brand-gold">
                {isPersian ? 'مشاهده همه محصولات' : 'View All Products'}
              </span>
              <span className="text-[11px] text-brand-text-muted">
                {isPersian ? 'بیش از صدها عطر نیش و لوکس' : 'Explore all fragrances'}
              </span>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}
