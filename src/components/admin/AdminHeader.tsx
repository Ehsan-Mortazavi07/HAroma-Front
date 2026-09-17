'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Chip } from '@heroui/react';
import { ExternalLink, ShieldCheck, User } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function AdminHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const { isPersian } = useTranslation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-16 bg-[#ffffff] dark:bg-[#1c231c] border-b border-[#e6dcce] dark:border-[#2e3a2e] px-6 sm:px-8 flex items-center justify-between z-10 transition-colors shadow-xs"
    >
      {/* Left: User Welcome & Role Pill */}
      <div className="flex items-center gap-3">
        <Link
          href={PATHS.PROFILE}
          className="flex items-center gap-2.5 p-1.5 -m-1.5 rounded-2xl hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors group"
          title={isPersian ? 'ویرایش مشخصات حساب کاربری' : 'Edit Account Profile'}
        >
          <div className="w-8 h-8 rounded-xl bg-[#f0eae0] dark:bg-[#283228] border border-[#bfa27a]/30 flex items-center justify-center text-[#9f815b] group-hover:border-[#bfa27a] shrink-0 transition-colors">
            <User className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#73695c] dark:text-[#a69c8e] font-medium hidden sm:inline">
              {isPersian ? 'خوش آمدید،' : 'Welcome,'}
            </span>
            <span className="font-black text-[#1d241d] dark:text-[#f7f4ee] group-hover:text-[#9f815b] transition-colors">
              {user?.fullName
                ? !isPersian && user.fullName === 'مدیر کل هاتف آروما'
                  ? 'HatefAroma Super Admin'
                  : !isPersian && user.fullName === 'ویراستار محتوا'
                  ? 'Content Editor'
                  : user.fullName
                : isPersian ? 'مدیر سیستم' : 'Administrator'}
            </span>
            <Chip
              variant="flat"
              size="sm"
              startContent={<ShieldCheck className="w-3 h-3 text-[#9f815b] shrink-0" />}
              className="bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] border border-[#bfa27a]/30 text-[10px] font-extrabold h-6 px-2"
            >
              {user?.role === 'admin'
                ? isPersian ? 'مدیر ارشد' : 'Super Admin'
                : isPersian ? 'ویراستار' : 'Editor'}
            </Chip>
          </div>
        </Link>
      </div>

      {/* Right: Controls & Storefront Return */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <ThemeToggle />
        <LanguageSwitcher />

        <div className="h-5 w-px bg-[#e6dcce] dark:bg-[#2e3a2e] mx-0.5 hidden sm:block" />

        <Button
          as={Link}
          href={PATHS.HOME}
          size="sm"
          variant="flat"
          radius="full"
          className="flex items-center gap-1.5 h-8 px-3.5 bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] text-xs font-bold hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-all shadow-2xs cursor-pointer rounded-full"
          title={isPersian ? 'مشاهده وب‌سایت فروشگاه' : 'View Storefront'}
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#9f815b]" />
          <span className="hidden sm:inline">{isPersian ? 'سایت فروشگاه' : 'Storefront'}</span>
        </Button>
      </div>
    </motion.header>
  );
}
