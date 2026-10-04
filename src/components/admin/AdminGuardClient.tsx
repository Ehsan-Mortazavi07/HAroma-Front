'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/stores/hooks';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function AdminGuardClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const { isPersian } = useTranslation();

  const hasAdminPanelRole = isAuthenticated && (user?.role === 'admin' || user?.role === 'editor');
  const adminOnlyRoutes = ['/admin/vip-plans', '/admin/coupons'];
  const isRestrictedForEditor =
    user?.role === 'editor' && adminOnlyRoutes.some((route) => pathname.startsWith(route));
  const isAuthorized = hasAdminPanelRole && !isRestrictedForEditor;

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace(PATHS.FORBIDDEN);
    }
  }, [isAuthorized, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141914] text-[#f7f4ee]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#bfa27a] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#d4be9b]">
            {isPersian ? 'در حال اعتبارسنجی سطح دسترسی...' : 'Verifying access credentials...'}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
