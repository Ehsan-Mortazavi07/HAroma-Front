'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Truck, CreditCard, Sparkles } from 'lucide-react';
import { DEFAULT_TRUST_FEATURES } from '@/common/constants/homepage-content';
import { resolveMediaUrl } from '@/common/constants/URL';
import { IPageSection, ITrustFeatureContent } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';

const featureIcons = {
  guarantee: ShieldCheck,
  delivery: Truck,
  installment: CreditCard,
  consultation: Sparkles,
};

export function TrustFeaturesBar({ section }: { section?: IPageSection }) {
  const { isPersian } = useTranslation();
  const reduceMotion = useReducedMotion();
  const features = (section?.config?.features?.length ? section.config.features : DEFAULT_TRUST_FEATURES) as ITrustFeatureContent[];

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {features.map((item) => {
          const Icon = featureIcons[item.id as keyof typeof featureIcons] || Sparkles;
          return (
            <motion.div
              key={item.id}
              initial={false}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="group flex items-center gap-3 rounded-2xl border border-brand-border/70 bg-brand-surface p-3.5 shadow-2xs transition-[border-color,box-shadow] duration-300 hover:border-brand-gold/60 hover:shadow-md sm:p-4"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-gold/30 bg-brand-surface-elevated text-brand-gold transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none sm:h-11 sm:w-11">
                {item.imageUrl ? (
                  <Image src={resolveMediaUrl(item.imageUrl)} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-xs sm:text-sm text-brand-text truncate">
                  {isPersian ? item.title : item.titleEn || item.title}
                </h3>
                <p className="text-[11px] text-brand-text-muted truncate mt-0.5 font-medium hidden sm:block">
                  {isPersian ? item.description : item.descriptionEn || item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
