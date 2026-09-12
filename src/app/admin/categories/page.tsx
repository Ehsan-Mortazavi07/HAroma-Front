'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X, Check, Image as ImageIcon } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت دسته‌بندی‌های فروشگاه' : 'Categories Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'دسته‌بندی‌ها برای تفکیک عطرها، ادکلن‌های نیش، بادی‌اسپلش و ست‌های کادویی'
              : 'Organize perfumes, colognes, body sprays, and luxury gift sets'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن دسته‌بندی جدید' : 'Add Category'}</span>
        </button>
      </div>

      {/* Categories Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-[#ffffff] dark:bg-[#1c231c] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
            />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
            <Layers className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'هنوز دسته‌بندی تعریف نشده است' : 'No categories defined yet'}
            </h3>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-[#ffffff] dark:bg-[#1c231c] p-5 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#bfa27a] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] flex items-center justify-center border border-[#e6dcce] dark:border-[#2e3a2e] text-[#9f815b]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                        cat.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30 hover:opacity-80'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-400/30 hover:opacity-80'
                      }`}
                    >
                      {cat.isActive !== false ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                    </button>
                    {cat.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30">
                        {isPersian ? 'ویژه صفحه اصلی' : 'Featured'}
                      </span>
                    )}
                    {cat.parentId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eae0] text-[#73695c] dark:bg-[#202620] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e]">
                        {isPersian ? 'زیرمجموعه:' : 'Sub of:'}{' '}
                        {typeof cat.parentId === 'object' && cat.parentId
                          ? (isPersian ? cat.parentId.name : cat.parentId.nameEn || cat.parentId.name)
                          : categories.find((c) => c._id === cat.parentId)?.name || ''}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? cat.name : cat.nameEn || cat.name}
                </h3>
                {((isPersian && cat.nameEn) || (!isPersian && cat.nameEn)) && (
                  <div className="text-xs text-[#73695c] dark:text-[#a69c8e] font-sans mt-0.5">
                    {isPersian ? cat.nameEn : cat.name}
                  </div>
                )}
                <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-mono mt-1">
                  slug: {cat.slug}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e]">
                  {isPersian ? `اولویت: ${toPersianDigits(cat.order || 1)}` : `Order: ${cat.order || 1}`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                    title={isPersian ? 'ویرایش' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(cat._id, cat.name)}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                    title={isPersian ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <h3 className="font-black text-base">
                {editingCat
                  ? isPersian ? 'ویرایش دسته‌بندی' : 'Edit Category'
                  : isPersian ? 'تعریف دسته‌بندی جدید' : 'New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام فارسی دسته‌بندی *' : 'Category Name (Persian) *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPersian ? 'مثال: عطر و ادکلن نیش' : 'e.g. Luxury Niche Perfumes'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام انگلیسی دسته‌بندی' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Niche Perfumes"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'دسته والد (اختیاری - برای ایجاد زیردسته/ساب‌کتگوری)' : 'Parent Category (Optional - For Subcategories)'}
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-xs focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
                >
                  <option value="">{isPersian ? '— دسته‌بندی سطح اصلی (بدون والد) —' : '— Main Category (No Parent) —'}</option>
                  {categories
                    .filter((c) => !editingCat || c._id !== editingCat._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {isPersian ? c.name : c.nameEn || c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. niche-perfumes"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'اولویت نمایش' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                    />
                    <span>{isPersian ? 'دسته‌بندی فعال و قابل نمایش باشد' : 'Active and visible'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                    />
                    <span>{isPersian ? 'نمایش در صفحه اصلی' : 'Featured on Home'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {submitting
                    ? isPersian ? 'در حال ذخیره...' : 'Saving...'
                    : isPersian ? 'ذخیره دسته‌بندی' : 'Save Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
