'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Switch,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import { Award, Plus, Edit2, Trash2 } from 'lucide-react';
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در تغییر وضعیت برند.' : 'Failed to toggle brand status.'));
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
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت برندها و خانه‌های عطر' : 'Brands & Perfume Houses'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'خانه‌های عطرسازی نیش و دیزاینر (مانند کرید، زرجوف، تام فورد، پنهالیگونز و ...)'
              : 'Niche and designer fragrance houses (e.g. Creed, Xerjoff, Tom Ford, Penhaligon\'s)'}
          </p>
        </div>

        <Button
          onPress={openCreateModal}
          startContent={<Plus className="w-4 h-4" />}
          radius="lg"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer"
        >
          {isPersian ? 'افزودن برند جدید' : 'Add New Brand'}
        </Button>
      </div>

      {/* Brands Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 rounded-3xl bg-brand-surface-elevated"
            />
          ))
        ) : brands.length === 0 ? (
          <Card className="col-span-full p-12 text-center bg-brand-surface rounded-3xl border border-brand-border space-y-3">
            <CardBody className="flex flex-col items-center">
              <Award className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'هنوز برندی ثبت نشده است' : 'No brands registered yet'}
              </h3>
              <p className="text-xs text-brand-text-muted">
                {isPersian ? 'با دکمه بالا می‌توانید اولین برند یا خانه عطر را اضافه کنید.' : 'Use the button above to add your first fragrance brand.'}
              </p>
            </CardBody>
          </Card>
        ) : (
          brands.map((b) => (
            <Card
              key={b._id}
              className="bg-brand-surface p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors"
            >
              <CardBody className="p-0 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center border border-brand-border text-brand-bronze overflow-hidden">
                      {b.logo ? (
                        <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <Award className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Chip
                        size="sm"
                        variant="flat"
                        onClick={() => handleToggleStatus(b)}
                        className={`cursor-pointer font-black text-[10px] ${
                          b.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border'
                        }`}
                      >
                        {b.isActive !== false ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                      </Chip>
                      {b.isFeatured && (
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-bold text-[10px]"
                        >
                          {isPersian ? 'برند منتخب' : 'Featured Brand'}
                        </Chip>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-sm text-brand-text">
                    {isPersian ? b.name : b.nameEn || b.name}
                  </h3>
                  {((isPersian && b.nameEn) || (!isPersian && b.nameEn)) && (
                    <div className="text-xs text-brand-text-muted font-sans mt-0.5">
                      {isPersian ? b.nameEn : b.name}
                    </div>
                  )}
                  <div className="text-[11px] text-brand-text-muted font-mono mt-1">
                    slug: {b.slug}
                  </div>
                  {b.description && (
                    <p className="text-xs text-brand-text-muted line-clamp-2 mt-2">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-text-muted">
                    {isPersian ? `اولویت: ${toPersianDigits(b.order || 1)}` : `Order: ${b.order || 1}`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      isIconOnly
                      size="sm"
                      radius="lg"
                      variant="light"
                      onPress={() => openEditModal(b)}
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
                      onPress={() => handleDelete(b._id, b.name)}
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
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-md mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-4",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-black text-base">
                {editingBrand
                  ? isPersian ? 'ویرایش خانه عطر / برند' : 'Edit Brand'
                  : isPersian ? 'تعریف خانه عطر / برند جدید' : 'New Brand'}
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Input
                  label={isPersian ? 'نام برند به فارسی' : 'Brand Name (Persian)'}
                  isRequired
                  value={name}
                  onValueChange={setName}
                  placeholder={isPersian ? 'مثال: کرید، تام فورد، زرجوف' : 'e.g. Creed, Xerjoff'}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Input
                  label={isPersian ? 'نام برند به انگلیسی' : 'Brand Name (English)'}
                  value={nameEn}
                  onValueChange={setNameEn}
                  placeholder="e.g. Creed, Tom Ford, Xerjoff"
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Input
                  label={isPersian ? 'نامک آدرس (Slug)' : 'URL Slug'}
                  value={slug}
                  onValueChange={setSlug}
                  placeholder="e.g. creed, tom-ford, xerjoff"
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold font-mono",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Input
                  label={isPersian ? 'آدرس لوگوی برند (اختیاری)' : 'Brand Logo URL (Optional)'}
                  value={logo}
                  onValueChange={setLogo}
                  placeholder="https://..."
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold font-mono",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text",
                  }}
                />

                <Textarea
                  label={isPersian ? 'توضیحات کوتاه درباره خانه عطر' : 'Short Description'}
                  rows={2}
                  value={description}
                  onValueChange={setDescription}
                  placeholder={isPersian ? 'توضیح کوتاه درباره تاریخچه و سبک عطرسازی...' : 'Short summary...'}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "bg-brand-surface-elevated border-brand-border hover:border-brand-gold",
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
                    {isPersian ? 'برند فعال و قابل نمایش باشد' : 'Active and visible'}
                  </Switch>

                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    size="sm"
                    classNames={{
                      label: "text-xs font-bold text-brand-text",
                    }}
                  >
                    {isPersian ? 'برند منتخب' : 'Featured Brand'}
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
                  {isPersian ? 'ذخیره برند' : 'Save Brand'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
