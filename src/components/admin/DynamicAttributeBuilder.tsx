'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, X, Check } from 'lucide-react';
import { IAttribute, IProductAttribute } from '@/common/interfaces';
import { adminApi } from '@/common/api/admin';
import { toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

interface DynamicAttributeBuilderProps {
  attributes?: IProductAttribute[];
  value?: IProductAttribute[];
  onChange: (attributes: IProductAttribute[]) => void;
}

export function DynamicAttributeBuilder({
  attributes,
  value,
  onChange,
}: DynamicAttributeBuilderProps) {
  const currentAttributes = attributes || value || [];
  const { isPersian } = useTranslation();
  const [availableAttributes, setAvailableAttributes] = useState<IAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Create Modal State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');
  const [newAttrUnit, setNewAttrUnit] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected for adding existing
  const [selectedAttrId, setSelectedAttrId] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  const loadAttributes = async () => {
    try {
      const res = await adminApi.getAttributes();
      setAvailableAttributes(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const handleAddSelectedAttribute = () => {
    if (!selectedAttrId) return;
    const attr = availableAttributes.find((a) => a._id === selectedAttrId);
    if (!attr) return;

    const val = selectedValue.trim() || attr.possibleValues?.[0] || '';
    if (!val) {
      toast.error(isPersian ? 'لطفاً مقداری برای ویژگی وارد یا انتخاب نمایید.' : 'Please enter or select a value for attribute.');
      return;
    }

    // Check if already added
    const exists = currentAttributes.some((item) => item.key === attr.key);
    if (exists) {
      toast.error(isPersian ? 'این ویژگی از قبل به محصول اضافه شده است.' : 'This attribute is already added to product.');
      return;
    }

    const newAttrList: IProductAttribute[] = [
      ...currentAttributes,
      {
        name: attr.name,
        key: attr.key,
        value: val,
        unit: attr.unit,
      },
    ];

    onChange(newAttrList);
    setSelectedAttrId('');
    setSelectedValue('');
    toast.success(isPersian ? `ویژگی «${attr.name}» افزوده شد.` : `Attribute "${attr.name}" added.`);
  };

  const handleRemoveAttribute = (index: number) => {
    const updated = currentAttributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...currentAttributes];
    updated[index] = { ...updated[index], value: newValue };
    onChange(updated);
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim() || !newAttrValue.trim()) {
      toast.error(isPersian ? 'نام و مقدار ویژگی الزامی است.' : 'Attribute name and value are required.');
      return;
    }

    setCreating(true);
    try {
      const generatedKey = newAttrName.trim().toLowerCase().replace(/\s+/g, '_');
      const created = await adminApi.createAttribute({
        name: newAttrName.trim(),
        key: generatedKey,
        unit: newAttrUnit.trim() || undefined,
        possibleValues: [newAttrValue.trim()],
      });

      // Add to current product attributes
      const newAttrList: IProductAttribute[] = [
        ...currentAttributes,
        {
          name: created.name,
          key: created.key,
          value: newAttrValue.trim(),
          unit: created.unit,
        },
      ];

      onChange(newAttrList);
      setIsQuickCreateOpen(false);
      setNewAttrName('');
      setNewAttrValue('');
      setNewAttrUnit('');
      loadAttributes();
      toast.success(isPersian ? 'ویژگی جدید ساخته و به محصول اضافه شد!' : 'New attribute created & attached to product!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ایجاد ویژگی.' : 'Failed to create attribute.'));
    } finally {
      setCreating(false);
    }
  };

  const selectedAttrObj = availableAttributes.find((a) => a._id === selectedAttrId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#9f815b]" />
          <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? '۴. ویژگی‌های داینامیک محصول' : '4. Dynamic Attributes Builder'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsQuickCreateOpen(true)}
          className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline self-start sm:self-auto"
        >
          {isPersian ? '+ ایجاد ویژگی کاملاً جدید در سیستم' : '+ Create Brand New Attribute'}
        </button>
      </div>

      <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
        {isPersian
          ? 'ویژگی‌های عطر را انتخاب یا مقادیر سفارشی به آنها تخصیص دهید (مثلاً: حجم: ۱۰۰ میل، طبع: خنک و تلخ، ماندگاری: عالی).'
          : 'Attach attributes to this fragrance (e.g. Volume: 100ml, Scent: Woody Fresh, Longevity: Long Lasting).'}
      </p>

      {/* Add from Existing Toolbar */}
      <div className="p-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex flex-col sm:flex-row gap-3 items-center">
        <select
          value={selectedAttrId}
          onChange={(e) => {
            setSelectedAttrId(e.target.value);
            const found = availableAttributes.find((a) => a._id === e.target.value);
            if (found && found.possibleValues && found.possibleValues.length > 0) {
              setSelectedValue(found.possibleValues[0]);
            } else {
              setSelectedValue('');
            }
          }}
          className="w-full sm:w-1/3 h-11 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
        >
          <option value="">{isPersian ? '-- انتخاب ویژگی از لیست --' : '-- Select Attribute --'}</option>
          {availableAttributes.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} {a.unit ? `(${a.unit})` : ''}
            </option>
          ))}
        </select>

        {selectedAttrObj && selectedAttrObj.possibleValues && selectedAttrObj.possibleValues.length > 0 ? (
          <select
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            className="w-full sm:w-1/3 h-11 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
          >
            {selectedAttrObj.possibleValues.map((v, i) => (
              <option key={i} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            placeholder={isPersian ? 'مقدار دلخواه برای این ویژگی...' : 'Custom value...'}
            disabled={!selectedAttrId}
            className="w-full sm:w-1/3 h-11 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] disabled:opacity-50"
          />
        )}

        <button
          type="button"
          onClick={handleAddSelectedAttribute}
          disabled={!selectedAttrId}
          className="w-full sm:w-auto px-5 h-11 rounded-xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] font-bold text-xs border border-[#bfa27a]/40 shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن به محصول' : 'Add to Product'}</span>
        </button>
      </div>

      {/* Added Attributes Chips / Grid */}
      {currentAttributes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {currentAttributes.map((attr, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e] flex items-center gap-1">
                  <span>{attr.name}</span>
                  {attr.unit && <span className="font-mono">({attr.unit})</span>}
                </div>
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  className="w-full mt-1 px-2 py-1 rounded-lg bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-1 focus:ring-[#bfa27a]"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveAttribute(idx)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-xs text-[#73695c] dark:text-[#a69c8e]">
          {isPersian ? 'هنوز هیچ ویژگی به این محصول اضافه نشده است.' : 'No attributes attached yet.'}
        </div>
      )}

      {/* Quick Create Attribute Modal */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <h3 className="font-black text-base">
                {isPersian ? 'ایجاد ویژگی جدید در سیستم' : 'Create New System Attribute'}
              </h3>
              <button
                onClick={() => setIsQuickCreateOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'عنوان ویژگی *' : 'Attribute Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder={isPersian ? 'مثال: غلظت اسانس، طبع رایحه' : 'e.g. Concentration, Scent Type'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'مقدار برای این محصول *' : 'Value for This Product *'}
                </label>
                <input
                  type="text"
                  required
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(e.target.value)}
                  placeholder={isPersian ? 'مثال: اکستریت د پرفیوم' : 'e.g. Extrait de Parfum'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'واحد اندازه‌گیری (اختیاری)' : 'Unit (Optional)'}
                </label>
                <input
                  type="text"
                  value={newAttrUnit}
                  onChange={(e) => setNewAttrUnit(e.target.value)}
                  placeholder={isPersian ? 'میل، درصد، گرم' : 'ml, %, gr'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 rounded-xl font-black bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-md transition-all active:scale-98"
                >
                  {creating
                    ? isPersian ? 'در حال ایجاد...' : 'Creating...'
                    : isPersian ? 'ثبت و افزودن به محصول' : 'Create & Attach'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
