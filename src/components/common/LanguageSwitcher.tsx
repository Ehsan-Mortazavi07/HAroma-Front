'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setLang, LangMode } from '@/stores/ui/uiSlice';
import { useTranslation } from '@/common/i18n';

export function LanguageSwitcher() {
  const dispatch = useAppDispatch();
  const currentLang = useAppSelector((state) => state.ui.lang);
  const { isRTL } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: LangMode; name: string; nativeName: string; flag: string }[] = [
    {
      code: 'fa',
      name: 'Persian',
      nativeName: 'فارسی (FA)',
      flag: '🇮🇷',
    },
    /*
    {
      code: 'en',
      name: 'English',
      nativeName: 'English (EN)',
      flag: '🇬🇧',
    },
    */
  ];

  const handleSelect = (code: LangMode) => {
    dispatch(setLang(code));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a342a]/80 hover:bg-[#344034] text-[#f7f4ee] border border-[#bfa27a]/30 hover:border-[#bfa27a] text-xs font-bold transition-all shadow-sm"
        title="تغییر زبان / Switch Language"
        aria-label="تغییر زبان"
      >
        <Globe className="w-4 h-4 text-[#d4be9b]" />
        <span>{currentLang === 'fa' ? 'فارسی' : 'English'}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? 'left-0' : 'right-0'
          } mt-2 w-44 rounded-2xl bg-[#1c231c] border border-[#3a473a] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-3 py-1.5 border-b border-[#2e3a2e] text-[11px] font-bold text-[#a69c8e]">
            {currentLang === 'fa' ? 'انتخاب زبان سایت' : 'Select Language'}
          </div>
          {languages.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#283228] text-[#d4be9b] font-bold'
                    : 'text-[#e6dcce] hover:bg-[#242c24] hover:text-[#f7f4ee]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#bfa27a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
