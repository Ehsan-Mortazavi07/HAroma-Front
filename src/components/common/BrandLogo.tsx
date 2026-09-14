'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  hideTextOnMobile?: boolean;
  className?: string;
  titleClassName?: string;
  variant?: 'auto' | 'light' | 'dark';
  simple?: boolean;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  hideTextOnMobile = false,
  className = '',
  titleClassName = '',
  variant = 'auto',
  simple = false,
}: BrandLogoProps) {
  const { isPersian } = useTranslation();

  const sizeClasses = {
    sm: {
      icon: 'w-14 h-10 sm:w-16 sm:h-11',
      imgWidth: 64,
      imgHeight: 44,
      title: 'text-sm sm:text-base font-medium',
      sub: 'text-[9.5px]',
    },
    md: {
      icon: 'w-18 h-11 sm:w-22 sm:h-12',
      imgWidth: 88,
      imgHeight: 48,
      title: 'text-sm sm:text-base font-medium',
      sub: 'text-[10.5px]',
    },
    lg: {
      icon: 'w-24 h-13 sm:w-28 sm:h-15',
      imgWidth: 112,
      imgHeight: 60,
      title: 'text-lg sm:text-xl font-semibold',
      sub: 'text-xs',
    },
    xl: {
      icon: 'w-32 h-16 sm:w-38 sm:h-20',
      imgWidth: 152,
      imgHeight: 80,
      title: 'text-xl sm:text-2xl font-bold',
      sub: 'text-sm',
    },
  }[size];

  const titleColor =
    variant === 'dark'
      ? 'text-[#f7f4ee] group-hover:text-[#d4be9b]'
      : variant === 'light'
        ? 'text-[#1d241d] group-hover:text-[#9f815b]'
        : 'text-[#1d241d] dark:text-[#f7f4ee] group-hover:text-[#9f815b] dark:group-hover:text-[#d4be9b]';

  const subColor =
    variant === 'dark'
      ? 'text-[#a69c8e]'
      : variant === 'light'
        ? 'text-[#73695c]'
        : 'text-[#73695c] dark:text-[#a69c8e]';

  return (
    <Link href={PATHS.HOME} className={`flex items-center gap-3 sm:gap-3.5 group ${className}`}>
      {/* Official Brand Monogram Emblem (Enlarged & Elongated/Stretched) */}
      <div
        className={`${sizeClasses.icon} relative rounded-2xl bg-[#181f18]/85 dark:bg-[#121612]/90 border border-brand-gold/50 flex items-center justify-center shadow-lg shadow-black/25 group-hover:border-brand-gold group-hover:scale-102 transition-all duration-300 ease-out overflow-hidden flex-shrink-0 px-2 py-1`}
      >
        {/* Ambient Gold Halo Glow */}
        <div className="absolute inset-0 bg-brand-gold/10 pointer-events-none" />

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/images/logo/hatef-aroma-logo-cropped.png"
            alt="Hatef Aroma Official Logo"
            width={sizeClasses.imgWidth}
            height={sizeClasses.imgHeight}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className={`${hideTextOnMobile ? 'hidden sm:flex' : 'flex'} flex-col select-none justify-center`}>
          <div className="flex items-center gap-2">
            <span
              className={`${titleClassName || sizeClasses.title} font-latin tracking-tight ${titleColor} transition-colors`}
            >
              HatefAroma
            </span>
            {!simple && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#bfa27a]/25 text-[#d4be9b] border border-[#bfa27a]/40 shadow-xs">
                {isPersian ? 'هاتف آروما' : 'Niche'}
              </span>
            )}
          </div>
          {!simple && (
            <span className={`${sizeClasses.sub} ${subColor} tracking-wider font-medium -mt-0.5 font-latin`}>
              Luxury Perfumes & Cosmetics
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
