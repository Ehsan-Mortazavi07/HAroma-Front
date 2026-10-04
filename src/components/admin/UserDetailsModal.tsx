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
  Select,
  SelectItem,
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
  ChevronDown,
  Pencil,
  Eye,
  Lock,
  Sparkles,
  Save,
  X,
  AlertCircle,
  Building,
  Hash,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { IUser, IUserAddress, IOrder, UserRole } from '@/common/interfaces';
import { adminApi } from '@/common/api/admin';
import { formatToman, toPersianDigits, toEnglishDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate, parseIsoDate, gregorianToJalali } from '@/common/utils/date';
import { IRAN_PROVINCES } from '@/common/constants/iranProvinces';
import { BirthDatePicker } from '@/components/common/BirthDatePicker';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { PasswordInput } from '@/components/common/PasswordInput';
import { getOrderStatusLabel, OrderDetailsPanel } from '@/components/common/OrderDetailsPanel';
import { OrderEditForm } from '@/components/admin/OrderEditForm';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSecurePassword } from '@/common/utils/secureRandom';

export interface UserDetailsModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  user: IUser | null;
  initialMode?: 'view' | 'edit';
  isPersian?: boolean;
  isAdmin?: boolean;
  isSelf?: boolean;
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
      y: 12,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  },
};

const inputWrapperClass =
  'h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors';
