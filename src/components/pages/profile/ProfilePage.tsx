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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout, updateUser } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast, getApiErrorMessage } from '@/common/utils';
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
      setResetIdentifier(user.email || user.username || '');
    }
  }, [user]);

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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30">
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f8f5f0] text-[#7a5d3e] dark:bg-[#242c24] dark:text-[#d4be9b] flex items-center gap-1 border border-[#e6dcce] dark:border-[#2e3a2e]">
            <Truck className="w-3 h-3" />
            <span>{isPersian ? 'تحویل پست شده' : 'Shipped'}</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e6dcce] text-[#1d241d] dark:bg-[#2e3a2e] dark:text-[#f7f4ee] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#9f815b]" />
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0eae0] text-[#73695c] dark:bg-[#242c24] dark:text-[#a69c8e]">
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
          <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4be9b] to-[#9f815b] text-[#1d241d] font-black text-xl flex items-center justify-center shadow-md shadow-[#9f815b]/20 shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-[#1d241d] dark:text-[#f7f4ee] truncate">{user.fullName}</h2>
                <span className="text-xs text-[#73695c] dark:text-[#a69c8e] font-sans">@{user.username}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#e6dcce] dark:border-[#2e3a2e] text-xs text-[#73695c] dark:text-[#a69c8e]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9f815b] shrink-0" />
                <span className="truncate font-sans">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#9f815b] shrink-0" />
                  <span className="font-mono">{user.phone}</span>
                </div>
              )}
            </div>

            {/* Quick Tab Switch Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'edit' ? 'orders' : 'edit')}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                activeTab === 'edit'
                  ? 'bg-[#f0eae0] dark:bg-[#283228] text-[#9f815b] dark:text-[#d4be9b] border-[#bfa27a]/40 font-black'
                  : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] border-[#e6dcce] dark:border-[#2e3a2e] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e]'
              }`}
            >
              <Edit3 className="w-4 h-4 text-[#9f815b]" />
              <span>
                {activeTab === 'edit'
                  ? isPersian ? 'مشاهده سفارشات' : 'View Orders'
                  : isPersian ? 'ویرایش مشخصات و رمز عبور' : 'Edit Profile & Password'}
              </span>
            </button>

            {(user.role === 'admin' || user.role === 'editor') && (
              <Link
                href={PATHS.ADMIN_DASHBOARD}
                className="w-full py-3 rounded-2xl bg-[#202620] hover:bg-[#2c352c] text-[#d4be9b] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#bfa27a]/30 shadow-sm"
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
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#262f26] to-[#141914] text-[#f7f4ee] border border-[#bfa27a]/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#d4be9b]" />
                  <span className="font-black text-sm text-[#d4be9b]">{t.profile.vipActiveCard}</span>
                </div>
                <VipBadge size="sm" text="VIP" />
              </div>

              <p className="text-xs text-[#e6dcce] leading-relaxed">
                {t.profile.vipPerksActive}
              </p>

              {user.vipExpiresAt && (
                <div className="text-[11px] text-[#a69c8e]">
                  {t.profile.vipExpires(new Date(user.vipExpiresAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US'))}
                </div>
              )}

              <Link
                href={PATHS.VIP}
                className="block text-center py-2.5 rounded-xl bg-[#bfa27a] text-[#1d241d] font-black text-xs hover:bg-[#d4be9b] transition-colors"
              >
                {t.profile.upgradeVip}
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl p-6 bg-[#ffffff] dark:bg-[#1c231c] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">{t.profile.joinVipTitle}</h3>
              </div>
              <p className="text-xs text-[#73695c] dark:text-[#a69c8e] leading-relaxed">
                {t.profile.joinVipSub}
              </p>
              <Link
                href={PATHS.VIP}
                className="block text-center py-2.5 rounded-xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] border border-[#bfa27a]/40 font-bold text-xs transition-colors"
              >
                {t.hero.joinVip}
              </Link>
            </div>
          )}
        </div>

        {/* Main Content Column: Tabs & Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Header */}
          <div className="flex items-center gap-2 bg-[#ffffff] dark:bg-[#1c231c] p-2 rounded-2xl border border-[#e6dcce] dark:border-[#2e3a2e]">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-sm'
                  : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee]'
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
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'edit'
                  ? 'bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-sm'
                  : 'text-[#73695c] dark:text-[#a69c8e] hover:text-[#1d241d] dark:hover:text-[#f7f4ee]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isPersian ? 'ویرایش مشخصات و حساب کاربری' : 'Edit Profile & Account'}</span>
            </button>
          </div>

          {activeTab === 'orders' ? (
            /* Orders Tab Content */
            <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 sm:p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#9f815b]" />
                  <h3 className="text-lg font-black text-[#1d241d] dark:text-[#f7f4ee]">{t.profile.ordersTitle}</h3>
                </div>
                <span className="text-xs font-bold text-[#73695c] dark:text-[#a69c8e]">
                  {t.profile.itemsCount(isPersian ? toPersianDigits(orders.length) : orders.length)}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-[#73695c] dark:text-[#a69c8e] space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#9f815b] mx-auto opacity-50" />
                  <p className="text-sm font-semibold">{t.profile.emptyOrders}</p>
                  <Link
                    href={PATHS.PRODUCTS}
                    className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] font-bold text-xs shadow-md"
                  >
                    {t.home.curatedPicks}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="p-5 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3 hover:border-[#bfa27a] transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                            {t.profile.orderNum} {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-xs text-[#73695c] dark:text-[#a69c8e]">
                          {new Date(order.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                        </div>
                      </div>

                      {order.trackingCode && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#ffffff] dark:bg-[#1c231c] text-xs font-mono text-[#9f815b] dark:text-[#d4be9b] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between">
                          <span>{t.profile.trackingCode}</span>
                          <span className="font-bold">{order.trackingCode}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between text-xs">
                        <span className="text-[#73695c] dark:text-[#a69c8e]">
                          {t.profile.itemsCount(isPersian ? toPersianDigits(order.items?.length || 0) : (order.items?.length || 0))}
                        </span>
                        <span className="font-black text-sm text-[#1d241d] dark:text-[#d4be9b]">
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
              <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 sm:p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <User className="w-5 h-5 text-[#9f815b]" />
                  <div>
                    <h3 className="text-base font-black text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'اطلاعات فردی و شناسایی' : 'Personal Information'}
                    </h3>
                    <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-0.5">
                      {isPersian
                        ? 'نام، نام کاربری، ایمیل و شماره تماس خود را در اینجا ویرایش نمایید (یکتایی بررسی می‌شود)'
                        : 'Update your name, unique username, email, and phone number'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'نام و نام خانوادگی *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'نام کاربری (یکتا در سیستم) *' : 'Username (Unique) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. john_doe"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-mono font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'آدرس ایمیل (یکتا در سیستم) *' : 'Email Address (Unique) *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold font-sans text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'شماره موبایل' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold font-mono text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Security Card */}
              <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 sm:p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#9f815b]" />
                    <div>
                      <h3 className="text-base font-black text-[#1d241d] dark:text-[#f7f4ee]">
                        {isPersian ? 'تغییر رمز عبور' : 'Change Password'}
                      </h3>
                      <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-0.5">
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
                    className="text-xs font-bold text-[#9f815b] hover:text-[#bfa27a] underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isPersian ? 'رمز فعلی را فراموش کرده‌اید؟' : 'Forgot current password?'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={isPersian ? 'رمز فعلی حساب' : 'Current Password'}
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-sans text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'کلمه عبور جدید' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-sans text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-[#1d241d] dark:text-[#f7f4ee]">
                      {isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-sans text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-6 py-3 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] text-xs font-bold border border-[#e6dcce] dark:border-[#2e3a2e] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] transition-colors"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] text-xs font-black shadow-md shadow-[#9f815b]/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
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
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#9f815b]" />
                <h3 className="font-black text-base">
                  {isPersian ? 'بازنشانی رمز عبور' : 'Reset Password'}
                </h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="space-y-4 text-xs">
                <p className="text-[#73695c] dark:text-[#a69c8e] leading-relaxed">
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
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold text-xs focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-3 rounded-2xl font-black bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{resetLoading ? (isPersian ? 'در حال ارسال...' : 'Sending...') : (isPersian ? 'ارسال کد تایید' : 'Send Code')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
                <p className="text-[#73695c] dark:text-[#a69c8e] leading-relaxed">
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
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono text-center tracking-widest text-sm font-black focus:ring-2 focus:ring-[#bfa27a]"
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
                    className="w-full h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-sans text-xs focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-3 rounded-2xl font-black bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{resetLoading ? (isPersian ? 'در حال تایید...' : 'Verifying...') : (isPersian ? 'تغییر و ثبت رمز جدید' : 'Set New Password')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-4 py-3 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
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
