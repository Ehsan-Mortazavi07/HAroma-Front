'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Edit2,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { clearCart } from '@/stores/cart/cartSlice';
import { updateUser } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toEnglishDigits, getLocalizedVariantTitle, toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { useTranslation } from '@/common/i18n';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';

export function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isPersian, isRTL } = useTranslation();

  const items = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Address State (pre-filled from user profile or initial defaults)
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.recipientName || user?.fullName || (isPersian ? 'کاربر هاورما' : 'HAroma User'),
    phone: user?.recipientPhone || user?.phone || '',
    province: user?.province || (isPersian ? 'تهران' : 'Tehran'),
    city: user?.city || (isPersian ? 'تهران' : 'Tehran'),
    postalCode: user?.postalCode || '',
    addressDetail: user?.address || '',
    buildingNumber: user?.buildingNumber || '',
    unit: user?.unit || '',
  });

  // Sync address when user profile loads/changes
  React.useEffect(() => {
    if (user) {
      setDeliveryAddress((prev) => ({
        fullName: user.recipientName || user.fullName || prev.fullName,
        phone: user.recipientPhone || user.phone || prev.phone,
        province: user.province || prev.province,
        city: user.city || prev.city,
        postalCode: user.postalCode || prev.postalCode,
        addressDetail: user.address || prev.addressDetail,
        buildingNumber: user.buildingNumber || prev.buildingNumber || '',
        unit: user.unit || prev.unit || '',
      }));
    }
  }, [user]);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | 'installment'>('online');
  const [isStoreReviewOpen, setIsStoreReviewOpen] = useState(true);

  // Coupon State
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountPercent: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Submitting Order
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const subtotal = items.reduce((sum, item) => {
    const price = item.selectedVariant
      ? item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
        ? item.selectedVariant.discountPrice
        : item.selectedVariant.price
      : item.product.discountPrice && item.product.discountPrice > 0
      ? item.product.discountPrice
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 45000;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const vipDiscount = user?.isVip ? Math.round((subtotal - couponDiscount) * 0.05) : 0;
  const total = Math.max(0, subtotal - couponDiscount - vipDiscount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await axiosInstance.post('/coupons/validate', {
        code: promoCode.trim(),
        cartAmount: subtotal,
      });
      setAppliedCoupon({
        code: res.data.code,
        discountAmount: res.data.discountAmount,
        discountPercent: res.data.discountPercent,
      });
      toast.success(t.checkout.couponApplied);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'کد تخفیف نامعتبر است.' : 'Invalid coupon code.'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated) {
      toast.error(isPersian ? 'لطفاً ابتدا وارد حساب کاربری خود شوید.' : 'Please sign in first.');
      router.push(`${PATHS.SIGN_IN}?redirect=/checkout`);
      return;
    }

    if (items.length === 0) {
      toast.error(isPersian ? 'سبد خرید شما خالی است.' : 'Your cart is empty.');
      return;
    }

    const cleanPhone = toEnglishDigits(deliveryAddress.phone).trim();
    if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
      toast.error(
        isPersian
          ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Phone number must be 11 digits starting with 09.'
      );
      return;
    }

    const cleanPostal = toEnglishDigits(deliveryAddress.postalCode).trim();
    if (cleanPostal && cleanPostal.length !== 10) {
      toast.error(
        isPersian
          ? 'کد پستی باید دقیقاً ۱۰ رقم باشد.'
          : 'Postal code must be exactly 10 digits.'
      );
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderPayload = {
        items: items.map((item) => {
          const itemPrice = item.selectedVariant
            ? item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
              ? item.selectedVariant.discountPrice
              : item.selectedVariant.price
            : item.product.discountPrice && item.product.discountPrice > 0
            ? item.product.discountPrice
            : item.product.price;

          const variantTitle = item.selectedVariant
            ? getLocalizedVariantTitle(item.selectedVariant.title, isPersian)
            : '';
          const prodTitle = isPersian ? item.product.title : item.product.titleEn || item.product.title;
          const title = variantTitle ? `${prodTitle} (${variantTitle})` : prodTitle;

          return {
            product: item.product._id,
            title,
            price: itemPrice,
            quantity: item.quantity,
            image: item.product.images?.[0] || '',
            selectedAttributes: item.selectedVariant
              ? getLocalizedVariantTitle(item.selectedVariant.title, isPersian)
              : item.selectedAttributes || '',
          };
        }),
        deliveryAddress,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      };

      const res = await axiosInstance.post('/orders', orderPayload);
      setCompletedOrder(res.data);
      dispatch(clearCart());
      toast.success(isPersian ? 'سفارش شما با موفقیت ثبت گردید!' : 'Order placed successfully!');

      // If user profile lacked an address before checkout, backend auto-saved it.
      // Refresh user profile in Redux store:
      try {
        const profileRes = await axiosInstance.get('/users/profile');
        if (profileRes.data) {
          dispatch(updateUser(profileRes.data));
        }
      } catch {
        // Non-blocking
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      let errorMsg = isPersian
        ? serverMsg || 'خطا در ثبت سفارش.'
        : 'Failed to place order. Please check your details and try again.';
      toast.error(errorMsg);
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-brand-surface rounded-3xl my-8 border border-brand-border shadow-xs max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-brand-surface-elevated border border-brand-gold/40 flex items-center justify-center mb-6 text-brand-bronze">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h2 className="text-2xl font-black text-brand-text mb-2">
          {t.checkout.orderSuccessTitle}
        </h2>
        <p className="text-xs text-brand-text-muted mb-6">
          {isPersian
            ? 'سفارش شما با موفقیت در سیستم ثبت گردید و جهت آماده‌سازی به واحد انبار ارسال شد.'
            : 'Your order has been recorded and transferred to inventory for preparation.'}
        </p>

        <div className="w-full bg-brand-surface-elevated rounded-2xl p-4 mb-6 border border-brand-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-brand-text-muted">{t.checkout.orderNumber}</span>
            <span className="font-mono font-bold text-brand-bronze">
              {completedOrder.orderNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-muted">{t.cart.total}</span>
            <span className="font-bold text-brand-text">
              {formatToman(completedOrder.total, isPersian)}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href={PATHS.PROFILE}
            className="px-6 py-3 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne font-bold text-xs border border-brand-gold/40 shadow-sm"
          >
            {t.checkout.viewProfile}
          </Link>
          <Link
            href={PATHS.HOME}
            className="px-6 py-3 rounded-2xl bg-brand-surface border border-brand-border text-xs font-bold text-brand-text"
          >
            {t.checkout.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-brand-surface rounded-3xl my-8 border border-brand-border shadow-xs">
        <ShoppingBag className="w-16 h-16 mb-4 text-brand-bronze opacity-40" />
        <h2 className="text-xl font-black text-brand-text mb-2">
          {t.cart.emptyTitle}
        </h2>
        <p className="text-xs text-brand-text-muted mb-6">
          {t.cart.emptySub}
        </p>
        <Link
          href={PATHS.PRODUCTS}
          className="px-8 py-3.5 rounded-2xl bg-brand-olive text-brand-champagne font-bold text-xs border border-brand-gold/40 shadow-sm"
        >
          {t.cart.browseProducts}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-brand-text-muted mb-8">
        <Link href={PATHS.HOME} className="hover:text-brand-gold">
          {t.nav.home}
        </Link>
        <span>/</span>
        <Link href={PATHS.CART} className="hover:text-brand-gold">
          {t.cart.title}
        </Link>
        <span>/</span>
        <span className="font-bold text-brand-text">{t.checkout.title}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-black text-brand-text mb-8">
        {t.checkout.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Flow */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-bronze" />
                <h3 className="font-bold text-base text-brand-text">
                  {t.checkout.deliveryAddress}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="flex items-center gap-1 text-xs font-bold text-brand-bronze hover:underline"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingAddress ? t.common.cancel : t.checkout.editAddress}</span>
              </button>
            </div>

            {isEditingAddress ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted mb-1">
                    {t.checkout.fullName} (تحویل‌گیرنده)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.fullName}
                    onChange={(e) =>
                      setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-muted mb-1">
                    {t.checkout.phone} (تحویل‌گیرنده)
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    maxLength={11}
                    value={deliveryAddress.phone}
                    onChange={(e) =>
                      setDeliveryAddress({
                        ...deliveryAddress,
                        phone: toEnglishDigits(e.target.value).replace(/\D/g, ''),
                      })
                    }
                    placeholder="09123456789"
                    className="w-full h-11 px-3 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold font-mono text-brand-text focus:ring-2 focus:ring-brand-gold text-center"
                  />
                </div>

                <ProvinceCitySelect
                  province={deliveryAddress.province}
                  city={deliveryAddress.city}
                  onChange={({ province, city }) =>
                    setDeliveryAddress((prev) => ({ ...prev, province, city }))
                  }
                  className="sm:col-span-2"
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-brand-text-muted mb-1">
                    {t.checkout.addressDetail}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={deliveryAddress.addressDetail}
                    onChange={(e) =>
                      setDeliveryAddress({ ...deliveryAddress, addressDetail: e.target.value })
                    }
                    placeholder={
                      isPersian
                        ? 'نام خیابان، کوچه، پلاک، طبقه، واحد یا توضیحات تکمیلی...'
                        : 'Street, alley, building number, floor, details...'
                    }
                    className="w-full p-3 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs font-semibold text-brand-text focus:ring-2 focus:ring-brand-gold resize-none h-24 overflow-y-auto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-muted mb-1">
                    {t.checkout.postalCode}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={deliveryAddress.postalCode}
                    onChange={(e) =>
                      setDeliveryAddress({
                        ...deliveryAddress,
                        postalCode: toEnglishDigits(e.target.value).replace(/\D/g, ''),
                      })
                    }
                    placeholder="1234567890"
                    className="w-full h-11 px-3 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs font-mono text-brand-text focus:ring-2 focus:ring-brand-gold text-center"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="h-11 px-3 rounded-xl bg-brand-champagne/20 border border-brand-gold/30 flex items-center gap-2 text-[11px] text-brand-bronze-dark font-medium">
                    <span>💡</span>
                    <span>
                      {isPersian
                        ? 'کد پستی ۱۰ رقمی بدون خط تیره جهت ارسال سریع مرسولات'
                        : '10-digit postal code for express shipping'}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl bg-brand-champagne/20 border border-brand-gold/30 text-[11px] text-brand-bronze-dark leading-relaxed">
                  💡 {isPersian
                    ? 'در صورتی که اولین خرید شما باشد و قبلاً نشانی خود را در پروفایل ثبت نکرده باشید، این مشخصات به صورت خودکار به عنوان آدرس دائم در حساب شما ذخیره خواهد شد.'
                    : 'If this is your first purchase, this delivery address will be automatically saved to your profile.'}
                </div>

                <button
                  onClick={() => {
                    const cleanPhone = toEnglishDigits(deliveryAddress.phone).trim();
                    if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
                      toast.error(
                        isPersian
                          ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).'
                          : 'Phone number must be 11 digits starting with 09.'
                      );
                      return;
                    }
                    const cleanPostal = toEnglishDigits(deliveryAddress.postalCode).trim();
                    if (cleanPostal && cleanPostal.length !== 10) {
                      toast.error(
                        isPersian
                          ? 'کد پستی باید دقیقاً ۱۰ رقم باشد.'
                          : 'Postal code must be exactly 10 digits.'
                      );
                      return;
                    }
                    setIsEditingAddress(false);
                  }}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-brand-olive text-brand-champagne font-bold text-xs border border-brand-gold/40 shadow-xs hover:bg-brand-olive/90 transition-colors"
                >
                  {t.checkout.saveAddress}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-text">
                    {deliveryAddress.fullName || (isPersian ? 'کاربر بدون نام' : 'Unnamed User')}
                  </span>
                  {deliveryAddress.phone && (
                    <span className="font-mono text-brand-text-muted">{deliveryAddress.phone}</span>
                  )}
                </div>
                <div className="text-brand-text-muted leading-relaxed">
                  {[deliveryAddress.province, deliveryAddress.city, deliveryAddress.addressDetail].filter(Boolean).join('، ')}
                </div>
                {deliveryAddress.postalCode && (
                  <div className="text-[11px] font-mono text-brand-bronze">
                    {isPersian ? 'کد پستی: ' : 'Postal Code: '} {deliveryAddress.postalCode}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-4">
            <h3 className="font-bold text-base text-brand-text">
              {t.checkout.paymentMethod}
            </h3>

            <div className="space-y-2.5">
              <label
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'online'
                    ? 'border-brand-gold bg-brand-surface-elevated shadow-xs'
                    : 'border-brand-border hover:border-brand-gold/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="w-4 h-4 accent-brand-bronze"
                  />
                  <div>
                    <span className="font-bold text-xs text-brand-text block">
                      {t.checkout.onlinePayment}
                    </span>
                    <span className="text-[11px] text-brand-text-muted">
                      {isPersian ? 'متصل به درگاه مستقیم شاپرک / زرین‌پال' : 'Direct Shaparak Payment Gateway'}
                    </span>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('installment')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'installment'
                    ? 'border-brand-gold bg-brand-surface-elevated shadow-xs'
                    : 'border-brand-border hover:border-brand-gold/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'installment'}
                    onChange={() => setPaymentMethod('installment')}
                    className="w-4 h-4 accent-brand-bronze"
                  />
                  <div>
                    <span className="font-bold text-xs text-brand-text block">
                      {t.checkout.installmentPayment}
                    </span>
                    <span className="text-[11px] text-brand-text-muted">
                      {isPersian ? 'پرداخت در ۴ قسط بدون سود و ضامن با اسنپ‌پی' : 'Pay in 4 interest-free installments'}
                    </span>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-brand-gold bg-brand-surface-elevated shadow-xs'
                    : 'border-brand-border hover:border-brand-gold/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 accent-brand-bronze"
                  />
                  <div>
                    <span className="font-bold text-xs text-brand-text block">
                      {t.checkout.codPayment}
                    </span>
                    <span className="text-[11px] text-brand-text-muted">
                      {isPersian ? 'پرداخت با کارتخوان هنگام دریافت سفارش' : 'Pay via POS machine on delivery'}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary & Coupon Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Box */}
          <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-brand-text">
              {t.checkout.couponCode}
            </h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={isPersian ? 'مثال: VIP20' : 'e.g. VIP20'}
                className="flex-1 h-11 px-3 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs uppercase font-bold text-brand-text focus:ring-2 focus:ring-brand-gold"
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="px-4 h-11 rounded-xl bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne font-bold text-xs border border-brand-gold/40 shadow-xs"
              >
                {couponLoading ? '...' : t.checkout.applyCoupon}
              </button>
            </form>
            {appliedCoupon && (
              <div className="text-[11px] font-bold text-brand-bronze flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isPersian
                    ? `کد ${appliedCoupon.code} فعال شد (${formatToman(appliedCoupon.discountAmount, isPersian)})`
                    : `Coupon ${appliedCoupon.code} applied (${formatToman(appliedCoupon.discountAmount, isPersian)})`}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
            <h3 className="font-black text-base text-brand-text pb-4 border-b border-brand-border">
              {isPersian ? 'فاکتور نهایی' : 'Final Invoice'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-brand-text-muted">
                <span>{t.cart.subtotal}</span>
                <span className="font-bold text-brand-text">
                  {formatToman(subtotal, isPersian)}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-brand-bronze">
                  <span>{isPersian ? 'تخفیف کوپن:' : 'Coupon Discount:'}</span>
                  <span className="font-bold">- {formatToman(couponDiscount, isPersian)}</span>
                </div>
              )}

              {vipDiscount > 0 && (
                <div className="flex justify-between text-brand-bronze">
                  <span>{isPersian ? 'تخفیف ۵٪ اشتراک VIP:' : '5% VIP Member Discount:'}</span>
                  <span className="font-bold">- {formatToman(vipDiscount, isPersian)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-text-muted">
                <span>{t.cart.shippingFee}</span>
                <span className="font-bold text-brand-text">
                  {shippingFee === 0 ? t.common.free : formatToman(shippingFee, isPersian)}
                </span>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-between text-base font-black text-brand-text">
                <span>{t.cart.total}</span>
                <span className="text-brand-bronze">
                  {formatToman(total, isPersian)}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={orderSubmitting}
              className="w-full py-4 rounded-2xl bg-brand-gold hover:bg-brand-champagne text-brand-olive font-black text-sm shadow-md shadow-brand-bronze/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {orderSubmitting ? (
                <span>{t.common.loading}</span>
              ) : (
                <>
                  <span>{t.checkout.submitOrder}</span>
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
