'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';
import { AdminSidebarProvider } from '@/components/admin/AdminSidebarContext';
import { Footer } from '@/components/common/Footer';

const AdminNavbar = dynamic(() =>
  import('@/components/admin/AdminNavbar').then((module) => module.AdminNavbar),
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isAuth = pathname?.startsWith('/auth');

  if (isAdmin) {
    return (
      <AdminSidebarProvider>
        <div className="min-h-screen flex flex-col bg-[#f8f5f0] dark:bg-[#141914] text-[#1d241d] dark:text-[#f7f4ee] font-sans transition-colors">
          <AdminNavbar />
          <div aria-hidden="true" className="h-20 shrink-0 sm:h-[92px]" />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </AdminSidebarProvider>
    );
  }

  if (isAuth) {
    return (
      <div className="min-h-screen h-screen flex flex-col bg-[#f8f5f0] dark:bg-[#141914] text-[#1d241d] dark:text-[#f7f4ee] overflow-hidden">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
