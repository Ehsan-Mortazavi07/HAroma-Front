'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Crown,
  Sparkles,
  Layers,
  Filter,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  Tag,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IProduct, ICategory } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';

function AdminThumbnail({ src, title }: { src: string; title: string }) {
  const fallbackUrl =
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-[#f0eae0] dark:bg-[#2e3a2e] border border-[#e6dcce] dark:border-[#2e3a2e] shrink-0 flex items-center justify-center shadow-xs">
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b]">
          <Package className="w-5 h-5 opacity-60" />
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt={title || ''}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => {
            if (currentSrc !== fallbackUrl) {
              setCurrentSrc(fallbackUrl);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const { isPersian } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';
  const isEditor = currentUser?.role === 'editor';

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Multi-selection & Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
      });
      setProducts(res?.items || []);
    } catch (err) {
      console.error(err);
      toast.error(isPersian ? 'خطا در بارگذاری محصولات.' : 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Toggle single product published/active status
  const handleTogglePublish = async (product: IProduct) => {
    const nextStatus = product.isPublished === false ? true : false;
    setTogglingId(product._id);
    try {
      await adminApi.bulkUpdateProductsStatus([product._id], nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isPublished: nextStatus } : p)),
      );
      toast.success(
        nextStatus
          ? isPersian
            ? `محصول «${product.title}» با موفقیت منتشر و فعال شد.`
            : `Product "${product.title}" published.`
          : isPersian
          ? `محصول «${product.title}» از انتشار خارج و غیرفعال شد.`
          : `Product "${product.title}" unpublished.`,
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت محصول.' : 'Failed to update product status.'),
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Bulk status change (Publish or Unpublish)
  const handleBulkStatusChange = async (isPublished: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await adminApi.bulkUpdateProductsStatus(selectedIds, isPublished);
      setProducts((prev) =>
        prev.map((p) => (selectedIds.includes(p._id) ? { ...p, isPublished } : p)),
      );
      toast.success(
        isPublished
          ? isPersian
            ? `${toPersianDigits(selectedIds.length)} محصول با موفقیت منتشر و فعال شدند.`
            : `${selectedIds.length} products published successfully.`
          : isPersian
          ? `${toPersianDigits(selectedIds.length)} محصول با موفقیت غیرفعال و پنهان شدند.`
          : `${selectedIds.length} products unpublished successfully.`,
      );
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت گروهی محصولات.' : 'Failed to update products status.'),
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk soft delete (Admin only)
  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف محصول منحصراً برای مدیر کل (Admin) مجاز است.'
          : 'Bulk delete is restricted to Admin.',
      );
      return;
    }

    if (selectedIds.length === 0) return;
    if (
      !confirm(
        isPersian
          ? `آیا از حذف گروهی ${toPersianDigits(selectedIds.length)} محصول انتخاب شده اطمینان کامل دارید؟`
          : `Are you sure you want to delete ${selectedIds.length} selected products?`,
      )
    ) {
      return;
    }

    setBulkActionLoading(true);
    try {
      await adminApi.bulkDeleteProducts(selectedIds);
      toast.success(
        isPersian
          ? `${toPersianDigits(selectedIds.length)} محصول با موفقیت حذف گردید.`
          : `${selectedIds.length} products deleted successfully.`,
      );
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در حذف گروهی محصولات.' : 'Failed to delete products.'),
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Delete single product (Admin only)
  const handleDelete = async (id: string, title: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف محصول منحصراً برای مدیر کل مجاز است. ادیتور می‌تواند محصول را غیرفعال کند.'
          : 'Deleting products is restricted to Admin. Editors can deactivate products.',
      );
      return;
    }

    if (
      !confirm(
        isPersian
          ? `آیا از حذف محصول «${title}» اطمینان دارید؟`
          : `Are you sure you want to delete "${title}"?`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await adminApi.deleteProduct(id);
      toast.success(isPersian ? 'محصول با موفقیت حذف گردید.' : 'Product deleted successfully.');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchProducts();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در حذف محصول.' : 'Failed to delete product.'),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت محصولات و عطرها' : 'Products & Fragrance Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? `مجموعاً ${toPersianDigits(products.length)} محصول در پایگاه داده ثبت شده است`
              : `Total ${products.length} products found in database`}
          </p>
        </div>

        <Link
          href={PATHS.ADMIN_PRODUCT_NEW}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 active:scale-98 transition-all duration-200 ease-out self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن محصول جدید' : 'Add New Product'}</span>
        </Link>
      </div>

      {/* Floating Sticky Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-[#1c231c] text-[#f7f4ee] border border-[#bfa27a]/60 shadow-2xl shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-black bg-[#bfa27a] text-[#141914] shadow-xs">
              {isPersian
                ? `${toPersianDigits(selectedIds.length)} محصول انتخاب شده`
                : `${selectedIds.length} products selected`}
            </span>
            <span className="text-xs text-[#d4be9b] font-semibold hidden md:inline">
              {isPersian ? 'عملیات گروهی سریع:' : 'Bulk actions:'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Publish */}
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkStatusChange(true)}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPersian ? 'انتشار همگانی' : 'Bulk Publish'}</span>
            </button>

            {/* Bulk Unpublish */}
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkStatusChange(false)}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isPersian ? 'عدم انتشار همگانی' : 'Bulk Unpublish'}</span>
            </button>

            {/* Bulk Delete (Admin only) */}
            {isAdmin && (
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isPersian ? 'حذف همگانی' : 'Bulk Delete'}</span>
              </button>
            )}

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-[#f7f4ee] transition-colors cursor-pointer"
            >
              {isPersian ? 'لغو انتخاب‌ها' : 'Deselect All'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#ffffff] dark:bg-[#1c231c] p-4 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isPersian ? 'جستجو در عنوان یا برند عطر...' : 'Search by title, brand, or slug...'}
            className="w-full h-11 pr-10 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
          />
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-[#73695c] dark:text-[#a69c8e]" />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#9f815b]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
          >
            <option value="">{isPersian ? 'همه دسته‌بندی‌ها' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {isPersian ? c.name : c.nameEn || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#9f815b]" />
            <span>{isPersian ? 'در حال بارگذاری لیست محصولات...' : 'Loading products list...'}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'هیچ محصولی یافت نشد' : 'No products found'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="bg-[#f8f5f0] dark:bg-[#242c24] border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  {/* Select All Checkbox */}
                  <th className="py-4 px-4 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded-md accent-[#bfa27a] cursor-pointer"
                      title={isPersian ? 'انتخاب همه' : 'Select all'}
                    />
                  </th>
                  <th className="py-4 px-4 text-start">{isPersian ? 'تصویر و عنوان محصول' : 'Product & Media'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'برند / خانه عطر' : 'Brand(s)'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'دسته‌بندی' : 'Category'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'قیمت فروش' : 'Price'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'موجودی انبار' : 'Stock'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'وضعیت انتشار' : 'Status'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">{isPersian ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {products.map((product) => {
                  const isSelected = selectedIds.includes(product._id);
                  const isPublished = product.isPublished !== false;
                  const isToggling = togglingId === product._id;

                  const imageSrc =
                    product.images && product.images.length > 0
                      ? product.images[0].startsWith('http')
                        ? product.images[0]
                        : `http://127.0.0.1:7731${product.images[0]}`
                      : '';

                  // Extract all brand names
                  const allBrands =
                    product.brands && product.brands.length > 0
                      ? product.brands
                      : product.brand
                      ? [product.brand]
                      : [];

                  return (
                    <tr
                      key={product._id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#bfa27a]/10 dark:bg-[#bfa27a]/15'
                          : 'hover:bg-[#f8f5f0] dark:hover:bg-[#242c24]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(product._id)}
                          className="w-4 h-4 rounded-md accent-[#bfa27a] cursor-pointer"
                        />
                      </td>

                      {/* Product Title & media */}
                      <td className="py-4 px-4 text-start">
                        <div className="flex items-center gap-3">
                          <AdminThumbnail src={imageSrc} title={product.title} />
                          <div>
                            <div className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                              {isPersian ? product.title : product.titleEn || product.title}
                            </div>
                            <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e] font-sans">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brands */}
                      <td className="py-4 px-4 text-start whitespace-nowrap">
                        {allBrands.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {allBrands.map((b: any, idx: number) => {
                              const bName = typeof b === 'object' && b ? (isPersian ? b.name : b.nameEn || b.name) : b;
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] font-bold text-[11px] border border-[#bfa27a]/30"
                                >
                                  {bName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[#73695c] dark:text-[#a69c8e] font-sans">—</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-start text-[#73695c] dark:text-[#a69c8e] font-semibold whitespace-nowrap">
                        {product.categories && product.categories.length > 0
                          ? isPersian
                            ? product.categories[0].name
                            : product.categories[0].nameEn || product.categories[0].name
                          : '—'}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 text-start font-black text-[#1d241d] dark:text-[#d4be9b] whitespace-nowrap">
                        {formatToman(product.discountPrice || product.price, isPersian)}
                      </td>

                      {/* Stock Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap leading-none ${
                            product.inStock
                              ? 'bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {product.inStock
                            ? isPersian
                              ? `${toPersianDigits(product.stockCount || 10)} عدد موجود`
                              : `${product.stockCount || 10} in stock`
                            : isPersian
                            ? 'ناموجود'
                            : 'Out of stock'}
                        </span>
                      </td>

                      {/* Quick Publish / Unpublish Toggle Chip */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePublish(product)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                            isPublished
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                          title={
                            isPersian
                              ? isPublished
                                ? 'کلیک کنید تا غیرفعال شود'
                                : 'کلیک کنید تا منتشر شود'
                              : isPublished
                              ? 'Click to unpublish'
                              : 'Click to publish'
                          }
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPublished ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPublished
                              ? isPersian ? 'منتشر شده' : 'Published'
                              : isPersian ? 'غیرفعال / پیش‌نویس' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      {/* VIP Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {product.isVipOnly ? (
                          <VipBadge size="sm" text="VIP" />
                        ) : (
                          <span className="text-[#73695c] dark:text-[#a69c8e] text-xs font-sans">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={PATHS.ADMIN_PRODUCT_EDIT(product._id)}
                            className="p-2 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                            title={isPersian ? 'ویرایش کامل محصول' : 'Edit'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {isAdmin ? (
                            <button
                              onClick={() => handleDelete(product._id, product.title)}
                              disabled={deletingId === product._id}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                              title={isPersian ? 'حذف محصول' : 'Delete'}
                            >
                              {deletingId === product._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span
                              className="p-2 rounded-xl bg-[#f0eae0] dark:bg-[#283228] text-[#73695c] dark:text-[#a69c8e] text-[11px] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                              title={isPersian ? 'ادیتور دسترسی حذف ندارد (می‌توانید محصول را غیرفعال کنید)' : 'Delete restricted to admin'}
                            >
                              {isPersian ? 'غیرقابل حذف' : 'No Delete'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
