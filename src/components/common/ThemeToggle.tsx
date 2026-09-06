'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setTheme, ThemeMode } from '@/stores/ui/uiSlice';
import { useTranslation } from '@/common/i18n';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme);
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

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'light',
      label: 'حالت روشن',
      icon: <Sun className="w-4 h-4 text-[#9f815b]" />,
    },
    {
      mode: 'dark',
      label: 'حالت تاریک',
      icon: <Moon className="w-4 h-4 text-[#d4be9b]" />,
    },
    {
      mode: 'system',
      label: 'پیروی از سیستم',
      icon: <Monitor className="w-4 h-4 text-[#a69c8e]" />,
    },
  ];

  const handleSelect = (mode: ThemeMode) => {
    dispatch(setTheme(mode));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2a342a]/80 hover:bg-[#344034] text-[#f7f4ee] border border-[#bfa27a]/30 hover:border-[#bfa27a] transition-all shadow-sm"
        title="تغییر تم (روشن / تاریک / سیستم)"
        aria-label="تغییر تم"
      >
        {currentTheme === 'light' && <Sun className="w-5 h-5 text-[#d4be9b]" />}
        {currentTheme === 'dark' && <Moon className="w-5 h-5 text-[#bfa27a]" />}
        {currentTheme === 'system' && <Monitor className="w-5 h-5 text-[#e6dcce]" />}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? 'left-0' : 'right-0'
          } mt-2 w-44 rounded-2xl bg-[#1c231c] border border-[#3a473a] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-3 py-1.5 border-b border-[#2e3a2e] text-[11px] font-bold text-[#a69c8e]">
            انتخاب پوسته سایت
          </div>
          {options.map((opt) => {
            const isSelected = currentTheme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => handleSelect(opt.mode)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors ${
                  isSelected
                    ? 'bg-[#283228] text-[#d4be9b] font-bold'
                    : 'text-[#e6dcce] hover:bg-[#242c24] hover:text-[#f7f4ee]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{opt.label}</span>
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
