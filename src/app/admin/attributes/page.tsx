'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IAttribute, IVariantTemplate } from '@/common/interfaces';
import { toast, toPersianDigits, formatToman, translateAttributeValue } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminPriceInput } from '@/components/admin/AdminPriceInput';

export default function AdminAttributesPage() {
  const { isPersian } = useTranslation();
  const [activeTab, setActiveTab] = useState<'variants' | 'attributes'>('variants');

  // Dynamic Attributes State
  const [attributes, setAttributes] = useState<IAttribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(true);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<IAttribute | null>(null);

  // HeroUI Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    title: string;
    description: React.ReactNode;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
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

  const handleAttrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!attrName.trim()) {
      toast.error(isPersian ? 'نام ویژگی الزامی است.' : 'Attribute name is required.');
      return;
    }

    setSubmittingAttr(true);
    try {
      const payload = {
        name: attrName.trim(),
        nameEn: attrNameEn.trim() || undefined,
        key:
          attrKey.trim() ||
          (attrNameEn || attrName)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, '_'),
        unit: attrUnit.trim() || undefined,
        possibleValues: attrPossibleValues,
        isRequired: false,
        isActive: true,
      };

      if (editingAttr) {
        await adminApi.updateAttribute(editingAttr._id, payload);
        toast.success(isPersian ? 'ویژگی با موفقیت به‌روزرسانی شد.' : 'Attribute updated.');
      } else {
        await adminApi.createAttribute(payload);
        toast.success(isPersian ? 'ویژگی جدید با موفقیت ایجاد شد.' : 'Attribute created.');
      }

      setAttrModalOpen(false);
      loadAttributes();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || (isPersian ? 'خطا در ذخیره ویژگی.' : 'Failed to save attribute.'),
      );
    } finally {
      setSubmittingAttr(false);
    }
  };

  const requestDeleteAttr = (id: string, name: string) => {
    setDeleteConfig({
      title: isPersian ? 'حذف ویژگی' : 'Delete Attribute',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف ویژگی <strong className="text-brand-text font-black">«{name}»</strong> اطمینان دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            تمام مقادیر مرتبط با این ویژگی در محصولات حذف خواهند شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete attribute <strong className="text-brand-text font-bold">&quot;{name}&quot;</strong>?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            All associated values across products will be affected.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف ویژگی' : 'Yes, Delete Attribute',
      action: async () => {
        try {
          await adminApi.deleteAttribute(id);
          toast.success(isPersian ? 'ویژگی حذف شد.' : 'Attribute deleted.');
          loadAttributes();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف ویژگی.' : 'Failed to delete attribute.'));
        }
      },
    });
    setDeleteConfirmOpen(true);
  };

  // --- VARIANT TEMPLATE HANDLERS ---
  const openCreateTplModal = () => {
    setEditingTemplate(null);
    setTplTitle('');
    setTplTitleEn('');
    setTplPrice(1200000);
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
    setTplStock(tpl.defaultStock ?? 10);
    setTplUnit(tpl.unit || 'میل');
    setTplIsPopular(tpl.isPopular ?? true);
    setTplOrder(tpl.order ?? 1);
    setTemplateModalOpen(true);
  };

  const handleTplSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const requestDeleteTpl = (id: string, title: string) => {
    setDeleteConfig({
      title: isPersian ? 'حذف الگوی تنوع' : 'Delete Variant Template',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف الگوی تنوع <strong className="text-brand-text font-black">«{title}»</strong> اطمینان دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این الگو دیگر در ساخت سریع تنوع برای محصولات جدید در دسترس نخواهد بود.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete variant template <strong className="text-brand-text font-bold">&quot;{title}&quot;</strong>?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            This template will no longer be available for fast product variant setup.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف الگو' : 'Yes, Delete Template',
      action: async () => {
        try {
          await adminApi.deleteVariantTemplate(id);
          toast.success(isPersian ? 'الگوی تنوع حذف شد.' : 'Variant template deleted.');
          loadVariantTemplates();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف الگو.' : 'Failed to delete template.'));
        }
      },
    });
    setDeleteConfirmOpen(true);
  };

  const executeDeleteAction = async () => {
    if (!deleteConfig) return;
    setIsDeletingItem(true);
    try {
      await deleteConfig.action();
      setDeleteConfirmOpen(false);
      setDeleteConfig(null);
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت تنوع‌ها، حجم‌ها و ویژگی‌های داینامیک' : 'Variant Templates & Dynamic Attributes'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'تعریف الگوهای آماده تنوع حجم عطر (۳۰، ۵۰، ۱۰۰ میل و...) و ویژگی‌های تخصصی بویایی خارج از محصول'
              : 'Create standalone volume & size variant templates and specialized olfactory attributes'}
          </p>
        </div>

        {activeTab === 'variants' ? (
          <Button
            onPress={openCreateTplModal}
            startContent={<Plus className="w-4 h-4" />}
            radius="full"
            className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer rounded-full transition-all active:scale-95"
          >
            {isPersian ? 'افزودن الگوی تنوع / حجم جدید' : 'Add New Variant Template'}
          </Button>
        ) : (
          <Button
            onPress={openCreateAttrModal}
            startContent={<Plus className="w-4 h-4" />}
            radius="full"
            className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer rounded-full transition-all active:scale-95"
          >
            {isPersian ? 'افزودن ویژگی جدید' : 'Add New Attribute'}
          </Button>
        )}
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface p-2 rounded-2xl border border-brand-border shadow-xs">
        <CardBody className="p-0 flex flex-row items-center gap-2">
          <Button
            variant={activeTab === 'variants' ? 'solid' : 'light'}
            radius="full"
            onPress={() => setActiveTab('variants')}
            className={`flex-1 h-11 text-xs font-black cursor-pointer rounded-full ${
              activeTab === 'variants'
                ? 'bg-brand-gold text-[#141914] shadow-sm'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
            startContent={<Layers className="w-4 h-4" />}
            endContent={
              <Chip size="sm" variant="flat" className="text-[10px] h-5 min-w-5 px-1 bg-black/10">
                {isPersian ? toPersianDigits(variantTemplates.length) : variantTemplates.length}
              </Chip>
            }
          >
            {isPersian ? 'تنوع‌ها و الگوهای حجم محصول (واریانت‌ها)' : 'Variant & Size Templates'}
          </Button>

          <Button
            variant={activeTab === 'attributes' ? 'solid' : 'light'}
            radius="full"
            onPress={() => setActiveTab('attributes')}
            className={`flex-1 h-11 text-xs font-black cursor-pointer rounded-full ${
              activeTab === 'attributes'
                ? 'bg-brand-gold text-[#141914] shadow-sm'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
            startContent={<Sparkles className="w-4 h-4" />}
            endContent={
              <Chip size="sm" variant="flat" className="text-[10px] h-5 min-w-5 px-1 bg-black/10">
                {isPersian ? toPersianDigits(attributes.length) : attributes.length}
              </Chip>
            }
          >
            {isPersian ? 'ویژگی‌های تخصصی (نت بویایی، فصل و...)' : 'Specialized Attributes'}
          </Button>
        </CardBody>
      </Card>
      </motion.div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
      {/* TAB 1: VARIANT TEMPLATES GRID */}
      {activeTab === 'variants' && (
        <div>
          {loadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-44 rounded-3xl bg-brand-surface-elevated"
                />
              ))}
            </div>
          ) : variantTemplates.length === 0 ? (
            <Card className="bg-brand-surface rounded-3xl p-12 text-center border border-brand-border space-y-3">
              <CardBody className="flex flex-col items-center">
                <Layers className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
                <h3 className="font-bold text-sm text-brand-text mb-1">
                  {isPersian ? 'هیچ الگوی تنوع یا حجمی ثبت نشده است.' : 'No variant templates found.'}
                </h3>
                <p className="text-xs text-brand-text-muted mb-4">
                  {isPersian
                    ? 'الگوهایی مانند «۵۰ میل»، «۱۰۰ میل» یا «دستریز» بسازید تا هنگام ثبت محصول با ۱ کلیک اعمال شوند.'
                    : 'Create preset sizes like 50ml, 100ml, or Decants to apply in 1-click when adding products.'}
                </p>
                <Button
                  onPress={openCreateTplModal}
                  startContent={<Plus className="w-4 h-4" />}
                  radius="full"
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs shadow-sm cursor-pointer"
                >
                  {isPersian ? 'ساخت اولین الگوی تنوع' : 'Create First Template'}
                </Button>
              </CardBody>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
              }}
            >
              <AnimatePresence>
                {variantTemplates.map((tpl) => (
                  <motion.div
                    key={tpl._id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 360, damping: 28 } },
                    }}
                    layout
                  >
                    <Card
                      className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors group h-full"
                    >
                      <CardBody className="p-0 space-y-4 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-black text-base text-brand-text">
                                {isPersian ? tpl.title : tpl.titleEn || tpl.title}
                              </h3>
                              {tpl.titleEn && (
                                <span className="text-xs text-brand-text-muted font-sans">
                                  {tpl.titleEn}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="light"
                                onPress={() => openEditTplModal(tpl)}
                                className="text-brand-text hover:bg-brand-surface-elevated cursor-pointer"
                                aria-label={isPersian ? 'ویرایش الگو' : 'Edit template'}
                              >
                                <Edit2 className="w-4 h-4 text-brand-bronze" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="light"
                                onPress={() => requestDeleteTpl(tpl._id, tpl.title)}
                                className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                aria-label={isPersian ? 'حذف الگو' : 'Delete template'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Price & Stock info pills */}
                          <div className="p-3.5 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-brand-text-muted font-medium">
                                {isPersian ? 'قیمت پیشنهادی:' : 'Default Price:'}
                              </span>
                              <span className="font-black text-brand-text dark:text-brand-gold">
                                {formatToman(tpl.defaultPrice, isPersian)}
                              </span>
                            </div>

                            {tpl.defaultDiscountPrice && tpl.defaultDiscountPrice > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-brand-text-muted font-medium">
                                  {isPersian ? 'قیمت تخفیف‌دار:' : 'Discount Price:'}
                                </span>
                                <span className="font-bold text-brand-bronze dark:text-brand-gold">
                                  {formatToman(tpl.defaultDiscountPrice, isPersian)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-brand-border/60">
                              <span className="text-brand-text-muted">
                                {isPersian ? 'موجودی پیش‌فرض:' : 'Default Stock:'}
                              </span>
                              <span className="font-bold text-brand-text">
                                {isPersian ? toPersianDigits(tpl.defaultStock) : tpl.defaultStock}{' '}
                                {tpl.unit || 'عدد'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-brand-text-muted pt-1">
                          <Chip size="sm" variant="flat" className="bg-brand-surface-elevated text-brand-text border border-brand-border text-[10px]">
                            {isPersian ? 'واحد:' : 'Unit:'} {tpl.unit || 'میل'}
                          </Chip>
                          {tpl.isPopular && (
                            <Chip size="sm" variant="flat" className="bg-brand-gold/20 text-brand-bronze dark:text-brand-gold font-bold border border-brand-gold/40 text-[10px]">
                              {isPersian ? '★ پرکاربرد در محصولات' : '★ Popular'}
                            </Chip>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* TAB 2: DYNAMIC ATTRIBUTES GRID */}
      {activeTab === 'attributes' && (
        <div>
          {loadingAttrs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-48 rounded-3xl bg-brand-surface-elevated"
                />
              ))}
            </div>
          ) : attributes.length === 0 ? (
            <Card className="bg-brand-surface rounded-3xl p-12 text-center border border-brand-border space-y-3">
              <CardBody className="flex flex-col items-center">
                <Sparkles className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
                <h3 className="font-bold text-sm text-brand-text mb-4">
                  {isPersian ? 'هیچ ویژگی ثبت نشده است.' : 'No attributes found.'}
                </h3>
                <Button
                  onPress={openCreateAttrModal}
                  startContent={<Plus className="w-4 h-4" />}
                  radius="full"
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-bold text-xs shadow-sm cursor-pointer"
                >
                  {isPersian ? 'افزودن ویژگی جدید' : 'Add Attribute'}
                </Button>
              </CardBody>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
              }}
            >
              <AnimatePresence>
                {attributes.map((attr) => (
                  <motion.div
                    key={attr._id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 360, damping: 28 } },
                    }}
                    layout
                  >
                    <Card
                      className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors group h-full"
                    >
                      <CardBody className="p-0 space-y-4 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-black text-base text-brand-text">
                                {isPersian ? attr.name : attr.nameEn || attr.name}
                              </h3>
                              <span className="text-xs font-mono font-bold text-brand-bronze dark:text-brand-gold">
                                {attr.key}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="light"
                                onPress={() => openEditAttrModal(attr)}
                                className="text-brand-text hover:bg-brand-surface-elevated cursor-pointer"
                                aria-label={isPersian ? 'ویرایش ویژگی' : 'Edit attribute'}
                              >
                                <Edit2 className="w-4 h-4 text-brand-bronze" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="light"
                                onPress={() => requestDeleteAttr(attr._id, attr.name)}
                                className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                aria-label={isPersian ? 'حذف ویژگی' : 'Delete attribute'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {attr.unit && (
                            <div className="text-[11px] text-brand-text-muted">
                              {isPersian ? 'واحد سنجش:' : 'Unit:'}{' '}
                              <span className="font-bold text-brand-text">
                                {attr.unit}
                              </span>
                            </div>
                          )}

                          {/* Possible Values Chips */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-brand-text-muted">
                              {isPersian ? 'گزینه‌ها و مقادیر مجاز:' : 'Allowed Values:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {attr.possibleValues && attr.possibleValues.length > 0 ? (
                                attr.possibleValues.map((val, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    className="bg-brand-surface-elevated text-brand-text border border-brand-border text-[11px] font-medium"
                                  >
                                    {translateAttributeValue(val, isPersian)}
                                  </Chip>
                                ))
                              ) : (
                                <span className="text-[11px] text-brand-text-muted italic">
                                  {isPersian ? 'مقدار متنی آزاد' : 'Free text'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-brand-border text-[11px] text-brand-text-muted flex items-center justify-between">
                          <span>
                            {isPersian
                              ? `${toPersianDigits(attr.possibleValues?.length || 0)} مقدار از پیش تعریف‌شده`
                              : `${attr.possibleValues?.length || 0} predefined values`}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
      </motion.div>

      {/* VARIANT TEMPLATE MODAL */}
      <Modal
        isOpen={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-lg mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-4",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 font-black text-base">
                <Layers className="w-5 h-5 text-brand-bronze" />
                <span>
                  {editingTemplate
                    ? isPersian ? 'ویرایش الگوی تنوع / حجم' : 'Edit Variant Template'
                    : isPersian ? 'تعریف الگوی تنوع / حجم جدید' : 'Create Variant Template'}
                </span>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'عنوان تنوع (فارسی)' : 'Variant Title (Persian)'}
                    labelPlacement="outside-top"
                    isRequired
                    value={tplTitle}
                    onValueChange={setTplTitle}
                    placeholder={isPersian ? 'مثال: حجم ۵۰ میلی‌لیتر' : 'e.g. 50 ml'}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'عنوان تنوع (انگلیسی)' : 'Variant Title (English)'}
                    labelPlacement="outside-top"
                    value={tplTitleEn}
                    onValueChange={setTplTitleEn}
                    placeholder="e.g. 50 ml Standard"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AdminPriceInput
                    label={isPersian ? 'قیمت پیشنهادی پیش‌فرض (تومان)' : 'Default Price (Toman)'}
                    isRequired
                    value={tplPrice}
                    onValueChange={(val) => setTplPrice(val)}
                    placeholder={isPersian ? 'مثال: ۱,۵۰۰,۰۰۰' : 'e.g. 1,500,000'}
                  />

                  <AdminPriceInput
                    label={isPersian ? 'قیمت تخفیف پیش‌فرض (اختیاری)' : 'Default Discount Price'}
                    value={tplDiscountPrice}
                    onValueChange={(val) => setTplDiscountPrice(val ? val : '')}
                    placeholder={isPersian ? 'مثال: ۱,۲۹۰,۰۰۰' : 'e.g. 1,290,000'}
                  />
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={isPersian ? 'موجودی پیش‌فرض' : 'Default Stock'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(tplStock)}
                    onValueChange={(v) => setTplStock(v === '' ? '' : Number(v))}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'واحد سنجش' : 'Unit'}
                    labelPlacement="outside-top"
                    value={tplUnit}
                    onValueChange={setTplUnit}
                    placeholder="میل / ml"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'اولویت ترتیب' : 'Order'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(tplOrder)}
                    onValueChange={(v) => setTplOrder(v === '' ? '' : Number(v))}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                <div className="pt-2">
                  <SmoothSwitch isSelected={tplIsPopular} onValueChange={setTplIsPopular}>
                    {isPersian
                      ? 'نمایش به عنوان الگوی پرکاربرد در فرم ساخت محصول'
                      : 'Show as quick preset in Product Form'}
                  </SmoothSwitch>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submittingTpl}
                  radius="full"
                  onPress={() => handleTplSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ذخیره الگو' : 'Save Template'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* DYNAMIC ATTRIBUTE MODAL */}
      <Modal
        isOpen={attrModalOpen}
        onOpenChange={setAttrModalOpen}
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-lg mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-4",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 font-black text-base">
                <Sparkles className="w-5 h-5 text-brand-bronze" />
                <span>
                  {editingAttr
                    ? isPersian ? 'ویرایش ویژگی داینامیک' : 'Edit Dynamic Attribute'
                    : isPersian ? 'تعریف ویژگی داینامیک جدید' : 'Create Dynamic Attribute'}
                </span>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'نام ویژگی (فارسی)' : 'Attribute Name (Persian)'}
                    labelPlacement="outside-top"
                    isRequired
                    value={attrName}
                    onValueChange={setAttrName}
                    placeholder={isPersian ? 'مثال: طبع عطر' : 'e.g. Scent Nature'}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'نام ویژگی (انگلیسی)' : 'Attribute Name (English)'}
                    labelPlacement="outside-top"
                    value={attrNameEn}
                    onValueChange={setAttrNameEn}
                    placeholder="e.g. Scent Nature"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'کلید سیستمی (انگلیسی/یکتا)' : 'System Key (Unique)'}
                    labelPlacement="outside-top"
                    value={attrKey}
                    onValueChange={setAttrKey}
                    placeholder="e.g. scent_nature"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold font-mono font-bold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'واحد سنجش (اختیاری)' : 'Unit (Optional)'}
                    labelPlacement="outside-top"
                    value={attrUnit}
                    onValueChange={setAttrUnit}
                    placeholder="میل / گرم / ساعت"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-semibold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                {/* Allowed Possible Values */}
                <div className="space-y-2 pt-2 border-t border-brand-border">
                  <label className="block font-bold text-xs text-brand-text">
                    {isPersian ? 'تعریف مقادیر پیش‌فرض / گزینه‌ها' : 'Define Allowed Values'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={attrValueInput}
                      onValueChange={setAttrValueInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPossibleValue();
                        }
                      }}
                      placeholder={isPersian ? 'یک مقدار وارد کرده و افزودن را بزنید (مثال: خنک)' : 'Enter value and click Add'}
                      variant="bordered"
                      radius="full"
                      className="flex-1"
                      classNames={{
                        inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                        input: "text-xs font-semibold text-brand-text",
                      }}
                    />
                    <Button
                      onPress={addPossibleValue}
                      radius="full"
                      variant="flat"
                      className="bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold border border-brand-border font-bold text-xs"
                    >
                      {isPersian ? 'افزودن' : 'Add'}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 max-h-32 overflow-y-auto">
                    {attrPossibleValues.map((val, idx) => (
                      <Chip
                        key={idx}
                        size="sm"
                        variant="flat"
                        onClose={() => removePossibleValue(val)}
                        className="bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-bold text-xs"
                      >
                        {val}
                      </Chip>
                    ))}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submittingAttr}
                  radius="full"
                  onPress={() => handleAttrSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ذخیره ویژگی' : 'Save Attribute'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* HeroUI Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={deleteConfig?.title || ''}
        description={deleteConfig?.description || null}
        confirmText={deleteConfig?.confirmText || (isPersian ? 'بله، حذف' : 'Yes, Delete')}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isDeletingItem}
        onConfirm={executeDeleteAction}
      />
    </div>
  );
}
