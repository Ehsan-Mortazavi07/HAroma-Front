import type { Metadata } from 'next';
import { Vazirmatn, Inter } from 'next/font/google';
import '@/assets/css/globals.css';
import '@/assets/css/rtl-heroui.css';
import { ClientProvider } from '@/components/providers/ClientProvider';
import { AppShell } from '@/components/layout/AppShell';

const vazir = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazir',
  fallback: ['Vazirmatn', 'Vazir', 'Tahoma', 'sans-serif'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'فروشگاه تخصصی عطر و ادکلن هاتف آروما | HatefAroma',
  description:
    'فروشگاه آنلاین عطر، ادکلن‌های نیش و محصولات لوکس بهداشتی هاتف آروما با ضمانت اصالت ۱۰۰٪، ارسال فوری و باشگاه اختصاصی مشتریان VIP.',
  icons: {
    icon: [
      { url: '/images/logo/hatef-aroma-logo-cropped.png', sizes: 'any' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/images/logo/hatef-aroma-logo-cropped.png' },
    ],
    shortcut: '/favicon.ico',
  },
  keywords: [
    'عطر و ادکلن',
    'هاتف آروما',
    'عطر نیش',
    'خرید ادکلن اصل',
    'عطر مردانه',
    'عطر زنانه',
    'تام فورد',
    'کرید اونتوس',
  ],
  authors: [{ name: 'HatefAroma Luxury Perfumery' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col selection:bg-[#bfa27a] selection:text-[#1d241d]">
        <ClientProvider>
          <AppShell>{children}</AppShell>
        </ClientProvider>
      </body>
    </html>
  );
}
