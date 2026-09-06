'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, X, Check, Tag } from 'lucide-react';
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
  const [newAttrValues, setNewAttrValues] = useState('');
  const [newAttrUnit, setNewAttrUnit] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected for adding existing
  const [selectedAttrId, setSelectedAttrId] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [customValueInput, setCustomValueInput] = useState('');

  // Inline adding value to an already attached attribute
  const [addingToAttrIndex, setAddingToAttrIndex] = useState<number | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

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

  const selectedAttrObj = availableAttributes.find((a) => a._id === selectedAttrId);

  const togglePredefinedValue = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  };

  const handleAddCustomValue = () => {
    const trimmed = customValueInput.trim();
    if (!trimmed) return;
    if (!selectedValues.includes(trimmed)) {
      setSelectedValues((prev) => [...prev, trimmed]);
    }
    setCustomValueInput('');
  };

  const handleRemoveSelectedValue = (val: string) => {
    setSelectedValues((prev) => prev.filter((v) => v !== val));
  };

  const handleAddSelectedAttribute = () => {
    if (!selectedAttrId || !selectedAttrObj) return;

    if (selectedValues.length === 0 && !customValueInput.trim()) {
      toast.error(
        isPersian
          ? 'لطفاً حداقل یک مقدار (یا گروه) برای این ویژگی انتخاب یا تایپ نمایید.'
          : 'Please select or type at least one value for this attribute.',
      );
      return;
    }

    const finalValues = [...selectedValues];
    if (customValueInput.trim() && !finalValues.includes(customValueInput.trim())) {
      finalValues.push(customValueInput.trim());
    }

    // Check if already added
    const exists = currentAttributes.some((item) => item.key === selectedAttrObj.key);
    if (exists) {
      toast.error(
        isPersian
          ? 'این ویژگی از قبل به محصول اضافه شده است. می‌توانید مقادیر جدید را مستقیماً به آن اضافه نمایید.'
          : 'This attribute is already added to product. You can add more values directly to its card.',
      );
      return;
    }

    const newAttrList: IProductAttribute[] = [
      ...currentAttributes,
      {
        attributeId: selectedAttrObj._id,
        name: selectedAttrObj.name,
        key: selectedAttrObj.key,
        values: finalValues,
        value: finalValues.join('، '),
        unit: selectedAttrObj.unit,
      },
    ];

    onChange(newAttrList);
    setSelectedAttrId('');
    setSelectedValues([]);
    setCustomValueInput('');
    toast.success(
      isPersian
        ? `ویژگی «${selectedAttrObj.name}» با ${finalValues.length} مقدار افزوده شد.`
        : `Attribute "${selectedAttrObj.name}" added with ${finalValues.length} values.`,
    );
  };

  const handleRemoveAttribute = (index: number) => {
    const updated = currentAttributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleRemoveTagFromAttached = (attrIndex: number, valToRemove: string) => {
    const updated = [...currentAttributes];
    const target = updated[attrIndex];
    const currentVals =
      target.values && target.values.length > 0
        ? target.values
        : target.value
        ? target.value.split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
        : [];

    const newVals = currentVals.filter((v) => v !== valToRemove);
    updated[attrIndex] = {
      ...target,
      values: newVals,
      value: newVals.join('، '),
    };
    onChange(updated);
  };

  const handleAddTagToAttached = (attrIndex: number) => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    const updated = [...currentAttributes];
    const target = updated[attrIndex];
    const currentVals =
      target.values && target.values.length > 0
        ? target.values
        : target.value
        ? target.value.split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
        : [];

    if (!currentVals.includes(trimmed)) {
      const newVals = [...currentVals, trimmed];
      updated[attrIndex] = {
        ...target,
        values: newVals,
        value: newVals.join('، '),
      };
      onChange(updated);
    }
    setNewTagInput('');
    setAddingToAttrIndex(null);
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) {
      toast.error(isPersian ? 'نام ویژگی الزامی است.' : 'Attribute name is required.');
      return;
    }

    setCreating(true);
    try {
      const generatedKey = newAttrName.trim().toLowerCase().replace(/\s+/g, '_');
      const parsedValues = newAttrValues
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await adminApi.createAttribute({
        name: newAttrName.trim(),
        key: generatedKey,
        unit: newAttrUnit.trim() || undefined,
        possibleValues: parsedValues,
      });

      // Add to current product attributes
      const newAttrList: IProductAttribute[] = [
        ...currentAttributes,
        {
          attributeId: created._id,
          name: created.name,
          key: created.key,
          values: parsedValues,
          value: parsedValues.join('، '),
          unit: created.unit,
        },
      ];

      onChange(newAttrList);
      setIsQuickCreateOpen(false);
      setNewAttrName('');
      setNewAttrValues('');
      setNewAttrUnit('');
      loadAttributes();
      toast.success(isPersian ? 'ویژگی جدید ساخته و به محصول اضافه شد!' : 'New attribute created & attached to product!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ایجاد ویژگی.' : 'Failed to create attribute.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#9f815b]" />
          <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? '۶. ویژگی‌های تخصصی و داینامیک عطر (چندمقداری)' : '6. Multi-Value Fragrance Attributes'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsQuickCreateOpen(true)}
          className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline self-start sm:self-auto cursor-pointer"
        >
          {isPersian ? '+ ایجاد ویژگی سیستمی جدید' : '+ Create Brand New Attribute'}
        </button>
      </div>

      <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
        {isPersian
          ? 'برای هر عطر می‌توانید چند گروه بویایی (مانند چوبی، شرقی، گلی)، نت‌های گوناگون یا فصول متعدد انتخاب کنید.'
          : 'Attach multiple olfactory families (e.g. Woody, Oriental, Floral), notes or seasons to this perfume.'}
      </p>

      {/* Attribute Picker and Multi-Value Selector Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <select
            value={selectedAttrId}
            onChange={(e) => {
              setSelectedAttrId(e.target.value);
              setSelectedValues([]);
              setCustomValueInput('');
            }}
            className="w-full sm:w-1/2 h-11 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
          >
            <option value="">{isPersian ? '-- انتخاب ویژگی (گروه بویایی، نت، طبع، فصل و ...) --' : '-- Select Attribute --'}</option>
            {availableAttributes.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} {a.unit ? `(${a.unit})` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddSelectedAttribute}
            disabled={!selectedAttrId || (selectedValues.length === 0 && !customValueInput.trim())}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isPersian ? 'افزودن این ویژگی با مقادیر انتخابی' : 'Attach Attribute to Perfume'}</span>
          </button>
        </div>

        {/* Multi-Value Selection Area */}
        {selectedAttrObj && (
          <div className="pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
            {selectedAttrObj.possibleValues && selectedAttrObj.possibleValues.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-[#73695c] dark:text-[#a69c8e] mb-2">
                  {isPersian
                    ? 'انتخاب مقادیر از لیست پیشنهادی (روی موارد دلخواه کلیک کنید):'
                    : 'Select suggested values (click to toggle):'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedAttrObj.possibleValues.map((val, i) => {
                    const isSelected = selectedValues.includes(val);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => togglePredefinedValue(val)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-gold text-[#141914] shadow-sm font-black ring-2 ring-[#bfa27a]/40'
                            : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{val}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Value Adder Input */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={customValueInput}
                onChange={(e) => setCustomValueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomValue();
                  }
                }}
                placeholder={isPersian ? 'افزودن مقدار دلخواه دیگر (تایپ کنید و اینتر بزنید)...' : 'Add custom value and hit Enter...'}
                className="w-full sm:w-2/3 h-10 px-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
              />
              <button
                type="button"
                onClick={handleAddCustomValue}
                disabled={!customValueInput.trim()}
                className="w-full sm:w-auto px-4 h-10 rounded-xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] font-bold text-xs border border-[#bfa27a]/40 shadow-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isPersian ? 'افزودن به این ویژگی' : 'Add Tag'}</span>
              </button>
            </div>

            {/* Selected values preview tags */}
            {selectedValues.length > 0 && (
              <div className="p-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e]">
                  {isPersian ? 'مقادیر در حال ثبت:' : 'Queued values:'}
                </span>
                {selectedValues.map((val, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-gold/15 text-[#9f815b] dark:text-[#d4be9b] border border-[#bfa27a]/30 text-xs font-bold"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedValue(val)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Added Attributes Cards / Grid */}
      {currentAttributes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {currentAttributes.map((attr, idx) => {
            const rawVals =
              attr.values && attr.values.length > 0
                ? attr.values
                : attr.value
                ? attr.value.split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
                : [];

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#1d241d] dark:text-[#f7f4ee]">
                      <Tag className="w-3.5 h-3.5 text-[#9f815b]" />
                      <span>{attr.name}</span>
                      {attr.unit && <span className="font-mono text-[11px] text-[#73695c] dark:text-[#a69c8e]">({attr.unit})</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title={isPersian ? 'حذف کل این ویژگی' : 'Remove attribute'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Multi-value tags list */}
                  <div className="flex flex-wrap gap-1.5 pt-2.5">
                    {rawVals.map((val, vIdx) => (
                      <span
                        key={vIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold shadow-2xs"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromAttached(idx, val)}
                          className="text-[#73695c] dark:text-[#a69c8e] hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {/* Button / input to add more tags to this attribute */}
                    {addingToAttrIndex === idx ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTagToAttached(idx);
                            }
                          }}
                          placeholder={isPersian ? 'مقدار جدید...' : 'New tag...'}
                          className="w-28 h-7 px-2 rounded-lg bg-[#ffffff] dark:bg-[#1c231c] border border-[#bfa27a] text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTagToAttached(idx)}
                          className="p-1 rounded-md bg-brand-gold text-[#141914] cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingToAttrIndex(null);
                            setNewTagInput('');
                          }}
                          className="p-1 rounded-md text-[#73695c] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToAttrIndex(idx);
                          setNewTagInput('');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#f0eae0] dark:bg-[#202620] text-[#73695c] dark:text-[#d4be9b] hover:border-[#bfa27a] border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isPersian ? 'افزودن مقدار' : 'Add Value'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-mono border-t border-[#e6dcce]/50 dark:border-[#2e3a2e]/50 pt-1.5">
                  key: {attr.key}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-xs text-[#73695c] dark:text-[#a69c8e]">
          {isPersian ? 'هنوز هیچ ویژگی تخصصی به این عطر متصل نشده است.' : 'No dynamic attributes attached yet.'}
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
                type="button"
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
                  placeholder={isPersian ? 'مثال: گروه بویایی، غلظت اسانس، طبع رایحه' : 'e.g. Olfactory Family, Concentration'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'مقادیر اولیه (با کاما یا اینتر جدا کنید) *' : 'Values (separated by comma or newline) *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newAttrValues}
                  onChange={(e) => setNewAttrValues(e.target.value)}
                  placeholder={isPersian ? 'مثال: چوبی، شرقی، گلی، مرکباتی، چرمی' : 'e.g. Woody, Oriental, Floral, Citrus'}
                  className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
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
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
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
