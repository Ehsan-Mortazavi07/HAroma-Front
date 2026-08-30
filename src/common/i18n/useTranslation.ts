'use client';

import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setLang, LangMode } from '@/stores/ui/uiSlice';
import { translations } from './translations';

export function useTranslation() {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.ui.lang) as 'fa' | 'en';
  const isPersian = lang === 'fa';
  const isRTL = isPersian;

  const t = translations[lang] || translations.fa;

  const changeLanguage = (newLang: LangMode) => {
    dispatch(setLang(newLang));
  };

  return {
    t,
    lang,
    isPersian,
    isRTL,
    changeLanguage,
  };
}

export * from './translations';
