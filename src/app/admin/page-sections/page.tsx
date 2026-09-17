'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutTemplate,
  Crown,
  Eye,
  EyeOff,
  Edit2,
  Check,
  Sparkles,
  Sliders,
  FileText,
  Phone,
  Mail,
  MapPin,
  Save,
} from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from '@heroui/react';
import { adminApi } from '@/common/api/admin';
import { IPageSection } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';

export default function AdminPageSectionsPage() {
  const { isPersian } = useTranslation();
  const [sections, setSections] = useState<IPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<IPageSection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // General Section Form State
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [order, setOrder] = useState(1);

  // Footer Settings State
  const [aboutFa, setAboutFa] = useState('');
  const [aboutEn, setAboutEn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressFa, setAddressFa] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [copyrightFa, setCopyrightFa] = useState('');
  const [copyrightEn, setCopyrightEn] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPageSections();
      setSections(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleToggleVisibility = async (sec: IPageSection) => {
    try {
      await adminApi.updatePageSection(sec.sectionKey || sec._id, { isVisible: !sec.isVisible });
      toast.success(
        isPersian
          ? `نمایش بخش «${sec.title}» ${!sec.isVisible ? 'فعال' : 'غیرفعال'} شد.`
          : `Section "${sec.title}" visibility toggled.`,
      );
      loadSections();
    } catch (err) {
      toast.error(isPersian ? 'خطا در تغییر وضعیت نمایش.' : 'Failed to update visibility.');
    }
  };

  const handleToggleVip = async (sec: IPageSection) => {
    try {
      await adminApi.updatePageSection(sec.sectionKey || sec._id, { isVipOnly: !sec.isVipOnly });
      toast.success(
        !sec.isVipOnly
          ? isPersian
            ? `بخش «${sec.title}» اختصاصی کاربران VIP شد! 👑`
            : `Section "${sec.title}" is now VIP exclusive!`
          : isPersian
            ? `بخش «${sec.title}» عمومی شد.`
            : `Section "${sec.title}" is now public.`,
      );
      loadSections();
    } catch (err) {
      toast.error(isPersian ? 'خطا در تغییر دسترسی VIP.' : 'Failed to update VIP access.');
    }
  };

  const openEditModal = (sec: IPageSection) => {
    setEditingSection(sec);
    setTitle(sec.title || '');
    setTitleEn(sec.titleEn || '');
    setIsVisible(sec.isVisible);
    setIsVipOnly(sec.isVipOnly);
    setOrder(sec.order || 1);

    if (sec.sectionKey === 'footer_settings' && sec.config) {
      setAboutFa(sec.config.aboutFa || '');
      setAboutEn(sec.config.aboutEn || '');
      setPhone(sec.config.phone || '');
      setEmail(sec.config.email || '');
      setAddressFa(sec.config.addressFa || '');
      setAddressEn(sec.config.addressEn || '');
      setCopyrightFa(sec.config.copyrightFa || '');
      setCopyrightEn(sec.config.copyrightEn || '');
    } else {
      setAboutFa(
        'هاتف آروما با بیش از ۱۰ سال سابقه درخشان در عرضه معتبرترین و نایاب‌ترین عطرهای جهان، اصالت ۱۰۰٪ تمامی محصولات و ضمانت بازگشت وجه را برای مشتریان گرامی تضمین می‌نماید.',
      );
      setAboutEn(
        'Hatef Aroma is the premier destination for rare, artisanal, and authentic niche fragrances, offering a 100% genuine guarantee and express delivery.',
      );
      setPhone('۰۲۱-۸۸۸۸۷۷۶۶');
      setEmail('info@hatefaroma.com');
      setAddressFa('تهران، خیابان ولیعصر، بالاتر از میدان ونک، برج آروما، طبقه ۶');
      setAddressEn('Tehran, Valiasr St, Above Vanak Sq, Aroma Tower, 6th Floor');
      setCopyrightFa('© ۲۰۲۶ تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی هاتف آروما (HatefAroma) محفوظ است.');
      setCopyrightEn('© 2026 Hatef Aroma Luxury Perfumes. All rights reserved.');
    }

    setModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSection) return;

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        isVisible,
        isVipOnly,
        order: Number(order),
      };

      if (editingSection.sectionKey === 'footer_settings') {
        payload.config = {
          aboutFa: aboutFa.trim(),
          aboutEn: aboutEn.trim(),
          phone: phone.trim(),
          email: email.trim(),
          addressFa: addressFa.trim(),
          addressEn: addressEn.trim(),
          copyrightFa: copyrightFa.trim(),
          copyrightEn: copyrightEn.trim(),
        };
      }

      await adminApi.updatePageSection(editingSection.sectionKey || editingSection._id, payload);
      toast.success(
        isPersian
          ? 'تنظیمات و متون بخش با موفقیت به‌روزرسانی شد.'
          : 'Section settings & texts updated successfully.',
      );
      setModalOpen(false);
      loadSections();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || (isPersian ? 'خطا در ویرایش بخش.' : 'Failed to update section.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
          {isPersian ? 'شخصی‌ساز بخش‌های صفحه، دسترسی VIP و متون فوتر' : 'Page Sections, VIP & Footer Customizer'}
        </h1>
        <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
          {isPersian
            ? 'کنترل زنده نمایش، ترتیب قرارگیری، انحصاری کردن برای VIP و ویرایش متون و اطلاعات فوتر سایت'
            : 'Live control of section visibility, layout order, VIP access, and full footer customization'}
        </p>
      </motion.div>

      {/* Sections Card / Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/4 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                  <Skeleton className="h-8 w-20 rounded-xl" />
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <LayoutTemplate className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                {isPersian ? 'بخشی یافت نشد' : 'No sections found'}
              </h3>
            </div>
          ) : (
            <Table
              aria-label={isPersian ? 'جدول مدیریت بخش‌های صفحه' : 'Page Sections Table'}
              classNames={{
                wrapper: 'p-0 bg-transparent shadow-none border-none overflow-x-auto',
                th: 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] font-bold text-xs py-4 px-4 first:pr-6 last:pl-6 border-b border-[#e6dcce] dark:border-[#2e3a2e]',
                td: 'py-4 px-4 text-xs font-semibold first:pr-6 last:pl-6',
                tr: 'border-b border-[#e6dcce]/60 dark:border-[#2e3a2e]/60 hover:bg-[#f8f5f0]/60 dark:hover:bg-[#242c24]/60 transition-colors',
              }}
            >
              <TableHeader>
                <TableColumn>{isPersian ? 'عنوان بخش صفحه' : 'Section Name'}</TableColumn>
                <TableColumn>{isPersian ? 'شناسه یکتا (Key)' : 'Section Key'}</TableColumn>
                <TableColumn>{isPersian ? 'اولویت چیدمان' : 'Display Order'}</TableColumn>
                <TableColumn>{isPersian ? 'وضعیت نمایش' : 'Visibility'}</TableColumn>
                <TableColumn>{isPersian ? 'انحصاری VIP' : 'VIP Exclusivity'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات و ویرایش متون' : 'Actions & Edit'}</TableColumn>
              </TableHeader>
              <TableBody>
                {sections.map((sec) => (
                  <TableRow key={sec._id}>
                    <TableCell>
                      <div>
                        <div className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                          {sec.title}
                        </div>
                        <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                          {sec.titleEn || (isPersian ? 'صفحه اصلی' : 'Homepage')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                        {sec.sectionKey}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-black text-sm">
                        {isPersian ? toPersianDigits(sec.order) : sec.order}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        radius="full"
                        variant={sec.isVisible ? 'flat' : 'faded'}
                        color={sec.isVisible ? 'warning' : 'danger'}
                        onPress={() => handleToggleVisibility(sec)}
                        startContent={sec.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        {sec.isVisible
                          ? isPersian ? 'نمایش در سایت' : 'Visible'
                          : isPersian ? 'مخفی شده' : 'Hidden'}
                      </Button>
                    </TableCell>

                    <TableCell>
                      {sec.sectionKey !== 'footer_settings' ? (
                        <Button
                          size="sm"
                          radius="full"
                          variant={sec.isVipOnly ? 'solid' : 'bordered'}
                          onPress={() => handleToggleVip(sec)}
                          startContent={<Crown className="w-3.5 h-3.5" />}
                          className={`text-xs font-bold ${
                            sec.isVipOnly
                              ? 'bg-brand-gold text-[#141914] shadow-xs font-black'
                              : 'border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e]'
                          }`}
                        >
                          {sec.isVipOnly
                            ? isPersian ? 'فقط اعضای VIP' : 'VIP Only'
                            : isPersian ? 'عمومی (همه)' : 'Public'}
                        </Button>
                      ) : (
                        <Chip size="sm" variant="flat" className="text-[11px] font-bold">
                          {isPersian ? 'ثابت سراسری' : 'Global'}
                        </Chip>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        radius="full"
                        variant="bordered"
                        onPress={() => openEditModal(sec)}
                        startContent={<Edit2 className="w-3.5 h-3.5 text-[#9f815b]" />}
                        className="font-bold border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
                      >
                        {sec.sectionKey === 'footer_settings'
                          ? isPersian ? 'ویرایش متن‌های فوتر' : 'Edit Footer Texts'
                          : isPersian ? 'ویرایش' : 'Edit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>

      {/* HeroUI Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: 'bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl mx-4',
          header: 'border-b border-[#e6dcce] dark:border-[#2e3a2e] pb-3',
          body: 'py-5',
          footer: 'border-t border-[#e6dcce] dark:border-[#2e3a2e] pt-3',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {editingSection?.sectionKey === 'footer_settings'
                    ? isPersian ? 'مدیریت و ویرایش کامل متن‌های فوتر' : 'Edit Footer Content & Settings'
                    : isPersian ? 'تنظیمات بخش صفحه' : 'Section Settings'}
                </h3>
              </ModalHeader>

              <ModalBody className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'عنوان بخش (فارسی)' : 'Section Title (FA)'}
                    labelPlacement="outside"
                    isRequired
                    value={title}
                    onValueChange={setTitle}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-xs font-semibold text-brand-text',
                      label: 'text-xs font-bold text-brand-text mb-1',
                    }}
                  />

                  <Input
                    label={isPersian ? 'عنوان بخش (انگلیسی)' : 'Section Title (EN)'}
                    labelPlacement="outside"
                    value={titleEn}
                    onValueChange={setTitleEn}
                    placeholder="e.g. Footer Content & Settings"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-xs font-semibold text-brand-text',
                      label: 'text-xs font-bold text-brand-text mb-1',
                    }}
                  />
                </div>

                {/* Special Controls for Footer Customizer */}
                {editingSection?.sectionKey === 'footer_settings' ? (
                  <div className="space-y-4 pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                    <div className="font-bold text-[#9f815b] flex items-center gap-1.5 text-sm">
                      <FileText className="w-4 h-4" />
                      <span>{isPersian ? 'متون و مشخصات فوتر' : 'Footer Content Details'}</span>
                    </div>

                    <Textarea
                      label={isPersian ? 'متن درباره برند در فوتر (فارسی)' : 'About Brand Bio (Persian)'}
                      labelPlacement="outside"
                      rows={3}
                      value={aboutFa}
                      onValueChange={setAboutFa}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: 'p-3 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                        input: 'text-xs font-semibold leading-relaxed text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />

                    <Textarea
                      label={isPersian ? 'متن درباره برند در فوتر (انگلیسی)' : 'About Brand Bio (English)'}
                      labelPlacement="outside"
                      rows={3}
                      value={aboutEn}
                      onValueChange={setAboutEn}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: 'p-3 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-2xl shadow-xs',
                        input: 'text-xs font-semibold leading-relaxed text-brand-text',
                        label: 'text-xs font-bold text-brand-text mb-1',
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={isPersian ? 'شماره تماس و پشتیبانی' : 'Support Phone'}
                        labelPlacement="outside"
                        value={phone}
                        onValueChange={setPhone}
                        placeholder="۰۲۱-۸۸۸۸۷۷۶۶"
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-mono font-bold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        label={isPersian ? 'ایمیل پشتیبانی' : 'Support Email'}
                        labelPlacement="outside"
                        type="email"
                        value={email}
                        onValueChange={setEmail}
                        placeholder="info@hatefaroma.com"
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-sans font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={isPersian ? 'آدرس فروشگاه (فارسی)' : 'Address (Persian)'}
                        labelPlacement="outside"
                        value={addressFa}
                        onValueChange={setAddressFa}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        label={isPersian ? 'آدرس فروشگاه (انگلیسی)' : 'Address (English)'}
                        labelPlacement="outside"
                        value={addressEn}
                        onValueChange={setAddressEn}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={isPersian ? 'متن کپی‌رایت انتهای فوتر (فارسی)' : 'Copyright Text (Persian)'}
                        labelPlacement="outside"
                        value={copyrightFa}
                        onValueChange={setCopyrightFa}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        label={isPersian ? 'متن کپی‌رایت انتهای فوتر (انگلیسی)' : 'Copyright Text (English)'}
                        labelPlacement="outside"
                        value={copyrightEn}
                        onValueChange={setCopyrightEn}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-xs font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <Input
                    label={isPersian ? 'اولویت چیدمان در صفحه' : 'Display Order'}
                    labelPlacement="outside"
                    type="number"
                    min={1}
                    value={String(order)}
                    onValueChange={(val) => setOrder(Number(val))}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-11 px-4 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-xs font-bold text-brand-text',
                      label: 'text-xs font-bold text-brand-text mb-1',
                    }}
                  />
                )}

                {/* Toggles using HeroUI Switch */}
                <div className="pt-3 flex flex-wrap gap-6 items-center">
                  <SmoothSwitch isSelected={isVisible} onValueChange={setIsVisible}>
                    {isPersian ? 'نمایش در سایت' : 'Visible in Storefront'}
                  </SmoothSwitch>

                  {editingSection?.sectionKey !== 'footer_settings' && (
                    <SmoothSwitch isSelected={isVipOnly} onValueChange={setIsVipOnly}>
                      {isPersian ? 'فقط برای کاربران VIP' : 'VIP Only Exclusive'}
                    </SmoothSwitch>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={() => onClose()}
                  className="font-bold text-xs"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>

                <Button
                  color="warning"
                  radius="full"
                  isLoading={submitting}
                  onPress={() => handleSubmit()}
                  startContent={!submitting && <Save className="w-4 h-4" />}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md"
                >
                  {isPersian ? 'ذخیره تغییرات' : 'Save Changes'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

