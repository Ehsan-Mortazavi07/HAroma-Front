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
    sm: { icon: 'w-11 h-11 sm:w-12 sm:h-12', img: 44, title: 'text-base sm:text-lg font-black', sub: 'text-[9.5px]' },
    md: { icon: 'w-12 h-12 sm:w-13 sm:h-13', img: 52, title: 'text-lg sm:text-xl font-black', sub: 'text-[10.5px]' },
    lg: { icon: 'w-16 h-16 sm:w-18 sm:h-18', img: 68, title: 'text-xl sm:text-2xl font-black', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20 sm:w-24 sm:h-24', img: 90, title: 'text-2xl sm:text-3xl font-black', sub: 'text-sm' },
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
    <Link href={PATHS.HOME} className={`flex items-center gap-3.5 group ${className}`}>
      {/* Official Brand Monogram Emblem (Enlarged & Prominent) */}
      <div
        className={`${sizeClasses.icon} relative rounded-2xl bg-[#181f18] border-2 border-brand-gold/60 flex items-center justify-center shadow-xl shadow-black/30 group-hover:border-brand-gold group-hover:scale-105 transition-all duration-300 ease-out overflow-hidden flex-shrink-0 p-1.5`}
      >
        {/* Ambient Gold Halo Glow */}
        <div className="absolute inset-0 bg-brand-gold/10 pointer-events-none" />

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/images/logo/hatef-aroma-logo-cropped.png"
            alt="Hatef Aroma Official Logo"
            width={sizeClasses.img}
            height={sizeClasses.img}
            className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110"
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
