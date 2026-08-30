'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  Zap,
  Menu,
  X,
  Crown,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { toggleCartDrawer } from '@/stores/ui/uiSlice';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { VipBadge } from './VipBadge';
import { BrandLogo } from './BrandLogo';
import { toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: t.nav.home, href: PATHS.HOME },
    { label: t.nav.products, href: PATHS.PRODUCTS },
    { label: t.nav.menPerfumes, href: '/products?category=men-perfumes' },
    { label: t.nav.womenPerfumes, href: '/products?category=women-perfumes' },
    { label: t.nav.unisexPerfumes, href: '/products?category=unisex-perfumes' },
    { label: t.nav.bodySplash, href: '/products?category=body-splash' },
    { label: t.nav.skinCare, href: '/products?category=skin-care' },
    { label: t.nav.giftSets, href: '/products?category=gift-sets' },
    {
      label: t.nav.vipClub,
      href: PATHS.VIP,
      isSpecial: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-lg transition-all">
      {/* Main Header Container (Deep Olive Charcoal Background) */}
      <div className="bg-[#1c231c] border-b border-[#2e3a2e] text-[#f7f4ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Left/Right: Brand Logo & Mobile Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-2xl bg-[#242c24] text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#2e3a2e] border border-[#3e4c3e] transition-colors"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <BrandLogo size="md" variant="dark" />
            </div>

            {/* Center: Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl relative items-center"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className={`w-full h-11 ${
                  isPersian ? 'pl-12 pr-5' : 'pr-12 pl-5'
                } rounded-full bg-[#242c24] text-[#f7f4ee] placeholder-[#a69c8e] text-xs sm:text-sm border border-[#3e4c3e] focus:border-[#bfa27a] focus:bg-[#2a342a] focus:outline-none focus:ring-2 focus:ring-[#bfa27a]/30 transition-all font-medium`}
              />
              <button
                type="submit"
                className={`absolute ${
                  isPersian ? 'left-1.5' : 'right-1.5'
                } w-8 h-8 rounded-full bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] hover:from-[#d4be9b] hover:to-[#bfa27a] flex items-center justify-center transition-all shadow-sm`}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Actions: Guarantee Badge, VIP, Theme, Lang, Cart & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Authenticity Guarantee Badge */}
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242c24] border border-[#3e4c3e] text-xs font-bold text-[#e6dcce]">
                <ShieldCheck className="w-4 h-4 text-[#d4be9b]" />
                <span>{isPersian ? 'ضمانت ۱۰۰٪ اصالت فیزیکی' : '100% Genuine Guarantee'}</span>
              </div>

              {/* Theme & Language Switchers */}
              <div className="hidden sm:flex items-center gap-1 bg-[#242c24] p-1 rounded-2xl border border-[#3e4c3e]">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>

              {/* Shopping Cart Button */}
              <button
                onClick={() => dispatch(toggleCartDrawer(true))}
                className="relative flex items-center justify-center p-2.5 sm:px-3 sm:py-2.5 rounded-2xl bg-[#242c24] hover:bg-[#2e3a2e] border border-[#bfa27a]/40 hover:border-[#bfa27a] text-white transition-all shadow-md group"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 text-[#d4be9b] group-hover:scale-110 transition-transform" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-[#d4be9b] to-[#9f815b] text-[#1d241d] text-[11px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {isPersian ? toPersianDigits(totalCartCount) : totalCartCount}
                  </span>
                )}
              </button>

              {/* User Profile / Auth Button */}
              <div className="relative">
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/50 transition-all text-xs font-bold"
                    >
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#d4be9b] to-[#9f815b] text-[#1d241d] font-black flex items-center justify-center text-xs shadow-sm">
                        {user.fullName.charAt(0)}
                      </div>
                      <span className="hidden sm:inline-block max-w-[100px] truncate text-[#f7f4ee]">
                        {user.fullName}
                      </span>
                      {user.isVip && <Crown className="w-3.5 h-3.5 text-[#d4be9b] fill-[#d4be9b]" />}
                      <ChevronDown className="w-3.5 h-3.5 text-[#a69c8e]" />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileMenuOpen && (
                      <div
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="absolute left-0 mt-2 w-56 bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl shadow-2xl border border-[#e6dcce] dark:border-[#344034] p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="px-3 py-2.5 border-b border-[#e6dcce] dark:border-[#2e3a2e] mb-1">
                          <div className="font-bold text-sm truncate">{user.fullName}</div>
                          <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] truncate font-sans">{user.email}</div>
                          {user.isVip && (
                            <div className="mt-1.5">
                              <VipBadge size="sm" text={t.common.vipOnly} />
                            </div>
                          )}
                        </div>

                        {(user.role === 'admin' || user.role === 'editor') && (
                          <Link
                            href={PATHS.ADMIN_DASHBOARD}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#bfa27a] bg-[#242c24] hover:bg-[#2e3a2e] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>
                              {user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}
                            </span>
                          </Link>
                        )}

                        <Link
                          href={PATHS.PROFILE}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#f0eae0] dark:hover:bg-[#262f26] transition-colors"
                        >
                          <User className="w-4 h-4 text-[#73695c] dark:text-[#a69c8e]" />
                          <span>{t.nav.myProfile}</span>
                        </Link>

                        <Link
                          href={PATHS.VIP}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#f0eae0] dark:hover:bg-[#262f26] transition-colors text-[#9f815b] dark:text-[#d4be9b]"
                        >
                          <Crown className="w-4 h-4" />
                          <span>{t.nav.vipClub}</span>
                        </Link>

                        <button
                          onClick={() => dispatch(logout())}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t.nav.logOut}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={PATHS.SIGN_IN}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] font-black text-xs sm:text-sm shadow-md shadow-[#9f815b]/20 transition-all active:scale-98"
                  >
                    <User className="w-4 h-4" />
                    <span>{t.nav.signIn}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Sub-Navbar Links */}
          <nav className="hidden lg:flex items-center justify-between pt-3 mt-2.5 border-t border-[#2e3a2e] text-xs font-bold">
            <div className="flex items-center gap-5 xl:gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-all py-1 ${
                    link.isSpecial
                      ? 'text-[#1d241d] font-black flex items-center gap-1.5 bg-gradient-to-r from-[#d4be9b] to-[#bfa27a] px-3.5 py-1 rounded-full shadow-sm hover:scale-105'
                      : 'text-[#e6dcce] hover:text-[#d4be9b]'
                  }`}
                >
                  {link.isSpecial && <Crown className="w-3.5 h-3.5 fill-current" />}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[#a69c8e] text-xs">
              <span className="flex items-center gap-1.5 font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-[#bfa27a]" />
                <span>{t.nav.supportPhone}</span>
              </span>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#ffffff] dark:bg-[#1c231c] border-b border-[#e6dcce] dark:border-[#2e3a2e] p-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full h-11 px-4 pl-11 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] text-xs sm:text-sm border border-[#e6dcce] dark:border-[#3e4c3e] focus:outline-none focus:ring-2 focus:ring-[#bfa27a]"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#73695c] dark:text-[#a69c8e]" />
          </form>

          <div className="flex flex-col gap-1 text-sm font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2.5 px-3.5 rounded-2xl transition-colors ${
                  link.isSpecial
                    ? 'bg-[#242c24] text-[#d4be9b] border border-[#bfa27a]/40 flex items-center gap-2 font-black'
                    : 'hover:bg-[#f0eae0] dark:hover:bg-[#262f26] text-[#1d241d] dark:text-[#f7f4ee]'
                }`}
              >
                {link.isSpecial && <Crown className="w-4 h-4 fill-current" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
