'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Avatar, Button, Chip, Tooltip } from '@heroui/react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Award,
  Sparkles,
  ShoppingBag,
  Ticket,
  Crown,
  Users,
  LayoutTemplate,
  ExternalLink,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';
import { useAdminSidebar } from './AdminSidebarContext';

interface NavItem {
  titleFa: string;
  titleEn: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isPersian, isRTL } = useTranslation();
  const isAdmin = user?.role === 'admin';
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar, closeMobileSidebar } =
    useAdminSidebar();

  const menuItems: NavItem[] = [
    { titleFa: 'داشبورد و آمار فروش', titleEn: 'Dashboard & Sales', href: PATHS.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { titleFa: 'مدیریت محصولات و عطرها', titleEn: 'Products & Perfumes', href: PATHS.ADMIN_PRODUCTS, icon: Package },
    { titleFa: 'دسته‌بندی‌ها', titleEn: 'Categories', href: PATHS.ADMIN_CATEGORIES, icon: Layers },
    { titleFa: 'برندها و خانه‌های عطر', titleEn: 'Brands & Houses', href: PATHS.ADMIN_BRANDS, icon: Award },
    { titleFa: 'تنوع‌ها و ویژگی‌های عطر', titleEn: 'Variants & Attributes', href: PATHS.ADMIN_ATTRIBUTES, icon: Sparkles },
    { titleFa: 'مدیریت سفارشات', titleEn: 'Orders Management', href: PATHS.ADMIN_ORDERS, icon: ShoppingBag },
    { titleFa: 'کدهای تخفیف', titleEn: 'Discount Coupons', href: PATHS.ADMIN_COUPONS, icon: Ticket, adminOnly: true },
    { titleFa: 'پلن‌های اشتراک VIP', titleEn: 'VIP Subscription Plans', href: PATHS.ADMIN_VIP_PLANS, icon: Crown, adminOnly: true },
    { titleFa: 'مدیریت کاربران و نقش‌ها', titleEn: 'Users & Roles', href: PATHS.ADMIN_USERS, icon: Users },
    { titleFa: 'شخصی‌ساز صفحات و بخش‌ها', titleEn: 'Page Sections Customizer', href: PATHS.ADMIN_PAGE_SECTIONS, icon: LayoutTemplate },
  ];

  const activeItem =
    menuItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== PATHS.ADMIN_DASHBOARD && pathname.startsWith(item.href))
    ) || menuItems[0];
  const ActiveIcon = activeItem.icon;

  const tooltipClass =
    'bg-[#1c231c] text-[#f7f4ee] border border-brand-gold/40 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl z-50';

  return (
    <>
      {/* ========================================================================= */}
      {/* ======================= MOBILE ACCORDION (< lg) ========================= */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full space-y-3">
        {/* Mobile Header Bar */}
        <div className="w-full bg-[#1c231c]/90 dark:bg-[#151a15]/90 backdrop-blur-xl rounded-2xl p-3 border border-[#2e3a2e] shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-black text-[#f7f4ee] truncate block">
                {isPersian ? activeItem.titleFa : activeItem.titleEn}
              </span>
              <span className="text-[10px] text-[#a69c8e] block font-medium">
                {isPersian ? 'منوی پنل مدیریت' : 'Admin Menu'}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="flat"
            onPress={toggleMobileSidebar}
            className="text-xs font-bold h-8 rounded-xl bg-[#242c24] text-brand-gold border border-brand-gold/30 hover:border-brand-gold shrink-0 cursor-pointer"
            startContent={
              isMobileOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />
            }
          >
            {isMobileOpen
              ? isPersian ? 'بستن منو' : 'Close'
              : isPersian ? 'مشاهده منو' : 'Menu'}
          </Button>
        </div>

        {/* Mobile Expanded Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Card className="bg-[#1c231c]/95 dark:bg-[#151a15]/95 backdrop-blur-2xl rounded-3xl p-4 border border-[#2e3a2e] shadow-2xl space-y-4">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#2e3a2e]">
                  <Avatar
                    name={user?.fullName || 'Admin'}
                    fallback={<UserIcon className="w-4 h-4 text-brand-gold" />}
                    classNames={{
                      base: 'w-10 h-10 bg-[#242c24] text-brand-gold font-bold text-sm border border-brand-gold/30 shrink-0 rounded-xl',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-black text-[#f7f4ee] truncate">
                      {user?.fullName || (isPersian ? 'مدیر سیستم' : 'Administrator')}
                    </h2>
                    <div className="text-[10px] text-[#a69c8e] font-mono truncate">
                      {user?.email || 'admin@hatefaroma.com'}
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    className="bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] font-bold h-5 px-2 rounded-lg"
                  >
                    {isAdmin
                      ? isPersian ? 'مدیر ارشد' : 'Admin'
                      : isPersian ? 'ویراستار' : 'Editor'}
                  </Chip>
                </div>

                {/* Mobile Menu Links */}
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== PATHS.ADMIN_DASHBOARD && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileSidebar}
                        className={`flex items-center justify-between w-full h-10 px-3 rounded-xl text-xs font-bold transition-colors select-none ${
                          isActive
                            ? 'bg-brand-gold text-[#141914] font-black shadow-xs'
                            : 'text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#141914]' : 'text-brand-gold'
                            }`}
                          />
                          <span className="truncate">
                            {isPersian ? item.titleFa : item.titleEn}
                          </span>
                        </div>
                        {isRTL ? (
                          <ChevronLeft
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-[#141914]' : 'opacity-40 text-[#a69c8e]'
                            }`}
                          />
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-[#141914]' : 'opacity-40 text-[#a69c8e]'
                            }`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile Footer Links */}
                <div className="pt-3 border-t border-[#2e3a2e] space-y-1.5">
                  <Button
                    as={Link}
                    href={PATHS.HOME}
                    variant="light"
                    size="sm"
                    className="w-full h-9 justify-start gap-2.5 px-3 text-xs font-bold text-[#bfa27a] hover:bg-[#242c24] rounded-xl"
                    startContent={<ExternalLink className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}</span>
                  </Button>

                  <Button
                    onPress={() => dispatch(logout())}
                    variant="light"
                    size="sm"
                    className="w-full h-9 justify-start gap-2.5 px-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl"
                    startContent={<LogOut className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span>{isPersian ? 'خروج از حساب' : 'Log Out'}</span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* ===================== DESKTOP SIDEBAR (>= lg) =========================== */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full">
        <Card
          className={`bg-[#1c231c]/90 dark:bg-[#151a15]/90 backdrop-blur-xl rounded-3xl border border-[#2e3a2e] shadow-xl sticky top-24 transition-all duration-300 ${
            isCollapsed ? 'p-2.5 w-[76px]' : 'p-4 sm:p-5 w-full space-y-5'
          }`}
        >
          {/* -------------------- EXPANDED DESKTOP VIEW -------------------- */}
          {!isCollapsed && (
            <>
              {/* Admin User Header with Collapse Button */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#2e3a2e]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar
                    name={user?.fullName || 'Admin'}
                    fallback={<UserIcon className="w-5 h-5 text-brand-gold" />}
                    classNames={{
                      base: 'w-11 h-11 bg-gradient-to-br from-[#242c24] to-[#141914] text-brand-gold font-black text-sm border-2 border-brand-gold/30 shadow-md shrink-0 rounded-2xl',
                      name: 'font-black text-sm text-brand-gold',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black text-[#f7f4ee] truncate">
                      {user?.fullName || (isPersian ? 'مدیر سیستم' : 'Administrator')}
                    </h2>
                    <div className="text-[11px] text-[#a69c8e] font-mono truncate mt-0.5">
                      {user?.email || 'admin@hatefaroma.com'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Chip
                        size="sm"
                        variant="flat"
                        startContent={<ShieldCheck className="w-3 h-3 text-brand-gold shrink-0" />}
                        classNames={{
                          base: 'bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[10px] font-black h-5 rounded-xl px-2',
                          content: 'px-0.5',
                        }}
                      >
                        {isAdmin
                          ? isPersian ? 'مدیر ارشد (Super Admin)' : 'Super Admin'
                          : isPersian ? 'ویراستار محتوا (Editor)' : 'Content Editor'}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Collapse Toggle Button */}
                <Tooltip
                  content={isPersian ? 'جمع کردن منوی کناری' : 'Collapse Sidebar'}
                  placement={isRTL ? 'left' : 'right'}
                  delay={200}
                  classNames={{ content: tooltipClass }}
                >
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="w-8 h-8 rounded-xl text-brand-gold/80 hover:text-brand-gold hover:bg-[#242c24] border border-transparent hover:border-brand-gold/30 flex items-center justify-center transition-all cursor-pointer shrink-0 select-none group"
                    aria-label="Collapse Sidebar"
                  >
                    {isRTL ? (
                      <PanelRightClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </Tooltip>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== PATHS.ADMIN_DASHBOARD && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center justify-between w-full h-11 px-3.5 rounded-2xl text-xs font-bold transition-colors select-none group cursor-pointer ${
                        isActive
                          ? 'text-[#141914] font-black'
                          : 'text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]/70'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActivePill"
                          className="absolute inset-0 bg-brand-gold rounded-2xl shadow-md shadow-brand-gold/20"
                          transition={{
                            type: 'spring',
                            stiffness: 460,
                            damping: 34,
                          }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#141914]' : 'text-brand-gold group-hover:text-[#f7f4ee]'
                          }`}
                        />
                        <span className="truncate">
                          {isPersian ? item.titleFa : item.titleEn}
                        </span>
                      </div>
                      <div className="relative z-10 flex items-center">
                        {isRTL ? (
                          <ChevronLeft
                            className={`w-3.5 h-3.5 transition-colors ${
                              isActive ? 'text-[#141914]' : 'opacity-40 text-[#a69c8e] group-hover:opacity-80'
                            }`}
                          />
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-colors ${
                              isActive ? 'text-[#141914]' : 'opacity-40 text-[#a69c8e] group-hover:opacity-80'
                            }`}
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Navigation Options */}
              <div className="pt-3 border-t border-[#2e3a2e] space-y-1.5">
                <Button
                  as={Link}
                  href={PATHS.HOME}
                  variant="light"
                  radius="full"
                  className="w-full h-10 justify-start gap-2.5 px-3.5 text-xs font-bold text-[#bfa27a] hover:bg-[#242c24] hover:text-[#d4be9b] transition-colors"
                  startContent={<ExternalLink className="w-4 h-4 shrink-0" />}
                >
                  <span>{isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}</span>
                </Button>

                <Button
                  onPress={() => dispatch(logout())}
                  variant="light"
                  radius="full"
                  className="w-full h-10 justify-start gap-2.5 px-3.5 text-xs font-black text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  startContent={<LogOut className="w-4 h-4 shrink-0" />}
                >
                  <span>{isPersian ? 'خروج از حساب' : 'Log Out'}</span>
                </Button>
              </div>
            </>
          )}

          {/* -------------------- COLLAPSED DESKTOP VIEW (MINI-BAR) -------------------- */}
          {isCollapsed && (
            <div className="flex flex-col items-center space-y-3 py-1">
              {/* Expand Toggle Button */}
              <Tooltip
                content={isPersian ? 'باز کردن منوی کناری' : 'Expand Sidebar'}
                placement={isRTL ? 'left' : 'right'}
                delay={200}
                classNames={{ content: tooltipClass }}
              >
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-11 h-11 rounded-2xl bg-[#242c24] hover:bg-[#2e3a2e] text-brand-gold border border-brand-gold/40 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 select-none group"
                  aria-label="Expand Sidebar"
                >
                  {isRTL ? (
                    <PanelRightOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ) : (
                    <PanelLeftOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </Tooltip>

              {/* Compact Avatar with User Info Tooltip */}
              <Tooltip
                content={`${user?.fullName || 'Admin'} (${isAdmin ? (isPersian ? 'مدیر ارشد' : 'Admin') : (isPersian ? 'ویراستار' : 'Editor')})`}
                placement={isRTL ? 'left' : 'right'}
                delay={200}
                classNames={{ content: tooltipClass }}
              >
                <div className="relative pb-2 border-b border-[#2e3a2e] w-full flex justify-center">
                  <Avatar
                    name={user?.fullName || 'Admin'}
                    fallback={<UserIcon className="w-4 h-4 text-brand-gold" />}
                    classNames={{
                      base: 'w-10 h-10 bg-gradient-to-br from-[#242c24] to-[#141914] text-brand-gold font-black text-xs border border-brand-gold/30 shadow-md shrink-0 rounded-2xl cursor-default',
                    }}
                  />
                  <span
                    className={`absolute bottom-2.5 ${
                      isRTL ? 'left-2.5' : 'right-2.5'
                    } w-2.5 h-2.5 rounded-full border-2 border-[#1c231c] ${
                      isAdmin ? 'bg-brand-gold' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </Tooltip>

              {/* Collapsed Menu Items (Icons only with Tooltips) */}
              <nav className="space-y-1.5 w-full flex flex-col items-center">
                {menuItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== PATHS.ADMIN_DASHBOARD && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Tooltip
                      key={item.href}
                      content={isPersian ? item.titleFa : item.titleEn}
                      placement={isRTL ? 'left' : 'right'}
                      delay={100}
                      classNames={{ content: tooltipClass }}
                    >
                      <Link
                        href={item.href}
                        className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-brand-gold text-[#141914] shadow-md shadow-brand-gold/25 font-black'
                            : 'text-[#e6dcce] hover:text-[#f7f4ee] hover:bg-[#242c24]'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-[#141914]' : 'text-brand-gold'
                          }`}
                        />
                      </Link>
                    </Tooltip>
                  );
                })}
              </nav>

              {/* Collapsed Footer Actions */}
              <div className="pt-2 border-t border-[#2e3a2e] w-full flex flex-col items-center space-y-1.5">
                <Tooltip
                  content={isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}
                  placement={isRTL ? 'left' : 'right'}
                  delay={100}
                  classNames={{ content: tooltipClass }}
                >
                  <Link
                    href={PATHS.HOME}
                    className="flex items-center justify-center w-11 h-11 rounded-2xl text-[#bfa27a] hover:bg-[#242c24] hover:text-[#d4be9b] transition-colors group cursor-pointer"
                  >
                    <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </Tooltip>

                <Tooltip
                  content={isPersian ? 'خروج از حساب' : 'Log Out'}
                  placement={isRTL ? 'left' : 'right'}
                  delay={100}
                  classNames={{
                    content:
                      'bg-[#1c231c] text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl z-50',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => dispatch(logout())}
                    className="flex items-center justify-center w-11 h-11 rounded-2xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer group"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
