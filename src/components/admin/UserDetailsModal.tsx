'use client';

import React, { useState, useEffect } from 'react';
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
  Avatar,
  Skeleton,
  Input,
  Textarea,
  Select,
  SelectItem,
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
  ShoppingBag,
  Copy,
  Check,
  Clock,
  Home,
  Package,
  FileText,
  Trash2,
  ExternalLink,
  ChevronLeft,
  Pencil,
  Eye,
  Lock,
  EyeOff,
  Sparkles,
  Save,
  X,
  AlertCircle,
  Building,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { IUser, IOrder, UserRole } from '@/common/interfaces';
import { adminApi } from '@/common/api/admin';
import { formatToman, toPersianDigits, toEnglishDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate, parseIsoDate, gregorianToJalali } from '@/common/utils/date';
import { IRAN_PROVINCES } from '@/common/constants/iranProvinces';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { motion, AnimatePresence } from 'framer-motion';

export interface UserDetailsModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  user: IUser | null;
  initialMode?: 'view' | 'edit';
  isPersian?: boolean;
  isAdmin?: boolean;
  onUserUpdated?: (updatedUser: IUser) => void;
  onToggleVip?: (userId: string, currentVip: boolean) => void | Promise<void>;
  onRoleChange?: (userId: string, newRole: string) => void | Promise<void>;
  onDeleteUser?: (userId: string, userName: string) => void;
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
  'bg-brand-surface-elevated/70 dark:bg-[#182118] border border-brand-border dark:border-[#2a362a] rounded-2xl h-11 hover:border-brand-gold/60 focus-within:!border-brand-gold shadow-2xs transition-all';
const inputLabelClass = 'text-xs font-bold text-brand-text mb-1 block';

