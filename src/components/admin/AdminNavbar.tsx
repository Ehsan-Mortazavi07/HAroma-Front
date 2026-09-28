'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  User,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout } from '@/stores/auth/authSlice';
import { useAdminSidebar } from './AdminSidebarContext';
import { PATHS } from '@/common/constants/PATHS';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTranslation } from '@/common/i18n';

const floatingPanelVariants = {
  hidden: {
    opacity: 0,
    y: -14,
    scale: 0.985,
    transition: {
      duration: 0.22,
      ease: 'easeInOut' as const,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.985,
    transition: {
      duration: 0.2,
      ease: 'easeInOut' as const,
    },
  },
};

export function AdminNavbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { isPersian, isRTL } = useTranslation();
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useAdminSidebar();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navShortcuts = [
    { titleFa: 'داشبورد', titleEn: 'Dashboard', href: PATHS.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { titleFa: 'محصولات', titleEn: 'Products', href: PATHS.ADMIN_PRODUCTS, icon: Package },
    { titleFa: 'سفارشات', titleEn: 'Orders', href: PATHS.ADMIN_ORDERS, icon: ShoppingBag },
    { titleFa: 'کاربران', titleEn: 'Users', href: PATHS.ADMIN_USERS, icon: Users },
  ];

  return (
    <header className="sticky top-2 sm:top-4 z-[70] w-full px-3 sm:px-4 lg:px-8 mb-4 sm:mb-6 transition-all pointer-events-none">
      <div className="max-w-[1600px] mx-auto relative pointer-events-auto" ref={navbarRef}>
        <HeroNavbar
          isBordered={false}
          maxWidth="full"
          position="static"
          classNames={{
            base: 'bg-transparent p-0 overflow-visible',
            wrapper:
              'h-16 sm:h-[68px] px-3 sm:px-6 rounded-[32px] bg-[#1c231c]/90 dark:bg-[#181f18]/90 backdrop-blur-xl border border-[#2e3a2e] shadow-2xl flex items-center justify-between select-none max-w-full gap-2 sm:gap-4',
          }}
        >
          {/* Right Section: Sidebar Toggle + Brand Logo + Admin Badge */}
          <NavbarContent justify="start" className="gap-2 sm:gap-3 shrink-0 items-center">
            {/* Sidebar Toggle Button (Desktop & Mobile) */}
            <Tooltip
              content={
                isCollapsed
                  ? isPersian ? 'باز کردن منوی کناری' : 'Expand Sidebar'
                  : isPersian ? 'جمع کردن منوی کناری' : 'Collapse Sidebar'
              }
              placement="bottom"
              delay={300}
              classNames={{
                content:
                  'bg-[#1c231c] text-[#f7f4ee] border border-brand-gold/40 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl z-50',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    toggleMobileSidebar();
                  } else {
                    toggleSidebar();
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-[#242c24] hover:bg-[#2e3a2e] text-brand-gold border border-[#3e4c3e] hover:border-brand-gold/60 transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center select-none group"
                aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {/* Mobile icon */}
                <span className="lg:hidden flex items-center justify-center">
                  {isMobileOpen ? (
                    <X className="w-4 h-4 text-brand-gold" />
                  ) : (
                    <Menu className="w-4 h-4 text-brand-gold" />
                  )}
                </span>
                {/* Desktop icon */}
                <span className="hidden lg:flex items-center justify-center">
                  {isRTL ? (
                    isCollapsed ? (
                      <PanelRightOpen className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                    ) : (
                      <PanelRightClose className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                    )
                  ) : (
                    isCollapsed ? (
                      <PanelLeftOpen className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                    )
                  )}
                </span>
              </button>
            </Tooltip>

            <NavbarBrand className="shrink-0 grow-0 flex items-center gap-2.5">
              <Link href={PATHS.ADMIN_DASHBOARD} className="flex items-center gap-2">
                <BrandLogo size="md" variant="dark" simple={true} hideTextOnMobile={false} />
              </Link>
              <Chip
                size="sm"
                variant="flat"
                startContent={<ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                className="bg-brand-gold/15 border border-brand-gold/30 text-brand-gold font-black text-[11px] h-6 px-2.5 rounded-full hidden sm:flex"
              >
                {isPersian ? 'پنل مدیریت' : 'Admin Portal'}
              </Chip>
            </NavbarBrand>

            {/* Quick Admin Navigation Shortcuts (Desktop) */}
            <NavbarItem className="hidden md:flex items-center gap-1.5 pr-4 border-r border-[#3e4c3e]/50 mr-1">
              {navShortcuts.map((nav) => {
                const isActive =
                  pathname === nav.href ||
                  (nav.href !== PATHS.ADMIN_DASHBOARD && pathname.startsWith(nav.href));
                const Icon = nav.icon;
                return (
                  <Button
                    key={nav.href}
                    as={Link}
                    href={nav.href}
                    size="sm"
                    radius="full"
                    variant={isActive ? 'solid' : 'light'}
                    className={`h-8 px-3.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-gold text-[#141914] font-black shadow-xs'
                        : 'text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]'
                    }`}
                    startContent={<Icon className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{isPersian ? nav.titleFa : nav.titleEn}</span>
                  </Button>
                );
              })}
            </NavbarItem>
          </NavbarContent>

          {/* Left Section: View Storefront, Theme Toggle, Profile Menu */}
          <NavbarContent justify="end" className="gap-2 sm:gap-3 shrink-0 flex items-center">
            {/* View Storefront Quick Button */}
            <Button
              as={Link}
              href={PATHS.HOME}
              size="sm"
              radius="full"
              variant="flat"
              startContent={<ExternalLink className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
              className="hidden sm:flex h-9 px-3.5 text-xs font-bold text-[#e6dcce] bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-brand-gold/50 transition-all rounded-full"
            >
              <span>{isPersian ? 'مشاهده فروشگاه' : 'Storefront'}</span>
            </Button>

            {/* Theme Toggle Button */}
            <div className="flex items-center justify-center w-10 h-10 shrink-0">
              <ThemeToggle className="w-10 h-10 min-w-10 max-w-10 rounded-full bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#f7f4ee] transition-colors shadow-sm flex items-center justify-center p-0" />
            </div>

            {/* Profile Dropdown */}
            <div className="relative flex items-center justify-center shrink-0">
              <Button
                radius="full"
                variant="flat"
                onPress={() => setIsProfileOpen((prev) => !prev)}
                className={`h-10 px-2.5 sm:px-3 rounded-full ${
                  isProfileOpen
                    ? 'bg-[#bfa27a] text-[#141914] border-transparent'
                    : 'bg-[#242c24] hover:bg-[#2e3a2e] border border-[#3e4c3e] hover:border-[#bfa27a]/60 text-[#e6dcce] hover:text-[#f7f4ee]'
                } transition-all shadow-sm flex items-center gap-2`}
                aria-label="حساب کاربری مدیریت"
              >
                <Avatar
                  name={user?.fullName || 'Admin'}
                  fallback={<User className="w-3.5 h-3.5 text-brand-gold" />}
                  classNames={{
                    base: 'w-6 h-6 text-[10px] bg-brand-gold/20 text-brand-gold font-bold',
                    name: 'text-[10px] font-black',
                  }}
                />
                <span className="text-xs font-black hidden md:inline truncate max-w-28">
                  {user?.fullName || (isPersian ? 'مدیر سیستم' : 'Admin')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </Button>

              {/* Profile Dropdown Panel */}
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setIsProfileOpen(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden z-40"
                    />

                    <motion.div
                      key="admin-profile-dropdown"
                      variants={floatingPanelVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="fixed sm:absolute inset-x-3 sm:inset-auto top-[76px] sm:top-full left-0 sm:left-0 mt-0 sm:mt-3.5 w-auto sm:w-68 max-w-[calc(100vw-24px)] sm:max-w-none mx-auto sm:mx-0 bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-3xl border border-[#2e3a2e] rounded-3xl p-4 shadow-2xl z-50 overflow-hidden text-right origin-top"
                    >
                      {isAuthenticated && user ? (
                        <>
                          <div className="pb-3 border-b border-[#2e3a2e] mb-2">
                            <div className="text-sm font-black text-[#f7f4ee] truncate">{user.fullName}</div>
                            <div className="text-[11px] font-mono text-[#a69c8e] truncate mt-0.5">{user.email}</div>
                            <div className="mt-2">
                              <Chip
                                size="sm"
                                variant="flat"
                                startContent={<ShieldCheck className="w-3 h-3 text-brand-gold shrink-0" />}
                                className="bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] font-black h-5.5 rounded-xl px-2"
                              >
                                {user.role === 'admin'
                                  ? isPersian ? 'مدیر کل (Admin)' : 'Admin'
                                  : isPersian ? 'ویراستار (Editor)' : 'Editor'}
                              </Chip>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-xs font-bold">
                            <Link
                              href={PATHS.PROFILE}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#f7f4ee] hover:bg-[#242c24] transition-colors"
                            >
                              <User className="w-4 h-4 text-[#a69c8e]" />
                              <span>{isPersian ? 'پروفایل کاربری و سفارش‌ها' : 'User Profile'}</span>
                            </Link>

                            <Link
                              href={PATHS.HOME}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#bfa27a] hover:bg-[#242c24] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>{isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}</span>
                            </Link>

                            <div className="w-full h-px bg-[#2e3a2e] my-1" />

                            <button
                              onClick={() => {
                                dispatch(logout());
                                setIsProfileOpen(false);
                              }}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl text-rose-500 hover:text-rose-400 font-black transition-colors text-right w-full cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 shrink-0" />
                              <span>{isPersian ? 'خروج از حساب' : 'Log Out'}</span>
                            </button>
                          </div>
                        </>
                      ) : null}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </NavbarContent>
        </HeroNavbar>
      </div>
    </header>
  );
}
