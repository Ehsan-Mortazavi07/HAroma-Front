'use client';

import React, { useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuardClient } from './AdminGuardClient';
import { useAdminSidebar } from './AdminSidebarContext';
import { useTranslation } from '@/common/i18n';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { isPersian, isRTL } = useTranslation();
  const pathname = usePathname();
  const { isCollapsed } = useAdminSidebar();

  useEffect(() => {
    document.title = isPersian
      ? 'پنل مدیریت هاتف آروما | HatefAroma'
      : 'Admin Dashboard | HatefAroma';
  }, [isPersian]);

  return (
    <AdminGuardClient>
      <div
        className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pb-12 transition-colors"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Admin Sidebar with smooth width transition */}
          <aside
            className={`shrink-0 w-full transition-[width] duration-300 ease-in-out ${
              isCollapsed ? 'lg:w-[76px]' : 'lg:w-72 xl:w-80'
            }`}
          >
            <AdminSidebar />
          </aside>

          {/* Admin Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            <motion.main
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </div>
    </AdminGuardClient>
  );
}
