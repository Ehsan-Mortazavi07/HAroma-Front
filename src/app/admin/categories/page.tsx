'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { Layers, Plus, Edit2, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { ICategory } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { MEDIA_BASE_URL } from '@/common/constants/URL';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { SingleImageUploader } from '@/components/admin/SingleImageUploader';
import { useAppSelector } from '@/stores/hooks';

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
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);

  // Multi-selection & Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Bulk Confirm Modal state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmConfig, setBulkConfirmConfig] = useState<{
    title: string;
    description: React.ReactNode;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isBulkConfirmLoading, setIsBulkConfirmLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(categories.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkStatusChange = async (nextActive: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setCategories((prev) =>
      prev.map((c) => (selectedIds.includes(c._id) ? { ...c, isActive: nextActive } : c)),
    );
    try {
      await adminApi.bulkUpdateCategoriesStatus(selectedIds, nextActive);
      toast.success(
        nextActive
          ? isPersian
            ? `${toPersianDigits(selectedIds.length)} دسته‌بندی با موفقیت فعال گردید.`
            : `${selectedIds.length} categories activated.`
          : isPersian
          ? `${toPersianDigits(selectedIds.length)} دسته‌بندی با موفقیت غیرفعال گردید.`
          : `${selectedIds.length} categories deactivated.`,
      );
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت گروهی دسته‌بندی‌ها.' : 'Failed to update categories status.'),
      );
      loadCategories();
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (!isAdmin) {
      toast.error(isPersian ? 'حذف دسته‌بندی‌ها منحصراً برای مدیر کل مجاز است.' : 'Restricted to admin.');
      return;
    }
    if (selectedIds.length === 0) return;

    setBulkConfirmConfig({
      title: isPersian ? 'حذف گروهی دسته‌بندی‌ها' : 'Bulk Delete Categories',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف گروهی <strong className="text-brand-text font-black">{toPersianDigits(selectedIds.length)}</strong> دسته‌بندی انتخاب شده اطمینان کامل دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            محصولات متعلق به این دسته‌بندی‌ها بدون دسته‌بندی خواهند شد یا باید مجدداً دسته‌بندی شوند.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete <strong className="text-brand-text font-bold">{selectedIds.length}</strong> selected categories?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            Products assigned to these categories will become unassigned.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف گروهی' : 'Yes, Delete All',
      action: async () => {
        setBulkActionLoading(true);
        try {
          await adminApi.bulkDeleteCategories(selectedIds);
          toast.success(
            isPersian
              ? `${toPersianDigits(selectedIds.length)} دسته‌بندی با موفقیت حذف گردید.`
              : `${selectedIds.length} categories deleted successfully.`,
          );
          setSelectedIds([]);
          loadCategories();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              (isPersian ? 'خطا در حذف گروهی دسته‌بندی‌ها.' : 'Failed to delete categories.'),
          );
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
    setBulkConfirmOpen(true);
  };

  const executeBulkConfirmAction = async () => {
    if (!bulkConfirmConfig) return;
    setIsBulkConfirmLoading(true);
    try {
      await bulkConfirmConfig.action();
      setBulkConfirmOpen(false);
      setBulkConfirmConfig(null);
    } finally {
      setIsBulkConfirmLoading(false);
    }
  };

  const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < categories.length;

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setNameTouched(false);
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
    setNameTouched(false);
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
    setNameTouched(true);
    if (!name.trim()) {
      toast.error(isPersian ? 'وارد کردن نام دسته‌بندی ضروری است.' : 'Category name is required.');
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

  const handleDeleteClick = (id: string, catName: string) => {
    setCatToDelete({ id, name: catName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(catToDelete.id);
      toast.success(isPersian ? 'دسته‌بندی با موفقیت حذف شد.' : 'Category deleted successfully.');
      setDeleteModalOpen(false);
      setCatToDelete(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف دسته‌بندی.' : 'Failed to delete category.'));
    } finally {
      setIsDeleting(false);
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

      {/* Selection Toolbar / Counter */}
      {categories.length > 0 && !loading && (
        <div className="flex items-center justify-between px-4 py-2 bg-brand-surface/60 rounded-2xl border border-brand-border/60">
          <div className="flex items-center gap-2.5">
            <SmoothCheckbox
              isSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onValueChange={handleSelectAll}
              size="sm"
              ariaLabel={isPersian ? 'انتخاب همه دسته‌بندی‌ها' : 'Select all categories'}
            />
            <span className="text-xs font-bold text-brand-text">
              {isPersian ? 'انتخاب همه دسته‌بندی‌ها' : 'Select All Categories'}
            </span>
          </div>
          <span className="text-xs font-semibold text-brand-text-muted">
            {isPersian
              ? `${toPersianDigits(categories.length)} دسته‌بندی تعریف شده`
              : `${categories.length} total categories`}
          </span>
        </div>
      )}

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
            {categories.map((cat) => {
              const isSelected = selectedIds.includes(cat._id);
              return (
                <motion.div key={cat._id} variants={cardVariants} layout>
                  <Card className={`bg-brand-surface p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 transition-all h-full ${
                    isSelected
                      ? 'border-brand-gold ring-2 ring-brand-gold/25 bg-brand-gold/5'
                      : 'border-brand-border hover:border-brand-gold/60'
                  }`}>
                    <CardBody className="p-0 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <SmoothCheckbox
                              isSelected={isSelected}
                              onValueChange={() => handleSelectRow(cat._id)}
                              size="sm"
                              ariaLabel={cat.name}
                            />
                            <div className="w-11 h-11 rounded-2xl bg-brand-surface-elevated flex items-center justify-center border border-brand-border text-brand-bronze shadow-xs overflow-hidden relative shrink-0">
                              {cat.image ? (
                                <Image
                                  src={
                                    cat.image.startsWith('http://') || cat.image.startsWith('https://')
                                      ? cat.image
                                      : `${MEDIA_BASE_URL}${cat.image.startsWith('/') ? '' : '/'}${cat.image}`
                                  }
                                  alt={cat.name}
                                  fill
                                  sizes="44px"
                                  className="object-cover p-1 rounded-xl"
                                  unoptimized
                                />
                              ) : (
                                <Layers className="w-5 h-5" />
                              )}
                            </div>
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
                          onPress={() => handleDeleteClick(cat._id, cat.name)}
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
            );
          })}
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
                  <div>
                    <Input
                      label={isPersian ? 'نام فارسی دسته‌بندی' : 'Category Name (Persian)'}
                      labelPlacement="outside-top"
                      isRequired
                      value={name}
                      onValueChange={(val) => {
                        setName(val);
                        if (!nameTouched) setNameTouched(true);
                      }}
                      onBlur={() => setNameTouched(true)}
                      isInvalid={nameTouched && !name.trim()}
                      placeholder={isPersian ? 'مثال: عطر و ادکلن نیش' : 'e.g. Luxury Niche Perfumes'}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        ...inputClassNames,
                        inputWrapper:
                          nameTouched && !name.trim()
                            ? 'h-11 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-full shadow-xs transition-colors'
                            : inputClassNames.inputWrapper,
                      }}
                    />
                    {nameTouched && !name.trim() && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                        {isPersian ? 'این فیلد ضروری است (نام دسته‌بندی).' : 'Category name is required.'}
                      </p>
                    )}
                  </div>

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

                <div className="pt-2 border-t border-brand-border/60">
                  <SingleImageUploader
                    value={image}
                    onChange={setImage}
                    label={isPersian ? 'تصویر / آیکون دسته‌بندی' : 'Category Image / Icon'}
                    description={
                      isPersian
                        ? 'تصویر یا نماد اختصاصی دسته‌بندی را از سیستم آپلود کرده یا لینک اینترنتی آن را ثبت کنید تا در صفحه اصلی و اسلایدرها نمایش یابد.'
                        : 'Upload a custom photo or logo for this category, or paste an image URL.'
                    }
                    aspectRatio="square"
                  />
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

      {/* HeroUI Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={isPersian ? 'حذف دسته‌بندی' : 'Delete Category'}
        description={
          isPersian ? (
            <div>
              <p>
                آیا از حذف دسته‌بندی <strong className="text-brand-text font-black">«{catToDelete?.name}»</strong> اطمینان دارید؟
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                محصولات این دسته‌بندی بدون دسته‌بندی خواهند شد یا باید مجدداً دسته‌بندی شوند.
              </p>
            </div>
          ) : (
            <div>
              <p>
                Are you sure you want to delete category <strong className="text-brand-text font-bold">&quot;{catToDelete?.name}&quot;</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                Products linked to this category will become unassigned.
              </p>
            </div>
          )
        }
        confirmText={isPersian ? 'بله، حذف دسته‌بندی' : 'Yes, Delete Category'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Zero-Layout-Shift Fixed Floating Bulk Action Island */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-7 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.94 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pointer-events-auto bg-[#141a14]/98 dark:bg-[#121812]/98 backdrop-blur-2xl border border-brand-gold/40 shadow-2xl shadow-black/70 rounded-2xl sm:rounded-full p-2.5 sm:p-2 sm:ps-3.5 sm:pe-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 text-[#f7f4ee] w-[calc(100vw-1.5rem)] max-w-md sm:w-auto sm:max-w-none"
            >
              {/* Mobile Top Header: Count + Close Button */}
              <div className="flex sm:hidden items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 animate-pulse" />
                  <span className="text-xs font-black text-brand-gold">
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} دسته‌بندی انتخاب شده`
                      : `${selectedIds.length} categories selected`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-neutral-400 hover:text-[#f7f4ee] active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded-lg hover:bg-white/10"
                  aria-label={isPersian ? 'لغو انتخاب' : 'Cancel selection'}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Cancel'}</span>
                </button>
              </div>

              {/* Desktop Count Badge */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-brand-gold text-[#141914] font-black text-xs shadow-xs flex items-center gap-1.5 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} دسته‌بندی انتخاب شده`
                      : `${selectedIds.length} selected`}
                  </span>
                </span>
                <span className="w-px h-5 bg-white/15 shrink-0" />
              </div>

              {/* Action Buttons: Responsive Grid on Mobile, Flex on Desktop */}
              <div
                className={`grid ${
                  isAdmin ? 'grid-cols-3' : 'grid-cols-2'
                } sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto`}
              >
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkStatusChange(true)}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'فعال‌سازی' : 'Activate'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'فعال‌سازی' : 'Activate'}</span>
                  </span>
                </Button>

                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkStatusChange(false)}
                  className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'غیرفعال' : 'Deactivate'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'غیرفعال‌سازی' : 'Deactivate'}</span>
                  </span>
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    radius="full"
                    variant="flat"
                    isLoading={bulkActionLoading}
                    onPress={handleBulkDelete}
                    className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {!bulkActionLoading && <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    <span className="truncate">
                      <span className="sm:hidden">{isPersian ? 'حذف' : 'Delete'}</span>
                      <span className="hidden sm:inline">{isPersian ? 'حذف همگانی' : 'Bulk Delete'}</span>
                    </span>
                  </Button>
                )}

                {/* Desktop Deselect Button */}
                <Button
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => setSelectedIds([])}
                  className="hidden sm:flex text-neutral-400 hover:text-[#f7f4ee] hover:bg-white/10 font-bold text-xs cursor-pointer rounded-full h-8 px-2.5 transition-all items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Deselect'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Confirm Modal for Bulk Action */}
      <AdminConfirmModal
        isOpen={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={bulkConfirmConfig?.title || ''}
        description={bulkConfirmConfig?.description || null}
        confirmText={bulkConfirmConfig?.confirmText || (isPersian ? 'بله، حذف' : 'Yes, Delete')}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isBulkConfirmLoading}
        onConfirm={executeBulkConfirmAction}
      />
    </div>
  );
}
