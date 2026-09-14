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
  ButtonGroup,
  Input,
  Divider,
  Card,
  CardBody,
  Chip,
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
  Minus,
  Plus,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { toggleCartDrawer } from '@/stores/ui/uiSlice';
import { updateQuantity, removeFromCart } from '@/stores/cart/cartSlice';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { VipBadge } from './VipBadge';
import { SearchModal } from './SearchModal';
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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
      if (e.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsProfileOpen(false);
        setIsSearchModalOpen(false);
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
              <BrandLogo
                size="md"
                variant="dark"
                simple={true}
                hideTextOnMobile={true}
                className="flex"
              />
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
              {/* 1. Theme Toggle (Visible on mobile and desktop) */}
              <div className="flex items-center justify-center w-10 h-10 shrink-0">
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

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      {/* Mobile Backdrop to prevent page distortion and allow easy tap-away */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setIsProfileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden z-40"
                      />

                      <motion.div
                        key="profile-dropdown-card"
                        variants={floatingPanelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed sm:absolute inset-x-3 sm:inset-auto top-[76px] sm:top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-0 sm:mt-3.5 w-auto sm:w-72 max-w-[calc(100vw-24px)] sm:max-w-none mx-auto sm:mx-0 bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-3xl p-4 shadow-2xl z-50 overflow-hidden text-right"
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
                  </>
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

            {/* Search Trigger Button (Opens Valira-style Search Palette) */}
            <div className="hidden md:flex items-center h-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setIsProfileOpen(false);
                  if (isCartDrawerOpen) dispatch(toggleCartDrawer(false));
                  setIsSearchModalOpen(true);
                }}
                className="w-36 lg:w-44 xl:w-52 h-9 px-3 rounded-full bg-[#242c24]/90 border border-[#3e4c3e] hover:border-[#bfa27a]/60 flex items-center gap-2 text-[#a69c8e] hover:text-[#f7f4ee] transition-all shadow-inner group cursor-pointer"
                aria-label="جست‌وجوی محصول یا برند"
              >
                <Search className="w-3.5 h-3.5 text-[#a69c8e] group-hover:text-[#bfa27a] shrink-0 transition-colors" />
                <span className="text-[11px] font-normal text-[#a69c8e] truncate select-none">
                  جست‌وجوی محصول یا برند...
                </span>
              </button>
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
              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setIsSearchModalOpen(true);
                }}
                className="w-full h-12 px-4 rounded-full bg-[#242c24] border border-[#3e4c3e] hover:border-[#bfa27a]/60 flex items-center justify-between text-[#a69c8e] transition-colors md:hidden mb-6 cursor-pointer shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#a69c8e]" />
                  <span className="text-xs text-[#a69c8e]">جست‌وجوی محصول یا برند...</span>
                </div>
                <span className="text-[10px] font-mono text-[#73695c] border border-[#3e4c3e] rounded px-1.5 py-0.5">
                  جست‌وجو
                </span>
              </button>

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

        {/* 2. Fluid Cart Panel (Full-width container matching Category Mega Menu) */}
        <AnimatePresence>
          {isCartDrawerOpen && (
            <motion.div
              key="cart-dropdown-card"
              variants={floatingPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 right-0 mt-3 sm:mt-4 w-full bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-[32px] p-5 sm:p-7 lg:p-8 shadow-2xl z-50 max-h-[85vh] overflow-y-auto will-change-transform"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2e3a2e]">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-0.5 bg-[#bfa27a] rounded-full" />
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#bfa27a]" />
                    <span className="text-sm sm:text-base font-black text-[#f7f4ee]">
                      سبد خرید شما
                    </span>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-[#bfa27a]/20 text-[#bfa27a] border border-[#bfa27a]/30 font-black text-xs h-6 px-1.5"
                    >
                      {isPersian ? `${toPersianDigits(totalCartCount)} کالا` : `${totalCartCount} items`}
                    </Chip>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    as={Link}
                    href={PATHS.CART}
                    onPress={() => dispatch(toggleCartDrawer(false))}
                    size="sm"
                    variant="light"
                    className="text-xs font-bold text-[#e6dcce] hover:text-[#bfa27a] hidden sm:flex items-center gap-1.5 px-2.5 transition-colors"
                  >
                    <span>{t.cart.viewCart}</span>
                  </Button>

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
              </div>

              {cartItems.length === 0 ? (
                /* Empty Cart State */
                <div className="py-14 sm:py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-[#242c24] flex items-center justify-center mb-4 border border-[#3e4c3e] shadow-inner">
                    <ShoppingBag className="w-10 h-10 text-[#bfa27a]/70" />
                  </div>
                  <h4 className="font-black text-base sm:text-lg text-[#f7f4ee] mb-2">
                    {t.cart.emptyTitle}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#a69c8e] max-w-md mb-8 leading-relaxed">
                    {t.cart.emptySub || 'هنوز کالایی به سبد خرید خود اضافه نکرده‌اید. با گشت و گذار در میان محصولات، رایحه مورد علاقه خود را انتخاب کنید.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      as={Link}
                      href={PATHS.PRODUCTS}
                      onPress={() => dispatch(toggleCartDrawer(false))}
                      radius="full"
                      className="bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] font-black text-xs sm:text-sm px-7 h-11 shadow-lg shadow-[#bfa27a]/15 transition-all"
                    >
                      {t.cart.browseProducts}
                    </Button>
                    <Button
                      as={Link}
                      href={PATHS.VIP}
                      onPress={() => dispatch(toggleCartDrawer(false))}
                      radius="full"
                      variant="bordered"
                      className="border-[#3e4c3e] text-[#f7f4ee] hover:border-[#bfa27a] font-bold text-xs sm:text-sm px-6 h-11 transition-all"
                    >
                      مشاهده کلکسیون VIP
                    </Button>
                  </div>
                </div>
              ) : (
                /* Rich 2-Column Layout */
                <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column (Items List) */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {cartItems.map(({ product, quantity, selectedVariant, selectedAttributes }) => {
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
                      const lineTotal = itemPrice * quantity;

                      return (
                        <Card
                          key={itemKey}
                          shadow="none"
                          className="group relative bg-[#242c24]/60 hover:bg-[#242c24] border border-[#3e4c3e]/80 hover:border-[#bfa27a]/50 transition-all rounded-2xl"
                        >
                          <CardBody className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-visible">
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#181f18] border border-[#3e4c3e] shrink-0">
                                <Image
                                  src={itemImage}
                                  alt={product.title}
                                  fill
                                  sizes="80px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`${PATHS.PRODUCTS}/${product.slug || product._id}`}
                                  onClick={() => dispatch(toggleCartDrawer(false))}
                                  className="font-bold text-xs sm:text-sm text-[#f7f4ee] hover:text-[#bfa27a] transition-colors line-clamp-1 block"
                                >
                                  {isPersian ? product.title : product.titleEn || product.title}
                                </Link>

                                {(selectedVariant || selectedAttributes) && (
                                  <span className="inline-flex items-center text-[11px] font-medium text-[#bfa27a] bg-[#bfa27a]/10 px-2 py-0.5 rounded-md mt-1">
                                    {selectedVariant
                                      ? getLocalizedVariantTitle(selectedVariant.title, isPersian)
                                      : selectedAttributes}
                                  </span>
                                )}

                                <div className="text-xs font-medium text-[#a69c8e] mt-1.5 flex items-center gap-2">
                                  <span>قیمت واحد:</span>
                                  <span className="text-[#e6dcce] font-bold">
                                    {formatToman(itemPrice, isPersian)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Controls & Line Total */}
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2e3a2e]/80">
                              {/* Minimal Curved HeroUI Quantity Stepper */}
                              <div className="inline-flex items-center bg-[#151c15]/90 hover:bg-[#1a231a] border border-[#3e4c3e] rounded-full p-1 h-8 shadow-xs transition-all">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  radius="full"
                                  variant="light"
                                  onPress={() =>
                                    dispatch(
                                      updateQuantity({
                                        productId: product._id,
                                        variantId: selectedVariant?.id,
                                        quantity: quantity - 1,
                                      }),
                                    )
                                  }
                                  className="w-6 h-6 min-w-6 max-w-6 min-h-6 max-h-6 rounded-full text-[#a69c8e] hover:text-[#f7f4ee] hover:bg-[#2e3a2e] transition-colors p-0"
                                  aria-label="کاهش تعداد"
                                >
                                  <Minus className="w-3 h-3 stroke-[2.5]" />
                                </Button>
                                <span className="w-7 text-center text-xs font-bold text-[#f7f4ee] select-none">
                                  {isPersian ? toPersianDigits(quantity) : quantity}
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  radius="full"
                                  variant="light"
                                  onPress={() =>
                                    dispatch(
                                      updateQuantity({
                                        productId: product._id,
                                        variantId: selectedVariant?.id,
                                        quantity: quantity + 1,
                                      }),
                                    )
                                  }
                                  className="w-6 h-6 min-w-6 max-w-6 min-h-6 max-h-6 rounded-full text-[#a69c8e] hover:text-[#bfa27a] hover:bg-[#bfa27a]/15 transition-colors p-0"
                                  aria-label="افزایش تعداد"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                </Button>
                              </div>

                              {/* Line Total */}
                              <div className="text-left sm:text-right min-w-[90px]">
                                <div className="text-[10px] text-[#a69c8e]">مجموع</div>
                                <div className="text-xs sm:text-sm font-black text-[#f7f4ee]">
                                  {formatToman(lineTotal, isPersian)}
                                </div>
                              </div>

                              {/* Remove button */}
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                radius="full"
                                onPress={() =>
                                  dispatch(
                                    removeFromCart({
                                      productId: product._id,
                                      variantId: selectedVariant?.id,
                                    }),
                                  )
                                }
                                className="w-8 h-8 min-w-8 text-[#a69c8e] hover:text-danger hover:bg-danger-50/10 rounded-xl transition-colors"
                                aria-label={t.common.remove}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Right Column (Summary & Checkout Card) */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                    <Card shadow="none" className="bg-[#242c24] border border-[#3e4c3e] rounded-3xl p-0 shadow-xl overflow-hidden">
                      <CardBody className="p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#3e4c3e]/80">
                          <span className="font-black text-sm text-[#f7f4ee]">
                            خلاصه پیش‌فاکتور
                          </span>
                          <span className="text-xs text-[#a69c8e]">
                            {isPersian ? `${toPersianDigits(totalCartCount)} قلم` : `${totalCartCount} items`}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between text-[#a69c8e]">
                            <span>جمع کل اقلام:</span>
                            <span className="font-bold text-[#e6dcce]">
                              {formatToman(subtotal, isPersian)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[#a69c8e]">
                            <span>هزینه بسته‌بندی و ارسال:</span>
                            <span className="font-medium text-[#bfa27a]">
                              ارسال اختصاصی و بیمه رایگان
                            </span>
                          </div>
                        </div>

                        <Divider className="bg-[#3e4c3e]/80 my-1" />

                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-[#f7f4ee]">مبلغ نهایی:</span>
                          <span className="text-base sm:text-lg font-black text-[#bfa27a]">
                            {formatToman(subtotal, isPersian)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 pt-2">
                          <Button
                            as={Link}
                            href={PATHS.CHECKOUT}
                            onPress={() => dispatch(toggleCartDrawer(false))}
                            radius="full"
                            className="w-full bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] font-black text-xs sm:text-sm h-12 shadow-lg shadow-[#bfa27a]/20 flex items-center justify-center gap-2 transition-all"
                          >
                            <span>{t.cart.proceedToCheckout}</span>
                            <ArrowLeft className="w-4 h-4" />
                          </Button>

                          <Button
                            as={Link}
                            href={PATHS.CART}
                            onPress={() => dispatch(toggleCartDrawer(false))}
                            variant="bordered"
                            radius="full"
                            className="w-full border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#f7f4ee] font-bold text-xs h-11 hover:bg-[#2e3a2e] transition-colors"
                          >
                            <span>{t.cart.viewCart}</span>
                          </Button>
                        </div>

                        <div className="pt-3 border-t border-[#3e4c3e]/80 space-y-2 text-[11px] text-[#a69c8e]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#bfa27a] shrink-0" />
                            <span>ضمانت اصالت ۱۰۰٪ فیزیکی عطرها</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#bfa27a] shrink-0" />
                            <span>پکیجینگ سلطنتی و هدیه اختصاصی</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}

              {/* Cart Footer Bar */}
              <div className="mt-8 pt-5 border-t border-[#2e3a2e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#a69c8e]">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#bfa27a]" />
                    <span>ضمانت بازگشت و تست اصالت</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#bfa27a]" />
                    <span>ارسال ایمن در پکیج ضد ضربه</span>
                  </span>
                </div>

                <Link
                  href={PATHS.VIP}
                  onClick={() => dispatch(toggleCartDrawer(false))}
                  className="flex items-center gap-1.5 font-bold text-[#bfa27a] hover:text-[#d4be9b] transition-colors group"
                >
                  <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>تخفیف ویژه اعضای کلوب VIP</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Valira-Style Command Palette Search Modal */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />

      </div>
    </header>
  );
}
