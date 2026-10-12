'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { toast } from '@/common/utils';
import { PATHS } from '@/common/constants/PATHS';
import { logout } from './authSlice';
import { useAppDispatch } from '../hooks';

export function useLogoutConfirmation(isPersian = true) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const confirmLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await dispatch(logout()).unwrap();
      setIsOpen(false);
      toast.error(isPersian ? 'از حساب کاربری خارج شدید.' : 'You have signed out.');
      router.replace(PATHS.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestLogout: () => setIsOpen(true),
    dialog: (
      <AdminConfirmModal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!isLoading) setIsOpen(open);
        }}
        title={isPersian ? 'خروج از حساب' : 'Sign out'}
        description={isPersian ? 'مطمئنی می‌خواهی از حساب کاربری خارج شوی؟' : 'Are you sure you want to sign out of your account?'}
        confirmText={isPersian ? 'بله، خروج از حساب' : 'Yes, sign out'}
        cancelText={isPersian ? 'ادامهٔ فعالیت' : 'Stay signed in'}
        confirmColor="danger"
        icon={<LogOut className="h-4 w-4" />}
        isLoading={isLoading}
        onConfirm={confirmLogout}
      />
    ),
  };
}
