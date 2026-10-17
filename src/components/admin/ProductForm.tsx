'use client';

import { Input, Textarea } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import {
  useRouter } from 'next/navigation';
import { Formik,
  Form,
  useFormikContext } from 'formik';
import {
  Package,
  Crown,
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  Save,
  Globe,
  FileText,
  Award,
  Plus,
  Tag,
  Trash2,
  } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import { IProduct, ICategory, IBrand, IProductAttribute, IProductVariant } from '@/common/interfaces';
import { getProductFormSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast, toPersianDigits } from '@/common/utils';
import { adminApi } from '@/common/api/admin';
import { ImageUploader } from './ImageUploader';
import { DynamicAttributeBuilder } from './DynamicAttributeBuilder';
import { ProductVariantManager } from './ProductVariantManager';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { AdminPriceInput } from '@/components/admin/AdminPriceInput';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { useAppSelector } from '@/stores/hooks';
import { CategoryParentSelect } from '@/components/admin/CategoryParentSelect';


// HeroUI buttons only react to `data-[hover=true]`, so plain `hover:` classes never showed.
const CHOICE_CHIP_SELECTED =
  'bg-brand-gold text-[#141914] shadow-sm font-black data-[hover=true]:!bg-[#d4be9b] data-[hover=true]:-translate-y-px';
const CHOICE_CHIP_IDLE =
  'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border-[#e6dcce] dark:border-[#2e3a2e] data-[hover=true]:!border-brand-gold data-[hover=true]:!bg-brand-gold/15 data-[hover=true]:!text-[#7a5d3e] dark:data-[hover=true]:!text-[#d4be9b] data-[hover=true]:-translate-y-px';

/** After a failed submit: say so, then jump to the first invalid field. */
function SubmitErrorFocus({ isPersian }: { isPersian: boolean }) {
  const { submitCount, isValid, isSubmitting } = useFormikContext();
  const handled = React.useRef(0);
  React.useEffect(() => {
    if (submitCount === handled.current || isSubmitting) return;
    handled.current = submitCount;
    if (isValid) return;
    toast.error(
      isPersian
        ? 'برخی فیلدهای ضروری خالی یا نامعتبر است؛ موارد قرمزشده را اصلاح کنید.'
        : 'Some required fields are empty or invalid. Fix the highlighted fields.',
    );
    window.requestAnimationFrame(() => {
      const invalid = document.querySelector<HTMLElement>('form [aria-invalid="true"], form [data-invalid="true"]');
      invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invalid?.focus?.({ preventScroll: true });
    });
  }, [submitCount, isValid, isSubmitting, isPersian]);
  return null;
}

interface ProductFormProps {
  initialProduct?: IProduct;
  isEditing?: boolean;
}

