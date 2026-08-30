'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Crown,
  Eye,
  EyeOff,
  Edit2,
  Check,
  Sparkles,
  X,
  Sliders,
  FileText,
  Phone,
  Mail,
  MapPin,
  Save,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IPageSection } from '@/common/interfaces';
import { toast, toPersianDigits } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div>
        <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
          {isPersian ? 'شخصی‌ساز بخش‌های صفحه، دسترسی VIP و متون فوتر' : 'Page Sections, VIP & Footer Customizer'}
        </h1>
        <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
          {isPersian
            ? 'کنترل زنده نمایش، ترتیب قرارگیری، انحصاری کردن برای VIP و ویرایش متون و اطلاعات فوتر سایت'
            : 'Live control of section visibility, layout order, VIP access, and full footer customization'}
        </p>
      </div>

      {/* Sections Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'در حال بارگذاری لیست بخش‌ها...' : 'Loading sections...'}
          </div>
        ) : sections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <LayoutTemplate className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'بخشی یافت نشد' : 'No sections found'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-[#f8f5f0] dark:bg-[#242c24] border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  <th className="py-4 px-6">{isPersian ? 'عنوان بخش صفحه' : 'Section Name'}</th>
                  <th className="py-4 px-4">{isPersian ? 'شناسه یکتا (Key)' : 'Section Key'}</th>
                  <th className="py-4 px-4">{isPersian ? 'اولویت چیدمان' : 'Display Order'}</th>
                  <th className="py-4 px-4">{isPersian ? 'وضعیت نمایش' : 'Visibility'}</th>
                  <th className="py-4 px-4">{isPersian ? 'انحصاری VIP' : 'VIP Exclusivity'}</th>
                  <th className="py-4 px-6 text-center">{isPersian ? 'عملیات و ویرایش متون' : 'Actions & Edit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {sections.map((sec) => (
                  <tr key={sec._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                        {sec.title}
                      </div>
                      <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                        {sec.titleEn || (isPersian ? 'صفحه اصلی' : 'Homepage')}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                      {sec.sectionKey}
                    </td>

                    <td className="py-4 px-4 font-black">
                      {isPersian ? toPersianDigits(sec.order) : sec.order}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleVisibility(sec)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                          sec.isVisible
                            ? 'bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {sec.isVisible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>{isPersian ? 'نمایش در سایت' : 'Visible'}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>{isPersian ? 'مخفی شده' : 'Hidden'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      {sec.sectionKey !== 'footer_settings' ? (
                        <button
                          onClick={() => handleToggleVip(sec)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                            sec.isVipOnly
                              ? 'bg-[#bfa27a] text-[#1d241d] shadow-xs'
                              : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e]'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>
                            {sec.isVipOnly
                              ? isPersian
                                ? 'فقط اعضای VIP'
                                : 'VIP Only'
                              : isPersian
                                ? 'عمومی (همه)'
                                : 'Public'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                          {isPersian ? 'ثابت سراسری' : 'Global'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openEditModal(sec)}
                        className="px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors inline-flex items-center gap-1.5 font-bold"
                        title={isPersian ? 'ویرایش تنظیمات و متون' : 'Edit Settings & Texts'}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#9f815b]" />
                        <span>
                          {sec.sectionKey === 'footer_settings'
                            ? isPersian ? 'ویرایش متن‌های فوتر' : 'Edit Footer Texts'
                            : isPersian ? 'ویرایش' : 'Edit'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {editingSection.sectionKey === 'footer_settings'
                    ? isPersian ? 'مدیریت و ویرایش کامل متن‌های فوتر' : 'Edit Footer Content & Settings'
                    : isPersian ? 'تنظیمات بخش صفحه' : 'Section Settings'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'عنوان بخش (فارسی)' : 'Section Title (FA)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'عنوان بخش (انگلیسی)' : 'Section Title (EN)'}
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Footer Content & Settings"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              {/* Special Controls for Footer Customizer */}
              {editingSection.sectionKey === 'footer_settings' ? (
                <div className="space-y-4 pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="font-bold text-[#9f815b] flex items-center gap-1 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>{isPersian ? 'متون و مشخصات فوتر' : 'Footer Content Details'}</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      {isPersian ? 'متن درباره برند در فوتر (فارسی)' : 'About Brand Bio (Persian)'}
                    </label>
                    <textarea
                      rows={3}
                      value={aboutFa}
                      onChange={(e) => setAboutFa(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold leading-relaxed focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      {isPersian ? 'متن درباره برند در فوتر (انگلیسی)' : 'About Brand Bio (English)'}
                    </label>
                    <textarea
                      rows={3}
                      value={aboutEn}
                      onChange={(e) => setAboutEn(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold leading-relaxed focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'شماره تماس و پشتیبانی' : 'Support Phone'}
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="۰۲۱-۸۸۸۸۷۷۶۶"
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono font-bold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'ایمیل پشتیبانی' : 'Support Email'}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@hatefaroma.com"
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-sans font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'آدرس فروشگاه (فارسی)' : 'Address (Persian)'}
                      </label>
                      <input
                        type="text"
                        value={addressFa}
                        onChange={(e) => setAddressFa(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'آدرس فروشگاه (انگلیسی)' : 'Address (English)'}
                      </label>
                      <input
                        type="text"
                        value={addressEn}
                        onChange={(e) => setAddressEn(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'متن کپی‌رایت انتهای فوتر (فارسی)' : 'Copyright Text (Persian)'}
                      </label>
                      <input
                        type="text"
                        value={copyrightFa}
                        onChange={(e) => setCopyrightFa(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">
                        {isPersian ? 'متن کپی‌رایت انتهای فوتر (انگلیسی)' : 'Copyright Text (English)'}
                      </label>
                      <input
                        type="text"
                        value={copyrightEn}
                        onChange={(e) => setCopyrightEn(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'اولویت چیدمان در صفحه' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="pt-2 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 accent-[#9f815b] rounded"
                  />
                  <span className="font-bold">{isPersian ? 'نمایش در سایت' : 'Visible in Storefront'}</span>
                </label>

                {editingSection.sectionKey !== 'footer_settings' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVipOnly}
                      onChange={(e) => setIsVipOnly(e.target.checked)}
                      className="w-4 h-4 accent-[#9f815b] rounded"
                    />
                    <span className="font-bold text-[#9f815b] dark:text-[#d4be9b]">
                      {isPersian ? 'فقط برای کاربران VIP' : 'VIP Only Exclusive'}
                    </span>
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] font-black shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? (isPersian ? 'در حال ذخیره...' : 'Saving...') : (isPersian ? 'ذخیره تغییرات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
