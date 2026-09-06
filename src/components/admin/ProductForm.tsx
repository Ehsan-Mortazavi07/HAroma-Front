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
} from 'lucide-react';
import { IProduct, ICategory, IProductAttribute, IProductVariant } from '@/common/interfaces';
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialProduct?.categories?.map((c) => (typeof c === 'string' ? c : c._id)) || [],
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminApi.getCategories();
        setCategories(res || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
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

            {/* 5. Categories & VIP Badges */}
            <div className="bg-[#ffffff] dark:bg-[#1c231c] p-6 sm:p-8 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <Layers className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? '۴. انتخاب دسته‌بندی‌ها و دسترسی VIP' : '4. Categories & VIP Flags'}
                </h3>
              </div>

              <div>
                <label className="block font-bold text-xs mb-2 text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? 'دسته‌بندی‌های مرتبط (می‌توانید چند مورد را انتخاب کنید):' : 'Assigned Categories:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat._id);
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => handleCategoryToggle(cat._id)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-sm font-black'
                            : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e]'
                        }`}
                      >
                        {isPersian ? cat.name : cat.nameEn || cat.name}
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
    </div>
  );
}
