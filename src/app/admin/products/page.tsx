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
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IProduct, ICategory } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';

function AdminThumbnail({ src, title }: { src: string; title: string }) {
  const fallbackUrl =
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#f0eae0] dark:bg-[#2e3a2e] border border-[#e6dcce] dark:border-[#2e3a2e] shrink-0 flex items-center justify-center">
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b]">
          <Package className="w-5 h-5 opacity-60" />
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt=""
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
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, title: string) => {
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
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف محصول.' : 'Failed to delete product.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت محصولات و ادکلن‌های نیش' : 'Products & Perfumes Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? `مجموعاً ${toPersianDigits(products.length)} محصول در پایگاه داده ثبت شده است`
              : `Total ${products.length} products found in database`}
          </p>
        </div>

        <Link
          href={PATHS.ADMIN_PRODUCT_NEW}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] text-xs font-black shadow-lg shadow-[#9f815b]/20 active:scale-98 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن محصول جدید' : 'Add New Product'}</span>
        </Link>
      </div>

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
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'در حال بارگذاری لیست محصولات...' : 'Loading products list...'}
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
                  <th className="py-4 px-6 text-start">{isPersian ? 'تصویر و عنوان محصول' : 'Product & Media'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'دسته‌بندی' : 'Category'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'قیمت فروش' : 'Price'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'موجودی انبار' : 'Stock'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'ویژگی‌های داینامیک' : 'Attributes'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">{isPersian ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {products.map((product) => {
                  const imageSrc =
                    product.images && product.images.length > 0
                      ? product.images[0].startsWith('http')
                        ? product.images[0]
                        : `http://127.0.0.1:7731${product.images[0]}`
                      : '';

                  return (
                    <tr key={product._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                      <td className="py-4 px-6 text-start">
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

                      <td className="py-4 px-4 text-start text-[#73695c] dark:text-[#a69c8e] font-semibold whitespace-nowrap">
                        {product.categories && product.categories.length > 0
                          ? isPersian ? product.categories[0].name : product.categories[0].nameEn || product.categories[0].name
                          : '—'}
                      </td>

                      <td className="py-4 px-4 text-start font-black text-[#1d241d] dark:text-[#d4be9b] whitespace-nowrap font-mono">
                        {formatToman(product.discountPrice || product.price, isPersian)}
                      </td>

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
                            : isPersian ? 'ناموجود' : 'Out of stock'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {product.attributes && product.attributes.length > 0 ? (
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#73695c] dark:text-[#a69c8e] whitespace-nowrap leading-none">
                            {isPersian
                              ? `${toPersianDigits(product.attributes.length)} ویژگی`
                              : `${product.attributes.length} attributes`}
                          </span>
                        ) : (
                          <span className="text-[#73695c] dark:text-[#a69c8e] font-sans">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {product.isVipOnly ? (
                          <VipBadge size="sm" text="VIP" />
                        ) : (
                          <span className="text-[#73695c] dark:text-[#a69c8e] text-xs font-sans">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={PATHS.ADMIN_PRODUCT_EDIT(product._id)}
                            className="p-2 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                            title={isPersian ? 'ویرایش محصول' : 'Edit'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(product._id, product.title)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                            title={isPersian ? 'حذف محصول' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
