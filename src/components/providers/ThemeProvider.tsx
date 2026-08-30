'use client';

import React, { useEffect } from 'react';
import { useAppSelector } from '@/stores/hooks';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.ui.theme);
  const lang = useAppSelector((state) => state.ui.lang);

  useEffect(() => {
    const root = document.documentElement;

    // Handle Language and Direction
    if (lang === 'fa') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'fa');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    }

    // Handle Theme
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme, lang]);

  return <>{children}</>;
}
