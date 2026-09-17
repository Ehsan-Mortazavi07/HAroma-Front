'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { ICategory } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 360, damping: 28 },
  },
};

const inputClassNames = {
  inputWrapper:
    'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:border-brand-gold rounded-full shadow-xs transition-colors',
  input: 'text-xs font-semibold text-brand-text',
  label: 'text-xs font-bold text-brand-text mb-1',
};

export default function AdminCategoriesPage() {
  const { isPersian, isRTL } = useTranslation();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState(0);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setNameEn('');
    setSlug('');
    setParentId('');
    setDescription('');
    setImage('');
    setOrder(categories.length + 1);
    setIsFeatured(true);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: ICategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setNameEn(cat.nameEn || '');
    setSlug(cat.slug);
    const pId =
      cat.parentId && typeof cat.parentId === 'object'
        ? String(cat.parentId._id)
        : typeof cat.parentId === 'string'
        ? cat.parentId
        : '';
    setParentId(pId);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setOrder(cat.order || 1);
    setIsFeatured(cat.isFeatured ?? true);
    setIsActive(cat.isActive ?? true);
    setModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error(isPersian ? 'نام دسته‌بندی الزامی است.' : 'Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        parentId: parentId || null,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        order: Number(order) || 0,
        isFeatured,
        isActive,
      };

      if (editingCat) {
        await adminApi.updateCategory(editingCat._id, payload);
        toast.success(isPersian ? 'دسته‌بندی با موفقیت به‌روزرسانی شد.' : 'Category updated successfully.');
      } else {
        await adminApi.createCategory(payload);
        toast.success(isPersian ? 'دسته‌بندی جدید با موفقیت ایجاد شد.' : 'Category created successfully.');
      }

      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره دسته‌بندی.' : 'Failed to save category.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: ICategory, nextStatus: boolean) => {
    // Instant optimistic update
    setCategories((prev) =>
      prev.map((c) => (c._id === cat._id ? { ...c, isActive: nextStatus } : c)),
    );
    try {
      await adminApi.updateCategory(cat._id, { isActive: nextStatus });
      toast.success(
        nextStatus
          ? isPersian ? 'دسته‌بندی با موفقیت فعال شد.' : 'Category activated.'
          : isPersian ? 'دسته‌بندی غیرفعال شد.' : 'Category deactivated.'
      );
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: !nextStatus } : c)),
      );
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در تغییر وضعیت دسته‌بندی.' : 'Failed to toggle status.'));
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(isPersian ? `آیا از حذف دسته‌بندی «${catName}» اطمینان دارید؟` : `Are you sure you want to delete category "${catName}"?`)) return;

    try {
      await adminApi.deleteCategory(id);
      toast.success(isPersian ? 'دسته‌بندی با موفقیت حذف شد.' : 'Category deleted successfully.');
      loadCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف دسته‌بندی.' : 'Failed to delete category.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت دسته‌بندی‌های فروشگاه' : 'Categories Management'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'دسته‌بندی‌ها برای تفکیک عطرها، ادکلن‌های نیش، بادی‌اسپلش و ست‌های کادویی'
              : 'Organize perfumes, colognes, body sprays, and luxury gift sets'}
          </p>
        </div>

        <Button
          onPress={openCreateModal}
          startContent={<Plus className="w-4 h-4" />}
          radius="full"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer rounded-full transition-all active:scale-95"
        >
          {isPersian ? 'افزودن دسته‌بندی جدید' : 'Add Category'}
        </Button>
      </motion.div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-3xl bg-brand-surface-elevated" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="col-span-full p-12 text-center bg-brand-surface rounded-3xl border border-brand-border space-y-3">
            <CardBody className="flex flex-col items-center">
              <Layers className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'هنوز دسته‌بندی تعریف نشده است' : 'No categories defined yet'}
              </h3>
            </CardBody>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          <AnimatePresence>
            {categories.map((cat) => (
              <motion.div key={cat._id} variants={cardVariants} layout>
                <Card className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors h-full">
                  <CardBody className="p-0 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-surface-elevated flex items-center justify-center border border-brand-border text-brand-bronze shadow-xs">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {cat.isFeatured && (
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-bold text-[10px]"
                            >
                              {isPersian ? 'ویژه صفحه اصلی' : 'Featured'}
                            </Chip>
                          )}
                          <SmoothSwitch
                            size="sm"
                            isSelected={cat.isActive !== false}
                            onValueChange={(val) => handleToggleStatus(cat, val)}
                            isRtl={isRTL}
                          >
                            <span className={`text-[11px] font-bold ${cat.isActive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-text-muted'}`}>
                              {cat.isActive !== false ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                            </span>
                          </SmoothSwitch>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-black text-sm text-brand-text">
                          {isPersian ? cat.name : cat.nameEn || cat.name}
                        </h3>
                        {((isPersian && cat.nameEn) || (!isPersian && cat.nameEn)) && (
                          <div className="text-xs text-brand-text-muted font-sans">
                            {isPersian ? cat.nameEn : cat.name}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] font-mono text-brand-text-muted bg-brand-surface-elevated px-2 py-0.5 rounded-md border border-brand-border/60">
                          {cat.slug}
                        </span>
                        {cat.parentId && (
                          <span className="text-[10px] text-brand-bronze dark:text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-md border border-brand-gold/30">
                            {isPersian ? 'زیرمجموعه:' : 'Sub of:'}{' '}
                            {typeof cat.parentId === 'object' && cat.parentId
                              ? (isPersian ? cat.parentId.name : cat.parentId.nameEn || cat.parentId.name)
                              : categories.find((c) => c._id === cat.parentId)?.name || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-text-muted">
                        {isPersian ? `اولویت: ${toPersianDigits(cat.order || 1)}` : `Order: ${cat.order || 1}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => openEditModal(cat)}
                          className="text-brand-text hover:bg-brand-surface-elevated cursor-pointer"
                          aria-label={isPersian ? 'ویرایش' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => handleDelete(cat._id, cat.name)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          aria-label={isPersian ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
        size="2xl"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl mx-4",
          header: "border-b border-brand-border pb-3 px-6 pt-5",
          body: "py-5 px-6",
          footer: "border-t border-brand-border pt-3 px-6 pb-5",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-black text-base">
                {editingCat
                  ? isPersian ? 'ویرایش دسته‌بندی' : 'Edit Category'
                  : isPersian ? 'تعریف دسته‌بندی جدید' : 'New Category'}
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'نام فارسی دسته‌بندی' : 'Category Name (Persian)'}
                    labelPlacement="outside-top"
                    isRequired
                    value={name}
                    onValueChange={setName}
                    placeholder={isPersian ? 'مثال: عطر و ادکلن نیش' : 'e.g. Luxury Niche Perfumes'}
                    variant="bordered"
                    radius="full"
                    classNames={inputClassNames}
                  />

                  <Input
                    label={isPersian ? 'نام انگلیسی دسته‌بندی' : 'Category Name (English)'}
                    labelPlacement="outside-top"
                    value={nameEn}
                    onValueChange={setNameEn}
                    placeholder="e.g. Niche Perfumes"
                    variant="bordered"
                    radius="full"
                    classNames={inputClassNames}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={isPersian ? 'دسته والد (اختیاری برای ساب‌کتگوری)' : 'Parent Category (Optional)'}
                    labelPlacement="outside-top"
                    selectedKeys={parentId ? new Set([parentId]) : new Set([])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setParentId(selected || '');
                    }}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      trigger: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs text-xs font-semibold text-brand-text text-start transition-colors',
                      value: 'text-xs font-semibold text-brand-text text-start',
                      label: 'text-xs font-bold text-brand-text mb-1',
                      popoverContent: 'bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl',
                    }}
                  >
                    {categories
                      .filter((c) => !editingCat || c._id !== editingCat._id)
                      .map((c) => (
                        <SelectItem key={c._id} textValue={isPersian ? c.name : c.nameEn || c.name}>
                          {isPersian ? c.name : c.nameEn || c.name}
                        </SelectItem>
                      ))}
                  </Select>

                  <Input
                    label={isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                    labelPlacement="outside-top"
                    value={slug}
                    onValueChange={setSlug}
                    placeholder="e.g. niche-perfumes"
                    variant="bordered"
                    radius="full"
                    classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} font-mono` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'اولویت نمایش' : 'Display Order'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(order)}
                    onValueChange={(val) => setOrder(Number(val) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={inputClassNames}
                  />

                  <div className="flex items-center gap-4 pt-6">
                    <div className="flex-1 p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-between">
                      <SmoothSwitch
                        isSelected={isActive}
                        onValueChange={setIsActive}
                        isRtl={isRTL}
                      >
                        <span className="text-xs font-bold text-brand-text">
                          {isPersian ? 'دسته‌بندی فعال' : 'Active'}
                        </span>
                      </SmoothSwitch>
                    </div>

                    <div className="flex-1 p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-between">
                      <SmoothSwitch
                        isSelected={isFeatured}
                        onValueChange={setIsFeatured}
                        isRtl={isRTL}
                      >
                        <span className="text-xs font-bold text-brand-text">
                          {isPersian ? 'ویژه صفحه اصلی' : 'Featured'}
                        </span>
                      </SmoothSwitch>
                    </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95 px-5"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submitting}
                  radius="full"
                  onPress={() => handleSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95 px-6"
                >
                  {isPersian ? 'ذخیره دسته‌بندی' : 'Save Category'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
