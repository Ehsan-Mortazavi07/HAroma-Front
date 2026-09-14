'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Input,
  Divider,
} from '@heroui/react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Crown,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { toggleCartDrawer } from '@/stores/ui/uiSlice';
import { updateQuantity, removeFromCart } from '@/stores/cart/cartSlice';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { VipBadge } from './VipBadge';
import { formatToman, toPersianDigits, getLocalizedVariantTitle } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

// Pre-defined rich categories for the Mega Menu
const megaMenuCategories = [
  {
    title: 'عطر و ادکلن مردانه',
    subtitle: 'روایح تلخ، چوبی، دودی و کلاسیک',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=men-perfumes',
  },
  {
    title: 'کالکشن نیش VIP',
    subtitle: 'تولید محدود و دست‌ساز شاهکار',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop',
    href: PATHS.VIP,
  },
  {
    title: 'روایح خنک و تابستانه',
    subtitle: 'نت‌های اقیانوسی، مرکباتی و با طراوت',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=summer',
  },
  {
    title: 'عطر و ادکلن زنانه',
    subtitle: 'روایح گلی، شیرین، میوه‌ای و لوکس',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=women-perfumes',
  },
  {
    title: 'ست‌های کادویی لوکس',
    subtitle: 'پکیجینگ سلطنتی و هدیه‌ای ماندگار',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=gift-sets',
  },
  {
    title: 'روایح گرم، شرقی و عودی',
    subtitle: 'عنبر، وانیل ماداگاسکار و عود اصیل',
    image: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=oriental',
  },
  {
    title: 'عطرهای یونیسکس و نیش',
    subtitle: 'روایح ساختارشکن، خاص و مشترک',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=unisex-perfumes',
  },
  {
    title: 'مراقبت پوست و مو',
    subtitle: 'لوسیون معطر، بالم و افترشیو تخصصی',
    image: 'https://images.unsplash.com/photo-1608248597359-0a6d5db95c86?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=skin-care',
  },
  {
    title: 'خوشبوکننده محیط و منزل',
    subtitle: 'شمع‌های معطر و اسانس‌های آرامش‌بخش',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=home-fragrance',
  },
  {
    title: 'بادی اسپلش و اسپری بدن',
    subtitle: 'خوشبوکننده، شاداب‌کننده و آبرسان',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=body-splash',
  },
  {
    title: 'عطرهای جیبی و دکانت',
    subtitle: 'سمپل اورجینال و همراه مناسب سفر',
    image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=miniature',
  },
  {
    title: 'لوازم جانبی و اکسسوری',
    subtitle: 'اتومایزرهای کریستال و ابزار نگهداری',
    image: 'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?q=80&w=200&auto=format&fit=crop',
    href: '/products?category=accessories',
  },
];

// Unified fluid motion variants matching Category Mega Menu
const floatingPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -14,
    scale: 0.985,
    transition: {
      duration: 0.22,
      ease: 'easeInOut',
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: 'easeOut',
      staggerChildren: 0.025,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.985,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

const categoryItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 340,
    },
  },
};

