'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShieldCheck, Sparkles, Crown, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PATHS } from '@/common/constants/PATHS';
import { BrandLogo } from './BrandLogo';
import { useTranslation } from '@/common/i18n';
import axiosInstance from '@/common/axiosInstance';
import { IPageSection } from '@/common/interfaces';

interface MobileFooterAccordionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function MobileFooterAccordion({ id, title, children }: MobileFooterAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const motionEase = [0.22, 1, 0.36, 1] as const;
  const revealEase = [0.16, 1, 0.3, 1] as const;
  const transition = prefersReducedMotion
    ? {
        height: { duration: 0 },
        opacity: { duration: 0.12, ease: 'easeOut' as const },
      }
    : {
        height: isOpen
          ? { type: 'spring' as const, visualDuration: 0.46, bounce: 0, restDelta: 0.5, restSpeed: 8 }
          : { type: 'spring' as const, visualDuration: 0.24, bounce: 0, restDelta: 8, restSpeed: 100 },
        opacity: isOpen
          ? { duration: 0.34, delay: 0.04, ease: revealEase }
          : { duration: 0.16, ease: 'easeOut' as const },
      };
  const iconTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: motionEase };
  const contentTransition = prefersReducedMotion
    ? { opacity: { duration: 0.12 }, y: { duration: 0 } }
    : {
        opacity: { duration: 0.34, delay: 0.06, ease: revealEase },
        y: { duration: 0.42, delay: 0.04, ease: revealEase },
      };

  return (
    <section>
      <button
        id={`${id}-trigger`}
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-right font-bold text-sm"
      >
        <span>{title}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={iconTransition}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-brand-bronze"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <div aria-hidden={!isOpen} inert={!isOpen}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={id}
              key={id}
              role="region"
              aria-labelledby={`${id}-trigger`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={transition}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={contentTransition}
                className="pb-4"
              >
                {children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

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
    <footer className="bg-brand-bg text-brand-text border-t border-brand-border pt-3 md:pt-14 lg:pt-16 pb-[max(1rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <div className="flex items-center justify-center border-b border-brand-border pb-3">
            <BrandLogo size="sm" />
          </div>

          <div className="mt-2 divide-y divide-brand-border border-y border-brand-border">
            <MobileFooterAccordion id="mobile-footer-categories" title={isPersian ? 'دسته‌بندی‌های اصلی' : 'Categories'}>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pb-3 text-xs">
                <li><Link href="/products?category=men-perfumes" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.menPerfumes}</Link></li>
                <li><Link href="/products?category=women-perfumes" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.womenPerfumes}</Link></li>
                <li><Link href="/products?category=unisex-perfumes" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.unisexPerfumes}</Link></li>
                <li><Link href="/products?category=body-splash" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.bodySplash}</Link></li>
                <li><Link href="/products?category=skin-care" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.skinCare}</Link></li>
                <li><Link href="/products?category=gift-sets" className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.giftSets}</Link></li>
              </ul>
            </MobileFooterAccordion>

            <MobileFooterAccordion id="mobile-footer-services" title={isPersian ? 'خدمات مشتریان' : 'Customer service'}>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pb-3 text-xs">
                <li><Link href={PATHS.VIP} className="flex min-h-10 items-center gap-1 leading-5 font-bold text-brand-bronze dark:text-brand-gold"><Crown className="h-3.5 w-3.5 shrink-0" />{t.nav.vipClub}</Link></li>
                <li><Link href={PATHS.PROFILE} className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.myProfile}</Link></li>
                <li><Link href={PATHS.CART} className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.cartTitle}</Link></li>
                <li><Link href={PATHS.SIGN_IN} className="flex min-h-10 items-center leading-5 text-brand-text-muted hover:text-brand-bronze dark:hover:text-brand-gold">{t.nav.signIn}</Link></li>
              </ul>
            </MobileFooterAccordion>

            <MobileFooterAccordion id="mobile-footer-contact" title={isPersian ? 'ارتباط با ما' : 'Contact us'}>
              <ul className="space-y-3 pb-4 text-xs text-brand-text-muted">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-brand-bronze" /><span className="break-all font-mono">{phoneText}</span></li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-brand-bronze" /><span className="break-all font-sans">{emailText}</span></li>
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" /><span className="leading-relaxed">{addressText}</span></li>
              </ul>
            </MobileFooterAccordion>

            <MobileFooterAccordion id="mobile-footer-about" title={isPersian ? 'درباره و ضمانت اعتماد' : 'About & trust'}>
              <div className="space-y-3 pb-4">
                <p className="text-xs leading-6 text-brand-text-muted">{aboutText}</p>
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-brand-text">
                    <ShieldCheck className="h-4 w-4 text-brand-bronze" />
                    <span>{isPersian ? 'روش‌های پرداخت و نمادهای اعتماد' : 'Accepted payments & trust'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(isPersian
                      ? ['شتاب شاپرک', 'زرین‌پال', 'اسنپ‌پی اقساطی', 'ضمانت اصالت فیزیکی', 'پشتیبانی ۲۴/۷']
                      : ['Shaparak', 'ZarinPal', 'SnappPay 4x', '100% Genuine', '24/7 Support']
                    ).map((badge) => (
                      <span key={badge} className="rounded-md border border-brand-border bg-brand-surface px-2 py-1 text-[10px] font-bold text-brand-text dark:text-brand-gold">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </MobileFooterAccordion>
          </div>

          <div className="mt-2 space-y-1 pt-1">
            <div className="flex items-center justify-center gap-6 text-xs font-bold text-brand-bronze dark:text-brand-gold">
              <Link href={PATHS.PRODUCTS} className="flex min-h-8 items-center hover:underline">{t.nav.products}</Link>
              <Link href={PATHS.VIP} className="flex min-h-8 items-center gap-1 hover:underline"><Crown className="h-3.5 w-3.5" /><span>{t.nav.vipClub}</span></Link>
            </div>
            <p className="text-center text-[10px] leading-4 text-brand-text-muted">{copyrightText}</p>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-x-5 gap-y-8 md:gap-x-8 md:gap-y-10 lg:grid-cols-5 lg:gap-10 pb-8 md:pb-12 border-b border-brand-border">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <BrandLogo size="lg" />

            <p className="text-xs sm:text-sm text-brand-text-muted leading-relaxed max-w-md">
              {aboutText}
            </p>

            {/* Payment & Trust Badges */}
            <div className="pt-2">
              <div className="text-xs font-bold text-brand-text mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-bronze" />
                <span>{isPersian ? 'روش‌های پرداخت و نمادهای اعتماد:' : 'Accepted Payments & Trust:'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(isPersian
                  ? ['شتاب شاپرک', 'زرین‌پال', 'اسنپ‌پی اقساطی', 'ضمانت اصالت فیزیکی', 'پشتیبانی ۲۴/۷']
                  : ['Shaparak', 'ZarinPal', 'SnappPay 4x', '100% Genuine', '24/7 Support']
                ).map((badge) => (
                  <span
                    key={badge}
                    className="px-2.5 py-1 rounded-lg bg-brand-surface text-[11px] font-bold text-brand-text dark:text-brand-gold border border-brand-border shadow-xs"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="min-w-0 space-y-3">
            <h4 className="font-bold text-sm text-brand-text">
              {isPersian ? 'دسته‌بندی‌های اصلی' : 'Categories'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/products?category=men-perfumes"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.menPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=women-perfumes"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.womenPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=unisex-perfumes"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.unisexPerfumes}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=body-splash"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.bodySplash}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=skin-care"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.skinCare}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=gift-sets"
                  className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors flex items-center gap-1"
                >
                  <span>{t.nav.giftSets}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div className="min-w-0 space-y-3">
            <h4 className="font-bold text-sm text-brand-text">
              {isPersian ? 'خدمات مشتریان' : 'Customer Service'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={PATHS.VIP} className="min-h-9 leading-5 hover:text-brand-bronze dark:hover:text-brand-gold transition-colors font-bold text-brand-bronze dark:text-brand-gold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t.nav.vipClub}</span>
                </Link>
              </li>
              <li>
                <Link href={PATHS.PROFILE} className="min-h-9 leading-5 flex items-center hover:text-brand-bronze dark:hover:text-brand-gold transition-colors">
                  {t.nav.myProfile}
                </Link>
              </li>
              <li>
                <Link href={PATHS.CART} className="min-h-9 leading-5 flex items-center hover:text-brand-bronze dark:hover:text-brand-gold transition-colors">
                  {t.nav.cartTitle}
                </Link>
              </li>
              <li>
                <Link href={PATHS.SIGN_IN} className="min-h-9 leading-5 flex items-center hover:text-brand-bronze dark:hover:text-brand-gold transition-colors">
                  {t.nav.signIn}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div className="col-span-2 lg:col-span-1 min-w-0 space-y-3 pt-2 sm:pt-0 border-t border-brand-border/70 sm:border-0">
            <h4 className="font-bold text-sm text-brand-text">
              {isPersian ? 'ارتباط با ما' : 'Contact Us'}
            </h4>
            <ul className="space-y-3 text-xs text-brand-text-muted">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-bronze shrink-0" />
                <span className="font-mono break-all">{phoneText}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-bronze shrink-0" />
                <span className="font-sans break-all">{emailText}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-bronze shrink-0 mt-0.5" />
                <span className="leading-relaxed">{addressText}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="hidden md:flex pt-6 sm:pt-8 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 text-xs text-brand-text-muted">
          <p className="max-w-3xl text-[11px] leading-6">{copyrightText}</p>
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-x-5 gap-y-2 text-brand-bronze dark:text-brand-gold font-bold">
            <Link href={PATHS.PRODUCTS} className="min-h-10 flex items-center hover:underline">
              {t.nav.products}
            </Link>
            <Link href={PATHS.VIP} className="min-h-10 flex items-center gap-1 hover:underline">
              <Crown className="w-3.5 h-3.5" />
              <span>{t.nav.vipClub}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
