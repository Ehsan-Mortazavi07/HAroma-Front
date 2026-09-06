'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Crown, ShieldCheck, Edit2, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IUser } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت کاربران، اعضای VIP و سطوح دسترسی' : 'Users & Access Control Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? `مجموعاً ${toPersianDigits(total)} کاربر ثبت‌نام شده در پایگاه داده وجود دارد`
              : `Total of ${total} registered users in database`}
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f0eae0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] text-xs font-bold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{isPersian ? 'سطح دسترسی ادیتور: فقط مشاهده' : 'Editor Access: Read-Only'}</span>
          </div>
        )}
      </div>

      {/* Read-Only Mode Alert Banner for Non-Admins */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">{isPersian ? 'حالت فقط مشاهده (Read-Only): ' : 'View-Only Mode: '}</span>
            <span>
              {isPersian
                ? 'شما به عنوان ادیتور دسترسی مشاهده فهرست و اطلاعات کاربران را دارید، اما امکان تغییر نقش، فعال‌سازی یا لغو VIP و حذف کاربران تنها برای مدیر کل سیستم مجاز است.'
                : 'As an editor, you can inspect the user list and contact info, but modifying roles, VIP memberships, or deleting accounts is restricted to Super Admins.'}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] p-4 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isPersian ? 'جستجو بر اساس نام، ایمیل، شماره یا نام‌کاربری...' : 'Search by name, email, or username...'}
            className="w-full h-11 pr-10 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
          />
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-[#73695c] dark:text-[#a69c8e]" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
        >
          <option value="">{isPersian ? 'همه نقش‌های کاربری' : 'All User Roles'}</option>
          <option value="admin">{isPersian ? 'مدیر کل (Admin)' : 'Admin'}</option>
          <option value="editor">{isPersian ? 'ویراستار (Editor)' : 'Editor'}</option>
          <option value="user">{isPersian ? 'کاربر عادی (User)' : 'User'}</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'در حال بارگذاری لیست کاربران...' : 'Loading users list...'}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'کاربری یافت نشد' : 'No users found'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="bg-[#f8f5f0] dark:bg-[#242c24] border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  <th className="py-4 px-6 text-start">{isPersian ? 'کاربر' : 'User Profile'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'اطلاعات تماس' : 'Contact'}</th>
                  <th className="py-4 px-4 text-start whitespace-nowrap">{isPersian ? 'نقش کاربری' : 'Assigned Role'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'وضعیت VIP' : 'VIP Status'}</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">{isPersian ? 'تاریخ عضویت' : 'Joined Date'}</th>
                  <th className="py-4 px-6 text-center whitespace-nowrap">{isPersian ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                    <td className="py-4 px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-gold text-[#141914] font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-start whitespace-nowrap">
                      <div className="text-xs text-[#1d241d] dark:text-[#f7f4ee] font-sans">
                        {user.email}
                      </div>
                      <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                        {user.phone || '—'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-start whitespace-nowrap">
                      {isAdmin ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#2e3a2e] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
                        >
                          <option value="user">{isPersian ? 'کاربر عادی' : 'User'}</option>
                          <option value="editor">{isPersian ? 'ویراستار' : 'Editor'}</option>
                          <option value="admin">{isPersian ? 'مدیر کل' : 'Admin'}</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                            user.role === 'admin'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : user.role === 'editor'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#f0eae0] dark:bg-[#283228] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e]'
                          }`}
                        >
                          {user.role === 'admin'
                            ? isPersian ? 'مدیر کل (Admin)' : 'Admin'
                            : user.role === 'editor'
                            ? isPersian ? 'ویراستار (Editor)' : 'Editor'
                            : isPersian ? 'کاربر عادی (User)' : 'User'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleVip(user._id, user.isVip)}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold gap-1.5 transition-all whitespace-nowrap leading-none cursor-pointer ${
                            user.isVip
                              ? 'bg-[#bfa27a] text-[#1d241d] shadow-xs font-black'
                              : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                          }`}
                          title={isPersian ? 'تغییر وضعیت VIP' : 'Toggle VIP'}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>
                            {user.isVip
                              ? isPersian ? 'عضو طلایی VIP' : 'VIP Active'
                              : isPersian ? 'عادی (غیر VIP)' : 'Standard'}
                          </span>
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold gap-1.5 whitespace-nowrap leading-none ${
                            user.isVip
                              ? 'bg-[#bfa27a] text-[#1d241d] shadow-xs font-black'
                              : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e]'
                          }`}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>
                            {user.isVip
                              ? isPersian ? 'عضو طلایی VIP' : 'VIP Active'
                              : isPersian ? 'عادی' : 'Standard'}
                          </span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center text-[#73695c] dark:text-[#a69c8e] whitespace-nowrap font-medium text-xs">
                      {new Date(user.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user._id, user.fullName)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                          title={isPersian ? 'حذف کاربر' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#f0eae0] dark:bg-[#283228] text-[#73695c] dark:text-[#a69c8e] text-[11px] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]">
                          {isPersian ? 'فقط مشاهده' : 'View Only'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
