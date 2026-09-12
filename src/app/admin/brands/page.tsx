'use client';

import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IBrand } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export default function AdminBrandsPage() {
  const { isPersian } = useTranslation();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState(0);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBrands();
      setBrands(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setNameEn('');
    setSlug('');
    setDescription('');
    setLogo('');
    setImage('');
    setOrder(brands.length + 1);
    setIsFeatured(true);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (b: IBrand) => {
    setEditingBrand(b);
    setName(b.name);
    setNameEn(b.nameEn || '');
    setSlug(b.slug);
    setDescription(b.description || '');
    setLogo(b.logo || '');
    setImage(b.image || '');
    setOrder(b.order || 1);
    setIsFeatured(b.isFeatured ?? true);
    setIsActive(b.isActive ?? true);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isPersian ? 'نام برند الزامی است.' : 'Brand name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        slug: slug.trim() || (nameEn || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: description.trim() || undefined,
        logo: logo.trim() || undefined,
        image: image.trim() || undefined,
        order: Number(order) || 0,
        isFeatured,
        isActive,
      };

      if (editingBrand) {
        await adminApi.updateBrand(editingBrand._id, payload);
        toast.success(isPersian ? 'برند با موفقیت به‌روزرسانی شد.' : 'Brand updated successfully.');
      } else {
        await adminApi.createBrand(payload);
        toast.success(isPersian ? 'برند جدید با موفقیت ایجاد شد.' : 'Brand created successfully.');
      }

      setModalOpen(false);
      loadBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره برند.' : 'Failed to save brand.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (b: IBrand) => {
    const nextStatus = b.isActive === false ? true : false;
    try {
      await adminApi.updateBrand(b._id, { isActive: nextStatus });
      toast.success(
        nextStatus
          ? isPersian ? 'برند با موفقیت فعال شد.' : 'Brand activated.'
          : isPersian ? 'برند غیرفعال شد.' : 'Brand deactivated.'
      );
      loadBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در تغییر وضعیت برند.');
    }
  };

  const handleDelete = async (id: string, brandName: string) => {
    if (!confirm(isPersian ? `آیا از حذف برند «${brandName}» اطمینان دارید؟` : `Are you sure you want to delete brand "${brandName}"?`)) return;

    try {
      await adminApi.deleteBrand(id);
      toast.success(isPersian ? 'برند با موفقیت حذف شد.' : 'Brand deleted successfully.');
      loadBrands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف برند.' : 'Failed to delete brand.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت برندها و خانه‌های عطر' : 'Brands & Perfume Houses'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'خانه‌های عطرسازی نیش و دیزاینر (مانند کرید، زرجوف، تام فورد، پنهالیگونز و ...)'
              : 'Niche and designer fragrance houses (e.g. Creed, Xerjoff, Tom Ford, Penhaligon\'s)'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن برند جدید' : 'Add New Brand'}</span>
        </button>
      </div>

      {/* Brands Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-3xl bg-[#ffffff] dark:bg-[#1c231c] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
            />
          ))
        ) : brands.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
            <Award className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'هنوز برندی ثبت نشده است' : 'No brands registered yet'}
            </h3>
            <p className="text-xs text-[#73695c] dark:text-[#a69c8e]">
              {isPersian ? 'با دکمه بالا می‌توانید اولین برند یا خانه عطر را اضافه کنید.' : 'Use the button above to add your first fragrance brand.'}
            </p>
          </div>
        ) : (
          brands.map((b) => (
            <div
              key={b._id}
              className="bg-[#ffffff] dark:bg-[#1c231c] p-5 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#bfa27a] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] flex items-center justify-center border border-[#e6dcce] dark:border-[#2e3a2e] text-[#9f815b] overflow-hidden">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Award className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                        b.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30 hover:opacity-80'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-400/30 hover:opacity-80'
                      }`}
                    >
                      {b.isActive !== false ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                    </button>
                    {b.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30">
                        {isPersian ? 'برند منتخب' : 'Featured Brand'}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? b.name : b.nameEn || b.name}
                </h3>
                {((isPersian && b.nameEn) || (!isPersian && b.nameEn)) && (
                  <div className="text-xs text-[#73695c] dark:text-[#a69c8e] font-sans mt-0.5">
                    {isPersian ? b.nameEn : b.name}
                  </div>
                )}
                <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-mono mt-1">
                  slug: {b.slug}
                </div>
                {b.description && (
                  <p className="text-xs text-[#73695c] dark:text-[#a69c8e] line-clamp-2 mt-2">
                    {b.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#73695c] dark:text-[#a69c8e]">
                  {isPersian ? `اولویت: ${toPersianDigits(b.order || 1)}` : `Order: ${b.order || 1}`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                    title={isPersian ? 'ویرایش' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(b._id, b.name)}
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
                {editingBrand
                  ? isPersian ? 'ویرایش خانه عطر / برند' : 'Edit Brand'
                  : isPersian ? 'تعریف خانه عطر / برند جدید' : 'New Brand'}
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
                  {isPersian ? 'نام برند به فارسی *' : 'Brand Name (Persian) *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPersian ? 'مثال: کرید، تام فورد، زرجوف' : 'e.g. Creed, Xerjoff'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام برند به انگلیسی' : 'Brand Name (English)'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Creed, Tom Ford, Xerjoff"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. creed, tom-ford, xerjoff"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'آدرس لوگوی برند (اختیاری)' : 'Brand Logo URL (Optional)'}
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono text-[11px] focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'توضیحات کوتاه درباره خانه عطر' : 'Short Description'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isPersian ? 'توضیح کوتاه درباره تاریخچه و سبک عطرسازی...' : 'Short summary...'}
                  className="w-full p-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
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
                    <span>{isPersian ? 'برند فعال و قابل نمایش باشد' : 'Active and visible'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                    />
                    <span>{isPersian ? 'برند منتخب' : 'Featured Brand'}</span>
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
                    : isPersian ? 'ذخیره برند' : 'Save Brand'}
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
