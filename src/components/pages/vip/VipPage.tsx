'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Sparkles, CheckCircle2, Zap, ShieldCheck, Gift, Star, ArrowLeft } from 'lucide-react';
import { IVipPlan } from '@/common/interfaces';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchProfile } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { useTranslation } from '@/common/i18n';

interface VipPageProps {
  plans: IVipPlan[];
}

export function VipPage({ plans }: VipPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t, isPersian, isRTL } = useTranslation();

  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = isPersian
      ? 'باشگاه مشتریان خاص و اشتراک VIP | هاتف آروما'
      : 'VIP Membership & Club | HatefAroma';
  }, [isPersian]);

  const handleSubscribe = async (plan: IVipPlan) => {
    if (!isAuthenticated) {
      toast.error(isPersian ? 'لطفاً ابتدا وارد حساب کاربری خود شوید.' : 'Please sign in first.');
      router.push(`${PATHS.SIGN_IN}?redirect=/vip`);
      return;
    }

    setSubscribingId(plan._id);
    try {
      await axiosInstance.post('/subscriptions/subscribe', {
        planId: plan._id,
      });
      await dispatch(fetchProfile());
      const planTitle = isPersian ? plan.title : plan.titleEn || plan.title;
      toast.success(
        isPersian
          ? `تبریک! اشتراک «${planTitle}» با موفقیت برای شما فعال شد. 👑`
          : `Congratulations! "${planTitle}" has been successfully activated. 👑`,
      );
      router.push(PATHS.PROFILE);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در فعال‌سازی اشتراک.' : 'Failed to activate VIP subscription.'),
      );
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="min-h-screen py-10">
      {/* Top Hero Callout */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171d17] via-[#202620] to-[#121712] text-[#f7f4ee] p-8 sm:p-12 mb-14 text-center border border-[#bfa27a]/40 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#d4be9b] to-[#9f815b] text-[#1d241d] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#9f815b]/20">
          <Crown className="w-9 h-9 fill-current" />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3">
          {t.vip.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#e6dcce] max-w-xl mx-auto leading-relaxed mb-6">
          {t.vip.sub}
        </p>

        {user?.isVip && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#2a342a] border border-[#bfa27a]/50 text-[#d4be9b] text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[#bfa27a]" />
            <span>{t.vip.activeStatus}</span>
          </div>
        )}
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => {
          const isPopular = plan.isPopular;
          const planTitle = isPersian ? plan.title : plan.titleEn || plan.title;
          const planDesc = isPersian ? plan.description : plan.descriptionEn || plan.description;
          const planPerks = isPersian
            ? plan.perks
            : plan.perksEn && plan.perksEn.length > 0
            ? plan.perksEn
            : plan.perks;

          return (
            <div
              key={plan._id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-brand-surface border-2 border-brand-gold shadow-2xl scale-102 z-10'
                  : 'bg-brand-surface border border-brand-border shadow-md hover:border-brand-gold'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-champagne via-brand-gold to-brand-bronze text-brand-olive font-black text-xs shadow-md">
                  {t.vip.popularChoice}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-brand-text">
                    {planTitle}
                  </h3>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-brand-surface-elevated text-brand-bronze border border-brand-gold/30">
                    {t.vip.daysPlan(isPersian ? toPersianDigits(plan.durationDays) : plan.durationDays)}
                  </span>
                </div>

                {planDesc && (
                  <p className="text-xs text-brand-text-muted mb-6 leading-relaxed">
                    {planDesc}
                  </p>
                )}

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-brand-border">
                  <div className="text-2xl sm:text-3xl font-black text-brand-text">
                    {formatToman(plan.price, isPersian)}
                  </div>
                  <div className="text-[11px] text-brand-text-muted mt-0.5">
                    {t.vip.discountIncluded(isPersian ? toPersianDigits(plan.discountPercent) : plan.discountPercent)}
                  </div>
                </div>

                {/* Perks List */}
                <div className="space-y-3 mb-8">
                  {planPerks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-brand-text">
                      <CheckCircle2 className="w-4 h-4 text-brand-bronze shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribingId === plan._id}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  isPopular
                    ? 'bg-brand-gold hover:bg-brand-champagne text-brand-olive shadow-brand-bronze/20 active:scale-98'
                    : 'bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne border border-brand-gold/40 active:scale-98'
                }`}
              >
                {subscribingId === plan._id ? (
                  <span>{t.common.loading}</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>{t.vip.subscribeNow}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Perks Comparison Matrix */}
      <div className="bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-sm">
        <h3 className="text-xl font-black text-brand-text mb-6 text-center">
          {t.vip.matrixTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-olive text-brand-champagne flex items-center justify-center mx-auto border border-brand-gold/30">
              <Zap className="w-5 h-5 text-brand-gold" />
            </div>
            <h4 className="font-bold text-sm text-brand-text">
              {t.vip.freeShippingPerk}
            </h4>
            <p className="text-xs text-brand-text-muted">
              {t.vip.freeShippingPerkSub}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-olive text-brand-champagne flex items-center justify-center mx-auto border border-brand-gold/30">
              <Star className="w-5 h-5 text-brand-gold" />
            </div>
            <h4 className="font-bold text-sm text-brand-text">
              {t.vip.permanentDiscountPerk}
            </h4>
            <p className="text-xs text-brand-text-muted">
              {t.vip.permanentDiscountPerkSub}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-olive text-brand-champagne flex items-center justify-center mx-auto border border-brand-gold/30">
              <Gift className="w-5 h-5 text-brand-gold" />
            </div>
            <h4 className="font-bold text-sm text-brand-text">
              {t.vip.samplesPerk}
            </h4>
            <p className="text-xs text-brand-text-muted">
              {t.vip.samplesPerkSub}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-olive text-brand-champagne flex items-center justify-center mx-auto border border-brand-gold/30">
              <ShieldCheck className="w-5 h-5 text-brand-gold" />
            </div>
            <h4 className="font-bold text-sm text-brand-text">
              {t.vip.consultationPerk}
            </h4>
            <p className="text-xs text-brand-text-muted">
              {t.vip.consultationPerkSub}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
