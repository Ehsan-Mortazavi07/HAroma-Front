'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
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
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IUser } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate } from '@/common/utils/date';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';

// Unified soft luxury spring motion matching high-end iOS/Apple dropdown physics
const softDropdownMotionProps = {
  variants: {
    initial: {
      opacity: 0,
      scale: 0.96,
    },
    enter: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 350,
        damping: 26,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: {
        duration: 0.16,
        ease: [0.16, 1, 0.3, 1] as const,
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
        content: "min-w-[170px] p-1.5 bg-brand-surface/98 dark:bg-[#161c16]/98 backdrop-blur-2xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-xl z-50",
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

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(isPersian ? 'نقش کاربر با موفقیت تغییر کرد.' : 'User role updated successfully.');
    } catch (err: any) {
      setUsers(previousUsers);
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
      toast.error(isPersian ? 'خطا در تغییر وضعیت VIP.' : 'Failed to update VIP status.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian
          ? 'حذف کاربر تنها برای مدیر کل سیستم مجاز است.'
          : 'Deleting users is restricted to Super Admins.',
      );
      return;
    }

    if (!confirm(isPersian ? `آیا از حذف حساب کاربری «${name}» اطمینان دارید؟` : `Are you sure you want to delete account "${name}"?`)) return;

    try {
      await adminApi.deleteUser(userId);
      toast.success(isPersian ? 'کاربر با موفقیت حذف شد.' : 'User deleted successfully.');
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف کاربر.' : 'Failed to delete user.'));
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
            value={search}
            onValueChange={setSearch}
            placeholder={isPersian ? 'جستجو بر اساس نام، ایمیل، شماره یا نام‌کاربری...' : 'Search by name, email, or username...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="full"
            className="w-full sm:w-80"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
              input: "text-xs font-semibold text-brand-text",
            }}
          />

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
                  content: "min-w-[200px] p-1.5 bg-brand-surface/98 dark:bg-[#161c16]/98 backdrop-blur-2xl border border-brand-border dark:border-[#2e3a2e] text-brand-text rounded-2xl shadow-xl z-50",
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
                <TableColumn>{isPersian ? 'کاربر' : 'User Profile'}</TableColumn>
                <TableColumn>{isPersian ? 'اطلاعات تماس' : 'Contact'}</TableColumn>
                <TableColumn>{isPersian ? 'تاریخ تولد (شمسی / میلادی)' : 'Birth Date'}</TableColumn>
                <TableColumn>{isPersian ? 'نقش کاربری' : 'Assigned Role'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'تاریخ عضویت' : 'Joined Date'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات' : 'Actions'}</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-gold text-[#141914] font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-brand-text">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-brand-text-muted">
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
                      {isAdmin ? (
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => handleDeleteUser(user._id, user.fullName)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all active:scale-95"
                          aria-label={isPersian ? 'حذف کاربر' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Chip size="sm" variant="flat" className="bg-brand-surface-elevated text-brand-text-muted border border-brand-border text-[11px]">
                          {isPersian ? 'فقط مشاهده' : 'View Only'}
                        </Chip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>
    </div>
  );
}