export function ProductForm({ initialProduct, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { isPersian, isRTL } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [activeDescTab, setActiveDescTab] = useState<'fa' | 'en'>('fa');

  // Images, Attributes and Variants local state
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [attributes, setAttributes] = useState<IProductAttribute[]>(
    initialProduct?.attributes || [],
  );
  const [variants, setVariants] = useState<IProductVariant[]>(
    initialProduct?.variants || [],
  );
  const initialBrandIds = (): string[] => {
    if (initialProduct?.brands && initialProduct.brands.length > 0) {
      return initialProduct.brands.map((b) => (typeof b === 'string' ? b : b._id));
    }
    if (initialProduct?.brand) {
      const bId = typeof initialProduct.brand === 'string' ? initialProduct.brand : initialProduct.brand._id;
      return bId ? [bId] : [];
    }
    return [];
  };

  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrandIds);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialProduct?.categories?.map((c) => (typeof c === 'string' ? c : c._id)) || [],
  );

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId],
    );
  };

  // Quick Create Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandNameEn, setNewBrandNameEn] = useState('');
  const [newBrandSlug, setNewBrandSlug] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, brs] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getBrands(),
        ]);
        setCategories(cats || []);
        setBrands(brs || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const handleQuickCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) {
      toast.error(isPersian ? 'نام دسته‌بندی الزامی است.' : 'Category name is required.');
      return;
    }
    setCreatingCategory(true);
    try {
      const payload = {
        name: newCatName.trim(),
        nameEn: newCatNameEn.trim() || undefined,
        slug: newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
        parentId: newCatParentId || null,
        isFeatured: true,
      };
      const created = await adminApi.createCategory(payload);
      const res = await adminApi.getCategories();
      setCategories(res || []);
      if (created?._id) {
        setSelectedCategories((prev) => [...prev, created._id]);
      }
      setIsCategoryModalOpen(false);
      setNewCatName('');
      setNewCatNameEn('');
      setNewCatSlug('');
      setNewCatParentId('');
      toast.success(
        isPersian
          ? `دسته‌بندی «${created.name}» ساخته و انتخاب شد.`
          : `Category "${created.name}" created and selected.`,
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ایجاد دسته‌بندی.' : 'Failed to create category.'));
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleQuickCreateBrand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBrandName.trim()) {
      toast.error(isPersian ? 'نام برند الزامی است.' : 'Brand name is required.');
      return;
    }
    setCreatingBrand(true);
    try {
      const payload = {
        name: newBrandName.trim(),
        nameEn: newBrandNameEn.trim() || undefined,
        slug:
          newBrandSlug.trim() ||
          (newBrandNameEn || newBrandName)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        logo: newBrandLogo.trim() || undefined,
        isFeatured: true,
      };
      const created = await adminApi.createBrand(payload);
      const res = await adminApi.getBrands();
      setBrands(res || []);
      if (created?._id) {
        setSelectedBrands((prev) => [...prev, created._id]);
      }
      setIsBrandModalOpen(false);
      setNewBrandName('');
      setNewBrandNameEn('');
      setNewBrandSlug('');
      setNewBrandLogo('');
      toast.success(
        isPersian
          ? `برند «${created.name}» ساخته و انتخاب شد.`
          : `Brand "${created.name}" created and selected.`,
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ایجاد برند.' : 'Failed to create brand.'));
    } finally {
      setCreatingBrand(false);
    }
  };

  const initialValues = {
    title: initialProduct?.title || '',
    titleEn: initialProduct?.titleEn || '',
    slug: initialProduct?.slug || '',
    price: initialProduct?.price || 0,
    discountPrice: initialProduct?.discountPrice || '',
    stockCount: initialProduct?.stockCount !== undefined ? initialProduct.stockCount : 10,
    minPurchaseQuantity: initialProduct?.minPurchaseQuantity ?? 1,
    maxPurchaseQuantity: initialProduct?.maxPurchaseQuantity ?? '',
    description: initialProduct?.description || '',
    descriptionEn: initialProduct?.descriptionEn || '',
    shortDescription: initialProduct?.shortDescription || '',
    shortDescriptionEn: initialProduct?.shortDescriptionEn || '',
    isVipOnly: initialProduct?.isVipOnly || false,
    isFeatured: initialProduct?.isFeatured || false,
    inStock: initialProduct?.inStock !== undefined ? initialProduct.inStock : true,
    isPublished: initialProduct?.isPublished !== undefined ? initialProduct.isPublished : true,
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        ...values,
        price: Number(values.price),
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        stockCount: Number(values.stockCount),
        minPurchaseQuantity: Math.max(1, Math.floor(Number(values.minPurchaseQuantity) || 1)),
        // Empty means "no cap"; null clears a cap that was set earlier.
        maxPurchaseQuantity: values.maxPurchaseQuantity === '' || values.maxPurchaseQuantity === null ? null : Number(values.maxPurchaseQuantity),
        brand: selectedBrands.length > 0 ? selectedBrands[0] : null,
        brands: selectedBrands,
        categories: selectedCategories,
        isPublished: values.isPublished !== undefined ? values.isPublished : true,
        images,
        attributes,
        variants,
      };

      if (isEditing && initialProduct) {
        await adminApi.updateProduct(initialProduct._id, payload);
        toast.success(isPersian ? 'محصول با موفقیت به‌روزرسانی شد.' : 'Product updated successfully.');
      } else {
        await adminApi.createProduct(payload);
        toast.success(isPersian ? 'محصول جدید با موفقیت ایجاد شد.' : 'Product created successfully.');
      }

      router.push(PATHS.ADMIN_PRODUCTS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره محصول.' : 'Failed to save product.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!isEditing || !initialProduct || !isAdmin || deletingProduct) return;

    setDeletingProduct(true);
    try {
      await adminApi.deleteProduct(initialProduct._id);
      toast.success(isPersian ? 'محصول با موفقیت حذف شد.' : 'Product deleted successfully.');
      setDeleteConfirmOpen(false);
      router.replace(PATHS.ADMIN_PRODUCTS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف محصول.' : 'Failed to delete product.'));
    } finally {
      setDeletingProduct(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-8 max-w-5xl mx-auto pb-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isEditing
              ? isPersian ? 'ویرایش اطلاعات عطر / محصول' : 'Edit Fragrance / Product'
              : isPersian ? 'تعریف و ثبت محصول جدید' : 'Add New Fragrance Product'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'اطلاعات عمومی، تصاویر اختیاری، دسته‌بندی‌ها، حجم‌های متنوع، توضیحات دوزبانه و ویژگی‌های داینامیک را وارد نمایید'
              : 'Enter product details, add optional images, configure volume variants, and provide descriptions & attributes'}
          </p>
        </div>

        <Button
          variant="bordered"
          radius="full"
          onPress={() => router.back()}
          startContent={isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          className="bg-[#ffffff] dark:bg-[#1c231c] border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]"
        >
          {isPersian ? 'بازگشت' : 'Back'}
        </Button>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={getProductFormSchema(isPersian)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, handleSubmit: formikSubmit }) => (
          <Form noValidate dir={isRTL ? 'rtl' : 'ltr'} onSubmit={formikSubmit} className="space-y-8 pb-20">
            <SubmitErrorFocus isPersian={isPersian} />
            {/* 1. Basic Info Section */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <Package className="w-5 h-5 text-[#9f815b]" />
                  <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? '۱. مشخصات و عناوین اصلی محصول' : '1. Product Names & Identifiers'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <Input
                      dir="auto"
                      name="title"
                      label={isPersian ? 'عنوان فارسی محصول *' : 'Product Title (Persian) *'}
                      labelPlacement="outside-top"
                      isRequired
                      value={values.title}
                      onValueChange={(val) => setFieldValue('title', val)}
                      placeholder={isPersian ? 'مثال: ادکلن کرید اونتوس مردانه' : 'e.g. Creed Aventus For Men'}
                      isInvalid={Boolean(errors.title && touched.title)}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: Boolean(errors.title && touched.title)
                          ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-full shadow-xs transition-colors'
                          : 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs transition-colors',
                        input: 'text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                        label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      }}
                    />
                    {errors.title && touched.title && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                        {String(errors.title)}
                      </p>
                    )}
                  </div>

                  <Input
                    dir="auto"
                    name="titleEn"
                    label={isPersian ? 'عنوان انگلیسی محصول' : 'Product Title (English)'}
                    labelPlacement="outside-top"
                    value={values.titleEn}
                    onValueChange={(val) => setFieldValue('titleEn', val)}
                    placeholder="e.g. Creed Aventus Eau de Parfum"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs transition-colors',
                      input: 'text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                      label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                    }}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      dir="auto"
                      name="slug"
                      label={isPersian ? 'نامک آدرس (Slug یکتا)' : 'URL Slug (Unique)'}
                      labelPlacement="outside-top"
                      value={values.slug}
                      onValueChange={(val) => setFieldValue('slug', val)}
                      placeholder="creed-aventus-edp"
                      isInvalid={Boolean(errors.slug && touched.slug)}
                      variant="bordered"
                      radius="full"
                      classNames={{
                        inputWrapper: Boolean(errors.slug && touched.slug)
                          ? 'h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-full shadow-xs transition-colors'
                          : 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs transition-colors',
                        input: 'font-mono text-sm text-[#1d241d] dark:text-[#f7f4ee]',
                        label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      }}
                    />
                    {errors.slug && touched.slug && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                        {String(errors.slug)}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 2. Image Gallery Section */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-4">
                <ImageUploader images={images} onChange={setImages} maxImages={6} />
              </CardBody>
            </Card>

            {/* 3. Base Pricing & Stock */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee] pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  {isPersian ? '۲. قیمت پایه و موجودی انبار' : '2. Base Pricing & Inventory'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                  <AdminPriceInput
                    label={isPersian ? 'قیمت پایه (تومان) *' : 'Base Retail Price (Toman) *'}
                    isRequired
                    value={values.price}
                    onValueChange={(val) => setFieldValue('price', val)}
                    isInvalid={Boolean(errors.price && touched.price)}
                    errorMessage={errors.price && touched.price ? String(errors.price) : undefined}
                    placeholder={isPersian ? 'مثال: ۲,۵۰۰,۰۰۰' : 'e.g. 2,500,000'}
                  />

                  <AdminPriceInput
                    label={isPersian ? 'قیمت تخفیف‌خورده (اختیاری)' : 'Discount Price (Optional)'}
                    value={values.discountPrice}
                    onValueChange={(val) => setFieldValue('discountPrice', val || '')}
                    placeholder={isPersian ? 'در صورت وجود تخفیف' : 'Leave empty if regular price'}
                  />


                  <Input
                    label={isPersian ? 'تعداد موجودی کل انبار' : 'Total Stock Count'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(values.stockCount)}
                    onValueChange={(val) => setFieldValue('stockCount', val)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-sm font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                    }}
                  />

                  <Input
                    label={isPersian ? 'حداقل تعداد خرید (در هر سفارش)' : 'Minimum order quantity'}
                    labelPlacement="outside-top"
                    type="number"
                    min={1}
                    value={String(values.minPurchaseQuantity)}
                    onValueChange={(val) => setFieldValue('minPurchaseQuantity', val)}
                    isInvalid={Boolean(errors.minPurchaseQuantity && touched.minPurchaseQuantity)}
                    errorMessage={errors.minPurchaseQuantity && touched.minPurchaseQuantity ? String(errors.minPurchaseQuantity) : undefined}
                    description={isPersian ? 'مثلاً ۲ یعنی این محصول را باید دست‌کم ۲ عدد خرید.' : 'e.g. 2 means customers must buy at least 2.'}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-sm font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                    }}
                  />

                  <Input
                    label={isPersian ? 'حداکثر تعداد خرید (در هر سفارش)' : 'Maximum order quantity'}
                    labelPlacement="outside-top"
                    type="number"
                    min={1}
                    value={String(values.maxPurchaseQuantity ?? '')}
                    onValueChange={(val) => setFieldValue('maxPurchaseQuantity', val)}
                    isInvalid={Boolean(errors.maxPurchaseQuantity && touched.maxPurchaseQuantity)}
                    errorMessage={errors.maxPurchaseQuantity && touched.maxPurchaseQuantity ? String(errors.maxPurchaseQuantity) : undefined}
                    placeholder={isPersian ? 'خالی = بدون محدودیت (فقط موجودی)' : 'Empty = no limit (stock only)'}
                    description={isPersian ? 'مثلاً ۲ یعنی هر سفارش حداکثر ۲ عدد از این محصول.' : 'e.g. 2 means at most 2 per order.'}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-12 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-sm font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                    }}
                  />
                </div>
              </CardBody>
            </Card>

            {/* 4. Multi-Volume & Size Variants Section */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <ProductVariantManager
                  variants={variants}
                  onChange={setVariants}
                  basePrice={Number(values.price) || 0}
                />
              </CardBody>
            </Card>

            {/* 5. Brand & Perfume House Section */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#9f815b]" />
                    <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? '۴. برندها و خانه‌های عطر (Fragrance Brands)' : '4. Brand & Perfume House'}
                    </h3>
                  </div>

                  <Button
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => setIsBrandModalOpen(true)}
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] self-start sm:self-auto cursor-pointer"
                  >
                    {isPersian ? '+ ساخت برند جدید' : '+ Create New Brand'}
                  </Button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-xs text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian
                        ? 'خانه‌های عطر / برندهای مرتبط (می‌توانید چند برند انتخاب کنید):'
                        : 'Assigned Fragrance Brands (Multi-brand supported):'}
                    </label>
                    {selectedBrands.length > 0 && (
                      <Chip size="sm" variant="flat" color="warning" className="font-bold text-[11px]">
                        {isPersian
                          ? `${toPersianDigits(selectedBrands.length)} برند متصل شده`
                          : `${selectedBrands.length} brands selected`}
                      </Chip>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => {
                      const isSelected = selectedBrands.includes(b._id);
                      return (
                        <Button
                          key={b._id}
                          size="sm"
                          radius="full"
                          variant={isSelected ? 'solid' : 'bordered'}
                          onPress={() => handleBrandToggle(b._id)}
                          startContent={<Tag className="w-3.5 h-3.5 opacity-60" />}
                          className={`text-xs font-bold transition-all cursor-pointer ${
                            isSelected ? CHOICE_CHIP_SELECTED : CHOICE_CHIP_IDLE
                          }`}
                        >
                          <span>{isPersian ? b.name : b.nameEn || b.name}</span>
                          {b.nameEn && isPersian && (
                            <span className="text-[10px] font-sans opacity-70">({b.nameEn})</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 6. Categories & VIP Badges */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#9f815b]" />
                    <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? '۵. دسته‌بندی‌ها و وضعیت انتشار و VIP' : '5. Categories, Publication & VIP'}
                    </h3>
                  </div>

                  <Button
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => setIsCategoryModalOpen(true)}
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] self-start sm:self-auto cursor-pointer"
                  >
                    {isPersian ? '+ ساخت دسته جدید' : '+ Create New Category'}
                  </Button>
                </div>

                <div>
                  <label className="block font-bold text-xs mb-2 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'دسته‌بندی‌های مرتبط (می‌توانید چند مورد را انتخاب کنید):' : 'Assigned Categories:'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat._id);
                      const isSub = Boolean(cat.parentId);
                      const parentName = isSub
                        ? typeof cat.parentId === 'object' && cat.parentId
                          ? isPersian ? cat.parentId.name : cat.parentId.nameEn || cat.parentId.name
                          : categories.find((c) => c._id === cat.parentId)?.name
                        : null;

                      return (
                        <Button
                          key={cat._id}
                          size="sm"
                          radius="full"
                          variant={isSelected ? 'solid' : 'bordered'}
                          onPress={() => handleCategoryToggle(cat._id)}
                          className={`text-xs font-bold transition-all cursor-pointer ${
                            isSelected ? CHOICE_CHIP_SELECTED : CHOICE_CHIP_IDLE
                          }`}
                        >
                          {isSub && (
                            <span className="opacity-60 text-[10px] font-sans">
                              {parentName ? `${parentName} › ` : '↳ '}
                            </span>
                          )}
                          <span>{isPersian ? cat.name : cat.nameEn || cat.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold">
                  <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 min-w-0">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold truncate">
                      {isPersian ? 'انتشار عمومی در سایت' : 'Published & Visible'}
                    </span>
                    <div className="shrink-0">
                      <SmoothSwitch
                        isSelected={values.isPublished}
                        onValueChange={(val) => setFieldValue('isPublished', val)}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 px-4 rounded-2xl bg-[#9f815b]/10 border border-[#9f815b]/30 flex items-center justify-between gap-3 min-w-0">
                    <span className="text-[#9f815b] dark:text-[#d4be9b] font-bold truncate">
                      {isPersian ? 'فقط اعضای باشگاه VIP' : 'VIP Exclusive'}
                    </span>
                    <div className="shrink-0">
                      <SmoothSwitch
                        isSelected={values.isVipOnly}
                        onValueChange={(val) => setFieldValue('isVipOnly', val)}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between gap-3 min-w-0">
                    <span className="text-[#1d241d] dark:text-[#f7f4ee] font-bold truncate">
                      {isPersian ? 'منتخب در صفحه اصلی' : 'Featured Product'}
                    </span>
                    <div className="shrink-0">
                      <SmoothSwitch
                        isSelected={values.isFeatured}
                        onValueChange={(val) => setFieldValue('isFeatured', val)}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between gap-3 min-w-0">
                    <span className="text-[#1d241d] dark:text-[#f7f4ee] font-bold truncate">
                      {isPersian ? 'کالا موجود است' : 'In-Stock & Purchasable'}
                    </span>
                    <div className="shrink-0">
                      <SmoothSwitch
                        isSelected={values.inStock}
                        onValueChange={(val) => setFieldValue('inStock', val)}
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 7. Dynamic Attributes Builder */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-5">
                <DynamicAttributeBuilder attributes={attributes} onChange={setAttributes} />
              </CardBody>
            </Card>

            {/* 8. Bilingual Descriptions (Persian & English) */}
            <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
              <CardBody className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#9f815b]" />
                    <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? '۶. توضیحات و نقد تخصصی محصول (دوزبانه)' : '6. Product Descriptions (Bilingual)'}
                    </h3>
                  </div>

                  {/* Language Switch Tabs */}
                  <div className="flex items-center gap-1 bg-[#f8f5f0] dark:bg-[#242c24] p-1 rounded-2xl border border-[#e6dcce] dark:border-[#2e3a2e]">
                    <Button
                      size="sm"
                      radius="full"
                      variant={activeDescTab === 'fa' ? 'solid' : 'light'}
                      onPress={() => setActiveDescTab('fa')}
                      className={`text-xs font-bold ${
                        activeDescTab === 'fa' ? 'bg-[#9f815b] text-[#f7f4ee] font-black shadow-sm' : 'text-[#73695c] dark:text-[#a69c8e]'
                      }`}
                    >
                      <span>🇮🇷</span>
                      <span>{isPersian ? 'توضیحات فارسی' : 'Persian (FA)'}</span>
                    </Button>

                    <Button
                      size="sm"
                      radius="full"
                      variant={activeDescTab === 'en' ? 'solid' : 'light'}
                      onPress={() => setActiveDescTab('en')}
                      className={`text-xs font-bold ${
                        activeDescTab === 'en' ? 'bg-[#9f815b] text-[#f7f4ee] font-black shadow-sm' : 'text-[#73695c] dark:text-[#a69c8e]'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>{isPersian ? 'توضیحات انگلیسی' : 'English (EN)'}</span>
                    </Button>
                  </div>
                </div>

                {/* Persian Description Tab */}
                {activeDescTab === 'fa' && (
                  <div className="space-y-5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                      {isPersian
                        ? '🌿 این بخش برای کاربرانی که با زبان فارسی سایت را مشاهده می‌کنند نمایش داده می‌شود.'
                        : '🌿 This section is displayed when viewing the store in Persian.'}
                    </div>

                    <Textarea
                      label={isPersian ? 'خلاصه مشخصات فارسی' : 'Persian Short Summary'}
                      labelPlacement="outside-top"
                      minRows={2}
                      maxRows={6}
                      dir="rtl"
                      value={values.shortDescription}
                      onValueChange={(val) => setFieldValue('shortDescription', val)}
                      placeholder="توضیح کوتاه ۱-۲ خطی برای نمایش سریع..."
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: 'p-3 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                        input: 'min-h-24 whitespace-pre-wrap text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                        label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      }}
                    />

                    <div>
                      <Textarea
                        label={isPersian ? 'توضیحات کامل و هرم بویایی فارسی *' : 'Persian Full Description & Olfactory Pyramid *'}
                        labelPlacement="outside-top"
                        minRows={7}
                        maxRows={18}
                        dir="rtl"
                        value={values.description}
                        onValueChange={(val) => setFieldValue('description', val)}
                        placeholder="شرح کامل نت‌های ابتدایی، میانی، پایه، داستان عطر، هرم بویایی و راهنمای استفاده..."
                        isInvalid={Boolean(errors.description && touched.description)}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: Boolean(errors.description && touched.description)
                            ? 'p-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors'
                            : 'p-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs transition-colors',
                          input: 'min-h-48 whitespace-pre-wrap text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                          label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                        }}
                      />
                      {errors.description && touched.description && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                          {String(errors.description)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* English Description Tab */}
                {activeDescTab === 'en' && (
                  <div className="space-y-5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-[#9f815b]/10 border border-[#9f815b]/30 text-[#1d241d] dark:text-[#d4be9b] text-[11px] font-bold">
                      {isPersian
                        ? '🇬🇧 این بخش برای کاربرانی که با زبان انگلیسی سایت را مشاهده می‌کنند نمایش داده می‌شود.'
                        : '🇬🇧 This section is displayed when viewing the store in English.'}
                    </div>

                    <Textarea
                      label={isPersian ? 'خلاصه مشخصات انگلیسی' : 'English Short Summary'}
                      labelPlacement="outside-top"
                      minRows={2}
                      maxRows={6}
                      dir="ltr"
                      value={values.shortDescriptionEn}
                      onValueChange={(val) => setFieldValue('shortDescriptionEn', val)}
                      placeholder="e.g. Legendary niche masterpiece for men, radiating confidence and success..."
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: 'p-3 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                        input: 'min-h-24 whitespace-pre-wrap text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                        label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      }}
                    />

                    <Textarea
                      label={isPersian ? 'توضیحات کامل و هرم بویایی انگلیسی' : 'English Full Description & Olfactory Pyramid'}
                      labelPlacement="outside-top"
                      minRows={7}
                      maxRows={18}
                      dir="ltr"
                      value={values.descriptionEn}
                      onValueChange={(val) => setFieldValue('descriptionEn', val)}
                      placeholder="e.g. The undisputed king of modern niche fragrances. An exquisite blend of smoky pineapple, birch and oakmoss..."
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: 'p-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                        input: 'min-h-48 whitespace-pre-wrap text-sm font-semibold text-[#1d241d] dark:text-[#f7f4ee]',
                        label: 'text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee]',
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Persistent product form actions */}
            <div className="fixed bottom-4 left-1/2 z-[60] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-surface/95 p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                {isEditing && initialProduct && isAdmin && (
                  <Button
                    type="button"
                    radius="full"
                    aria-label={isPersian ? 'حذف محصول' : 'Delete product'}
                    title={isPersian ? 'حذف محصول' : 'Delete product'}
                    onPress={() => setDeleteConfirmOpen(true)}
                    isDisabled={deletingProduct || loading}
                    className="h-11 shrink-0 gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 text-xs font-bold text-rose-700 transition-all hover:bg-rose-500/15 active:scale-95 dark:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isPersian ? 'حذف' : 'Delete'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="bordered"
                  radius="full"
                  onPress={() => router.back()}
                  className="h-11 shrink-0 border border-brand-border bg-brand-surface-elevated px-4 text-xs font-bold text-brand-text transition-all active:scale-95"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  radius="full"
                  color="warning"
                  startContent={!loading && <Save className="h-3.5 w-3.5" />}
                  className="h-11 min-w-0 flex-1 bg-brand-gold px-3 text-xs font-black text-[#141914] shadow-sm transition-all active:scale-[0.98]"
                >
                  {loading
                    ? isPersian ? 'در حال ذخیره...' : 'Saving...'
                    : isEditing
                    ? isPersian ? 'ثبت تغییرات' : 'Save Changes'
                    : isPersian ? 'ثبت محصول' : 'Save Product'}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>

      {/* Quick Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl mx-4',
          header: 'border-b border-[#e6dcce] dark:border-[#2e3a2e] pb-3',
          body: 'py-4',
          footer: 'border-t border-[#e6dcce] dark:border-[#2e3a2e] pt-3',
        }}
      >
        <ModalContent dir={isRTL ? 'rtl' : 'ltr'}>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'ساخت سریع دسته‌بندی جدید' : 'Quick Create Category'}
                </h3>
              </ModalHeader>

              <ModalBody className="space-y-4 text-xs">
                <Input
                  dir="auto"
                  label={isPersian ? 'نام فارسی دسته‌بندی *' : 'Category Name (Persian) *'}
                  labelPlacement="outside-top"
                  isRequired
                  value={newCatName}
                  onValueChange={setNewCatName}
                  placeholder={isPersian ? 'مثال: عطر خنک تابستانه' : 'e.g. Fresh Summer Scents'}
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Input
                  dir="auto"
                  label={isPersian ? 'نام انگلیسی دسته‌بندی' : 'Category Name (English)'}
                  labelPlacement="outside-top"
                  value={newCatNameEn}
                  onValueChange={setNewCatNameEn}
                  placeholder="e.g. Fresh Summer Scents"
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <CategoryParentSelect
                  categories={categories}
                  selectedId={newCatParentId}
                  onChange={setNewCatParentId}
                  isPersian={isPersian}
                  isRTL={isRTL}
                />

                <Input
                  dir="auto"
                  label={isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                  labelPlacement="outside-top"
                  value={newCatSlug}
                  onValueChange={setNewCatSlug}
                  placeholder="e.g. fresh-summer-scents"
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-mono text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />
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
                  color="warning"
                  radius="full"
                  isLoading={creatingCategory}
                  onPress={() => handleQuickCreateCategory()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ایجاد و انتخاب دسته' : 'Create & Select'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <AdminConfirmModal
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={isPersian ? 'حذف محصول' : 'Delete product'}
        description={
          isPersian ? (
            <>
              <p>از حذف محصول <strong>«{initialProduct?.title}»</strong> مطمئن هستید؟</p>
              <p className="mt-2 text-rose-600 dark:text-rose-400">این عملیات قابل بازگشت نیست.</p>
            </>
          ) : (
            <>
              <p>Are you sure you want to delete <strong>&quot;{initialProduct?.title}&quot;</strong>?</p>
              <p className="mt-2 text-rose-600 dark:text-rose-400">This action cannot be undone.</p>
            </>
          )
        }
        confirmText={isPersian ? 'بله، حذف محصول' : 'Yes, delete product'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        isLoading={deletingProduct}
        onConfirm={handleDeleteProduct}
      />

      {/* Quick Create Brand Modal */}
      <Modal
        isOpen={isBrandModalOpen}
        onOpenChange={setIsBrandModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl mx-4',
          header: 'border-b border-[#e6dcce] dark:border-[#2e3a2e] pb-3',
          body: 'py-4',
          footer: 'border-t border-[#e6dcce] dark:border-[#2e3a2e] pt-3',
        }}
      >
        <ModalContent dir={isRTL ? 'rtl' : 'ltr'}>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'ساخت سریع خانه عطر / برند جدید' : 'Quick Create Brand'}
                </h3>
              </ModalHeader>

              <ModalBody className="space-y-4 text-xs">
                <Input
                  dir="auto"
                  label={isPersian ? 'نام برند به فارسی *' : 'Brand Name (Persian) *'}
                  labelPlacement="outside-top"
                  isRequired
                  value={newBrandName}
                  onValueChange={setNewBrandName}
                  placeholder={isPersian ? 'مثال: تام فورد، کرید، زرجوف' : 'e.g. Tom Ford, Creed'}
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Input
                  dir="auto"
                  label={isPersian ? 'نام برند به انگلیسی' : 'Brand Name (English)'}
                  labelPlacement="outside-top"
                  value={newBrandNameEn}
                  onValueChange={setNewBrandNameEn}
                  placeholder="e.g. Tom Ford, Creed, Xerjoff"
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-semibold text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Input
                  dir="auto"
                  label={isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                  labelPlacement="outside-top"
                  value={newBrandSlug}
                  onValueChange={setNewBrandSlug}
                  placeholder="e.g. tom-ford, creed"
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-mono text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />

                <Input
                  dir="auto"
                  label={isPersian ? 'آدرس اینترنتی لوگو (اختیاری)' : 'Logo URL (Optional)'}
                  labelPlacement="outside-top"
                  value={newBrandLogo}
                  onValueChange={setNewBrandLogo}
                  placeholder="https://..."
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                    input: 'text-sm font-mono text-brand-text',
                    label: 'text-xs font-bold text-brand-text',
                  }}
                />
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
                  color="warning"
                  radius="full"
                  isLoading={creatingBrand}
                  onPress={() => handleQuickCreateBrand()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ایجاد و انتخاب برند' : 'Create & Select'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
