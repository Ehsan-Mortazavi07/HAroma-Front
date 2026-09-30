'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { Input, Textarea } from '@/components/common/DirectionalFields';
import { adminApi } from '@/common/api/admin';
import { IAdminOrderUpdate, IOrder, IProduct } from '@/common/interfaces';
import { formatToman, toast, toEnglishDigits } from '@/common/utils';
import { Check, Search, Trash2, X } from 'lucide-react';

type EditableItem = {
  key: string;
  product: string;
  title: string;
  price: string;
  quantity: string;
  image: string;
  selectedAttributes: string;
};

type OrderDraft = {
  orderNumber: string;
  items: EditableItem[];
  deliveryAddress: IOrder['deliveryAddress'];
  paymentMethod: IOrder['paymentMethod'];
  shippingFee: string;
  couponDiscount: string;
  vipDiscount: string;
  couponCode: string;
  tax: string;
  status: IOrder['status'];
  shippingMethod: string;
  shippingProvider: string;
  trackingCode: string;
  trackingUrl: string;
  createdAt: string;
  shippedAt: string;
  deliveredAt: string;
  notes: string;
  statusNote: string;
};

const inputClassNames = {
  inputWrapper: 'min-h-11 px-3 bg-brand-surface border border-brand-border hover:border-brand-gold/70 focus-within:!border-brand-gold rounded-xl shadow-none transition-colors',
  input: 'text-xs font-semibold text-brand-text',
  label: 'text-[11px] font-bold text-brand-text-muted',
};

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function createDraft(order: IOrder): OrderDraft {
  return {
    orderNumber: order.orderNumber || '',
    items: (order.items || []).map((item, index) => ({
      key: `${item.product}-${index}`,
      product: String(item.product),
      title: item.title || '',
      price: String(item.price ?? 0),
      quantity: String(item.quantity ?? 1),
      image: item.image || '',
      selectedAttributes: item.selectedAttributes || item.selectedVariant?.title || '',
    })),
    deliveryAddress: {
      fullName: order.deliveryAddress?.fullName || '',
      phone: order.deliveryAddress?.phone || '',
      email: order.deliveryAddress?.email || '',
      province: order.deliveryAddress?.province || '',
      city: order.deliveryAddress?.city || '',
      postalCode: order.deliveryAddress?.postalCode || '',
      buildingNumber: order.deliveryAddress?.buildingNumber || '',
      unit: order.deliveryAddress?.unit || '',
      addressDetail: order.deliveryAddress?.addressDetail || '',
      description: order.deliveryAddress?.description || '',
    },
    paymentMethod: order.paymentMethod,
    shippingFee: String(order.shippingFee ?? 0),
    couponDiscount: String(order.couponDiscount ?? 0),
    vipDiscount: String(order.vipDiscount ?? 0),
    couponCode: order.couponCode || '',
    tax: String(order.tax ?? 0),
    status: order.status,
    shippingMethod: order.shippingMethod || 'standard',
    shippingProvider: order.shippingProvider || '',
    trackingCode: order.trackingCode || '',
    trackingUrl: order.trackingUrl || '',
    createdAt: toDateTimeInput(order.createdAt),
    shippedAt: toDateTimeInput(order.shippedAt),
    deliveredAt: toDateTimeInput(order.deliveredAt),
    notes: order.notes || '',
    statusNote: '',
  };
}

