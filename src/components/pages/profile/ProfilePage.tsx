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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Settings,
  Package,
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'addresses' | 'edit' | 'vip'>('dashboard');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Column (Right in RTL, Left in LTR) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-6">
            {/* User Header in Sidebar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-gold text-[#141914] font-black text-xl flex items-center justify-center shadow-md shadow-brand-gold/20 shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black text-brand-text truncate">{user.fullName}</h2>
                <div className="text-xs text-brand-text-muted font-mono mt-0.5 truncate">
                  {user.phone || user.email}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {user.isVip ? (isPersian ? 'عضو طلایی VIP' : 'Golden VIP Member') : (isPersian ? 'کاربر تایید شده' : 'Verified User')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="pt-4 border-t border-brand-border space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full h-12 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#182018] text-brand-gold border border-brand-gold/40 shadow-xs font-black dark:bg-[#141914]'
                    : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated text-brand-text border border-transparent hover:border-brand-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                  <span>{isPersian ? 'داشبورد' : 'Dashboard'}</span>
                </div>
                {isPersian ? <ChevronLeft className="w-4 h-4 opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`w-full h-12 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#182018] text-brand-gold border border-brand-gold/40 shadow-xs font-black dark:bg-[#141914]'
                    : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated text-brand-text border border-transparent hover:border-brand-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className={`w-4 h-4 ${activeTab === 'orders' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                  <span>{isPersian ? 'سفارش‌ها' : 'Orders'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {orders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-gold text-[#141914]">
                      {isPersian ? toPersianDigits(orders.length) : orders.length}
                    </span>
                  )}
                  {isPersian ? <ChevronLeft className="w-4 h-4 opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`w-full h-12 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-[#182018] text-brand-gold border border-brand-gold/40 shadow-xs font-black dark:bg-[#141914]'
                    : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated text-brand-text border border-transparent hover:border-brand-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                  <span>{isPersian ? 'آدرس‌ها' : 'Addresses'}</span>
                </div>
                {isPersian ? <ChevronLeft className="w-4 h-4 opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vip')}
                className={`w-full h-12 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  activeTab === 'vip'
                    ? 'bg-[#182018] text-brand-gold border border-brand-gold/40 shadow-xs font-black dark:bg-[#141914]'
                    : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated text-brand-text border border-transparent hover:border-brand-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className={`w-4 h-4 ${activeTab === 'vip' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                  <span>{isPersian ? 'باشگاه VIP' : 'VIP Club'}</span>
                </div>
                {user.isVip && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                    VIP
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`w-full h-12 px-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-[#182018] text-brand-gold border border-brand-gold/40 shadow-xs font-black dark:bg-[#141914]'
                    : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated text-brand-text border border-transparent hover:border-brand-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 ${activeTab === 'edit' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                  <span>{isPersian ? 'تنظیمات و مشخصات' : 'Settings & Info'}</span>
                </div>
                {isPersian ? <ChevronLeft className="w-4 h-4 opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
              </button>

              {(user.role === 'admin' || user.role === 'editor') && (
                <Link
                  href={PATHS.ADMIN_DASHBOARD}
                  className="w-full h-12 px-4 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne font-bold text-xs flex items-center justify-between transition-colors border border-brand-gold/30 shadow-xs mt-2"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-brand-gold" />
                    <span>{user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}</span>
                  </div>
                  {isPersian ? <ChevronLeft className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
                </Link>
              )}
            </div>

            {/* Logout Link */}
            <div className="pt-4 border-t border-brand-border">
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  router.push(PATHS.HOME);
                }}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.logOut}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Left in RTL, Right in LTR) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: DASHBOARD VIEW (MATCHING SCREENSHOT) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Banner (حساب من) */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-brand-text">
                    {isPersian ? 'حساب من' : 'My Account'}
                  </h1>
                  <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">
                    {isPersian
                      ? 'سفارش‌ها، آدرس‌ها و مشخصات کاربری خود را از اینجا مدیریت کنید.'
                      : 'Manage your orders, delivery addresses, and account details from here.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-5 py-2.5 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 flex items-center gap-2 transition-all active:scale-98 self-start sm:self-auto cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isPersian ? 'ویرایش پروفایل' : 'Edit Profile'}</span>
                </button>
              </div>

              {/* Welcome & Account Identity Card */}
              <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated border border-brand-border text-brand-bronze flex items-center justify-center font-black text-lg shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-brand-text-muted">
                      {isPersian ? 'حساب مشتری هاتف آروما' : 'HatefAroma Customer Account'}
                    </div>
                    <h2 className="text-base font-black text-brand-text truncate mt-0.5">
                      {user.fullName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-muted font-mono">
                      <span>{user.phone || user.email}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                        {isPersian ? 'تأیید شده' : 'Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    href={PATHS.PRODUCTS}
                    className="px-4 py-2.5 rounded-2xl bg-brand-surface-elevated hover:bg-brand-champagne/40 border border-brand-border text-xs font-bold text-brand-text flex items-center gap-1.5 transition-all"
                  >
                    <span>{isPersian ? 'ادامه خرید' : 'Continue Shopping'}</span>
                    {isPersian ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>

                  {user.isVip ? (
                    <div className="px-3.5 py-2 rounded-2xl bg-[#181f18] text-brand-gold border border-brand-gold/40 text-xs font-black flex items-center gap-1.5 shadow-xs">
                      <Crown className="w-3.5 h-3.5" />
                      <span>{isPersian ? 'عضو باشگاه طلایی' : 'VIP Member'}</span>
                    </div>
                  ) : (
                    <Link
                      href={PATHS.VIP}
                      className="px-4 py-2.5 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{isPersian ? 'عضویت در VIP' : 'Join VIP Club'}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Summary Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Orders Metric */}
                <div
                  onClick={() => setActiveTab('orders')}
                  className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs text-brand-text-muted font-bold block">
                      {isPersian ? 'سفارش‌ها' : 'Orders'}
                    </span>
                    <span className="text-2xl font-black text-brand-text mt-1 block">
                      {isPersian ? toPersianDigits(orders.length) : orders.length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                {/* Address Metric */}
                <div
                  onClick={() => setActiveTab('addresses')}
                  className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <span className="text-xs text-brand-text-muted font-bold block">
                      {isPersian ? 'آدرس‌ها' : 'Addresses'}
                    </span>
                    <span className="text-sm font-black text-brand-text mt-1 block truncate">
                      {user.city ? `${user.city}` : (isPersian ? 'نشانی ثبت نشده' : 'Not set')}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>

                {/* VIP Status Metric */}
                <div
                  onClick={() => setActiveTab('vip')}
                  className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-center justify-between group sm:col-span-2 lg:col-span-1"
                >
                  <div>
                    <span className="text-xs text-brand-text-muted font-bold block">
                      {isPersian ? 'باشگاه VIP' : 'VIP Club'}
                    </span>
                    <span className="text-sm font-black text-brand-text mt-1 block">
                      {user.isVip ? (isPersian ? 'عضو طلایی' : 'VIP Member') : (isPersian ? 'کاربر عادی' : 'Standard')}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                    <Crown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Quick Access Section (دسترسی‌های سریع) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black text-brand-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  <span>{isPersian ? 'دسترسی‌های سریع' : 'Quick Access'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quick 1: Orders */}
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-brand-text">{isPersian ? 'سفارش‌ها' : 'Orders'}</h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        {isPersian ? 'وضعیت پرداخت، تأمین و پیگیری تحویل سفارش‌ها' : 'View order tracking, payment and delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Quick 2: Addresses */}
                  <div
                    onClick={() => setActiveTab('addresses')}
                    className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-brand-text">{isPersian ? 'آدرس‌ها' : 'Addresses'}</h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        {isPersian ? 'نشانی‌های تحویل، پلاک و گیرنده را مدیریت کنید' : 'Manage delivery addresses, postal codes and contacts'}
                      </p>
                    </div>
                  </div>

                  {/* Quick 3: Account Info */}
                  <div
                    onClick={() => setActiveTab('edit')}
                    className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-brand-text">{isPersian ? 'اطلاعات حساب' : 'Account Info'}</h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        {isPersian ? 'ویرایش مشخصات فردی، تاریخ تولد و امنیت حساب' : 'Update name, date of birth, contact and passwords'}
                      </p>
                    </div>
                  </div>

                  {/* Quick 4: VIP Club */}
                  <div
                    onClick={() => setActiveTab('vip')}
                    className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-colors">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-brand-text">{isPersian ? 'باشگاه مشتریان VIP' : 'VIP Club'}</h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        {isPersian ? 'تخفیف‌های دائمی، هدیه تولد و ارسال رایگان سفارش‌ها' : 'Permanent discounts, birthday gifts and free delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Quick 5: Admin / Editor Panel (if applicable) */}
                  {(user.role === 'admin' || user.role === 'editor') && (
                    <Link
                      href={PATHS.ADMIN_DASHBOARD}
                      className="bg-brand-surface rounded-2xl p-5 border border-brand-border hover:border-brand-gold/60 transition-all flex items-start gap-4 group sm:col-span-2"
                    >
                      <div className="w-12 h-12 rounded-xl bg-brand-olive text-brand-gold flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-brand-text">
                          {user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}
                        </h4>
                        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                          {isPersian
                            ? 'مدیریت محصولات، سفارش‌ها، دسته‌بندی‌ها و گزارش‌های سیستم'
                            : 'Manage products, orders, categories, and system reports'}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="p-2 rounded-xl bg-brand-surface-elevated hover:bg-brand-border text-brand-text transition-colors"
                    title={isPersian ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
                  >
                    {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </button>
                  <div>
                    <h3 className="text-base font-black text-brand-text">{t.profile.ordersTitle}</h3>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {t.profile.itemsCount(isPersian ? toPersianDigits(orders.length) : orders.length)}
                    </p>
                  </div>
                </div>
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
                    className="inline-block px-6 py-2.5 rounded-2xl bg-brand-gold text-[#141914] font-bold text-xs shadow-md hover:bg-[#d4be9b] transition-colors"
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
          )}

          {/* TAB 3: ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="p-2 rounded-xl bg-brand-surface-elevated hover:bg-brand-border text-brand-text transition-colors"
                      title={isPersian ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
                    >
                      {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className="text-base font-black text-brand-text">
                        {isPersian ? 'نشانی تحویل سفارش‌ها' : 'Delivery Address'}
                      </h3>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {isPersian
                          ? 'این نشانی به صورت خودکار در سبد خرید و فاکتور نهایی اعمال خواهد شد'
                          : 'This address will be automatically pre-filled in your checkout'}
                      </p>
                    </div>
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
                      {isPersian ? 'نشانی پستی دقیق' : 'Full Street Address'}
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isPersian ? 'خیابان، کوچه، پلاک، واحد...' : 'Street address, alley, details'}
                      className="w-full p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'کد پستی (۱۰ رقمی)' : 'Postal / Zip Code (10 digits)'}
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1234567890"
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1.5 text-brand-text">
                        {isPersian ? 'پلاک' : 'Building / Plaque'}
                      </label>
                      <input
                        type="text"
                        value={buildingNumber}
                        onChange={(e) => setBuildingNumber(e.target.value)}
                        placeholder="12"
                        className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
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
                        placeholder="3"
                        className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-mono font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={isPersian ? 'نام تحویل‌گیرنده' : 'Recipient Name'}
                      className="w-full h-11 px-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-brand-text">
                      {isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
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

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 ease-out disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving
                        ? isPersian ? 'در حال ذخیره‌سازی...' : 'Saving...'
                        : isPersian ? 'ذخیره نشانی تحویل' : 'Save Address'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: EDIT PROFILE & SECURITY TAB */}
          {activeTab === 'edit' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Personal Details Card */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="p-2 rounded-xl bg-brand-surface-elevated hover:bg-brand-border text-brand-text transition-colors"
                      title={isPersian ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
                    >
                      {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className="text-base font-black text-brand-text">
                        {isPersian ? 'اطلاعات فردی و شناسایی' : 'Personal Information'}
                      </h3>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {isPersian
                          ? 'نام، نام کاربری، ایمیل و شماره تماس خود را در اینجا ویرایش نمایید'
                          : 'Update your name, unique username, email, and phone number'}
                      </p>
                    </div>
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

              {/* Password & Security Card */}
              <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border flex-wrap gap-2">
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
                    className="text-xs font-bold text-brand-bronze hover:text-brand-gold underline flex items-center gap-1 cursor-pointer"
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

              {/* Submit Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3 rounded-2xl bg-brand-surface-elevated text-brand-text-muted text-xs font-bold border border-brand-border hover:bg-brand-champagne/30 transition-colors cursor-pointer"
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
