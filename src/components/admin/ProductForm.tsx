'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field } from 'formik';
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
  X,
} from 'lucide-react';
import { IProduct, ICategory, IBrand, IProductAttribute, IProductVariant } from '@/common/interfaces';
import { getProductFormSchema } from '@/common/validators';
import { PATHS } from '@/common/constants/PATHS';
import { toast } from '@/common/utils';
import { adminApi } from '@/common/api/admin';
import { ImageUploader } from './ImageUploader';
import { DynamicAttributeBuilder } from './DynamicAttributeBuilder';
import { ProductVariantManager } from './ProductVariantManager';
import { useTranslation } from '@/common/i18n';

interface ProductFormProps {
  initialProduct?: IProduct;
  isEditing?: boolean;
}

export function ProductForm({ initialProduct, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { isPersian, isRTL } = useTranslation();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDescTab, setActiveDescTab] = useState<'fa' | 'en'>('fa');

  // Images, Attributes and Variants local state
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [attributes, setAttributes] = useState<IProductAttribute[]>(
    initialProduct?.attributes || [],
  );
  const [variants, setVariants] = useState<IProductVariant[]>(
    initialProduct?.variants || [],
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(
    initialProduct?.brand
      ? typeof initialProduct.brand === 'string'
        ? initialProduct.brand
        : initialProduct.brand._id
      : '',
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialProduct?.categories?.map((c) => (typeof c === 'string' ? c : c._id)) || [],
  );

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

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleQuickCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setSelectedBrand(created._id);
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
    description: initialProduct?.description || '',
    descriptionEn: initialProduct?.descriptionEn || '',
    shortDescription: initialProduct?.shortDescription || '',
    shortDescriptionEn: initialProduct?.shortDescriptionEn || '',
    isVipOnly: initialProduct?.isVipOnly || false,
    isFeatured: initialProduct?.isFeatured || false,
    inStock: initialProduct?.inStock !== undefined ? initialProduct.inStock : true,
  };

  const handleSubmit = async (values: any) => {
    if (images.length === 0) {
      toast.error(isPersian ? 'حداقل یک تصویر برای محصول آپلود نمایید.' : 'Upload at least one product image.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        ...values,
        price: Number(values.price),
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        stockCount: Number(values.stockCount),
        brand: selectedBrand || null,
        categories: selectedCategories,
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
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
              ? 'اطلاعات عمومی، تصاویر، دسته‌بندی‌ها، حجم‌های متنوع، توضیحات دوزبانه و ویژگی‌های داینامیک را وارد نمایید'
              : 'Fill in details, upload images, configure volume variants, bilingual descriptions & dynamic attributes'}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#f8f5f0] transition-colors"
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isPersian ? 'بازگشت' : 'Back'}</span>
        </button>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={getProductFormSchema(isPersian)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="space-y-8">
            {/* 1. Basic Info Section */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <Package className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? '۱. مشخصات و عناوین اصلی محصول' : '1. Product Names & Identifiers'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'عنوان فارسی محصول *' : 'Product Title (Persian) *'}
                  </label>
                  <Field
                    name="title"
                    placeholder={isPersian ? 'مثال: ادکلن کرید اونتوس مردانه' : 'e.g. Creed Aventus For Men'}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  {errors.title && touched.title && (
                    <div className="text-[11px] text-rose-500 mt-1 font-bold">
                      {errors.title as string}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'عنوان انگلیسی محصول' : 'Product Title (English)'}
                  </label>
                  <Field
                    name="titleEn"
                    placeholder="e.g. Creed Aventus Eau de Parfum"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'نامک آدرس (Slug یکتا)' : 'URL Slug (Unique)'}
                  </label>
                  <Field
                    name="slug"
                    placeholder="creed-aventus-edp"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono text-xs text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  {errors.slug && touched.slug && (
                    <div className="text-[11px] text-rose-500 mt-1 font-bold">
                      {errors.slug as string}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Image Gallery Section */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-4">
              <ImageUploader images={images} onChange={setImages} maxImages={6} />
            </div>

            {/* 3. Base Pricing & Stock */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee] pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                {isPersian ? '۲. قیمت پایه و موجودی انبار' : '2. Base Pricing & Inventory'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'قیمت پایه (تومان) *' : 'Base Retail Price (Toman) *'}
                  </label>
                  <Field
                    name="price"
                    type="number"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  {errors.price && touched.price && (
                    <div className="text-[11px] text-rose-500 mt-1 font-bold">
                      {errors.price as string}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'قیمت تخفیف‌خورده (اختیاری)' : 'Discount Price (Optional)'}
                  </label>
                  <Field
                    name="discountPrice"
                    type="number"
                    placeholder={isPersian ? 'در صورت وجود تخفیف' : 'Leave empty if regular price'}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? 'تعداد موجودی کل انبار' : 'Total Stock Count'}
                  </label>
                  <Field
                    name="stockCount"
                    type="number"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Multi-Volume & Size Variants Section */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <ProductVariantManager
                variants={variants}
                onChange={setVariants}
                basePrice={Number(values.price) || 0}
              />
            </div>

            {/* 4. Brand & Perfume House Section */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#9f815b]" />
                  <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? '۴. برند و خانه عطر (Brand / Perfume House)' : '4. Brand & Perfume House'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isPersian ? '+ ساخت برند جدید' : '+ Create New Brand'}</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-xs mb-2 text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? 'انتخاب خانه عطر / برند تولیدکننده:' : 'Assigned Fragrance Brand:'}
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full sm:w-1/2 h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
                  >
                    <option value="">{isPersian ? '— بدون برند (یا برند متفرقه) —' : '— Unassigned / Generic Brand —'}</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {isPersian ? b.name : b.nameEn || b.name} {b.nameEn && isPersian ? `(${b.nameEn})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedBrand && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#9f815b] dark:text-[#d4be9b]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{isPersian ? 'برند این عطر با موفقیت متصل شد' : 'Brand connected'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Categories & VIP Badges */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#9f815b]" />
                  <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? '۵. دسته‌بندی‌ها و دسترسی VIP' : '5. Categories & VIP Flags'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isPersian ? '+ ساخت دسته جدید' : '+ Create New Category'}</span>
                </button>
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
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => handleCategoryToggle(cat._id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ease-out flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-gold text-[#141914] shadow-sm font-black ring-2 ring-[#bfa27a]/40'
                            : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                        }`}
                      >
                        {isSub && (
                          <span className="opacity-60 text-[10px] font-sans">
                            {parentName ? `${parentName} › ` : '↳ '}
                          </span>
                        )}
                        <span>{isPersian ? cat.name : cat.nameEn || cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer text-[#9f815b] dark:text-[#d4be9b]">
                  <Field
                    name="isVipOnly"
                    type="checkbox"
                    className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                  />
                  <span>{isPersian ? 'فقط مخصوص اعضای باشگاه VIP' : 'VIP Members Exclusive'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#1d241d] dark:text-[#f7f4ee]">
                  <Field
                    name="isFeatured"
                    type="checkbox"
                    className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                  />
                  <span>{isPersian ? 'نمایش در منتخب‌های صفحه اصلی' : 'Featured on Homepage'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#1d241d] dark:text-[#f7f4ee]">
                  <Field
                    name="inStock"
                    type="checkbox"
                    className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                  />
                  <span>{isPersian ? 'کالا موجود و قابل سفارش است' : 'In-Stock & Purchasable'}</span>
                </label>
              </div>
            </div>

            {/* 6. Dynamic Attributes Builder */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <DynamicAttributeBuilder attributes={attributes} onChange={setAttributes} />
            </div>

            {/* 7. Bilingual Descriptions (Persian & English) */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#9f815b]" />
                  <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                    {isPersian ? '۶. توضیحات و نقد تخصصی محصول (دوزبانه)' : '6. Product Descriptions (Bilingual)'}
                  </h3>
                </div>

                {/* Language Switch Tabs */}
                <div className="flex items-center gap-1 bg-[#f8f5f0] dark:bg-[#242c24] p-1 rounded-2xl border border-[#e6dcce] dark:border-[#2e3a2e]">
                  <button
                    type="button"
                    onClick={() => setActiveDescTab('fa')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeDescTab === 'fa'
                        ? 'bg-[#9f815b] text-[#f7f4ee] shadow-sm font-black'
                        : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d]'
                    }`}
                  >
                    <span>🇮🇷</span>
                    <span>{isPersian ? 'توضیحات فارسی' : 'Persian (FA)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDescTab('en')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeDescTab === 'en'
                        ? 'bg-[#9f815b] text-[#f7f4ee] shadow-sm font-black'
                        : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d]'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>{isPersian ? 'توضیحات انگلیسی' : 'English (EN)'}</span>
                  </button>
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

                  <div>
                    <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'خلاصه مشخصات فارسی' : 'Persian Short Summary'}
                    </label>
                    <Field
                      name="shortDescription"
                      as="textarea"
                      rows={2}
                      dir="rtl"
                      placeholder="توضیح کوتاه ۱-۲ خطی برای نمایش سریع..."
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'توضیحات کامل و هرم بویایی فارسی *' : 'Persian Full Description & Olfactory Pyramid *'}
                    </label>
                    <Field
                      name="description"
                      as="textarea"
                      rows={7}
                      dir="rtl"
                      placeholder="شرح کامل نت‌های ابتدایی، میانی، پایه، داستان عطر، هرم بویایی و راهنمای استفاده..."
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                    {errors.description && touched.description && (
                      <div className="text-[11px] text-rose-500 mt-1 font-bold">
                        {errors.description as string}
                      </div>
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

                  <div>
                    <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'خلاصه مشخصات انگلیسی' : 'English Short Summary'}
                    </label>
                    <Field
                      name="shortDescriptionEn"
                      as="textarea"
                      rows={2}
                      dir="ltr"
                      placeholder="e.g. Legendary niche masterpiece for men, radiating confidence and success..."
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'توضیحات کامل و هرم بویایی انگلیسی' : 'English Full Description & Olfactory Pyramid'}
                    </label>
                    <Field
                      name="descriptionEn"
                      as="textarea"
                      rows={7}
                      dir="ltr"
                      placeholder="e.g. The undisputed king of modern niche fragrances. An exquisite blend of smoky pineapple, birch and oakmoss..."
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-black bg-[#bfa27a] hover:bg-[#d4be9b] text-[#141914] shadow-xl shadow-[#9f815b]/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
              >
                <Save className="w-5 h-5" />
                <span>
                  {loading
                    ? isPersian ? 'در حال ذخیره‌سازی محصول...' : 'Saving Product...'
                    : isEditing
                    ? isPersian ? 'به‌روزرسانی و ثبت تغییرات محصول' : 'Update Product'
                    : isPersian ? 'ثبت و انتشار محصول جدید' : 'Save & Publish Product'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 rounded-2xl bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#f8f5f0] transition-colors"
              >
                {isPersian ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {/* Quick Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'ساخت سریع دسته‌بندی جدید' : 'Quick Create Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام فارسی دسته‌بندی *' : 'Category Name (Persian) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={isPersian ? 'مثال: عطر خنک تابستانه' : 'e.g. Fresh Summer Scents'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام انگلیسی دسته‌بندی' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Fresh Summer Scents"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'دسته والد (اختیاری - برای زیردسته)' : 'Parent Category (Optional - Subcategory)'}
                </label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-xs focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
                >
                  <option value="">{isPersian ? '— دسته‌بندی سطح اصلی (بدون والد) —' : '— Main Category (No Parent) —'}</option>
                  {categories.map((c) => (
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
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="e.g. fresh-summer-scents"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {creatingCategory
                    ? isPersian ? 'در حال ایجاد...' : 'Creating...'
                    : isPersian ? 'ایجاد و انتخاب دسته' : 'Create & Select'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'ساخت سریع خانه عطر / برند جدید' : 'Quick Create Brand'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام برند به فارسی *' : 'Brand Name (Persian) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder={isPersian ? 'مثال: تام فورد، کرید، زرجوف' : 'e.g. Tom Ford, Creed'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نام برند به انگلیسی' : 'Brand Name (English)'}
                </label>
                <input
                  type="text"
                  value={newBrandNameEn}
                  onChange={(e) => setNewBrandNameEn(e.target.value)}
                  placeholder="e.g. Tom Ford, Creed, Xerjoff"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                </label>
                <input
                  type="text"
                  value={newBrandSlug}
                  onChange={(e) => setNewBrandSlug(e.target.value)}
                  placeholder="e.g. tom-ford, creed"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'آدرس اینترنتی لوگو (اختیاری)' : 'Logo URL (Optional)'}
                </label>
                <input
                  type="text"
                  value={newBrandLogo}
                  onChange={(e) => setNewBrandLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono text-[11px] focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={creatingBrand}
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {creatingBrand
                    ? isPersian ? 'در حال ایجاد...' : 'Creating...'
                    : isPersian ? 'ایجاد و انتخاب برند' : 'Create & Select'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
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
