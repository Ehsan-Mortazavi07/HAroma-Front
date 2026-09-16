'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
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

export default function AdminCategoriesPage() {
  const { isPersian } = useTranslation();
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

  const handleToggleStatus = async (cat: ICategory) => {
    const nextStatus = cat.isActive === false ? true : false;
    try {
      await adminApi.updateCategory(cat._id, { isActive: nextStatus });
      toast.success(
        nextStatus
          ? isPersian ? 'دسته‌بندی با موفقیت فعال شد.' : 'Category activated.'
          : isPersian ? 'دسته‌بندی غیرفعال شد.' : 'Category deactivated.'
      );
      loadCategories();
    } catch (err: any) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          radius="lg"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer"
        >
          {isPersian ? 'افزودن دسته‌بندی جدید' : 'Add Category'}
        </Button>
      </div>

      {/* Categories Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-44 rounded-3xl bg-brand-surface-elevated"
            />
          ))
        ) : categories.length === 0 ? (
          <Card className="col-span-full p-12 text-center bg-brand-surface rounded-3xl border border-brand-border space-y-3">
            <CardBody className="flex flex-col items-center">
              <Layers className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'هنوز دسته‌بندی تعریف نشده است' : 'No categories defined yet'}
              </h3>
            </CardBody>
          </Card>
        ) : (
          categories.map((cat) => (
            <Card
              key={cat._id}
              className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors"
            >
              <CardBody className="p-0 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-brand-surface-elevated flex items-center justify-center border border-brand-border text-brand-bronze">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Chip
                        size="sm"
                        variant="flat"
                        onClick={() => handleToggleStatus(cat)}
                        className={`cursor-pointer font-black text-[10px] ${
                          cat.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border'
                        }`}
                      >
                        {cat.isActive !== false ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                      </Chip>
                      {cat.isFeatured && (
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-bold text-[10px]"
                        >
                          {isPersian ? 'ویژه صفحه اصلی' : 'Featured'}
                        </Chip>
                      )}
                      {cat.parentId && (
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-brand-surface-elevated text-brand-text-muted border border-brand-border text-[10px]"
                        >
                          {isPersian ? 'زیرمجموعه:' : 'Sub of:'}{' '}
                          {typeof cat.parentId === 'object' && cat.parentId
                            ? (isPersian ? cat.parentId.name : cat.parentId.nameEn || cat.parentId.name)
                            : categories.find((c) => c._id === cat.parentId)?.name || ''}
                        </Chip>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-sm text-brand-text">
                    {isPersian ? cat.name : cat.nameEn || cat.name}
                  </h3>
                  {((isPersian && cat.nameEn) || (!isPersian && cat.nameEn)) && (
                    <div className="text-xs text-brand-text-muted font-sans mt-0.5">
                      {isPersian ? cat.nameEn : cat.name}
                    </div>
                  )}
                  <div className="text-[11px] text-brand-text-muted font-mono mt-1">
                    slug: {cat.slug}
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
                      radius="lg"
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
                      radius="lg"
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
          ))
        )}
      </div>

      {/* Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
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
              <ModalHeader className="font-black text-base">
                {editingCat
                  ? isPersian ? 'ویرایش دسته‌بندی' : 'Edit Category'
                  : isPersian ? 'تعریف دسته‌بندی جدید' : 'New Category'}
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Input
                  label={isPersian ? 'نام فارسی دسته‌بندی' : 'Category Name (Persian)'}
                  isRequired
                  value={name}
                  onValueChange={setName}
                  placeholder={isPersian ? 'مثال: عطر و ادکلن نیش' : 'e.g. Luxury Niche Perfumes'}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Input
                  label={isPersian ? 'نام انگلیسی دسته‌بندی' : 'Category Name (English)'}
                  value={nameEn}
                  onValueChange={setNameEn}
                  placeholder="e.g. Niche Perfumes"
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Select
                  label={isPersian ? 'دسته والد (اختیاری برای ساب‌کتگوری)' : 'Parent Category (Optional)'}
                  selectedKeys={parentId ? new Set([parentId]) : new Set([])}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setParentId(selected || '');
                  }}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    trigger: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold text-xs font-semibold text-brand-text",
                    value: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                    popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl",
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
                  value={slug}
                  onValueChange={setSlug}
                  placeholder="e.g. niche-perfumes"
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold font-mono",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Input
                  label={isPersian ? 'اولویت نمایش' : 'Display Order'}
                  type="number"
                  value={String(order)}
                  onValueChange={(val) => setOrder(Number(val) || 0)}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                    input: "text-xs font-bold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Switch
                    isSelected={isActive}
                    onValueChange={setIsActive}
                    size="sm"
                    classNames={{
                      label: "text-xs font-bold text-brand-text",
                    }}
                  >
                    {isPersian ? 'دسته‌بندی فعال باشد' : 'Active and visible'}
                  </Switch>

                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    size="sm"
                    classNames={{
                      label: "text-xs font-bold text-brand-text",
                    }}
                  >
                    {isPersian ? 'نمایش در صفحه اصلی' : 'Featured on Home'}
                  </Switch>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="lg"
                  onPress={onClose}
                  className="font-bold text-xs"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submitting}
                  radius="lg"
                  onPress={() => handleSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md"
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
