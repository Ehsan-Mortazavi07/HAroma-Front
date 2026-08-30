'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShieldCheck, Sparkles, Crown, ArrowUpRight } from 'lucide-react';
import { PATHS } from '@/common/constants/PATHS';
import { BrandLogo } from './BrandLogo';
import { useTranslation } from '@/common/i18n';
import axiosInstance from '@/common/axiosInstance';
import { IPageSection } from '@/common/interfaces';

export function Footer() {
  const { t, isPersian } = useTranslation();
  const [footerConfig, setFooterConfig] = useState<any>(null);

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const res = await axiosInstance.get('/page-sections');
        const sections: IPageSection[] = res.data || [];
        const footerSec = sections.find((s) => s.sectionKey === 'footer_settings');
        if (footerSec && footerSec.config) {
          setFooterConfig(footerSec.config);
        }
      } catch {
        // Fallback to default
      }
    };

    fetchFooterSettings();
  }, []);

  const aboutText = isPersian
    ? footerConfig?.aboutFa ||
      'هاتف آروما با بیش از ۱۰ سال سابقه درخشان در عرضه معتبرترین و نایاب‌ترین عطرهای جهان، اصالت ۱۰۰٪ تمامی محصولات و ضمانت بازگشت وجه را برای مشتریان گرامی تضمین می‌نماید.'
    : footerConfig?.aboutEn ||
      'Hatef Aroma is the premier destination for rare, artisanal, and authentic niche fragrances, offering a 100% genuine guarantee and express delivery.';

  const phoneText = footerConfig?.phone || '۰۲۱-۸۸۸۸۷۷۶۶';
  const emailText = footerConfig?.email || 'info@hatefaroma.com';
  const addressText = isPersian
    ? footerConfig?.addressFa || 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، برج آروما، طبقه ۶'
    : footerConfig?.addressEn || 'Tehran, Valiasr St, Above Vanak Sq, Aroma Tower, 6th Floor';

  const copyrightText = isPersian
    ? footerConfig?.copyrightFa || '© ۲۰۲۶ تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی هاتف آروما (HatefAroma) محفوظ است.'
    : footerConfig?.copyrightEn || '© 2026 Hatef Aroma Luxury Perfumes. All rights reserved.';

  return (
    <footer className="bg-[#f8f5f0] dark:bg-[#141914] text-[#1d241d] dark:text-[#f7f4ee] border-t border-[#e6dcce] dark:border-[#2e3a2e] pt-16 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="lg" />

            <p className="text-xs sm:text-sm text-[#73695c] dark:text-[#a69c8e] leading-relaxed max-w-md">
              {aboutText}
            </p>

            {/* Payment & Trust Badges */}
            <div className="pt-2">
              <div className="text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#9f815b]" />
                <span>{isPersian ? 'روش‌های پرداخت و نمادهای اعتماد:' : 'Accepted Payments & Trust:'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(isPersian
                  ? ['شتاب شاپرک', 'زرین‌پال', 'اسنپ‌پی اقساطی', 'ضمانت اصالت فیزیکی', 'پشتیبانی ۲۴/۷']
                  : ['Shaparak', 'ZarinPal', 'SnappPay 4x', '100% Genuine', '24/7 Support']
                ).map((badge) => (
                  <span
                    key={badge}
                    className="px-2.5 py-1 rounded-lg bg-[#ffffff] dark:bg-[#1c231c] text-[11px] font-bold text-[#1d241d] dark:text-[#d4be9b] border border-[#e6dcce] dark:border-[#344034] shadow-xs"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'دسته‌بندی‌های اصلی' : 'Categories'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/products?category=men-perfumes"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.menPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=women-perfumes"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.womenPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=unisex-perfumes"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.unisexPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=body-splash"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.bodySplash}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=skin-care"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.skinCare}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=gift-sets"
                  className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.giftSets}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'خدمات مشتریان' : 'Customer Service'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={PATHS.VIP} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors font-bold text-[#9f815b] dark:text-[#d4be9b] flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t.nav.vipClub}</span>
                </Link>
              </li>
              <li>
                <Link href={PATHS.PROFILE} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors">
                  {t.nav.myProfile}
                </Link>
              </li>
              <li>
                <Link href={PATHS.CART} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors">
                  {t.nav.cartTitle}
                </Link>
              </li>
              <li>
                <Link href={PATHS.SIGN_IN} className="hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors">
                  {t.nav.signIn}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'ارتباط با ما' : 'Contact Us'}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#73695c] dark:text-[#a69c8e]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#9f815b] shrink-0" />
                <span className="font-mono">{phoneText}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9f815b] shrink-0" />
                <span className="font-sans">{emailText}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#9f815b] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{addressText}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#73695c] dark:text-[#a69c8e]">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-4 text-[#9f815b] dark:text-[#d4be9b] font-bold">
            <Link href={PATHS.PRODUCTS} className="hover:underline">
              {t.nav.products}
            </Link>
            <Link href={PATHS.VIP} className="hover:underline flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>{t.nav.vipClub}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
