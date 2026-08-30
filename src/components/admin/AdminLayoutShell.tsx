'use client';

import React, { useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminGuardClient } from './AdminGuardClient';
import { useTranslation } from '@/common/i18n';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { isPersian, isRTL } = useTranslation();

  useEffect(() => {
    document.title = isPersian
      ? 'پنل مدیریت هاتف آروما | HatefAroma'
      : 'Admin Dashboard | HatefAroma';
  }, [isPersian]);

  return (
    <AdminGuardClient>
      <div
        className="min-h-screen flex bg-[#f8f5f0] dark:bg-[#141914] text-[#1d241d] dark:text-[#f7f4ee] font-sans transition-colors"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminGuardClient>
  );
}
