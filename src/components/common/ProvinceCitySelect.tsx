'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Building, ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IRAN_PROVINCES } from '@/common/constants/iranProvinces';
import { useTranslation } from '@/common/i18n';

interface ProvinceCitySelectProps {
  province: string;
  city: string;
  onChangeProvince?: (province: string) => void;
  onChangeCity?: (city: string) => void;
  onChange?: (val: { province: string; city: string }) => void;
  disabled?: boolean;
  required?: boolean;
  provinceError?: string;
  cityError?: string;
  className?: string;
}

export function ProvinceCitySelect({
  province,
  city,
  onChangeProvince,
  onChangeCity,
  onChange,
  disabled = false,
  required = false,
  provinceError,
  cityError,
  className = '',
}: ProvinceCitySelectProps) {
  const { isPersian } = useTranslation();

  const [openDropdown, setOpenDropdown] = useState<'province' | 'city' | null>(null);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const provinceListRef = useRef<HTMLDivElement>(null);
  const cityListRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside in capture phase
  useEffect(() => {
    if (!openDropdown) return;

    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (openDropdown === 'province' && provinceRef.current && !provinceRef.current.contains(target)) {
        setOpenDropdown(null);
      } else if (openDropdown === 'city' && cityRef.current && !cityRef.current.contains(target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  // Reset search queries when dropdown opens/closes
  useEffect(() => {
    if (openDropdown === 'province') {
      setProvinceSearch('');
    } else if (openDropdown === 'city') {
      setCitySearch('');
    }
  }, [openDropdown]);

  // Current province object
  const currentProvinceObj = useMemo(() => {
    return IRAN_PROVINCES.find((p) => p.name === province);
  }, [province]);

  // Available cities for the selected province
  const availableCities = useMemo(() => {
    return currentProvinceObj ? currentProvinceObj.cities : [];
  }, [currentProvinceObj]);

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return IRAN_PROVINCES;
    const q = provinceSearch.trim().toLowerCase();
    return IRAN_PROVINCES.filter((p) => p.name.toLowerCase().includes(q));
  }, [provinceSearch]);

  // Filtered cities
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    const q = citySearch.trim().toLowerCase();
    return availableCities.filter((c) => c.toLowerCase().includes(q));
  }, [availableCities, citySearch]);

  // Auto-scroll to selected element on open
  useEffect(() => {
    if (openDropdown === 'province' && provinceListRef.current) {
      const sel = provinceListRef.current.querySelector('[data-selected="true"]');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    } else if (openDropdown === 'city' && cityListRef.current) {
      const sel = cityListRef.current.querySelector('[data-selected="true"]');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
  }, [openDropdown]);

  const handleSelectProvince = (provName: string) => {
    onChangeProvince?.(provName);
    const targetObj = IRAN_PROVINCES.find((p) => p.name === provName);
    let nextCity = city;
    if (targetObj) {
      if (!targetObj.cities.includes(city)) {
        nextCity = targetObj.cities[0] || '';
        onChangeCity?.(nextCity);
      }
    } else {
      nextCity = '';
      onChangeCity?.('');
    }
    onChange?.({ province: provName, city: nextCity });
    setOpenDropdown(null);
  };

  const handleSelectCity = (cityName: string) => {
    onChangeCity?.(cityName);
    onChange?.({ province, city: cityName });
    setOpenDropdown(null);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 relative ${className}`}>
      {/* Province Selector */}
      <div ref={provinceRef} className="space-y-2 relative">
        <div className="flex items-center gap-1.5 h-5">
          <MapPin className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
          <label className="text-xs font-bold text-brand-text">
            {isPersian ? 'استان' : 'Province / State'}
          </label>
          {required && <span className="text-rose-500 font-bold text-xs">*</span>}
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            aria-invalid={Boolean(provinceError)}
            onClick={() => setOpenDropdown(openDropdown === 'province' ? null : 'province')}
            className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
              openDropdown === 'province'
                ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                : provinceError
                ? 'border-rose-500 hover:border-rose-500'
                : 'border-brand-border hover:border-brand-gold/70'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`text-xs font-bold truncate ${province ? 'text-brand-text' : 'text-brand-text-muted'}`}>
              {province || (isPersian ? 'انتخاب استان...' : 'Select Province...')}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                openDropdown === 'province' ? 'rotate-180 text-brand-gold' : 'opacity-70'
              }`}
            />
          </button>

          {/* Province Dropdown Menu */}
          <AnimatePresence>
            {openDropdown === 'province' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-2 space-y-1.5 overscroll-contain origin-top"
              >
                {/* Search Bar */}
                <div className="relative px-1 pt-1 pb-1">
                  <Search className="w-3.5 h-3.5 text-brand-text-muted absolute right-3.5 top-3.5 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    placeholder={isPersian ? 'جستجوی استان...' : 'Search province...'}
                    className="w-full h-9 pr-8 pl-3 text-xs font-semibold rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text focus:outline-none focus:border-brand-gold"
                  />
                  {provinceSearch && (
                    <button
                      type="button"
                      onClick={() => setProvinceSearch('')}
                      className="absolute left-3 top-3 text-brand-text-muted hover:text-brand-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Province Items List */}
                <div ref={provinceListRef} className="max-h-56 overflow-y-auto space-y-0.5 p-0.5 overscroll-contain">
                  {filteredProvinces.length === 0 ? (
                    <div className="p-3 text-center text-xs text-brand-text-muted">
                      {isPersian ? 'استانی با این نام یافت نشد' : 'No province found'}
                    </div>
                  ) : (
                    filteredProvinces.map((p) => {
                      const isSelected = p.name === province;
                      return (
                        <button
                          key={`prov-${p.name}`}
                          data-selected={isSelected ? 'true' : 'false'}
                          type="button"
                          onClick={() => handleSelectProvince(p.name)}
                          className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-gold text-[#141914]'
                              : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                          }`}
                        >
                          <span>{p.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {provinceError && (
          <p role="alert" className="text-[11px] font-bold text-rose-500">
            {provinceError}
          </p>
        )}
      </div>

      {/* City Selector */}
      <div ref={cityRef} className="space-y-2 relative">
        <div className="flex items-center gap-1.5 h-5">
          <Building className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
          <label className="text-xs font-bold text-brand-text">
            {isPersian ? 'شهر' : 'City'}
          </label>
          {required && <span className="text-rose-500 font-bold text-xs">*</span>}
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={disabled || !province}
            aria-invalid={Boolean(cityError)}
            onClick={() => setOpenDropdown(openDropdown === 'city' ? null : 'city')}
            className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
              openDropdown === 'city'
                ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                : cityError
                ? 'border-rose-500 hover:border-rose-500'
                : 'border-brand-border hover:border-brand-gold/70'
            } ${disabled || !province ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`text-xs font-bold truncate ${city ? 'text-brand-text' : 'text-brand-text-muted'}`}>
              {!province
                ? isPersian ? 'ابتدا استان را انتخاب کنید' : 'Select province first'
                : city || (isPersian ? 'انتخاب شهر...' : 'Select City...')}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                openDropdown === 'city' ? 'rotate-180 text-brand-gold' : 'opacity-70'
              }`}
            />
          </button>

          {/* City Dropdown Menu */}
          <AnimatePresence>
            {openDropdown === 'city' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-2 space-y-1.5 overscroll-contain origin-top"
              >
                {/* Search Bar */}
                <div className="relative px-1 pt-1 pb-1">
                  <Search className="w-3.5 h-3.5 text-brand-text-muted absolute right-3.5 top-3.5 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={isPersian ? 'جستجوی شهر...' : 'Search city...'}
                    className="w-full h-9 pr-8 pl-3 text-xs font-semibold rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text focus:outline-none focus:border-brand-gold"
                  />
                  {citySearch && (
                    <button
                      type="button"
                      onClick={() => setCitySearch('')}
                      className="absolute left-3 top-3 text-brand-text-muted hover:text-brand-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* City Items List */}
                <div ref={cityListRef} className="max-h-56 overflow-y-auto space-y-0.5 p-0.5 overscroll-contain">
                  {filteredCities.length === 0 ? (
                    <div className="p-3 text-center text-xs text-brand-text-muted">
                      {isPersian ? 'شهری با این نام یافت نشد' : 'No city found'}
                    </div>
                  ) : (
                    filteredCities.map((c) => {
                      const isSelected = c === city;
                      return (
                        <button
                          key={`city-${c}`}
                          data-selected={isSelected ? 'true' : 'false'}
                          type="button"
                          onClick={() => handleSelectCity(c)}
                          className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-gold text-[#141914]'
                              : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                          }`}
                        >
                          <span>{c}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {cityError && (
          <p role="alert" className="text-[11px] font-bold text-rose-500">
            {cityError}
          </p>
        )}
      </div>
    </div>
  );
}
