'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, Avatar, Button, Chip } from '@heroui/react';
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
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

interface NavItem {
  titleFa: string;
  titleEn: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const sidebarContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
};

const sidebarItemVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 30,
    },
  },
};

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isPersian, isRTL } = useTranslation();
  const isAdmin = user?.role === 'admin';

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

  return (
    <Card className="bg-[#1c231c]/90 dark:bg-[#151a15]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-[#2e3a2e] shadow-xl space-y-5 sticky top-24 w-full">
      {/* Admin User Header (Matching ProfilePage style) */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[#2e3a2e]">
        <Avatar
          name={user?.fullName || 'Admin'}
          fallback={<UserIcon className="w-5 h-5 text-brand-gold" />}
          classNames={{
            base: 'w-12 h-12 bg-gradient-to-br from-[#242c24] to-[#141914] text-brand-gold font-black text-base border-2 border-brand-gold/30 shadow-md shadow-brand-gold/10 shrink-0 rounded-2xl',
            name: 'font-black text-base text-brand-gold',
          }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-[#f7f4ee] truncate">
            {user?.fullName || (isPersian ? 'مدیر سیستم' : 'Administrator')}
          </h2>
          <div className="text-[11px] text-[#a69c8e] font-mono mt-0.5 truncate">
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
    </Card>
  );
}
