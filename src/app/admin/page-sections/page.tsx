'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import {
  motion } from 'framer-motion';
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
  Checkbox,
  Textarea as HeroTextarea,
} from '@heroui/react';
import { adminApi } from '@/common/api/admin';
import { IPageSection, IPageSectionPriority } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { SingleImageUploader } from '@/components/admin/SingleImageUploader';
import { DEFAULT_CAMPAIGN_BANNERS, DEFAULT_HERO_BANNER, DEFAULT_TRUST_FEATURES, DEFAULT_VIP_BANNER, DEFAULT_VIP_PERKS } from '@/common/constants/homepage-content';
import { IPageSectionBanner, ITrustFeatureContent } from '@/common/interfaces';

type ContentTextareaProps = Omit<React.ComponentProps<typeof HeroTextarea>, 'dir' | 'classNames'> & {
  language: 'fa' | 'en';
  surface?: 'default' | 'elevated';
};

function ContentTextarea({ language, surface = 'elevated', ...props }: ContentTextareaProps) {
  const direction = language === 'fa' ? 'rtl' : 'ltr';
  const surfaceClass = surface === 'elevated' ? 'bg-brand-surface-elevated' : 'bg-brand-surface';

  return (
    <HeroTextarea
      {...props}
      dir={direction}
      classNames={{
        base: 'w-full min-w-0',
        label: 'mb-1 w-full text-xs font-bold text-brand-text',
        inputWrapper: `!h-auto min-h-[7rem] items-stretch rounded-2xl border border-brand-border ${surfaceClass} p-3 shadow-xs transition-colors hover:border-brand-gold`,
        innerWrapper: 'h-full w-full',
        input: `!h-auto min-h-[5rem] w-full resize-y py-0 text-sm font-semibold leading-7 text-brand-text ${direction === 'rtl' ? 'text-right' : 'text-left'}`,
      }}
    />
  );
}

interface PriorityPickerProps {
  count: number;
  value: number;
  onChange: (priority: number) => void;
  isPersian: boolean;
  label: string;
  hint: string;
}

