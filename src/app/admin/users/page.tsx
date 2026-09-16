'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from '@heroui/react';
import { Users, Search, Crown, ShieldAlert, Calendar, MapPin, Trash2 } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IUser } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';
import { formatDisplayBirthDate } from '@/common/utils/date';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';

export default function AdminUsersPage() {
  const { isPersian } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(isPersian ? 'نقش کاربر با موفقیت تغییر کرد.' : 'User role updated successfully.');
      loadUsers();
    } catch (err: any) {
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

    try {
      await adminApi.updateUserVip(userId, !currentVip);
      toast.success(
        currentVip
          ? isPersian ? 'وضعیت VIP غیرفعال شد.' : 'VIP membership revoked.'
          : isPersian ? 'عضویت VIP برای کاربر فعال شد! 👑' : 'VIP membership granted! 👑',
      );
      loadUsers();
    } catch (err: any) {
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

  const roleOptions = [
    { id: '', label: isPersian ? 'همه نقش‌های کاربری' : 'All User Roles' },
    { id: 'admin', label: isPersian ? 'مدیر کل (Admin)' : 'Admin' },
    { id: 'editor', label: isPersian ? 'ویراستار (Editor)' : 'Editor' },
    { id: 'user', label: isPersian ? 'کاربر عادی (User)' : 'User' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </div>

      {/* Read-Only Mode Alert Banner for Non-Admins */}
      {!isAdmin && (
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
      )}

      {/* Toolbar */}
      <Card className="bg-brand-surface p-4 rounded-3xl border border-brand-border shadow-xs">
        <CardBody className="p-0 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <Input
            value={search}
            onValueChange={setSearch}
            placeholder={isPersian ? 'جستجو بر اساس نام، ایمیل، شماره یا نام‌کاربری...' : 'Search by name, email, or username...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="lg"
            className="w-full sm:w-80"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-2xl shadow-xs transition-colors",
              input: "text-xs font-semibold text-brand-text",
            }}
          />

          <Select
            aria-label={isPersian ? 'فیلتر نقش کاربری' : 'Role Filter'}
            selectedKeys={new Set([roleFilter])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setRoleFilter(selected ?? '');
            }}
            variant="bordered"
            radius="lg"
            className="w-full sm:w-56"
            classNames={{
              trigger: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-2xl shadow-xs text-xs font-bold text-brand-text",
              value: "text-xs font-bold text-brand-text",
              popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl",
            }}
          >
            {roleOptions.map((opt) => (
              <SelectItem key={opt.id} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden">
        <CardBody className="p-0">
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
                      {isAdmin ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-brand-surface-elevated text-xs font-bold text-brand-text border border-brand-border focus:ring-2 focus:ring-brand-gold cursor-pointer"
                        >
                          <option value="user">{isPersian ? 'کاربر عادی' : 'User'}</option>
                          <option value="editor">{isPersian ? 'ویراستار' : 'Editor'}</option>
                          <option value="admin">{isPersian ? 'مدیر کل' : 'Admin'}</option>
                        </select>
                      ) : (
                        <Chip
                          variant="flat"
                          size="sm"
                          classNames={{
                            base: user.role === 'admin'
                              ? 'bg-amber-500/15 border border-amber-500/30'
                              : user.role === 'editor'
                              ? 'bg-emerald-500/15 border border-emerald-500/30'
                              : 'bg-brand-surface-elevated border border-brand-border',
                            content: user.role === 'admin'
                              ? 'text-amber-700 dark:text-amber-400 font-bold text-xs'
                              : user.role === 'editor'
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold text-xs'
                              : 'text-brand-text-muted font-bold text-xs',
                          }}
                        >
                          {user.role === 'admin'
                            ? isPersian ? 'مدیر کل (Admin)' : 'Admin'
                            : user.role === 'editor'
                            ? isPersian ? 'ویراستار (Editor)' : 'Editor'
                            : isPersian ? 'کاربر عادی (User)' : 'User'}
                        </Chip>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {isAdmin ? (
                        <Button
                          size="sm"
                          radius="full"
                          variant={user.isVip ? 'solid' : 'bordered'}
                          onPress={() => handleToggleVip(user._id, user.isVip)}
                          startContent={<Crown className="w-3.5 h-3.5" />}
                          className={`font-bold text-xs cursor-pointer ${
                            user.isVip
                              ? 'bg-brand-gold text-[#141914] shadow-xs font-black'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-gold'
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
                          radius="lg"
                          variant="light"
                          onPress={() => handleDeleteUser(user._id, user.fullName)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
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
    </div>
  );
}
