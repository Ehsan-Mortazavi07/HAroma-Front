'use client';

import { Input, Textarea } from '@/components/common/DirectionalFields';
import React, { useState } from 'react';
import {
  useRouter } from 'next/navigation';
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
  Plus,
  Check,
  } from 'lucide-react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  Checkbox,
} from '@heroui/react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { clearCart } from '@/stores/cart/cartSlice';
import { updateUser } from '@/stores/auth/authSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, toEnglishDigits, getLocalizedVariantTitle, toast } from '@/common/utils';
import axiosInstance from '@/common/axiosInstance';
import { useTranslation } from '@/common/i18n';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
import { AnimatedFieldError } from '@/components/common/AnimatedFieldError';
import { IUserAddress } from '@/common/interfaces';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';

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

  const [addressTouched, setAddressTouched] = useState({
    fullName: false,
    phone: false,
    addressDetail: false,
  });

  // Saved Addresses State
  const [addresses, setAddresses] = useState<IUserAddress[]>(user?.addresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: '',
    province: 'تهران',
    city: 'تهران',
    address: '',
    postalCode: '',
    buildingNumber: '',
    unit: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    addressNotes: '',
    isDefault: false,
  });
  const [newAddressErrors, setNewAddressErrors] = useState<Record<string, string>>({});
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  const applyAddressToDelivery = (addr: IUserAddress) => {
    setDeliveryAddress({
      fullName: addr.recipientName || user?.fullName || '',
      phone: addr.recipientPhone || user?.phone || '',
      email: addr.recipientEmail || user?.email || '',
      province: addr.province || 'تهران',
      city: addr.city || 'تهران',
      postalCode: addr.postalCode || '',
      addressDetail: addr.address || '',
      description: addr.addressNotes || '',
    });
  };

  const fetchCheckoutAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await axiosInstance.get('/users/addresses');
      const list: IUserAddress[] = res.data || [];
      setAddresses(list);
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(defaultAddr._id);
        applyAddressToDelivery(defaultAddr);
      }
    } catch (err) {
      console.error('Failed to load user addresses in checkout', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchCheckoutAddresses();
    } else if (user) {
      setDeliveryAddress((prev) => ({
        ...prev,
        fullName: user.recipientName || user.fullName || prev.fullName,
        phone: user.recipientPhone || user.phone || prev.phone,
        email: user.recipientEmail || user.email || prev.email,
        province: user.province || prev.province,
        city: user.city || prev.city,
        postalCode: user.postalCode || prev.postalCode,
        addressDetail: user.address || prev.addressDetail,
        description: user.addressNotes || prev.description,
      }));
    }
  }, [isAuthenticated, user]);

  const handleSelectAddress = (addr: IUserAddress) => {
    setSelectedAddressId(addr._id);
    applyAddressToDelivery(addr);
    setIsEditingAddress(false);
    toast.success(
      isPersian
        ? `نشانی تحویل به «${addr.title || addr.city}» تغییر یافت.`
        : `Delivery address set to "${addr.title || addr.city}".`
    );
  };

  const handleOpenNewAddressModal = () => {
    setNewAddressForm({
      title: '',
      province: 'تهران',
      city: 'تهران',
      address: '',
      postalCode: '',
      buildingNumber: '',
      unit: '',
      recipientName: user?.fullName || '',
      recipientPhone: user?.phone || '',
      recipientEmail: user?.email || '',
      addressNotes: '',
      isDefault: addresses.length === 0,
    });
    setNewAddressErrors({});
    setIsNewAddressModalOpen(true);
  };

  const handleSaveNewAddressInCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    const addressTitle = newAddressForm.title.trim().replace(/\s+/g, ' ');
    const addressTitleKey = addressTitle.toLowerCase();
    if (!addressTitle) {
      errors.title = isPersian ? 'عنوان نشانی الزامی است.' : 'Address title is required.';
    } else if (
      addresses.some(
        (address) =>
          (address.title || '').trim().replace(/\s+/g, ' ').toLowerCase() === addressTitleKey,
      )
    ) {
      errors.title = isPersian
        ? 'این عنوان برای یکی دیگر از نشانی‌های شما ثبت شده است.'
        : 'You already use this title for another address.';
    }

    if (!newAddressForm.recipientName.trim()) {
      errors.recipientName = isPersian ? 'نام و نام خانوادگی تحویل‌گیرنده الزامی است.' : 'Recipient full name is required.';
    }

    const cleanPhone = toEnglishDigits(newAddressForm.recipientPhone).trim();
    if (!cleanPhone) {
      errors.recipientPhone = isPersian ? 'شماره تماس الزامی است.' : 'Phone number is required.';
    } else if (!/^09\d{9}$/.test(cleanPhone)) {
      errors.recipientPhone = isPersian ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود.' : 'Phone must be 11 digits starting with 09.';
    }

    if (!newAddressForm.province.trim()) {
      errors.province = isPersian ? 'انتخاب استان الزامی است.' : 'Province is required.';
    }
    if (!newAddressForm.city.trim()) {
      errors.city = isPersian ? 'انتخاب شهر الزامی است.' : 'City is required.';
    }
    if (!newAddressForm.address.trim()) {
      errors.address = isPersian ? 'نشانی دقیق پستی الزامی است.' : 'Street address is required.';
    }

    const cleanPostal = toEnglishDigits(newAddressForm.postalCode).trim();
    if (cleanPostal && cleanPostal.length !== 10) {
      errors.postalCode = isPersian ? 'کد پستی باید ۱۰ رقم باشد.' : 'Postal code must be 10 digits.';
    }

    const cleanEmail = newAddressForm.recipientEmail.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.recipientEmail = isPersian ? 'فرمت ایمیل نامعتبر است.' : 'Invalid email format.';
    }

    if (Object.keys(errors).length > 0) {
      setNewAddressErrors(errors);
      return;
    }
    setNewAddressErrors({});

    setSavingNewAddress(true);
    try {
      const res = await axiosInstance.post('/users/addresses', {
        title: addressTitle,
        province: newAddressForm.province.trim(),
        city: newAddressForm.city.trim(),
        address: newAddressForm.address.trim(),
        postalCode: cleanPostal || undefined,
        buildingNumber: newAddressForm.buildingNumber.trim() || undefined,
        unit: newAddressForm.unit.trim() || undefined,
        recipientName: newAddressForm.recipientName.trim(),
        recipientPhone: cleanPhone,
        recipientEmail: cleanEmail || undefined,
        addressNotes: newAddressForm.addressNotes.trim() || undefined,
        isDefault: newAddressForm.isDefault,
      });

      const updatedList: IUserAddress[] = res.data?.addresses || [];
      setAddresses(updatedList);

      const newlyAdded = res.data?.address || updatedList[updatedList.length - 1];
      if (newlyAdded) {
        setSelectedAddressId(newlyAdded._id);
        applyAddressToDelivery(newlyAdded);
      }

      setIsNewAddressModalOpen(false);
      toast.success(
        isPersian
          ? 'نشانی جدید با موفقیت ذخیره و انتخاب شد.'
          : 'New address added and selected.'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ثبت نشانی جدید.' : 'Failed to add address.'));
    } finally {
      setSavingNewAddress(false);
    }
  };

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | 'installment'>('cod');
  const [isStoreReviewOpen, setIsStoreReviewOpen] = useState(true);

  // Promo Code / Coupons
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

    setAddressTouched({ fullName: true, phone: true, addressDetail: true });

    if (!deliveryAddress.fullName.trim()) {
      toast.error(isPersian ? 'وارد کردن نام و نام خانوادگی ضروری است.' : 'Recipient full name is required.');
      return;
    }

    const cleanPhone = toEnglishDigits(deliveryAddress.phone).trim();
    if (!cleanPhone) {
      toast.error(isPersian ? 'وارد کردن شماره تماس ضروری است.' : 'Phone number is required.');
      return;
    }
    if (!/^09\d{9}$/.test(cleanPhone)) {
      toast.error(
        isPersian
          ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).'
          : 'Phone number must be 11 digits starting with 09.'
      );
      return;
    }

    if (!deliveryAddress.addressDetail.trim()) {
      toast.error(isPersian ? 'وارد کردن آدرس دقیق پستی ضروری است.' : 'Street address detail is required.');
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
            variantId: item.selectedVariant?.id,
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
                <h3 className="font-black text-base text-brand-text">
                  {t.checkout.deliveryAddress}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <Button
                    size="sm"
                    variant="flat"
                    radius="lg"
                    onPress={handleOpenNewAddressModal}
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    className="h-8 px-3 rounded-xl text-xs font-bold bg-brand-surface-elevated hover:bg-brand-gold/10 text-brand-bronze dark:text-brand-gold border border-brand-border hover:border-brand-gold/40 cursor-pointer transition-colors"
                  >
                    {isPersian ? '+ نشانی جدید' : '+ New Address'}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsEditingAddress(!isEditingAddress)}
                  startContent={<Edit2 className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold" />}
                  className="h-8 px-3 rounded-xl text-xs font-bold text-brand-bronze dark:text-brand-gold hover:bg-brand-surface-elevated cursor-pointer"
                >
                  <span>{isEditingAddress ? t.common.cancel : (isPersian ? 'ویرایش جزئیات' : t.checkout.editAddress)}</span>
                </Button>
              </div>
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
                    dir="auto"
                    aria-label={t.checkout.fullName}
                    placeholder={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                    value={deliveryAddress.fullName}
                    onValueChange={(val) => {
                      setDeliveryAddress({ ...deliveryAddress, fullName: val });
                      if (!addressTouched.fullName) setAddressTouched((p) => ({ ...p, fullName: true }));
                    }}
                    onBlur={() => setAddressTouched((p) => ({ ...p, fullName: true }))}
                    isInvalid={addressTouched.fullName && !deliveryAddress.fullName.trim()}
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: addressTouched.fullName && !deliveryAddress.fullName.trim()
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-sm font-semibold text-brand-text",
                    }}
                  />
                  {addressTouched.fullName && !deliveryAddress.fullName.trim() && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {isPersian ? 'این فیلد ضروری است (نام و نام خانوادگی تحویل‌گیرنده).' : 'Recipient full name is required.'}
                    </p>
                  )}
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
                    onValueChange={(val) => {
                      setDeliveryAddress({
                        ...deliveryAddress,
                        phone: toEnglishDigits(val).replace(/\D/g, ''),
                      });
                      if (!addressTouched.phone) setAddressTouched((p) => ({ ...p, phone: true }));
                    }}
                    onBlur={() => setAddressTouched((p) => ({ ...p, phone: true }))}
                    isInvalid={addressTouched.phone && (!deliveryAddress.phone.trim() || !/^09\d{9}$/.test(toEnglishDigits(deliveryAddress.phone).trim()))}
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: addressTouched.phone && (!deliveryAddress.phone.trim() || !/^09\d{9}$/.test(toEnglishDigits(deliveryAddress.phone).trim()))
                        ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "h-12 px-4 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-sm font-semibold font-mono text-brand-text text-center",
                    }}
                  />
                  {addressTouched.phone && !deliveryAddress.phone.trim() && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {isPersian ? 'این فیلد ضروری است (شماره تماس).' : 'Phone number is required.'}
                    </p>
                  )}
                  {addressTouched.phone && deliveryAddress.phone.trim() && !/^09\d{9}$/.test(toEnglishDigits(deliveryAddress.phone).trim()) && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {isPersian ? 'شماره تماس باید ۱۱ رقم بوده و با ۰۹ شروع شود.' : 'Phone must be 11 digits starting with 09.'}
                    </p>
                  )}
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
                    dir="auto"
                    aria-label={t.checkout.addressDetail}
                    minRows={3}
                    maxLength={500}
                    value={deliveryAddress.addressDetail}
                    onValueChange={(val) => {
                      setDeliveryAddress({ ...deliveryAddress, addressDetail: val });
                      if (!addressTouched.addressDetail) setAddressTouched((p) => ({ ...p, addressDetail: true }));
                    }}
                    onBlur={() => setAddressTouched((p) => ({ ...p, addressDetail: true }))}
                    isInvalid={addressTouched.addressDetail && !deliveryAddress.addressDetail.trim()}
                    placeholder={
                      isPersian
                        ? 'نام خیابان، کوچه، پلاک، طبقه، واحد یا توضیحات تکمیلی...'
                        : 'Street, alley, building number, floor, details...'
                    }
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      inputWrapper: addressTouched.addressDetail && !deliveryAddress.addressDetail.trim()
                        ? "px-4 py-3 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                        : "px-4 py-3 bg-brand-surface border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                      input: "text-sm font-semibold text-brand-text leading-relaxed",
                    }}
                  />
                  {addressTouched.addressDetail && !deliveryAddress.addressDetail.trim() && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      {isPersian ? 'این فیلد ضروری است (آدرس دقیق پستی).' : 'Street address is required.'}
                    </p>
                  )}
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
                      input: "text-sm font-semibold font-mono text-brand-text text-center",
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
                      input: "text-sm font-semibold text-brand-text text-start",
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
                    dir="auto"
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
                      input: "text-sm font-semibold text-brand-text leading-relaxed",
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
            ) : loadingAddresses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl bg-brand-surface-elevated" />
                ))}
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-brand-text-muted font-medium">
                  {isPersian
                    ? 'نشانی مورد نظر برای ارسال سفارش را انتخاب نمایید:'
                    : 'Select an address for delivery:'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <div
                        key={addr._id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative ${
                          isSelected
                            ? 'bg-brand-gold/10 border-2 border-brand-gold shadow-sm ring-1 ring-brand-gold/30'
                            : 'bg-brand-surface-elevated/40 hover:bg-brand-surface-elevated border-brand-border hover:border-brand-gold/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? 'border-brand-gold bg-brand-gold text-[#141914]'
                                    : 'border-brand-border bg-brand-surface'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="font-bold text-xs text-brand-text">
                                {addr.title || (isPersian ? 'نشانی تحویل' : 'Address')}
                              </span>
                            </div>

                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-[10px] font-bold">
                                {isPersian ? 'پیش‌فرض' : 'Default'}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-brand-text leading-relaxed">
                            {[addr.province, addr.city, addr.address].filter(Boolean).join('، ')}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brand-text-muted pt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-brand-bronze dark:text-brand-gold" />
                              <strong className="text-brand-text">{addr.recipientName || user?.fullName}</strong>
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-brand-bronze dark:text-brand-gold" />
                              <strong className="text-brand-text">{isPersian ? toPersianDigits(addr.recipientPhone || '') : addr.recipientPhone}</strong>
                            </span>
                            {addr.postalCode && (
                              <span className="flex items-center gap-1 font-mono">
                                <Hash className="w-3 h-3 text-brand-bronze dark:text-brand-gold" />
                                <span>{isPersian ? toPersianDigits(addr.postalCode) : addr.postalCode}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px] text-brand-gold font-bold">
                            <span>{isPersian ? 'ارسال به این نشانی' : 'Deliver to this address'}</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                aria-disabled="true"
                className={`flex items-center justify-between p-4 rounded-2xl border opacity-60 cursor-not-allowed ${
                  paymentMethod === 'online'
                    ? 'border-brand-gold bg-brand-surface-elevated shadow-xs'
                    : 'border-brand-border hover:border-brand-gold/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'online'}
                    disabled
                    readOnly
                    className="w-4 h-4 accent-brand-gold cursor-not-allowed"
                  />
                  <div>
                    <span className="font-bold text-xs text-brand-text block">
                      {t.checkout.onlinePayment}
                    </span>
                    <span className="text-[11px] text-brand-text-muted">
                      {isPersian ? 'به‌زودی فعال می‌شود' : 'Coming soon'}
                    </span>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              </div>

              <div
                aria-disabled="true"
                className={`flex items-center justify-between p-4 rounded-2xl border opacity-60 cursor-not-allowed ${
                  paymentMethod === 'installment'
                    ? 'border-brand-gold bg-brand-surface-elevated shadow-xs'
                    : 'border-brand-border hover:border-brand-gold/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'installment'}
                    disabled
                    readOnly
                    className="w-4 h-4 accent-brand-gold cursor-not-allowed"
                  />
                  <div>
                    <span className="font-bold text-xs text-brand-text block">
                      {t.checkout.installmentPayment}
                    </span>
                    <span className="text-[11px] text-brand-text-muted">
                      {isPersian ? 'به‌زودی فعال می‌شود' : 'Coming soon'}
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
                dir="auto"
                aria-label={t.checkout.couponCode}
                placeholder={isPersian ? 'مثال: VIP20' : 'e.g. VIP20'}
                value={promoCode}
                onValueChange={setPromoCode}
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper: "h-11 px-3 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-xl shadow-xs uppercase font-bold text-sm",
                  input: "text-sm font-bold text-brand-text uppercase",
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

      {/* Add New Address Modal in Checkout */}
      <Modal
        isOpen={isNewAddressModalOpen}
        onOpenChange={setIsNewAddressModalOpen}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          base: "flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden bg-brand-surface border border-brand-border text-brand-text max-w-2xl rounded-3xl shadow-2xl",
          header: "shrink-0 border-b border-brand-border pb-3",
          body: "min-h-0 flex-1 overflow-y-auto overscroll-contain py-5 space-y-4",
          footer: "shrink-0 border-t border-brand-border pt-3",
          closeButton: "hover:bg-brand-surface-elevated text-brand-text-muted rounded-xl cursor-pointer",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-text">
                    {isPersian ? 'افزودن نشانی جدید' : 'Add New Address'}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {isPersian
                      ? 'مشخصات نشانی را وارد کنید تا به نشانی‌های شما افزوده و برای این سفارش انتخاب شود'
                      : 'Add an address and select it for this order'}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <Building className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'عنوان نشانی *' : 'Address Title *'}
                      </label>
                    </div>
                    <Input
                      dir="auto"
                      aria-label={isPersian ? 'عنوان نشانی' : 'Address Title'}
                      placeholder={isPersian ? 'مثلاً خانه، محل کار...' : 'e.g. Home, Office...'}
                      value={newAddressForm.title}
                      onValueChange={(val) => {
                        setNewAddressForm({ ...newAddressForm, title: val });
                        if (newAddressErrors.title) setNewAddressErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.title)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.title} />
                  </div>

                  {/* Province & City */}
                  <div className="sm:col-span-2">
                    <ProvinceCitySelect
                      province={newAddressForm.province}
                      city={newAddressForm.city}
                      onChangeProvince={(p) => {
                        setNewAddressForm({ ...newAddressForm, province: p });
                        if (newAddressErrors.province) setNewAddressErrors((prev) => ({ ...prev, province: '' }));
                      }}
                      onChangeCity={(c) => {
                        setNewAddressForm({ ...newAddressForm, city: c });
                        if (newAddressErrors.city) setNewAddressErrors((prev) => ({ ...prev, city: '' }));
                      }}
                    />
                    {(newAddressErrors.province || newAddressErrors.city) && (
                      <p className="text-[11px] font-bold text-rose-500 mt-1">
                        {newAddressErrors.province || newAddressErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Address Detail */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <MapPin className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                      </label>
                    </div>
                    <Textarea
                      dir="auto"
                      aria-label={isPersian ? 'نشانی دقیق پستی' : 'Street Address'}
                      placeholder={
                        isPersian
                          ? 'نام خیابان، کوچه، پلاک، طبقه، واحد...'
                          : 'Street name, alley, building, unit...'
                      }
                      minRows={3}
                      maxLength={500}
                      value={newAddressForm.address}
                      onValueChange={(val) => {
                        setNewAddressForm({ ...newAddressForm, address: val });
                        if (newAddressErrors.address) setNewAddressErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.address)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: newAddressErrors.address
                          ? "p-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors h-24 !resize-none"
                          : "p-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-24 !resize-none",
                        input: "text-sm font-semibold text-brand-text leading-relaxed !resize-none resize-none overflow-y-auto",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.address} />
                  </div>

                  {/* Recipient Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <User className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                      </label>
                    </div>
                    <Input
                      dir="auto"
                      aria-label={isPersian ? 'نام گیرنده تحویل' : 'Recipient Full Name'}
                      placeholder={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
                      value={newAddressForm.recipientName}
                      onValueChange={(val) => {
                        setNewAddressForm({ ...newAddressForm, recipientName: val });
                        if (newAddressErrors.recipientName) setNewAddressErrors((prev) => ({ ...prev, recipientName: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.recipientName)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: newAddressErrors.recipientName
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.recipientName} />
                  </div>

                  {/* Recipient Phone */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <Phone className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
                      </label>
                    </div>
                    <Input
                      aria-label={isPersian ? 'شماره تماس تحویل‌گیرنده' : 'Recipient Phone'}
                      placeholder="09123456789"
                      type="tel"
                      dir="ltr"
                      maxLength={11}
                      value={newAddressForm.recipientPhone}
                      onValueChange={(val) => {
                        const clean = toEnglishDigits(val).replace(/\D/g, '').slice(0, 11);
                        setNewAddressForm({ ...newAddressForm, recipientPhone: clean });
                        if (newAddressErrors.recipientPhone) setNewAddressErrors((prev) => ({ ...prev, recipientPhone: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.recipientPhone)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: newAddressErrors.recipientPhone
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-bold text-brand-text text-center font-mono",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.recipientPhone} />
                  </div>

                  {/* Postal Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <Hash className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'کد پستی (۱۰ رقمی - اختیاری)' : 'Postal Code (10 digits - Optional)'}
                      </label>
                    </div>
                    <Input
                      aria-label={isPersian ? 'کد پستی' : 'Postal Code'}
                      placeholder="1234567890"
                      dir="ltr"
                      maxLength={10}
                      value={newAddressForm.postalCode}
                      onValueChange={(val) => {
                        const clean = toEnglishDigits(val).replace(/\D/g, '').slice(0, 10);
                        setNewAddressForm({ ...newAddressForm, postalCode: clean });
                        if (newAddressErrors.postalCode) setNewAddressErrors((prev) => ({ ...prev, postalCode: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.postalCode)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: newAddressErrors.postalCode
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-bold text-brand-text tracking-widest text-center font-mono",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.postalCode} />
                  </div>

                  {/* Recipient Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-5">
                      <Mail className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'ایمیل تحویل‌گیرنده (اختیاری)' : 'Recipient Email (Optional)'}
                      </label>
                    </div>
                    <Input
                      type="email"
                      aria-label={isPersian ? 'ایمیل تحویل‌گیرنده' : 'Recipient Email'}
                      placeholder="user@example.com"
                      dir="ltr"
                      value={newAddressForm.recipientEmail}
                      onValueChange={(val) => {
                        setNewAddressForm({ ...newAddressForm, recipientEmail: val });
                        if (newAddressErrors.recipientEmail) setNewAddressErrors((prev) => ({ ...prev, recipientEmail: '' }));
                      }}
                      isInvalid={Boolean(newAddressErrors.recipientEmail)}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: newAddressErrors.recipientEmail
                          ? "h-12 px-4 bg-rose-500/5 border border-rose-500/80 focus-within:!border-rose-500 rounded-2xl shadow-xs transition-colors"
                          : "h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors",
                        input: "text-sm font-semibold text-brand-text text-start",
                      }}
                    />
                    <AnimatedFieldError error={newAddressErrors.recipientEmail} />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-5">
                      <FileText className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                      <label className="text-xs font-bold text-brand-text">
                        {isPersian ? 'توضیحات و یادداشت تحویل (اختیاری)' : 'Delivery Notes (Optional)'}
                      </label>
                    </div>
                    <Textarea
                      dir="auto"
                      aria-label={isPersian ? 'توضیحات و یادداشت تحویل' : 'Delivery Notes'}
                      placeholder={
                        isPersian
                          ? 'توضیحات تکمیلی تحویل سفارش، شماره زنگ، طبقه، هماهنگی قبل از ارسال و... (اختیاری)'
                          : 'Special delivery instructions, apartment/bell number, coordination... (optional)'
                      }
                      minRows={2}
                      maxLength={300}
                      value={newAddressForm.addressNotes}
                      onValueChange={(val) => setNewAddressForm({ ...newAddressForm, addressNotes: val })}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        inputWrapper: "p-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold rounded-2xl shadow-xs transition-colors h-20 !resize-none",
                        input: "text-sm font-semibold text-brand-text leading-relaxed !resize-none resize-none overflow-y-auto",
                      }}
                    />
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="sm:col-span-2 pt-2">
                    <SmoothCheckbox
                      isSelected={newAddressForm.isDefault}
                      onValueChange={(val) => setNewAddressForm({ ...newAddressForm, isDefault: val })}
                    >
                      {isPersian
                        ? 'این نشانی به عنوان نشانی پیش‌فرض حساب کاربری ثبت شود'
                        : 'Set this address as default in profile'}
                    </SmoothCheckbox>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="flat"
                  radius="lg"
                  onPress={() => setIsNewAddressModalOpen(false)}
                  className="h-11 px-5 bg-brand-surface-elevated hover:bg-brand-border text-brand-text font-bold text-xs rounded-2xl cursor-pointer"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>

                <Button
                  type="button"
                  onPress={() => handleSaveNewAddressInCheckout()}
                  isLoading={savingNewAddress}
                  radius="lg"
                  startContent={!savingNewAddress && <Check className="w-4 h-4" />}
                  className="h-11 px-7 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 rounded-2xl cursor-pointer transition-all"
                >
                  {savingNewAddress
                    ? isPersian ? 'در حال ثبت...' : 'Saving...'
                    : isPersian ? 'ثبت و انتخاب این نشانی' : 'Save & Select Address'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