function PriorityPicker({ count, value, onChange, isPersian, label, hint }: PriorityPickerProps) {
  const priorities = Array.from({ length: Math.max(1, count) }, (_, index) => index + 1);

  return (
    <fieldset className="min-w-0 space-y-3" dir="rtl">
      <legend className="text-xs font-bold text-brand-text">{label}</legend>
      <p className="text-[11px] leading-6 text-brand-text-muted">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {priorities.map((priority) => {
          const displayPriority = isPersian ? toPersianDigits(priority) : priority;
          return (
            <Checkbox
              key={priority}
              size="sm"
              color="warning"
              isSelected={value === priority}
              aria-label={isPersian ? `اولویت ${displayPriority}` : `Priority ${displayPriority}`}
              onValueChange={(checked) => checked && onChange(priority)}
              classNames={{
                base: 'm-0 max-w-none cursor-pointer rounded-xl border border-brand-border bg-brand-surface-elevated px-3 py-2 transition-colors data-[selected=true]:border-brand-gold data-[selected=true]:bg-brand-gold/15',
                wrapper: 'after:bg-brand-gold before:border-brand-border',
                label: 'text-xs font-bold text-brand-text',
              }}
            >
              {isPersian ? `اولویت ${displayPriority}` : `Priority ${displayPriority}`}
            </Checkbox>
          );
        })}
      </div>
    </fieldset>
  );
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function getPagePriorityOrder(sections: IPageSection[]) {
  return sections
    .filter((section) => section.sectionKey !== 'footer_settings')
    .slice()
    .sort((a, b) => a.order - b.order || a.sectionKey.localeCompare(b.sectionKey))
    .map((section) => section.sectionKey);
}

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
  const [sectionPriorityOrder, setSectionPriorityOrder] = useState<string[]>([]);
  const [banners, setBanners] = useState<IPageSectionBanner[]>([]);
  const [features, setFeatures] = useState<ITrustFeatureContent[]>(DEFAULT_TRUST_FEATURES);
  const [vipPerksFa, setVipPerksFa] = useState(DEFAULT_VIP_PERKS.fa.join('\n'));
  const [vipPerksEn, setVipPerksEn] = useState(DEFAULT_VIP_PERKS.en.join('\n'));

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
    const nextVis = !sec.isVisible;
    setSections((prev) =>
      prev.map((s) => (s._id === sec._id ? { ...s, isVisible: nextVis } : s))
    );
    try {
      await adminApi.toggleSectionVisibility(sec.sectionKey || sec._id, nextVis);
      toast.success(
        isPersian
          ? `نمایش بخش «${sec.title}» ${nextVis ? 'فعال' : 'غیرفعال'} شد.`
          : `Section "${sec.title}" visibility toggled.`,
      );
    } catch (err: any) {
      setSections((prev) =>
        prev.map((s) => (s._id === sec._id ? { ...s, isVisible: !nextVis } : s))
      );
      toast.error(
        err?.response?.data?.message ||
        (isPersian ? 'خطا در تغییر وضعیت نمایش.' : 'Failed to update visibility.')
      );
    }
  };

  const handleToggleVip = async (sec: IPageSection) => {
    const nextVip = !sec.isVipOnly;
    setSections((prev) =>
      prev.map((s) => (s._id === sec._id ? { ...s, isVipOnly: nextVip } : s))
    );
    try {
      await adminApi.toggleSectionVip(sec.sectionKey || sec._id, nextVip);
      toast.success(
        nextVip
          ? isPersian
            ? `بخش «${sec.title}» اختصاصی کاربران VIP شد! 👑`
            : `Section "${sec.title}" is now VIP exclusive!`
          : isPersian
            ? `بخش «${sec.title}» عمومی شد.`
            : `Section "${sec.title}" is now public.`,
      );
    } catch (err: any) {
      setSections((prev) =>
        prev.map((s) => (s._id === sec._id ? { ...s, isVipOnly: !nextVip } : s))
      );
      toast.error(
        err?.response?.data?.message ||
        (isPersian ? 'خطا در تغییر دسترسی VIP.' : 'Failed to update VIP access.')
      );
    }
  };

  const openEditModal = (sec: IPageSection) => {
    setEditingSection(sec);
    setTitle(sec.title || '');
    setTitleEn(sec.titleEn || '');
    setIsVisible(sec.isVisible);
    setIsVipOnly(sec.isVipOnly);
    const nextPriorityOrder = getPagePriorityOrder(sections);
    setSectionPriorityOrder(nextPriorityOrder);
    setOrder(
      sec.sectionKey === 'footer_settings'
        ? sec.order || 1
        : Math.max(1, nextPriorityOrder.indexOf(sec.sectionKey) + 1),
    );

    const defaultBanners = sec.sectionKey === 'hero_banner'
      ? [DEFAULT_HERO_BANNER]
      : sec.sectionKey === 'promo_cards'
        ? DEFAULT_CAMPAIGN_BANNERS
        : sec.sectionKey === 'vip_club_banner'
          ? [DEFAULT_VIP_BANNER]
          : [];
    const sectionBanners = sec.banners?.length ? sec.banners : defaultBanners;
    setBanners(sectionBanners.map((banner, index) => ({
      ...(defaultBanners.find((item) => item.id === banner.id) || defaultBanners[index] || {}),
      ...banner,
    })));
    const savedFeatures: ITrustFeatureContent[] = Array.isArray(sec.config?.features) ? sec.config.features : [];
    setFeatures(DEFAULT_TRUST_FEATURES.map((feature) => ({
      ...feature,
      ...(savedFeatures.find((item) => item.id === feature.id) || {}),
    })));
    setVipPerksFa(Array.isArray(sec.config?.perksFa) ? sec.config.perksFa.join('\n') : DEFAULT_VIP_PERKS.fa.join('\n'));
    setVipPerksEn(Array.isArray(sec.config?.perksEn) ? sec.config.perksEn.join('\n') : DEFAULT_VIP_PERKS.en.join('\n'));

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

      if (editingSection.sectionKey !== 'footer_settings') {
        const priorityOrder: IPageSectionPriority[] = sectionPriorityOrder.map((sectionKey, index) => ({
          sectionKey,
          order: index + 1,
        }));
        payload.priorityOrder = priorityOrder;
      }

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

      if (['hero_banner', 'promo_cards', 'vip_club_banner'].includes(editingSection.sectionKey)) {
        payload.banners = banners;
      }

      if (editingSection.sectionKey === 'trust_features') {
        payload.config = { ...editingSection.config, features };
      }

      if (editingSection.sectionKey === 'vip_club_banner') {
        payload.config = {
          ...editingSection.config,
          perksFa: vipPerksFa.split('\n').map((perk) => perk.trim()).filter(Boolean),
          perksEn: vipPerksEn.split('\n').map((perk) => perk.trim()).filter(Boolean),
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
        placement="top"
        scrollBehavior="inside"
        size="3xl"
        classNames={{
          wrapper: 'items-start overflow-y-auto py-2 sm:py-4',
          base: 'flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl mx-4',
          header: 'shrink-0 border-b border-brand-border pb-3 px-6 pt-5',
          body: 'min-h-0 flex-1 overflow-y-auto overscroll-contain py-5 px-6',
          footer: 'shrink-0 border-t border-brand-border pt-3 px-6 pb-5',
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
                    dir="auto"
                    label={isPersian ? 'عنوان بخش (فارسی)' : 'Section Title (FA)'}
                    labelPlacement="outside-top"
                    isRequired
                    value={title}
                    onValueChange={setTitle}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-sm font-semibold text-brand-text',
                      label: 'text-xs font-bold text-brand-text mb-1',
                    }}
                  />

                  <Input
                    dir="auto"
                    label={isPersian ? 'عنوان بخش (انگلیسی)' : 'Section Title (EN)'}
                    labelPlacement="outside-top"
                    value={titleEn}
                    onValueChange={setTitleEn}
                    placeholder="e.g. Footer Content & Settings"
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                      input: 'text-sm font-semibold text-brand-text',
                      label: 'text-xs font-bold text-brand-text mb-1',
                    }}
                  />
                </div>

                {/* Special Controls for Footer Customizer */}
                {editingSection?.sectionKey === 'footer_settings' ? (
                  <div className="space-y-4 pt-2 border-t border-brand-border">
                    <div className="font-bold text-[#9f815b] flex items-center gap-1.5 text-sm">
                      <FileText className="w-4 h-4" />
                      <span>{isPersian ? 'متون و مشخصات فوتر' : 'Footer Content Details'}</span>
                    </div>

                    <ContentTextarea
                      language="fa"
                      label={isPersian ? 'متن درباره برند در فوتر (فارسی)' : 'About Brand Bio (Persian)'}
                      labelPlacement="outside-top"
                      minRows={3}
                      value={aboutFa}
                      onValueChange={setAboutFa}
                      variant="bordered"
                      radius="lg"
                    />

                    <ContentTextarea
                      language="en"
                      label={isPersian ? 'متن درباره برند در فوتر (انگلیسی)' : 'About Brand Bio (English)'}
                      labelPlacement="outside-top"
                      minRows={3}
                      value={aboutEn}
                      onValueChange={setAboutEn}
                      variant="bordered"
                      radius="lg"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        dir="auto"
                        label={isPersian ? 'شماره تماس و پشتیبانی' : 'Support Phone'}
                        labelPlacement="outside-top"
                        value={phone}
                        onValueChange={setPhone}
                        placeholder="۰۲۱-۸۸۸۸۷۷۶۶"
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-mono font-bold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        label={isPersian ? 'ایمیل پشتیبانی' : 'Support Email'}
                        labelPlacement="outside-top"
                        type="email"
                        value={email}
                        onValueChange={setEmail}
                        placeholder="info@hatefaroma.com"
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-sans font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        dir="auto"
                        label={isPersian ? 'آدرس فروشگاه (فارسی)' : 'Address (Persian)'}
                        labelPlacement="outside-top"
                        value={addressFa}
                        onValueChange={setAddressFa}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        dir="auto"
                        label={isPersian ? 'آدرس فروشگاه (انگلیسی)' : 'Address (English)'}
                        labelPlacement="outside-top"
                        value={addressEn}
                        onValueChange={setAddressEn}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        dir="auto"
                        label={isPersian ? 'متن کپی‌رایت انتهای فوتر (فارسی)' : 'Copyright Text (Persian)'}
                        labelPlacement="outside-top"
                        value={copyrightFa}
                        onValueChange={setCopyrightFa}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />

                      <Input
                        dir="auto"
                        label={isPersian ? 'متن کپی‌رایت انتهای فوتر (انگلیسی)' : 'Copyright Text (English)'}
                        labelPlacement="outside-top"
                        value={copyrightEn}
                        onValueChange={setCopyrightEn}
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: 'h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs',
                          input: 'text-sm font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {editingSection?.sectionKey !== 'footer_settings' && (
                      <PriorityPicker
                        count={sectionPriorityOrder.length}
                        value={order}
                        onChange={(priority) => {
                          const currentIndex = sectionPriorityOrder.indexOf(editingSection?.sectionKey || '');
                          setSectionPriorityOrder(moveItem(sectionPriorityOrder, currentIndex, priority - 1));
                          setOrder(priority);
                        }}
                        isPersian={isPersian}
                        label={isPersian ? 'اولویت نمایش این بخش' : 'Section display priority'}
                        hint={isPersian ? 'یک اولویت را انتخاب کنید؛ بخش‌های دیگر به‌صورت خودکار جابه‌جا می‌شوند.' : 'Choose one priority. The other sections move automatically.'}
                      />
                    )}

                    {banners.length > 0 && (
                      <div className="space-y-4 border-t border-brand-border pt-5">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-brand-text">
                            {isPersian ? 'محتوا و تصاویر بنرها' : 'Banner Content & Images'}
                          </h4>
                          <p className="text-[11px] leading-relaxed text-brand-text-muted">
                            {isPersian ? 'متن‌ها برای هر زبان جداگانه ذخیره می‌شوند. تصویر و مسیر دکمه نیز از همین‌جا قابل تغییر است.' : 'Edit the copy per language, the image, and its destination.'}
                          </p>
                        </div>
                        {banners.map((banner, index) => {
                          const updateBanner = (key: keyof IPageSectionBanner, value: string) => {
                            setBanners((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
                          };
                          return (
                            <div key={banner.id || index} className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface-elevated/50 p-4">
                              <div className="space-y-3 border-b border-brand-border pb-4">
                                <h5 className="font-bold text-xs text-brand-gold">
                                  {isPersian ? `بنر ${toPersianDigits(index + 1)}` : `Banner ${index + 1}`}
                                </h5>
                                <PriorityPicker
                                  count={banners.length}
                                  value={index + 1}
                                  onChange={(priority) => setBanners((current) => moveItem(current, index, priority - 1))}
                                  isPersian={isPersian}
                                  label={isPersian ? 'اولویت نمایش بنر' : 'Banner display priority'}
                                  hint={isPersian ? 'با انتخاب اولویت، ترتیب بقیهٔ بنرها هم به‌روزرسانی می‌شود.' : 'Choosing a priority updates the order of the other banners.'}
                                />
                              </div>
                              <SingleImageUploader
                                value={banner.imageUrl}
                                onChange={(value) => updateBanner('imageUrl', value)}
                                label={isPersian ? 'تصویر بنر' : 'Banner image'}
                                aspectRatio="video"
                                className="max-w-xl"
                              />
                              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                                <Input dir="auto" label={isPersian ? 'عنوان فارسی' : 'Persian title'} labelPlacement="outside-top" value={banner.title || ''} onValueChange={(value) => updateBanner('title', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <Input dir="auto" label={isPersian ? 'عنوان انگلیسی' : 'English title'} labelPlacement="outside-top" value={banner.titleEn || ''} onValueChange={(value) => updateBanner('titleEn', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <ContentTextarea language="fa" surface="default" label={isPersian ? 'توضیح فارسی' : 'Persian description'} labelPlacement="outside-top" minRows={3} value={banner.subtitle || ''} onValueChange={(value) => updateBanner('subtitle', value)} variant="bordered" radius="lg" />
                                <ContentTextarea language="en" surface="default" label={isPersian ? 'توضیح انگلیسی' : 'English description'} labelPlacement="outside-top" minRows={3} value={banner.subtitleEn || ''} onValueChange={(value) => updateBanner('subtitleEn', value)} variant="bordered" radius="lg" />
                                <Input dir="auto" label={isPersian ? 'برچسب فارسی' : 'Persian badge'} labelPlacement="outside-top" value={banner.badge || ''} onValueChange={(value) => updateBanner('badge', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <Input dir="auto" label={isPersian ? 'برچسب انگلیسی' : 'English badge'} labelPlacement="outside-top" value={banner.badgeEn || ''} onValueChange={(value) => updateBanner('badgeEn', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <Input dir="ltr" label={isPersian ? 'مسیر مقصد (مثال: /products)' : 'Destination path (e.g. /products)'} labelPlacement="outside-top" value={banner.link || ''} onValueChange={(value) => updateBanner('link', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {editingSection?.sectionKey === 'vip_club_banner' && (
                      <div className="grid grid-cols-1 gap-4 border-t border-brand-border pt-5 sm:grid-cols-2">
                        <ContentTextarea language="fa" label={isPersian ? 'مزیت‌های VIP (فارسی؛ هر مورد در یک خط)' : 'VIP perks (Persian; one per line)'} labelPlacement="outside-top" minRows={4} value={vipPerksFa} onValueChange={setVipPerksFa} variant="bordered" radius="lg" />
                        <ContentTextarea language="en" label={isPersian ? 'مزیت‌های VIP (انگلیسی؛ هر مورد در یک خط)' : 'VIP perks (English; one per line)'} labelPlacement="outside-top" minRows={4} value={vipPerksEn} onValueChange={setVipPerksEn} variant="bordered" radius="lg" />
                      </div>
                    )}

                    {editingSection?.sectionKey === 'trust_features' && (
                      <div className="space-y-4 border-t border-brand-border pt-5">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-brand-text">{isPersian ? 'محتوا و تصاویر ویژگی‌ها' : 'Feature Content & Images'}</h4>
                          <p className="text-[11px] leading-relaxed text-brand-text-muted">{isPersian ? 'تصویر هر ویژگی اختیاری است؛ در صورت خالی بودن، آیکون فعلی نمایش داده می‌شود.' : 'Feature images are optional; the current icon remains when no image is set.'}</p>
                        </div>
                        {features.map((feature, index) => {
                          const updateFeature = (key: keyof ITrustFeatureContent, value: string) => {
                            setFeatures((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
                          };
                          return (
                            <div key={feature.id} className="grid grid-cols-1 gap-4 rounded-2xl border border-brand-border bg-brand-surface-elevated/50 p-4 sm:grid-cols-[180px_1fr]">
                              <SingleImageUploader value={feature.imageUrl || ''} onChange={(value) => updateFeature('imageUrl', value)} label={isPersian ? 'تصویر ویژگی' : 'Feature image'} aspectRatio="square" />
                              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                                <Input dir="auto" label={isPersian ? 'عنوان فارسی' : 'Persian title'} labelPlacement="outside-top" value={feature.title} onValueChange={(value) => updateFeature('title', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <Input dir="auto" label={isPersian ? 'عنوان انگلیسی' : 'English title'} labelPlacement="outside-top" value={feature.titleEn} onValueChange={(value) => updateFeature('titleEn', value)} variant="bordered" radius="full" classNames={{ inputWrapper: 'h-11 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold rounded-full shadow-xs', input: 'text-sm font-semibold text-brand-text', label: 'text-xs font-bold text-brand-text mb-1' }} />
                                <ContentTextarea language="fa" surface="default" label={isPersian ? 'توضیح فارسی' : 'Persian description'} labelPlacement="outside-top" minRows={3} value={feature.description} onValueChange={(value) => updateFeature('description', value)} variant="bordered" radius="lg" />
                                <ContentTextarea language="en" surface="default" label={isPersian ? 'توضیح انگلیسی' : 'English description'} labelPlacement="outside-top" minRows={3} value={feature.descriptionEn} onValueChange={(value) => updateFeature('descriptionEn', value)} variant="bordered" radius="lg" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
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
                  className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>

                <Button
                  color="warning"
                  radius="full"
                  isLoading={submitting}
                  onPress={() => handleSubmit()}
                  startContent={!submitting && <Save className="w-4 h-4" />}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
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
