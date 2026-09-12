'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Crown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  Edit3,
  Lock,
  Save,
  ShieldCheck,
  KeyRound,
  HelpCircle,
  X,
  Send,
  Check,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout, updateUser } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast, getApiErrorMessage } from '@/common/utils';
import { formatDisplayBirthDate, isoToJalali } from '@/common/utils/date';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { VipBadge } from '@/components/common/VipBadge';
import { IOrder } from '@/common/interfaces';
import axiosInstance from '@/common/axiosInstance';
import { useTranslation } from '@/common/i18n';

export function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian } = useTranslation();

  const [activeTab, setActiveTab] = useState<'orders' | 'edit'>('orders');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [birthDateShamsi, setBirthDateShamsi] = useState(user?.birthDateShamsi || '');
  const [province, setProvince] = useState(user?.province || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [buildingNumber, setBuildingNumber] = useState(user?.buildingNumber || '');
  const [unit, setUnit] = useState(user?.unit || '');
  const [recipientName, setRecipientName] = useState(user?.recipientName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.recipientPhone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetIdentifier, setResetIdentifier] = useState(user?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBirthDate(user.birthDate || '');
      setBirthDateShamsi(user.birthDateShamsi || '');
      setProvince(user.province || '');
      setCity(user.city || '');
      setAddress(user.address || '');
      setPostalCode(user.postalCode || '');
      setBuildingNumber(user.buildingNumber || '');
      setUnit(user.unit || '');
      setRecipientName(user.recipientName || '');
      setRecipientPhone(user.recipientPhone || '');
      setResetIdentifier(user.email || user.username || '');
    }
  }, [user]);

  const handleBirthDateChange = (isoDate: string) => {
    setBirthDate(isoDate);
    const jParts = isoToJalali(isoDate);
    if (jParts) {
      const shamsi = `${jParts[0]}/${String(jParts[1]).padStart(2, '0')}/${String(jParts[2]).padStart(2, '0')}`;
      setBirthDateShamsi(shamsi);
    } else {
      setBirthDateShamsi('');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get('/orders/my');
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router]);

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(isPersian ? 'نام و نام خانوادگی الزامی است.' : 'Full name is required.');
      return;
    }

    if (!username.trim()) {
      toast.error(isPersian ? 'نام کاربری الزامی است.' : 'Username is required.');
      return;
    }

    if (!email.trim()) {
      toast.error(isPersian ? 'آدرس ایمیل الزامی است.' : 'Email is required.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error(
          isPersian
            ? 'برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.'
            : 'Current password is required to set a new password.',
        );
        return;
      }
      if (newPassword.length < 6) {
        toast.error(
          isPersian
            ? 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.'
            : 'New password must be at least 6 characters.',
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(
          isPersian
            ? 'تکرار کلمه عبور جدید با رمز وارد شده مطابقت ندارد.'
            : 'New password confirmation does not match.',
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        birthDate: birthDate || null,
        birthDateShamsi: birthDateShamsi || null,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        buildingNumber: buildingNumber.trim() || undefined,
        unit: unit.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.password = newPassword;
      }

      const res = await axiosInstance.patch('/users/profile', payload);
      dispatch(updateUser(res.data));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(
        isPersian
          ? 'مشخصات حساب کاربری با موفقیت به‌روزرسانی شد.'
          : 'Profile updated successfully.',
      );
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      toast.error(isPersian ? 'لطفاً ایمیل یا نام کاربری را وارد کنید.' : 'Please enter your email or username.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', {
        identifier: resetIdentifier.trim(),
      });
      setMaskedEmail(res.data?.email || resetIdentifier);
      setResetStep(2);
      toast.success(
        isPersian
          ? res.data?.message || 'کد تایید با موفقیت ارسال شد.'
          : 'Verification code sent to your email.',
      );
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      toast.error(isPersian ? 'کد تایید الزامی است.' : 'Verification code is required.');
      return;
    }
    if (resetNewPassword.length < 6) {
      toast.error(isPersian ? 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        identifier: resetIdentifier.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
      });
      toast.success(
        isPersian
          ? 'رمز عبور جدید با موفقیت فعال شد. لطفاً از رمز جدید برای ورود استفاده نمایید.'
          : 'Password reset successfully. You can now use your new password.',
      );
      setResetModalOpen(false);
      setResetStep(1);
      setResetCode('');
      setResetNewPassword('');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setResetLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-surface-elevated text-brand-bronze border border-brand-gold/30">
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-surface-elevated text-brand-bronze-dark flex items-center gap-1 border border-brand-border">
            <Truck className="w-3 h-3" />
            <span>{isPersian ? 'تحویل پست شده' : 'Shipped'}</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-champagne text-brand-text flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-brand-bronze" />
            <span>{isPersian ? 'تحویل داده شده' : 'Delivered'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            {isPersian ? 'لغو شده' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-surface-elevated text-brand-text-muted">
            {isPersian ? 'در انتظار پرداخت' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Info & VIP Card Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-gold text-[#141914] font-black text-xl flex items-center justify-center shadow-md shadow-brand-gold/20 shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-brand-text truncate">{user.fullName}</h2>
                <span className="text-xs text-brand-text-muted font-sans">@{user.username}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-brand-border text-xs text-brand-text-muted">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-bronze shrink-0" />
                <span className="truncate font-sans">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-bronze shrink-0" />
                  <span className="font-mono">{user.phone}</span>
                </div>
              )}
              {user.birthDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-bronze shrink-0" />
                  <span className="truncate">
                    {formatDisplayBirthDate(user.birthDate, 'jalali', isPersian)}
                    <span className="text-[10px] text-brand-text-muted font-sans ml-1">
                      ({formatDisplayBirthDate(user.birthDate, 'gregorian', false)})
                    </span>
                  </span>
                </div>
              )}
              {(user.province || user.city || user.address) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-bronze shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {[user.province, user.city, user.address].filter(Boolean).join('، ')}
                    {user.buildingNumber && ` پلاک ${user.buildingNumber}`}
                    {user.unit && ` واحد ${user.unit}`}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Tab Switch Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'edit' ? 'orders' : 'edit')}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ease-out border ${
                activeTab === 'edit'
                  ? 'bg-brand-surface-elevated text-brand-bronze border-brand-gold/40 font-black'
                  : 'bg-brand-surface-elevated text-brand-text border-brand-border hover:bg-brand-champagne/40'
              }`}
            >
              <Edit3 className="w-4 h-4 text-brand-bronze" />
              <span>
                {activeTab === 'edit'
                  ? isPersian ? 'مشاهده سفارشات' : 'View Orders'
                  : isPersian ? 'ویرایش مشخصات و رمز عبور' : 'Edit Profile & Password'}
              </span>
            </button>

            {(user.role === 'admin' || user.role === 'editor') && (
              <Link
                href={PATHS.ADMIN_DASHBOARD}
                className="w-full py-3 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-brand-gold/30 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>
                  {user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}
                </span>
              </Link>
            )}

            <button
              onClick={() => {
                dispatch(logout());
                router.push(PATHS.HOME);
              }}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.nav.logOut}</span>
            </button>
          </div>

          {/* VIP Status Card */}
          {user.isVip ? (
            <div className="rounded-3xl p-6 bg-[#181f18] text-[#f7f4ee] border border-brand-gold/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-brand-gold" />
                  <span className="font-black text-sm text-brand-gold">{t.profile.vipActiveCard}</span>
                </div>
                <VipBadge size="sm" text="VIP" />
              </div>

              <p className="text-xs text-brand-champagne leading-relaxed">
                {t.profile.vipPerksActive}
              </p>

              {user.vipExpiresAt && (
                <div className="text-[11px] text-brand-text-muted">
                  {t.profile.vipExpires(new Date(user.vipExpiresAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US'))}
                </div>
              )}

              <Link
                href={PATHS.VIP}
                className="block text-center py-2.5 rounded-xl bg-brand-gold text-[#141914] font-black text-xs hover:bg-[#d4be9b] transition-colors"
              >
                {t.profile.upgradeVip}
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl p-6 bg-brand-surface-elevated border border-brand-border space-y-3">
              <div className="flex items-center gap-2 text-brand-bronze dark:text-brand-gold">
                <Crown className="w-5 h-5" />
                <span className="font-black text-sm">{t.profile.joinVipTitle}</span>
              </div>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {t.profile.joinVipSub}
              </p>
              <Link
                href={PATHS.VIP}
                className="block text-center py-2.5 rounded-2xl bg-brand-gold text-[#141914] font-black text-xs hover:bg-[#d4be9b] transition-colors shadow-sm"
              >
                {t.hero.joinVip}
              </Link>
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Header */}
          <div className="flex items-center gap-2 bg-brand-surface p-2 rounded-2xl border border-brand-border">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-brand-gold text-[#141914] shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.profile.ordersTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10">
                {isPersian ? toPersianDigits(orders.length) : orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
                activeTab === 'edit'
                  ? 'bg-brand-gold text-[#141914] shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isPersian ? 'ویرایش مشخصات و حساب کاربری' : 'Edit Profile & Account'}</span>
            </button>
          </div>

          {activeTab === 'orders' ? (
            /* Orders Tab Content */
            <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-bronze" />
                  <h3 className="text-lg font-black text-brand-text">{t.profile.ordersTitle}</h3>
                </div>
                <span className="text-xs font-bold text-brand-text-muted">
                  {t.profile.itemsCount(isPersian ? toPersianDigits(orders.length) : orders.length)}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-brand-surface-elevated animate-pulse border border-brand-border"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-brand-text-muted space-y-3">
                  <ShoppingBag className="w-12 h-12 text-brand-bronze mx-auto opacity-50" />
                  <p className="text-sm font-semibold">{t.profile.emptyOrders}</p>
                  <Link
                    href={PATHS.PRODUCTS}
                    className="inline-block px-6 py-2.5 rounded-xl bg-brand-gold text-[#141914] font-bold text-xs shadow-md hover:bg-[#d4be9b] transition-colors"
                  >
                    {t.home.curatedPicks}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="p-5 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-3 hover:border-brand-gold transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-brand-text">
                            {t.profile.orderNum} {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-xs text-brand-text-muted">
                          {new Date(order.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                        </div>
                      </div>

                      {order.trackingCode && (
                        <div className="px-3 py-1.5 rounded-xl bg-brand-surface text-xs text-brand-bronze border border-brand-border flex items-center justify-between">
                          <span className="font-medium">{t.profile.trackingCode}</span>
                          <span className="font-mono-latin font-bold">{order.trackingCode}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-brand-border flex items-center justify-between text-xs">
                        <span className="text-brand-text-muted">
                          {t.profile.itemsCount(isPersian ? toPersianDigits(order.items?.length || 0) : (order.items?.length || 0))}
                        </span>
                        <span className="font-black text-sm text-brand-text">
                          {formatToman(order.total, isPersian)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Edit Profile Tab Content */
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Personal Details Card */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-brand-border">
                  <User className="w-5 h-5 text-brand-bronze" />
                  <div>
                    <h3 className="text-base font-black text-brand-text">
                      {isPersian ? 'اطلاعات فردی و شناسایی' : 'Personal Information'}
                    </h3>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {isPersian
                        ? 'نام، نام کاربری، ایمیل و شماره تماس خود را در اینجا ویرایش نمایید (یکتایی بررسی می‌شود)'
                        : 'Update your name, unique username, email, and phone number'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'نام و نام خانوادگی *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'نام کاربری (یکتا در سیستم) *' : 'Username (Unique) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. john_doe"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'آدرس ایمیل (یکتا در سیستم) *' : 'Email Address (Unique) *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold font-sans text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'شماره موبایل' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold font-mono text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                </div>

                {/* Date of Birth Picker */}
                <div className="pt-4 border-t border-brand-border">
                  <BirthDatePicker
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    label={isPersian ? 'تاریخ تولد (شمسی و میلادی)' : 'Date of Birth (Solar & Gregorian)'}
                  />
                </div>
              </div>

              {/* Default Address & Shipping Details Card */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-brand-border">
                  <MapPin className="w-5 h-5 text-brand-bronze" />
                  <div>
                    <h3 className="text-base font-black text-brand-text">
                      {isPersian ? 'آدرس و مشخصات تحویل پیش‌فرض' : 'Default Delivery Address & Shipping'}
                    </h3>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {isPersian
                        ? 'این مشخصات به صورت خودکار در سبد خرید و مراحل ثبت سفارش شما بارگذاری خواهد شد'
                        : 'Automatically pre-filled in your cart and future checkouts'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'استان' : 'Province / State'}
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder={isPersian ? 'مثال: تهران' : 'e.g. Tehran'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'شهر' : 'City'}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={isPersian ? 'مثال: تهران' : 'e.g. Tehran'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'نشانی پستی دقیق (خیابان، کوچه، بن‌بست)' : 'Full Street Address'}
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isPersian ? 'مثال: خیابان ولیعصر، نرسیده به میدان ونک، کوچه شریفی' : 'Street address, alley, details'}
                      className="w-full p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'کد پستی (۱۰ رقمی)' : 'Postal / Zip Code (10 digits)'}
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1234567890"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1.5 text-brand-text">
                        {isPersian ? 'پلاک' : 'Building / Plaque'}
                      </label>
                      <input
                        type="text"
                        value={buildingNumber}
                        onChange={(e) => setBuildingNumber(e.target.value)}
                        placeholder={isPersian ? 'مثال: ۱۲' : 'e.g. 12'}
                        className="w-full h-11 px-3 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text focus:ring-2 focus:ring-brand-gold text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1.5 text-brand-text">
                        {isPersian ? 'واحد' : 'Unit'}
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder={isPersian ? 'مثال: ۴' : 'e.g. 4'}
                        className="w-full h-11 px-3 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text focus:ring-2 focus:ring-brand-gold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'نام و نام خانوادگی تحویل‌گیرنده' : 'Recipient Name'}
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={isPersian ? 'در صورت تفاوت با نام حساب' : 'If different from account name'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Security Card */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-brand-bronze" />
                    <div>
                      <h3 className="text-base font-black text-brand-text">
                        {isPersian ? 'تغییر رمز عبور' : 'Change Password'}
                      </h3>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {isPersian
                          ? 'جهت تغییر رمز عبور، حتماً باید کلمه عبور فعلی را وارد نمایید'
                          : 'You must provide your current password to set a new one'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(true);
                      setResetStep(1);
                    }}
                    className="text-xs font-bold text-brand-bronze hover:text-brand-gold underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isPersian ? 'رمز فعلی را فراموش کرده‌اید؟' : 'Forgot current password?'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={isPersian ? 'رمز فعلی حساب' : 'Current Password'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-sans text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'کلمه عبور جدید' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-sans text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-sans text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-6 py-3 rounded-2xl bg-brand-surface-elevated text-brand-text-muted text-xs font-bold border border-brand-border hover:bg-brand-champagne/30 transition-colors"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 ease-out disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? isPersian ? 'در حال ذخیره‌سازی...' : 'Saving Changes...'
                      : isPersian ? 'ذخیره تغییرات مشخصات' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-surface text-brand-text rounded-3xl p-6 sm:p-8 max-w-md w-full border border-brand-border shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-bronze" />
                <h3 className="font-black text-base">
                  {isPersian ? 'بازنشانی رمز عبور' : 'Reset Password'}
                </h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-xl text-brand-text-muted hover:bg-brand-surface-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="space-y-4 text-xs">
                <p className="text-brand-text-muted leading-relaxed">
                  {isPersian
                    ? 'جهت بازیابی رمز عبور، ایمیل یا نام کاربری حساب خود را وارد کنید تا کد تایید برای شما ارسال شود:'
                    : 'Enter your account email or username to receive a 6-digit password reset code:'}
                </p>

                <div>
                  <label className="block font-bold mb-1.5">
                    {isPersian ? 'ایمیل یا نام کاربری' : 'Email or Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="user@example.com / username"
                    className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border font-semibold text-xs focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-3 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{resetLoading ? (isPersian ? 'در حال ارسال...' : 'Sending...') : (isPersian ? 'ارسال کد تایید' : 'Send Code')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-brand-surface-elevated font-bold border border-brand-border"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
                <p className="text-brand-text-muted leading-relaxed">
                  {isPersian
                    ? `کد تایید ۶ رقمی به آدرس ${maskedEmail} ارسال شد. لطفاً کد را وارد کرده و رمز جدید خود را تعیین کنید:`
                    : `A 6-digit code was sent to ${maskedEmail}. Please enter the code and set your new password:`}
                </p>

                <div>
                  <label className="block font-bold mb-1.5">
                    {isPersian ? 'کد تایید ۶ رقمی' : '6-Digit Verification Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border font-mono text-center tracking-widest text-sm font-black focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5">
                    {isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New Password (min 6 chars)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border font-sans text-xs focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-3 rounded-2xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{resetLoading ? (isPersian ? 'در حال تایید...' : 'Verifying...') : (isPersian ? 'تغییر و ثبت رمز جدید' : 'Set New Password')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-4 py-3 rounded-2xl bg-brand-surface-elevated font-bold border border-brand-border"
                  >
                    {isPersian ? 'مرحله قبل' : 'Back'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
