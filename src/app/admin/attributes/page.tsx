'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
  Layers,
  ShoppingBag,
  Sliders,
  DollarSign,
  Package,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IAttribute, IVariantTemplate } from '@/common/interfaces';
import { toast, toPersianDigits, formatToman, translateAttributeValue } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export default function AdminAttributesPage() {
  const { isPersian } = useTranslation();
  const [activeTab, setActiveTab] = useState<'variants' | 'attributes'>('variants');

  // Dynamic Attributes State
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(true);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<IAttribute | null>(null);
  const [attrName, setAttrName] = useState('');
  const [attrNameEn, setAttrNameEn] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [attrUnit, setAttrUnit] = useState('');
  const [attrPossibleValues, setAttrPossibleValues] = useState<string[]>([]);
  const [attrValueInput, setAttrValueInput] = useState('');
  const [submittingAttr, setSubmittingAttr] = useState(false);

  // Variant Templates State
  const [variantTemplates, setVariantTemplates] = useState<IVariantTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IVariantTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplTitleEn, setTplTitleEn] = useState('');
  const [tplPrice, setTplPrice] = useState<number | ''>('');
  const [tplDiscountPrice, setTplDiscountPrice] = useState<number | ''>('');
  const [tplStock, setTplStock] = useState<number | ''>(10);
  const [tplUnit, setTplUnit] = useState('میل');
  const [tplIsPopular, setTplIsPopular] = useState(true);
  const [tplOrder, setTplOrder] = useState<number | ''>(1);
  const [submittingTpl, setSubmittingTpl] = useState(false);

  // Load Attributes
  const loadAttributes = async () => {
    setLoadingAttrs(true);
    try {
      const res = await adminApi.getAttributes();
      setAttributes(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttrs(false);
    }
  };

  // Load Variant Templates
  const loadVariantTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await adminApi.getVariantTemplates();
      setVariantTemplates(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadAttributes();
    loadVariantTemplates();
  }, []);

  // --- ATTRIBUTE HANDLERS ---
  const openCreateAttrModal = () => {
    setEditingAttr(null);
    setAttrName('');
    setAttrNameEn('');
    setAttrKey('');
    setAttrUnit('');
    setAttrPossibleValues([]);
    setAttrValueInput('');
    setAttrModalOpen(true);
  };

  const openEditAttrModal = (attr: IAttribute) => {
    setEditingAttr(attr);
    setAttrName(attr.name);
    setAttrNameEn(attr.nameEn || '');
    setAttrKey(attr.key);
    setAttrUnit(attr.unit || '');
    setAttrPossibleValues(attr.possibleValues || []);
    setAttrValueInput('');
    setAttrModalOpen(true);
  };

  const addPossibleValue = () => {
    if (!attrValueInput.trim()) return;
    if (!attrPossibleValues.includes(attrValueInput.trim())) {
      setAttrPossibleValues([...attrPossibleValues, attrValueInput.trim()]);
    }
    setAttrValueInput('');
  };

  const removePossibleValue = (val: string) => {
    setAttrPossibleValues(attrPossibleValues.filter((v) => v !== val));
  };

  const handleAttrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim()) {
      toast.error(isPersian ? 'نام ویژگی الزامی است.' : 'Attribute name is required.');
      return;
    }

    setSubmittingAttr(true);
    try {
      const payload = {
        name: attrName.trim(),
        nameEn: attrNameEn.trim() || undefined,
        key: attrKey.trim() || attrName.trim().toLowerCase().replace(/\s+/g, '_'),
        unit: attrUnit.trim() || undefined,
        possibleValues: attrPossibleValues,
      };

      if (editingAttr) {
        await adminApi.updateAttribute(editingAttr._id, payload);
        toast.success(isPersian ? 'ویژگی با موفقیت به‌روزرسانی شد.' : 'Attribute updated successfully.');
      } else {
        await adminApi.createAttribute(payload);
        toast.success(isPersian ? 'ویژگی جدید با موفقیت اضافه شد.' : 'Attribute created successfully.');
      }

      setAttrModalOpen(false);
      loadAttributes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره ویژگی.' : 'Failed to save attribute.'));
    } finally {
      setSubmittingAttr(false);
    }
  };

  const handleDeleteAttr = async (id: string, name: string) => {
    if (
      !confirm(
        isPersian
          ? `آیا از حذف ویژگی «${name}» اطمینان دارید؟`
          : `Are you sure you want to delete attribute "${name}"?`,
      )
    )
      return;

    try {
      await adminApi.deleteAttribute(id);
      toast.success(isPersian ? 'ویژگی با موفقیت حذف شد.' : 'Attribute deleted successfully.');
      loadAttributes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف ویژگی.' : 'Failed to delete attribute.'));
    }
  };

  // --- VARIANT TEMPLATE HANDLERS ---
  const openCreateTplModal = () => {
    setEditingTemplate(null);
    setTplTitle('');
    setTplTitleEn('');
    setTplPrice('');
    setTplDiscountPrice('');
    setTplStock(10);
    setTplUnit('میل');
    setTplIsPopular(true);
    setTplOrder(variantTemplates.length + 1);
    setTemplateModalOpen(true);
  };

  const openEditTplModal = (tpl: IVariantTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplTitleEn(tpl.titleEn || '');
    setTplPrice(tpl.defaultPrice);
    setTplDiscountPrice(tpl.defaultDiscountPrice || '');
    setTplStock(tpl.defaultStock !== undefined ? tpl.defaultStock : 10);
    setTplUnit(tpl.unit || 'میل');
    setTplIsPopular(tpl.isPopular !== undefined ? tpl.isPopular : true);
    setTplOrder(tpl.order || 1);
    setTemplateModalOpen(true);
  };

  const handleTplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim()) {
      toast.error(isPersian ? 'عنوان حجم/تنوع الزامی است.' : 'Variant title is required.');
      return;
    }
    if (tplPrice === '' || Number(tplPrice) < 0) {
      toast.error(isPersian ? 'قیمت پیش‌فرض معتبر الزامی است.' : 'Valid default price is required.');
      return;
    }

    setSubmittingTpl(true);
    try {
      const payload = {
        title: tplTitle.trim(),
        titleEn: tplTitleEn.trim() || undefined,
        defaultPrice: Number(tplPrice),
        defaultDiscountPrice: tplDiscountPrice ? Number(tplDiscountPrice) : null,
        defaultStock: tplStock !== '' ? Number(tplStock) : 10,
        unit: tplUnit.trim() || 'میل',
        isPopular: tplIsPopular,
        order: tplOrder !== '' ? Number(tplOrder) : 0,
      };

      if (editingTemplate) {
        await adminApi.updateVariantTemplate(editingTemplate._id, payload);
        toast.success(
          isPersian ? 'الگوی تنوع با موفقیت به‌روزرسانی شد.' : 'Variant template updated successfully.',
        );
      } else {
        await adminApi.createVariantTemplate(payload);
        toast.success(
          isPersian ? 'الگوی تنوع جدید با موفقیت ایجاد شد.' : 'Variant template created successfully.',
        );
      }

      setTemplateModalOpen(false);
      loadVariantTemplates();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || (isPersian ? 'خطا در ذخیره الگوی تنوع.' : 'Failed to save template.'),
      );
    } finally {
      setSubmittingTpl(false);
    }
  };

  const handleDeleteTpl = async (id: string, title: string) => {
    if (
      !confirm(
        isPersian
          ? `آیا از حذف الگوی تنوع «${title}» اطمینان دارید؟`
          : `Are you sure you want to delete variant template "${title}"?`,
      )
    )
      return;

    try {
      await adminApi.deleteVariantTemplate(id);
      toast.success(isPersian ? 'الگوی تنوع حذف شد.' : 'Variant template deleted.');
      loadVariantTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف الگو.' : 'Failed to delete template.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت تنوع‌ها، حجم‌ها و ویژگی‌های داینامیک' : 'Variant Templates & Dynamic Attributes'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'تعریف الگوهای آماده تنوع حجم عطر (۳۰، ۵۰، ۱۰۰ میل و...) و ویژگی‌های تخصصی بویایی خارج از محصول'
              : 'Create standalone volume & size variant templates and specialized olfactory attributes'}
          </p>
        </div>

        {activeTab === 'variants' ? (
          <button
            onClick={openCreateTplModal}
            className="px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isPersian ? 'افزودن الگوی تنوع / حجم جدید' : 'Add New Variant Template'}</span>
          </button>
        ) : (
          <button
            onClick={openCreateAttrModal}
            className="px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isPersian ? 'افزودن ویژگی جدید' : 'Add New Attribute'}</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-[#ffffff] dark:bg-[#1c231c] p-2 rounded-2xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
        <button
          onClick={() => setActiveTab('variants')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
            activeTab === 'variants'
              ? 'bg-brand-gold text-[#141914] shadow-sm'
              : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isPersian ? 'تنوع‌ها و الگوهای حجم محصول (واریانت‌ها)' : 'Variant & Size Templates'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10">
            {isPersian ? toPersianDigits(variantTemplates.length) : variantTemplates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
            activeTab === 'attributes'
              ? 'bg-brand-gold text-[#141914] shadow-sm'
              : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isPersian ? 'ویژگی‌های تخصصی و داینامیک عطر' : 'Dynamic Scent Attributes'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10">
            {isPersian ? toPersianDigits(attributes.length) : attributes.length}
          </span>
        </button>
      </div>

      {/* TAB 1: VARIANT TEMPLATES GRID */}
      {activeTab === 'variants' && (
        <div>
          {loadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-3xl bg-[#ffffff] dark:bg-[#1c231c] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
                />
              ))}
            </div>
          ) : variantTemplates.length === 0 ? (
            <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-12 text-center border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
              <Layers className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                {isPersian ? 'هیچ الگوی تنوع یا حجمی ثبت نشده است.' : 'No variant templates found.'}
              </h3>
              <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
                {isPersian
                  ? 'الگوهایی مانند «۵۰ میل»، «۱۰۰ میل» یا «دستریز» بسازید تا هنگام ثبت محصول با ۱ کلیک اعمال شوند.'
                  : 'Create preset sizes like 50ml, 100ml, or Decants to apply in 1-click when adding products.'}
              </p>
              <button
                onClick={openCreateTplModal}
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isPersian ? 'ساخت اولین الگوی تنوع' : 'Create First Template'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {variantTemplates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#bfa27a] transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                          {isPersian ? tpl.title : tpl.titleEn || tpl.title}
                        </h3>
                        {tpl.titleEn && (
                          <span className="text-xs text-[#73695c] dark:text-[#a69c8e] font-sans">
                            {tpl.titleEn}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTplModal(tpl)}
                          className="p-1.5 rounded-xl text-[#73695c] dark:text-[#a69c8e] hover:bg-[#f0eae0] dark:hover:bg-[#283228] transition-colors"
                          title={isPersian ? 'ویرایش الگو' : 'Edit template'}
                        >
                          <Edit2 className="w-4 h-4 text-[#9f815b]" />
                        </button>
                        <button
                          onClick={() => handleDeleteTpl(tpl._id, tpl.title)}
                          className="p-1.5 rounded-xl text-[#73695c] dark:text-[#a69c8e] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                          title={isPersian ? 'حذف الگو' : 'Delete template'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price & Stock info pills */}
                    <div className="p-3.5 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#73695c] dark:text-[#a69c8e] font-medium">
                          {isPersian ? 'قیمت پیشنهادی:' : 'Default Price:'}
                        </span>
                        <span className="font-black text-[#1d241d] dark:text-[#d4be9b]">
                          {formatToman(tpl.defaultPrice, isPersian)}
                        </span>
                      </div>

                      {tpl.defaultDiscountPrice && tpl.defaultDiscountPrice > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#73695c] dark:text-[#a69c8e] font-medium">
                            {isPersian ? 'قیمت تخفیف‌دار:' : 'Discount Price:'}
                          </span>
                          <span className="font-bold text-[#9f815b] dark:text-[#d4be9b]">
                            {formatToman(tpl.defaultDiscountPrice, isPersian)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#e6dcce]/60 dark:border-[#2e3a2e]/60">
                        <span className="text-[#73695c] dark:text-[#a69c8e]">
                          {isPersian ? 'موجودی پیش‌فرض:' : 'Default Stock:'}
                        </span>
                        <span className="font-bold">
                          {isPersian ? toPersianDigits(tpl.defaultStock) : tpl.defaultStock}{' '}
                          {tpl.unit || 'عدد'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#73695c] dark:text-[#a69c8e] pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e]">
                      {isPersian ? 'واحد:' : 'Unit:'} {tpl.unit || 'میل'}
                    </span>
                    {tpl.isPopular && (
                      <span className="px-2 py-0.5 rounded-md bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] font-bold border border-[#bfa27a]/30">
                        {isPersian ? '★ پرکاربرد در محصولات' : '★ Popular'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DYNAMIC ATTRIBUTES GRID */}
      {activeTab === 'attributes' && (
        <div>
          {loadingAttrs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-3xl bg-[#ffffff] dark:bg-[#1c231c] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
                />
              ))}
            </div>
          ) : attributes.length === 0 ? (
            <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-12 text-center border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
              <Sparkles className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                {isPersian ? 'هیچ ویژگی ثبت نشده است.' : 'No attributes found.'}
              </h3>
              <button
                onClick={openCreateAttrModal}
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs shadow-sm transition-colors"
              >
                {isPersian ? 'افزودن ویژگی جدید' : 'Add Attribute'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attributes.map((attr) => (
                <div
                  key={attr._id}
                  className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#bfa27a] transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                          {isPersian ? attr.name : attr.nameEn || attr.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                          {attr.key}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAttrModal(attr)}
                          className="p-1.5 rounded-xl text-[#73695c] dark:text-[#a69c8e] hover:bg-[#f0eae0] dark:hover:bg-[#283228] transition-colors"
                          title={isPersian ? 'ویرایش ویژگی' : 'Edit attribute'}
                        >
                          <Edit2 className="w-4 h-4 text-[#9f815b]" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttr(attr._id, attr.name)}
                          className="p-1.5 rounded-xl text-[#73695c] dark:text-[#a69c8e] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                          title={isPersian ? 'حذف ویژگی' : 'Delete attribute'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {attr.unit && (
                      <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                        {isPersian ? 'واحد سنجش:' : 'Unit:'}{' '}
                        <span className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                          {attr.unit}
                        </span>
                      </div>
                    )}

                    {/* Possible Values Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e]">
                        {isPersian ? 'گزینه‌ها و مقادیر مجاز:' : 'Allowed Values:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {attr.possibleValues && attr.possibleValues.length > 0 ? (
                          attr.possibleValues.map((val, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-[#f8f5f0] dark:bg-[#242c24] text-[11px] font-medium text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#2e3a2e]"
                            >
                              {translateAttributeValue(val, isPersian)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e] italic">
                            {isPersian ? 'مقدار متنی آزاد' : 'Free text'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e] text-[11px] text-[#73695c] dark:text-[#a69c8e] flex items-center justify-between">
                    <span>
                      {isPersian
                        ? `${toPersianDigits(attr.possibleValues?.length || 0)} مقدار از پیش تعریف‌شده`
                        : `${attr.possibleValues?.length || 0} predefined values`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VARIANT TEMPLATE MODAL */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {editingTemplate
                    ? isPersian ? 'ویرایش الگوی تنوع / حجم' : 'Edit Variant Template'
                    : isPersian ? 'تعریف الگوی تنوع / حجم جدید' : 'Create Variant Template'}
                </h3>
              </div>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTplSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'عنوان تنوع (فارسی) *' : 'Variant Title (Persian) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={tplTitle}
                    onChange={(e) => setTplTitle(e.target.value)}
                    placeholder={isPersian ? 'مثال: حجم ۵۰ میلی‌لیتر' : 'e.g. 50 ml'}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'عنوان تنوع (انگلیسی)' : 'Variant Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={tplTitleEn}
                    onChange={(e) => setTplTitleEn(e.target.value)}
                    placeholder="e.g. 50 ml Standard"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'قیمت پیشنهادی پیش‌فرض (تومان) *' : 'Default Price (Toman) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={tplPrice}
                    onChange={(e) => setTplPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1500000"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'قیمت تخفیف پیش‌فرض (اختیاری)' : 'Default Discount Price'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tplDiscountPrice}
                    onChange={(e) =>
                      setTplDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="1290000"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'موجودی پیش‌فرض' : 'Default Stock'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tplStock}
                    onChange={(e) => setTplStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'واحد سنجش' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={tplUnit}
                    onChange={(e) => setTplUnit(e.target.value)}
                    placeholder="میل / ml"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'اولویت ترتیب' : 'Order'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tplOrder}
                    onChange={(e) => setTplOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={tplIsPopular}
                  onChange={(e) => setTplIsPopular(e.target.checked)}
                  className="w-4 h-4 accent-[#9f815b] rounded"
                />
                <span className="font-bold">
                  {isPersian
                    ? 'نمایش به عنوان الگوی پرکاربرد در فرم ساخت محصول'
                    : 'Show as quick preset in Product Form'}
                </span>
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submittingTpl}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {submittingTpl
                    ? isPersian ? 'در حال ثبت...' : 'Saving...'
                    : isPersian ? 'ذخیره الگو' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC ATTRIBUTE MODAL */}
      {attrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {editingAttr
                    ? isPersian ? 'ویرایش ویژگی داینامیک' : 'Edit Dynamic Attribute'
                    : isPersian ? 'تعریف ویژگی داینامیک جدید' : 'Create Dynamic Attribute'}
                </h3>
              </div>
              <button
                onClick={() => setAttrModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttrSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'نام ویژگی (فارسی) *' : 'Attribute Name (Persian) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    placeholder={isPersian ? 'مثال: طبع عطر' : 'e.g. Scent Nature'}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'نام ویژگی (انگلیسی)' : 'Attribute Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={attrNameEn}
                    onChange={(e) => setAttrNameEn(e.target.value)}
                    placeholder="e.g. Scent Nature"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'کلید سیستمی (انگلیسی/یکتا)' : 'System Key (Unique)'}
                  </label>
                  <input
                    type="text"
                    value={attrKey}
                    onChange={(e) => setAttrKey(e.target.value)}
                    placeholder="e.g. scent_nature"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'واحد سنجش (اختیاری)' : 'Unit (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={attrUnit}
                    onChange={(e) => setAttrUnit(e.target.value)}
                    placeholder="میل / گرم / ساعت"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              {/* Allowed Possible Values */}
              <div className="space-y-2 pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                <label className="block font-bold">
                  {isPersian ? 'تعریف مقادیر پیش‌فرض / گزینه‌ها' : 'Define Allowed Values'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attrValueInput}
                    onChange={(e) => setAttrValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPossibleValue();
                      }
                    }}
                    placeholder={isPersian ? 'یک مقدار وارد کرده و افزودن را بزنید (مثال: خنک)' : 'Enter value and click Add'}
                    className="flex-1 h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <button
                    type="button"
                    onClick={addPossibleValue}
                    className="px-4 py-2.5 rounded-xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] font-bold text-xs border border-[#bfa27a]/30"
                  >
                    {isPersian ? 'افزودن' : 'Add'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 max-h-32 overflow-y-auto">
                  {attrPossibleValues.map((val, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#f0eae0] dark:bg-[#283228] text-[#1d241d] dark:text-[#d4be9b] font-bold text-xs border border-[#bfa27a]/30"
                    >
                      <span>{val}</span>
                      <button
                        type="button"
                        onClick={() => removePossibleValue(val)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                <button
                  type="button"
                  onClick={() => setAttrModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submittingAttr}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {submittingAttr
                    ? isPersian ? 'در حال ثبت...' : 'Saving...'
                    : isPersian ? 'ذخیره ویژگی' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
