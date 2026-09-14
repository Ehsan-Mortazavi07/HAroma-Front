'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setTheme } from '@/stores/ui/uiSlice';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme);

  const toggleTheme = () => {
    if (currentTheme === 'dark') {
      dispatch(setTheme('light'));
    } else {
      dispatch(setTheme('dark'));
    }
  };

  return (
    <Button
      isIconOnly
      radius="full"
      variant="flat"
      onPress={toggleTheme}
      className={
        className ||
        'flex items-center justify-center w-10 h-10 min-w-10 rounded-xl bg-[#2a342a]/80 hover:bg-[#344034] text-[#f7f4ee] border border-[#bfa27a]/30 hover:border-[#bfa27a] transition-all shadow-sm'
      }
      title="تغییر تم (روشن / تاریک)"
      aria-label="تغییر تم"
    >
      <AnimatePresence mode="wait" initial={false}>
        {currentTheme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          >
            <Sun className="w-5 h-5 text-[#d4be9b]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          >
            <Moon className="w-5 h-5 text-[#bfa27a]" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
