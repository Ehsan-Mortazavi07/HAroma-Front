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
} from 'lucide-react';
import { IUser, IOrder } from '@/common/interfaces';
import { adminApi } from '@/common/api/admin';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate } from '@/common/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

export interface UserDetailsModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  user: IUser | null;
  isPersian?: boolean;
  isAdmin?: boolean;
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
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        y: {
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        opacity: {
          duration: 0.28,
          ease: 'easeOut' as const,
        },
      },
    },
    exit: {
      scale: 0.96,
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  },
};

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  user,
  isPersian = true,
  isAdmin = true,
  onToggleVip,
  onRoleChange,
  onDeleteUser,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('profile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserOrders(user._id);
    } else {
      setOrders([]);
      setSelectedTab('profile');
    }
  }, [isOpen, user?._id]);

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

  if (!user) return null;

  const roleLabels: Record<string, { fa: string; en: string; color: string; icon: any }> = {
    admin: { fa: 'مدیر کل سیستم', en: 'Super Admin', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', icon: ShieldAlert },
    editor: { fa: 'ویراستار محتوا', en: 'Content Editor', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', icon: ShieldCheck },
    user: { fa: 'کاربر عادی', en: 'Standard User', color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20', icon: UserIcon },
  };

  const currentRole = roleLabels[user.role] || roleLabels.user;
  const RoleIcon = currentRole.icon;

  // Calculate total spent by user
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
        base: 'm-auto max-w-3xl w-full bg-brand-surface dark:bg-[#141914] border border-brand-border dark:border-[#2a352a] text-brand-text rounded-3xl shadow-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col',
        header: 'p-0 border-b border-brand-border/60 dark:border-[#2a352a]',
        body: 'p-0 overflow-y-auto',
        footer: 'p-4 sm:px-6 border-t border-brand-border/60 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#101410] flex items-center justify-between gap-3',
        closeButton: 'top-4 end-4 text-brand-text-muted hover:bg-brand-surface-elevated rounded-xl',
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* Header Hero Banner */}
            <ModalHeader className="p-5 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                {/* User Identity & Avatar */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={user.avatar || undefined}
                      name={user.fullName || user.username}
                      classNames={{
                        base: 'w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-brand-gold/40 shadow-lg text-lg font-black bg-gradient-to-br from-[#242c24] to-[#121612] text-brand-gold',
                        name: 'font-black text-lg text-brand-gold',
                      }}
                    />
                    {user.isVip && (
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
                        {user.fullName || (isPersian ? 'کاربر بدون نام' : 'Unnamed User')}
                      </h2>
                      <Chip
                        size="sm"
                        variant="flat"
                        startContent={<RoleIcon className="w-3.5 h-3.5 shrink-0" />}
                        className={`text-xs font-black h-6 border ${currentRole.color}`}
                      >
                        {isPersian ? currentRole.fa : currentRole.en}
                      </Chip>
                      {user.isVip && (
                        <Chip
                          size="sm"
                          variant="solid"
                          startContent={<Crown className="w-3 h-3 text-[#141914] fill-current" />}
                          className="bg-brand-gold text-[#141914] text-[11px] font-black h-6 shadow-xs"
                        >
                          {isPersian ? 'VIP طلایی' : 'VIP Member'}
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-brand-text-muted font-mono flex-wrap">
                      <span className="font-bold text-brand-bronze dark:text-brand-gold">
                        @{user.username}
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => copyToClipboard(user._id, 'id')}
                        className="group flex items-center gap-1 hover:text-brand-text transition-colors cursor-pointer"
                        title={isPersian ? 'کپی شناسه سیستمی کاربر' : 'Copy User ID'}
                      >
                        <span>ID: {user._id.slice(0, 8)}...</span>
                        {copiedKey === 'id' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* VIP Quick Action Button in Header */}
                {isAdmin && onToggleVip && (
                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      radius="full"
                      variant={user.isVip ? 'solid' : 'bordered'}
                      onPress={() => onToggleVip(user._id, user.isVip)}
                      startContent={<Crown className="w-3.5 h-3.5" />}
                      className={`font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all ${
                        user.isVip
                          ? 'bg-brand-gold text-[#141914]'
                          : 'border-brand-border text-brand-text-muted hover:border-brand-gold hover:text-brand-text'
                      }`}
                    >
                      {user.isVip
                        ? isPersian ? 'لغو عضویت VIP' : 'Revoke VIP'
                        : isPersian ? 'ارتقا به VIP طلایی' : 'Upgrade to VIP'}
                    </Button>
                  </div>
                )}
              </div>
            </ModalHeader>

            {/* Navigation Tabs */}
            <div className="px-5 sm:px-6 pt-3 border-b border-brand-border/40 bg-brand-surface-elevated/20">
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(k) => setSelectedTab(k as string)}
                variant="underlined"
                classNames={{
                  tabList: 'gap-6 p-0 border-none',
                  cursor: 'w-full bg-brand-gold h-[2.5px] rounded-full',
                  tab: 'max-w-fit px-1 h-10 font-bold text-xs sm:text-sm',
                  tabContent: 'group-data-[selected=true]:text-brand-gold font-bold',
                }}
              >
                <Tab
                  key="profile"
                  title={
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{isPersian ? 'مشخصات فردی و حساب' : 'Profile & Account'}</span>
                    </div>
                  }
                />
                <Tab
                  key="address"
                  title={
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{isPersian ? 'نشانی و آدرس پستی' : 'Shipping Address'}</span>
                      {user.city && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      )}
                    </div>
                  }
                />
                <Tab
                  key="orders"
                  title={
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isPersian ? 'سوابق سفارشات' : 'Order History'}</span>
                      <Chip size="sm" variant="flat" className="h-5 text-[11px] px-1.5 bg-brand-surface-elevated">
                        {loadingOrders ? '...' : toPersianDigits(orders.length)}
                      </Chip>
                    </div>
                  }
                />
              </Tabs>
            </div>

            {/* Modal Body Contents */}
            <ModalBody className="p-5 sm:p-6 space-y-6">
              <AnimatePresence mode="wait">
                {selectedTab === 'profile' && (
                  <motion.div
                    key="tab-profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Key Metrics / Highlights Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/50 dark:bg-[#1a221a] border border-brand-border/60 dark:border-[#2a352a] space-y-1">
                        <div className="text-[11px] text-brand-text-muted flex items-center gap-1.5 font-medium">
                          <ShoppingBag className="w-3.5 h-3.5 text-brand-bronze" />
                          <span>{isPersian ? 'تعداد سفارشات' : 'Total Orders'}</span>
                        </div>
                        <div className="text-base font-black text-brand-text">
                          {loadingOrders ? '...' : toPersianDigits(orders.length)} {isPersian ? 'سفارش' : 'orders'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/50 dark:bg-[#1a221a] border border-brand-border/60 dark:border-[#2a352a] space-y-1">
                        <div className="text-[11px] text-brand-text-muted flex items-center gap-1.5 font-medium">
                          <Crown className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{isPersian ? 'وضعیت VIP' : 'VIP Status'}</span>
                        </div>
                        <div className="text-base font-black text-brand-gold truncate">
                          {user.isVip ? (isPersian ? 'فعال (طلایی)' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/50 dark:bg-[#1a221a] border border-brand-border/60 dark:border-[#2a352a] space-y-1">
                        <div className="text-[11px] text-brand-text-muted flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{isPersian ? 'موقعیت' : 'City / Location'}</span>
                        </div>
                        <div className="text-base font-black text-brand-text truncate">
                          {user.city || (isPersian ? 'ثبت نشده' : 'Not set')}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-brand-surface-elevated/50 dark:bg-[#1a221a] border border-brand-border/60 dark:border-[#2a352a] space-y-1">
                        <div className="text-[11px] text-brand-text-muted flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isPersian ? 'مجموع خریدها' : 'Total Spent'}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
                          {loadingOrders ? '...' : formatToman(totalSpent, isPersian)}
                        </div>
                      </div>
                    </div>

                    {/* Personal & Contact Information Card */}
                    <div className="rounded-2xl border border-brand-border/70 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#161d16] p-4 sm:p-5 space-y-4">
                      <h3 className="font-black text-sm text-brand-text flex items-center gap-2 pb-2 border-b border-brand-border/40">
                        <UserIcon className="w-4 h-4 text-brand-gold" />
                        <span>{isPersian ? 'اطلاعات شناسایی و ارتباطی' : 'Personal & Contact Information'}</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Full Name */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                          </span>
                          <span className="font-black text-sm text-brand-text block">
                            {user.fullName || '—'}
                          </span>
                        </div>

                        {/* Username */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'نام کاربری' : 'Username'}
                          </span>
                          <span className="font-bold text-sm text-brand-bronze dark:text-brand-gold font-mono block">
                            @{user.username}
                          </span>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'آدرس ایمیل' : 'Email Address'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-brand-bronze shrink-0" />
                            <a
                              href={`mailto:${user.email}`}
                              className="font-bold text-brand-text hover:text-brand-gold transition-colors truncate font-sans"
                            >
                              {user.email}
                            </a>
                            <button
                              onClick={() => copyToClipboard(user.email, 'email')}
                              className="p-1 hover:bg-brand-surface rounded-md text-brand-text-muted transition-colors cursor-pointer"
                              title={isPersian ? 'کپی ایمیل' : 'Copy email'}
                            >
                              {copiedKey === 'email' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'شماره موبایل / تماس' : 'Phone Number'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-brand-bronze shrink-0" />
                            {user.phone ? (
                              <>
                                <a
                                  href={`tel:${user.phone}`}
                                  className="font-bold text-brand-text hover:text-brand-gold transition-colors font-mono"
                                >
                                  {user.phone}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(user.phone || '', 'phone')}
                                  className="p-1 hover:bg-brand-surface rounded-md text-brand-text-muted transition-colors cursor-pointer"
                                  title={isPersian ? 'کپی شماره تماس' : 'Copy phone'}
                                >
                                  {copiedKey === 'phone' ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-brand-text-muted font-sans">—</span>
                            )}
                          </div>
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'تاریخ تولد (شمسی / میلادی)' : 'Birth Date'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-brand-bronze shrink-0" />
                            {user.birthDate || user.birthDateShamsi ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-brand-text">
                                  {user.birthDate
                                    ? formatDisplayBirthDate(user.birthDate, 'jalali', isPersian)
                                    : user.birthDateShamsi}
                                </span>
                                {user.birthDate && (
                                  <span className="text-brand-text-muted font-mono text-[11px]">
                                    ({formatDisplayBirthDate(user.birthDate, 'gregorian', false)})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-brand-text-muted font-sans">—</span>
                            )}
                          </div>
                        </div>

                        {/* Registration Date */}
                        <div className="space-y-1">
                          <span className="text-brand-text-muted block text-[11px] font-semibold">
                            {isPersian ? 'تاریخ و زمان ثبت‌نام' : 'Registration Date'}
                          </span>
                          <div className="flex items-center gap-2 text-brand-text font-medium">
                            <Clock className="w-3.5 h-3.5 text-brand-bronze shrink-0" />
                            <span>{formatDateTime(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VIP Subscription Details Card */}
                    <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm text-brand-text flex items-center gap-2">
                          <Crown className="w-4 h-4 text-brand-gold" />
                          <span>{isPersian ? 'جزئیات اشتراک VIP باشگاه مشتریان' : 'VIP Membership Details'}</span>
                        </h3>
                        <Chip
                          size="sm"
                          variant="solid"
                          className={user.isVip ? 'bg-brand-gold text-[#141914] font-black' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold'}
                        >
                          {user.isVip ? (isPersian ? 'اشتراک فعال' : 'Active VIP') : (isPersian ? 'غیرفعال' : 'Standard')}
                        </Chip>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[11px] text-brand-text-muted block">
                            {isPersian ? 'تاریخ انقضای عضویت VIP' : 'VIP Expiration Date'}
                          </span>
                          <span className="font-bold text-brand-text block mt-0.5">
                            {user.vipExpiresAt ? formatDateTime(user.vipExpiresAt) : (user.isVip ? (isPersian ? 'نامحدود (دائمی)' : 'Lifetime') : '—')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-brand-text-muted block">
                            {isPersian ? 'مزایای فعال برای کاربر' : 'Active Privileges'}
                          </span>
                          <span className="font-bold text-brand-text block mt-0.5">
                            {user.isVip
                              ? isPersian ? 'تخفیف ویژه، دسترسی زودهنگام به محصولات نیش، ارسال رایگان' : 'Special discounts & priority shipping'
                              : isPersian ? 'بدون مزایای ویژه' : 'Standard privileges'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'address' && (
                  <motion.div
                    key="tab-address"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {user.address || user.city || user.province ? (
                      <div className="space-y-4">
                        {/* Primary Address Card */}
                        <div className="rounded-2xl border border-brand-border/70 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#161d16] p-5 space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
                            <h3 className="font-black text-sm text-brand-text flex items-center gap-2">
                              <Home className="w-4 h-4 text-brand-gold" />
                              <span>{isPersian ? 'آدرس پستی پیش‌فرض ثبت‌شده' : 'Default Postal Address'}</span>
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-bronze dark:text-brand-gold">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{user.province ? `${user.province}، ` : ''}{user.city || '—'}</span>
                            </div>
                          </div>

                          {/* Full Street Address */}
                          <div className="space-y-1">
                            <span className="text-brand-text-muted text-[11px] font-semibold block">
                              {isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                            </span>
                            <p className="text-sm font-bold text-brand-text leading-relaxed">
                              {user.address || (isPersian ? 'ثبت نشده است' : 'Not provided')}
                            </p>
                          </div>

                          {/* Postal Code, Building & Unit */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-brand-border/40 text-xs">
                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'کد پستی ۱۰ رقمی' : 'Postal Code'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-sm text-brand-text">
                                  {user.postalCode || '—'}
                                </span>
                                {user.postalCode && (
                                  <button
                                    onClick={() => copyToClipboard(user.postalCode || '', 'zip')}
                                    className="p-1 hover:bg-brand-surface rounded text-brand-text-muted cursor-pointer"
                                  >
                                    {copiedKey === 'zip' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'پلاک' : 'Building No.'}
                              </span>
                              <span className="font-bold text-sm text-brand-text block">
                                {user.buildingNumber || '—'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'واحد' : 'Unit'}
                              </span>
                              <span className="font-bold text-sm text-brand-text block">
                                {user.unit || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recipient Details Card */}
                        <div className="rounded-2xl border border-brand-border/70 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#161d16] p-5 space-y-4">
                          <h3 className="font-black text-sm text-brand-text flex items-center gap-2 pb-2 border-b border-brand-border/40">
                            <UserIcon className="w-4 h-4 text-brand-gold" />
                            <span>{isPersian ? 'مشخصات تحویل‌گیرنده سفارشات' : 'Recipient Information'}</span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'نام تحویل‌گیرنده' : 'Recipient Name'}
                              </span>
                              <span className="font-bold text-sm text-brand-text block">
                                {user.recipientName || user.fullName || '—'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
                              </span>
                              <span className="font-mono font-bold text-sm text-brand-text block">
                                {user.recipientPhone || user.phone || '—'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'ایمیل تحویل‌گیرنده' : 'Recipient Email'}
                              </span>
                              <span className="font-mono font-bold text-xs text-brand-text block truncate">
                                {user.recipientEmail || user.email || '—'}
                              </span>
                            </div>
                          </div>

                          {user.addressNotes && (
                            <div className="pt-2 border-t border-brand-border/40 space-y-1">
                              <span className="text-brand-text-muted text-[11px] font-semibold block">
                                {isPersian ? 'توضیحات تکمیلی و نکات تحویل' : 'Delivery Notes'}
                              </span>
                              <p className="text-xs text-brand-text font-medium leading-relaxed bg-brand-surface p-2.5 rounded-xl border border-brand-border/60">
                                {user.addressNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center rounded-2xl border border-dashed border-brand-border text-brand-text-muted space-y-3">
                        <MapPin className="w-10 h-10 text-brand-bronze mx-auto opacity-40" />
                        <h4 className="font-bold text-sm text-brand-text">
                          {isPersian ? 'هنوز نشانی یا آدرس پستی ثبت نشده است' : 'No shipping address registered'}
                        </h4>
                        <p className="text-xs max-w-sm mx-auto">
                          {isPersian
                            ? 'این کاربر هنوز در پروفایل یا حین ثبت سفارش، آدرس پستی خود را تکمیل نکرده است.'
                            : 'This user has not yet entered their delivery address in their account.'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'orders' && (
                  <motion.div
                    key="tab-orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {loadingOrders ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-2xl border border-brand-border/60 space-y-2">
                            <Skeleton className="h-4 w-1/3 rounded-lg" />
                            <Skeleton className="h-3 w-1/2 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl border border-dashed border-brand-border text-brand-text-muted space-y-3">
                        <ShoppingBag className="w-10 h-10 text-brand-bronze mx-auto opacity-40" />
                        <h4 className="font-bold text-sm text-brand-text">
                          {isPersian ? 'هیچ سفارشی توسط این کاربر ثبت نشده است' : 'No orders found for this user'}
                        </h4>
                        <p className="text-xs max-w-sm mx-auto">
                          {isPersian
                            ? 'تاکنون خریدی با این حساب کاربری در فروشگاه هاتف آروما انجام نشده است.'
                            : 'This user has not placed any orders yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div
                            key={order._id}
                            className="p-4 rounded-2xl border border-brand-border/70 dark:border-[#2a352a] bg-brand-surface-elevated/30 dark:bg-[#161d16] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-brand-gold/60 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm text-brand-text">
                                  #{order.orderNumber}
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
                                <span>{toPersianDigits(order.items?.length || 0)} {isPersian ? 'قلم کالا' : 'items'}</span>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </ModalBody>

            {/* Modal Footer with Actions */}
            <ModalFooter>
              <div className="flex items-center gap-2">
                {isAdmin && onDeleteUser && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => {
                      if (onClose) onClose();
                      onDeleteUser(user._id, user.fullName);
                    }}
                    startContent={<Trash2 className="w-4 h-4" />}
                    className="font-bold text-xs cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"
                  >
                    {isPersian ? 'حذف حساب کاربر' : 'Delete Account'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={onClose}
                  className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border/60 rounded-xl h-9 cursor-pointer"
                >
                  {isPersian ? 'بستن' : 'Close'}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
