'use client';

import { Input, Textarea } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderDetailsPanel } from '@/components/common/OrderDetailsPanel';
import {
  useRouter } from 'next/navigation';
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
  CheckCircle2,
  Award,
  Zap,
  Building,
  Hash,
  FileText,
  Smartphone,
  RotateCcw,
  Clock,
  Calendar,
  AtSign,
  Shield,
  X,
  Plus,
  Trash2,
  } from 'lucide-react';
import {
  Card,
  Button,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  Checkbox,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { logout, updateUser, fetchProfile } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toEnglishDigits, toast, getApiErrorMessage } from '@/common/utils';
import { isoToJalali } from '@/common/utils/date';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { PasswordInput } from '@/components/common/PasswordInput';
import { ResetPasswordModal } from '@/components/common/ResetPasswordModal';
import { IOrder, IUserAddress } from '@/common/interfaces';
import axiosInstance from '@/common/axiosInstance';
import { useTranslation } from '@/common/i18n';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';

const VALID_TABS = ['dashboard', 'orders', 'addresses', 'edit', 'vip'] as const;
type TabType = (typeof VALID_TABS)[number];

const getInitialProfileTab = (): TabType => {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const hash = window.location.hash.replace(/^#/, '').toLowerCase() as TabType;
    if (VALID_TABS.includes(hash)) return hash;
    if (hash === ('settings' as any)) return 'edit';

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase() as TabType;
    if (VALID_TABS.includes(tabParam)) return tabParam;
    if (tabParam === ('settings' as any)) return 'edit';

    const saved = localStorage.getItem('hatef_profile_tab')?.toLowerCase() as TabType;
    if (VALID_TABS.includes(saved)) return saved;
  } catch {
    // ignore
  }
  return 'dashboard';
};