export function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const isCartDrawerOpen = useAppSelector((state) => state.ui.isCartDrawerOpen);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { isPersian, t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navbarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selectedVariant
      ? item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
        ? item.selectedVariant.discountPrice
        : item.selectedVariant.price
      : item.product.discountPrice && item.product.discountPrice > 0
      ? item.product.discountPrice
      : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsProfileOpen(false);
        if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, dispatch]);

  // Click Outside (only active when a menu is actually open)
  useEffect(() => {
    if (!isMegaMenuOpen && !isProfileOpen && !isCartDrawerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
        setIsProfileOpen(false);
        if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMegaMenuOpen, isProfileOpen, isCartDrawerOpen, dispatch]);

  // Lock body scroll on small screens only when open
  useEffect(() => {
    const isAnyOpen = isMegaMenuOpen || isCartDrawerOpen;
    if (!isAnyOpen) return;

    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMegaMenuOpen, isCartDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMegaMenuOpen(false);
      setIsProfileOpen(false);
      if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
    }
  };

  const toggleCategoryMenu = () => {
    setIsProfileOpen(false);
    if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
    setIsMegaMenuOpen((prev) => !prev);
  };

  const toggleProfileMenu = () => {
    setIsMegaMenuOpen(false);
    if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
    setIsProfileOpen((prev) => !prev);
  };

  const toggleCartMenu = () => {
    setIsMegaMenuOpen(false);
    setIsProfileOpen(false);
    dispatch(toggleCartDrawer());
  };

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full px-3 sm:px-4 lg:px-8 mb-4 sm:mb-6 transition-all pointer-events-none">
      <div className="max-w-7xl mx-auto relative pointer-events-auto" ref={navbarRef}>
        
        {/* Floating Capsule Bar using HeroUI Navbar */}
        <HeroNavbar
          isBordered={false}
          maxWidth="full"
          position="static"
          classNames={{
            base: 'bg-transparent p-0 overflow-visible',
            wrapper:
              'h-16 sm:h-[68px] px-3 sm:px-4 rounded-[32px] bg-[#1c231c]/90 dark:bg-[#181f18]/90 backdrop-blur-xl border border-[#2e3a2e] shadow-2xl flex items-center justify-between select-none max-w-full gap-2 sm:gap-4',
          }}
        >
          {/* Right Section: Hamburger, Logo (emblem + store name), Nav Links */}
          <NavbarContent justify="start" className="gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Toggle (opens Categories Mega Menu) */}
            <NavbarItem>
              <Button
                isIconOnly
                radius="full"
                variant="light"
                onPress={toggleCategoryMenu}
                className="w-10 h-10 min-w-10 text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24] border border-[#3e4c3e]/60 transition-colors shadow-sm"
                aria-label="منوی دسته‌بندی‌ها"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMegaMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <X className="w-5 h-5 text-[#bfa27a]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </NavbarItem>

            {/* Brand Logo (simple: emblem + store name only) */}
            <NavbarBrand className="shrink-0 grow-0">
              <BrandLogo size="sm" variant="dark" simple={true} className="flex" />
            </NavbarBrand>

            {/* Nav Links (single line, no wrapping) */}
            <NavbarItem className="hidden lg:flex items-center gap-1.5 xl:gap-2 pr-3 border-r border-[#3e4c3e]/50 mr-1">
              <Link
                href={PATHS.VIP}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]/70 transition-all whitespace-nowrap shrink-0 group"
              >
                <Crown className="w-3.5 h-3.5 text-[#bfa27a] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap">کالکشن نیش VIP</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]/70 transition-all whitespace-nowrap shrink-0 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#bfa27a] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap">مشاوره تخصصی</span>
              </Link>
              <Link
                href="/blog"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]/70 transition-all whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">راهنماها و اصالت</span>
              </Link>
            </NavbarItem>
          </NavbarContent>

          {/* Left Section: 3 Strictly Level Icons + Search Bar */}
          <NavbarContent justify="end" className="gap-2 sm:gap-3 shrink-0 flex items-center">
            
            {/* The 3 Buttons Container - Strictly Level (هم‌سطح) */}
            <div className="flex items-center gap-2 sm:gap-2.5 h-10 shrink-0">
              {/* 1. Theme Toggle */}
              <div className="hidden sm:flex items-center justify-center w-10 h-10 shrink-0">
                <ThemeToggle className="w-10 h-10 min-w-10 max-w-10 h-10 min-h-10 max-h-10 rounded-full bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#f7f4ee] transition-colors shadow-sm flex items-center justify-center p-0" />
              </div>

              {/* 2. Profile Button & Dropdown (Centered directly underneath) */}
              <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  onPress={toggleProfileMenu}
                  className={`w-10 h-10 min-w-10 max-w-10 h-10 min-h-10 max-h-10 rounded-full ${
                    isProfileOpen
                      ? 'bg-[#bfa27a] text-[#141914] border-transparent'
                      : 'bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#e6dcce] hover:text-[#f7f4ee]'
                  } transition-all shadow-sm flex items-center justify-center p-0`}
                  aria-label="حساب کاربری"
                >
                  <User className={`w-4 h-4 ${isProfileOpen ? 'text-[#141914]' : 'text-[#d4be9b]'}`} />
                </Button>

                {/* Profile Dropdown rendered directly underneath the Profile Button */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      key="profile-dropdown-card"
                      variants={floatingPanelVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3.5 w-72 bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-3xl p-4 shadow-2xl z-50 overflow-hidden text-right"
                    >
                      {isAuthenticated && user ? (
                        <>
                          <div className="pb-3 border-b border-[#2e3a2e] mb-2">
                            <div className="text-sm font-black text-[#f7f4ee] truncate">{user.fullName}</div>
                            <div className="text-[11px] font-mono text-[#a69c8e] truncate mt-0.5">{user.email}</div>
                            {user.isVip && (
                              <div className="mt-2">
                                <VipBadge size="sm" text="عضو باشگاه VIP" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 text-xs font-bold">
                            {(user.role === 'admin' || user.role === 'editor') && (
                              <Link
                                href={PATHS.ADMIN_DASHBOARD}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#bfa27a] hover:bg-[#242c24] transition-colors"
                              >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>پنل مدیریت {user.role === 'admin' ? 'کل' : 'محتوا'}</span>
                              </Link>
                            )}
                            <Link
                              href={PATHS.PROFILE}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] transition-colors"
                            >
                              <User className="w-4 h-4 text-[#a69c8e]" />
                              <span>پروفایل کاربری و سفارش‌ها</span>
                            </Link>
                            <Link
                              href={PATHS.VIP}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] transition-colors"
                            >
                              <Crown className="w-4 h-4 text-[#bfa27a]" />
                              <span>باشگاه مشتریان VIP</span>
                            </Link>
                            <button
                              onClick={() => {
                                dispatch(logout());
                                setIsProfileOpen(false);
                              }}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-danger hover:bg-danger-50/10 transition-colors text-right w-full"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>خروج از حساب</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1.5 text-xs font-bold">
                          <div className="pb-2.5 mb-1 border-b border-[#2e3a2e] text-[11px] text-[#a69c8e]">
                            به هاتف آروما خوش آمدید
                          </div>
                          <Link
                            href={PATHS.SIGN_IN}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] hover:text-[#bfa27a] transition-colors"
                          >
                            <User className="w-4 h-4 text-[#bfa27a]" />
                            <span>ورود به حساب کاربری</span>
                          </Link>
                          <Link
                            href={PATHS.SIGN_UP}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-[#a69c8e]" />
                            <span>ثبت‌نام در هاتف آروما</span>
                          </Link>
                          <Link
                            href={PATHS.VIP}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] transition-colors"
                          >
                            <Crown className="w-4 h-4 text-[#bfa27a]" />
                            <span>مزایای عضویت VIP</span>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Shopping Cart Button */}
              <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  onPress={toggleCartMenu}
                  className={`w-10 h-10 min-w-10 max-w-10 h-10 min-h-10 max-h-10 rounded-full ${
                    isCartDrawerOpen
                      ? 'bg-[#bfa27a] text-[#141914] border-transparent'
                      : 'bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#e6dcce] hover:text-[#f7f4ee]'
                  } transition-all shadow-sm flex items-center justify-center p-0`}
                  aria-label="سبد خرید"
                >
                  <ShoppingBag className={`w-4 h-4 ${isCartDrawerOpen ? 'text-[#141914]' : 'text-[#d4be9b]'}`} />
                </Button>

                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#bfa27a] text-[#141914] font-black text-[10px] flex items-center justify-center border-2 border-[#1c231c] pointer-events-none z-10 shadow-sm leading-none">
                    {isPersian ? toPersianDigits(totalCartCount) : totalCartCount}
                  </span>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center h-10 shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جست‌وجوی محصول یا برند..."
                  radius="full"
                  size="sm"
                  startContent={<Search className="w-4 h-4 text-[#a69c8e] shrink-0 pointer-events-none" />}
                  classNames={{
                    base: 'w-44 lg:w-56 xl:w-64',
                    inputWrapper:
                      'bg-[#242c24]/80 border border-[#3e4c3e] hover:border-[#bfa27a]/50 data-[focus=true]:border-[#bfa27a] data-[focus=true]:bg-[#242c24] h-10 px-3 transition-colors shadow-inner',
                    input: 'text-xs font-medium text-[#f7f4ee] placeholder:text-[#a69c8e] placeholder:font-normal pr-1',
                  }}
                />
              </form>
            </div>

          </NavbarContent>
        </HeroNavbar>

        {/* 1. Fluid Mega Menu Overlay (Categories) */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <motion.div
              key="mega-menu-overlay"
              variants={floatingPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 right-0 mt-3 sm:mt-4 w-full bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-[32px] p-5 sm:p-7 lg:p-8 shadow-2xl z-50 lg:max-h-[85vh] overflow-y-auto will-change-transform"
            >
              <form onSubmit={handleSearchSubmit} className="relative block md:hidden mb-6">
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جست‌وجوی محصول..."
                  radius="full"
                  size="md"
                  startContent={<Search className="w-4 h-4 text-[#a69c8e] shrink-0 pointer-events-none" />}
                  classNames={{
                    inputWrapper:
                      'bg-[#242c24] border border-[#3e4c3e] hover:border-[#bfa27a]/50 data-[focus=true]:border-[#bfa27a] shadow-inner',
                    input: 'text-sm font-medium text-[#f7f4ee] placeholder:text-[#a69c8e]',
                  }}
                />
              </form>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2e3a2e] gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-0.5 bg-[#bfa27a] rounded-full" />
                  <span className="text-xs sm:text-sm font-black text-[#bfa27a] tracking-wide">
                    انتخاب بر اساس دسته‌بندی و روایح
                  </span>
                </div>

                <Button
                  as={Link}
                  href={PATHS.PRODUCTS}
                  onPress={() => setIsMegaMenuOpen(false)}
                  size="sm"
                  variant="light"
                  className="text-xs font-bold text-[#e6dcce] hover:text-[#bfa27a] flex items-center gap-1.5 self-start sm:self-auto px-0 transition-colors"
                  endContent={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  مشاهده تمام محصولات
                </Button>
              </div>

              {/* 3-Column Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-6">
                {megaMenuCategories.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={categoryItemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMegaMenuOpen(false)}
                      className="group flex items-center gap-3.5 p-2.5 sm:p-3 rounded-2xl bg-transparent hover:bg-[#242c24]/80 border border-transparent hover:border-[#3e4c3e] transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] overflow-hidden shrink-0 bg-[#242c24] border border-[#3e4c3e] group-hover:border-[#bfa27a]/60 transition-colors shadow-sm relative isolate">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="60px"
                          className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs sm:text-sm font-bold text-[#f7f4ee] group-hover:text-[#bfa27a] transition-colors truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#a69c8e] group-hover:text-[#e6dcce] transition-colors truncate mt-1 sm:mt-0.5 font-medium tracking-wide">
                          {item.subtitle}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mega Menu Footer */}
              <div className="mt-8 pt-5 border-t border-[#2e3a2e] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-medium text-[#a69c8e]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#bfa27a]" />
                    <span>ضمانت ۱۰۰٪ اصالت فیزیکی تمامی کالاها</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#bfa27a]" />
                    <span>ارسال اختصاصی و فوری به سراسر ایران</span>
                  </span>
                </div>

                <Link
                  href={PATHS.VIP}
                  onClick={() => setIsMegaMenuOpen(false)}
                  className="flex items-center gap-2 font-bold text-[#bfa27a] hover:text-[#d4be9b] transition-colors group"
                >
                  <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>پیوستن به باشگاه اعضای ویژه VIP</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Fluid Cart Panel (Exact same Category spring animation) */}
        <AnimatePresence>
          {isCartDrawerOpen && (
            <motion.div
              key="cart-dropdown-card"
              variants={floatingPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 mt-3 sm:mt-4 w-full sm:w-[440px] max-w-[calc(100vw-2rem)] bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-[32px] p-5 sm:p-6 shadow-2xl z-50 max-h-[82vh] flex flex-col will-change-transform"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#2e3a2e]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#242c24] flex items-center justify-center border border-[#3e4c3e]">
                    <ShoppingBag className="w-4 h-4 text-[#bfa27a]" />
                  </div>
                  <span className="font-black text-sm text-[#f7f4ee]">
                    سبد خرید شما ({isPersian ? toPersianDigits(totalCartCount) : totalCartCount})
                  </span>
                </div>

                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => dispatch(toggleCartDrawer(false))}
                  className="w-8 h-8 min-w-8 text-[#a69c8e] hover:text-[#f7f4ee] hover:bg-[#242c24]"
                  aria-label="بستن سبد"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto py-3 divide-y divide-[#2e3a2e] max-h-[46vh]">
                {cartItems.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center text-[#a69c8e]">
                    <div className="w-14 h-14 rounded-full bg-[#242c24] flex items-center justify-center mb-3 border border-[#3e4c3e]">
                      <ShoppingBag className="w-7 h-7 text-[#bfa27a] opacity-50" />
                    </div>
                    <h4 className="font-black text-sm text-[#f7f4ee] mb-1">
                      {t.cart.emptyTitle}
                    </h4>
                    <p className="text-xs mb-5 max-w-xs text-[#a69c8e]">
                      {t.cart.emptySub}
                    </p>
                    <Button
                      as={Link}
                      href={PATHS.PRODUCTS}
                      onPress={() => dispatch(toggleCartDrawer(false))}
                      radius="full"
                      className="bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] font-black text-xs px-6 h-9 shadow-sm"
                    >
                      {t.cart.browseProducts}
                    </Button>
                  </div>
                ) : (
                  cartItems.map(({ product, quantity, selectedVariant, selectedAttributes }) => {
                    const itemPrice = selectedVariant
                      ? selectedVariant.discountPrice && selectedVariant.discountPrice > 0
                        ? selectedVariant.discountPrice
                        : selectedVariant.price
                      : product.discountPrice && product.discountPrice > 0
                      ? product.discountPrice
                      : product.price;

                    const itemImage =
                      product.images && product.images.length > 0
                        ? product.images[0].startsWith('http')
                          ? product.images[0]
                          : `http://127.0.0.1:7731${product.images[0]}`
                        : 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';

                    const itemKey = `${product._id}-${selectedVariant?.id || 'base'}`;

                    return (
                      <div key={itemKey} className="py-3.5 first:pt-1 last:pb-1 flex gap-3">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#242c24] border border-[#3e4c3e] shrink-0">
                          <Image src={itemImage} alt={product.title} fill className="object-cover" />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-[#f7f4ee] line-clamp-1">
                              {isPersian ? product.title : product.titleEn || product.title}
                            </h4>
                            {(selectedVariant || selectedAttributes) && (
                              <span className="text-[11px] font-bold text-[#bfa27a] block mt-0.5">
                                {selectedVariant
                                  ? getLocalizedVariantTitle(selectedVariant.title, isPersian)
                                  : selectedAttributes}
                              </span>
                            )}
                            <div className="text-xs font-black text-[#e6dcce] mt-1">
                              {formatToman(itemPrice, isPersian)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-[#242c24] border border-[#3e4c3e] rounded-xl p-0.5">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                radius="md"
                                onPress={() =>
                                  dispatch(
                                    updateQuantity({
                                      productId: product._id,
                                      variantId: selectedVariant?.id,
                                      quantity: quantity - 1,
                                    }),
                                  )
                                }
                                className="w-7 h-7 min-w-7 bg-[#181f18] text-[#f7f4ee] text-xs font-black"
                                aria-label="کاهش تعداد"
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-xs font-bold text-[#f7f4ee]">
                                {isPersian ? toPersianDigits(quantity) : quantity}
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="solid"
                                radius="md"
                                onPress={() =>
                                  dispatch(
                                    updateQuantity({
                                      productId: product._id,
                                      variantId: selectedVariant?.id,
                                      quantity: quantity + 1,
                                    }),
                                  )
                                }
                                className="w-7 h-7 min-w-7 bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] text-xs font-black"
                                aria-label="افزایش تعداد"
                              >
                                +
                              </Button>
                            </div>

                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() =>
                                dispatch(
                                  removeFromCart({
                                    productId: product._id,
                                    variantId: selectedVariant?.id,
                                  }),
                                )
                              }
                              className="w-7 h-7 min-w-7 text-danger hover:bg-danger-50/10 rounded-xl"
                              aria-label={t.common.remove}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="pt-3 border-t border-[#2e3a2e] mt-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-[#a69c8e] mb-3">
                    <span>{t.cart.subtotal}</span>
                    <span className="text-sm font-black text-[#f7f4ee]">
                      {formatToman(subtotal, isPersian)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      as={Link}
                      href={PATHS.CART}
                      onPress={() => dispatch(toggleCartDrawer(false))}
                      variant="bordered"
                      radius="full"
                      className="border-[#3e4c3e] text-[#f7f4ee] font-bold text-xs h-10 hover:bg-[#242c24] transition-colors"
                    >
                      <span>{t.cart.viewCart}</span>
                    </Button>

                    <Button
                      as={Link}
                      href={PATHS.CHECKOUT}
                      onPress={() => dispatch(toggleCartDrawer(false))}
                      radius="full"
                      className="bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] font-black text-xs h-10 shadow-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>{t.cart.proceedToCheckout}</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
}