const inputLabelClass = 'text-xs font-bold text-brand-text mb-1.5 block text-right';
export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  user,
  initialMode = 'view',
  isPersian = true,
  isAdmin = false,
  isSelf = false,
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
  const [adminChangeNotesByOrder, setAdminChangeNotesByOrder] = useState<Record<string, IOrder['adminChangeNotes']>>({});
  const [loadingAdminNotesId, setLoadingAdminNotesId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [updatingOrderStatusId, setUpdatingOrderStatusId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressLoadFailed, setAddressLoadFailed] = useState(false);
  const [addressReloadCount, setAddressReloadCount] = useState(0);
  const [addressEditOnly, setAddressEditOnly] = useState(false);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addressToDelete, setAddressToDelete] = useState<IUserAddress | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Edit form state
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<IUser | null>(user);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const modalWasOpenRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Close role dropdown on click outside
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

  useEffect(() => {
    if (isOpen) return;
    setAddressToDelete(null);
    setIsDeletingAddress(false);
  }, [isOpen]);

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
    title: '',
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
    if (!isOpen || !user) {
      if (!isOpen) modalWasOpenRef.current = false;
      return;
    }

    setCurrentUserData(user);
    const shouldResetEditor =
      !modalWasOpenRef.current || currentUserIdRef.current !== user._id;
    modalWasOpenRef.current = true;
    currentUserIdRef.current = user._id;
    if (!shouldResetEditor) return;

    setSelectedTab('profile');
    setSelectedEditTab('identity');
    setExpandedOrderId(null);
    setEditingOrderId(null);
    setAddressLoadFailed(false);
    setFieldErrors({});
    setAddressToDelete(null);
    setAddressEditOnly(false);
    setIsCreatingAddress(false);
    setSelectedAddressId(null);
    setIsEditing(initialMode === 'edit' && !!isAdmin);
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
      title: '',
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
  }, [user, initialMode, isAdmin, isOpen]);

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    let isCurrentRequest = true;
    setLoadingAddresses(true);
    setAddressLoadFailed(false);
    adminApi
      .getUserAddresses(user._id)
      .then((addresses: IUserAddress[]) => {
        if (!isCurrentRequest || !Array.isArray(addresses)) return;
        setCurrentUserData((previous) =>
          previous?._id === user._id ? { ...previous, addresses } : previous,
        );
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        console.error('Failed to fetch user addresses', error);
        setAddressLoadFailed(true);
      })
      .finally(() => {
        if (isCurrentRequest) setLoadingAddresses(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [isOpen, user?._id, addressReloadCount]);

  useEffect(() => {
    if (isOpen && currentUserData?._id) {
      fetchUserOrders(currentUserData._id);
    } else {
      setOrders([]);
      setExpandedOrderId(null);
      setEditingOrderId(null);
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

  const loadAdminChangeNotes = async (orderId: string) => {
    if (!isAdmin || Object.prototype.hasOwnProperty.call(adminChangeNotesByOrder, orderId) || loadingAdminNotesId === orderId) return;
    setLoadingAdminNotesId(orderId);
    try {
      const notes = await adminApi.getOrderAdminChangeNotes(orderId);
      setAdminChangeNotesByOrder((previous) => ({ ...previous, [orderId]: notes }));
    } catch {
      toast.error(isPersian ? 'یادداشت داخلی سفارش بارگذاری نشد.' : 'Could not load internal order notes.');
    } finally {
      setLoadingAdminNotesId(null);
    }
  };

  const handleOrderStatusChange = async (order: IOrder, status: IOrder['status']) => {
    if (!isAdmin || status === order.status || updatingOrderStatusId) return;

    setUpdatingOrderStatusId(order._id);
    try {
      const updatedOrder = await adminApi.updateOrderStatus(order._id, { status }) as IOrder;
      setOrders((previous) => previous.map((item) => (
        item._id === order._id ? { ...item, ...updatedOrder, status } : item
      )));
      toast.success(isPersian ? 'وضعیت سفارش تغییر کرد.' : 'Order status updated.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isPersian ? 'تغییر وضعیت سفارش انجام نشد.' : 'Could not update order status.'));
    } finally {
      setUpdatingOrderStatusId(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(isPersian ? 'در حافظه کپی شد' : 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleModalClose = () => {
    setAddressToDelete(null);
    onOpenChange?.(false);
    onClose?.();
  };

  if (!currentUserData) return null;

  const roleLabels: Record<string, { fa: string; en: string; color: string; icon: any }> = {
    admin: { fa: 'مدیر کل سیستم', en: 'Super Admin', color: 'text-brand-bronze dark:text-brand-gold bg-brand-gold/10 border-brand-gold/30', icon: ShieldAlert },
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
    const pwd = generateSecurePassword(16);
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

  const handleStartAddressEdit = (address: IUserAddress, standalone = true) => {
    setFormData((previous) => ({
      ...previous,
      title: address.title || '',
      province: address.province || '',
      city: address.city || '',
      address: address.address || '',
      postalCode: address.postalCode || '',
      buildingNumber: address.buildingNumber || '',
      unit: address.unit || '',
      recipientName: address.recipientName || '',
      recipientPhone: address.recipientPhone || '',
      recipientEmail: address.recipientEmail || '',
      addressNotes: address.addressNotes || '',
    }));
    setFieldErrors({});
    setIsCreatingAddress(false);
    setSelectedAddressId(address._id);
    setSelectedEditTab('shipping');
    setAddressEditOnly(standalone);
    setIsEditing(true);
  };

  const handleStartAddressCreate = (standalone = true) => {
    setFormData((previous) => ({
      ...previous,
      title: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      buildingNumber: '',
      unit: '',
      recipientName: currentUserData?.fullName || '',
      recipientPhone: currentUserData?.phone || '',
      recipientEmail: currentUserData?.email || '',
      addressNotes: '',
    }));
    setFieldErrors({});
    setSelectedAddressId(null);
    setIsCreatingAddress(true);
    setSelectedEditTab('shipping');
    setAddressEditOnly(standalone);
    setIsEditing(true);
  };

  const updateAddressProjection = (addresses: IUserAddress[]) => {
    const defaultAddress = addresses.find((address) => address.isDefault);
    const updatedUser: IUser = {
      ...currentUserData,
      addresses,
      province: defaultAddress?.province || '',
      city: defaultAddress?.city || '',
      address: defaultAddress?.address || '',
      postalCode: defaultAddress?.postalCode || '',
      buildingNumber: defaultAddress?.buildingNumber || '',
      unit: defaultAddress?.unit || '',
      recipientName: defaultAddress?.recipientName || '',
      recipientPhone: defaultAddress?.recipientPhone || '',
      recipientEmail: defaultAddress?.recipientEmail || '',
      addressNotes: defaultAddress?.addressNotes || '',
    };
    setCurrentUserData(updatedUser);
    onUserUpdated?.(updatedUser);
  };

  const handleSaveSelectedAddress = async () => {
    if (!isAdmin || (!selectedAddressId && !isCreatingAddress)) return;

    const title = formData.title.trim().replace(/\s+/g, ' ');
    const titleKey = title.toLowerCase();
    const addresses = currentUserData.addresses || [];
    const errors: Record<string, string> = {};
    if (!title) {
      errors.title = isPersian ? 'عنوان نشانی الزامی است.' : 'Address title is required.';
    } else if (
      addresses.some(
        (address) =>
          address._id !== selectedAddressId &&
          (address.title || '').trim().replace(/\s+/g, ' ').toLowerCase() === titleKey,
      )
    ) {
      errors.title = isPersian
        ? 'این عنوان برای یکی دیگر از نشانی‌های این کاربر ثبت شده است.'
        : 'This user already has another address with this title.';
    }
    if (!formData.province.trim()) errors.province = isPersian ? 'انتخاب استان الزامی است.' : 'Province is required.';
    if (!formData.city.trim()) errors.city = isPersian ? 'انتخاب شهر الزامی است.' : 'City is required.';
    if (!formData.address.trim()) errors.address = isPersian ? 'نشانی دقیق الزامی است.' : 'Street address is required.';

    const postalCode = formData.postalCode ? toEnglishDigits(formData.postalCode).trim() : '';
    if (postalCode && !/^\d{10}$/.test(postalCode)) {
      errors.postalCode = isPersian ? 'کد پستی باید دقیقاً ۱۰ رقم عددی باشد.' : 'Postal code must be exactly 10 digits.';
    }

    const recipientPhone = formData.recipientPhone
      ? toEnglishDigits(formData.recipientPhone).trim()
      : '';
    if (recipientPhone && !/^09\d{9}$/.test(recipientPhone)) {
      errors.recipientPhone = isPersian
        ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
        : 'Recipient phone must be an 11-digit mobile number.';
    }
    const recipientEmail = formData.recipientEmail.trim().toLowerCase();
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      errors.recipientEmail = isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email format.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSaving(true);
    try {
      const addressData = {
          title,
          province: formData.province.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
          postalCode,
          buildingNumber: formData.buildingNumber.trim(),
          unit: formData.unit.trim(),
          recipientName: formData.recipientName.trim(),
          recipientPhone,
          recipientEmail,
          addressNotes: formData.addressNotes.trim(),
      };
      const response = isCreatingAddress
        ? await adminApi.createUserAddress(currentUserData._id, addressData)
        : await adminApi.updateUserAddress(currentUserData._id, selectedAddressId!, addressData);
      const updatedAddresses: IUserAddress[] = response?.addresses || [];
      updateAddressProjection(updatedAddresses);
      if (addressEditOnly) {
        setIsEditing(false);
        setSelectedTab('address');
      } else {
        setSelectedEditTab('addresses');
      }
      setAddressEditOnly(false);
      setIsCreatingAddress(false);
      setSelectedAddressId(null);
      setFieldErrors({});
      toast.success(
        response?.message ||
          (isPersian
            ? isCreatingAddress ? 'نشانی جدید ثبت شد.' : 'نشانی با موفقیت ویرایش شد.'
            : isCreatingAddress ? 'Address created.' : 'Address updated.'),
      );
    } catch (error: any) {
      console.error('Failed to update user address', error);
      if (error?.response?.status === 409) {
        setFieldErrors({
          title: isPersian
            ? 'این عنوان برای یکی دیگر از نشانی‌های این کاربر ثبت شده است.'
            : 'This user already has another address with this title.',
        });
      }
      const message =
        error?.response?.data?.message ||
        (isPersian
          ? isCreatingAddress ? 'ثبت نشانی انجام نشد.' : 'خطا در ویرایش نشانی کاربر.'
          : isCreatingAddress ? 'Failed to create the address.' : 'Failed to update the user address.');
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete || !currentUserData) return;

    setIsDeletingAddress(true);
    try {
      const response = await adminApi.deleteUserAddress(currentUserData._id, addressToDelete._id);
      const updatedAddresses: IUserAddress[] = response?.addresses || [];
      updateAddressProjection(updatedAddresses);
      setAddressToDelete(null);
      toast.success(response?.message || (isPersian ? 'نشانی با موفقیت حذف شد.' : 'Address deleted.'));
    } catch (error: any) {
      console.error('Failed to delete user address', error);
      const message =
        error?.response?.data?.message ||
        (isPersian ? 'حذف نشانی انجام نشد.' : 'Failed to delete the address.');
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsDeletingAddress(false);
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

    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = isPersian ? 'نام و نام خانوادگی الزامی است.' : 'Full name is required.';
    if (!formData.username.trim()) errors.username = isPersian ? 'نام کاربری الزامی است.' : 'Username is required.';

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email format.';
      }
    }

    const cleanPhone = formData.phone ? toEnglishDigits(formData.phone).trim() : '';
    if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
      errors.phone = isPersian
        ? 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.'
        : 'Phone number must be an 11-digit Iranian mobile number (09...).';
    }

    if (formData.password && formData.password.length < 12) {
      errors.password = isPersian ? 'رمز عبور باید حداقل ۱۲ کاراکتر باشد.' : 'Password must be at least 12 characters long.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSaving(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : '',
        phone: cleanPhone,
        role: formData.role,
        isVip: formData.isVip,
        vipExpiresAt: formData.isVip ? formData.vipExpiresAt : null,
        avatar: formData.avatar.trim(),
        birthDate: formData.birthDate || null,
        birthDateShamsi: formData.birthDateShamsi || null,
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
  const isAddressEditor =
    Boolean(selectedAddressId || isCreatingAddress) && selectedEditTab === 'shipping';

  const renderAddressList = (context: 'view' | 'edit') => {
    if (loadingAddresses) {
      return (
        <div className="space-y-3">
          {[1, 2].map((item) => <Skeleton key={item} className="h-36 w-full rounded-2xl" />)}
        </div>
      );
    }

    if (addressLoadFailed) {
      return (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-brand-text">
            {isPersian ? 'بارگذاری نشانی‌ها ناموفق بود' : 'Could not load addresses'}
          </h4>
          <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
            {isPersian
              ? 'برای دیدن نشانی‌های این کاربر دوباره تلاش کنید.'
              : 'Try again to load this user’s addresses.'}
          </p>
          <Button
            size="sm"
            variant="bordered"
            onPress={() => setAddressReloadCount((count) => count + 1)}
            startContent={<RefreshCw className="w-3.5 h-3.5" />}
            className="mx-auto text-xs font-bold border-brand-gold/50 text-brand-bronze dark:text-brand-gold rounded-xl"
          >
            {isPersian ? 'تلاش دوباره' : 'Retry'}
          </Button>
        </div>
      );
    }

    const addresses = currentUserData.addresses || [];
    if (!addresses.length) {
      return (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated mx-auto flex items-center justify-center text-brand-text-muted">
            <MapPin className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-brand-text">
            {isPersian ? 'هیچ آدرسی ثبت نشده است' : 'No Address Registered'}
          </h4>
          <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
            {isPersian
              ? 'این کاربر هنوز نشانی ثبت نکرده است.'
              : 'This user has not saved an address yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-brand-text-muted">
          {isPersian
            ? `${toPersianDigits(addresses.length)} نشانی ثبت شده است. برای ویرایش، نشانی موردنظر را انتخاب کنید.`
            : `${addresses.length} saved addresses. Choose one to edit it.`}
        </p>
        {addresses.map((address) => (
          <article
            key={address._id}
            className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-brand-text">
                    {address.title || (isPersian ? 'نشانی بدون عنوان' : 'Untitled address')}
                  </h3>
                  {address.isDefault && (
                    <Chip size="sm" variant="flat" className="h-5 text-[10px] font-bold bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30">
                      {isPersian ? 'پیش‌فرض' : 'Default'}
                    </Chip>
                  )}
                </div>
                <p className="text-xs font-bold text-brand-text-muted">
                  {address.province || '—'}، {address.city || '—'}
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => handleStartAddressEdit(address, context === 'view')}
                    startContent={<Pencil className="w-3.5 h-3.5" />}
                    className="h-8 text-xs font-bold border-brand-gold/50 text-brand-bronze dark:text-brand-gold rounded-xl"
                  >
                    {isPersian ? 'ویرایش نشانی' : 'Edit address'}
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    aria-label={isPersian ? `حذف نشانی ${address.title}` : `Delete ${address.title}`}
                    title={isPersian ? 'حذف نشانی' : 'Delete address'}
                    onPress={() => setAddressToDelete(address)}
                    className="h-8 w-8 min-w-8 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-brand-text leading-relaxed">
              {address.address || '—'}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-brand-border/40 text-[11px] text-brand-text-muted">
              <span>{isPersian ? 'پلاک' : 'Building'}: <strong className="text-brand-text">{address.buildingNumber || '—'}</strong></span>
              <span>{isPersian ? 'واحد' : 'Unit'}: <strong className="text-brand-text">{address.unit || '—'}</strong></span>
              <span>{isPersian ? 'کد پستی' : 'Postal code'}: <strong className="font-mono text-brand-text">{address.postalCode ? toPersianDigits(address.postalCode) : '—'}</strong></span>
              <span>{isPersian ? 'تحویل‌گیرنده' : 'Recipient'}: <strong className="text-brand-text">{address.recipientName || '—'}</strong></span>
              {address.recipientPhone && (
                <span>{isPersian ? 'تلفن' : 'Phone'}: <strong className="font-mono text-brand-text">{toPersianDigits(address.recipientPhone)}</strong></span>
              )}
            </div>
            {address.addressNotes && (
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {isPersian ? 'یادداشت:' : 'Notes:'} {address.addressNotes}
              </p>
            )}
          </article>
        ))}
      </div>
    );
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setAddressToDelete(null);
          setIsDeletingAddress(false);
        }
        onOpenChange?.(open);
      }}
      onClose={handleModalClose}
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
        body: 'admin-details-scroll min-h-0 flex-1 p-5 sm:p-6 overflow-y-auto',
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
                        className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-bronze to-brand-gold border border-white/40 flex items-center justify-center shadow-md text-[#1a1f1a]"
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
                          className="bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30 text-[10px] font-black h-6"
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
                      onPress={() => {
                        if (addressEditOnly) {
                          setIsEditing(false);
                          setAddressEditOnly(false);
                          setIsCreatingAddress(false);
                          setSelectedAddressId(null);
                          setSelectedTab('address');
                          setFieldErrors({});
                        } else {
                          if (isEditing) {
                            setIsCreatingAddress(false);
                            setSelectedAddressId(null);
                            setFieldErrors({});
                          } else {
                            setSelectedEditTab('identity');
                            setFieldErrors({});
                            setIsCreatingAddress(false);
                            setSelectedAddressId(null);
                          }
                          setIsEditing(!isEditing);
                        }
                      }}
                      startContent={
                        isEditing ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />
                      }
                      className={`font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all ${
                        isEditing
                          ? 'bg-brand-gold text-[#141914]'
                          : 'border-brand-gold/60 text-brand-bronze dark:text-brand-gold hover:bg-brand-gold/10'
                      }`}
                    >
                      {isEditing
                        ? addressEditOnly
                          ? isPersian ? 'بازگشت به فهرست نشانی‌ها' : 'Back to address list'
                          : isPersian ? 'انصراف از ویرایش' : 'Exit Edit Mode'
                        : isPersian
                        ? 'ویرایش مشخصات حساب'
                        : 'Edit Account Details'}
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
              <div className="px-5 sm:px-6 pt-3 border-b border-brand-border/40 bg-brand-gold/5 shrink-0">
                {addressEditOnly ? (
                  <div className="flex items-center gap-2 h-10 text-xs font-black text-brand-bronze dark:text-brand-gold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {isCreatingAddress
                        ? isPersian ? 'افزودن نشانی جدید' : 'Add a new address'
                        : isPersian ? `ویرایش نشانی «${formData.title}»` : `Editing “${formData.title}”`}
                    </span>
                  </div>
                ) : selectedEditTab === 'shipping' ? (
                  <div className="flex items-center justify-between gap-3 h-10">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setSelectedAddressId(null);
                        setIsCreatingAddress(false);
                        setSelectedEditTab('addresses');
                        setFieldErrors({});
                      }}
                      startContent={<ChevronLeft className="w-3.5 h-3.5" />}
                      className="text-xs font-bold text-brand-bronze dark:text-brand-gold"
                    >
                      {isPersian ? 'بازگشت به فهرست نشانی‌ها' : 'Back to addresses'}
                    </Button>
                    <span className="text-xs font-black text-brand-bronze dark:text-brand-gold">
                      {isPersian ? `ویرایش نشانی «${formData.title}»` : `Editing “${formData.title}”`}
                    </span>
                  </div>
                ) : (
                  <Tabs
                    selectedKey={selectedEditTab}
                    onSelectionChange={(k) => setSelectedEditTab(k as string)}
                    variant="underlined"
                    classNames={{
                      tabList: 'gap-6 p-0 border-b-0',
                      cursor: 'w-full bg-brand-gold h-0.5 rounded-full',
                      tab: 'max-w-fit px-1 h-10 text-xs font-bold text-brand-text-muted data-[selected=true]:text-brand-bronze dark:data-[selected=true]:text-brand-gold data-[selected=true]:font-black',
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
                      key="addresses"
                      title={
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{isPersian ? 'نشانی‌ها' : 'Addresses'}</span>
                          {currentUserData.addresses?.length ? (
                            <Chip size="sm" variant="flat" className="h-4 text-[10px] px-1 font-bold">
                              {toPersianDigits(currentUserData.addresses.length)}
                            </Chip>
                          ) : null}
                        </div>
                      }
                    />
                  </Tabs>
                )}
              </div>
            )}

            {/* Modal Body with smooth opacity transition and zero container jumping */}
            <ModalBody className="admin-details-scroll min-h-0 p-5 sm:p-6 overflow-y-auto">
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
                    <div className="p-3.5 rounded-2xl bg-brand-gold/8 border border-brand-gold/20 text-xs text-brand-bronze dark:text-brand-gold flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {addressEditOnly
                          || ((selectedAddressId || isCreatingAddress) && selectedEditTab === 'shipping')
                          ? isPersian
                            ? 'اطلاعات همین نشانی ویرایش می‌شود. عنوان باید برای این کاربر یکتا باشد.'
                            : 'You are editing this address. Its title must be unique for this user.'
                          : isPersian
                            ? 'شما به عنوان مدیر ارشد سیستم مجاز به تغییر اطلاعات هویتی، رمز عبور، نقش دسترسی و عضویت VIP این کاربر هستید.'
                            : 'As a Super Admin, you can update this user’s identity, password, role, and VIP membership.'}
                      </p>
                    </div>

                    {/* EDIT TAB 1: IDENTITY & PASSWORD */}
                    {selectedEditTab === 'identity' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            dir="auto"
                            label={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                            labelPlacement="outside-top"
                            isRequired
                            isInvalid={Boolean(fieldErrors.fullName)}
                            errorMessage={fieldErrors.fullName}
                            value={formData.fullName}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, fullName: val }));
                              if (val.trim()) clearFieldError('fullName');
                            }}
                            placeholder={isPersian ? 'مثال: علیرضا محمدی' : 'e.g. John Doe'}
                            startContent={<UserIcon className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-bold text-brand-text',
                            }}
                          />

                          <Input
                            dir="auto"
                            label={isPersian ? 'نام کاربری (یکتا)' : 'Username (Unique)'}
                            labelPlacement="outside-top"
                            isRequired
                            isInvalid={Boolean(fieldErrors.username)}
                            errorMessage={fieldErrors.username}
                            value={formData.username}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, username: val.toLowerCase() }));
                              if (val.trim()) clearFieldError('username');
                            }}
                            startContent={<span className="text-brand-bronze dark:text-brand-gold text-xs font-mono font-bold me-3">@</span>}
                            placeholder="username"
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-mono font-bold text-brand-text text-start',
                            }}
                          />

                          <Input
                            label={isPersian ? 'آدرس ایمیل (اختیاری)' : 'Email Address (Optional)'}
                            labelPlacement="outside-top"
                            type="email"
                            isInvalid={Boolean(fieldErrors.email)}
                            errorMessage={fieldErrors.email}
                            value={formData.email}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, email: val.toLowerCase() }));
                              clearFieldError('email');
                            }}
                            startContent={<Mail className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            placeholder="user@domain.com"
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
                            label={isPersian ? 'شماره تلفن همراه' : 'Mobile Phone'}
                            labelPlacement="outside-top"
                            type="tel"
                            isInvalid={Boolean(fieldErrors.phone)}
                            errorMessage={fieldErrors.phone}
                            maxLength={11}
                            value={formData.phone}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, phone: toEnglishDigits(val).replace(/\D/g, '').slice(0, 11) }));
                              clearFieldError('phone');
                            }}
                            startContent={<Phone className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            placeholder="09123456789"
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

                        {/* Custom Role Dropdown (matching BirthDatePicker & ProvinceCitySelect) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div ref={roleDropdownRef} className="space-y-1.5 relative">
                            <label className="block text-xs font-bold text-brand-text">
                              {isPersian ? 'نقش کاربری در سامانه' : 'System Role'}
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                                className={`w-full h-12 px-4 rounded-2xl bg-brand-surface border transition-all flex items-center justify-between gap-2 text-right cursor-pointer select-none ${
                                  isRoleDropdownOpen
                                    ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-sm'
                                    : 'border-brand-border hover:border-brand-gold/70'
                                }`}
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
                                      : (isPersian ? 'کاربر عادی' : 'Standard User')}
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

                          <Input
                            dir="auto"
                            label={isPersian ? 'لینک تصویر آواتار (URL)' : 'Avatar Image URL'}
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

                          <PasswordInput
                            isPersian={isPersian}
                            isVisible={showPassword}
                            onToggleVisibility={() => setShowPassword((prev) => !prev)}
                            aria-label={isPersian ? 'تنظیم کلمه عبور جدید' : 'Set New Password'}
                            isInvalid={Boolean(fieldErrors.password)}
                            errorMessage={fieldErrors.password}
                            value={formData.password}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, password: val }));
                              if (!val || val.length >= 6) clearFieldError('password');
                            }}
                            placeholder={
                              isPersian
                                ? 'کلمه عبور جدید را وارد کنید (حداقل ۱۲ کاراکتر)...'
                                : 'Enter new password (min 12 characters)...'
                            }
                            startContent={<Lock className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            toggleAriaLabel={isPersian ? 'تغییر نمایش کلمه عبور' : 'Toggle password visibility'}
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-mono font-semibold text-brand-text text-start',
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

                    {selectedEditTab === 'addresses' && (
                      <div className="space-y-4">
                        <p className="text-xs text-brand-text-muted">
                          {isPersian
                            ? 'برای ویرایش یا حذف، نشانی موردنظر را انتخاب کنید.'
                            : 'Choose an address to edit or delete it.'}
                        </p>
                        {isAdmin && (
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            onPress={() => handleStartAddressCreate(false)}
                            startContent={<Plus className="w-4 h-4" />}
                            className="font-bold text-xs bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30 rounded-xl"
                          >
                            {isPersian ? 'افزودن نشانی جدید' : 'Add address'}
                          </Button>
                        )}
                        {renderAddressList('edit')}
                      </div>
                    )}

                    {/* EDIT TAB 3: SHIPPING ADDRESS */}
                    {(selectedAddressId || isCreatingAddress) && selectedEditTab === 'shipping' && (
                      <div className="admin-address-fields space-y-5">
                        <Input
                          label={isPersian ? 'عنوان نشانی *' : 'Address Title *'}
                          dir="auto"
                          labelPlacement="outside-top"
                          isRequired
                          isInvalid={Boolean(fieldErrors.title)}
                          value={formData.title}
                          onValueChange={(value) => {
                            setFormData((previous) => ({ ...previous, title: value }));
                            clearFieldError('title');
                          }}
                          placeholder={isPersian ? 'مثلاً خانه، محل کار' : 'e.g. Home, Office'}
                          startContent={<Building className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            label: inputLabelClass,
                            inputWrapper: inputWrapperClass,
                            innerWrapper: 'gap-3',
                            input: 'text-sm font-bold text-brand-text text-start',
                          }}
                        />
                        <AnimatedFieldError error={fieldErrors.title} />

                        {/* Province & City Select (matching BirthDatePicker custom dropdown) */}
                        <ProvinceCitySelect
                          province={formData.province}
                          city={formData.city}
                          required
                          provinceError={fieldErrors.province}
                          cityError={fieldErrors.city}
                          onChangeProvince={(prov) => {
                            setFormData((prev) => ({
                              ...prev,
                              province: prov,
                              city: '',
                            }));
                            clearFieldError('province');
                            clearFieldError('city');
                          }}
                          onChangeCity={(cityName) => {
                            setFormData((prev) => ({
                              ...prev,
                              city: cityName,
                            }));
                            clearFieldError('city');
                          }}
                        />

                        {/* Full Address */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <label className="text-xs font-bold text-brand-text">
                              {isPersian ? 'نشانی دقیق پستی (خیابان، کوچه، بن‌بست)' : 'Street Address'}
                            </label>
                          </div>
                          <Textarea
                            aria-label={isPersian ? 'نشانی دقیق پستی (خیابان، کوچه، بن‌بست)' : 'Street Address'}
                            dir="auto"
                            isInvalid={Boolean(fieldErrors.address)}
                            value={formData.address}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, address: val }));
                              if (val.trim()) clearFieldError('address');
                            }}
                            disableAutosize
                            rows={3}
                            placeholder={
                              isPersian
                                ? 'مثال: بلوار کشاورز، خیابان ۱۶ آذر، کوچه بهار، ساختمان شماره ۵'
                                : 'Street address details...'
                            }
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              inputWrapper:
                                'p-3.5 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-24 min-h-[96px] !resize-none',
                              innerWrapper: 'items-start h-full',
                              input:
                                'text-sm font-medium text-brand-text leading-relaxed text-start !resize-none resize-none overflow-y-auto px-2 pt-0',
                            }}
                          />
                          <AnimatedFieldError error={fieldErrors.address} />
                        </div>

                        {/* Postal Code, Building, Unit */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Input
                              dir="auto"
                              label={isPersian ? 'کد پستی ۱۰ رقمی' : 'Postal Code'}
                              labelPlacement="outside-top"
                              isInvalid={Boolean(fieldErrors.postalCode)}
                              value={formData.postalCode}
                              onValueChange={(val) => {
                                setFormData((prev) => ({ ...prev, postalCode: toEnglishDigits(val).replace(/\D/g, '').slice(0, 10) }));
                                clearFieldError('postalCode');
                              }}
                              placeholder="1234567890"
                              maxLength={10}
                              startContent={<Hash className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                              variant="bordered"
                              radius="lg"
                              classNames={{
                                label: inputLabelClass,
                                inputWrapper: inputWrapperClass,
                                innerWrapper: 'gap-3',
                                input: 'text-sm font-mono font-bold text-brand-text text-start',
                              }}
                            />
                            <AnimatedFieldError error={fieldErrors.postalCode} />
                          </div>

                          <Input
                            label={isPersian ? 'پلاک' : 'Building / No'}
                            dir="auto"
                            labelPlacement="outside-top"
                            value={formData.buildingNumber}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, buildingNumber: val }))
                            }
                            placeholder={isPersian ? 'مثال: ۲۴' : 'e.g. 24'}
                            startContent={<Building className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-bold text-brand-text text-start',
                            }}
                          />

                          <Input
                            label={isPersian ? 'واحد' : 'Unit'}
                            dir="auto"
                            labelPlacement="outside-top"
                            value={formData.unit}
                            onValueChange={(val) => setFormData((prev) => ({ ...prev, unit: val }))}
                            placeholder={isPersian ? 'مثال: ۳' : 'e.g. 3'}
                            startContent={<Home className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-bold text-brand-text text-start',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 4: RECIPIENT & NOTES */}
                    {(selectedAddressId || isCreatingAddress) && selectedEditTab === 'shipping' && (
                      <div className="admin-address-fields space-y-5">
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
                            dir="auto"
                            labelPlacement="outside-top"
                            value={formData.recipientName}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, recipientName: val }))
                            }
                            placeholder={isPersian ? 'نام شخص دریافت‌کننده' : 'Recipient Name'}
                            startContent={<UserIcon className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              label: inputLabelClass,
                              inputWrapper: inputWrapperClass,
                              innerWrapper: 'gap-3',
                              input: 'text-sm font-bold text-brand-text text-start',
                            }}
                          />

                          <div>
                            <Input
                              label={isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone Number'}
                              labelPlacement="outside-top"
                              type="tel"
                              isInvalid={Boolean(fieldErrors.recipientPhone)}
                              maxLength={11}
                              value={formData.recipientPhone}
                              onValueChange={(val) => {
                                setFormData((prev) => ({ ...prev, recipientPhone: toEnglishDigits(val).replace(/\D/g, '').slice(0, 11) }));
                                clearFieldError('recipientPhone');
                              }}
                              placeholder="09123456789"
                              startContent={<Phone className="w-4 h-4 text-brand-bronze dark:text-brand-gold shrink-0 me-3" />}
                              variant="bordered"
                              radius="lg"
                              classNames={{
                                label: inputLabelClass,
                                inputWrapper: inputWrapperClass,
                                innerWrapper: 'gap-3',
                                input: 'text-sm font-mono font-bold text-brand-text text-start',
                              }}
                            />
                            <AnimatedFieldError error={fieldErrors.recipientPhone} />
                          </div>
                        </div>

                        <div>
                          <Input
                            label={isPersian ? 'ایمیل تحویل‌گیرنده (اختیاری)' : 'Recipient Email (Optional)'}
                            labelPlacement="outside-top"
                            type="email"
                            isInvalid={Boolean(fieldErrors.recipientEmail)}
                            value={formData.recipientEmail}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, recipientEmail: val.toLowerCase() }));
                              clearFieldError('recipientEmail');
                            }}
                            placeholder="recipient@domain.com"
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
                          <AnimatedFieldError error={fieldErrors.recipientEmail} />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <label className="text-xs font-bold text-brand-text">
                              {isPersian ? 'توضیحات و یادداشت تحویل' : 'Delivery / Address Notes'}
                            </label>
                          </div>
                          <Textarea
                            aria-label={isPersian ? 'توضیحات و یادداشت تحویل' : 'Delivery / Address Notes'}
                            dir="auto"
                            value={formData.addressNotes}
                            onValueChange={(val) =>
                              setFormData((prev) => ({ ...prev, addressNotes: val }))
                            }
                            disableAutosize
                            rows={3}
                            placeholder={
                              isPersian
                                ? 'مثال: زنگ دوم سمت راست، لطفاً قبل از مراجعه تماس گرفته شود.'
                                : 'Special instructions for courier...'
                            }
                            variant="bordered"
                            radius="lg"
                            classNames={{
                              inputWrapper:
                                'p-3.5 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-24 min-h-[96px] !resize-none',
                              innerWrapper: 'items-start h-full',
                              input:
                                'text-sm font-medium text-brand-text leading-relaxed text-start !resize-none resize-none overflow-y-auto px-2 pt-0',
                            }}
                          />
                        </div>
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
                        {isAdmin && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              onPress={() => handleStartAddressCreate(true)}
                              startContent={<Plus className="w-4 h-4" />}
                              className="font-bold text-xs bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30 rounded-xl"
                            >
                              {isPersian ? 'افزودن نشانی جدید' : 'Add address'}
                            </Button>
                          </div>
                        )}
                        {renderAddressList('view')}
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
                                className="p-4 rounded-2xl border border-brand-border/60 bg-brand-surface-elevated/30 hover:bg-brand-surface-elevated/50 transition-colors space-y-3"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                        {getOrderStatusLabel(order.status, isPersian)}
                                      </Chip>
                                      {isAdmin && (
                                        <OrderStatusSelect
                                          value={order.status}
                                          onChange={(status) => {
                                            if (status) void handleOrderStatusChange(order, status);
                                          }}
                                          isPersian={isPersian}
                                          compact
                                          className="w-40"
                                          loading={updatingOrderStatusId === order._id}
                                          disabled={updatingOrderStatusId !== null && updatingOrderStatusId !== order._id}
                                          ariaLabel={isPersian ? 'تغییر وضعیت سفارش' : 'Change order status'}
                                        />
                                      )}
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

                                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <div className="text-start sm:text-end shrink-0">
                                      <span className="text-[11px] text-brand-text-muted block">
                                        {isPersian ? 'مبلغ کل سفارش' : 'Total Amount'}
                                      </span>
                                      <span className="font-black text-sm text-brand-bronze dark:text-brand-gold">
                                        {formatToman(order.total, isPersian)}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      aria-expanded={expandedOrderId === order._id}
                                      onPress={() => {
                                        const willExpand = expandedOrderId !== order._id;
                                        setExpandedOrderId(willExpand ? order._id : null);
                                        if (willExpand) void loadAdminChangeNotes(order._id);
                                      }}
                                      endContent={<ChevronDown className={`h-4 w-4 transition-transform ${expandedOrderId === order._id ? 'rotate-180' : ''}`} />}
                                      className="h-9 rounded-xl bg-brand-surface px-3 text-xs font-bold text-brand-bronze dark:text-brand-gold"
                                    >
                                      {expandedOrderId === order._id
                                        ? (isPersian ? 'بستن جزئیات' : 'Hide details')
                                        : (isPersian ? 'جزئیات کامل' : 'Full details')}
                                    </Button>
                                  </div>
                                </div>
                                <AnimatePresence initial={false}>
                                  {expandedOrderId === order._id && (
                                    <motion.div
                                      key={`order-details-${order._id}`}
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 6 }}
                                      transition={{ duration: 0.18, ease: 'easeOut' }}
                                      className="border-t border-brand-border pt-4"
                                    >
                                      {editingOrderId === order._id ? (
                                        <OrderEditForm
                                          order={order}
                                          isPersian={isPersian}
                                          onCancel={() => setEditingOrderId(null)}
                                          onSaved={(updatedOrder) => {
                                            setOrders((previous) => previous.map((item) => item._id === updatedOrder._id ? updatedOrder : item));
                                            setAdminChangeNotesByOrder((previous) => ({
                                              ...previous,
                                              [updatedOrder._id]: updatedOrder.adminChangeNotes || previous[updatedOrder._id] || [],
                                            }));
                                            setEditingOrderId(null);
                                          }}
                                        />
                                      ) : (
                                        <>
                                          <OrderDetailsPanel
                                            order={order}
                                            isPersian={isPersian}
                                            adminChangeNotes={adminChangeNotesByOrder[order._id]}
                                            headerActions={isAdmin ? (
                                              <Button
                                                size="sm"
                                                variant="flat"
                                                onPress={() => setEditingOrderId(order._id)}
                                                startContent={<Pencil className="h-3.5 w-3.5" />}
                                                className="h-9 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3 text-xs font-black text-brand-bronze dark:text-brand-gold"
                                              >
                                                {isPersian ? 'ویرایش گیرنده و اقلام' : 'Edit recipient and items'}
                                              </Button>
                                            ) : null}
                                          />
                                        </>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
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
                    onPress={() => {
                      setFieldErrors({});
                      if (isAddressEditor) {
                        setSelectedAddressId(null);
                        setIsCreatingAddress(false);
                        if (addressEditOnly) {
                          setAddressEditOnly(false);
                          setIsEditing(false);
                          setSelectedTab('address');
                        } else {
                          setSelectedEditTab('addresses');
                        }
                        return;
                      }
                      setIsEditing(false);
                    }}
                    startContent={<X className="w-4 h-4" />}
                    className="font-bold text-xs bg-brand-surface-elevated text-brand-text border border-brand-border/60 rounded-xl h-9 cursor-pointer"
                  >
                    {isAddressEditor
                      ? isPersian ? 'بازگشت به فهرست نشانی‌ها' : 'Back to addresses'
                      : isPersian ? 'انصراف' : 'Cancel'}
                  </Button>

                  <Button
                    size="sm"
                    color="warning"
                    variant="solid"
                    isLoading={isSaving}
                    onPress={
                      isAddressEditor
                        ? handleSaveSelectedAddress
                        : handleSaveAll
                    }
                    startContent={!isSaving && <Save className="w-4 h-4" />}
                    className="font-black text-xs bg-brand-gold text-[#141914] shadow-md rounded-xl h-9 px-4 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                  >
                    {isAddressEditor
                      ? isPersian ? 'ذخیره این نشانی' : 'Save this address'
                      : isPersian ? 'ذخیره تغییرات' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                /* View Mode Footer */
                <>
                  <div className="flex items-center gap-2">
                    {isAdmin && !isSelf && onDeleteUser && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => {
                          onDeleteUser(currentUserData._id, currentUserData.fullName);
                        }}
                        startContent={<Trash2 className="w-4 h-4" />}
                        className="font-bold text-xs cursor-pointer hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"
                      >
                        {isPersian ? 'حذف حساب کاربر' : 'Delete Account'}
                      </Button>
                    )}
                    {isSelf && (
                      <Chip
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-brand-gold/15 border border-brand-gold/30 px-3 py-1",
                          content: "text-brand-bronze dark:text-brand-gold text-xs font-black flex items-center gap-1",
                        }}
                        startContent={<UserIcon className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                      >
                        {isPersian ? 'حساب کاربری شما (محافظت‌شده)' : 'Your Account (Protected)'}
                      </Chip>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        size="sm"
                        color="warning"
                        variant="flat"
                        onPress={() => {
                          setSelectedEditTab('identity');
                          setIsEditing(true);
                        }}
                        startContent={<Pencil className="w-3.5 h-3.5" />}
                        className="font-black text-xs bg-brand-gold/15 text-brand-bronze dark:text-brand-gold border border-brand-gold/30 rounded-xl h-9 cursor-pointer hover:bg-brand-gold/25"
                      >
                        {isPersian ? 'ویرایش مشخصات' : 'Edit Details'}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="flat"
                      onPress={handleModalClose}
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
    <AdminConfirmModal
      isOpen={Boolean(addressToDelete)}
      onOpenChange={(open) => {
        if (!open) setAddressToDelete(null);
      }}
      title={isPersian ? 'حذف نشانی کاربر' : 'Delete user address'}
      description={
        isPersian ? (
          <div>
            <p>
              آیا از حذف نشانی <strong>«{addressToDelete?.title || 'انتخاب‌شده'}»</strong> اطمینان دارید؟
            </p>
            <p className="mt-1 text-rose-500">
              این عملیات قابل بازگشت نیست.
            </p>
          </div>
        ) : (
          <div>
            <p>
              Are you sure you want to delete <strong>&quot;{addressToDelete?.title || 'Selected address'}&quot;</strong>?
            </p>
            <p className="mt-1 text-rose-500">This action cannot be undone.</p>
          </div>
        )
      }
      confirmText={isPersian ? 'حذف نشانی' : 'Delete address'}
      cancelText={isPersian ? 'انصراف' : 'Cancel'}
      confirmColor="danger"
      isLoading={isDeletingAddress}
      onConfirm={handleConfirmDeleteAddress}
    />
    </>
  );
};
