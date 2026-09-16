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
  User,
  Phone,
  Mail,
  Building,
  Hash,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Card, CardBody, Button, Input, Textarea, Chip } from '@heroui/react';
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
    fullName: user?.recipientName || user?.fullName || (isPersian ? 'کاربر هاتف آروما' : 'HAroma User'),
    phone: user?.recipientPhone || user?.phone || '',
    email: user?.recipientEmail || user?.email || '',
    province: user?.province || (isPersian ? 'تهران' : 'Tehran'),
    city: user?.city || (isPersian ? 'تهران' : 'Tehran'),
    postalCode: user?.postalCode || '',
    addressDetail: user?.address || '',
    description: user?.addressNotes || '',
  });

  // Sync address when user profile loads/changes
  React.useEffect(() => {
    if (user) {
      setDeliveryAddress((prev) => ({
        fullName: user.recipientName || user.fullName || prev.fullName,
        phone: user.recipientPhone || user.phone || prev.phone,
        email: user.recipientEmail || user.email || prev.email || '',
        province: user.province || prev.province,
        city: user.city || prev.city,
        postalCode: user.postalCode || prev.postalCode,
        addressDetail: user.address || prev.addressDetail,
        description: user.addressNotes || prev.description || '',
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
    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
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

    const cleanEmail = deliveryAddress.email?.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error(
        isPersian
          ? 'فرمت ایمیل تحویل‌گیرنده معتبر نیست.'
          : 'Invalid recipient email format.'
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
      <Card className="max-w-xl mx-auto my-12 p-6 sm:p-10 bg-brand-surface rounded-3xl border border-brand-border shadow-xs text-center">
        <CardBody className="flex flex-col items-center p-0">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-brand-text mb-2">
            {t.checkout.orderSuccessTitle}
          </h2>
          <p className="text-xs text-brand-text-muted mb-6 leading-relaxed">
            {t.checkout.orderSuccessSub}
          </p>

          <div className="w-full bg-brand-surface-elevated p-4 rounded-2xl border border-brand-border space-y-2 mb-6 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-text-muted">{t.checkout.orderNumber}</span>
              <span className="font-mono font-bold text-brand-bronze dark:text-brand-gold">
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              as={Link}
              href={PATHS.PROFILE}
              radius="lg"
              className="h-11 px-6 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl"
            >
              {t.checkout.viewProfile}
            </Button>
            <Button
              as={Link}
              href={PATHS.HOME}
              radius="lg"
              variant="flat"
              className="h-11 px-6 bg-brand-surface-elevated border border-brand-border text-xs font-bold text-brand-text rounded-2xl"
            >
              {t.checkout.backToHome}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-brand-surface rounded-3xl my-8 border border-brand-border shadow-xs">
        <CardBody className="flex flex-col items-center justify-center p-0">
          <ShoppingBag className="w-16 h-16 mb-4 text-brand-bronze opacity-40" />
          <h2 className="text-xl font-black text-brand-text mb-2">
            {t.cart.emptyTitle}
          </h2>
          <p className="text-xs text-brand-text-muted mb-6">
            {t.cart.emptySub}
          </p>
          <Button
            as={Link}
            href={PATHS.PRODUCTS}
            radius="lg"
            className="h-11 px-8 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl"
          >
            {t.cart.browseProducts}
          </Button>
        </CardBody>
      </Card>
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
          <Card className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
                <h3 className="font-black text-base text-brand-text">
                  {t.checkout.deliveryAddress}
                </h3>
              </div>
              <Button
                size="sm"
                variant="light"
                onPress={() => setIsEditingAddress(!isEditingAddress)}
                startContent={<Edit2 className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold" />}
                className="h-8 px-3 rounded-xl text-xs font-bold text-brand-bronze dark:text-brand-gold hover:bg-brand-surface-elevated cursor-pointer"
              >
                <span>{isEditingAddress ? t.common.cancel : t.checkout.editAddress}</span>
              </Button>
            </div>

            {isEditingAddress ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.fullName} (تحویل‌گیرنده)
                    </label>
                  </div>
                  <Input
                    aria-label={t.checkout.fullName}
                    placeholder={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                    value={deliveryAddress.fullName}
                    onValueChange={(val) =>
                      setDeliveryAddress({ ...deliveryAddress, fullName: val })
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.phone} (تحویل‌گیرنده)
                    </label>
                  </div>
                  <Input
                    aria-label={t.checkout.phone}
                    placeholder="09123456789"
                    dir="ltr"
                    maxLength={11}
                    value={deliveryAddress.phone}
                    onValueChange={(val) =>
                      setDeliveryAddress({
                        ...deliveryAddress,
                        phone: toEnglishDigits(val).replace(/\D/g, ''),
                      })
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold font-mono text-brand-text text-center",
                    }}
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

                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <Building className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.addressDetail}
                    </label>
                  </div>
                  <Textarea
                    aria-label={t.checkout.addressDetail}
                    minRows={3}
                    maxLength={500}
                    value={deliveryAddress.addressDetail}
                    onValueChange={(val) =>
                      setDeliveryAddress({ ...deliveryAddress, addressDetail: val })
                    }
                    placeholder={
                      isPersian
                        ? 'نام خیابان، کوچه، پلاک، طبقه، واحد یا توضیحات تکمیلی...'
                        : 'Street, alley, building number, floor, details...'
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "px-4 py-3 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text leading-relaxed",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.postalCode}
                    </label>
                  </div>
                  <Input
                    aria-label={t.checkout.postalCode}
                    placeholder="1234567890"
                    dir="ltr"
                    maxLength={10}
                    value={deliveryAddress.postalCode}
                    onValueChange={(val) =>
                      setDeliveryAddress({
                        ...deliveryAddress,
                        postalCode: toEnglishDigits(val).replace(/\D/g, ''),
                      })
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold font-mono text-brand-text text-center",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.email}
                    </label>
                  </div>
                  <Input
                    type="email"
                    aria-label={t.checkout.email}
                    placeholder="user@example.com"
                    dir="ltr"
                    value={deliveryAddress.email || ''}
                    onValueChange={(val) =>
                      setDeliveryAddress({ ...deliveryAddress, email: val })
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text text-start",
                    }}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 h-5">
                    <FileText className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                    <label className="text-xs font-bold text-brand-text">
                      {t.checkout.notes}
                    </label>
                  </div>
                  <Textarea
                    aria-label={t.checkout.notes}
                    minRows={2}
                    maxLength={300}
                    value={deliveryAddress.description || ''}
                    onValueChange={(val) =>
                      setDeliveryAddress({ ...deliveryAddress, description: val })
                    }
                    placeholder={
                      isPersian
                        ? 'توضیحات تکمیلی تحویل سفارش، شماره زنگ، طبقه، هماهنگی قبل از ارسال و... (اختیاری)'
                        : 'Special delivery instructions, apartment/bell number, coordination... (optional)'
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: "px-4 py-3 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-xs font-semibold text-brand-text leading-relaxed",
                    }}
                  />
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-brand-champagne/20 border border-brand-gold/30 text-[11px] text-brand-bronze-dark leading-relaxed flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>
                    {isPersian
                      ? 'در صورتی که اولین خرید شما باشد و قبلاً نشانی خود را در پروفایل ثبت نکرده باشید، این مشخصات به صورت خودکار به عنوان آدرس دائم در حساب شما ذخیره خواهد شد.'
                      : 'If this is your first purchase, this delivery address will be automatically saved to your profile.'}
                  </span>
                </div>

                <Button
                  type="button"
                  radius="lg"
                  onPress={() => {
                    const cleanPhone = toEnglishDigits(deliveryAddress.phone).trim();
                    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
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
                    const cleanEmail = deliveryAddress.email?.trim().toLowerCase();
                    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                      toast.error(
                        isPersian
                          ? 'فرمت ایمیل تحویل‌گیرنده معتبر نیست.'
                          : 'Invalid recipient email format.'
                      );
                      return;
                    }
                    setIsEditingAddress(false);
                  }}
                  className="sm:col-span-2 h-11 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] text-xs font-black shadow-md shadow-brand-gold/20 transition-all rounded-2xl cursor-pointer"
                >
                  {t.checkout.saveAddress}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-text">
                    {deliveryAddress.fullName || (isPersian ? 'کاربر بدون نام' : 'Unnamed User')}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-brand-text-muted text-[11px]">
                    {deliveryAddress.phone && <span>{deliveryAddress.phone}</span>}
                    {deliveryAddress.email && <span>{deliveryAddress.email}</span>}
                  </div>
                </div>
                <div className="text-brand-text-muted leading-relaxed">
                  {[deliveryAddress.province, deliveryAddress.city, deliveryAddress.addressDetail].filter(Boolean).join('، ')}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  {deliveryAddress.postalCode ? (
                    <div className="font-mono text-brand-bronze dark:text-brand-gold font-bold">
                      {isPersian ? 'کد پستی: ' : 'Postal Code: '} {deliveryAddress.postalCode}
                    </div>
                  ) : <div />}
                  {deliveryAddress.description && (
                    <div className="text-brand-text-muted italic truncate max-w-xs">
                      {isPersian ? 'یادداشت: ' : 'Note: '} {deliveryAddress.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Step 2: Payment Method */}
          <Card className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-4">
            <h3 className="font-black text-base text-brand-text">
              {t.checkout.paymentMethod}
            </h3>

            <div className="space-y-2.5">
              <div
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
                    className="w-4 h-4 accent-brand-gold cursor-pointer"
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
                <CreditCard className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              </div>

              <div
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
                    className="w-4 h-4 accent-brand-gold cursor-pointer"
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
                <Zap className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              </div>

              <div
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
                    className="w-4 h-4 accent-brand-gold cursor-pointer"
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
                <Truck className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary & Coupon Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Box */}
          <Card className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-xs space-y-3">
            <h4 className="font-black text-xs text-brand-text">
              {t.checkout.couponCode}
            </h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input
                aria-label={t.checkout.couponCode}
                placeholder={isPersian ? 'مثال: VIP20' : 'e.g. VIP20'}
                value={promoCode}
                onValueChange={setPromoCode}
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper: "h-11 px-3 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-xl shadow-xs uppercase font-bold text-xs",
                  input: "text-xs font-bold text-brand-text uppercase",
                }}
              />
              <Button
                type="submit"
                radius="lg"
                isLoading={couponLoading}
                className="h-11 px-5 rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 transition-all shrink-0 cursor-pointer"
              >
                {t.checkout.applyCoupon}
              </Button>
            </form>
            {appliedCoupon && (
              <div className="text-[11px] font-bold text-brand-bronze dark:text-brand-gold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isPersian
                    ? `کد ${appliedCoupon.code} فعال شد (${formatToman(appliedCoupon.discountAmount, isPersian)})`
                    : `Coupon ${appliedCoupon.code} applied (${formatToman(appliedCoupon.discountAmount, isPersian)})`}
                </span>
              </div>
            )}
          </Card>

          {/* Pricing Breakdown Card */}
          <Card className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
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
                <div className="flex justify-between text-brand-bronze dark:text-brand-gold font-bold">
                  <span>{isPersian ? 'تخفیف کوپن:' : 'Coupon Discount:'}</span>
                  <span>- {formatToman(couponDiscount, isPersian)}</span>
                </div>
              )}

              {vipDiscount > 0 && (
                <div className="flex justify-between text-brand-bronze dark:text-brand-gold font-bold">
                  <span>{isPersian ? 'تخفیف ۵٪ اشتراک VIP:' : '5% VIP Member Discount:'}</span>
                  <span>- {formatToman(vipDiscount, isPersian)}</span>
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
                <span className="text-brand-bronze dark:text-brand-gold">
                  {formatToman(total, isPersian)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              radius="lg"
              isLoading={orderSubmitting}
              onPress={handleConfirmOrder}
              endContent={!orderSubmitting && (isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
              className="w-full h-13 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-sm shadow-md shadow-brand-gold/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              {t.checkout.submitOrder}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