const selectClassNames = {
  base: 'w-full',
  label: 'text-xs font-bold text-brand-text mb-1 block text-right',
  trigger:
    'h-11 !px-3 !pl-10 !pr-3 bg-brand-surface-elevated/70 dark:bg-[#182118] border border-brand-border dark:border-[#2a362a] hover:border-brand-gold/60 rounded-2xl shadow-2xs text-xs font-bold text-brand-text transition-colors data-[disabled=true]:opacity-50 relative flex items-center justify-between',
  innerWrapper: 'w-full flex items-center justify-start gap-2',
  value: 'text-xs font-bold text-brand-text !text-right w-full',
  selectorIcon: '!absolute !left-3 !right-auto top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted transition-transform duration-200 shrink-0 pointer-events-none',
  popoverContent:
    'bg-brand-surface dark:bg-[#182118] border border-brand-border dark:border-[#2a362a] text-brand-text rounded-2xl shadow-2xl z-[10005] p-1.5 max-h-64 overflow-y-auto',
};

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  user,
  initialMode = 'view',
  isPersian = true,
  isAdmin = true,
  onUserUpdated,
  onToggleVip,
  onRoleChange,
  onDeleteUser,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(initialMode === 'edit' && !!isAdmin);
  const [selectedTab, setSelectedTab] = useState<string>('profile');
  const [selectedEditTab, setSelectedEditTab] = useState<string>('identity');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit form state
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<IUser | null>(user);

  const [formData, setFormData] = useState({
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
  });

  // Sync state with incoming user
  useEffect(() => {
    if (user) {
      setCurrentUserData(user);
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'user',
        isVip: user.isVip ?? false,
        vipExpiresAt: user.vipExpiresAt || null,
        avatar: user.avatar || '',
        birthDate: user.birthDate || null,
        birthDateShamsi: user.birthDateShamsi || null,
        province: user.province || '',
        city: user.city || '',
        address: user.address || '',
        postalCode: user.postalCode || '',
        buildingNumber: user.buildingNumber || '',
        unit: user.unit || '',
        recipientName: user.recipientName || '',
        recipientPhone: user.recipientPhone || '',
        recipientEmail: user.recipientEmail || '',
        addressNotes: user.addressNotes || '',
      });
      setIsEditing(initialMode === 'edit' && !!isAdmin);
    }
  }, [user, initialMode, isAdmin, isOpen]);

  useEffect(() => {
    if (isOpen && currentUserData?._id) {
      fetchUserOrders(currentUserData._id);
    } else {
      setOrders([]);
      setSelectedTab('profile');
      setSelectedEditTab('identity');
      setShowPassword(false);
    }
  }, [isOpen, currentUserData?._id]);

  const fetchUserOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const res = await adminApi.getUserOrders(userId, { pageSize: 50 });
      setOrders(res?.items || []);
    } catch (err) {
      console.error('Failed to fetch user orders', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(isPersian ? 'در حافظه کپی شد' : 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!currentUserData) return null;

  const roleLabels: Record<string, { fa: string; en: string; color: string; icon: any }> = {
    admin: { fa: 'مدیر کل سیستم', en: 'Super Admin', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', icon: ShieldAlert },
    editor: { fa: 'ویراستار محتوا', en: 'Content Editor', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', icon: ShieldCheck },
    user: { fa: 'کاربر عادی', en: 'Standard User', color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20', icon: UserIcon },
  };

  const activeRole = roleLabels[currentUserData.role] || roleLabels.user;
  const RoleIcon = activeRole.icon;

  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      if (isPersian) {
        return new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      }
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.success(isPersian ? 'رمز عبور تصادفی امن تولید شد.' : 'Strong random password generated.');
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

  // Save All Changes
  const handleSaveAll = async () => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'ویرایش مشخصات کاربران تنها برای مدیر ارشد مجاز است.'
          : 'Editing user details is restricted to Super Admins.',
      );
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error(isPersian ? 'نام و نام خانوادگی الزامی است.' : 'Full name is required.');
      return;
    }

    if (!formData.username.trim()) {
      toast.error(isPersian ? 'نام کاربری الزامی است.' : 'Username is required.');
      return;
    }

    if (!formData.email.trim()) {
      toast.error(isPersian ? 'آدرس ایمیل الزامی است.' : 'Email is required.');
      return;
    }

    const cleanPhone = formData.phone ? toEnglishDigits(formData.phone).trim() : '';
    if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
      toast.error(
        isPersian
          ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
          : 'Phone number must be an 11-digit Iranian mobile number (09...).',
      );
      return;
    }

    const cleanPostal = formData.postalCode ? toEnglishDigits(formData.postalCode).trim() : '';
    if (cleanPostal && !/^\d{10}$/.test(cleanPostal)) {
      toast.error(
        isPersian
          ? 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.'
          : 'Postal code must be exactly 10 digits.',
      );
      return;
    }

    const cleanRecPhone = formData.recipientPhone ? toEnglishDigits(formData.recipientPhone).trim() : '';
    if (cleanRecPhone && !/^09\d{9}$/.test(cleanRecPhone)) {
      toast.error(
        isPersian
          ? 'شماره تماس تحویل‌گیرنده باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
          : 'Recipient phone must be an 11-digit mobile number.',
      );
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error(
        isPersian
          ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.'
          : 'Password must be at least 6 characters long.',
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        role: formData.role,
        isVip: formData.isVip,
        vipExpiresAt: formData.isVip ? formData.vipExpiresAt : null,
        avatar: formData.avatar.trim(),
        birthDate: formData.birthDate || null,
        birthDateShamsi: formData.birthDateShamsi || null,
        province: formData.province.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        postalCode: cleanPostal,
        buildingNumber: formData.buildingNumber.trim(),
        unit: formData.unit.trim(),
        recipientName: formData.recipientName.trim(),
        recipientPhone: cleanRecPhone,
        recipientEmail: formData.recipientEmail ? formData.recipientEmail.trim().toLowerCase() : '',
        addressNotes: formData.addressNotes.trim(),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const updatedUser = await adminApi.updateUser(currentUserData._id, payload);
      const resultingUser: IUser = updatedUser?.data || updatedUser;

      setCurrentUserData(resultingUser);
      setFormData((prev) => ({ ...prev, password: '' }));
      setIsEditing(false);

      if (onUserUpdated) {
        onUserUpdated(resultingUser);
      }

      toast.success(
        isPersian
          ? 'تمام اطلاعات کاربر با موفقیت بروزرسانی شد.'
          : 'All user information updated successfully.',
      );
    } catch (err: any) {
      console.error('Failed to update user', err);
      const errMsg =
        err?.response?.data?.message ||
        (isPersian ? 'خطا در بروزرسانی اطلاعات کاربر.' : 'Failed to update user details.');
      toast.error(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProvinceObj = IRAN_PROVINCES.find((p) => p.name === formData.province);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      size="3xl"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        backdrop: 'bg-black/60 backdrop-blur-sm z-[9998]',
        wrapper: 'fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto',
        // Stable, fixed-height container so switching tabs or modes NEVER causes jumping or resizing
        base: 'm-auto max-w-3xl w-full h-[680px] max-h-[90vh] bg-brand-surface dark:bg-[#141914] border border-brand-border dark:border-[#2a352a] text-brand-text rounded-3xl shadow-2xl overflow-hidden p-0 flex flex-col',
        header: 'p-0 border-b border-brand-border/60 dark:border-[#2a352a] shrink-0',
        body: 'flex-1 p-5 sm:p-6 overflow-y-auto',
        footer:
          'p-4 sm:px-6 border-t border-brand-border/60 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#101410] flex items-center justify-between gap-3 shrink-0',
        closeButton: 'top-4 end-4 text-brand-text-muted hover:bg-brand-surface-elevated rounded-xl z-20',
      }}
    >
      <ModalContent>
        {() => (
          <div className="flex flex-col h-full w-full" dir={isPersian ? 'rtl' : 'ltr'}>
            {/* Header Hero Banner */}
            <ModalHeader className="p-5 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                {/* User Identity & Avatar */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={isEditing ? formData.avatar || undefined : currentUserData.avatar || undefined}
                      name={
                        (isEditing ? formData.fullName : currentUserData.fullName) ||
                        currentUserData.username
                      }
                      classNames={{
                        base: 'w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-brand-gold/40 shadow-lg text-lg font-black bg-gradient-to-br from-[#242c24] to-[#121612] text-brand-gold',
                        name: 'font-black text-lg text-brand-gold',
                      }}
                    />
                    {(isEditing ? formData.isVip : currentUserData.isVip) && (
                      <div
                        title={isPersian ? 'کاربر طلایی VIP' : 'VIP Member'}
                        className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 border border-white/40 flex items-center justify-center shadow-md text-[#1a1f1a]"
                      >
                        <Crown className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-brand-text truncate">
                        {(isEditing ? formData.fullName : currentUserData.fullName) ||
                          (isPersian ? 'کاربر بدون نام' : 'Unnamed User')}
                      </h2>
                      <Chip
                        size="sm"
                        variant="flat"
                        startContent={<RoleIcon className="w-3.5 h-3.5 shrink-0" />}
                        className={`text-xs font-black h-6 border ${activeRole.color}`}
                      >
                        {isPersian ? activeRole.fa : activeRole.en}
                      </Chip>
                      {(isEditing ? formData.isVip : currentUserData.isVip) && (
                        <Chip
                          size="sm"
                          variant="solid"
                          startContent={<Crown className="w-3 h-3 text-[#141914] fill-current" />}
                          className="bg-brand-gold text-[#141914] text-[11px] font-black h-6 shadow-xs"
                        >
                          {isPersian ? 'VIP طلایی' : 'VIP Member'}
                        </Chip>
                      )}
                      {isEditing && (
                        <Chip
                          size="sm"
                          variant="solid"
                          className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-black h-6"
                        >
                          {isPersian ? 'حالت ویرایش مدیر کل' : 'Admin Edit Mode'}
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-brand-text-muted font-mono flex-wrap" dir="ltr">
                      <span className="font-bold text-brand-bronze dark:text-brand-gold">
                        @{isEditing ? formData.username : currentUserData.username}
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => copyToClipboard(currentUserData._id, 'id')}
                        className="group flex items-center gap-1 hover:text-brand-text transition-colors cursor-pointer"
                        title={isPersian ? 'کپی شناسه سیستمی کاربر' : 'Copy User ID'}
                      >
                        <span>ID: {currentUserData._id.slice(0, 8)}...</span>
                        {copiedKey === 'id' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Action Toggle Buttons (Admin Only) */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto pe-8 sm:pe-0">
                  {isAdmin ? (
                    <Button
                      size="sm"
                      radius="full"
                      variant={isEditing ? 'solid' : 'bordered'}
                      color={isEditing ? 'warning' : 'default'}
                      onPress={() => setIsEditing(!isEditing)}
                      startContent={
                        isEditing ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />
                      }
                      className={`font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all ${
                        isEditing
                          ? 'bg-amber-500 text-[#141914]'
                          : 'border-brand-gold/60 text-brand-bronze dark:text-brand-gold hover:bg-brand-gold/10'
                      }`}
                    >
                      {isEditing
                        ? isPersian
                          ? 'انصراف از ویرایش'
                          : 'Exit Edit Mode'
                        : isPersian
                        ? 'ویرایش تمامی اطلاعات'
                        : 'Edit All Details'}
                    </Button>
                  ) : (
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-brand-surface-elevated text-brand-text-muted border border-brand-border text-[11px]"
                    >
                      {isPersian ? 'فقط مشاهده' : 'View Only'}
                    </Chip>
                  )}
                </div>
              </div>
            </ModalHeader>

            {/* View Mode Tabs vs Edit Mode Tabs */}
            {!isEditing ? (
              /* ======================= VIEW MODE NAVIGATION TABS ======================= */
              <div className="px-5 sm:px-6 pt-3 border-b border-brand-border/40 bg-brand-surface-elevated/20 shrink-0">
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={(k) => setSelectedTab(k as string)}
                  variant="underlined"
                  classNames={{
                    tabList: 'gap-6 p-0 border-b-0',
                    cursor: 'w-full bg-brand-gold h-0.5 rounded-full',
                    tab: 'max-w-fit px-1 h-10 text-xs font-bold text-brand-text-muted data-[selected=true]:text-brand-text data-[selected=true]:font-black',
                  }}
                >
                  <Tab
                    key="profile"
                    title={
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'مشخصات و حساب' : 'Profile & Account'}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="address"
                    title={
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'نشانی و تحویل' : 'Shipping Address'}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="orders"
                    title={
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'تاریخچه سفارشات' : 'Order History'}</span>
                        <Chip size="sm" variant="flat" className="h-4 text-[10px] px-1 font-bold">
                          {toPersianDigits(orders.length)}
                        </Chip>
                      </div>
                    }
                  />
                </Tabs>
              </div>
            ) : (
              /* ======================= EDIT MODE NAVIGATION TABS ======================= */
              <div className="px-5 sm:px-6 pt-3 border-b border-brand-border/40 bg-amber-500/5 shrink-0">
                <Tabs
                  selectedKey={selectedEditTab}
                  onSelectionChange={(k) => setSelectedEditTab(k as string)}
                  variant="underlined"
                  classNames={{
                    tabList: 'gap-6 p-0 border-b-0',
                    cursor: 'w-full bg-amber-500 h-0.5 rounded-full',
                    tab: 'max-w-fit px-1 h-10 text-xs font-bold text-brand-text-muted data-[selected=true]:text-amber-500 data-[selected=true]:font-black',
                  }}
                >
                  <Tab
                    key="identity"
                    title={
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'مشخصات هویتی و رمز' : 'Identity & Password'}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="vip"
                    title={
                      <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'عضویت طلایی VIP' : 'VIP Subscription'}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="shipping"
                    title={
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'آدرس و نشانی تحویل' : 'Shipping Address'}</span>
                      </div>
                    }
                  />
                  <Tab
                    key="recipient"
                    title={
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'مشخصات گیرنده و نکات' : 'Recipient & Notes'}</span>
                      </div>
                    }
                  />
                </Tabs>
              </div>
            )}

            {/* Modal Body with smooth opacity transition and zero container jumping */}
            <ModalBody className="p-5 sm:p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ========================================================================= */}
                {/* ============================= EDIT MODE ================================= */}
                {/* ========================================================================= */}
                {isEditing ? (
                  <motion.div
                    key={`edit-${selectedEditTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    {/* Notice Banner */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {isPersian
                          ? 'شما به عنوان مدیر ارشد سیستم مجاز به تغییر تمامی مشخصات این کاربر (شامل اطلاعات هویتی، رمز عبور مستقیم بدون نیاز به رمز قبلی، نقش دسترسی، عضویت VIP و آدرس‌ها) هستید.'
                          : 'As a Super Admin, you are authorized to modify every single piece of information for this user, including direct password resets, role, VIP status, and delivery addresses.'}
                      </p>
                    </div>

                    {/* EDIT TAB 1: IDENTITY & PASSWORD */}
                    {selectedEditTab === 'identity' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                            labelPlacement="outside-top"
                            isRequired
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-bold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'نام کاربری (یکتا)' : 'Username (Unique)'}
                            labelPlacement="outside-top"
                            isRequired
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({ ...formData, username: e.target.value.toLowerCase() })
                            }
                            startContent={<span className="text-brand-text-muted text-xs font-mono">@</span>}
                            placeholder="username"
                            dir="ltr"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-bold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'آدرس ایمیل' : 'Email Address'}
                            labelPlacement="outside-top"
                            isRequired
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value.toLowerCase() })
                            }
                            startContent={<Mail className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            placeholder="user@domain.com"
                            dir="ltr"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-semibold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'شماره تلفن همراه' : 'Mobile Phone'}
                            labelPlacement="outside-top"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            startContent={<Phone className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            placeholder="09123456789"
                            dir="ltr"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-semibold text-brand-text',
                            }}
                          />
                        </div>

                        {/* HeroUI Select for User Role */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Select
                            label={isPersian ? 'نقش کاربری در سامانه' : 'System Role'}
                            labelPlacement="outside-top"
                            selectedKeys={new Set([formData.role])}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as UserRole;
                              if (selected) {
                                setFormData((prev) => ({ ...prev, role: selected }));
                              }
                            }}
                            variant="bordered"
                            dir={isPersian ? 'rtl' : 'ltr'}
                            classNames={selectClassNames}
                            renderValue={(items) => (
                              <div className="flex items-center gap-1.5 overflow-hidden w-full justify-start" dir="rtl">
                                {items.map((item) => (
                                  <Chip
                                    key={item.key}
                                    size="sm"
                                    variant="flat"
                                    className="rounded-full bg-brand-gold/15 dark:bg-brand-gold/25 text-brand-text font-black text-xs h-7 px-3 border border-brand-gold/40 flex items-center shrink-0"
                                  >
                                    {item.textValue}
                                  </Chip>
                                ))}
                              </div>
                            )}
                            popoverProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'z-[10005]',
                              motionProps: {
                                initial: { opacity: 0, scale: 0.97, y: -8 },
                                animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
                                exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
                              },
                            }}
                            listboxProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'p-1',
                            }}
                          >
                            <SelectItem
                              key="user"
                              textValue={isPersian ? 'کاربر عادی' : 'Standard User'}
                              startContent={<UserIcon className="w-4 h-4 text-neutral-400" />}
                              className="text-xs font-bold text-right rounded-xl my-0.5 text-brand-text"
                            >
                              {isPersian ? 'کاربر عادی (مشتری فروشگاه)' : 'Standard User (Customer)'}
                            </SelectItem>
                            <SelectItem
                              key="editor"
                              textValue={isPersian ? 'ویراستار محتوا' : 'Content Editor'}
                              startContent={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
                              className="text-xs font-bold text-right rounded-xl my-0.5 text-brand-text"
                            >
                              {isPersian
                                ? 'ویراستار محتوا (دسترسی به محصولات و سفارشات)'
                                : 'Content Editor (Products & Orders)'}
                            </SelectItem>
                            <SelectItem
                              key="admin"
                              textValue={isPersian ? 'مدیر ارشد (Super Admin)' : 'Super Admin'}
                              startContent={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                              className="text-xs font-bold text-right rounded-xl my-0.5 text-brand-text"
                            >
                              {isPersian
                                ? 'مدیر ارشد (دسترسی کامل به تمامی بخش‌های سیستم)'
                                : 'Super Admin (Full Access)'}
                            </SelectItem>
                          </Select>

                          <Input
                            label={isPersian ? 'لینک تصویر آواتار (URL)' : 'Avatar Image URL'}
                            labelPlacement="outside-top"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                            dir="ltr"
                            startContent={<UserIcon className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono text-brand-text',
                            }}
                          />
                        </div>

                        {/* Password Reset Direct */}
                        <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-brand-gold shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-brand-text">
                                  {isPersian ? 'تنظیم / ریست رمز عبور کاربر' : 'Set / Reset User Password'}
                                </span>
                                <p className="text-[11px] text-brand-text-muted mt-0.5">
                                  {isPersian
                                    ? 'مدیر کل نیازی به وارد کردن کلمه عبور فعلی ندارد. در صورت عدم نیاز فیلد را خالی بگذارید.'
                                    : 'Super Admin does not require current password. Leave blank if unchanged.'}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="flat"
                              onPress={generateRandomPassword}
                              startContent={<Sparkles className="w-3.5 h-3.5 text-brand-gold" />}
                              className="text-xs font-bold h-8 rounded-xl bg-brand-surface-elevated text-brand-text border border-brand-border cursor-pointer hover:border-brand-gold"
                            >
                              {isPersian ? 'تولید رمز تصادفی امن' : 'Generate Strong Password'}
                            </Button>
                          </div>

                          <Input
                            labelPlacement="outside-top"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={
                              isPersian
                                ? 'کلمه عبور جدید را وارد کنید (حداقل ۶ کاراکتر)...'
                                : 'Enter new password (min 6 characters)...'
                            }
                            dir="ltr"
                            endContent={
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-brand-text-muted hover:text-brand-text cursor-pointer p-1"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            }
                            classNames={{
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-semibold text-brand-text',
                            }}
                          />
                        </div>

                        {/* Birth Date Picker — min-h prevents modal from jumping when dropdowns open */}
                        <div className="relative">
                          <BirthDatePicker
                            value={formData.birthDate}
                            onChange={handleBirthDateChange}
                            label={
                              isPersian
                                ? 'تاریخ تولد کاربر (شمسی و میلادی)'
                                : 'Date of Birth (Solar & Gregorian)'
                            }
                          />
                          {/* Invisible spacer that reserves height for the tallest open dropdown (max-h-64 = 16rem) */}
                          <div aria-hidden="true" className="h-0 sm:h-0" />
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 2: VIP STATUS */}
                    {selectedEditTab === 'vip' && (
                      <div className="space-y-5">
                        <div className="p-5 rounded-3xl border border-brand-gold/30 bg-brand-gold/5 space-y-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                                <Crown className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-brand-text">
                                  {isPersian ? 'وضعیت عضویت ویژه VIP' : 'VIP Membership Status'}
                                </h3>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                  {isPersian
                                    ? 'کاربران VIP از ارسال رایگان و تخفیف‌های ویژه باشگاه مشتریان بهره‌مند می‌شوند'
                                    : 'VIP members enjoy free shipping and luxury customer club discounts'}
                                </p>
                              </div>
                            </div>

                            <SmoothSwitch
                              isSelected={formData.isVip}
                              onValueChange={(val) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  isVip: val,
                                  vipExpiresAt: val ? prev.vipExpiresAt : null,
                                }));
                              }}
                              ariaLabel="Toggle VIP"
                            />
                          </div>

                          {formData.isVip && (
                            <div className="pt-4 border-t border-brand-gold/20 space-y-3">
                              <span className="text-xs font-bold text-brand-text block">
                                {isPersian
                                  ? 'انتخاب مدت اعتبار و تاریخ انقضای اشتراک VIP:'
                                  : 'Select VIP Expiration / Duration:'}
                              </span>

                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { days: 30, labelFa: '۳۰ روزه', labelEn: '30 Days' },
                                  { days: 90, labelFa: '۹۰ روزه', labelEn: '90 Days' },
                                  { days: 180, labelFa: '۱۸۰ روزه', labelEn: '180 Days' },
                                  { days: 365, labelFa: '۱ ساله', labelEn: '1 Year' },
                                  { days: null, labelFa: 'دائمی و نامحدود', labelEn: 'Lifetime' },
                                ].map((preset) => (
                                  <Button
                                    key={preset.labelEn}
                                    size="sm"
                                    variant="flat"
                                    onPress={() => handleSetVipDuration(preset.days)}
                                    className="text-xs font-bold bg-brand-surface-elevated text-brand-text border border-brand-gold/30 hover:bg-brand-gold/15 rounded-xl h-8 cursor-pointer"
                                  >
                                    {isPersian ? preset.labelFa : preset.labelEn}
                                  </Button>
                                ))}
                              </div>

                              <div className="mt-3 p-3.5 rounded-2xl bg-brand-surface-elevated/70 border border-brand-border text-xs flex items-center justify-between">
                                <span className="text-brand-text-muted">
                                  {isPersian ? 'تاریخ انقضای فعلی اشتراک:' : 'Current Expiry Date:'}
                                </span>
                                <span className="font-bold text-brand-gold font-mono">
                                  {formData.vipExpiresAt
                                    ? formatDateTime(formData.vipExpiresAt)
                                    : isPersian
                                    ? 'نامحدود (دائمی)'
                                    : 'Lifetime'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 3: SHIPPING ADDRESS */}
                    {selectedEditTab === 'shipping' && (
                      <div className="space-y-5">
                        {/* Province & City with official HeroUI Select */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Select
                            label={isPersian ? 'استان' : 'Province'}
                            labelPlacement="outside-top"
                            placeholder={isPersian ? 'انتخاب استان...' : 'Select Province...'}
                            selectedKeys={formData.province ? new Set([formData.province]) : new Set([])}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              setFormData((prev) => ({
                                ...prev,
                                province: selected || '',
                                city: '',
                              }));
                            }}
                            variant="bordered"
                            dir={isPersian ? 'rtl' : 'ltr'}
                            classNames={selectClassNames}
                            renderValue={(items) => (
                              <div className="flex items-center gap-1.5 overflow-hidden w-full justify-start" dir="rtl">
                                {items.map((item) => (
                                  <Chip
                                    key={item.key}
                                    size="sm"
                                    variant="flat"
                                    className="rounded-full bg-brand-gold/15 dark:bg-brand-gold/25 text-brand-text font-black text-xs h-7 px-3 border border-brand-gold/40 flex items-center shrink-0"
                                  >
                                    {item.textValue}
                                  </Chip>
                                ))}
                              </div>
                            )}
                            popoverProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'z-[10005]',
                              motionProps: {
                                initial: { opacity: 0, scale: 0.97, y: -8 },
                                animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
                                exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
                              },
                            }}
                            listboxProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'p-1',
                            }}
                          >
                            {IRAN_PROVINCES.map((prov) => (
                              <SelectItem
                                key={prov.name}
                                textValue={prov.name}
                                className="text-xs font-bold text-right rounded-xl my-0.5 text-brand-text"
                              >
                                {prov.name}
                              </SelectItem>
                            ))}
                          </Select>

                          <Select
                            label={isPersian ? 'شهر' : 'City'}
                            labelPlacement="outside-top"
                            placeholder={
                              formData.province
                                ? isPersian
                                  ? 'انتخاب شهر...'
                                  : 'Select City...'
                                : isPersian
                                ? 'ابتدا استان را انتخاب کنید'
                                : 'Select province first'
                            }
                            isDisabled={!formData.province || !selectedProvinceObj?.cities.length}
                            selectedKeys={formData.city ? new Set([formData.city]) : new Set([])}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              setFormData((prev) => ({
                                ...prev,
                                city: selected || '',
                              }));
                            }}
                            variant="bordered"
                            dir={isPersian ? 'rtl' : 'ltr'}
                            classNames={selectClassNames}
                            renderValue={(items) => (
                              <div className="flex items-center gap-1.5 overflow-hidden w-full justify-start" dir="rtl">
                                {items.map((item) => (
                                  <Chip
                                    key={item.key}
                                    size="sm"
                                    variant="flat"
                                    className="rounded-full bg-brand-gold/15 dark:bg-brand-gold/25 text-brand-text font-black text-xs h-7 px-3 border border-brand-gold/40 flex items-center shrink-0"
                                  >
                                    {item.textValue}
                                  </Chip>
                                ))}
                              </div>
                            )}
                            popoverProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'z-[10005]',
                              motionProps: {
                                initial: { opacity: 0, scale: 0.97, y: -8 },
                                animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
                                exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
                              },
                            }}
                            listboxProps={{
                              dir: isPersian ? 'rtl' : 'ltr',
                              className: 'p-1',
                            }}
                          >
                            {(selectedProvinceObj?.cities || []).map((cityName) => (
                              <SelectItem
                                key={cityName}
                                textValue={cityName}
                                className="text-xs font-bold text-right rounded-xl my-0.5 text-brand-text"
                              >
                                {cityName}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        {/* Full Address */}
                        <Textarea
                          dir={isPersian ? 'rtl' : 'ltr'}
                          label={isPersian ? 'نشانی دقیق پستی (خیابان، کوچه، بن‌بست)' : 'Street Address'}
                          labelPlacement="outside-top"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          minRows={3}
                          placeholder={
                            isPersian
                              ? 'مثال: بلوار کشاورز، خیابان ۱۶ آذر، کوچه بهار، ساختمان شماره ۵'
                              : 'Street address details...'
                          }
                          classNames={{
                            label: inputLabelClass,
                            inputWrapper:
                              'bg-brand-surface-elevated/70 dark:bg-[#182118] border border-brand-border dark:border-[#2a362a] rounded-2xl hover:border-brand-gold/60 focus-within:!border-brand-gold p-3 shadow-2xs',
                            input: 'text-xs font-medium text-brand-text leading-relaxed text-right',
                          }}
                        />

                        {/* Postal Code, Building, Unit */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label={isPersian ? 'کد پستی ۱۰ رقمی' : 'Postal Code'}
                            labelPlacement="outside-top"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            placeholder="1234567890"
                            dir="ltr"
                            startContent={<Hash className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-bold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'پلاک' : 'Building / No'}
                            labelPlacement="outside-top"
                            value={formData.buildingNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, buildingNumber: e.target.value })
                            }
                            placeholder={isPersian ? 'مثال: ۲۴' : 'e.g. 24'}
                            startContent={<Building className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-bold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'واحد' : 'Unit'}
                            labelPlacement="outside-top"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            placeholder={isPersian ? 'مثال: ۳' : 'e.g. 3'}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-bold text-brand-text',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 4: RECIPIENT & NOTES */}
                    {selectedEditTab === 'recipient' && (
                      <div className="space-y-5">
                        <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/50 dark:bg-[#182018] border border-brand-border/60 text-xs text-brand-text-muted flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-brand-gold shrink-0" />
                          <span>
                            {isPersian
                              ? 'در صورتی که سفارش توسط شخص دیگری تحویل گرفته می‌شود، اطلاعات تماس و یادداشت‌های ارسال را اینجا وارد کنید.'
                              : 'If the order is received by another person, enter contact details and delivery notes here.'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label={isPersian ? 'نام و نام خانوادگی تحویل‌گیرنده' : 'Recipient Full Name'}
                            labelPlacement="outside-top"
                            value={formData.recipientName}
                            onChange={(e) =>
                              setFormData({ ...formData, recipientName: e.target.value })
                            }
                            placeholder={isPersian ? 'نام شخص دریافت‌کننده' : 'Recipient Name'}
                            startContent={<UserIcon className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-bold text-brand-text',
                            }}
                          />

                          <Input
                            label={isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone Number'}
                            labelPlacement="outside-top"
                            value={formData.recipientPhone}
                            onChange={(e) =>
                              setFormData({ ...formData, recipientPhone: e.target.value })
                            }
                            placeholder="09123456789"
                            dir="ltr"
                            startContent={<Phone className="w-4 h-4 text-brand-text-muted shrink-0" />}
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              input: 'text-xs font-mono font-bold text-brand-text',
                            }}
                          />
                        </div>

                        <Input
                          label={isPersian ? 'ایمیل تحویل‌گیرنده (اختیاری)' : 'Recipient Email (Optional)'}
                          labelPlacement="outside-top"
                          type="email"
                          value={formData.recipientEmail}
                          onChange={(e) =>
                            setFormData({ ...formData, recipientEmail: e.target.value })
                          }
                          placeholder="recipient@domain.com"
                          dir="ltr"
                          startContent={<Mail className="w-4 h-4 text-brand-text-muted shrink-0" />}
                          classNames={{
                            label: inputLabelClass,
                            inputWrapper: inputWrapperClass,
                            input: 'text-xs font-mono font-semibold text-brand-text',
                          }}
                        />

                        <Textarea
                          dir={isPersian ? 'rtl' : 'ltr'}
                          label={isPersian ? 'توضیحات و یادداشت تحویل' : 'Delivery / Address Notes'}
                          labelPlacement="outside-top"
                          value={formData.addressNotes}
                          onChange={(e) =>
                            setFormData({ ...formData, addressNotes: e.target.value })
                          }
                          minRows={3}
                          placeholder={
                            isPersian
                              ? 'مثال: زنگ دوم سمت راست، لطفاً قبل از مراجعه تماس گرفته شود.'
                              : 'Special instructions for courier...'
                          }
                          classNames={{
                            label: inputLabelClass,
                            inputWrapper:
                              'bg-brand-surface-elevated/70 dark:bg-[#182118] border border-brand-border dark:border-[#2a362a] rounded-2xl hover:border-brand-gold/60 focus-within:!border-brand-gold p-3 shadow-2xs',
                            input: 'text-xs font-medium text-brand-text leading-relaxed text-right',
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* ========================================================================= */
                  /* ============================= VIEW MODE ================================= */
                  /* ========================================================================= */
                  <motion.div
                    key={`view-${selectedTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-6"
                  >
                    {/* TAB 1: PROFILE & ACCOUNT VIEW */}
                    {selectedTab === 'profile' && (
                      <div className="space-y-6">
                        {/* Metrics Banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/60 dark:bg-[#182018] border border-brand-border/60">
                            <span className="text-[11px] text-brand-text-muted block">
                              {isPersian ? 'نقش کاربری' : 'Role'}
                            </span>
                            <span className="text-sm font-black text-brand-text mt-1 block">
                              {isPersian ? activeRole.fa : activeRole.en}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/60 dark:bg-[#182018] border border-brand-border/60">
                            <span className="text-[11px] text-brand-text-muted block">
                              {isPersian ? 'عضویت VIP' : 'VIP Membership'}
                            </span>
                            <span
                              className={`text-sm font-black mt-1 block ${
                                currentUserData.isVip ? 'text-amber-500' : 'text-brand-text-muted'
                              }`}
                            >
                              {currentUserData.isVip
                                ? isPersian
                                  ? 'فعال طلایی'
                                  : 'Active'
                                : isPersian
                                ? 'عادی'
                                : 'Regular'}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/60 dark:bg-[#182018] border border-brand-border/60">
                            <span className="text-[11px] text-brand-text-muted block">
                              {isPersian ? 'کل سفارشات' : 'Orders'}
                            </span>
                            <span className="text-sm font-black text-brand-text mt-1 block">
                              {loadingOrders ? (
                                <Skeleton className="h-4 w-10 rounded-md" />
                              ) : (
                                `${toPersianDigits(orders.length)} ${isPersian ? 'سفارش' : ''}`
                              )}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/60 dark:bg-[#182018] border border-brand-border/60">
                            <span className="text-[11px] text-brand-text-muted block">
                              {isPersian ? 'مجموع خریدها' : 'Total Spend'}
                            </span>
                            <span className="text-sm font-black text-brand-bronze dark:text-brand-gold mt-1 block truncate">
                              {loadingOrders ? (
                                <Skeleton className="h-4 w-16 rounded-md" />
                              ) : (
                                formatToman(totalSpent, isPersian)
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Contact & Personal Data Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Email Card */}
                          <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                                <Mail className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] text-brand-text-muted block">
                                  {isPersian ? 'آدرس ایمیل' : 'Email'}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-bold text-xs text-brand-text truncate block mt-0.5"
                                >
                                  {currentUserData.email || '—'}
                                </span>
                              </div>
                            </div>
                            {currentUserData.email && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(currentUserData.email, 'email')}
                                  className="p-1.5 rounded-lg hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
                                  title={isPersian ? 'کپی ایمیل' : 'Copy'}
                                >
                                  {copiedKey === 'email' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={`mailto:${currentUserData.email}`}
                                  className="p-1.5 rounded-lg hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text transition-colors"
                                  title={isPersian ? 'ارسال ایمیل' : 'Send Mail'}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Phone Card */}
                          <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] text-brand-text-muted block">
                                  {isPersian ? 'شماره تلفن همراه' : 'Phone'}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-bold text-xs text-brand-text font-mono block mt-0.5"
                                >
                                  {currentUserData.phone ? toPersianDigits(currentUserData.phone) : '—'}
                                </span>
                              </div>
                            </div>
                            {currentUserData.phone && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(currentUserData.phone || '', 'phone')}
                                  className="p-1.5 rounded-lg hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
                                  title={isPersian ? 'کپی تلفن' : 'Copy'}
                                >
                                  {copiedKey === 'phone' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={`tel:${currentUserData.phone}`}
                                  className="p-1.5 rounded-lg hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text transition-colors"
                                  title={isPersian ? 'تماس' : 'Call'}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Birth Date */}
                          <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] text-brand-text-muted block">
                                {isPersian ? 'تاریخ تولد' : 'Birth Date'}
                              </span>
                              <span className="font-bold text-xs text-brand-text block mt-0.5">
                                {formatDisplayBirthDate(
                                  currentUserData.birthDate,
                                  isPersian ? 'jalali' : 'gregorian',
                                  isPersian,
                                ) || currentUserData.birthDateShamsi || '—'}
                              </span>
                            </div>
                          </div>

                          {/* Registration Date */}
                          <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] text-brand-text-muted block">
                                {isPersian ? 'تاریخ و ساعت ثبت‌نام' : 'Joined Date'}
                              </span>
                              <span className="font-bold text-xs text-brand-text block mt-0.5">
                                {formatDateTime(currentUserData.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* VIP Subscription Details Banner */}
                        <div className="p-4 sm:p-5 rounded-3xl border border-brand-gold/30 bg-brand-gold/5 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <Crown className="w-5 h-5 text-brand-gold" />
                              <h3 className="text-sm font-black text-brand-text">
                                {isPersian ? 'وضعیت اشتراک ویژه طلایی (VIP)' : 'VIP Subscription Status'}
                              </h3>
                            </div>
                            {currentUserData.isVip ? (
                              <Chip size="sm" variant="solid" className="bg-brand-gold text-[#141914] font-black text-xs">
                                {isPersian ? 'اشتراک فعال' : 'Active VIP'}
                              </Chip>
                            ) : (
                              <Chip size="sm" variant="flat" className="bg-brand-surface-elevated text-brand-text-muted text-xs">
                                {isPersian ? 'غیرفعال' : 'Inactive'}
                              </Chip>
                            )}
                          </div>

                          {currentUserData.isVip ? (
                            <div className="text-xs text-brand-text-muted space-y-1 pt-1">
                              <p>
                                {isPersian ? 'انقضای اشتراک:' : 'Expires at:'}{' '}
                                <strong className="text-brand-text font-bold">
                                  {currentUserData.vipExpiresAt
                                    ? formatDateTime(currentUserData.vipExpiresAt)
                                    : isPersian
                                    ? 'نامحدود (دائمی)'
                                    : 'Lifetime Unlimited'}
                                </strong>
                              </p>
                              <p className="text-[11px] text-brand-gold/90 font-medium">
                                {isPersian
                                  ? 'مزایای فعال: تخفیف ۱۰٪ روی کلیه ادکلن‌ها، ارسال رایگان اختصاصی و پشتیبانی اولویت‌دار.'
                                  : 'Active perks: 10% storewide discount, free courier delivery, priority support.'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-brand-text-muted">
                              {isPersian
                                ? 'این کاربر در حال حاضر عضو باشگاه مشتریان ویژه نیست.'
                                : 'This user is currently a regular customer.'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SHIPPING ADDRESS VIEW */}
                    {selectedTab === 'address' && (
                      <div className="space-y-4">
                        {currentUserData.address || currentUserData.city || currentUserData.province ? (
                          <div className="space-y-4">
                            {/* Province & City Banner */}
                            <div className="p-4 rounded-2xl bg-brand-surface-elevated/40 border border-brand-border/60 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
                                <Home className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] text-brand-text-muted block">
                                  {isPersian ? 'استان و شهر' : 'Province & City'}
                                </span>
                                <span className="font-black text-sm text-brand-text block mt-0.5">
                                  {currentUserData.province || '—'} / {currentUserData.city || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Detailed Street Address */}
                            <div className="p-4 rounded-2xl bg-brand-surface-elevated/40 border border-brand-border/60 space-y-2">
                              <span className="text-[11px] text-brand-text-muted block">
                                {isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                              </span>
                              <p className="text-xs font-bold text-brand-text leading-relaxed">
                                {currentUserData.address || '—'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-brand-text-muted pt-2 border-t border-brand-border/40 flex-wrap">
                                <span>
                                  {isPersian ? 'پلاک:' : 'Building:'}{' '}
                                  <strong className="text-brand-text">
                                    {currentUserData.buildingNumber || '—'}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  {isPersian ? 'واحد:' : 'Unit:'}{' '}
                                  <strong className="text-brand-text">{currentUserData.unit || '—'}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Postal Code & Recipient Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 rounded-2xl bg-brand-surface-elevated/40 border border-brand-border/60 flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[11px] text-brand-text-muted block">
                                    {isPersian ? 'کد پستی ۱۰ رقمی' : 'Postal Code'}
                                  </span>
                                  <span className="font-black text-xs font-mono text-brand-text block mt-1">
                                    {currentUserData.postalCode
                                      ? toPersianDigits(currentUserData.postalCode)
                                      : '—'}
                                  </span>
                                </div>
                                {currentUserData.postalCode && (
                                  <button
                                    onClick={() =>
                                      copyToClipboard(currentUserData.postalCode || '', 'postal')
                                    }
                                    className="p-1.5 rounded-lg hover:bg-brand-surface-elevated text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
                                    title={isPersian ? 'کپی کد پستی' : 'Copy'}
                                  >
                                    {copiedKey === 'postal' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <div className="p-4 rounded-2xl bg-brand-surface-elevated/40 border border-brand-border/60">
                                <span className="text-[11px] text-brand-text-muted block">
                                  {isPersian ? 'نام و شماره تماس گیرنده' : 'Recipient Contact'}
                                </span>
                                <span className="font-bold text-xs text-brand-text block mt-1">
                                  {currentUserData.recipientName || '—'}{' '}
                                  {currentUserData.recipientPhone && (
                                    <span className="font-mono text-brand-gold">
                                      ({toPersianDigits(currentUserData.recipientPhone)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Delivery Notes if any */}
                            {currentUserData.addressNotes && (
                              <div className="p-4 rounded-2xl bg-brand-surface-elevated/20 border border-brand-border/40 text-xs">
                                <span className="text-[11px] text-brand-text-muted block mb-1">
                                  {isPersian ? 'توضیحات و نکات تحویل' : 'Delivery Notes'}
                                </span>
                                <p className="text-brand-text italic leading-relaxed">
                                  &ldquo;{currentUserData.addressNotes}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-16 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated mx-auto flex items-center justify-center text-brand-text-muted">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-brand-text">
                              {isPersian ? 'هیچ آدرسی ثبت نشده است' : 'No Address Registered'}
                            </h4>
                            <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
                              {isPersian
                                ? 'این کاربر هنوز نشانی پستی در پروفایل خود ثبت نکرده است. شما می‌توانید با زدن دکمه ویرایش برای این کاربر آدرس ثبت کنید.'
                                : 'This user has not registered a delivery address yet. You can click Edit to add one.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: ORDER HISTORY VIEW */}
                    {selectedTab === 'orders' && (
                      <div className="space-y-4">
                        {loadingOrders ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                            ))}
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="py-16 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated mx-auto flex items-center justify-center text-brand-text-muted">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-brand-text">
                              {isPersian ? 'هیچ سفارشی ثبت نشده است' : 'No Orders Found'}
                            </h4>
                            <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
                              {isPersian
                                ? 'این کاربر تا کنون خریدی در فروشگاه هاتف آروما ثبت نکرده است.'
                                : 'This customer has not placed any orders yet.'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {orders.map((order) => (
                              <div
                                key={order._id}
                                className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 hover:bg-brand-surface-elevated/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-xs text-brand-text">
                                      #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                                    </span>
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      className={`text-[10px] font-black h-5 ${
                                        order.status === 'delivered'
                                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                          : order.status === 'shipped'
                                          ? 'bg-sky-500/15 text-sky-600 border-sky-500/30'
                                          : order.status === 'cancelled'
                                          ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                                          : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                      }`}
                                    >
                                      {order.status}
                                    </Chip>
                                  </div>
                                  <div className="text-[11px] text-brand-text-muted flex items-center gap-3">
                                    <span>{formatDateTime(order.createdAt)}</span>
                                    <span>•</span>
                                    <span>
                                      {toPersianDigits(order.items?.length || 0)}{' '}
                                      {isPersian ? 'قلم کالا' : 'items'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-start sm:text-end shrink-0">
                                  <span className="text-[11px] text-brand-text-muted block">
                                    {isPersian ? 'مبلغ کل سفارش' : 'Total Amount'}
                                  </span>
                                  <span className="font-black text-sm text-brand-bronze dark:text-brand-gold">
                                    {formatToman(order.total, isPersian)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalBody>

            {/* Modal Footer with Actions */}
            <ModalFooter>
              {isEditing ? (
                /* Edit Mode Footer */
                <div className="flex items-center justify-between w-full">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setIsEditing(false)}
                    startContent={<X className="w-4 h-4" />}
                    className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border/60 rounded-xl h-9 cursor-pointer"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </Button>

                  <Button
                    size="sm"
                    color="warning"
                    variant="solid"
                    isLoading={isSaving}
                    onPress={handleSaveAll}
                    startContent={!isSaving && <Save className="w-4 h-4" />}
                    className="font-black text-xs bg-amber-500 text-[#141914] shadow-md rounded-xl h-9 px-4 cursor-pointer hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    {isPersian ? 'ذخیره تمامی تغییرات' : 'Save All Changes'}
                  </Button>
                </div>
              ) : (
                /* View Mode Footer */
                <>
                  <div className="flex items-center gap-2">
                    {isAdmin && onDeleteUser && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          if (onClose) onClose();
                          onDeleteUser(currentUserData._id, currentUserData.fullName);
                        }}
                        startContent={<Trash2 className="w-4 h-4" />}
                        className="font-bold text-xs cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"
                      >
                        {isPersian ? 'حذف حساب کاربر' : 'Delete Account'}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        size="sm"
                        color="warning"
                        variant="flat"
                        onPress={() => setIsEditing(true)}
                        startContent={<Pencil className="w-3.5 h-3.5" />}
                        className="font-black text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl h-9 cursor-pointer hover:bg-amber-500/25"
                      >
                        {isPersian ? 'ویرایش مشخصات' : 'Edit Details'}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="flat"
                      onPress={onClose}
                      className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border/60 rounded-xl h-9 cursor-pointer"
                    >
                      {isPersian ? 'بستن' : 'Close'}
                    </Button>
                  </div>
                </>
              )}
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
