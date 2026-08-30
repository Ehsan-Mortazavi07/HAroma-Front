'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  Check,
  BookmarkPlus,
  RefreshCw,
} from 'lucide-react';
import { IProductVariant, IVariantTemplate } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { adminApi } from '@/common/api/admin';
import { useTranslation } from '@/common/i18n';

interface ProductVariantManagerProps {
  variants: IProductVariant[];
  onChange: (variants: IProductVariant[]) => void;
  basePrice?: number;
}

export function ProductVariantManager({
  variants = [],
  onChange,
  basePrice = 0,
}: ProductVariantManagerProps) {
  const { isPersian } = useTranslation();
  const [templates, setTemplates] = useState<IVariantTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplateIdx, setSavingTemplateIdx] = useState<number | null>(null);

  const loadTemplates = async () => {
    try {
      const res = await adminApi.getVariantTemplates();
      setTemplates(res || []);
    } catch (err) {
      console.error('Failed to load variant templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = (tpl: IVariantTemplate) => {
    const title = isPersian ? tpl.title : tpl.titleEn || tpl.title;
    const exists = variants.some(
      (v) => v.title === title || v.title === tpl.title || (tpl.titleEn && v.title === tpl.titleEn),
    );
    if (exists) {
      toast.error(isPersian ? 'این حجم قبلاً اضافه شده است.' : 'This variant is already added.');
      return;
    }

    const newVariant: IProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      titleEn: tpl.titleEn || undefined,
      price: tpl.defaultPrice || (basePrice > 0 ? basePrice : 1000000),
      discountPrice: tpl.defaultDiscountPrice || null,
      stockCount: tpl.defaultStock !== undefined ? tpl.defaultStock : 10,
      inStock: true,
      isDefault: variants.length === 0,
    };

    onChange([...variants, newVariant]);
    toast.success(isPersian ? `واریانت «${title}» افزوده شد.` : `Variant "${title}" added.`);
  };

  const handleAddNewEmpty = () => {
    const newVariant: IProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: isPersian ? `حجم ${variants.length + 1}` : `Size ${variants.length + 1}`,
      price: basePrice > 0 ? basePrice : 1000000,
      discountPrice: null,
      stockCount: 10,
      inStock: true,
      isDefault: variants.length === 0,
    };

    onChange([...variants, newVariant]);
  };

  const handleSaveAsReusableTemplate = async (variant: IProductVariant, idx: number) => {
    if (!variant.title.trim()) {
      toast.error(isPersian ? 'عنوان واریانت الزامی است.' : 'Variant title is required.');
      return;
    }

    setSavingTemplateIdx(idx);
    try {
      await adminApi.createVariantTemplate({
        title: variant.title.trim(),
        titleEn: variant.titleEn?.trim() || undefined,
        defaultPrice: Number(variant.price),
        defaultDiscountPrice: variant.discountPrice ? Number(variant.discountPrice) : null,
        defaultStock: Number(variant.stockCount),
        unit: 'میل',
        isPopular: true,
      });

      toast.success(
        isPersian
          ? `واریانت «${variant.title}» به عنوان الگوی آماده ذخیره شد!`
          : `Variant "${variant.title}" saved as reusable template!`,
      );
      loadTemplates();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در ذخیره به عنوان الگو.' : 'Failed to save template.'),
      );
    } finally {
      setSavingTemplateIdx(null);
    }
  };

  const handleUpdateVariant = (index: number, field: keyof IProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };

    // If setting isDefault to true, ensure others are false
    if (field === 'isDefault' && value === true) {
      updated.forEach((v, idx) => {
        if (idx !== index) v.isDefault = false;
      });
    }

    onChange(updated);
  };

  const handleRemoveVariant = (index: number) => {
    const wasDefault = variants[index].isDefault;
    const updated = variants.filter((_, i) => i !== index);
    if (wasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  };

  const handleSetDefault = (index: number) => {
    const updated = variants.map((v, i) => ({
      ...v,
      isDefault: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#9f815b]" />
          <div>
            <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'تنوع‌ها و حجم‌های مختلف محصول (واریانت‌ها)' : 'Product Volume & Size Variants'}
            </h3>
            <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-0.5">
              {isPersian
                ? 'تعریف حجم‌های متنوع (۳۰ میل، ۵۰ میل، ۱۰۰ میل، ۲۰۰ میل یا دستریز) با قیمت و موجودی اختصاصی'
                : 'Define multiple bottle sizes, decants, and volumes with individual prices and inventory'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddNewEmpty}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] text-xs font-bold border border-[#bfa27a]/30 transition-all self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'ایجاد حجم سفارشی جدید' : 'Add Custom Variant'}</span>
        </button>
      </div>

      {/* Quick Volume Preset Badges (Loaded from standalone templates API) */}
      <div className="p-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9f815b]" />
            <span>{isPersian ? 'افزودن سریع از الگوهای آماده (۱ کلیک):' : '1-Click Add From Saved Presets:'}</span>
          </span>
          <button
            type="button"
            onClick={loadTemplates}
            className="text-[11px] text-[#9f815b] dark:text-[#d4be9b] hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isPersian ? 'بروزرسانی الگوها' : 'Refresh'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {loadingTemplates ? (
            <div className="text-xs text-[#73695c] dark:text-[#a69c8e]">
              {isPersian ? 'در حال بارگذاری الگوها...' : 'Loading presets...'}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-xs text-[#73695c] dark:text-[#a69c8e]">
              {isPersian
                ? 'هنوز الگوی آماده‌ای ثبت نشده است. می‌توانید حجم‌های سفارشی بسازید یا از بخش تنوع‌ها الگو تعریف کنید.'
                : 'No presets defined yet. You can add custom sizes or create templates in Attributes menu.'}
            </div>
          ) : (
            templates.map((tpl) => {
              const isAdded = variants.some(
                (v) => v.title === tpl.title || (tpl.titleEn && v.title === tpl.titleEn),
              );
              return (
                <button
                  key={tpl._id}
                  type="button"
                  onClick={() => handleAddTemplate(tpl)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isAdded
                      ? 'bg-[#e6dcce] dark:bg-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] opacity-60 cursor-default'
                      : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#3e4c3e] hover:border-[#bfa27a] hover:bg-[#f0eae0] dark:hover:bg-[#283228] shadow-xs hover:scale-102'
                  }`}
                >
                  <Plus className={`w-3.5 h-3.5 ${isAdded ? 'text-gray-400' : 'text-[#9f815b]'}`} />
                  <span>{isPersian ? tpl.title : tpl.titleEn || tpl.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-normal">
                    {formatToman(tpl.defaultPrice, isPersian)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Variants List / Cards */}
      {variants.length > 0 ? (
        <div className="space-y-3 pt-2">
          {variants.map((variant, idx) => (
            <div
              key={variant.id || idx}
              className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                variant.isDefault
                  ? 'bg-[#ffffff] dark:bg-[#1c231c] border-2 border-[#bfa27a] shadow-md'
                  : 'bg-[#f8f5f0] dark:bg-[#242c24] border-[#e6dcce] dark:border-[#2e3a2e]'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                {/* Title Input */}
                <div className="sm:col-span-3">
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'عنوان حجم / مدل *' : 'Variant Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.title}
                    onChange={(e) => handleUpdateVariant(idx, 'title', e.target.value)}
                    placeholder={isPersian ? 'مثال: حجم ۱۰۰ میلی‌لیتر' : 'e.g. 100 ml'}
                    className="w-full h-10 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                {/* Price Input */}
                <div className="sm:col-span-3">
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'قیمت اصلی (تومان) *' : 'Price (Toman) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={variant.price}
                    onChange={(e) => handleUpdateVariant(idx, 'price', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                {/* Discount Price Input */}
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'قیمت تخفیف (اختیاری)' : 'Discount Price'}
                  </label>
                  <input
                    type="number"
                    value={variant.discountPrice || ''}
                    onChange={(e) =>
                      handleUpdateVariant(
                        idx,
                        'discountPrice',
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder={isPersian ? 'بدون تخفیف' : 'No discount'}
                    className="w-full h-10 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                {/* Stock Count Input */}
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'موجودی انبار' : 'Stock'}
                  </label>
                  <input
                    type="number"
                    value={variant.stockCount}
                    onChange={(e) =>
                      handleUpdateVariant(idx, 'stockCount', Number(e.target.value))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                {/* Actions: Default Selector, Save as Preset & Remove */}
                <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(idx)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      variant.isDefault
                        ? 'bg-[#bfa27a] text-[#1d241d] font-black'
                        : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                    }`}
                    title={isPersian ? 'تنظیم به عنوان حجم پیش‌فرض انتخاب‌شده' : 'Set as default size'}
                  >
                    {variant.isDefault
                      ? isPersian ? '✓ پیش‌فرض' : '✓ Default'
                      : isPersian ? 'پیش‌فرض' : 'Default'}
                  </button>

                  <button
                    type="button"
                    disabled={savingTemplateIdx === idx}
                    onClick={() => handleSaveAsReusableTemplate(variant, idx)}
                    className="p-2 text-[#9f815b] hover:text-[#7a5d3e] hover:bg-[#f0eae0] dark:hover:bg-[#283228] rounded-xl transition-colors shrink-0"
                    title={isPersian ? 'ذخیره این واریانت به عنوان الگوی آماده دائمی در سیستم' : 'Save as reusable template'}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
                    title={isPersian ? 'حذف این حجم' : 'Delete variant'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Preview Footer */}
              <div className="mt-2 pt-2 border-t border-[#e6dcce]/60 dark:border-[#2e3a2e]/60 flex items-center justify-between text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                <div className="flex items-center gap-2">
                  <span>
                    {isPersian ? 'قیمت نهایی قابل نمایش:' : 'Effective display price:'}{' '}
                    <strong className="text-[#9f815b] dark:text-[#d4be9b]">
                      {formatToman(variant.discountPrice || variant.price, isPersian)}
                    </strong>
                  </span>
                  {variant.discountPrice && variant.discountPrice > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#9f815b] text-white text-[10px] font-bold">
                      {isPersian
                        ? `${toPersianDigits(Math.round(((variant.price - variant.discountPrice) / variant.price) * 100))}٪ تخفیف`
                        : `${Math.round(((variant.price - variant.discountPrice) / variant.price) * 100)}% OFF`}
                    </span>
                  )}
                </div>

                <span>
                  {variant.stockCount > 0
                    ? isPersian
                      ? `${toPersianDigits(variant.stockCount)} عدد موجود در انبار`
                      : `${variant.stockCount} in stock`
                    : isPersian ? 'ناموجود' : 'Out of stock'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-xs text-[#73695c] dark:text-[#a69c8e] space-y-1">
          <p className="font-bold">
            {isPersian
              ? 'هیچ حجم یا واریانت متفاوتی برای این کالا تعریف نشده است.'
              : 'No variants or multiple sizes added.'}
          </p>
          <p className="text-[11px]">
            {isPersian
              ? 'روی یکی از الگوهای بالا کلیک کنید یا با دکمه «ایجاد حجم سفارشی جدید» واریانت جدید بسازید.'
              : 'Click any preset above or use "+ Add Custom Variant" to add sizes.'}
          </p>
        </div>
      )}
    </div>
  );
}
