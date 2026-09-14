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
      icon: 'w-16 h-10 sm:w-20 sm:h-11',
      imgWidth: 80,
      imgHeight: 46,
      title: 'font-script text-xl sm:text-2xl font-normal',
      sub: 'text-[9.5px]',
    },
    md: {
      icon: 'w-20 h-12 sm:w-28 sm:h-14',
      imgWidth: 112,
      imgHeight: 56,
      title: 'font-script text-2xl sm:text-3xl font-normal',
      sub: 'text-[10.5px]',
    },
    lg: {
      icon: 'w-28 h-15 sm:w-36 sm:h-18',
      imgWidth: 144,
      imgHeight: 72,
      title: 'font-script text-3xl sm:text-4xl font-normal',
      sub: 'text-xs',
    },
    xl: {
      icon: 'w-36 h-20 sm:w-48 sm:h-24',
      imgWidth: 192,
      imgHeight: 96,
      title: 'font-script text-4xl sm:text-5xl font-normal',
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
    <Link href={PATHS.HOME} className={`flex items-center gap-2 sm:gap-3 group ${className}`}>
      {/* Official Brand Monogram Emblem (Frameless, Enlarged & Stretched) */}
      <div
        className={`${sizeClasses.icon} relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
      >
        <Image
          src="/images/logo/hatef-aroma-logo-cropped.png"
          alt="Hatef Aroma Official Logo"
          width={sizeClasses.imgWidth}
          height={sizeClasses.imgHeight}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_4px_14px_rgba(191,162,122,0.45)] transition-all duration-300"
          priority
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className={`${hideTextOnMobile ? 'hidden sm:flex' : 'flex'} flex-col select-none justify-center`}>
          <div className="flex items-center gap-2">
            <span
              className={`${titleClassName || sizeClasses.title} font-script tracking-wide ${titleColor} transition-colors leading-none`}
            >
              Hatef Aroma
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
