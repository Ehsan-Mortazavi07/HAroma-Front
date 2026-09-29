'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from '@heroui/react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IProduct, ICategory } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import { PaginationControls } from '@/components/common/PaginationControls';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { useAppSelector } from '@/stores/hooks';
import { toast, toPersianDigits, formatToman } from '@/common/utils';

const PRODUCTS_PAGE_SIZE = 12;

function AdminThumbnail({ src, title }: { src: string; title: string }) {
  const fallbackUrl =
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-border shrink-0 flex items-center justify-center shadow-xs">
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-brand-surface-elevated text-brand-bronze">
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

  const [products, setProducts] = useState<IProduct[]>([]);
  const productsRequestId = useRef(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Multi-selection & Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // HeroUI Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: React.ReactNode;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const fetchProducts = async (requestedPage = currentPage) => {
    const requestId = ++productsRequestId.current;
    setLoading(true);
    try {
      const query = {
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        includeUnpublished: 'true',
        pageSize: PRODUCTS_PAGE_SIZE,
      };
      let page = Math.max(1, requestedPage);
      let res = await adminApi.getProducts({ ...query, page });
      if (requestId !== productsRequestId.current) return;

      const total = Number(res?.total ?? res?.items?.length ?? 0);
      const pageCount = Math.max(
        1,
        Number(res?.totalPages) || Math.ceil(total / PRODUCTS_PAGE_SIZE) || 1,
      );

      // If a deletion emptied the current last page, move back to the last valid page.
      if (page > pageCount) {
        page = pageCount;
        res = await adminApi.getProducts({ ...query, page });
        if (requestId !== productsRequestId.current) return;
      }

      setProducts(res?.items || []);
      setTotalProducts(Number(res?.total ?? 0));
      setTotalPages(
        Math.max(
          1,
          Number(res?.totalPages) ||
            Math.ceil(Number(res?.total ?? 0) / PRODUCTS_PAGE_SIZE) ||
            1,
        ),
      );
      setCurrentPage(page);
    } catch (err) {
      if (requestId !== productsRequestId.current) return;
      console.error(err);
      toast.error(isPersian ? 'خطا در بارگذاری محصولات.' : 'Failed to fetch products.');
    } finally {
      if (requestId === productsRequestId.current) setLoading(false);
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
    setCurrentPage(1);
    setSelectedIds([]);
    fetchProducts(1);
  }, [searchQuery, selectedCategory]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...products.map((p) => p._id)])]);
    } else {
      const pageIds = new Set(products.map((product) => product._id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Toggle single product published/active status with instant optimistic update
  const handleTogglePublish = async (product: IProduct, nextStatus: boolean) => {
    // Optimistic UI state flip
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, isPublished: nextStatus } : p)),
    );
    try {
      await adminApi.bulkUpdateProductsStatus([product._id], nextStatus);
      toast.success(
        nextStatus
          ? isPersian
            ? `محصول «${product.title}» با موفقیت فعال شد.`
            : `Product "${product.title}" published.`
          : isPersian
          ? `محصول «${product.title}» غیرفعال شد.`
          : `Product "${product.title}" unpublished.`,
      );
    } catch (err: any) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isPublished: !nextStatus } : p)),
      );
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت محصول.' : 'Failed to update product status.'),
      );
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
  const handleBulkDelete = () => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف محصول منحصراً برای مدیر کل (Admin) مجاز است.'
          : 'Bulk delete is restricted to Admin.',
      );
      return;
    }

    if (selectedIds.length === 0) return;

    setConfirmConfig({
      title: isPersian ? 'حذف گروهی محصولات' : 'Bulk Delete Products',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف گروهی <strong className="text-brand-text font-black">{toPersianDigits(selectedIds.length)}</strong> محصول انتخاب شده اطمینان کامل دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این محصولات از کاتالوگ فروشگاه حذف خواهند شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete <strong className="text-brand-text font-bold">{selectedIds.length}</strong> selected products?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            These products will be removed from the catalog.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف گروهی' : 'Yes, Delete All',
      action: async () => {
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
      },
    });
    setConfirmModalOpen(true);
  };

  // Delete single product (Admin only)
  const handleDelete = (id: string, title: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف محصول منحصراً برای مدیر کل مجاز است. ادیتور می‌تواند محصول را غیرفعال کند.'
          : 'Deleting products is restricted to Admin. Editors can deactivate products.',
      );
      return;
    }

    setConfirmConfig({
      title: isPersian ? 'حذف محصول' : 'Delete Product',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف محصول <strong className="text-brand-text font-black">«{title}»</strong> اطمینان دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این عملیات غیرقابل بازگشت است و محصول از فروشگاه حذف خواهد شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete product <strong className="text-brand-text font-bold">&quot;{title}&quot;</strong>?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف محصول' : 'Yes, Delete Product',
      action: async () => {
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
      },
    });
    setConfirmModalOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmConfig) return;
    setIsConfirmLoading(true);
    try {
      await confirmConfig.action();
      setConfirmModalOpen(false);
      setConfirmConfig(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const selectedOnPageCount = products.filter((product) => selectedIds.includes(product._id)).length;
  const isAllSelected = products.length > 0 && selectedOnPageCount === products.length;
  const isIndeterminate = selectedOnPageCount > 0 && selectedOnPageCount < products.length;
  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت محصولات و عطرها' : 'Products & Fragrance Management'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? `مجموعاً ${toPersianDigits(totalProducts)} محصول در پایگاه داده ثبت شده است`
              : `Total ${totalProducts} products found in database`}
          </p>
        </div>

        <Button
          as={Link}
          href={PATHS.ADMIN_PRODUCT_NEW}
          radius="full"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto rounded-full transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن محصول جدید' : 'Add New Product'}</span>
        </Button>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="p-4 bg-brand-surface border border-brand-border rounded-3xl shadow-xs overflow-visible">
        <CardBody className="p-0 flex flex-col sm:flex-row items-center gap-3 overflow-visible">
          <Input
            dir="auto"
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder={isPersian ? 'جستجو در عنوان یا برند عطر...' : 'Search by title, brand, or slug...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="full"
            className="flex-1 w-full"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
              input: "text-sm font-semibold text-brand-text",
            }}
          />

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-bronze shrink-0" />
            <Select
              aria-label={isPersian ? 'دسته‌بندی' : 'Category'}
              selectedKeys={new Set([selectedCategory])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedCategory(selected ?? '');
              }}
              variant="bordered"
              radius="full"
              className="w-full sm:w-56"
              classNames={{
                trigger: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs text-sm font-bold text-brand-text text-start",
                value: "text-sm font-bold text-brand-text text-start",
                popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl",
              }}
            >
              {[
                { slug: '', name: isPersian ? 'همه دسته‌بندی‌ها' : 'All Categories' },
                ...categories.map((c) => ({ slug: c.slug, name: isPersian ? c.name : c.nameEn || c.name })),
              ].map((c) => (
                <SelectItem key={c.slug} textValue={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden">
        <CardBody className="p-0 overflow-visible">
          {loading && products.length === 0 ? (
            <div className="p-8 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-brand-surface-elevated" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-brand-bronze mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'هیچ محصولی یافت نشد' : 'No products found'}
              </h3>
            </div>
          ) : (
            <Table
              aria-label="Products Table"
              classNames={{
                wrapper: "p-0 bg-transparent shadow-none border-none overflow-x-auto overflow-y-hidden",
                th: "bg-brand-surface-elevated text-brand-text-muted font-bold text-xs py-4 px-4",
                td: "py-4 px-4 text-xs font-semibold",
                tr: "border-b border-brand-border hover:bg-brand-surface-elevated/60 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn className="w-10 text-center">
                  <div className="flex items-center justify-center">
                    <SmoothCheckbox
                      isSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      onValueChange={handleSelectAll}
                      size="sm"
                      ariaLabel={isPersian ? 'انتخاب همه' : 'Select all'}
                    />
                  </div>
                </TableColumn>
                <TableColumn>{isPersian ? 'تصویر و عنوان محصول' : 'Product & Media'}</TableColumn>
                <TableColumn>{isPersian ? 'برند / خانه عطر' : 'Brand(s)'}</TableColumn>
                <TableColumn>{isPersian ? 'دسته‌بندی' : 'Category'}</TableColumn>
                <TableColumn>{isPersian ? 'قیمت فروش' : 'Price'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'موجودی انبار' : 'Stock'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'وضعیت انتشار' : 'Status'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات' : 'Actions'}</TableColumn>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isSelected = selectedIds.includes(product._id);
                  const isPublished = product.isPublished !== false;

                  const imageSrc =
                    product.images && product.images.length > 0
                      ? product.images[0].startsWith('http')
                        ? product.images[0]
                        : `http://127.0.0.1:7731${product.images[0]}`
                      : '';

                  const allBrands =
                    product.brands && product.brands.length > 0
                      ? product.brands
                      : product.brand
                      ? [product.brand]
                      : [];

                  return (
                    <TableRow
                      key={product._id}
                      className={isSelected ? 'bg-brand-gold/10' : ''}
                    >
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <SmoothCheckbox
                            isSelected={isSelected}
                            onValueChange={() => handleSelectRow(product._id)}
                            size="sm"
                            ariaLabel={product.title}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AdminThumbnail src={imageSrc} title={product.title} />
                          <div>
                            <Link
                              href={PATHS.ADMIN_PRODUCT_EDIT(product._id)}
                              className="font-bold text-sm text-brand-text hover:text-brand-gold hover:underline underline-offset-4 transition-colors"
                              title={isPersian ? 'ویرایش محصول' : 'Edit product'}
                            >
                              {isPersian ? product.title : product.titleEn || product.title}
                            </Link>
                            <div className="text-[11px] text-brand-text-muted font-sans">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {allBrands.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {allBrands.map((b: any, idx: number) => {
                              const bName = typeof b === 'object' && b ? (isPersian ? b.name : b.nameEn || b.name) : b;
                              return (
                                <Chip
                                  key={idx}
                                  size="sm"
                                  variant="flat"
                                  className="bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold border border-brand-gold/30 font-bold text-[11px] h-6 px-2"
                                >
                                  {bName}
                                </Chip>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-brand-text-muted font-sans">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-brand-text-muted font-semibold whitespace-nowrap">
                        {product.categories && product.categories.length > 0
                          ? isPersian
                            ? product.categories[0].name
                            : product.categories[0].nameEn || product.categories[0].name
                          : '—'}
                      </TableCell>

                      <TableCell className="font-black text-brand-text whitespace-nowrap">
                        {formatToman(product.discountPrice || product.price, isPersian)}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={product.inStock ? "warning" : "danger"}
                          className="font-bold text-xs"
                        >
                          {product.inStock
                            ? isPersian
                              ? `${toPersianDigits(product.stockCount || 10)} موجود`
                              : `${product.stockCount || 10} in stock`
                            : isPersian
                            ? 'ناموجود'
                            : 'Out of stock'}
                        </Chip>
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <SmoothSwitch
                            isSelected={isPublished}
                            onValueChange={(val) => handleTogglePublish(product, val)}
                            ariaLabel={isPublished ? 'محصول فعال' : 'محصول پیش‌نویس'}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        {product.isVipOnly ? (
                          <VipBadge size="sm" text="VIP" />
                        ) : (
                          <span className="text-brand-text-muted text-xs font-sans">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            as={Link}
                            href={PATHS.PRODUCT(product.slug || product._id)}
                            size="sm"
                            variant="flat"
                            radius="full"
                            startContent={<Eye className="w-3.5 h-3.5" />}
                            className="bg-brand-surface-elevated text-brand-text hover:bg-brand-border/60 border border-brand-border cursor-pointer px-3 font-bold text-[11px]"
                            title={isPersian ? 'مشاهده محصول در فروشگاه' : 'View product'}
                            aria-label={isPersian ? `مشاهده ${product.title}` : `View ${product.titleEn || product.title}`}
                          >
                            {isPersian ? 'مشاهده' : 'View'}
                          </Button>
                          <Button
                            as={Link}
                            href={PATHS.ADMIN_PRODUCT_EDIT(product._id)}
                            isIconOnly
                            size="sm"
                            variant="flat"
                            radius="full"
                            className="bg-brand-surface-elevated text-brand-text hover:bg-brand-border/60 border border-brand-border cursor-pointer"
                            title={isPersian ? 'ویرایش کامل محصول' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {isAdmin ? (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="danger"
                              radius="full"
                              onPress={() => handleDelete(product._id, product.title)}
                              isLoading={deletingId === product._id}
                              className="cursor-pointer"
                              title={isPersian ? 'حذف محصول' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <span
                              className="px-2 py-1 rounded-xl bg-brand-surface-elevated text-brand-text-muted text-[11px] font-bold border border-brand-border"
                              title={isPersian ? 'ادیتور دسترسی حذف ندارد' : 'Delete restricted to admin'}
                            >
                              {isPersian ? 'بدون حذف' : 'No Delete'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
        {!loading && totalProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-border px-4 py-4 sm:px-6">
            <p className="text-xs font-bold text-brand-text-muted" aria-live="polite">
              {isPersian
                ? `${toPersianDigits(products.length)} محصول در این صفحه`
                : `${products.length} products on this page`}
            </p>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              isPersian={isPersian}
              isLoading={loading}
              onPageChange={(page) => {
                fetchProducts(page);
              }}
              ariaLabel={isPersian ? 'صفحه‌بندی محصولات' : 'Product pagination'}
            />
          </div>
        )}
      </Card>
      </motion.div>

      {/* Floating Action Island (Fixed, Zero Layout Shift, Fluid Apple Spring Motion) */}
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
                      ? `${toPersianDigits(selectedIds.length)} محصول انتخاب شده`
                      : `${selectedIds.length} items selected`}
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
                      ? `${toPersianDigits(selectedIds.length)} مورد انتخاب شده`
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
                    <span className="sm:hidden">{isPersian ? 'انتشار' : 'Publish'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'انتشار همگانی' : 'Bulk Publish'}</span>
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
                    <span className="sm:hidden">{isPersian ? 'عدم انتشار' : 'Unpublish'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'عدم انتشار' : 'Bulk Unpublish'}</span>
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

      {/* HeroUI Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || null}
        confirmText={confirmConfig?.confirmText || (isPersian ? 'بله، حذف' : 'Yes, Delete')}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isConfirmLoading}
        onConfirm={executeConfirmAction}
      />
    </div>
  );
}
