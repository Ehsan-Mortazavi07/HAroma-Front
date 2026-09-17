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
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Skeleton,
} from '@heroui/react';
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

        <Button
          size="sm"
          radius="full"
          variant="solid"
          onPress={handleAddNewEmpty}
          startContent={<Plus className="w-4 h-4" />}
          className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-xs self-start sm:self-auto cursor-pointer"
        >
          {isPersian ? 'ایجاد حجم سفارشی جدید' : 'Add Custom Variant'}
        </Button>
      </div>

      {/* Quick Volume Preset Badges */}
      <Card className="bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] shadow-none rounded-2xl">
        <CardBody className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9f815b]" />
              <span>{isPersian ? 'افزودن سریع از الگوهای آماده (۱ کلیک):' : '1-Click Add From Saved Presets:'}</span>
            </span>
            <Button
              size="sm"
              variant="light"
              color="warning"
              onPress={loadTemplates}
              startContent={<RefreshCw className="w-3 h-3" />}
              className="text-[11px] font-semibold h-7 px-2"
            >
              {isPersian ? 'بروزرسانی الگوها' : 'Refresh'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {loadingTemplates ? (
              <div className="flex items-center gap-2 py-2">
                <Skeleton className="h-8 w-28 rounded-xl" />
                <Skeleton className="h-8 w-28 rounded-xl" />
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-xs text-[#73695c] dark:text-[#a69c8e] py-1">
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
                  <Button
                    key={tpl._id}
                    size="sm"
                    radius="full"
                    variant={isAdded ? 'flat' : 'bordered'}
                    isDisabled={isAdded}
                    onPress={() => handleAddTemplate(tpl)}
                    startContent={<Plus className={`w-3.5 h-3.5 ${isAdded ? 'text-gray-400' : 'text-[#9f815b]'}`} />}
                    className={`text-xs font-bold transition-all ${
                      isAdded
                        ? 'opacity-50'
                        : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#3e4c3e] hover:border-brand-gold shadow-xs'
                    }`}
                  >
                    <span>{isPersian ? tpl.title : tpl.titleEn || tpl.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-normal">
                      {formatToman(tpl.defaultPrice, isPersian)}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Variants List / Cards */}
      {variants.length > 0 ? (
        <div className="space-y-3 pt-2">
          {variants.map((variant, idx) => (
            <Card
              key={variant.id || idx}
              className={`rounded-3xl transition-all shadow-xs ${
                variant.isDefault
                  ? 'bg-[#ffffff] dark:bg-[#1c231c] border-2 border-brand-gold shadow-md'
                  : 'bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e]'
              }`}
            >
              <CardBody className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                  {/* Title Input */}
                  <div className="sm:col-span-3">
                    <Input
                      label={isPersian ? 'عنوان حجم / مدل *' : 'Variant Title *'}
                      labelPlacement="outside"
                      isRequired
                      value={variant.title}
                      onValueChange={(val) => handleUpdateVariant(idx, 'title', val)}
                      placeholder={isPersian ? 'مثال: حجم ۱۰۰ میلی‌لیتر' : 'e.g. 100 ml'}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: 'h-11 px-3.5 bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                        input: 'font-bold text-xs text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />
                  </div>

                  {/* Price Input */}
                  <div className="sm:col-span-3">
                    <Input
                      label={isPersian ? 'قیمت اصلی (تومان) *' : 'Price (Toman) *'}
                      labelPlacement="outside"
                      type="number"
                      isRequired
                      value={String(variant.price)}
                      onValueChange={(val) => handleUpdateVariant(idx, 'price', Number(val))}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: 'h-11 px-3.5 bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                        input: 'font-bold text-xs text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />
                  </div>

                  {/* Discount Price Input */}
                  <div className="sm:col-span-2">
                    <Input
                      label={isPersian ? 'قیمت تخفیف' : 'Discount Price'}
                      labelPlacement="outside"
                      type="number"
                      value={String(variant.discountPrice || '')}
                      onValueChange={(val) =>
                        handleUpdateVariant(idx, 'discountPrice', val ? Number(val) : null)
                      }
                      placeholder={isPersian ? 'بدون تخفیف' : 'No discount'}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: 'h-11 px-3.5 bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                        input: 'font-bold text-xs text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />
                  </div>

                  {/* Stock Count Input */}
                  <div className="sm:col-span-2">
                    <Input
                      label={isPersian ? 'موجودی انبار' : 'Stock'}
                      labelPlacement="outside"
                      type="number"
                      value={String(variant.stockCount)}
                      onValueChange={(val) => handleUpdateVariant(idx, 'stockCount', Number(val))}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: 'h-11 px-3.5 bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                        input: 'font-bold text-xs text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />
                  </div>

                  {/* Actions: Default Selector, Save as Preset & Remove */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-6">
                    <Button
                      size="sm"
                      radius="full"
                      variant={variant.isDefault ? 'solid' : 'bordered'}
                      onPress={() => handleSetDefault(idx)}
                      className={`text-[11px] font-bold h-9 ${
                        variant.isDefault
                          ? 'bg-brand-gold text-[#141914] font-black'
                          : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#73695c] dark:text-[#a69c8e] border-[#e6dcce] dark:border-[#2e3a2e]'
                      }`}
                    >
                      {variant.isDefault
                        ? isPersian ? '✓ پیش‌فرض' : '✓ Default'
                        : isPersian ? 'پیش‌فرض' : 'Default'}
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="light"
                      isLoading={savingTemplateIdx === idx}
                      onPress={() => handleSaveAsReusableTemplate(variant, idx)}
                      className="text-[#9f815b] hover:text-[#7a5d3e] hover:bg-[#f0eae0] dark:hover:bg-[#283228] h-9 w-9 min-w-9 shrink-0"
                      aria-label={isPersian ? 'ذخیره به عنوان الگوی آماده' : 'Save as reusable template'}
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="light"
                      color="danger"
                      onPress={() => handleRemoveVariant(idx)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-9 w-9 min-w-9 shrink-0"
                      aria-label={isPersian ? 'حذف این حجم' : 'Delete variant'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                      <Chip size="sm" variant="solid" className="bg-brand-gold text-[#141914] text-[10px] font-bold h-5">
                        {isPersian
                          ? `${toPersianDigits(Math.round(((variant.price - variant.discountPrice) / variant.price) * 100))}٪ تخفیف`
                          : `${Math.round(((variant.price - variant.discountPrice) / variant.price) * 100)}% OFF`}
                      </Chip>
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
              </CardBody>
            </Card>
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
