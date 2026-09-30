'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from '@heroui/react';
import {
  Users,
  Search,
  Crown,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  MapPin,
  Trash2,
  Filter,
  User as UserIcon,
  ChevronDown,
  Eye,
  Pencil,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IUser } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate } from '@/common/utils/date';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

// Calm, elegant, ultra-smooth glide-down motion for select boxes and dropdowns
const softDropdownMotionProps = {
  variants: {
    initial: {
      opacity: 0,
      y: -10,
      scale: 0.98,
    },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        y: {
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const, // Apple fluid deceleration curve
        },
        scale: {
          duration: 0.38,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        opacity: {
          duration: 0.26,
          ease: 'easeOut' as const,
        },
      },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: [0.32, 0, 0.67, 0] as const,
      },
    },
  },
};

const ROLE_CONFIG = {
  admin: {
    id: 'admin',
    labelFa: 'مدیر کل',
    labelEn: 'Admin',
    badgeClass: 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold',
    iconColor: 'text-amber-500 dark:text-amber-400',
    icon: ShieldAlert,
  },
  editor: {
    id: 'editor',
    labelFa: 'ویراستار',
    labelEn: 'Editor',
    badgeClass: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    icon: ShieldCheck,
  },
  user: {
    id: 'user',
    labelFa: 'کاربر عادی',
    labelEn: 'User',
    badgeClass: 'bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium',
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    icon: UserIcon,
  },
};

const ROLE_OPTIONS = [
  { key: 'admin', labelFa: 'مدیر کل', labelEn: 'Admin', icon: ShieldAlert, iconColor: 'text-amber-500 dark:text-amber-400' },
  { key: 'editor', labelFa: 'ویراستار', labelEn: 'Editor', icon: ShieldCheck, iconColor: 'text-emerald-500 dark:text-emerald-400' },
  { key: 'user', labelFa: 'کاربر عادی', labelEn: 'User', icon: UserIcon, iconColor: 'text-neutral-500 dark:text-neutral-400' },
];

const ROLE_FILTER_OPTIONS = [
  { key: 'all', labelFa: 'همه نقش‌های کاربری', labelEn: 'All User Roles', icon: Users, iconColor: 'text-brand-gold' },
  ...ROLE_OPTIONS,
];

