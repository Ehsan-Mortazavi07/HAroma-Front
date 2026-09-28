'use client';

import { Input, Textarea } from '@/components/common/DirectionalFields';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  Building,
  Hash,
  UserPlus,
  X,
  Check,
  FileText,
} from 'lucide-react';
import { UserRole } from '@/common/interfaces';
import { adminApi } from '@/common/api/admin';
import { toPersianDigits, toEnglishDigits, toast } from '@/common/utils';
import { parseIsoDate, gregorianToJalali } from '@/common/utils/date';
import { IRAN_PROVINCES } from '@/common/constants/iranProvinces';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { motion, AnimatePresence } from 'framer-motion';

export interface CreateUserModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onUserCreated?: () => void;
  isPersian?: boolean;
}

const modalMotionProps = {
  variants: {
    initial: {
      scale: 0.94,
      opacity: 0,
      y: 16,
    },
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        scale: {
          duration: 0.36,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        y: {
          duration: 0.36,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        opacity: {
          duration: 0.25,
          ease: 'easeOut' as const,
        },
      },
    },
    exit: {
      scale: 0.96,
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  },
};

const inputWrapperClass =
  'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors';
const inputLabelClass = 'text-xs font-bold text-brand-text mb-1.5 block text-right';

const defaultFormData = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'user' as UserRole,
  isVip: false,
  vipExpiresAt: null as string | null,
  avatar: '',
  birthDate: null as string | null,
  birthDateShamsi: null as string | null,
  province: '',
  city: '',
  address: '',
  postalCode: '',
  buildingNumber: '',
  unit: '',
  recipientName: '',
  recipientPhone: '',
  recipientEmail: '',
  addressNotes: '',
};

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  onUserCreated,
  isPersian = true,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('identity');
  const [formData, setFormData] = useState(defaultFormData);
  const [touched, setTouched] = useState({ fullName: false, username: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role dropdown state
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isRoleDropdownOpen) return;
    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isRoleDropdownOpen]);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData);
      setTouched({ fullName: false, username: false, password: false });
      setSelectedTab('identity');
      setShowPassword(false);
      setIsRoleDropdownOpen(false);
    }
  }, [isOpen]);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.success(isPersian ? 'کلمه عبور تصادفی ایجاد شد.' : 'Random secure password generated.');
  };

  const handleBirthDateChange = (isoDate: string) => {
    const parsed = parseIsoDate(isoDate);
    let shamsi: string | null = null;
    if (parsed) {
      const [jy, jm, jd] = gregorianToJalali(parsed[0], parsed[1], parsed[2]);
      shamsi = `${jy}/${jm < 10 ? '0' + jm : jm}/${jd < 10 ? '0' + jd : jd}`;
    }
    setFormData((prev) => ({
      ...prev,
      birthDate: isoDate,
      birthDateShamsi: shamsi,
    }));
  };

  const handleSetVipDuration = (days: number | null) => {
    if (days === null) {
      setFormData((prev) => ({ ...prev, isVip: true, vipExpiresAt: null }));
    } else {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      setFormData((prev) => ({
        ...prev,
        isVip: true,
        vipExpiresAt: expiry.toISOString(),
      }));
    }
  };

  const handleSubmit = async () => {
    setTouched({ fullName: true, username: true, password: true });
    if (!formData.fullName.trim()) {
      toast.error(isPersian ? 'وارد کردن نام و نام خانوادگی ضروری است.' : 'Full name is required.');
      setSelectedTab('identity');
      return;
    }

    if (!formData.username.trim()) {
      toast.error(isPersian ? 'وارد کردن نام کاربری ضروری است.' : 'Username is required.');
      setSelectedTab('identity');
      return;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error(isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email format.');
        setSelectedTab('identity');
        return;
      }
    }

    if (!formData.password) {
      toast.error(isPersian ? 'وارد کردن کلمه عبور ضروری است.' : 'Password is required.');
      setSelectedTab('identity');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(
        isPersian
          ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.'
          : 'Password must be at least 6 characters long.',
      );
      setSelectedTab('identity');
      return;
    }

    const cleanPhone = formData.phone ? toEnglishDigits(formData.phone).trim() : '';
    if (cleanPhone) {
      const iranMobileRegex = /^09\d{9}$/;
      if (!iranMobileRegex.test(cleanPhone)) {
        toast.error(
          isPersian
            ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
            : 'Mobile phone must be 11 digits starting with 09.',
        );
        setSelectedTab('identity');
        return;
      }
    }

    const cleanPostal = formData.postalCode ? toEnglishDigits(formData.postalCode).trim() : '';
    if (cleanPostal && cleanPostal.length !== 10) {
      toast.error(
        isPersian
          ? 'کد پستی باید دقیقاً ۱۰ رقم باشد.'
          : 'Postal code must be exactly 10 digits.',
      );
      setSelectedTab('address');
      return;
    }

    const cleanRecipientPhone = formData.recipientPhone ? toEnglishDigits(formData.recipientPhone).trim() : '';
    if (cleanRecipientPhone) {
      const iranMobileRegex = /^09\d{9}$/;
      if (!iranMobileRegex.test(cleanRecipientPhone)) {
        toast.error(
          isPersian
            ? 'شماره تماس تحویل‌گیرنده باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
            : 'Recipient phone must be 11 digits starting with 09.',
        );
        setSelectedTab('address');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        isVip: formData.isVip,
      };

      if (formData.email.trim()) {
        payload.email = formData.email.trim().toLowerCase();
      }

      if (cleanPhone) payload.phone = cleanPhone;
      if (formData.isVip && formData.vipExpiresAt) payload.vipExpiresAt = formData.vipExpiresAt;
      if (formData.avatar.trim()) payload.avatar = formData.avatar.trim();
      if (formData.birthDate) payload.birthDate = formData.birthDate;
      if (formData.birthDateShamsi) payload.birthDateShamsi = formData.birthDateShamsi;
      if (formData.province.trim()) payload.province = formData.province.trim();
      if (formData.city.trim()) payload.city = formData.city.trim();
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (cleanPostal) payload.postalCode = cleanPostal;
      if (formData.buildingNumber.trim()) payload.buildingNumber = formData.buildingNumber.trim();
      if (formData.unit.trim()) payload.unit = formData.unit.trim();
      if (formData.recipientName.trim()) payload.recipientName = formData.recipientName.trim();
      if (cleanRecipientPhone) payload.recipientPhone = cleanRecipientPhone;
      if (formData.recipientEmail?.trim()) payload.recipientEmail = formData.recipientEmail.trim().toLowerCase();
      if (formData.addressNotes.trim()) payload.addressNotes = formData.addressNotes.trim();

      await adminApi.createUser(payload);

      toast.success(
        isPersian
          ? 'حساب کاربری جدید با موفقیت ایجاد شد.'
          : 'New user account created successfully.',
      );

      if (onUserCreated) {
        onUserCreated();
      }

      if (onClose) {
        onClose();
      } else if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Failed to create user', err);
      const errMsg =
        err?.response?.data?.message ||
        (isPersian ? 'خطا در ایجاد حساب کاربری.' : 'Failed to create user account.');
      toast.error(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={onClose}
      backdrop="blur"
      size="3xl"
      scrollBehavior="inside"
      placement="center"
      motionProps={modalMotionProps}
      classNames={{
        base: 'bg-brand-surface border border-brand-border rounded-3xl shadow-2xl text-brand-text max-h-[92vh] overflow-hidden',
        header: 'p-6 pb-4 border-b border-brand-border bg-brand-surface/80 backdrop-blur-md sticky top-0 z-20',
        body: 'p-6 space-y-6',
        footer: 'p-5 border-t border-brand-border bg-brand-surface/80 backdrop-blur-md sticky bottom-0 z-20 flex justify-between items-center',
        closeButton: 'hover:bg-brand-gold/15 active:bg-brand-gold/25 text-brand-text-muted hover:text-brand-text rounded-full p-2 top-5 right-5',
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* Modal Header */}
            <ModalHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-brand-text flex items-center gap-2">
                    <span>{isPersian ? 'افزودن کاربر جدید' : 'Create New User'}</span>
                    <Chip
                      size="sm"
                      variant="flat"
                      classNames={{
                        base: 'bg-brand-gold/15 border border-brand-gold/30 h-6 px-2',
                        content: 'text-brand-text font-black text-[10px]',
                      }}
                    >
                      {isPersian ? 'مدیر سیستم' : 'Admin'}
                    </Chip>
                  </h2>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {isPersian
                      ? 'ثبت‌نام مستقیم کاربر جدید به همراه تعیین نقش، کلمه عبور و عضویت VIP'
                      : 'Directly register a new user with role, credentials, and VIP tier'}
                  </p>
                </div>
              </div>
            </ModalHeader>

            {/* Modal Body */}
            <ModalBody>
              {/* Tabs for Organization */}
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(k) => setSelectedTab(k as string)}
                variant="light"
                radius="full"
                classNames={{
                  tabList: 'bg-brand-surface-elevated border border-brand-border p-1 w-full gap-2',
                  cursor: 'bg-brand-gold text-[#141914] shadow-md rounded-full',
                  tab: 'h-10 text-xs font-bold transition-all',
                  tabContent: 'group-data-[selected=true]:text-[#141914] text-brand-text-muted font-bold',
                }}
              >
                <Tab
                  key="identity"
                  title={
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>{isPersian ? 'مشخصات هویتی و امنیتی' : 'Identity & Security'}</span>
                    </div>
                  }
                />
                <Tab
                  key="address"
                  title={
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isPersian ? 'اطلاعات تکمیلی و آدرس تحویل' : 'Additional Info & Address'}</span>
                    </div>
                  }
                />
              </Tabs>

              {/* Tab 1: Identity & Credentials */}
              {selectedTab === 'identity' && (
                <div className="space-y-6 pt-2">
                  {/* Grid for Name, Username, Email, Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Input
                        dir="auto"
                        label={
                          <span className="flex items-center gap-1">
                            <span>{isPersian ? 'نام و نام خانوادگی' : 'Full Name'}</span>
                            <span className="text-rose-500 font-bold">*</span>
                          </span>
                        }
                        labelPlacement="outside-top"
                        value={formData.fullName}
                        onValueChange={(val) => {
                          setFormData((prev) => ({ ...prev, fullName: val }));
                          if (!touched.fullName) setTouched((p) => ({ ...p, fullName: true }));
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                        isInvalid={touched.fullName && !formData.fullName.trim()}
                        placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                        startContent={<UserIcon className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                        variant="bordered"
                        radius="lg"
                        isRequired
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: touched.fullName && !formData.fullName.trim()
                            ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                            : inputWrapperClass,
                          innerWrapper: 'gap-3',
                          input: 'text-sm font-bold text-brand-text',
                        }}
                      />
                      {touched.fullName && !formData.fullName.trim() && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                          {isPersian ? 'این فیلد ضروری است (نام و نام خانوادگی).' : 'Full name is required.'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        dir="auto"
                        label={
                          <span className="flex items-center gap-1">
                            <span>{isPersian ? 'نام کاربری یکتا' : 'Username'}</span>
                            <span className="text-rose-500 font-bold">*</span>
                          </span>
                        }
                        labelPlacement="outside-top"
                        value={formData.username}
                        onValueChange={(val) => {
                          setFormData((prev) => ({ ...prev, username: val }));
                          if (!touched.username) setTouched((p) => ({ ...p, username: true }));
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, username: true }))}
                        isInvalid={touched.username && !formData.username.trim()}
                        placeholder={isPersian ? 'مثال: alireza_m' : 'e.g. john_doe'}
                        startContent={<Hash className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                        variant="bordered"
                        radius="lg"
                        isRequired
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: touched.username && !formData.username.trim()
                            ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                            : inputWrapperClass,
                          innerWrapper: 'gap-3',
                          input: 'text-sm font-mono font-bold text-brand-text text-start',
                        }}
                      />
                      {touched.username && !formData.username.trim() && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                          {isPersian ? 'این فیلد ضروری است (نام کاربری).' : 'Username is required.'}
                        </p>
                      )}
                    </div>

                    <Input
                      label={
                        <span className="flex items-center gap-1">
                          <span>{isPersian ? 'آدرس ایمیل (اختیاری)' : 'Email Address (Optional)'}</span>
                        </span>
                      }
                      labelPlacement="outside-top"
                      type="email"
                      value={formData.email}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, email: val }))}
                      placeholder="user@example.com"
                      startContent={<Mail className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: inputLabelClass,
                        inputWrapper: inputWrapperClass,
                        innerWrapper: 'gap-3',
                        input: 'text-sm font-mono font-semibold text-brand-text text-start',
                      }}
                    />

                    <Input
                      label={isPersian ? 'شماره موبایل' : 'Mobile Phone'}
                      labelPlacement="outside-top"
                      type="tel"
                      maxLength={11}
                      value={formData.phone}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, phone: toEnglishDigits(val).replace(/\D/g, '').slice(0, 11) }))}
                      placeholder="09123456789"
                      startContent={<Phone className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: inputLabelClass,
                        inputWrapper: inputWrapperClass,
                        innerWrapper: 'gap-3',
                        input: 'text-sm font-mono font-semibold text-brand-text text-start',
                      }}
                    />
                  </div>

                  {/* Password Field with Generator and Visibility Toggle */}
                  <div className="p-4 rounded-2xl bg-brand-surface-elevated/60 border border-brand-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-brand-gold shrink-0" />
                        <div>
                          <span className="text-xs font-black text-brand-text flex items-center gap-1">
                            <span>{isPersian ? 'کلمه عبور ورود' : 'Account Password'}</span>
                            <span className="text-rose-500 font-bold">*</span>
                          </span>
                          <p className="text-[11px] text-brand-text-muted mt-0.5">
                            {isPersian
                              ? 'حداقل ۶ کاراکتر شامل حروف و اعداد، یا استفاده از دکمه تولید رمز امن'
                              : 'At least 6 characters, or click generate for a secure random password'}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="flat"
                        onPress={generateRandomPassword}
                        startContent={<Sparkles className="w-3.5 h-3.5 text-brand-gold" />}
                        className="text-xs font-bold h-8 rounded-xl bg-brand-surface text-brand-text border border-brand-border cursor-pointer hover:border-brand-gold active:scale-95 transition-all"
                      >
                        {isPersian ? 'تولید رمز تصادفی امن' : 'Generate Strong Password'}
                      </Button>
                    </div>

                    <div>
                      <Input
                        aria-label={isPersian ? 'کلمه عبور' : 'Password'}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onValueChange={(val) => {
                          setFormData((prev) => ({ ...prev, password: val }));
                          if (!touched.password) setTouched((p) => ({ ...p, password: true }));
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                        isInvalid={touched.password && !formData.password}
                        placeholder={
                          isPersian
                            ? 'کلمه عبور را وارد کنید (حداقل ۶ کاراکتر)...'
                            : 'Enter password (min 6 characters)...'
                        }
                        startContent={<Lock className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                        endContent={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-brand-text-muted hover:text-brand-text cursor-pointer p-1 ms-2 transition-colors"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                        variant="bordered"
                        radius="lg"
                        isRequired
                        classNames={{
                          inputWrapper: touched.password && !formData.password
                            ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                            : inputWrapperClass,
                          innerWrapper: 'gap-3',
                          input: 'text-sm font-mono font-semibold text-brand-text text-start',
                        }}
                      />
                      {touched.password && !formData.password && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                          {isPersian ? 'این فیلد ضروری است (کلمه عبور).' : 'Password is required.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role Selector & VIP Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Role Dropdown */}
                    <div>
                      <label className={inputLabelClass}>
                        {isPersian ? 'نقش کاربری و سطح دسترسی' : 'User Role & Permissions'}
                      </label>
                      <div className="relative" ref={roleDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                          className="w-full h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {formData.role === 'admin' ? (
                              <ShieldAlert className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0" />
                            ) : formData.role === 'editor' ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-brand-text truncate">
                              {formData.role === 'admin'
                                ? (isPersian ? 'مدیر ارشد (Super Admin)' : 'Super Admin')
                                : formData.role === 'editor'
                                ? (isPersian ? 'ویراستار محتوا' : 'Content Editor')
                                : (isPersian ? 'کاربر عادی (مشتری)' : 'Standard User')}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 transition-transform duration-200 ${
                              isRoleDropdownOpen ? 'rotate-180 text-brand-gold' : 'opacity-70'
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isRoleDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute top-full mt-2 right-0 w-full z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-1.5 space-y-1 overscroll-contain origin-top"
                            >
                              {[
                                {
                                  key: 'user' as UserRole,
                                  title: isPersian ? 'کاربر عادی (مشتری فروشگاه)' : 'Standard User (Customer)',
                                  icon: UserIcon,
                                  iconColor: 'text-neutral-400',
                                },
                                {
                                  key: 'editor' as UserRole,
                                  title: isPersian ? 'ویراستار محتوا (دسترسی به محصولات و سفارشات)' : 'Content Editor (Products & Orders)',
                                  icon: ShieldCheck,
                                  iconColor: 'text-emerald-500',
                                },
                                {
                                  key: 'admin' as UserRole,
                                  title: isPersian ? 'مدیر ارشد (Super Admin - دسترسی کامل)' : 'Super Admin (Full Access)',
                                  icon: ShieldAlert,
                                  iconColor: 'text-brand-bronze dark:text-brand-gold',
                                },
                              ].map((item) => {
                                const isSelected = formData.role === item.key;
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, role: item.key }));
                                      setIsRoleDropdownOpen(false);
                                    }}
                                    className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-brand-gold text-[#141914]'
                                        : 'text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <Icon
                                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#141914]' : item.iconColor}`}
                                      />
                                      <span className="truncate">{item.title}</span>
                                    </div>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#141914] shrink-0" />}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* VIP Membership Switch */}
                    <div>
                      <label className={inputLabelClass}>
                        {isPersian ? 'عضویت در باشگاه مشتریان VIP' : 'VIP Club Membership'}
                      </label>
                      <div className="h-12 px-4 bg-brand-surface border border-brand-border rounded-2xl shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className={`w-4 h-4 ${formData.isVip ? 'text-amber-500' : 'text-neutral-400'}`} />
                          <span className="text-xs font-bold text-brand-text">
                            {formData.isVip
                              ? (isPersian ? 'عضو VIP فعال' : 'Active VIP Member')
                              : (isPersian ? 'عضو عادی' : 'Standard Member')}
                          </span>
                        </div>
                        <SmoothSwitch
                          isSelected={formData.isVip}
                          onValueChange={(val) => {
                            if (!val) {
                              setFormData((prev) => ({ ...prev, isVip: false, vipExpiresAt: null }));
                            } else {
                              handleSetVipDuration(30);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* VIP Duration Presets (Shown if VIP is enabled) */}
                  <AnimatePresence>
                    {formData.isVip && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span>{isPersian ? 'تعیین مدت اعتبار اشتراک VIP:' : 'Set VIP Validity Period:'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { labelFa: '۱ ماهه (۳۰ روز)', labelEn: '1 Month', days: 30 },
                            { labelFa: '۳ ماهه (۹۰ روز)', labelEn: '3 Months', days: 90 },
                            { labelFa: '۶ ماهه (۱۸۰ روز)', labelEn: '6 Months', days: 180 },
                            { labelFa: '۱ ساله (۳۶۵ روز)', labelEn: '1 Year', days: 365 },
                            { labelFa: 'همیشگی / نامحدود', labelEn: 'Lifetime', days: null },
                          ].map((dur) => (
                            <button
                              key={dur.days ?? 'lifetime'}
                              type="button"
                              onClick={() => handleSetVipDuration(dur.days)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                (dur.days === null && formData.vipExpiresAt === null) ||
                                (dur.days !== null && formData.vipExpiresAt !== null)
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-brand-surface border-brand-border text-brand-text hover:border-amber-400'
                              }`}
                            >
                              {isPersian ? dur.labelFa : dur.labelEn}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Tab 2: Additional Details & Address */}
              {selectedTab === 'address' && (
                <div className="space-y-6 pt-2">
                  {/* Birth Date Picker & Avatar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={inputLabelClass}>
                        {isPersian ? 'تاریخ تولد' : 'Birth Date'}
                      </label>
                      <BirthDatePicker
                        value={formData.birthDate}
                        onChange={handleBirthDateChange}
                      />
                    </div>

                    <Input
                      dir="auto"
                      label={isPersian ? 'لینک تصویر پروفایل (URL)' : 'Avatar Image URL'}
                      labelPlacement="outside-top"
                      value={formData.avatar}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, avatar: val }))}
                      placeholder="https://example.com/avatar.jpg"
                      startContent={<UserIcon className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: inputLabelClass,
                        inputWrapper: inputWrapperClass,
                        innerWrapper: 'gap-3',
                        input: 'text-sm font-mono text-brand-text text-start',
                      }}
                    />
                  </div>

                  {/* Province and City Selector */}
                  <div>
                    <label className={inputLabelClass}>
                      {isPersian ? 'استان و شهر سکونت' : 'Province & City'}
                    </label>
                    <ProvinceCitySelect
                      province={formData.province}
                      city={formData.city}
                      onChangeProvince={(p) => setFormData((prev) => ({ ...prev, province: p, city: '' }))}
                      onChangeCity={(c) => setFormData((prev) => ({ ...prev, city: c }))}
                    />
                  </div>

                  {/* Address Details */}
                  <div className="space-y-4">
                    <Textarea
                      dir="auto"
                      label={isPersian ? 'آدرس پستی دقیق' : 'Exact Postal Address'}
                      labelPlacement="outside-top"
                      value={formData.address}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, address: val }))}
                      placeholder={isPersian ? 'خیابان، کوچه، پلاک، زنگ یا مشخصات تکمیلی...' : 'Street, alley, building details...'}
                      minRows={2}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: inputLabelClass,
                        inputWrapper: 'px-4 py-3 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors',
                        input: 'text-sm font-bold text-brand-text',
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        dir="auto"
                        label={isPersian ? 'کد پستی (۱۰ رقمی)' : 'Postal Code (10 digits)'}
                        labelPlacement="outside-top"
                        maxLength={10}
                        value={formData.postalCode}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, postalCode: toEnglishDigits(val).replace(/\D/g, '').slice(0, 10) }))}
                        placeholder="1234567890"
                        startContent={<Hash className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-2" />}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: inputWrapperClass,
                          input: 'text-sm font-mono font-semibold text-brand-text text-start',
                        }}
                      />

                      <Input
                        dir="auto"
                        label={isPersian ? 'پلاک' : 'Building Number'}
                        labelPlacement="outside-top"
                        value={formData.buildingNumber}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, buildingNumber: val }))}
                        placeholder={isPersian ? 'مثال: ۱۲' : 'e.g. 12'}
                        startContent={<Building className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-2" />}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: inputWrapperClass,
                          input: 'text-sm font-bold text-brand-text text-start',
                        }}
                      />

                      <Input
                        dir="auto"
                        label={isPersian ? 'واحد' : 'Unit'}
                        labelPlacement="outside-top"
                        value={formData.unit}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, unit: val }))}
                        placeholder={isPersian ? 'مثال: ۴' : 'e.g. 4'}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: inputWrapperClass,
                          input: 'text-sm font-bold text-brand-text text-start',
                        }}
                      />
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="p-4 rounded-2xl bg-brand-surface-elevated/40 border border-brand-border space-y-4">
                    <span className="text-xs font-black text-brand-text flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-brand-gold" />
                      <span>{isPersian ? 'اطلاعات گیرنده سفارش (در صورت تفاوت با صاحب حساب)' : 'Recipient Information'}</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        dir="auto"
                        label={isPersian ? 'نام گیرنده تحویل' : 'Recipient Name'}
                        labelPlacement="outside-top"
                        value={formData.recipientName}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, recipientName: val }))}
                        placeholder={isPersian ? 'نام و نام خانوادگی تحویل‌گیرنده' : 'Recipient Full Name'}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: inputWrapperClass,
                          input: 'text-sm font-bold text-brand-text',
                        }}
                      />

                      <Input
                        label={isPersian ? 'شماره تماس گیرنده' : 'Recipient Phone'}
                        labelPlacement="outside-top"
                        type="tel"
                        maxLength={11}
                        value={formData.recipientPhone}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, recipientPhone: toEnglishDigits(val).replace(/\D/g, '').slice(0, 11) }))}
                        placeholder="09123456789"
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          label: inputLabelClass,
                          inputWrapper: inputWrapperClass,
                          input: 'text-sm font-mono font-semibold text-brand-text text-start',
                        }}
                      />
                    </div>

                    <Input
                      dir="auto"
                      label={isPersian ? 'یادداشت یا توضیحات ویژه آدرس' : 'Address Notes'}
                      labelPlacement="outside-top"
                      value={formData.addressNotes}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, addressNotes: val }))}
                      placeholder={isPersian ? 'نکات مربوط به تحویل، زنگ، تحویل به نگهبانی و...' : 'Special instructions for delivery...'}
                      startContent={<FileText className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: inputLabelClass,
                        inputWrapper: inputWrapperClass,
                        innerWrapper: 'gap-3',
                        input: 'text-sm font-bold text-brand-text',
                      }}
                    />
                  </div>
                </div>
              )}
            </ModalBody>

            {/* Modal Footer */}
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                className="font-bold text-xs text-brand-text-muted hover:text-brand-text px-4 rounded-xl cursor-pointer"
              >
                {isPersian ? 'انصراف' : 'Cancel'}
              </Button>

              <div className="flex items-center gap-3">
                {selectedTab === 'identity' ? (
                  <Button
                    variant="flat"
                    onPress={() => setSelectedTab('address')}
                    className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border hover:border-brand-gold px-4 h-11 rounded-2xl cursor-pointer transition-all"
                  >
                    {isPersian ? 'مرحله بعد: آدرس و تکمیلی' : 'Next: Address'}
                  </Button>
                ) : (
                  <Button
                    variant="flat"
                    onPress={() => setSelectedTab('identity')}
                    className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border hover:border-brand-gold px-4 h-11 rounded-2xl cursor-pointer transition-all"
                  >
                    {isPersian ? 'مرحله قبل: مشخصات' : 'Previous: Identity'}
                  </Button>
                )}

                <Button
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs px-6 h-11 rounded-2xl cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPersian ? 'ایجاد حساب کاربری' : 'Create Account'}</span>
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
