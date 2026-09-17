'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, X, Check, Tag } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Skeleton,
} from '@heroui/react';
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

  const handleQuickCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

        <Button
          size="sm"
          variant="light"
          color="warning"
          onPress={() => setIsQuickCreateOpen(true)}
          startContent={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] self-start sm:self-auto cursor-pointer"
        >
          {isPersian ? '+ ایجاد ویژگی سیستمی جدید' : '+ Create Brand New Attribute'}
        </Button>
      </div>

      <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
        {isPersian
          ? 'برای هر عطر می‌توانید چند گروه بویایی (مانند چوبی، شرقی، گلی)، نت‌های گوناگون یا فصول متعدد انتخاب کنید.'
          : 'Attach multiple olfactory families (e.g. Woody, Oriental, Floral), notes or seasons to this perfume.'}
      </p>

      {/* Attribute Picker Box */}
      <Card className="bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] shadow-none rounded-2xl overflow-visible">
        <CardBody className="p-4 sm:p-5 space-y-4 overflow-visible">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Select
              aria-label={isPersian ? 'انتخاب ویژگی' : 'Select Attribute'}
              placeholder={isPersian ? 'انتخاب ویژگی تخصصی (گروه بویایی، نت، طبع، فصل...)' : 'Select Fragrance Attribute...'}
              selectedKeys={selectedAttrId ? new Set([selectedAttrId]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedAttrId(selected || '');
                setSelectedValues([]);
                setCustomValueInput('');
              }}
              variant="bordered"
              radius="full"
              className="w-full sm:w-2/3"
              classNames={{
                trigger: 'bg-[#ffffff] dark:bg-[#1c231c] border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold h-11 text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] rounded-full text-start shadow-xs',
                value: 'text-xs font-bold text-start',
                popoverContent: 'bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] rounded-2xl shadow-xl',
              }}
            >
              {availableAttributes.map((a) => (
                <SelectItem key={a._id} textValue={`${a.name} ${a.unit ? `(${a.unit})` : ''}`}>
                  {a.name} {a.unit ? `(${a.unit})` : ''}
                </SelectItem>
              ))}
            </Select>

            <Button
              size="md"
              radius="full"
              color="warning"
              isDisabled={!selectedAttrId || (selectedValues.length === 0 && !customValueInput.trim())}
              onPress={handleAddSelectedAttribute}
              startContent={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto h-11 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-xs"
            >
              {isPersian ? 'افزودن این ویژگی با مقادیر انتخابی' : 'Attach Attribute to Perfume'}
            </Button>
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
                        <Button
                          key={i}
                          size="sm"
                          radius="full"
                          variant={isSelected ? 'solid' : 'bordered'}
                          onPress={() => togglePredefinedValue(val)}
                          startContent={isSelected ? <Check className="w-3.5 h-3.5" /> : undefined}
                          className={`text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-gold text-[#141914] shadow-sm font-black'
                              : 'bg-[#ffffff] dark:bg-[#1c231c] text-[#73695c] dark:text-[#a69c8e] border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                          }`}
                        >
                          {val}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Value Adder Input */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Input
                  value={customValueInput}
                  onValueChange={setCustomValueInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomValue();
                    }
                  }}
                  placeholder={isPersian ? 'افزودن مقدار دلخواه دیگر (تایپ کنید و اینتر بزنید)...' : 'Add custom value and hit Enter...'}
                  variant="bordered"
                  radius="full"
                  className="w-full sm:w-2/3"
                  classNames={{
                    inputWrapper: 'bg-[#ffffff] dark:bg-[#1c231c] border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold h-10',
                    input: 'text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                  }}
                />
                <Button
                  size="sm"
                  radius="full"
                  variant="bordered"
                  isDisabled={!customValueInput.trim()}
                  onPress={handleAddCustomValue}
                  startContent={<Plus className="w-3.5 h-3.5" />}
                  className="w-full sm:w-auto h-10 px-4 font-bold text-xs border-[#bfa27a]/40 text-[#9f815b] dark:text-[#d4be9b]"
                >
                  {isPersian ? 'افزودن به این ویژگی' : 'Add Tag'}
                </Button>
              </div>

              {/* Selected values preview tags */}
              {selectedValues.length > 0 && (
                <div className="p-3 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e]">
                    {isPersian ? 'مقادیر در حال ثبت:' : 'Queued values:'}
                  </span>
                  {selectedValues.map((val, idx) => (
                    <Chip
                      key={idx}
                      size="sm"
                      variant="flat"
                      color="warning"
                      onClose={() => handleRemoveSelectedValue(val)}
                      className="font-bold text-xs"
                    >
                      {val}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

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
              <Card
                key={idx}
                className="bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs rounded-2xl"
              >
                <CardBody className="p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#1d241d] dark:text-[#f7f4ee]">
                        <Tag className="w-3.5 h-3.5 text-[#9f815b]" />
                        <span>{attr.name}</span>
                        {attr.unit && <span className="font-mono text-[11px] text-[#73695c] dark:text-[#a69c8e]">({attr.unit})</span>}
                      </div>

                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemoveAttribute(idx)}
                        className="text-rose-500 hover:text-rose-700 h-7 w-7 min-w-7"
                        aria-label={isPersian ? 'حذف کل این ویژگی' : 'Remove attribute'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Multi-value tags list */}
                    <div className="flex flex-wrap gap-1.5 pt-2.5">
                      {rawVals.map((val, vIdx) => (
                        <Chip
                          key={vIdx}
                          size="sm"
                          variant="bordered"
                          onClose={() => handleRemoveTagFromAttached(idx, val)}
                          className="bg-[#ffffff] dark:bg-[#1c231c] border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold"
                        >
                          {val}
                        </Chip>
                      ))}

                      {/* Button / input to add more tags to this attribute */}
                      {addingToAttrIndex === idx ? (
                        <div className="inline-flex items-center gap-1">
                          <Input
                            autoFocus
                            size="sm"
                            value={newTagInput}
                            onValueChange={setNewTagInput}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTagToAttached(idx);
                              }
                            }}
                            placeholder={isPersian ? 'مقدار جدید...' : 'New tag...'}
                            variant="bordered"
                            radius="full"
                            className="w-28"
                            classNames={{
                              inputWrapper: 'h-7 bg-[#ffffff] dark:bg-[#1c231c] border-brand-gold',
                              input: 'text-xs font-semibold',
                            }}
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            radius="full"
                            color="warning"
                            onPress={() => handleAddTagToAttached(idx)}
                            className="h-7 w-7 min-w-7 bg-brand-gold text-[#141914]"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            radius="full"
                            variant="light"
                            onPress={() => {
                              setAddingToAttrIndex(null);
                              setNewTagInput('');
                            }}
                            className="h-7 w-7 min-w-7 text-[#73695c]"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => {
                            setAddingToAttrIndex(idx);
                            setNewTagInput('');
                          }}
                          startContent={<Plus className="w-3 h-3" />}
                          className="h-7 px-2 text-xs font-bold border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#d4be9b]"
                        >
                          {isPersian ? 'افزودن مقدار' : 'Add Value'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-mono border-t border-[#e6dcce]/50 dark:border-[#2e3a2e]/50 pt-1.5">
                    key: {attr.key}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[#e6dcce] dark:border-[#2e3a2e] text-xs text-[#73695c] dark:text-[#a69c8e]">
          {isPersian ? 'هنوز هیچ ویژگی تخصصی به این عطر متصل نشده است.' : 'No dynamic attributes attached yet.'}
        </div>
      )}

      {/* Quick Create Attribute Modal */}
      <Modal
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl mx-4',
          header: 'border-b border-[#e6dcce] dark:border-[#2e3a2e] pb-3',
          body: 'py-4',
          footer: 'border-t border-[#e6dcce] dark:border-[#2e3a2e] pt-3',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'ایجاد ویژگی جدید در سیستم' : 'Create New System Attribute'}
                </h3>
              </ModalHeader>

              <ModalBody className="space-y-4 text-xs">
                <Input
                  label={isPersian ? 'عنوان ویژگی *' : 'Attribute Title *'}
                  labelPlacement="outside-top"
                  isRequired
                  value={newAttrName}
                  onValueChange={setNewAttrName}
                  placeholder={isPersian ? 'مثال: گروه بویایی، غلظت اسانس، طبع رایحه' : 'e.g. Olfactory Family, Concentration'}
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-xs font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Textarea
                  label={isPersian ? 'مقادیر اولیه (با کاما یا اینتر جدا کنید) *' : 'Values (separated by comma or newline) *'}
                  labelPlacement="outside-top"
                  rows={3}
                  isRequired
                  value={newAttrValues}
                  onValueChange={setNewAttrValues}
                  placeholder={isPersian ? 'مثال: چوبی، شرقی، گلی، مرکباتی، چرمی' : 'e.g. Woody, Oriental, Floral, Citrus'}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: 'p-3 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                    input: 'text-xs font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Input
                  label={isPersian ? 'واحد اندازه‌گیری (اختیاری)' : 'Unit (Optional)'}
                  labelPlacement="outside-top"
                  value={newAttrUnit}
                  onValueChange={setNewAttrUnit}
                  placeholder={isPersian ? 'میل، درصد، گرم' : 'ml, %, gr'}
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-xs font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="font-bold text-xs"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  color="warning"
                  radius="full"
                  isLoading={creating}
                  onPress={() => handleQuickCreate()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md"
                >
                  {isPersian ? 'ثبت و افزودن به محصول' : 'Create & Attach'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
