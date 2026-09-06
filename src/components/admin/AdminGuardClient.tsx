'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/stores/hooks';
import { PATHS } from '@/common/constants/PATHS';
import { toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export function AdminGuardClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { isPersian } = useTranslation();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error(isPersian ? 'لطفاً برای دسترسی به پنل مدیریت وارد شوید.' : 'Please sign in to access admin panel.');
      router.push(`${PATHS.SIGN_IN}?redirect=${pathname}`);
      return;
    }

    if (user.role !== 'admin' && user.role !== 'editor') {
      toast.error(isPersian ? 'شما سطح دسترسی لازم برای ورود به پنل مدیریت را ندارید.' : 'You do not have access to admin panel.');
      router.push(PATHS.HOME);
      return;
    }

    // Role-based route restrictions for editor
    const adminOnlyRoutes = [
      '/admin/vip-plans',
      '/admin/coupons',
      '/admin/products/new',
    ];

    const isRestrictedForEditor =
      user.role === 'editor' && adminOnlyRoutes.some((r) => pathname.startsWith(r));

    if (isRestrictedForEditor) {
      toast.error(isPersian ? 'این بخش فقط برای مدیر کل (Admin) مجاز است.' : 'This section is restricted to Super Admins.');
      router.push(pathname.startsWith('/admin/products') ? PATHS.ADMIN_PRODUCTS : PATHS.ADMIN_DASHBOARD);
      return;
    }

    setAuthorized(true);
  }, [isAuthenticated, user, pathname, router, isPersian]);

  if (!authorized) {
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
