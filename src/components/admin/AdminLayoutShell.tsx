'use client';

import React, { useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuardClient } from './AdminGuardClient';
import { useTranslation } from '@/common/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { isPersian, isRTL } = useTranslation();
  const pathname = usePathname();

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Admin Sidebar matching ProfilePage sidebar layout */}
          <aside className="lg:col-span-3 xl:col-span-3">
            <AdminSidebar />
          </aside>

          {/* Admin Main Content Area */}
          <div className="lg:col-span-9 xl:col-span-9 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {children}
              </motion.main>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminGuardClient>
  );
}
