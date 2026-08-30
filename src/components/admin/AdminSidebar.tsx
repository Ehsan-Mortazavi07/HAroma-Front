'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  Ticket,
  Crown,
  Users,
  LayoutTemplate,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { BrandLogo } from '../common/BrandLogo';
import { useTranslation } from '@/common/i18n';

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
  const { isPersian } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const menuItems: NavItem[] = [
    { titleFa: 'داشبورد و آمار فروش', titleEn: 'Dashboard & Sales', href: PATHS.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { titleFa: 'مدیریت محصولات و عطرها', titleEn: 'Products & Perfumes', href: PATHS.ADMIN_PRODUCTS, icon: Package },
    { titleFa: 'دسته‌بندی‌ها', titleEn: 'Categories', href: PATHS.ADMIN_CATEGORIES, icon: Layers },
    { titleFa: 'تنوع‌ها و ویژگی‌های عطر', titleEn: 'Variants & Attributes', href: PATHS.ADMIN_ATTRIBUTES, icon: Sparkles },
    { titleFa: 'مدیریت سفارشات', titleEn: 'Orders Management', href: PATHS.ADMIN_ORDERS, icon: ShoppingBag },
    { titleFa: 'کدهای تخفیف', titleEn: 'Discount Coupons', href: PATHS.ADMIN_COUPONS, icon: Ticket, adminOnly: true },
    { titleFa: 'پلن‌های اشتراک VIP', titleEn: 'VIP Subscription Plans', href: PATHS.ADMIN_VIP_PLANS, icon: Crown, adminOnly: true },
    { titleFa: 'مدیریت کاربران و نقش‌ها', titleEn: 'Users & Roles', href: PATHS.ADMIN_USERS, icon: Users, adminOnly: true },
    { titleFa: 'شخصی‌ساز صفحات و بخش‌ها', titleEn: 'Page Sections Customizer', href: PATHS.ADMIN_PAGE_SECTIONS, icon: LayoutTemplate },
  ];

  return (
    <aside className="w-64 bg-[#171d17] text-[#f7f4ee] border-e border-[#2e3a2e] flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#2e3a2e]">
          <BrandLogo size="sm" variant="dark" />
          <div className="mt-2.5 px-2 py-1 rounded-lg bg-[#202620] border border-[#2e3a2e] flex items-center justify-between text-[11px]">
            <span className="text-[#a69c8e]">{isPersian ? 'نقش شما:' : 'Your Role:'}</span>
            <span className="font-extrabold text-[#d4be9b]">
              {user?.role === 'admin'
                ? isPersian ? 'مدیر کل (Admin)' : 'Admin'
                : isPersian ? 'ویراستار (Editor)' : 'Editor'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-sm font-black'
                    : 'text-[#e6dcce] hover:bg-[#202620] hover:text-[#f7f4ee]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1d241d]' : 'text-[#bfa27a]'}`} />
                <span>{isPersian ? item.titleFa : item.titleEn}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Exit Options */}
      <div className="p-4 border-t border-[#2e3a2e] space-y-2">
        <Link
          href={PATHS.HOME}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#d4be9b] hover:bg-[#202620] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}</span>
        </Link>

        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{isPersian ? 'خروج از حساب' : 'Log Out'}</span>
        </button>
      </div>
    </aside>
  );
}
