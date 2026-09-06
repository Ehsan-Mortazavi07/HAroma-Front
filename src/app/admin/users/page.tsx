'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Crown, ShieldCheck, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IUser } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';
import { VipBadge } from '@/components/common/VipBadge';
import { useTranslation } from '@/common/i18n';

export default function AdminUsersPage() {
  const { isPersian } = useTranslation();
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
    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(isPersian ? 'نقش کاربر با موفقیت تغییر کرد.' : 'User role updated successfully.');
      loadUsers();
    } catch (err: any) {
      toast.error(isPersian ? 'خطا در تغییر نقش کاربر.' : 'Failed to update user role.');
    }
  };

  const handleToggleVip = async (userId: string, currentVip: boolean) => {
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
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#2e3a2e] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
                      >
                        <option value="user">{isPersian ? 'کاربر عادی' : 'User'}</option>
                        <option value="editor">{isPersian ? 'ویراستار' : 'Editor'}</option>
                        <option value="admin">{isPersian ? 'مدیر کل' : 'Admin'}</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVip(user._id, user.isVip)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold gap-1.5 transition-all whitespace-nowrap leading-none ${
                          user.isVip
                            ? 'bg-[#bfa27a] text-[#1d241d] shadow-xs font-black'
                            : 'bg-[#f8f5f0] dark:bg-[#242c24] text-[#73695c] dark:text-[#a69c8e] border border-[#e6dcce] dark:border-[#2e3a2e] hover:border-[#bfa27a]'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>
                          {user.isVip
                            ? isPersian ? 'عضو طلایی VIP' : 'VIP Active'
                            : isPersian ? 'عادی (غیر VIP)' : 'Standard'}
                        </span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center text-[#73695c] dark:text-[#a69c8e] whitespace-nowrap font-mono text-xs">
                      {new Date(user.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteUser(user._id, user.fullName)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                        title={isPersian ? 'حذف کاربر' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