function UserRoleCell({
  user,
  isAdmin,
  isPersian,
  onRoleChange,
}: {
  user: IUser;
  isAdmin: boolean;
  isPersian: boolean;
  onRoleChange: (userId: string, newRole: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const rawRole = (user.role || '').toLowerCase().trim();
  const roleKey = (rawRole in ROLE_CONFIG ? rawRole : 'user') as keyof typeof ROLE_CONFIG;
  const roleDef = ROLE_CONFIG[roleKey];
  const Icon = roleDef.icon;

  if (!isAdmin) {
    return (
      <Chip
        variant="flat"
        size="sm"
        radius="full"
        startContent={<Icon className={`w-3.5 h-3.5 shrink-0 ${roleDef.iconColor}`} />}
        classNames={{
          base: `h-8 px-3 rounded-full border shadow-2xs ${roleDef.badgeClass}`,
          content: "flex items-center gap-1.5 px-0 text-xs font-bold",
        }}
      >
        {isPersian ? roleDef.labelFa : roleDef.labelEn}
      </Chip>
    );
  }

  return (
    <Dropdown
      placement="bottom-start"
      offset={6}
      shouldBlockScroll={false}
      onOpenChange={setIsOpen}
      motionProps={softDropdownMotionProps}
      classNames={{
        base: "p-0",
        content: "min-w-[170px] p-1.5 bg-brand-surface/98 dark:bg-[#161c16]/98 backdrop-blur-2xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-xl z-50 will-change-transform",
      }}
    >
      <DropdownTrigger>
        <Button
          size="sm"
          radius="full"
          variant="bordered"
          className={`h-8 px-3 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-between gap-2 min-w-[125px] ${roleDef.badgeClass}`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${roleDef.iconColor}`} />
            <span className="truncate">{isPersian ? roleDef.labelFa : roleDef.labelEn}</span>
          </div>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-300 ease-out shrink-0 opacity-60 ${
              isOpen ? 'rotate-180 opacity-100 text-brand-gold' : ''
            }`}
          />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={isPersian ? 'تغییر نقش کاربری' : 'Change User Role'}
        onAction={(key) => {
          const selected = key as string;
          if (selected && selected !== roleKey) {
            onRoleChange(user._id, selected);
          }
        }}
        className="p-1"
      >
        {ROLE_OPTIONS.map((opt) => {
          const isSelected = roleKey === opt.key;
          const OptIcon = opt.icon;
          return (
            <DropdownItem
              key={opt.key}
              textValue={isPersian ? opt.labelFa : opt.labelEn}
              className={`rounded-xl py-2 px-2.5 text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-brand-gold/15 text-brand-gold font-bold'
                  : 'text-brand-text hover:bg-brand-surface-elevated'
              }`}
              startContent={<OptIcon className={`w-3.5 h-3.5 shrink-0 ${opt.iconColor}`} />}
              endContent={
                isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 mr-auto" />
                ) : null
              }
            >
              <span>{isPersian ? opt.labelFa : opt.labelEn}</span>
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}

export default function AdminUsersPage() {
  const { isPersian } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // HeroUI Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Details Modal State
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<IUser | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalMode, setDetailsModalMode] = useState<'view' | 'edit'>('view');

  // Create User Modal State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  // Multi-selection & Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Bulk Confirm Modal state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmConfig, setBulkConfirmConfig] = useState<{
    title: string;
    description: React.ReactNode;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isBulkConfirmLoading, setIsBulkConfirmLoading] = useState(false);

  const isCurrentUser = (user?: IUser | null) => {
    if (!user || !currentUser) return false;
    if (currentUser._id && user._id === currentUser._id) return true;
    if (currentUser.username && user.username && user.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
    if (currentUser.email && user.email && user.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.phone && user.phone && user.phone === currentUser.phone) return true;
    return false;
  };

  const selectableUsers = users.filter((u) => !isCurrentUser(u));
  const isAllSelected = selectableUsers.length > 0 && selectedIds.length === selectableUsers.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < selectableUsers.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(selectableUsers.map((u) => u._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    const target = users.find((u) => u._id === id);
    if (target && isCurrentUser(target)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkToggleVip = async (isVip: boolean) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'تغییر وضعیت VIP کاربران تنها برای مدیر کل مجاز است.'
          : 'Altering VIP status is restricted to Super Admins.',
      );
      return;
    }
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (selectedIds.includes(u._id) ? { ...u, isVip } : u)),
    );

    try {
      await adminApi.bulkUpdateUsersVip(selectedIds, isVip);
      toast.success(
        isVip
          ? isPersian
            ? `عضویت VIP برای ${toPersianDigits(selectedIds.length)} کاربر با موفقیت فعال گردید 👑`
            : `VIP granted for ${selectedIds.length} users.`
          : isPersian
          ? `عضویت VIP برای ${toPersianDigits(selectedIds.length)} کاربر با موفقیت لغو گردید.`
          : `VIP revoked for ${selectedIds.length} users.`,
      );
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت VIP گروهی.' : 'Failed to update VIP status.'),
      );
      loadUsers();
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف کاربران منحصراً برای مدیر کل مجاز است.'
          : 'Deleting users is restricted to Super Admins.',
      );
      return;
    }
    const cleanIds = selectedIds.filter((id) => {
      const u = users.find((item) => item._id === id);
      return u ? !isCurrentUser(u) : currentUser ? id !== currentUser._id : true;
    });

    if (cleanIds.length === 0) {
      toast.error(
        isPersian
          ? 'هیچ کاربری برای حذف انتخاب نشده است (حساب کاربری شما محافظت شده است).'
          : 'No deletable user accounts selected (your account is protected).',
      );
      return;
    }

    setBulkConfirmConfig({
      title: isPersian ? 'حذف گروهی کاربران' : 'Bulk Delete Users',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف گروهی <strong className="text-brand-text font-black">{toPersianDigits(cleanIds.length)}</strong> حساب کاربری اطمینان کامل دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این عملیات غیرقابل بازگشت است و حساب‌های انتخاب شده حذف خواهند شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete <strong className="text-brand-text font-bold">{cleanIds.length}</strong> user accounts?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف گروهی کاربران' : 'Yes, Delete All Users',
      action: async () => {
        setBulkActionLoading(true);
        try {
          await adminApi.bulkDeleteUsers(cleanIds);
          toast.success(
            isPersian
              ? `${toPersianDigits(cleanIds.length)} کاربر با موفقیت حذف شدند.`
              : `${cleanIds.length} users deleted successfully.`,
          );
          setSelectedIds([]);
          loadUsers();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              (isPersian ? 'خطا در حذف گروهی کاربران.' : 'Failed to delete users.'),
          );
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
    setBulkConfirmOpen(true);
  };

  const executeBulkConfirmAction = async () => {
    if (!bulkConfirmConfig) return;
    setIsBulkConfirmLoading(true);
    try {
      await bulkConfirmConfig.action();
      setBulkConfirmOpen(false);
      setBulkConfirmConfig(null);
    } finally {
      setIsBulkConfirmLoading(false);
    }
  };

  const handleOpenDetails = (user: IUser) => {
    setSelectedUserForDetails(user);
    setDetailsModalMode('view');
    setDetailsModalOpen(true);
  };

  const handleOpenEdit = (user: IUser) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'ویرایش اطلاعات کاربران تنها برای مدیر کل سیستم مجاز است.'
          : 'Editing user information is restricted to Super Admins.',
      );
      return;
    }
    setSelectedUserForDetails(user);
    setDetailsModalMode('edit');
    setDetailsModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: IUser) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? { ...u, ...updatedUser } : u))
    );
    setSelectedUserForDetails(updatedUser);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        pageSize: 15,
        q: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'تغییر نقش کاربر تنها برای مدیر کل سیستم مجاز است.'
          : 'Changing user roles is restricted to Super Admins.',
      );
      return;
    }

    const previousUsers = [...users];
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u))
    );
    setSelectedUserForDetails((prev) =>
      prev && prev._id === userId ? { ...prev, role: newRole as any } : prev
    );

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(isPersian ? 'نقش کاربر با موفقیت تغییر کرد.' : 'User role updated successfully.');
    } catch (err: any) {
      setUsers(previousUsers);
      setSelectedUserForDetails((prev) =>
        prev && prev._id === userId ? { ...prev, role: (previousUsers.find(u => u._id === userId)?.role || 'user') as any } : prev
      );
      toast.error(isPersian ? 'خطا در تغییر نقش کاربر.' : 'Failed to update user role.');
    }
  };

  const handleToggleVip = async (userId: string, currentVip: boolean) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'تغییر عضویت VIP تنها برای مدیر کل سیستم مجاز است.'
          : 'Altering VIP status is restricted to Super Admins.',
      );
      return;
    }

    const nextVip = !currentVip;
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isVip: nextVip } : u))
    );
    setSelectedUserForDetails((prev) =>
      prev && prev._id === userId ? { ...prev, isVip: nextVip } : prev
    );

    try {
      await adminApi.updateUserVip(userId, nextVip);
      toast.success(
        currentVip
          ? isPersian ? 'وضعیت VIP غیرفعال شد.' : 'VIP membership revoked.'
          : isPersian ? 'عضویت VIP برای کاربر فعال شد! 👑' : 'VIP membership granted! 👑',
      );
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isVip: currentVip } : u))
      );
      setSelectedUserForDetails((prev) =>
        prev && prev._id === userId ? { ...prev, isVip: currentVip } : prev
      );
      toast.error(isPersian ? 'خطا در تغییر وضعیت VIP.' : 'Failed to update VIP status.');
    }
  };

  const handleDeleteClick = (userId: string, name: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف کاربر تنها برای مدیر کل سیستم مجاز است.'
          : 'Deleting users is restricted to Super Admins.',
      );
      return;
    }
    const target = users.find((u) => u._id === userId);
    if ((target && isCurrentUser(target)) || (currentUser && userId === currentUser._id)) {
      toast.error(
        isPersian
          ? 'امکان حذف حساب کاربری خودتان وجود ندارد.'
          : 'You cannot delete your own account.',
      );
      return;
    }
    setUserToDelete({ id: userId, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      toast.success(isPersian ? 'کاربر با موفقیت حذف شد.' : 'User deleted successfully.');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      if (selectedUserForDetails?._id === userToDelete.id) {
        setDetailsModalOpen(false);
        setSelectedUserForDetails(null);
      }
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف کاربر.' : 'Failed to delete user.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت کاربران، اعضای VIP و سطوح دسترسی' : 'Users & Access Control Management'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? `مجموعاً ${toPersianDigits(total)} کاربر ثبت‌نام شده در پایگاه داده وجود دارد`
              : `Total of ${total} registered users in database`}
          </p>
        </div>

        {!isAdmin && (
          <Chip
            variant="flat"
            classNames={{
              base: "bg-brand-surface-elevated border border-brand-border px-3 py-1.5",
              content: "text-brand-text-muted text-xs font-bold flex items-center gap-1.5",
            }}
            startContent={<span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
          >
            {isPersian ? 'سطح دسترسی ادیتور: فقط مشاهده' : 'Editor Access: Read-Only'}
          </Chip>
        )}
      </motion.div>

      {/* Read-Only Mode Alert Banner for Non-Admins */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
        <Card className="bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-xs">
          <CardBody className="p-4 flex flex-row items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">{isPersian ? 'حالت فقط مشاهده (Read-Only): ' : 'View-Only Mode: '}</span>
              <span>
                {isPersian
                  ? 'شما به عنوان ادیتور دسترسی مشاهده فهرست و اطلاعات کاربران را دارید، اما امکان تغییر نقش، فعال‌سازی یا لغو VIP و حذف کاربران تنها برای مدیر کل سیستم مجاز است.'
                  : 'As an editor, you can inspect the user list and contact info, but modifying roles, VIP memberships, or deleting accounts is restricted to Super Admins.'}
              </span>
            </div>
          </CardBody>
        </Card>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface p-4 rounded-3xl border border-brand-border shadow-xs overflow-visible">
        <CardBody className="p-0 flex flex-col sm:flex-row gap-3 items-center justify-between overflow-visible">
          <Input
            dir="auto"
            value={search}
            onValueChange={setSearch}
            placeholder={isPersian ? 'جستجو بر اساس نام، ایمیل، شماره یا نام‌کاربری...' : 'Search by name, email, or username...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="full"
            className="w-full sm:w-80"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
              input: "text-sm font-semibold text-brand-text",
            }}
          />

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* HeroUI Minimal, Curved, Fluid Role Filter Dropdown */}
            {(() => {
              const currentFilter = ROLE_FILTER_OPTIONS.find((opt) => opt.key === (roleFilter || 'all')) || ROLE_FILTER_OPTIONS[0];
              return (
                <Dropdown
                  placement="bottom-end"
                  offset={8}
                  shouldBlockScroll={false}
                  onOpenChange={setIsRoleFilterOpen}
                  motionProps={softDropdownMotionProps}
                  classNames={{
                    base: "p-0",
                    content: "min-w-[200px] p-1.5 bg-brand-surface/98 dark:bg-[#161c16]/98 backdrop-blur-2xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-xl z-50 will-change-transform",
                  }}
                >
                  <DropdownTrigger>
                    <Button
                      radius="full"
                      variant="bordered"
                      className="h-11 px-4 bg-brand-surface-elevated/80 hover:bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/70 text-brand-text text-xs font-bold rounded-full transition-all duration-200 shadow-xs active:scale-98 flex items-center justify-between gap-3 min-w-[185px] cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Filter className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                        <span className="truncate">{isPersian ? currentFilter.labelFa : currentFilter.labelEn}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-brand-text-muted transition-transform duration-300 ease-out shrink-0 ${
                          isRoleFilterOpen ? 'rotate-180 text-brand-gold' : ''
                        }`}
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label={isPersian ? 'فیلتر نقش کاربری' : 'Role Filter'}
                    onAction={(key) => {
                      const selected = key as string;
                      setRoleFilter(selected === 'all' || !selected ? '' : selected);
                      setPage(1);
                    }}
                    className="p-1"
                  >
                    {ROLE_FILTER_OPTIONS.map((opt) => {
                      const isSelected = (roleFilter || 'all') === opt.key;
                      const OptIcon = opt.icon;
                      return (
                        <DropdownItem
                          key={opt.key}
                          textValue={isPersian ? opt.labelFa : opt.labelEn}
                          className={`rounded-xl py-2 px-3 text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-gold/15 text-brand-gold font-bold'
                              : 'text-brand-text hover:bg-brand-surface-elevated'
                          }`}
                          startContent={<OptIcon className={`w-4 h-4 shrink-0 ${opt.iconColor}`} />}
                          endContent={
                            isSelected ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 mr-auto" />
                            ) : null
                          }
                        >
                          <span className="truncate">{isPersian ? opt.labelFa : opt.labelEn}</span>
                        </DropdownItem>
                      );
                    })}
                  </DropdownMenu>
                </Dropdown>
              );
            })()}

            {/* Add New User Button */}
            {isAdmin && (
              <Button
                radius="full"
                onPress={() => setCreateUserModalOpen(true)}
                className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 flex items-center gap-2 cursor-pointer rounded-full transition-all active:scale-95 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isPersian ? 'افزودن کاربر جدید' : 'Add New User'}</span>
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden">
        <CardBody className="p-0 overflow-visible">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-brand-surface-elevated" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-brand-bronze mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'کاربری یافت نشد' : 'No users found'}
              </h3>
            </div>
          ) : (
            <Table
              aria-label="Users Table"
              classNames={{
                wrapper: "p-0 bg-transparent shadow-none border-none overflow-x-auto",
                th: "bg-brand-surface-elevated text-brand-text-muted font-bold text-xs py-4 px-4 first:pr-6 last:pl-6",
                td: "py-4 px-4 text-xs font-semibold first:pr-6 last:pl-6",
                tr: "border-b border-brand-border hover:bg-brand-surface-elevated/60 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn className="w-10 text-center">
                  <div className="flex items-center justify-center">
                    <SmoothCheckbox
                      isSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      onValueChange={handleSelectAll}
                      size="sm"
                      ariaLabel={isPersian ? 'انتخاب همه' : 'Select all'}
                    />
                  </div>
                </TableColumn>
                <TableColumn>{isPersian ? 'کاربر' : 'User Profile'}</TableColumn>
                <TableColumn>{isPersian ? 'اطلاعات تماس' : 'Contact'}</TableColumn>
                <TableColumn>{isPersian ? 'تاریخ تولد (شمسی / میلادی)' : 'Birth Date'}</TableColumn>
                <TableColumn>{isPersian ? 'نقش کاربری' : 'Assigned Role'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'تاریخ عضویت' : 'Joined Date'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات' : 'Actions'}</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelected = selectedIds.includes(user._id);
                  return (
                    <TableRow key={user._id} className={isSelected ? 'bg-brand-gold/10' : ''}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <SmoothCheckbox
                            isSelected={isSelected}
                            isDisabled={isCurrentUser(user)}
                            onValueChange={() => handleSelectRow(user._id)}
                            size="sm"
                            ariaLabel={user.fullName || user.username}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                      <div
                        onClick={() => handleOpenDetails(user)}
                        className="flex items-center gap-3 cursor-pointer group select-none"
                        title={isPersian ? 'کلیک جهت مشاهده تمام جزئیات کاربر' : 'Click to view user details'}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-brand-gold text-[#141914] font-black flex items-center justify-center text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                          {user.fullName ? user.fullName.charAt(0) : (user.username ? user.username.charAt(0) : 'U')}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-brand-text group-hover:text-brand-gold transition-colors flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-brand-gold transition-opacity" />
                          </div>
                          <div className="text-[11px] text-brand-text-muted font-mono">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-brand-text font-sans">
                        {user.email}
                      </div>
                      <div className="text-[11px] text-brand-text-muted">
                        {user.phone || '—'}
                      </div>
                      {user.city && (
                        <div className="flex items-center gap-1 text-[11px] text-brand-bronze dark:text-brand-gold font-medium mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{user.province ? `${user.province}، ` : ''}{user.city}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {user.birthDate || user.birthDateShamsi ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs font-bold text-brand-text">
                            <Calendar className="w-3.5 h-3.5 text-brand-bronze" />
                            <span>
                              {user.birthDate
                                ? formatDisplayBirthDate(user.birthDate, 'jalali', isPersian)
                                : user.birthDateShamsi}
                            </span>
                          </div>
                          {user.birthDate && (
                            <div className="text-[11px] text-brand-text-muted font-sans pr-4.5">
                              {formatDisplayBirthDate(user.birthDate, 'gregorian', false)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-brand-text-muted font-sans">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <UserRoleCell
                        user={user}
                        isAdmin={isAdmin}
                        isPersian={isPersian}
                        onRoleChange={handleRoleChange}
                      />
                    </TableCell>

                    <TableCell className="text-center">
                      {isAdmin ? (
                        <Button
                          size="sm"
                          radius="full"
                          variant={user.isVip ? 'solid' : 'bordered'}
                          onPress={() => handleToggleVip(user._id, user.isVip)}
                          startContent={<Crown className="w-3.5 h-3.5" />}
                          className={`font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-2xs ${
                            user.isVip
                              ? 'bg-brand-gold text-[#141914] shadow-xs font-black'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-gold/80 hover:text-brand-text'
                          }`}
                        >
                          {user.isVip
                            ? isPersian ? 'عضو طلایی VIP' : 'VIP Active'
                            : isPersian ? 'عادی (غیر VIP)' : 'Standard'}
                        </Button>
                      ) : (
                        <Chip
                          size="sm"
                          variant="flat"
                          startContent={<Crown className="w-3.5 h-3.5" />}
                          className={
                            user.isVip
                              ? 'bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-black'
                              : 'bg-brand-surface-elevated text-brand-text-muted border border-brand-border'
                          }
                        >
                          {user.isVip
                            ? isPersian ? 'عضو طلایی VIP' : 'VIP Active'
                            : isPersian ? 'عادی' : 'Standard'}
                        </Chip>
                      )}
                    </TableCell>

                    <TableCell className="text-center text-brand-text-muted whitespace-nowrap font-medium text-xs">
                      {new Date(user.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                    </TableCell>

                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => handleOpenDetails(user)}
                          className="text-brand-text-muted hover:text-brand-gold hover:bg-brand-surface-elevated cursor-pointer transition-all active:scale-95"
                          aria-label={isPersian ? 'مشاهده تمام جزئیات کاربر' : 'View User Details'}
                          title={isPersian ? 'مشاهده تمام جزئیات کاربر' : 'View User Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {isAdmin && (
                          <Button
                            isIconOnly
                            size="sm"
                            radius="full"
                            variant="light"
                            onPress={() => handleOpenEdit(user)}
                            className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-all active:scale-95"
                            aria-label={isPersian ? 'ویرایش تمامی اطلاعات کاربر' : 'Edit All User Details'}
                            title={isPersian ? 'ویرایش تمامی اطلاعات کاربر' : 'Edit All User Details'}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}

                        {isCurrentUser(user) ? (
                          <Chip
                            size="sm"
                            variant="flat"
                            classNames={{
                              base: "bg-brand-gold/15 border border-brand-gold/30 px-2.5 py-1",
                              content: "text-brand-bronze dark:text-brand-gold text-[11px] font-black flex items-center gap-1",
                            }}
                            startContent={<UserIcon className="w-3 h-3 text-brand-gold shrink-0" />}
                          >
                            {isPersian ? 'حساب شما' : 'Your Account'}
                          </Chip>
                        ) : isAdmin ? (
                          <Button
                            isIconOnly
                            size="sm"
                            radius="full"
                            variant="light"
                            onPress={() => handleDeleteClick(user._id, user.fullName)}
                            className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all active:scale-95"
                            aria-label={isPersian ? 'حذف کاربر' : 'Delete'}
                            title={isPersian ? 'حذف حساب کاربری' : 'Delete User'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Chip size="sm" variant="flat" className="bg-brand-surface-elevated text-brand-text-muted border border-brand-border text-[11px]">
                            {isPersian ? 'فقط مشاهده' : 'View Only'}
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>

      {/* Comprehensive User Details & Edit Modal */}
      <UserDetailsModal
        isOpen={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        user={selectedUserForDetails}
        isSelf={selectedUserForDetails ? isCurrentUser(selectedUserForDetails) : false}
        initialMode={detailsModalMode}
        isPersian={isPersian}
        isAdmin={isAdmin}
        onUserUpdated={handleUserUpdated}
        onToggleVip={handleToggleVip}
        onRoleChange={handleRoleChange}
        onDeleteUser={(userId, userName) => {
          handleDeleteClick(userId, userName);
        }}
      />

      {/* Create New User Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onUserCreated={loadUsers}
        isPersian={isPersian}
      />

      {/* HeroUI Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={isPersian ? 'حذف حساب کاربری' : 'Delete User Account'}
        description={
          isPersian ? (
            <div>
              <p>
                آیا از حذف حساب کاربری <strong className="text-brand-text font-black">«{userToDelete?.name}»</strong> اطمینان دارید؟
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                این عملیات غیرقابل بازگشت است و تمام دسترسی‌ها و اطلاعات این حساب کاربری لغو خواهد شد.
              </p>
            </div>
          ) : (
            <div>
              <p>
                Are you sure you want to delete account <strong className="text-brand-text font-bold">&quot;{userToDelete?.name}&quot;</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                This action is permanent and cannot be undone.
              </p>
            </div>
          )
        }
        confirmText={isPersian ? 'بله، حذف حساب' : 'Yes, Delete Account'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Zero-Layout-Shift Fixed Floating Bulk Action Island */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-7 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.94 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pointer-events-auto bg-[#141a14]/98 dark:bg-[#121812]/98 backdrop-blur-2xl border border-brand-gold/40 shadow-2xl shadow-black/70 rounded-2xl sm:rounded-full p-2.5 sm:p-2 sm:ps-3.5 sm:pe-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 text-[#f7f4ee] w-[calc(100vw-1.5rem)] max-w-md sm:w-auto sm:max-w-none"
            >
              {/* Mobile Top Header: Count + Close Button */}
              <div className="flex sm:hidden items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 animate-pulse" />
                  <span className="text-xs font-black text-brand-gold">
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} کاربر انتخاب شده`
                      : `${selectedIds.length} users selected`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-neutral-400 hover:text-[#f7f4ee] active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded-lg hover:bg-white/10"
                  aria-label={isPersian ? 'لغو انتخاب' : 'Cancel selection'}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Cancel'}</span>
                </button>
              </div>

              {/* Desktop Count Badge */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-brand-gold text-[#141914] font-black text-xs shadow-xs flex items-center gap-1.5 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} کاربر انتخاب شده`
                      : `${selectedIds.length} selected`}
                  </span>
                </span>
                <span className="w-px h-5 bg-white/15 shrink-0" />
              </div>

              {/* Action Buttons: Responsive Grid on Mobile, Flex on Desktop */}
              <div
                className={`grid ${
                  isAdmin ? 'grid-cols-3' : 'grid-cols-2'
                } sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto`}
              >
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkToggleVip(true)}
                  className="bg-brand-gold/20 hover:bg-brand-gold/30 text-amber-300 border border-brand-gold/40 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <Crown className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'اعطای VIP' : 'Grant VIP'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'ارتقا به VIP' : 'Grant VIP'}</span>
                  </span>
                </Button>

                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkToggleVip(false)}
                  className="bg-white/10 hover:bg-white/15 text-neutral-300 border border-white/20 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'لغو VIP' : 'Revoke VIP'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'لغو عضویت VIP' : 'Revoke VIP'}</span>
                  </span>
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    radius="full"
                    variant="flat"
                    isLoading={bulkActionLoading}
                    onPress={handleBulkDelete}
                    className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {!bulkActionLoading && <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    <span className="truncate">
                      <span className="sm:hidden">{isPersian ? 'حذف' : 'Delete'}</span>
                      <span className="hidden sm:inline">{isPersian ? 'حذف همگانی' : 'Bulk Delete'}</span>
                    </span>
                  </Button>
                )}

                {/* Desktop Deselect Button */}
                <Button
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => setSelectedIds([])}
                  className="hidden sm:flex text-neutral-400 hover:text-[#f7f4ee] hover:bg-white/10 font-bold text-xs cursor-pointer rounded-full h-8 px-2.5 transition-all items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Deselect'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirm Modal */}
      <AdminConfirmModal
        isOpen={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={bulkConfirmConfig?.title || ''}
        description={bulkConfirmConfig?.description || null}
        confirmText={bulkConfirmConfig?.confirmText || (isPersian ? 'بله، حذف' : 'Yes, Delete')}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isBulkConfirmLoading}
        onConfirm={executeBulkConfirmAction}
      />
    </div>
  );
}