export function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>(() => getInitialProfileTab());

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditing(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hatef_profile_tab', tab);
        window.history.replaceState(null, '', `#${tab}`);
      } catch {
        // ignore
      }
    }
  };

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Edit Profile Mode & Form State
  const [isEditing, setIsEditing] = useState(false);
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
  const [recipientName, setRecipientName] = useState(user?.recipientName || user?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.recipientPhone || user?.phone || '');
  const [recipientEmail, setRecipientEmail] = useState(user?.recipientEmail || user?.email || '');
  const [addressNotes, setAddressNotes] = useState(user?.addressNotes || '');

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

  // Phone Verification Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [verifyPhoneStep, setVerifyPhoneStep] = useState<'phone' | 'verify'>('phone');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [verifyPhoneError, setVerifyPhoneError] = useState('');
  const [verifyOtpCode, setVerifyOtpCode] = useState('');
  const [verifyOtpCodeError, setVerifyOtpCodeError] = useState('');
  const [verifyDevCode, setVerifyDevCode] = useState<string | null>(null);
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const [loadingSendVerifyOtp, setLoadingSendVerifyOtp] = useState(false);
  const [loadingSubmitVerifyOtp, setLoadingSubmitVerifyOtp] = useState(false);

  // Phone verification countdown timer
  useEffect(() => {
    if (verifyCountdown <= 0) return;
    const timer = setInterval(() => {
      setVerifyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyCountdown]);

  const formatOtpTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return isPersian ? toPersianDigits(formatted) : formatted;
  };

  // ==========================================
  // Address Management State & Handlers
  // ==========================================
  const [addresses, setAddresses] = useState<IUserAddress[]>(user?.addresses || []);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IUserAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    province: 'تهران',
    city: 'تهران',
    address: '',
    postalCode: '',
    buildingNumber: '',
    unit: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    addressNotes: '',
    isDefault: false,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<IUserAddress | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user?.addresses]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await axiosInstance.get('/users/addresses');
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [isAuthenticated, activeTab]);

  const handleOpenCreateAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      title: '',
      province: 'تهران',
      city: 'تهران',
      address: '',
      postalCode: '',
      buildingNumber: '',
      unit: '',
      recipientName: user?.fullName || '',
      recipientPhone: user?.phone || '',
      recipientEmail: user?.email || '',
      addressNotes: '',
      isDefault: addresses.length === 0,
    });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: IUserAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      title: addr.title || '',
      province: addr.province || 'تهران',
      city: addr.city || 'تهران',
      address: addr.address || '',
      postalCode: addr.postalCode || '',
      buildingNumber: addr.buildingNumber || '',
      unit: addr.unit || '',
      recipientName: addr.recipientName || '',
      recipientPhone: addr.recipientPhone || '',
      recipientEmail: addr.recipientEmail || '',
      addressNotes: addr.addressNotes || '',
      isDefault: addr.isDefault || false,
    });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    const addressTitle = addressForm.title.trim().replace(/\s+/g, ' ');
    const addressTitleKey = addressTitle.toLowerCase();
    if (!addressTitle) {
      errors.title = isPersian ? 'عنوان نشانی الزامی است.' : 'Address title is required.';
    } else if (
      addresses.some(
        (address) =>
          address._id !== editingAddress?._id &&
          (address.title || '').trim().replace(/\s+/g, ' ').toLowerCase() === addressTitleKey,
      )
    ) {
      errors.title = isPersian
        ? 'این عنوان برای یکی دیگر از نشانی‌های شما ثبت شده است.'
        : 'You already use this title for another address.';
    }

    if (!addressForm.recipientName.trim()) {
      errors.recipientName = isPersian ? 'نام و نام خانوادگی تحویل‌گیرنده الزامی است.' : 'Recipient full name is required.';
    }

    const cleanPhone = toEnglishDigits(addressForm.recipientPhone).trim();
    if (!cleanPhone) {
      errors.recipientPhone = isPersian ? 'شماره تماس تحویل‌گیرنده الزامی است.' : 'Phone number is required.';
    } else if (!/^09\d{9}$/.test(cleanPhone)) {
      errors.recipientPhone = isPersian ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود.' : 'Phone must be 11 digits starting with 09.';
    }

    if (!addressForm.province.trim()) {
      errors.province = isPersian ? 'انتخاب استان الزامی است.' : 'Province is required.';
    }
    if (!addressForm.city.trim()) {
      errors.city = isPersian ? 'انتخاب شهر الزامی است.' : 'City is required.';
    }

    if (!addressForm.address.trim()) {
      errors.address = isPersian ? 'نشانی دقیق پستی الزامی است.' : 'Full street address is required.';
    }

    const cleanPostal = toEnglishDigits(addressForm.postalCode).trim();
    if (cleanPostal && cleanPostal.length !== 10) {
      errors.postalCode = isPersian ? 'کد پستی باید ۱۰ رقم باشد.' : 'Postal code must be 10 digits.';
    }

    const cleanEmail = addressForm.recipientEmail.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.recipientEmail = isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email format.';
    }

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});

    setSavingAddress(true);
    try {
      const payload = {
        title: addressTitle,
        province: addressForm.province.trim(),
        city: addressForm.city.trim(),
        address: addressForm.address.trim(),
        postalCode: cleanPostal || undefined,
        buildingNumber: addressForm.buildingNumber.trim() || undefined,
        unit: addressForm.unit.trim() || undefined,
        recipientName: addressForm.recipientName.trim(),
        recipientPhone: cleanPhone,
        recipientEmail: cleanEmail || undefined,
        addressNotes: addressForm.addressNotes.trim() || undefined,
        isDefault: addressForm.isDefault,
      };

      let res;
      if (editingAddress) {
        res = await axiosInstance.patch(`/users/addresses/${editingAddress._id}`, payload);
      } else {
        res = await axiosInstance.post('/users/addresses', payload);
      }

      if (res.data?.addresses) {
        setAddresses(res.data.addresses);
      }
      dispatch(fetchProfile());
      setIsAddressModalOpen(false);
      toast.success(
        res.data?.message ||
        (isPersian
          ? editingAddress ? 'نشانی با موفقیت ویرایش شد.' : 'نشانی جدید با موفقیت ذخیره شد.'
          : 'Address saved successfully.')
      );
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setSavingAddress(false);
    }
  };

  const openDeleteModal = (addr: IUserAddress) => {
    setAddressToDelete(addr);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    const addrId = addressToDelete._id;
    setDeletingAddressId(addrId);
    try {
      const res = await axiosInstance.delete(`/users/addresses/${addrId}`);
      if (res.data?.addresses) {
        setAddresses(res.data.addresses);
      }
      dispatch(fetchProfile());
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
      toast.success(res.data?.message || (isPersian ? 'نشانی با موفقیت حذف شد.' : 'Address deleted.'));
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    setSettingDefaultId(addrId);
    try {
      const res = await axiosInstance.patch(`/users/addresses/${addrId}/default`);
      if (res.data?.addresses) {
        setAddresses(res.data.addresses);
      }
      dispatch(fetchProfile());
      toast.success(res.data?.message || (isPersian ? 'نشانی پیش‌فرض با موفقیت ثبت شد.' : 'Default address set.'));
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, isPersian));
    } finally {
      setSettingDefaultId(null);
    }
  };

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
      setRecipientName(user.recipientName || user.fullName || '');
      setRecipientPhone(user.recipientPhone || user.phone || '');
      setRecipientEmail(user.recipientEmail || user.email || '');
      setAddressNotes(user.addressNotes || '');
    }
  }, [user]);

  useEffect(() => {
    const initial = getInitialProfileTab();
    if (initial !== activeTab) {
      setActiveTab(initial);
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace(/^#/, '').toLowerCase() as TabType;
      if (VALID_TABS.includes(currentHash)) {
        setActiveTab(currentHash);
        setIsEditing(false);
      } else if (currentHash === ('settings' as any)) {
        setActiveTab('edit');
        setIsEditing(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setIsEditing(false);
  }, [activeTab]);

  const handleCancelEdit = () => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBirthDate(user.birthDate || '');
      setBirthDateShamsi(user.birthDateShamsi || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsEditing(false);
  };

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

    dispatch(fetchProfile());

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

    // Email validation (optional)
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(
        isPersian
          ? 'فرمت آدرس ایمیل نامعتبر است.'
          : 'Invalid email address format.',
      );
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

    // Postal Code validation (optional, exactly 10 digits if provided)
    const normalizedPostalCode = toEnglishDigits(postalCode.trim());
    if (normalizedPostalCode && !/^\d{10}$/.test(normalizedPostalCode)) {
      toast.error(
        isPersian
          ? 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.'
          : 'Postal code must be exactly 10 digits.',
      );
      return;
    }

    // Recipient Email validation (optional, valid format if provided)
    const trimmedRecipientEmail = recipientEmail.trim().toLowerCase();
    if (trimmedRecipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipientEmail)) {
      toast.error(
        isPersian
          ? 'فرمت ایمیل تحویل‌گیرنده نامعتبر است.'
          : 'Invalid recipient email format.',
      );
      return;
    }

    const hasExistingPassword = user?.hasPassword ?? false;

    if (newPassword) {
      if (hasExistingPassword && !currentPassword) {
        toast.error(
          isPersian
            ? 'برای تغییر رمز عبور، وارد کردن کلمه عبور فعلی الزامی است.'
            : 'Current password is required to change password.',
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
        email: trimmedEmail || '',
        birthDate: birthDate || null,
        birthDateShamsi: birthDateShamsi || null,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        postalCode: normalizedPostalCode || undefined,
        buildingNumber: buildingNumber.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientPhone: normalizedRecipientPhone || undefined,
        recipientEmail: trimmedRecipientEmail || undefined,
        addressNotes: addressNotes.trim() || undefined,
      };

      if (newPassword) {
        if (hasExistingPassword && currentPassword) {
          payload.currentPassword = currentPassword;
        }
        payload.password = newPassword;
      }

      const res = await axiosInstance.patch('/users/profile', payload);
      dispatch(updateUser(res.data));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
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



  const handleOpenPhoneVerification = (targetPhone?: string) => {
    const defaultNumber = targetPhone || phone || user?.phone || '';
    setVerifyPhoneInput(defaultNumber);
    setVerifyPhoneError('');
    setVerifyOtpCode('');
    setVerifyOtpCodeError('');
    setVerifyDevCode(null);
    setVerifyPhoneStep('phone');
    setIsPhoneModalOpen(true);
  };

  const handleSendPhoneOtp = async () => {
    const cleanNumber = toEnglishDigits(verifyPhoneInput.trim()).replace(/\D/g, '');

    if (!cleanNumber) {
      setVerifyPhoneError(isPersian ? 'شماره موبایل الزامی است.' : 'Phone number is required.');
      return;
    }

    if (!cleanNumber.startsWith('09') || cleanNumber.length !== 11) {
      setVerifyPhoneError(
        isPersian
          ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Phone number must be 11 digits starting with 09 (e.g. 09123456789).',
      );
      return;
    }

    setVerifyPhoneError('');
    setLoadingSendVerifyOtp(true);
    try {
      const res = await axiosInstance.post('/auth/otp/send', {
        phone: cleanNumber,
        purpose: 'verify-phone',
      });

      if (res.data?.devCode) {
        setVerifyDevCode(res.data.devCode);
      }
      setVerifyCountdown(res.data?.expiresIn || 120);
      setVerifyPhoneStep('verify');
      setVerifyOtpCode('');
      setVerifyOtpCodeError('');

      toast.success(
        isPersian
          ? res.data.message || 'کد تایید یکبار مصرف ارسال شد.'
          : 'Verification code generated successfully.',
      );
    } catch (err: any) {
      const serverMsg = getApiErrorMessage(err);
      toast.error(
        serverMsg || (isPersian ? 'خطا در ارسال کد تایید یکبار مصرف.' : 'Failed to send verification code.'),
      );
    } finally {
      setLoadingSendVerifyOtp(false);
    }
  };

  const handleSubmitPhoneOtp = async () => {
    const cleanPhone = toEnglishDigits(verifyPhoneInput.trim()).replace(/\D/g, '');
    const cleanCode = toEnglishDigits(verifyOtpCode.trim()).replace(/\D/g, '');

    if (!cleanCode) {
      setVerifyOtpCodeError(isPersian ? 'کد تایید الزامی است.' : 'Verification code is required.');
      return;
    }

    if (cleanCode.length < 4) {
      setVerifyOtpCodeError(isPersian ? 'کد تایید وارد شده کوتاه است.' : 'Verification code is too short.');
      return;
    }

    setVerifyOtpCodeError('');
    setLoadingSubmitVerifyOtp(true);
    try {
      const res = await axiosInstance.post('/auth/otp/verify-phone', {
        phone: cleanPhone,
        code: cleanCode,
      });

      if (res.data?.user) {
        dispatch(updateUser(res.data.user));
        setPhone(res.data.user.phone || cleanPhone);
      }

      toast.success(
        res.data?.message || (isPersian ? 'شماره موبایل با موفقیت تایید شد.' : 'Phone verified successfully.'),
      );

      setIsPhoneModalOpen(false);
    } catch (err: any) {
      const serverMsg = getApiErrorMessage(err);
      setVerifyOtpCodeError(
        serverMsg || (isPersian ? 'کد تایید وارد شده نامعتبر یا منقضی است.' : 'Invalid or expired code.'),
      );
      toast.error(serverMsg || (isPersian ? 'کد تایید نامعتبر است.' : 'Invalid code.'));
    } finally {
      setLoadingSubmitVerifyOtp(false);
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
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {user.isVip && (
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
                  )}
                  {user.isPhoneVerified ? (
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={<ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />}
                      classNames={{
                        base: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold h-5.5 rounded-xl px-2",
                        content: "px-0.5"
                      }}
                    >
                      {isPersian ? 'موبایل تایید شده' : 'Phone Verified'}
                    </Chip>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPhoneVerification()}
                      className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold h-5.5 rounded-xl px-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{isPersian ? 'تایید شماره موبایل' : 'Verify Phone'}</span>
                    </button>
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
                onPress={() => handleTabChange('dashboard')}
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
                onPress={() => handleTabChange('orders')}
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
                onPress={() => handleTabChange('addresses')}
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
                onPress={() => handleTabChange('vip')}
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
                onPress={() => handleTabChange('edit')}
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
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="space-y-6"
            >
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
                    onPress={() => handleTabChange('edit')}
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
                          base: "bg-brand-gold/15 dark:bg-[#181f18] text-brand-bronze-dark dark:text-brand-gold border border-brand-gold/30 text-xs font-black h-10 px-3.5 rounded-2xl shadow-xs",
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
                  onPress={() => handleTabChange('orders')}
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
                  onPress={() => handleTabChange('addresses')}
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
                  onPress={() => handleTabChange('vip')}
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
                    onPress={() => handleTabChange('orders')}
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
                          {isPersian ? 'مشاهده اقلام، مبالغ و جزئیات ارسال سفارش‌ها' : 'Review order items, totals and shipping details'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 2: Addresses */}
                  <Card
                    isPressable
                    onPress={() => handleTabChange('addresses')}
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
                          {isPersian ? 'نشانی‌های تحویل، کد پستی و گیرنده را مدیریت کنید' : 'Manage delivery addresses, postal codes and contacts'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick 3: Account Info */}
                  <Card
                    isPressable
                    onPress={() => handleTabChange('edit')}
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
                    onPress={() => handleTabChange('vip')}
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
                      onPress={() => handleTabChange('dashboard')}
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

                          <div className="flex justify-start border-t border-brand-border pt-3">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                setSelectedOrder(order);
                                setIsOrderDetailsOpen(true);
                              }}
                              className="h-9 rounded-xl bg-brand-surface hover:bg-brand-gold/10 px-3 text-xs font-bold text-brand-bronze dark:text-brand-gold"
                            >
                              {isPersian ? 'جزئیات کامل سفارش' : 'Full order details'}
                            </Button>
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
            <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      radius="lg"
                      onPress={() => handleTabChange('dashboard')}
                      aria-label="Back to Dashboard"
                      className="bg-brand-surface-elevated hover:bg-brand-border text-brand-text border border-brand-border transition-colors rounded-2xl cursor-pointer"
                    >
                      {isPersian ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </Button>
                    <div>
                      <h3 className="text-base font-black text-brand-text">
                        {isPersian ? 'نشانی‌های تحویل سفارش' : 'Delivery Addresses'}
                      </h3>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {isPersian
                          ? 'مدیریت نشانی‌ها و تعیین آدرس پیش‌فرض جهت ثبت آسان سفارش'
                          : 'Manage addresses and select a default for fast checkout'}
                      </p>
                    </div>
                  </div>

                  <Button
                    radius="lg"
                    onPress={handleOpenCreateAddress}
                    startContent={<Plus className="w-4 h-4" />}
                    className="h-10 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer transition-all"
                  >
                    {isPersian ? 'افزودن نشانی جدید' : 'Add New Address'}
                  </Button>
                </div>

                {loadingAddresses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-44 rounded-3xl bg-brand-surface-elevated" />
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-brand-gold/15 text-brand-gold flex items-center justify-center mx-auto shadow-inner">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="text-base font-black text-brand-text">
                        {isPersian ? 'هنوز نشانی‌ای ثبت نکرده‌اید' : 'No addresses saved yet'}
                      </h4>
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {isPersian
                          ? 'نشانی تحویل سفارش‌های خود را اضافه کنید تا در خریدها به سرعت بین آن‌ها سوییچ کنید.'
                          : 'Add delivery addresses to easily switch between them during checkout.'}
                      </p>
                    </div>
                    <Button
                      radius="lg"
                      onPress={handleOpenCreateAddress}
                      startContent={<Plus className="w-4 h-4" />}
                      className="h-11 px-7 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer"
                    >
                      {isPersian ? 'افزودن اولین نشانی' : 'Add First Address'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`rounded-3xl border transition-all duration-300 p-5 space-y-4 relative flex flex-col justify-between ${
                          addr.isDefault
                            ? 'bg-brand-surface-elevated/70 border-brand-gold/60 shadow-sm ring-1 ring-brand-gold/20'
                            : 'bg-brand-surface-elevated/30 hover:bg-brand-surface-elevated/60 border-brand-border hover:border-brand-gold/40'
                        }`}
                      >
                        {/* Header: Title & Default Tag / Action */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 pb-3 border-b border-brand-border">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  addr.isDefault
                                    ? 'bg-brand-gold/20 text-brand-gold'
                                    : 'bg-brand-surface text-brand-bronze dark:text-brand-gold'
                                }`}
                              >
                                <MapPin className="w-4 h-4" />
                              </div>
                              <h4 className="text-sm font-black text-brand-text">
                                {addr.title || (isPersian ? 'نشانی تحویل' : 'Delivery Address')}
                              </h4>
                            </div>

                            <div>
                              {addr.isDefault ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-[11px] font-black">
                                  <Check className="w-3.5 h-3.5" />
                                  {isPersian ? 'پیش‌فرض' : 'Default'}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  radius="lg"
                                  isLoading={settingDefaultId === addr._id}
                                  onPress={() => handleSetDefaultAddress(addr._id)}
                                  className="h-7 px-2.5 rounded-xl text-[10px] font-bold bg-brand-surface hover:bg-brand-gold/10 text-brand-bronze dark:text-brand-gold border border-brand-border hover:border-brand-gold/40 transition-colors cursor-pointer"
                                >
                                  {isPersian ? 'انتخاب به عنوان پیش‌فرض' : 'Set as default'}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Address Details */}
                          <p className="text-xs font-semibold text-brand-text leading-relaxed">
                            {[addr.province, addr.city, addr.address].filter(Boolean).join('، ')}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-brand-text-muted text-[11px] pt-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                              <span>{isPersian ? 'گیرنده:' : 'Recipient:'}</span>
                              <span className="font-bold text-brand-text">{addr.recipientName || user.fullName}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                              <span>{isPersian ? 'تماس:' : 'Phone:'}</span>
                              <span className="font-bold text-brand-text font-mono text-start">
                                {isPersian ? toPersianDigits(addr.recipientPhone || '') : addr.recipientPhone}
                              </span>
                            </div>

                            {addr.postalCode && (
                              <div className="flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                                <span>{isPersian ? 'کد پستی:' : 'Postal:'}</span>
                                <span className="font-bold text-brand-text font-mono">
                                  {isPersian ? toPersianDigits(addr.postalCode) : addr.postalCode}
                                </span>
                              </div>
                            )}

                            {addr.recipientEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                                <span className="truncate">{addr.recipientEmail}</span>
                              </div>
                            )}
                          </div>

                          {addr.addressNotes && (
                            <div className="p-2.5 rounded-xl bg-brand-surface text-[11px] text-brand-text-muted border border-brand-border flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{addr.addressNotes}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            radius="lg"
                            onPress={() => handleOpenEditAddress(addr)}
                            startContent={<Edit3 className="w-3.5 h-3.5" />}
                            className="h-8 px-3 rounded-xl text-xs font-bold bg-brand-surface hover:bg-brand-surface-elevated text-brand-text border border-brand-border transition-colors cursor-pointer"
                          >
                            {isPersian ? 'ویرایش' : 'Edit'}
                          </Button>

                          <Button
                            size="sm"
                            variant="flat"
                            radius="lg"
                            onPress={() => openDeleteModal(addr)}
                            startContent={<Trash2 className="w-3.5 h-3.5" />}
                            className="h-8 px-3 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors cursor-pointer"
                          >
                            {isPersian ? 'حذف' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* TAB 4: EDIT PROFILE & SECURITY TAB */}
          {activeTab === 'edit' && (
            !isEditing ? (
              /* VIEW / OVERVIEW MODE */
              <div className="space-y-6">
                {/* Personal Information View Card */}
                <Card
                  classNames={{ base: "relative z-10" }}
                  className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs relative z-10"
                >
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-brand-border flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          radius="lg"
                          onPress={() => handleTabChange('dashboard')}
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
                              ? 'مشاهده مشخصات حساب کاربری و اطلاعات فردی ثبت‌شده'
                              : 'View registered personal and account information'}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="solid"
                        onPress={() => setIsEditing(true)}
                        startContent={<Edit3 className="w-4 h-4 shrink-0 text-[#141914]" />}
                        className="h-10 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black rounded-2xl shadow-md shadow-brand-gold/20 transition-all cursor-pointer"
                      >
                        {isPersian ? 'ویرایش مشخصات' : 'Edit Profile'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Full Name */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                          <User className="w-4 h-4 text-brand-gold" />
                          <span>{isPersian ? 'نام و نام خانوادگی' : 'Full Name'}</span>
                        </div>
                        <p className="text-sm font-black text-brand-text pt-0.5">
                          {user.fullName || '—'}
                        </p>
                      </div>

                      {/* Username */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                          <AtSign className="w-4 h-4 text-brand-gold" />
                          <span>{isPersian ? 'نام کاربری' : 'Username'}</span>
                        </div>
                        <p className="text-sm font-black text-brand-text font-mono pt-0.5" dir="ltr">
                          @{user.username}
                        </p>
                      </div>

                      {/* Phone */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                            <Smartphone className="w-4 h-4 text-brand-gold" />
                            <span>{isPersian ? 'شماره موبایل' : 'Mobile Phone'}</span>
                          </div>
                          {user.isPhoneVerified ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              color="success"
                              startContent={<CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              classNames={{
                                base: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold h-5 rounded-lg px-2",
                              }}
                            >
                              {isPersian ? 'تایید شده' : 'Verified'}
                            </Chip>
                          ) : (
                            <Chip
                              size="sm"
                              variant="flat"
                              color="warning"
                              classNames={{
                                base: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold h-5 rounded-lg px-2",
                              }}
                            >
                              {isPersian ? 'تایید نشده' : 'Unverified'}
                            </Chip>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-sm font-black text-brand-text font-mono" dir="ltr">
                            {user.phone ? (isPersian ? toPersianDigits(user.phone) : user.phone) : (isPersian ? 'ثبت نشده' : 'Not set')}
                          </p>
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => handleOpenPhoneVerification(user.phone)}
                            className="text-xs font-bold text-brand-gold hover:underline p-0 h-auto cursor-pointer"
                          >
                            {user.isPhoneVerified
                              ? (isPersian ? 'تغییر شماره' : 'Change')
                              : (isPersian ? 'تایید شماره' : 'Verify')}
                          </Button>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                            <Mail className="w-4 h-4 text-brand-gold" />
                            <span>{isPersian ? 'آدرس ایمیل' : 'Email Address'}</span>
                          </div>
                          {user.email && (
                            user.isEmailVerified ? (
                              <Chip
                                size="sm"
                                variant="flat"
                                color="success"
                                classNames={{
                                  base: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold h-5 rounded-lg px-2",
                                }}
                              >
                                {isPersian ? 'تایید شده' : 'Verified'}
                              </Chip>
                            ) : (
                              <Chip
                                size="sm"
                                variant="flat"
                                color="warning"
                                classNames={{
                                  base: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold h-5 rounded-lg px-2",
                                }}
                              >
                                {isPersian ? 'تایید نشده' : 'Unverified'}
                              </Chip>
                            )
                          )}
                        </div>
                        <p className="text-sm font-black text-brand-text truncate pt-0.5" dir="ltr">
                          {user.email || (isPersian ? 'ثبت نشده (اختیاری)' : 'Not set (Optional)')}
                        </p>
                      </div>

                      {/* Birth Date */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                          <Calendar className="w-4 h-4 text-brand-gold" />
                          <span>{isPersian ? 'تاریخ تولد' : 'Date of Birth'}</span>
                        </div>
                        <p className="text-sm font-black text-brand-text pt-0.5">
                          {user.birthDateShamsi
                            ? toPersianDigits(user.birthDateShamsi)
                            : user.birthDate
                            ? toPersianDigits(user.birthDate)
                            : (isPersian ? 'ثبت نشده (اختیاری)' : 'Not set (Optional)')}
                        </p>
                      </div>

                      {/* Account Status / VIP */}
                      <div className="p-4 bg-brand-surface-elevated/50 rounded-2xl border border-brand-border space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted">
                          <Shield className="w-4 h-4 text-brand-gold" />
                          <span>{isPersian ? 'سطح حساب کاربری' : 'Account Level'}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          {user.isVip ? (
                            <Chip
                              size="sm"
                              variant="flat"
                              startContent={<Crown className="w-3 h-3 text-brand-gold" />}
                              classNames={{
                                base: "bg-brand-gold/15 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold text-xs font-bold h-6 rounded-xl px-2.5",
                              }}
                            >
                              {isPersian ? 'عضو طلایی VIP' : 'Golden VIP'}
                            </Chip>
                          ) : (
                            <span className="text-sm font-bold text-brand-text">
                              {user.role === 'admin'
                                ? (isPersian ? 'مدیر سیستم' : 'Admin')
                                : (isPersian ? 'کاربر عادی' : 'Standard User')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Password & Security View Card */}
                <Card
                  classNames={{ base: "relative z-10" }}
                  className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs relative z-10"
                >
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-brand-border flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-surface-elevated flex items-center justify-center text-brand-gold border border-brand-border shrink-0">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-brand-text">
                            {isPersian ? 'امنیت و کلمه عبور' : 'Password & Security'}
                          </h3>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            {user.hasPassword
                              ? (isPersian ? 'کلمه عبور برای حساب شما فعال است' : 'Password is set and active')
                              : (isPersian ? 'کلمه عبور اختصاصی تعیین نشده است' : 'No password is set')}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="flat"
                        onPress={() => setIsEditing(true)}
                        startContent={<KeyRound className="w-4 h-4 text-brand-gold shrink-0" />}
                        className="h-10 px-5 bg-brand-surface-elevated hover:bg-brand-border text-brand-text font-bold text-xs rounded-2xl border border-brand-border transition-all cursor-pointer"
                      >
                        {user.hasPassword
                          ? (isPersian ? 'تغییر کلمه عبور' : 'Change Password')
                          : (isPersian ? 'تعیین کلمه عبور' : 'Set Password')}
                      </Button>
                    </div>

                    {user.hasPassword ? (
                      <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-brand-text">
                              {isPersian ? 'کلمه عبور حساب فعال است' : 'Password Protected'}
                            </h4>
                            <p className="text-[11px] text-brand-text-muted mt-0.5">
                              {isPersian
                                ? 'می‌توانید علاوه بر پیامک کد یکبار مصرف، با کلمه عبور خود نیز وارد شوید.'
                                : 'You can sign in using your password or SMS one-time code.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="light"
                            size="sm"
                            onPress={() => setResetModalOpen(true)}
                            startContent={<HelpCircle className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                            className="text-xs font-bold text-brand-gold hover:underline p-0 h-auto cursor-pointer"
                          >
                            {isPersian ? 'فراموشی رمز عبور؟' : 'Forgot Password?'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-brand-text">
                              {isPersian ? 'حساب کاربری بدون کلمه عبور است' : 'No Password Set'}
                            </h4>
                            <p className="text-[11px] text-brand-text-muted mt-0.5">
                              {isPersian
                                ? 'شما از طریق کد یکبار مصرف پیامکی وارد می‌شوید. جهت امکان ورود با رمز، کلمه عبور تعیین نمایید.'
                                : 'You currently sign in via OTP. Set a password for faster and flexible access.'}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onPress={() => setIsEditing(true)}
                          className="h-9 px-4 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black rounded-xl cursor-pointer"
                        >
                          {isPersian ? 'تعیین کلمه عبور' : 'Set Password'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              /* EDIT MODE FORM */
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Personal Details Card */}
                <Card
                  classNames={{ base: "!overflow-visible overflow-visible card-overflow-visible relative z-30" }}
                  className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs !overflow-visible overflow-visible card-overflow-visible relative z-30"
                >
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-brand-border flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          radius="lg"
                          onPress={handleCancelEdit}
                          aria-label="Cancel editing"
                          className="bg-brand-surface-elevated hover:bg-brand-border text-brand-text border border-brand-border transition-colors rounded-2xl cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div>
                          <h3 className="text-base font-black text-brand-text">
                            {isPersian ? 'ویرایش مشخصات فردی و حساب' : 'Edit Personal & Account Details'}
                          </h3>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            {isPersian
                              ? 'اطلاعات مورد نظر را اصلاح نموده و در پایان روی دکمه ذخیره کلیک کنید'
                              : 'Update your details and click save to apply changes'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="flat"
                          size="sm"
                          radius="lg"
                          onPress={handleCancelEdit}
                          className="h-10 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                        >
                          {isPersian ? 'انصراف' : 'Cancel'}
                        </Button>
                        <Button
                          type="submit"
                          isLoading={saving}
                          size="sm"
                          radius="lg"
                          startContent={!saving && <Save className="w-4 h-4 shrink-0" />}
                          className="h-10 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black rounded-2xl shadow-md shadow-brand-gold/20 transition-all cursor-pointer"
                        >
                          {saving
                            ? (isPersian ? 'در حال ذخیره‌سازی...' : 'Saving...')
                            : (isPersian ? 'ذخیره تغییرات' : 'Save Changes')}
                        </Button>
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
                          dir="auto"
                          aria-label={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                          placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                          value={fullName}
                          onValueChange={setFullName}
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text",
                          }}
                        />
                      </div>

                      {/* Username */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 h-5">
                          <AtSign className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <label className="text-xs font-bold text-brand-text">
                            {isPersian ? 'نام کاربری (یکتا در سیستم)' : 'Username (Unique)'}
                          </label>
                          <span className="text-rose-500 font-bold text-xs">*</span>
                        </div>
                        <Input
                          dir="auto"
                          aria-label={isPersian ? 'نام کاربری (یکتا در سیستم)' : 'Username (Unique)'}
                          placeholder="e.g. john_doe"
                          value={username}
                          onValueChange={setUsername}
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-bold text-brand-text text-start",
                          }}
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 h-5">
                          <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <label className="text-xs font-bold text-brand-text">
                            {isPersian ? 'آدرس ایمیل (اختیاری)' : 'Email Address (Optional)'}
                          </label>
                        </div>
                        <Input
                          type="email"
                          aria-label={isPersian ? 'آدرس ایمیل (اختیاری)' : 'Email Address (Optional)'}
                          placeholder={isPersian ? 'user@example.com (اختیاری)' : 'user@example.com (optional)'}
                          value={email}
                          onValueChange={setEmail}
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text text-start",
                          }}
                        />
                      </div>

                      {/* Phone (Secure credential - readOnly in edit form, modified via OTP) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 h-5">
                            <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <label className="text-xs font-bold text-brand-text">
                              {isPersian ? 'شماره موبایل حساب' : 'Account Mobile Phone'}
                            </label>
                          </div>
                          {user?.isPhoneVerified ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              {isPersian ? 'تایید شده' : 'Verified'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              {isPersian ? 'تایید نشده' : 'Unverified'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="tel"
                            readOnly
                            aria-label={isPersian ? 'شماره موبایل' : 'Phone Number'}
                            value={user?.phone ? (isPersian ? toPersianDigits(user.phone) : user.phone) : (isPersian ? 'شماره‌ای ثبت نشده' : 'No phone set')}
                            variant="bordered"
                            radius="lg"
                            startContent={<Lock className="w-3.5 h-3.5 text-brand-text-muted shrink-0" />}
                            classNames={{
                              inputWrapper: "h-12 px-4 bg-brand-surface-elevated/70 border border-brand-border rounded-2xl shadow-xs cursor-not-allowed opacity-90",
                              input: "text-sm font-bold text-brand-text text-start font-mono cursor-not-allowed",
                            }}
                          />
                          <Button
                            type="button"
                            onPress={() => handleOpenPhoneVerification(user?.phone)}
                            className="h-12 px-4 bg-brand-surface-elevated hover:bg-brand-gold hover:text-[#141914] border border-brand-border text-brand-gold font-black text-xs rounded-2xl shrink-0 transition-all cursor-pointer shadow-xs"
                          >
                            {user?.isPhoneVerified
                              ? (isPersian ? 'تغییر شماره' : 'Change')
                              : (isPersian ? 'تایید شماره' : 'Verify')}
                          </Button>
                        </div>
                        <p className="text-[11px] text-brand-text-muted leading-relaxed">
                          {isPersian
                            ? 'تغییر شماره موبایل به دلایل امنیتی فقط با ارسال و تایید کد پیامکی (OTP) امکان‌پذیر است.'
                            : 'Changing mobile phone requires OTP verification for security.'}
                        </p>
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
                            {user?.hasPassword
                              ? (isPersian ? 'تغییر رمز عبور' : 'Change Password')
                              : (isPersian ? 'تعیین کلمه عبور' : 'Set Password')}
                          </h3>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            {user?.hasPassword
                              ? (isPersian
                                  ? 'جهت تغییر رمز عبور، حتماً باید کلمه عبور فعلی را وارد نمایید'
                                  : 'You must provide your current password to set a new one')
                              : (isPersian
                                  ? 'برای حساب کاربری خود کلمه عبور تعیین کنید تا بتوانید با رمز عبور نیز وارد شوید'
                                  : 'Set a password for your account to enable password login')}
                          </p>
                        </div>
                      </div>

                      {user?.hasPassword && (
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          radius="lg"
                          onPress={() => setResetModalOpen(true)}
                          startContent={<HelpCircle className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />}
                          className="text-xs font-bold text-brand-bronze dark:text-brand-gold hover:underline p-0 h-auto cursor-pointer"
                        >
                          {isPersian ? 'رمز فعلی را فراموش کرده‌اید؟' : 'Forgot current password?'}
                        </Button>
                      )}
                    </div>

                    <div className={`grid grid-cols-1 ${user?.hasPassword ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-5`}>
                      {/* Current Password - Only displayed if user has an existing password */}
                      {user?.hasPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 h-5">
                            <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <label className="text-xs font-bold text-brand-text truncate">
                              {isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                            </label>
                          </div>
                          <PasswordInput
                            isPersian={isPersian}
                            isVisible={showCurrentPassword}
                            onToggleVisibility={() => setShowCurrentPassword((prev) => !prev)}
                            aria-label={isPersian ? 'کلمه عبور فعلی' : 'Current Password'}
                            placeholder={isPersian ? 'رمز عبور فعلی حساب' : 'Current password'}
                            value={currentPassword}
                            onValueChange={setCurrentPassword}
                            variant="bordered"
                            radius="lg"
                            toggleAriaLabel={isPersian ? 'تغییر نمایش کلمه عبور فعلی' : 'Toggle current password visibility'}
                            classNames={{
                              inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                              input: "text-sm font-semibold text-brand-text",
                            }}
                          />
                        </div>
                      )}

                      {/* New Password */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 h-5">
                          <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <label className="text-xs font-bold text-brand-text truncate">
                            {user?.hasPassword
                              ? (isPersian ? 'کلمه عبور جدید' : 'New Password')
                              : (isPersian ? 'کلمه عبور' : 'Password')}
                          </label>
                        </div>
                        <PasswordInput
                          isPersian={isPersian}
                          isVisible={showNewPassword}
                          onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
                          aria-label={user?.hasPassword ? (isPersian ? 'کلمه عبور جدید' : 'New Password') : (isPersian ? 'کلمه عبور' : 'Password')}
                          placeholder={
                            user?.hasPassword
                              ? (isPersian ? 'رمز عبور جدید (حداقل ۶ کاراکتر)' : 'New password (min 6 chars)')
                              : (isPersian ? 'رمز عبور (حداقل ۶ کاراکتر)' : 'Password (min 6 chars)')
                          }
                          value={newPassword}
                          onValueChange={setNewPassword}
                          variant="bordered"
                          radius="lg"
                          toggleAriaLabel={isPersian ? 'تغییر نمایش کلمه عبور جدید' : 'Toggle new password visibility'}
                          classNames={{
                            inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text",
                          }}
                        />
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 h-5">
                          <Lock className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                          <label className="text-xs font-bold text-brand-text truncate">
                            {user?.hasPassword
                              ? (isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password')
                              : (isPersian ? 'تکرار کلمه عبور' : 'Confirm Password')}
                          </label>
                        </div>
                        <PasswordInput
                          isPersian={isPersian}
                          isVisible={showConfirmPassword}
                          onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={user?.hasPassword ? (isPersian ? 'تکرار کلمه عبور جدید' : 'Confirm New Password') : (isPersian ? 'تکرار کلمه عبور' : 'Confirm Password')}
                          placeholder={isPersian ? 'تکرار رمز عبور' : 'Confirm password'}
                          value={confirmPassword}
                          onValueChange={setConfirmPassword}
                          variant="bordered"
                          radius="lg"
                          toggleAriaLabel={isPersian ? 'تغییر نمایش تکرار کلمه عبور' : 'Toggle confirm password visibility'}
                          classNames={{
                            inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                            input: "text-sm font-semibold text-brand-text",
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
                    onPress={handleCancelEdit}
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
                      ? (isPersian ? 'در حال ذخیره‌سازی...' : 'Saving Changes...')
                      : (isPersian ? 'ذخیره تغییرات' : 'Save Changes')}
                  </Button>
                </div>
              </form>
            )
          )}

          {/* TAB 5: VIP CLUB LOUNGE TAB */}
          {activeTab === 'vip' && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-white via-[#fcf8f2] to-[#f5ead9] dark:from-[#1c241c] dark:via-[#141914] dark:to-[#0d120d] border-2 border-brand-gold/40 shadow-xl rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-brand-gold/20 dark:bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-amber-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="p-6 sm:p-10 space-y-8 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold to-[#997a4d] text-white dark:text-[#141914] flex items-center justify-center shadow-xl shadow-brand-gold/25 shrink-0">
                        <Crown className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-[#8a6839] dark:text-brand-gold">
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
                    <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#182018]/80 border border-brand-gold/30 dark:border-brand-gold/20 backdrop-blur-md shadow-xs space-y-2 hover:border-brand-gold/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/15 dark:bg-brand-gold/10 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold flex items-center justify-center shrink-0">
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

                    <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#182018]/80 border border-brand-gold/30 dark:border-brand-gold/20 backdrop-blur-md shadow-xs space-y-2 hover:border-brand-gold/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/15 dark:bg-brand-gold/10 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold flex items-center justify-center shrink-0">
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

                    <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#182018]/80 border border-brand-gold/30 dark:border-brand-gold/20 backdrop-blur-md shadow-xs space-y-2 hover:border-brand-gold/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/15 dark:bg-brand-gold/10 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold flex items-center justify-center shrink-0">
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

                    <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#182018]/80 border border-brand-gold/30 dark:border-brand-gold/20 backdrop-blur-md shadow-xs space-y-2 hover:border-brand-gold/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/15 dark:bg-brand-gold/10 border border-brand-gold/30 text-brand-bronze dark:text-brand-gold flex items-center justify-center shrink-0">
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        initialIdentifier={user?.phone || user?.email || user?.username || ''}
      />

      {/* Order details stay in the profile context so closing the dialog returns to the same list position. */}
      <Modal
        isOpen={isOrderDetailsOpen}
        onOpenChange={(open) => {
          setIsOrderDetailsOpen(open);
          if (!open) setSelectedOrder(null);
        }}
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          base: 'mx-3 max-h-[92vh] max-w-5xl overflow-hidden rounded-3xl border border-brand-border bg-brand-surface text-brand-text shadow-2xl',
          header: 'border-b border-brand-border pb-3',
          body: 'max-h-[72vh] overflow-y-auto py-5',
          footer: 'border-t border-brand-border pt-3',
          closeButton: 'text-brand-text-muted hover:bg-brand-surface-elevated',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-start">
                <h3 className="text-base font-black text-brand-text">
                  {selectedOrder && (isPersian
                    ? `جزئیات سفارش #${toPersianDigits(selectedOrder.orderNumber)}`
                    : `Order details #${selectedOrder.orderNumber}`)}
                </h3>
                {selectedOrder && (
                  <span className="text-[11px] font-normal text-brand-text-muted">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                  </span>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedOrder && <OrderDetailsPanel order={selectedOrder} isPersian={isPersian} />}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="h-10 rounded-xl bg-brand-surface-elevated px-5 text-xs font-bold text-brand-text"
                >
                  {isPersian ? 'بستن' : 'Close'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Phone Verification Modal */}
      <Modal
        isOpen={isPhoneModalOpen}
        onOpenChange={setIsPhoneModalOpen}
        placement="center"
        backdrop="blur"
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
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-brand-text">
                  {isPersian ? 'تایید شماره موبایل' : 'Verify Mobile Number'}
                </h3>
              </ModalHeader>

              {verifyPhoneStep === 'phone' ? (
                <div>
                  <ModalBody className="space-y-4">
                    <p className="text-xs text-brand-text-muted leading-relaxed">
                      {isPersian
                        ? 'شماره موبایل خود را وارد نمایید تا کد تایید یکبار مصرف برای شما صادر شود:'
                        : 'Enter your mobile number to receive a one-time verification code:'}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <Smartphone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'شماره موبایل' : 'Mobile Number'}
                        </label>
                      </div>
                      <Input
                        type="tel"
                        aria-label={isPersian ? 'شماره موبایل' : 'Mobile Number'}
                        placeholder="09123456789"
                        maxLength={11}
                        value={verifyPhoneInput}
                        onChange={(e) => {
                          const digits = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 11);
                          setVerifyPhoneInput(digits);
                          if (verifyPhoneError) setVerifyPhoneError('');
                        }}
                        variant="bordered"
                        radius="lg"
                        isInvalid={Boolean(verifyPhoneError)}
                        classNames={{
                          inputWrapper: Boolean(verifyPhoneError)
                            ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                            : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-sm font-bold text-brand-text tracking-wider",
                        }}
                      />
                      <AnimatedFieldError error={verifyPhoneError} />
                    </div>
                  </ModalBody>
                  <ModalFooter className="flex gap-2">
                    <Button
                      type="button"
                      onPress={handleSendPhoneOtp}
                      isLoading={loadingSendVerifyOtp}
                      radius="lg"
                      className="flex-1 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs rounded-2xl shadow-md cursor-pointer"
                    >
                      {isPersian ? 'دریافت کد تایید' : 'Send Code'}
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
                </div>
              ) : (
                <div>
                  <ModalBody className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-brand-surface-elevated rounded-2xl border border-brand-border">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-brand-gold shrink-0" />
                        <div className="text-xs">
                          <span className="text-brand-text-muted">
                            {isPersian ? 'ارسال شده به: ' : 'Sent to: '}
                          </span>
                          <span className="font-bold font-mono text-brand-text tracking-wider">
                            {isPersian ? toPersianDigits(verifyPhoneInput) : verifyPhoneInput}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyPhoneStep('phone');
                          setVerifyDevCode(null);
                        }}
                        className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isPersian ? 'ویرایش شماره' : 'Edit'}</span>
                      </button>
                    </div>

                    {verifyDevCode && (
                      <div
                        onClick={() => {
                          setVerifyOtpCode(verifyDevCode);
                          if (verifyOtpCodeError) setVerifyOtpCodeError('');
                        }}
                        className="p-3 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-brand-gold shrink-0 animate-pulse" />
                          <span className="text-xs text-brand-text font-bold">
                            {isPersian ? 'کد تایید تست سیستم:' : 'System Dev Code:'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-black tracking-widest text-brand-gold bg-brand-surface px-2.5 py-0.5 rounded-xl border border-brand-gold/20 group-hover:border-brand-gold">
                            {isPersian ? toPersianDigits(verifyDevCode) : verifyDevCode}
                          </span>
                          <span className="text-[10px] text-brand-text-muted group-hover:text-brand-gold font-medium">
                            ({isPersian ? 'کلیک جهت درج' : 'click to fill'})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 h-5">
                        <KeyRound className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                        <label className="text-xs font-bold text-brand-text">
                          {isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Verification Code'}
                        </label>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={isPersian ? 'کد تایید ۵ رقمی' : '5-Digit Verification Code'}
                        placeholder={isPersian ? '۱۲۳۴۵' : '12345'}
                        maxLength={5}
                        value={verifyOtpCode}
                        onChange={(e) => {
                          const digits = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 5);
                          setVerifyOtpCode(digits);
                          if (verifyOtpCodeError) setVerifyOtpCodeError('');
                        }}
                        variant="bordered"
                        radius="lg"
                        isInvalid={Boolean(verifyOtpCodeError)}
                        classNames={{
                          inputWrapper: Boolean(verifyOtpCodeError)
                            ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                            : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                          input: "text-center font-mono font-bold text-brand-text tracking-[0.3em] text-base",
                        }}
                      />
                      <AnimatedFieldError error={verifyOtpCodeError} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      {verifyCountdown > 0 ? (
                        <div className="flex items-center gap-1.5 text-brand-text-muted">
                          <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{isPersian ? 'زمان باقیمانده:' : 'Time remaining:'}</span>
                          <span className="font-mono font-bold text-brand-gold">
                            {formatOtpTimer(verifyCountdown)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={loadingSendVerifyOtp}
                          className="text-brand-gold hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isPersian ? 'ارسال مجدد کد' : 'Resend code'}</span>
                        </button>
                      )}
                    </div>
                  </ModalBody>
                  <ModalFooter className="flex gap-2">
                    <Button
                      type="button"
                      onPress={handleSubmitPhoneOtp}
                      isLoading={loadingSubmitVerifyOtp}
                      radius="lg"
                      className="flex-1 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs rounded-2xl shadow-md cursor-pointer"
                    >
                      {isPersian ? 'تایید و ذخیره شماره' : 'Verify & Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="flat"
                      radius="lg"
                      onPress={() => setVerifyPhoneStep('phone')}
                      className="h-11 px-5 bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                    >
                      {isPersian ? 'مرحله قبل' : 'Back'}
                    </Button>
                  </ModalFooter>
                </div>
              )}
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Address Create / Edit Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text max-w-2xl rounded-3xl shadow-2xl",
          header: "border-b border-brand-border pb-3",
          body: "py-5 space-y-4",
          footer: "border-t border-brand-border pt-3",
          closeButton: "hover:bg-brand-surface-elevated text-brand-text-muted rounded-xl cursor-pointer",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div>
              <ModalHeader className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-text">
                    {editingAddress
                      ? isPersian ? 'ویرایش نشانی تحویل' : 'Edit Delivery Address'
                      : isPersian ? 'افزودن نشانی جدید' : 'Add New Address'}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {isPersian
                      ? 'مشخصات کامل نشانی و تحویل‌گیرنده را وارد نمایید'
                      : 'Enter complete address and recipient details'}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <Building className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'عنوان نشانی *' : 'Address Title *'}
                      </label>
                    </div>
                    <Input
                      dir="auto"
                      aria-label={isPersian ? 'عنوان نشانی' : 'Address Title'}
                      placeholder={isPersian ? 'مثلاً خانه، محل کار، شرکت...' : 'e.g. Home, Office, Work...'}
                      value={addressForm.title}
                      onValueChange={(val) => {
                        setAddressForm({ ...addressForm, title: val });
                        if (addressErrors.title) setAddressErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.title)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.title} />
                  </div>

                  {/* Province & City */}
                  <div className="sm:col-span-2">
                    <ProvinceCitySelect
                      province={addressForm.province}
                      city={addressForm.city}
                      onChangeProvince={(p) => {
                        setAddressForm({ ...addressForm, province: p });
                        if (addressErrors.province) setAddressErrors((prev) => ({ ...prev, province: '' }));
                      }}
                      onChangeCity={(c) => {
                        setAddressForm({ ...addressForm, city: c });
                        if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' }));
                      }}
                    />
                    {(addressErrors.province || addressErrors.city) && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1">
                        {addressErrors.province || addressErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Address Detail */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <MapPin className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                      </label>
                    </div>
                    <Textarea
                      dir="auto"
                      aria-label={isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                      placeholder={
                        isPersian
                          ? 'نام خیابان، کوچه، پلاک، طبقه، واحد یا توضیحات تکمیلی نشانی...'
                          : 'Street name, alley, building number, floor, details...'
                      }
                        minRows={3}
                      maxLength={500}
                      value={addressForm.address}
                      onValueChange={(val) => {
                        setAddressForm({ ...addressForm, address: val });
                        if (addressErrors.address) setAddressErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.address)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: addressErrors.address
                          ? "p-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors h-24 !resize-none"
                          : "p-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-24 !resize-none",
                        input: "text-sm font-semibold text-brand-text leading-relaxed !resize-none resize-none overflow-y-auto",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.address} />
                  </div>

                  {/* Recipient Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                      </label>
                    </div>
                    <Input
                      dir="auto"
                      aria-label={isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                      placeholder={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                      value={addressForm.recipientName}
                      onValueChange={(val) => {
                        setAddressForm({ ...addressForm, recipientName: val });
                        if (addressErrors.recipientName) setAddressErrors((prev) => ({ ...prev, recipientName: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.recipientName)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: addressErrors.recipientName
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.recipientName} />
                  </div>

                  {/* Recipient Phone */}
                  <div className="space-y-1.5">
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
                      dir="ltr"
                      maxLength={11}
                      value={addressForm.recipientPhone}
                      onValueChange={(val) => {
                        const clean = toEnglishDigits(val).replace(/\D/g, '').slice(0, 11);
                        setAddressForm({ ...addressForm, recipientPhone: clean });
                        if (addressErrors.recipientPhone) setAddressErrors((prev) => ({ ...prev, recipientPhone: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.recipientPhone)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: addressErrors.recipientPhone
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-bold text-brand-text text-center font-mono",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.recipientPhone} />
                  </div>

                  {/* Postal Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'کد پستی (۱۰ رقمی - اختیاری)' : 'Postal Code (10 digits - Optional)'}
                      </label>
                    </div>
                    <Input
                      aria-label={isPersian ? 'کد پستی' : 'Postal Code'}
                      placeholder="1234567890"
                      dir="ltr"
                      maxLength={10}
                      value={addressForm.postalCode}
                      onValueChange={(val) => {
                        const clean = toEnglishDigits(val).replace(/\D/g, '').slice(0, 10);
                        setAddressForm({ ...addressForm, postalCode: clean });
                        if (addressErrors.postalCode) setAddressErrors((prev) => ({ ...prev, postalCode: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.postalCode)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: addressErrors.postalCode
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-bold text-brand-text tracking-widest text-center font-mono",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.postalCode} />
                  </div>

                  {/* Recipient Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'ایمیل تحویل‌گیرنده (اختیاری)' : 'Recipient Email (Optional)'}
                      </label>
                    </div>
                    <Input
                      type="email"
                      aria-label={isPersian ? 'ایمیل تحویل‌گیرنده' : 'Recipient Email'}
                      placeholder="user@example.com"
                      dir="ltr"
                      value={addressForm.recipientEmail}
                      onValueChange={(val) => {
                        setAddressForm({ ...addressForm, recipientEmail: val });
                        if (addressErrors.recipientEmail) setAddressErrors((prev) => ({ ...prev, recipientEmail: '' }));
                      }}
                      isInvalid={Boolean(addressErrors.recipientEmail)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: addressErrors.recipientEmail
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text text-start",
                      }}
                    />
                    <AnimatedFieldError error={addressErrors.recipientEmail} />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <FileText className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'توضیحات و یادداشت تحویل (اختیاری)' : 'Delivery Notes (Optional)'}
                      </label>
                    </div>
                    <Textarea
                      dir="auto"
                      aria-label={isPersian ? 'توضیحات و یادداشت تحویل' : 'Delivery Notes'}
                      placeholder={
                        isPersian
                          ? 'توضیحات تکمیلی تحویل سفارش، شماره زنگ، طبقه، هماهنگی قبل از ارسال و... (اختیاری)'
                          : 'Special delivery instructions, apartment/bell number, coordination... (optional)'
                      }
                        minRows={2}
                      maxLength={300}
                      value={addressForm.addressNotes}
                      onValueChange={(val) => setAddressForm({ ...addressForm, addressNotes: val })}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: "p-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-20 !resize-none",
                        input: "text-sm font-semibold text-brand-text leading-relaxed !resize-none resize-none overflow-y-auto",
                      }}
                    />
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="sm:col-span-2 pt-2">
                    <SmoothCheckbox
                      isSelected={addressForm.isDefault}
                      onValueChange={(val) => setAddressForm({ ...addressForm, isDefault: val })}
                    >
                      {isPersian
                        ? 'این نشانی به عنوان نشانی پیش‌فرض سفارش‌ها ثبت شود'
                        : 'Set this address as default delivery address'}
                    </SmoothCheckbox>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="flat"
                  radius="lg"
                  onPress={() => setIsAddressModalOpen(false)}
                  className="h-11 px-5 bg-brand-surface-elevated hover:bg-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>

                <Button
                  type="button"
                  onPress={() => handleSaveAddress()}
                  isLoading={savingAddress}
                  radius="lg"
                  startContent={!savingAddress && <Save className="w-4 h-4" />}
                  className="h-11 px-7 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer transition-all"
                >
                  {savingAddress
                    ? isPersian ? 'در حال ذخیره‌سازی...' : 'Saving...'
                    : isPersian ? 'ذخیره نشانی' : 'Save Address'}
                </Button>
              </ModalFooter>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Address Confirmation Modal (Reusing AdminConfirmModal) */}
      <AdminConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={isPersian ? 'حذف نشانی تحویل' : 'Delete Delivery Address'}
        description={
          isPersian ? (
            <div>
              <p>
                آیا از حذف نشانی <strong className="text-brand-text font-black">«{addressToDelete?.title || addressToDelete?.address?.slice(0, 30) || 'انتخاب‌شده'}»</strong> اطمینان دارید؟
              </p>
              <p className="mt-1 text-xs text-rose-500 font-medium">
                این عملیات غیرقابل بازگشت است.
              </p>
            </div>
          ) : (
            <div>
              <p>
                Are you sure you want to delete <strong className="text-brand-text font-bold">&quot;{addressToDelete?.title || 'Selected address'}&quot;</strong>?
              </p>
              <p className="mt-1 text-xs text-rose-500 font-medium">
                This action is permanent and cannot be undone.
              </p>
            </div>
          )
        }
        confirmText={isPersian ? 'بله، حذف نشانی' : 'Yes, Delete Address'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
        isLoading={Boolean(deletingAddressId)}
        onConfirm={handleConfirmDeleteAddress}
      />
    </div>
  );
}
