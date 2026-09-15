'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Crown,
  ShoppingBag,
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
  Send,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Settings,
  Package,
  Eye,
  EyeOff,
  CheckCircle2,
  Award,
  Zap,
  Building,
  Hash,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Textarea,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout, updateUser } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toEnglishDigits, toast, getApiErrorMessage } from '@/common/utils';
import { isoToJalali } from '@/common/utils/date';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
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

  // Password Visibility & Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetIdentifier, setResetIdentifier] = useState(user?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
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

    // Phone validation (11 digits starting with 09)
    const normalizedPhone = toEnglishDigits(phone.trim());
    if (normalizedPhone && !/^09\d{9}$/.test(normalizedPhone)) {
      toast.error(
        isPersian
          ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Mobile number must be 11 digits starting with 09 (e.g. 09123456789).',
      );
      return;
    }

    // Recipient Phone validation (11 digits starting with 09)
    const normalizedRecipientPhone = toEnglishDigits(recipientPhone.trim());
    if (normalizedRecipientPhone && !/^09\d{9}$/.test(normalizedRecipientPhone)) {
      toast.error(
        isPersian
          ? 'شماره تماس تحویل‌گیرنده باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Recipient phone must be 11 digits starting with 09 (e.g. 09123456789).',
      );
      return;
    }

    // Postal Code validation (exactly 10 digits)
    const normalizedPostalCode = toEnglishDigits(postalCode.trim());
    if (normalizedPostalCode && !/^\d{10}$/.test(normalizedPostalCode)) {
      toast.error(
        isPersian
          ? 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.'
          : 'Postal code must be exactly 10 digits.',
      );
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
        phone: normalizedPhone || undefined,
        birthDate: birthDate || null,
        birthDateShamsi: birthDateShamsi || null,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        postalCode: normalizedPostalCode || undefined,
        buildingNumber: buildingNumber.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientPhone: normalizedRecipientPhone || undefined,
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
          <Chip
            size="sm"
            variant="flat"
            color="warning"
            classNames={{
              base: "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[11px] h-6 rounded-xl px-2.5",
            }}
          >
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </Chip>
        );
      case 'shipped':
        return (
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Truck className="w-3.5 h-3.5 shrink-0" />}
            classNames={{
              base: "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-[11px] h-6 rounded-xl px-2.5",
            }}
          >
            {isPersian ? 'تحویل پست شده' : 'Shipped'}
          </Chip>
        );
      case 'delivered':
        return (
          <Chip
            size="sm"
            variant="flat"
            color="success"
            startContent={<CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            classNames={{
              base: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] h-6 rounded-xl px-2.5",
            }}
          >
            {isPersian ? 'تحویل داده شده' : 'Delivered'}
          </Chip>
        );
      case 'cancelled':
        return (
          <Chip
            size="sm"
            variant="flat"
            color="danger"
            classNames={{
              base: "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[11px] h-6 rounded-xl px-2.5",
            }}
          >
            {isPersian ? 'لغو شده' : 'Cancelled'}
          </Chip>
        );
      default:
        return (
          <Chip
            size="sm"
            variant="flat"
            classNames={{
              base: "bg-brand-surface-elevated border border-brand-border text-brand-text-muted font-bold text-[11px] h-6 rounded-xl px-2.5",
            }}
          >
            {isPersian ? 'در انتظار پرداخت' : 'Pending'}
          </Chip>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Column (Right in RTL, Left in LTR) */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="bg-brand-surface rounded-3xl p-5 sm:p-6 border border-brand-border shadow-xs space-y-6">
            {/* User Header in Sidebar */}
            <div className="flex items-center gap-4">
              <Avatar
                name={user.fullName}
                fallback={<User className="w-6 h-6 text-brand-gold" />}
                classNames={{
                  base: "w-14 h-14 bg-gradient-to-br from-[#242c24] to-[#141914] text-brand-gold font-black text-lg border-2 border-brand-gold/30 shadow-md shadow-brand-gold/10 shrink-0 rounded-2xl",
                  name: "font-black text-lg text-brand-gold"
                }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-brand-text truncate">{user.fullName}</h2>
                <div className="text-xs text-brand-text-muted font-bold mt-0.5 truncate">
                  {user.phone ? toPersianDigits(user.phone) : user.email}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {user.isVip ? (
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={<Crown className="w-3 h-3 text-brand-gold shrink-0" />}
                      classNames={{
                        base: "bg-brand-gold/15 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold text-[10px] font-bold h-5.5 rounded-xl px-2",
                        content: "px-0.5"
                      }}
                    >
                      {isPersian ? 'عضو طلایی VIP' : 'Golden VIP'}
                    </Chip>
                  ) : (
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                      classNames={{
                        base: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold h-5.5 rounded-xl px-2",
                        content: "px-0.5"
                      }}
                    >
                      {isPersian ? 'کاربر تایید شده' : 'Verified User'}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="pt-4 border-t border-brand-border space-y-1.5">
              <Button
                type="button"
                variant="light"
                radius="lg"
                onPress={() => setActiveTab('dashboard')}
                className={`w-full h-12 justify-between text-xs font-bold transition-all px-4 rounded-2xl ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-gold/15 text-brand-gold font-black border border-brand-gold/30 shadow-xs'
                    : 'text-brand-text hover:text-brand-gold hover:bg-brand-surface-elevated'
                }`}
                startContent={
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                }
                endContent={
                  isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-40 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                }
              >
                <span className="flex-1 text-start">{isPersian ? 'داشبورد' : 'Dashboard'}</span>
              </Button>

              <Button
                type="button"
                variant="light"
                radius="lg"
                onPress={() => setActiveTab('orders')}
                className={`w-full h-12 justify-between text-xs font-bold transition-all px-4 rounded-2xl ${
                  activeTab === 'orders'
                    ? 'bg-brand-gold/15 text-brand-gold font-black border border-brand-gold/30 shadow-xs'
                    : 'text-brand-text hover:text-brand-gold hover:bg-brand-surface-elevated'
                }`}
                startContent={
                  <Package className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                }
                endContent={
                  <div className="flex items-center gap-2 shrink-0">
                    {orders.length > 0 && (
                      <Chip
                        size="sm"
                        classNames={{
                          base: "bg-brand-gold text-[#141914] font-black text-[10px] h-5 min-w-5 px-1 rounded-lg",
                        }}
                      >
                        {isPersian ? toPersianDigits(orders.length) : orders.length}
                      </Chip>
                    )}
                    {isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-40 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
                  </div>
                }
              >
                <span className="flex-1 text-start">{isPersian ? 'سفارش‌ها' : 'Orders'}</span>
              </Button>

              <Button
                type="button"
                variant="light"
                radius="lg"
                onPress={() => setActiveTab('addresses')}
                className={`w-full h-12 justify-between text-xs font-bold transition-all px-4 rounded-2xl ${
                  activeTab === 'addresses'
                    ? 'bg-brand-gold/15 text-brand-gold font-black border border-brand-gold/30 shadow-xs'
                    : 'text-brand-text hover:text-brand-gold hover:bg-brand-surface-elevated'
                }`}
                startContent={
                  <MapPin className={`w-4 h-4 shrink-0 ${activeTab === 'addresses' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                }
                endContent={
                  isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-40 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                }
              >
                <span className="flex-1 text-start">{isPersian ? 'آدرس‌ها' : 'Addresses'}</span>
              </Button>

              <Button
                type="button"
                variant="light"
                radius="lg"
                onPress={() => setActiveTab('vip')}
                className={`w-full h-12 justify-between text-xs font-bold transition-all px-4 rounded-2xl ${
                  activeTab === 'vip'
                    ? 'bg-brand-gold/15 text-brand-gold font-black border border-brand-gold/30 shadow-xs'
                    : 'text-brand-text hover:text-brand-gold hover:bg-brand-surface-elevated'
                }`}
                startContent={
                  <Crown className={`w-4 h-4 shrink-0 ${activeTab === 'vip' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                }
                endContent={
                  <div className="flex items-center gap-2 shrink-0">
                    {user.isVip && (
                      <Chip
                        size="sm"
                        classNames={{
                          base: "bg-brand-gold/20 text-brand-gold border border-brand-gold/40 font-black text-[10px] h-5 px-1.5 rounded-lg",
                        }}
                      >
                        VIP
                      </Chip>
                    )}
                    {isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-40 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
                  </div>
                }
              >
                <span className="flex-1 text-start">{isPersian ? 'باشگاه VIP' : 'VIP Club'}</span>
              </Button>

              <Button
                type="button"
                variant="light"
                radius="lg"
                onPress={() => setActiveTab('edit')}
                className={`w-full h-12 justify-between text-xs font-bold transition-all px-4 rounded-2xl ${
                  activeTab === 'edit'
                    ? 'bg-brand-gold/15 text-brand-gold font-black border border-brand-gold/30 shadow-xs'
                    : 'text-brand-text hover:text-brand-gold hover:bg-brand-surface-elevated'
                }`}
                startContent={
                  <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'edit' ? 'text-brand-gold' : 'text-brand-bronze'}`} />
                }
                endContent={
                  isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-40 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                }
              >
                <span className="flex-1 text-start">{isPersian ? 'تنظیمات و مشخصات' : 'Settings & Info'}</span>
              </Button>

              {(user.role === 'admin' || user.role === 'editor') && (
                <Button
                  as={Link}
                  href={PATHS.ADMIN_DASHBOARD}
                  variant="flat"
                  radius="lg"
                  className="w-full h-12 justify-between text-xs font-bold transition-all px-4 bg-brand-olive/50 hover:bg-brand-olive text-brand-champagne border border-brand-gold/30 shadow-xs mt-2 rounded-2xl"
                  startContent={<ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />}
                  endContent={
                    isPersian ? <ChevronLeft className="w-3.5 h-3.5 opacity-60 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  }
                >
                  <span className="flex-1 text-start">{user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}</span>
                </Button>
              )}
            </div>

            {/* Logout Link */}
            <div className="pt-3 border-t border-brand-border">
              <Button
                type="button"
                variant="light"
                color="danger"
                radius="lg"
                fullWidth
                onPress={() => {
                  dispatch(logout());
                  router.push(PATHS.HOME);
                }}
                startContent={<LogOut className="w-4 h-4 shrink-0" />}
                className="font-bold text-xs h-11 transition-colors rounded-2xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                {t.nav.logOut}
              </Button>
            </div>
          </Card>
        </aside>

        {/* Main Content Area (Left in RTL, Right in LTR) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Banner (حساب من) */}
              <Card className="bg-gradient-to-r from-brand-surface via-brand-surface-elevated to-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-brand-gold shrink-0" />
                      <span>{isPersian ? 'حساب من' : 'My Account'}</span>
                    </h1>
                    <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">
                      {isPersian
                        ? 'سفارش‌ها، آدرس‌ها و مشخصات کاربری خود را از اینجا مدیریت کنید.'
                        : 'Manage your orders, delivery addresses, and account details from here.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onPress={() => setActiveTab('edit')}
                    radius="lg"
                    size="sm"
                    startContent={<Edit3 className="w-4 h-4 shrink-0" />}
                    className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 transition-all rounded-2xl self-start sm:self-auto cursor-pointer"
                  >
                    {isPersian ? 'ویرایش پروفایل' : 'Edit Profile'}
                  </Button>
                </div>
              </Card>

              {/* Welcome & Account Identity Card */}
              <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={user.fullName}
                      fallback={<User className="w-6 h-6 text-brand-gold" />}
                      classNames={{
                        base: "w-13 h-13 bg-brand-surface-elevated border border-brand-border text-brand-bronze font-black text-base shrink-0 rounded-2xl",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-brand-text-muted">
                        {isPersian ? 'حساب مشتری هاتف آروما' : 'HatefAroma Customer Account'}
                      </div>
                      <h2 className="text-base font-black text-brand-text truncate mt-0.5">
                        {user.fullName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-text-muted font-bold">
                        <span>{user.phone ? toPersianDigits(user.phone) : user.email}</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {isPersian ? 'تأیید شده' : 'Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                      as={Link}
                      href={PATHS.PRODUCTS}
                      variant="flat"
                      radius="lg"
                      size="sm"
                      endContent={isPersian ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      className="bg-brand-surface-elevated hover:bg-brand-border/60 border border-brand-border text-xs font-bold text-brand-text h-10 px-4 rounded-2xl transition-all"
                    >
                      {isPersian ? 'ادامه خرید' : 'Continue Shopping'}
                    </Button>

                    {user.isVip ? (
                      <Chip
                        size="md"
                        variant="flat"
                        startContent={<Crown className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                        classNames={{
                          base: "bg-[#181f18] text-brand-gold border border-brand-gold/30 text-xs font-black h-10 px-3.5 rounded-2xl shadow-xs",
                          content: "px-1 font-black"
                        }}
                      >
                        {isPersian ? 'عضو باشگاه طلایی' : 'VIP Member'}
                      </Chip>
                    ) : (
                      <Button
                        as={Link}
                        href={PATHS.VIP}
                        radius="lg"
                        size="sm"
                        startContent={<Crown className="w-3.5 h-3.5 text-[#141914] shrink-0" />}
                        className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black h-10 px-4 rounded-2xl shadow-md shadow-brand-gold/20 transition-all"
                      >
                        {isPersian ? 'عضویت در VIP' : 'Join VIP Club'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Summary Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Orders Metric */}
                <Card
                  isPressable
                  onPress={() => setActiveTab('orders')}
                  className="bg-brand-surface rounded-3xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer"
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-text-muted font-bold block">
                        {isPersian ? 'سفارش‌ها' : 'Orders'}
                      </span>
                      <span className="text-2xl font-black text-brand-text mt-1 block">
                        {isPersian ? toPersianDigits(orders.length) : orders.length}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                {/* Address Metric */}
                <Card
                  isPressable
                  onPress={() => setActiveTab('addresses')}
                  className="bg-brand-surface rounded-3xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer"
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pl-2">
                      <span className="text-xs text-brand-text-muted font-bold block">
                        {isPersian ? 'آدرس‌ها' : 'Addresses'}
                      </span>
                      <span className="text-sm font-black text-brand-text mt-1 block truncate">
                        {user.city ? `${user.city}` : (isPersian ? 'نشانی ثبت نشده' : 'Not set')}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                {/* VIP Status Metric */}
                <Card
                  isPressable
                  onPress={() => setActiveTab('vip')}
                  className="bg-brand-surface rounded-3xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group sm:col-span-2 lg:col-span-1 cursor-pointer"
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-text-muted font-bold block">
                        {isPersian ? 'باشگاه VIP' : 'VIP Club'}
                      </span>
                      <span className="text-sm font-black text-brand-text mt-1 block">
                        {user.isVip ? (isPersian ? 'عضو طلایی' : 'VIP Member') : (isPersian ? 'کاربر عادی' : 'Standard')}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center text-brand-bronze group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs shrink-0">
                      <Crown className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Access Section (دسترسی‌های سریع) */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                  <h3 className="text-sm font-black text-brand-text">{isPersian ? 'دسترسی‌های سریع' : 'Quick Access'}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quick 1: Orders */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab('orders')}
                    className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer text-start overflow-hidden"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-black text-brand-text leading-snug">
                          {isPersian ? 'سفارش‌ها' : 'Orders'}
                        </h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed">
                          {isPersian ? 'وضعیت پرداخت، تأمین و پیگیری تحویل سفارش‌ها' : 'View order tracking, payment and delivery'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 2: Addresses */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab('addresses')}
                    className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer text-start overflow-hidden"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-black text-brand-text leading-snug">
                          {isPersian ? 'آدرس‌ها' : 'Addresses'}
                        </h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed">
                          {isPersian ? 'نشانی‌های تحویل، پلاک و گیرنده را مدیریت کنید' : 'Manage delivery addresses, postal codes and contacts'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 3: Account Info */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab('edit')}
                    className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer text-start overflow-hidden"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-black text-brand-text leading-snug">
                          {isPersian ? 'اطلاعات حساب' : 'Account Info'}
                        </h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed">
                          {isPersian ? 'ویرایش مشخصات فردی، تاریخ تولد و امنیت حساب' : 'Update name, date of birth, contact and passwords'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 4: VIP Club */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab('vip')}
                    className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group cursor-pointer text-start overflow-hidden"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated text-brand-bronze flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-[#141914] transition-all shadow-xs">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-black text-brand-text leading-snug">
                          {isPersian ? 'باشگاه مشتریان VIP' : 'VIP Club'}
                        </h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed">
                          {isPersian ? 'تخفیف‌های دائمی، هدیه تولد و ارسال رایگان سفارش‌ها' : 'Permanent discounts, birthday gifts and free delivery'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 5: Admin / Editor Panel (if applicable) */}
                  {(user.role === 'admin' || user.role === 'editor') && (
                    <Card
                      as={Link}
                      href={PATHS.ADMIN_DASHBOARD}
                      isPressable
                      className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-gold/60 shadow-xs transition-all group sm:col-span-2 cursor-pointer text-start overflow-hidden"
                    >
                      <div className="p-5 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-olive text-brand-gold flex items-center justify-center shrink-0 shadow-xs">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h4 className="text-sm font-black text-brand-text leading-snug">
                            {user.role === 'admin' ? t.nav.adminPanel : t.nav.editorPanel}
                          </h4>
                          <p className="text-xs text-brand-text-muted leading-relaxed">
                            {isPersian
                              ? 'مدیریت محصولات، سفارش‌ها، دسته‌بندی‌ها و گزارش‌های سیستم'
                              : 'Manage products, orders, categories, and system reports'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS TAB */}
          {activeTab === 'orders' && (
            <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      radius="lg"
                      onPress={() => setActiveTab('dashboard')}
                      aria-label="Back to Dashboard"
                      className="bg-brand-surface-elevated hover:bg-brand-border text-brand-text border border-brand-border transition-colors rounded-2xl cursor-pointer"
                    >
                      {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </Button>
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
                      <Skeleton key={i} className="h-28 rounded-2xl bg-brand-surface-elevated" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-brand-text-muted space-y-4">
                    <ShoppingBag className="w-12 h-12 text-brand-bronze mx-auto opacity-40" />
                    <p className="text-sm font-bold">{t.profile.emptyOrders}</p>
                    <Button
                      as={Link}
                      href={PATHS.PRODUCTS}
                      radius="lg"
                      className="h-11 px-7 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl transition-all"
                    >
                      {t.home.curatedPicks}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {orders.map((order) => (
                      <Card
                        key={order._id}
                        className="bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/50 rounded-2xl shadow-none transition-all"
                      >
                        <div className="p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-brand-text">
                                {t.profile.orderNum} {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="text-xs text-brand-text-muted font-bold">
                              {new Date(order.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                            </div>
                          </div>

                          {order.trackingCode && (
                            <div className="px-4 py-2.5 rounded-xl bg-brand-surface text-xs text-brand-bronze border border-brand-border flex items-center justify-between">
                              <span className="font-bold">{t.profile.trackingCode}</span>
                              <span className="font-bold text-brand-text">{toPersianDigits(order.trackingCode)}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-brand-border flex items-center justify-between text-xs">
                            <span className="text-brand-text-muted font-bold">
                              {t.profile.itemsCount(isPersian ? toPersianDigits(order.items?.length || 0) : (order.items?.length || 0))}
                            </span>
                            <span className="font-black text-sm text-brand-text">
                              {formatToman(order.total, isPersian)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* TAB 3: ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <Card
                classNames={{ base: "!overflow-visible overflow-visible card-overflow-visible relative z-30" }}
                className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs !overflow-visible overflow-visible card-overflow-visible relative z-30"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        radius="lg"
                        onPress={() => setActiveTab('dashboard')}
                        aria-label="Back to Dashboard"
                        className="bg-brand-surface-elevated hover:bg-brand-border text-brand-text border border-brand-border transition-colors rounded-2xl cursor-pointer"
                      >
                        {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      </Button>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Province & City Selectors */}
                    <div className="sm:col-span-2">
                      <ProvinceCitySelect
                        province={province}
                        city={city}
                        onChangeProvince={setProvince}
                        onChangeCity={setCity}
                      />
                    </div>

                    {/* Address Textarea */}
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <MapPin className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'نشانی پستی دقیق' : 'Full Street Address'}
                        </label>
                      </div>
                      <Textarea
                        aria-label={isPersian ? 'نشانی پستی دقیق' : 'Full Street Address'}
                        placeholder={isPersian ? 'خیابان، کوچه، پلاک...' : 'Street address, alley, details'}
                        minRows={3}
                        value={address}
                        onValueChange={setAddress}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "p-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text leading-relaxed",
                        }}
                      />
                    </div>

                    {/* Postal Code (10 digits) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'کد پستی (۱۰ رقمی)' : 'Postal / Zip Code (10 digits)'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'کد پستی (۱۰ رقمی)' : 'Postal / Zip Code (10 digits)'}
                        placeholder="1234567890"
                        maxLength={10}
                        value={postalCode}
                        onValueChange={(val) => setPostalCode(toEnglishDigits(val))}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-bold text-brand-text tracking-widest text-start",
                        }}
                      />
                    </div>

                    {/* Building Number (Plaque) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Building className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'پلاک' : 'Plaque / Building Number'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'پلاک' : 'Plaque'}
                        placeholder={isPersian ? 'مثال: ۱۲' : 'e.g. 12'}
                        value={buildingNumber}
                        onValueChange={setBuildingNumber}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-bold text-brand-text text-start",
                        }}
                      />
                    </div>

                    {/* Recipient Name */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                        placeholder={isPersian ? 'نام تحویل‌گیرنده' : 'Recipient Name'}
                        value={recipientName}
                        onValueChange={setRecipientName}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>

                    {/* Recipient Phone */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
                        placeholder="09123456789"
                        type="tel"
                        maxLength={11}
                        value={recipientPhone}
                        onValueChange={(val) => setRecipientPhone(toEnglishDigits(val))}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-bold text-brand-text text-start",
                        }}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                    <Button
                      type="submit"
                      isLoading={saving}
                      radius="lg"
                      startContent={!saving && <Save className="w-4 h-4 shrink-0" />}
                      className="h-11 px-8 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 transition-all rounded-2xl cursor-pointer"
                    >
                      {saving
                        ? isPersian ? 'در حال ذخیره‌سازی...' : 'Saving...'
                        : isPersian ? 'ذخیره نشانی تحویل' : 'Save Address'}
                    </Button>
                  </div>
                </div>
              </Card>
            </form>
          )}

          {/* TAB 4: EDIT PROFILE & SECURITY TAB */}
          {activeTab === 'edit' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Personal Details Card */}
              <Card
                classNames={{ base: "!overflow-visible overflow-visible card-overflow-visible relative z-30" }}
                className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs !overflow-visible overflow-visible card-overflow-visible relative z-30"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        radius="lg"
                        onPress={() => setActiveTab('dashboard')}
                        aria-label="Back to Dashboard"
                        className="bg-brand-surface-elevated hover:bg-brand-border text-brand-text border border-brand-border transition-colors rounded-2xl cursor-pointer"
                      >
                        {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      </Button>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                        </label>
                        <span className="text-rose-500 font-bold text-xs">*</span>
                      </div>
                      <Input
                        aria-label={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                        placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                        value={fullName}
                        onValueChange={setFullName}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'نام کاربری (یکتا در سیستم)' : 'Username (Unique)'}
                        </label>
                        <span className="text-rose-500 font-bold text-xs">*</span>
                      </div>
                      <Input
                        aria-label={isPersian ? 'نام کاربری (یکتا در سیستم)' : 'Username (Unique)'}
                        placeholder="e.g. john_doe"
                        value={username}
                        onValueChange={setUsername}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-bold text-brand-text text-start",
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'آدرس ایمیل (یکتا در سیستم)' : 'Email Address (Unique)'}
                        </label>
                        <span className="text-rose-500 font-bold text-xs">*</span>
                      </div>
                      <Input
                        type="email"
                        aria-label={isPersian ? 'آدرس ایمیل (یکتا در سیستم)' : 'Email Address (Unique)'}
                        placeholder="user@example.com"
                        value={email}
                        onValueChange={setEmail}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text text-start",
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'شماره موبایل' : 'Phone Number'}
                        </label>
                      </div>
                      <Input
                        type="tel"
                        aria-label={isPersian ? 'شماره موبایل' : 'Phone Number'}
                        placeholder="09123456789"
                        maxLength={11}
                        value={phone}
                        onValueChange={(val) => setPhone(toEnglishDigits(val))}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-bold text-brand-text text-start",
                        }}
                      />
                    </div>
                  </div>

                  {/* Date of Birth Picker Component with Golden Ratio */}
                  <div className="pt-4 border-t border-brand-border">
                    <BirthDatePicker
                      value={birthDate}
                      onChange={handleBirthDateChange}
                      label={isPersian ? 'تاریخ تولد (شمسی و میلادی)' : 'Date of Birth (Solar & Gregorian)'}
                    />
                  </div>
                </div>
              </Card>

              {/* Password & Security Card */}
              <Card
                classNames={{ base: "relative z-10" }}
                className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs relative z-10"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
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

                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      radius="lg"
                      onPress={() => {
                        setResetModalOpen(true);
                        setResetStep(1);
                      }}
                      startContent={<HelpCircle className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />}
                      className="text-xs font-bold text-brand-bronze dark:text-brand-gold hover:underline p-0 h-auto cursor-pointer"
                    >
                      {isPersian ? 'رمز فعلی را فراموش کرده‌اید؟' : 'Forgot current password?'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text truncate">
                          {isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                        </label>
                      </div>
                      <Input
                        key={`curr-pwd-${showCurrentPassword ? 'text' : 'password'}`}
                        type={showCurrentPassword ? 'text' : 'password'}
                        aria-label={isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                        placeholder={isPersian ? 'رمز عبور فعلی حساب' : 'Current password'}
                        value={currentPassword}
                        onValueChange={setCurrentPassword}
                        variant="bordered"
                        radius="lg"
                        endContent={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowCurrentPassword((prev) => !prev);
                            }}
                            className="text-brand-text-muted hover:text-brand-gold focus:outline-none cursor-pointer p-1 relative z-10"
                            aria-label="Toggle password visibility"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4 pointer-events-none" />
                            ) : (
                              <Eye className="w-4 h-4 pointer-events-none" />
                            )}
                          </button>
                        }
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text truncate">
                          {isPersian ? 'کلمه عبور جدید' : 'New Password'}
                        </label>
                      </div>
                      <Input
                        key={`new-pwd-${showNewPassword ? 'text' : 'password'}`}
                        type={showNewPassword ? 'text' : 'password'}
                        aria-label={isPersian ? 'کلمه عبور جدید' : 'New Password'}
                        placeholder={isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New password (min 6 chars)'}
                        value={newPassword}
                        onValueChange={setNewPassword}
                        variant="bordered"
                        radius="lg"
                        endContent={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowNewPassword((prev) => !prev);
                            }}
                            className="text-brand-text-muted hover:text-brand-gold focus:outline-none cursor-pointer p-1 relative z-10"
                            aria-label="Toggle password visibility"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4 pointer-events-none" />
                            ) : (
                              <Eye className="w-4 h-4 pointer-events-none" />
                            )}
                          </button>
                        }
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text truncate">
                          {isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password'}
                        </label>
                      </div>
                      <Input
                        key={`conf-pwd-${showConfirmPassword ? 'text' : 'password'}`}
                        type={showConfirmPassword ? 'text' : 'password'}
                        aria-label={isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password'}
                        placeholder={isPersian ? 'تکرار رمز عبور جدید' : 'Confirm new password'}
                        value={confirmPassword}
                        onValueChange={setConfirmPassword}
                        variant="bordered"
                        radius="lg"
                        endContent={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowConfirmPassword((prev) => !prev);
                            }}
                            className="text-brand-text-muted hover:text-brand-gold focus:outline-none cursor-pointer p-1 relative z-10"
                            aria-label="Toggle password visibility"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4 pointer-events-none" />
                            ) : (
                              <Eye className="w-4 h-4 pointer-events-none" />
                            )}
                          </button>
                        }
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="flat"
                  radius="lg"
                  onPress={() => setActiveTab('dashboard')}
                  className="h-11 px-6 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>

                <Button
                  type="submit"
                  isLoading={saving}
                  radius="lg"
                  startContent={!saving && <Save className="w-4 h-4 shrink-0" />}
                  className="h-11 px-8 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 transition-all rounded-2xl cursor-pointer"
                >
                  {saving
                    ? isPersian ? 'در حال ذخیره‌سازی...' : 'Saving Changes...'
                    : isPersian ? 'ذخیره تغییرات' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 5: VIP CLUB LOUNGE TAB */}
          {activeTab === 'vip' && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#1c241c] via-[#141914] to-[#0d120d] border-2 border-brand-gold/40 shadow-2xl rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="p-6 sm:p-10 space-y-8 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold to-[#997a4d] text-[#141914] flex items-center justify-center shadow-xl shadow-brand-gold/25 shrink-0">
                        <Crown className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-brand-gold">
                            {isPersian ? 'باشگاه مشتریان VIP هاتف آروما' : 'HatefAroma VIP Club'}
                          </h2>
                          <Chip
                            size="sm"
                            classNames={{
                              base: "bg-brand-gold text-[#141914] font-black text-[10px] h-5 px-2 rounded-lg shadow-xs",
                            }}
                          >
                            LUXURY
                          </Chip>
                        </div>
                        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                          {isPersian
                            ? 'تجربه اصالت، پرستیژ و امتیازات اختصاصی برای مشتریان برگزیده عطر هاتف'
                            : 'Exclusive prestige privileges for distinguished Hatef Aroma patrons'}
                        </p>
                      </div>
                    </div>

                    <Button
                      as={Link}
                      href={PATHS.VIP}
                      radius="lg"
                      size="sm"
                      startContent={<Crown className="w-4 h-4 text-[#141914] shrink-0" />}
                      className="h-11 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/25 rounded-2xl shrink-0 cursor-pointer"
                    >
                      {isPersian ? 'مشاهده و ارتقای طرح‌های VIP' : 'Explore VIP Plans'}
                    </Button>
                  </div>

                  {/* Privilege Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-5 rounded-2xl bg-[#182018]/80 border border-brand-gold/20 backdrop-blur-md space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-brand-text">
                          {isPersian ? 'تخفیف دائمی روی تمام محصولات' : 'Permanent Exclusive Discount'}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'در تمام خریدهای خود از تخفیف ویژه ۵ الی ۱۵ درصدی بدون محدودیت زمانی بهره‌مند شوید.'
                          : 'Enjoy special 5% to 15% discount across all products with no expiry.'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#182018]/80 border border-brand-gold/20 backdrop-blur-md space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-brand-text">
                          {isPersian ? 'ارسال رایگان بدون سقف سفارش' : 'Free Express Delivery'}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'تمام سفارش‌های شما با بسته‌بندی لوکس هدیه و به صورت رایگان ارسال خواهد شد.'
                          : 'Complimentary white-glove shipping on all orders nationwide.'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#182018]/80 border border-brand-gold/20 backdrop-blur-md space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-brand-text">
                          {isPersian ? 'هدیه نفیس سالروز تولد' : 'Prestige Birthday Gift'}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'در روز تولدتان، یک بسته عطر مسافرتی لوکس به عنوان شادباش برای شما ارسال می‌گردد.'
                          : 'A bespoke luxury travel fragrance delivered to celebrate your special day.'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#182018]/80 border border-brand-gold/20 backdrop-blur-md space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-brand-text">
                          {isPersian ? 'مشاور اختصاصی رایحه' : 'Personal Fragrance Sommelier'}
                        </h4>
                      </div>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'مشاوره اختصاصی انتخاب عطر متناسب با سبک پوشش، فصل و موقعیت‌های خاص شما.'
                          : 'Dedicated 24/7 scent styling and tailored recommendations.'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Forgot / Reset Password HeroUI Modal */}
      <Modal
        isOpen={resetModalOpen}
        onOpenChange={setResetModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-md mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-5",
          footer: "border-t border-brand-border pt-3",
          closeButton: "hover:bg-brand-surface-elevated text-brand-text-muted rounded-xl cursor-pointer",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-brand-text">
                  {isPersian ? 'بازنشانی رمز عبور' : 'Reset Password'}
                </h3>
              </ModalHeader>

              {resetStep === 1 ? (
                <form onSubmit={handleSendResetCode}>
                  <ModalBody className="space-y-4">
                    <p className="text-xs text-brand-text-muted leading-relaxed">
                      {isPersian
                        ? 'جهت بازیابی رمز عبور، ایمیل یا نام کاربری حساب خود را وارد کنید تا کد تایید برای شما ارسال شود:'
                        : 'Enter your account email or username to receive a 6-digit password reset code:'}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'ایمیل یا نام کاربری' : 'Email or Username'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'ایمیل یا نام کاربری' : 'Email or Username'}
                        placeholder="user@example.com / username"
                        value={resetIdentifier}
                        onValueChange={setResetIdentifier}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text text-start",
                        }}
                      />
                    </div>
                  </ModalBody>

                  <ModalFooter className="flex gap-2.5">
                    <Button
                      type="submit"
                      isLoading={resetLoading}
                      radius="lg"
                      startContent={!resetLoading && <Send className="w-4 h-4 shrink-0" />}
                      className="flex-1 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer"
                    >
                      {resetLoading ? (isPersian ? 'در حال ارسال...' : 'Sending...') : (isPersian ? 'ارسال کد تایید' : 'Send Code')}
                    </Button>
                    <Button
                      type="button"
                      variant="flat"
                      radius="lg"
                      onPress={onClose}
                      className="h-11 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                    >
                      {isPersian ? 'انصراف' : 'Cancel'}
                    </Button>
                  </ModalFooter>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset}>
                  <ModalBody className="space-y-4">
                    <p className="text-xs text-brand-text-muted leading-relaxed">
                      {isPersian
                        ? `کد تایید ۶ رقمی به آدرس ${maskedEmail} ارسال شد. لطفاً کد را وارد کرده و رمز جدید خود را تعیین کنید:`
                        : `A 6-digit code was sent to ${maskedEmail}. Please enter the code and set your new password:`}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'کد تایید ۶ رقمی' : '6-Digit Verification Code'}
                        </label>
                      </div>
                      <Input
                        aria-label={isPersian ? 'کد تایید ۶ رقمی' : '6-Digit Verification Code'}
                        placeholder="123456"
                        value={resetCode}
                        onValueChange={setResetCode}
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-center tracking-widest text-sm font-black text-brand-text",
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New Password (min 6 chars)'}
                        </label>
                      </div>
                      <Input
                        key={`reset-pwd-${showResetNewPassword ? 'text' : 'password'}`}
                        type={showResetNewPassword ? 'text' : 'password'}
                        aria-label={isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New Password (min 6 chars)'}
                        placeholder={isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New password (min 6 chars)'}
                        value={resetNewPassword}
                        onValueChange={setResetNewPassword}
                        variant="bordered"
                        radius="lg"
                        endContent={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowResetNewPassword((prev) => !prev);
                            }}
                            className="text-brand-text-muted hover:text-brand-gold focus:outline-none cursor-pointer p-1 relative z-10"
                            aria-label="Toggle password visibility"
                          >
                            {showResetNewPassword ? (
                              <EyeOff className="w-4 h-4 pointer-events-none" />
                            ) : (
                              <Eye className="w-4 h-4 pointer-events-none" />
                            )}
                          </button>
                        }
                        classNames={{
                          inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-xs font-semibold text-brand-text",
                        }}
                      />
                    </div>
                  </ModalBody>

                  <ModalFooter className="flex gap-2.5">
                    <Button
                      type="submit"
                      isLoading={resetLoading}
                      radius="lg"
                      startContent={!resetLoading && <Check className="w-4 h-4 shrink-0" />}
                      className="flex-1 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer"
                    >
                      {resetLoading ? (isPersian ? 'در حال تایید...' : 'Verifying...') : (isPersian ? 'تغییر و ثبت رمز جدید' : 'Set New Password')}
                    </Button>
                    <Button
                      type="button"
                      variant="flat"
                      radius="lg"
                      onPress={() => setResetStep(1)}
                      className="h-11 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                    >
                      {isPersian ? 'مرحله قبل' : 'Back'}
                    </Button>
                  </ModalFooter>
                </form>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
