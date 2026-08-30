import React from 'react';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata = {
  title: 'پنل مدیریت هاتف آروما | HatefAroma Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
