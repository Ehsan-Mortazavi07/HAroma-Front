'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, X, Percent, Check } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { ICoupon } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export default function AdminCouponsPage() {
  const { isPersian } = useTranslation();
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [minPurchase, setMinPurchase] = useState<number>(200000);
  const [maxDiscount, setMaxDiscount] = useState<number>(300000);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons();
      setCoupons(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountPercent(15);
    setDiscountAmount(0);
    setMinPurchase(300000);
    setMaxDiscount(250000);
    setUsageLimit(500);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (c: ICoupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountPercent(c.discountPercent || 0);
    setDiscountAmount(c.discountAmount || 0);
    setMinPurchase(c.minPurchase || 0);
    setMaxDiscount(c.maxDiscount || 0);
    setUsageLimit(c.usageLimit || 100);
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error(isPersian ? 'کد تخفیف الزامی است.' : 'Coupon code is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent) || undefined,
        discountAmount: Number(discountAmount) || undefined,
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: Number(maxDiscount) || undefined,
        usageLimit: Number(usageLimit) || 100,
        isActive,
      };

      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon._id, payload);
        toast.success(isPersian ? 'کد تخفیف با موفقیت به‌روزرسانی شد.' : 'Coupon updated successfully.');
      } else {
        await adminApi.createCoupon(payload);
        toast.success(isPersian ? 'کد تخفیف جدید ایجاد گردید.' : 'Coupon created successfully.');
      }

      setModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره کد تخفیف.' : 'Failed to save coupon.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(isPersian ? `آیا از حذف کد تخفیف «${couponCode}» اطمینان دارید؟` : `Are you sure you want to delete coupon "${couponCode}"?`)) return;

    try {
      await adminApi.deleteCoupon(id);
      toast.success(isPersian ? 'کد تخفیف با موفقیت حذف شد.' : 'Coupon deleted successfully.');
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف کد تخفیف.' : 'Failed to delete coupon.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت کدهای تخفیف و پروموشن‌ها' : 'Discount Coupons Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'ایجاد کدهای درصدی یا مبلغی با تعیین سقف تخفیف و حداقل خرید'
              : 'Create percentage or fixed discount coupons with usage limits'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] font-black text-xs shadow-md shadow-[#9f815b]/20 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'تعریف کد تخفیف جدید' : 'Add New Coupon'}</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'در حال بارگذاری لیست کدهای تخفیف...' : 'Loading coupons list...'}
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Ticket className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'هنوز کد تخفیفی ایجاد نشده است' : 'No coupons created yet'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-[#f8f5f0] dark:bg-[#242c24] border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  <th className="py-4 px-6">{isPersian ? 'کد تخفیف' : 'Coupon Code'}</th>
                  <th className="py-4 px-4">{isPersian ? 'میزان تخفیف' : 'Discount Rate'}</th>
                  <th className="py-4 px-4">{isPersian ? 'حداقل خرید' : 'Min Purchase'}</th>
                  <th className="py-4 px-4">{isPersian ? 'حداکثر تخفیف' : 'Max Discount'}</th>
                  <th className="py-4 px-4">{isPersian ? 'تعداد استفاده' : 'Usage Limit'}</th>
                  <th className="py-4 px-4">{isPersian ? 'وضعیت' : 'Status'}</th>
                  <th className="py-4 px-6 text-center">{isPersian ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                    <td className="py-4 px-6 font-mono font-black text-sm text-[#9f815b] dark:text-[#d4be9b]">
                      {coupon.code}
                    </td>

                    <td className="py-4 px-4 font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                      {coupon.discountPercent
                        ? isPersian ? `${toPersianDigits(coupon.discountPercent)}٪ درصدی` : `${coupon.discountPercent}%`
                        : formatToman(coupon.discountAmount, isPersian)}
                    </td>

                    <td className="py-4 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {formatToman(coupon.minPurchase, isPersian)}
                    </td>

                    <td className="py-4 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {coupon.maxDiscount ? formatToman(coupon.maxDiscount, isPersian) : 'بدون سقف'}
                    </td>

                    <td className="py-4 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {isPersian
                        ? `${toPersianDigits(coupon.usedCount || 0)} از ${toPersianDigits(coupon.usageLimit)}`
                        : `${coupon.usedCount || 0} of ${coupon.usageLimit}`}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          coupon.isActive
                            ? 'bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {coupon.isActive ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-2 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                          title={isPersian ? 'ویرایش' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                          title={isPersian ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <h3 className="font-black text-base">
                {editingCoupon
                  ? isPersian ? 'ویرایش کد تخفیف' : 'Edit Coupon'
                  : isPersian ? 'تعریف کد تخفیف جدید' : 'New Coupon'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'کد تخفیف (لاتین و بدون فاصله) *' : 'Coupon Code (Latin) *'}
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: NOURUZ1405"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono font-bold uppercase focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'درصد تخفیف (۱ تا ۱۰۰)' : 'Discount %'}
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'یا مبلغ ثابت (تومان)' : 'Or Fixed Amount (Toman)'}
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'حداقل خرید (تومان)' : 'Min Purchase'}
                  </label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'سقف تخفیف (تومان)' : 'Max Discount'}
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'حداکثر دفعات استفاده' : 'Usage Limit'}
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                    />
                    <span>{isPersian ? 'کد تخفیف فعال باشد' : 'Coupon is Active'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-black bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] shadow-md transition-all active:scale-98"
                >
                  {submitting
                    ? isPersian ? 'در حال ذخیره...' : 'Saving...'
                    : isPersian ? 'ذخیره کد تخفیف' : 'Save Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
