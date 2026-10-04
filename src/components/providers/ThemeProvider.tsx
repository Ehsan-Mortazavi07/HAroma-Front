'use client';

import React, { useEffect, useState } from 'react';
import { hydratePreferences } from '@/stores/ui/uiSlice';
import type { LangMode, ThemeMode } from '@/stores/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const lang = useAppSelector((state) => state.ui.lang);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let savedTheme: string | null = null;
    let savedLang: string | null = null;
    try {
      savedTheme = localStorage.getItem('hatefaroma_theme');
      savedLang = localStorage.getItem('hatefaroma_lang');
    } catch {
      // Keep the defaults when browser storage is unavailable.
    }
    const validThemes: ThemeMode[] = ['light', 'dark', 'system'];
    const validLanguages: LangMode[] = ['fa', 'en'];

    dispatch(
      hydratePreferences({
        theme: validThemes.includes(savedTheme as ThemeMode) ? (savedTheme as ThemeMode) : 'dark',
        lang: validLanguages.includes(savedLang as LangMode) ? (savedLang as LangMode) : 'fa',
      }),
    );
    setPreferencesLoaded(true);
  }, [dispatch]);

  useEffect(() => {
    if (!preferencesLoaded) return;

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
  }, [theme, lang, preferencesLoaded]);

  return <>{children}</>;
}