function numericValue(value: string, fallback = 0) {
  const parsed = Number(toEnglishDigits(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface OrderEditFormProps {
  order: IOrder;
  isPersian: boolean;
  onCancel: () => void;
  onSaved: (order: IOrder) => void;
}

export function OrderEditForm({ order, isPersian, onCancel, onSaved }: OrderEditFormProps) {
  const [draft, setDraft] = useState(() => createDraft(order));
  const [isSaving, setIsSaving] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<IProduct[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const nextItemKey = useRef(0);

  useEffect(() => setDraft(createDraft(order)), [order]);

  useEffect(() => {
    let active = true;
    const query = productQuery.trim();
    if (query.length < 2) {
      setProductResults([]);
      setIsSearchingProducts(false);
      return () => { active = false; };
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const result = await adminApi.getProducts({ page: 1, pageSize: 8, q: query });
        if (active) setProductResults(Array.isArray(result?.items) ? result.items : []);
      } catch {
        if (active) setProductResults([]);
      } finally {
        if (active) setIsSearchingProducts(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const updateDraft = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const updateAddress = (key: keyof OrderDraft['deliveryAddress'], value: string) => {
    setDraft((previous) => ({
      ...previous,
      deliveryAddress: { ...previous.deliveryAddress, [key]: value },
    }));
  };

  const updateItem = (key: string, field: keyof EditableItem, value: string) => {
    setDraft((previous) => ({
      ...previous,
      items: previous.items.map((item) => item.key === key ? { ...item, [field]: value } : item),
    }));
  };

  const addProduct = (product: IProduct) => {
    const price = product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
    setDraft((previous) => ({
      ...previous,
      items: [...previous.items, {
        key: `${product._id}-${Date.now()}-${nextItemKey.current++}`,
        product: product._id,
        title: product.title,
        price: String(price),
        quantity: '1',
        image: product.images?.[0] || '',
        selectedAttributes: '',
      }],
    }));
    setProductQuery('');
    setProductResults([]);
  };

  const subtotal = draft.items.reduce(
    (sum, item) => sum + numericValue(item.price) * numericValue(item.quantity),
    0,
  );
  const total = Math.max(
    0,
    subtotal - numericValue(draft.couponDiscount) - numericValue(draft.vipDiscount) +
      numericValue(draft.shippingFee) + numericValue(draft.tax),
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const items = draft.items.map(({ key: _key, ...item }) => ({
      ...item,
      price: numericValue(item.price, Number.NaN),
      quantity: numericValue(item.quantity, Number.NaN),
    }));
    if (!items.length || items.some((item) => !item.product || !item.title.trim() || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      toast.error(isPersian ? 'اقلام سفارش یا تعداد و قیمت آن‌ها معتبر نیست.' : 'Check the order items, quantities, and prices.');
      return;
    }
    if (!draft.deliveryAddress.fullName.trim() || !draft.deliveryAddress.phone.trim() || !draft.deliveryAddress.province.trim() || !draft.deliveryAddress.city.trim() || !draft.deliveryAddress.addressDetail.trim()) {
      toast.error(isPersian ? 'نام، تلفن، استان، شهر و نشانی کامل الزامی است.' : 'Recipient, phone, province, city, and full address are required.');
      return;
    }

    const payload: IAdminOrderUpdate = {
      orderNumber: draft.orderNumber.trim(),
      items,
      deliveryAddress: draft.deliveryAddress,
      paymentMethod: draft.paymentMethod,
      shippingFee: numericValue(draft.shippingFee),
      couponDiscount: numericValue(draft.couponDiscount),
      vipDiscount: numericValue(draft.vipDiscount),
      couponCode: draft.couponCode.trim(),
      tax: numericValue(draft.tax),
      status: draft.status,
      shippingMethod: draft.shippingMethod.trim(),
      shippingProvider: draft.shippingProvider.trim(),
      trackingCode: draft.trackingCode.trim(),
      trackingUrl: draft.trackingUrl.trim(),
      createdAt: draft.createdAt ? new Date(draft.createdAt).toISOString() : order.createdAt,
      shippedAt: draft.shippedAt ? new Date(draft.shippedAt).toISOString() : null,
      deliveredAt: draft.deliveredAt ? new Date(draft.deliveredAt).toISOString() : null,
      notes: draft.notes.trim(),
      statusNote: draft.statusNote.trim(),
    };

    setIsSaving(true);
    try {
      const updated = await adminApi.updateOrder(order._id, payload);
      toast.success(isPersian ? 'تمام مشخصات سفارش ذخیره شد.' : 'Order details saved.');
      onSaved(updated as IOrder);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message)
        ? message.join('، ')
        : message || (isPersian ? 'ذخیره مشخصات سفارش انجام نشد.' : 'Could not save order details.'));
    } finally {
      setIsSaving(false);
    }
  };

  const textField = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    options: { type?: string; dir?: 'auto' | 'ltr' | 'rtl'; min?: number; step?: number; placeholder?: string } = {},
  ) => (
    <Input
      label={label}
      labelPlacement="outside-top"
      type={options.type || 'text'}
      dir={options.dir || 'auto'}
      min={options.min}
      step={options.step}
      placeholder={options.placeholder}
      value={value}
      onValueChange={onValueChange}
      variant="bordered"
      radius="lg"
      classNames={inputClassNames}
    />
  );

  const selectField = <T extends string>(
    label: string,
    value: T,
    options: Array<{ value: T; label: string }>,
    onChange: (value: T) => void,
  ) => (
    <label className="block space-y-1.5 text-[11px] font-bold text-brand-text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full rounded-xl border border-brand-border bg-brand-surface px-3 text-xs font-bold text-brand-text outline-none transition-colors hover:border-brand-gold/70 focus:border-brand-gold"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );

  return (
    <form dir={isPersian ? 'rtl' : 'ltr'} onSubmit={submit} className="space-y-6 text-start">
      <section className="space-y-3">
        <h4 className="text-sm font-black text-brand-text">{isPersian ? 'مشخصات اصلی سفارش' : 'Order basics'}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {textField(isPersian ? 'شماره سفارش' : 'Order number', draft.orderNumber, (value) => updateDraft('orderNumber', value), { dir: 'ltr' })}
          {selectField(isPersian ? 'وضعیت سفارش' : 'Order status', draft.status, [
            { value: 'pending', label: isPersian ? 'در انتظار تأیید' : 'Pending' },
            { value: 'processing', label: isPersian ? 'در حال آماده‌سازی' : 'Processing' },
            { value: 'shipped', label: isPersian ? 'ارسال شده' : 'Shipped' },
            { value: 'delivered', label: isPersian ? 'تحویل شده' : 'Delivered' },
            { value: 'cancelled', label: isPersian ? 'لغو شده' : 'Cancelled' },
          ], (value) => updateDraft('status', value))}
          {selectField(isPersian ? 'روش پرداخت' : 'Payment method', draft.paymentMethod, [
            { value: 'online', label: isPersian ? 'پرداخت آنلاین' : 'Online' },
            { value: 'cod', label: isPersian ? 'پرداخت هنگام تحویل' : 'Cash on delivery' },
            { value: 'installment', label: isPersian ? 'پرداخت اقساطی' : 'Installments' },
          ], (value) => updateDraft('paymentMethod', value))}
          {textField(isPersian ? 'تاریخ ثبت سفارش' : 'Order date', draft.createdAt, (value) => updateDraft('createdAt', value), { type: 'datetime-local', dir: 'ltr' })}
          {textField(isPersian ? 'تاریخ ارسال' : 'Shipped at', draft.shippedAt, (value) => updateDraft('shippedAt', value), { type: 'datetime-local', dir: 'ltr' })}
          {textField(isPersian ? 'تاریخ تحویل' : 'Delivered at', draft.deliveredAt, (value) => updateDraft('deliveredAt', value), { type: 'datetime-local', dir: 'ltr' })}
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'یادداشت تغییر وضعیت (در تاریخچه ثبت می‌شود)' : 'Status change note (saved in history)'}
              labelPlacement="outside-top"
              value={draft.statusNote}
              onValueChange={(value) => updateDraft('statusNote', value)}
              minRows={2}
              maxLength={500}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-brand-text">{isPersian ? 'اقلام سفارش' : 'Order items'}</h4>
            <p className="mt-1 text-[11px] text-brand-text-muted">
              {isPersian ? 'قیمت و تعداد، جمع سفارش را خودکار به‌روزرسانی می‌کند.' : 'Item price and quantity recalculate order totals.'}
            </p>
          </div>
          <span className="text-xs font-black text-brand-bronze dark:text-brand-gold">
            {isPersian ? `جمع اقلام: ${formatToman(subtotal, true)}` : `Items: ${formatToman(subtotal, false)}`}
          </span>
        </div>

        <div className="relative">
          <Input
            label={isPersian ? 'افزودن محصول به سفارش' : 'Add product to order'}
            labelPlacement="outside-top"
            value={productQuery}
            onValueChange={setProductQuery}
            placeholder={isPersian ? 'نام محصول را جستجو کنید...' : 'Search products...'}
            startContent={<Search className="h-4 w-4 text-brand-text-muted" />}
            variant="bordered"
            radius="lg"
            classNames={inputClassNames}
          />
          {(productQuery.trim().length >= 2) && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-brand-border bg-brand-surface p-1.5 shadow-xl">
              {isSearchingProducts ? (
                <p className="px-3 py-2 text-xs text-brand-text-muted">{isPersian ? 'در حال جستجو...' : 'Searching...'}</p>
              ) : productResults.length ? productResults.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-xs transition-colors hover:bg-brand-surface-elevated"
                >
                  <span className="min-w-0 truncate font-bold text-brand-text">{isPersian ? product.title : product.titleEn || product.title}</span>
                  <span className="shrink-0 text-[10px] text-brand-text-muted">
                    {isPersian ? `موجودی ${product.stockCount}` : `Stock ${product.stockCount}`}
                  </span>
                </button>
              )) : (
                <p className="px-3 py-2 text-xs text-brand-text-muted">{isPersian ? 'محصولی پیدا نشد.' : 'No products found.'}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {draft.items.map((item) => (
            <div key={item.key} className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface-elevated/30 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[10px] font-mono text-brand-text-muted" dir="ltr">{item.product}</span>
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label={isPersian ? 'حذف قلم از سفارش' : 'Remove order item'}
                  onPress={() => updateDraft('items', draft.items.filter((current) => current.key !== item.key))}
                  className="h-8 w-8 shrink-0 text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {textField(isPersian ? 'نام قلم سفارش' : 'Order item name', item.title, (value) => updateItem(item.key, 'title', value))}
                {textField(isPersian ? 'قیمت واحد (تومان)' : 'Unit price (Toman)', item.price, (value) => updateItem(item.key, 'price', value), { type: 'number', min: 0, step: 1, dir: 'ltr' })}
                {textField(isPersian ? 'تعداد' : 'Quantity', item.quantity, (value) => updateItem(item.key, 'quantity', value), { type: 'number', min: 1, step: 1, dir: 'ltr' })}
                {textField(isPersian ? 'تصویر قلم (نشانی)' : 'Item image URL', item.image, (value) => updateItem(item.key, 'image', value), { dir: 'ltr' })}
                <div className="sm:col-span-2 lg:col-span-4">
                  {textField(isPersian ? 'ویژگی / حجم انتخاب‌شده' : 'Selected attributes / size', item.selectedAttributes, (value) => updateItem(item.key, 'selectedAttributes', value))}
                </div>
              </div>
            </div>
          ))}
          {!draft.items.length && (
            <p className="rounded-xl border border-dashed border-brand-border px-4 py-6 text-center text-xs text-brand-text-muted">
              {isPersian ? 'هنوز قلمی به سفارش اضافه نشده است.' : 'No items have been added.'}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-black text-brand-text">{isPersian ? 'مبالغ و تخفیف‌ها' : 'Amounts and discounts'}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {textField(isPersian ? 'هزینه ارسال (تومان)' : 'Shipping fee (Toman)', draft.shippingFee, (value) => updateDraft('shippingFee', value), { type: 'number', min: 0, step: 1, dir: 'ltr' })}
          {textField(isPersian ? 'کد تخفیف' : 'Coupon code', draft.couponCode, (value) => updateDraft('couponCode', value), { dir: 'ltr' })}
          {textField(isPersian ? 'مبلغ تخفیف کد (تومان)' : 'Coupon discount (Toman)', draft.couponDiscount, (value) => updateDraft('couponDiscount', value), { type: 'number', min: 0, step: 1, dir: 'ltr' })}
          {textField(isPersian ? 'تخفیف VIP (تومان)' : 'VIP discount (Toman)', draft.vipDiscount, (value) => updateDraft('vipDiscount', value), { type: 'number', min: 0, step: 1, dir: 'ltr' })}
          {textField(isPersian ? 'مالیات (تومان)' : 'Tax (Toman)', draft.tax, (value) => updateDraft('tax', value), { type: 'number', min: 0, step: 1, dir: 'ltr' })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3">
          <span className="text-xs font-bold text-brand-text">{isPersian ? 'مبلغ نهایی محاسبه‌شده' : 'Calculated order total'}</span>
          <span className="text-sm font-black text-brand-bronze dark:text-brand-gold">{formatToman(total, isPersian)}</span>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-black text-brand-text">{isPersian ? 'نشانی تحویل سفارش' : 'Delivery address'}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {textField(isPersian ? 'نام تحویل‌گیرنده' : 'Recipient name', draft.deliveryAddress.fullName, (value) => updateAddress('fullName', value))}
          {textField(isPersian ? 'تلفن' : 'Phone', draft.deliveryAddress.phone, (value) => updateAddress('phone', value), { dir: 'ltr' })}
          {textField(isPersian ? 'ایمیل' : 'Email', draft.deliveryAddress.email || '', (value) => updateAddress('email', value), { dir: 'ltr' })}
          {textField(isPersian ? 'استان' : 'Province', draft.deliveryAddress.province, (value) => updateAddress('province', value))}
          {textField(isPersian ? 'شهر' : 'City', draft.deliveryAddress.city, (value) => updateAddress('city', value))}
          {textField(isPersian ? 'کد پستی' : 'Postal code', draft.deliveryAddress.postalCode || '', (value) => updateAddress('postalCode', value), { dir: 'ltr' })}
          {textField(isPersian ? 'پلاک' : 'Building number', draft.deliveryAddress.buildingNumber || '', (value) => updateAddress('buildingNumber', value))}
          {textField(isPersian ? 'واحد' : 'Unit', draft.deliveryAddress.unit || '', (value) => updateAddress('unit', value))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'نشانی دقیق' : 'Full address'}
              labelPlacement="outside-top"
              value={draft.deliveryAddress.addressDetail}
              onValueChange={(value) => updateAddress('addressDetail', value)}
              minRows={2}
              maxLength={1000}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'توضیحات نشانی' : 'Address notes'}
              labelPlacement="outside-top"
              value={draft.deliveryAddress.description || ''}
              onValueChange={(value) => updateAddress('description', value)}
              minRows={2}
              maxLength={500}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-black text-brand-text">{isPersian ? 'روش و اطلاعات ارسال' : 'Shipping details'}</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {textField(isPersian ? 'روش ارسال' : 'Shipping method', draft.shippingMethod, (value) => updateDraft('shippingMethod', value))}
          {textField(isPersian ? 'شرکت حمل' : 'Shipping carrier', draft.shippingProvider, (value) => updateDraft('shippingProvider', value))}
          {textField(isPersian ? 'کد رهگیری' : 'Tracking code', draft.trackingCode, (value) => updateDraft('trackingCode', value), { dir: 'ltr' })}
          <div className="sm:col-span-2 lg:col-span-3">
            {textField(isPersian ? 'لینک پیگیری' : 'Tracking URL', draft.trackingUrl, (value) => updateDraft('trackingUrl', value), { dir: 'ltr', type: 'url' })}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'یادداشت سفارش' : 'Order notes'}
              labelPlacement="outside-top"
              value={draft.notes}
              onValueChange={(value) => updateDraft('notes', value)}
              minRows={2}
              maxLength={1000}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-4">
        <Button type="button" variant="flat" onPress={onCancel} startContent={<X className="h-4 w-4" />} className="h-10 rounded-xl bg-brand-surface-elevated px-4 text-xs font-bold text-brand-text">
          {isPersian ? 'انصراف' : 'Cancel'}
        </Button>
        <Button type="submit" isLoading={isSaving} startContent={!isSaving && <Check className="h-4 w-4" />} className="h-10 rounded-xl bg-brand-gold px-5 text-xs font-black text-[#141914]">
          {isPersian ? 'ذخیره همه تغییرات' : 'Save all changes'}
        </Button>
      </div>
    </form>
  );
}
