'use client';

import React, { useState, useEffect } from 'react';
import { Crown, Plus, Edit2, Trash2, X, Check, Sparkles } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IVipPlan } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export default function AdminVipPlansPage() {
  const { isPersian } = useTranslation();
  const [plans, setPlans] = useState<IVipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IVipPlan | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(390000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [perks, setPerks] = useState<string[]>([]);
  const [perkInput, setPerkInput] = useState('');
  const [badgeColor, setBadgeColor] = useState('#bfa27a');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVipPlans();
      setPlans(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setTitle('');
    setTitleEn('');
    setDescription('');
    setPrice(490000);
    setDurationDays(30);
    setDiscountPercent(5);
    setPerks([
      'ارسال رایگان تمام سفارش‌ها',
      'تخفیف ۵٪ ثابت روی کلیه کالاها',
      '۲ عدد تستر رایگان عطر نیش در هر خرید',
    ]);
    setBadgeColor('#bfa27a');
    setIsPopular(false);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (plan: IVipPlan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setTitleEn(plan.titleEn || '');
    setDescription(plan.description);
    setPrice(plan.price);
    setDurationDays(plan.durationDays);
    setDiscountPercent(plan.discountPercent);
    setPerks(plan.perks || []);
    setBadgeColor(plan.badgeColor || '#bfa27a');
    setIsPopular(plan.isPopular || false);
    setIsActive(plan.isActive);
    setModalOpen(true);
  };

  const addPerk = () => {
    if (!perkInput.trim()) return;
    setPerks([...perks, perkInput.trim()]);
    setPerkInput('');
  };

  const removePerk = (idx: number) => {
    setPerks(perks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(isPersian ? 'عنوان پلن الزامی است.' : 'Plan title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        description: description.trim() || '',
        price: Number(price),
        durationDays: Number(durationDays),
        discountPercent: Number(discountPercent),
        perks,
        badgeColor,
        isPopular,
        isActive,
      };

      if (editingPlan) {
        await adminApi.updateVipPlan(editingPlan._id, payload);
        toast.success(isPersian ? 'پلن با موفقیت به‌روزرسانی شد.' : 'Plan updated successfully.');
      } else {
        await adminApi.createVipPlan(payload);
        toast.success(isPersian ? 'پلن جدید با موفقیت ایجاد شد.' : 'Plan created successfully.');
      }

      setModalOpen(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره پلن.' : 'Failed to save plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, planTitle: string) => {
    if (!confirm(isPersian ? `آیا از حذف پلن اشتراک «${planTitle}» اطمینان دارید؟` : `Are you sure you want to delete plan "${planTitle}"?`)) return;

    try {
      await adminApi.deleteVipPlan(id);
      toast.success(isPersian ? 'پلن با موفقیت حذف شد.' : 'Plan deleted successfully.');
      loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف پلن.' : 'Failed to delete plan.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'مدیریت اشتراک‌های VIP هاتف آروما' : 'VIP Membership Plans Management'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'پلن‌های برنزی، نقره‌ای و طلایی با تخفیف‌های درصدی خودکار و ارسال رایگان'
              : 'Configure Bronze, Silver, and Gold VIP tiers with automatic discounts'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{isPersian ? 'افزودن پلن VIP جدید' : 'Add New VIP Plan'}</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-[#ffffff] dark:bg-[#1c231c] animate-pulse border border-[#e6dcce] dark:border-[#2e3a2e]"
            />
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] space-y-3">
            <Crown className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'هنوز پلن VIP ایجاد نشده است' : 'No VIP plans configured yet'}
            </h3>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative bg-[#ffffff] dark:bg-[#1c231c] p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 ${
                plan.isPopular
                  ? 'border-2 border-[#bfa27a] shadow-xl'
                  : 'border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 right-6 px-3.5 py-0.5 rounded-full bg-[#bfa27a] text-[#1d241d] font-black text-[10px] shadow-sm">
                  {isPersian ? 'پلن محبوب' : 'Popular Choice'}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#f0eae0] dark:bg-[#283228] flex items-center justify-center border border-[#bfa27a]/30 text-[#9f815b]">
                    <Crown className="w-5 h-5 fill-current" />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] border border-[#e6dcce] dark:border-[#2e3a2e]">
                    {isPersian ? `${toPersianDigits(plan.durationDays)} روزه` : `${plan.durationDays} Days`}
                  </span>
                </div>

                <h3 className="font-black text-lg text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? plan.title : plan.titleEn || plan.title}
                </h3>
                {isPersian && plan.titleEn ? (
                  <div className="text-xs text-[#73695c] dark:text-[#a69c8e] font-sans">
                    {plan.titleEn}
                  </div>
                ) : !isPersian && plan.title ? (
                  <div className="text-xs text-[#73695c] dark:text-[#a69c8e]">
                    {plan.title}
                  </div>
                ) : null}
                <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1 line-clamp-2">
                  {isPersian ? plan.description : plan.descriptionEn || plan.description}
                </p>

                <div className="mt-4 pt-4 border-t border-[#e6dcce] dark:border-[#2e3a2e]">
                  <div className="text-2xl font-black text-[#1d241d] dark:text-[#d4be9b]">
                    {formatToman(plan.price, isPersian)}
                  </div>
                  <div className="text-[11px] font-bold text-[#9f815b] dark:text-[#d4be9b] mt-0.5">
                    {isPersian
                      ? `تخفیف دائمی ${toPersianDigits(plan.discountPercent)}٪ روی کالاها`
                      : `${plan.discountPercent}% permanent discount on items`}
                  </div>
                </div>

                {/* Perks */}
                {((isPersian ? plan.perks : (plan.perksEn && plan.perksEn.length > 0 ? plan.perksEn : plan.perks)) || []).length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {(isPersian ? plan.perks : (plan.perksEn && plan.perksEn.length > 0 ? plan.perksEn : plan.perks)).map((p, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-[#73695c] dark:text-[#e6dcce]">
                        <Check className="w-3.5 h-3.5 text-[#9f815b] shrink-0" />
                        <span className="line-clamp-1">{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    plan.isActive
                      ? 'bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {plan.isActive ? (isPersian ? 'فعال برای خرید' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="p-2 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] transition-colors"
                    title={isPersian ? 'ویرایش' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(plan._id, plan.title)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                    title={isPersian ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <h3 className="font-black text-base">
                {editingPlan
                  ? isPersian ? 'ویرایش پلن اشتراک VIP' : 'Edit VIP Plan'
                  : isPersian ? 'تعریف پلن اشتراک جدید' : 'New VIP Plan'}
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
                  {isPersian ? 'عنوان فارسی پلن *' : 'Plan Title (Persian) *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isPersian ? 'مثال: اشتراک طلایی ۱ ماهه' : 'e.g. 1-Month Gold VIP'}
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'عنوان انگلیسی پلن' : 'Plan Title (English)'}
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. 1-Month Gold VIP"
                  className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'توضیحات کوتاه' : 'Short Description'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isPersian ? 'توضیح کوتاه در مورد مزایای این پلن...' : 'Short description...'}
                  className="w-full p-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'قیمت (تومان)' : 'Price'}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'مدت (روز)' : 'Days'}
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'درصد تخفیف' : 'Discount %'}
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              {/* Perks List */}
              <div>
                <label className="block font-bold mb-1">
                  {isPersian ? 'مزایای پلن (سفارشی)' : 'Plan Perks'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={perkInput}
                    onChange={(e) => setPerkInput(e.target.value)}
                    placeholder={isPersian ? 'مثال: ارسال رایگان، هدیه تستر' : 'e.g. Free shipping, 2 tester vials'}
                    className="flex-1 h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-semibold focus:ring-2 focus:ring-[#bfa27a]"
                  />
                  <button
                    type="button"
                    onClick={addPerk}
                    className="px-4 rounded-xl bg-[#202620] text-[#d4be9b] font-bold border border-[#bfa27a]/30 shadow-xs"
                  >
                    {isPersian ? 'افزودن' : 'Add'}
                  </button>
                </div>

                {perks.length > 0 && (
                  <div className="space-y-1.5 p-2 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e]">
                    {perks.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                        <span>• {p}</span>
                        <button
                          type="button"
                          onClick={() => removePerk(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                  />
                  <span>{isPersian ? 'برچسب محبوب‌ترین' : 'Popular Badge'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#9f815b] rounded cursor-pointer"
                  />
                  <span>{isPersian ? 'پلن فعال باشد' : 'Plan is Active'}</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {submitting
                    ? isPersian ? 'در حال ذخیره...' : 'Saving...'
                    : isPersian ? 'ذخیره پلن VIP' : 'Save VIP Plan'}
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
