'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, CreditCard, ExternalLink, MapPin, Package, Truck } from 'lucide-react';
import { IOrder } from '@/common/interfaces';
import { PATHS } from '@/common/constants/PATHS';
import { resolveMediaUrl } from '@/common/constants/URL';
import { formatToman, toPersianDigits } from '@/common/utils';

interface OrderDetailsPanelProps {
  order: IOrder;
  isPersian: boolean;
}

const statusLabels: Record<IOrder['status'], { fa: string; en: string }> = {
  pending: { fa: 'در انتظار تأیید', en: 'Pending' },
  processing: { fa: 'در حال آماده‌سازی', en: 'Processing' },
  shipped: { fa: 'ارسال شده', en: 'Shipped' },
  delivered: { fa: 'تحویل شده', en: 'Delivered' },
  cancelled: { fa: 'لغو شده', en: 'Cancelled' },
};

const safeHttpUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

function OrderItemImage({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = React.useState(false);
  const imageUrl = src ? resolveMediaUrl(src) : '';

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface-elevated">
      {imageUrl && !hasError ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="56px"
          unoptimized
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-brand-text-muted" aria-hidden="true">
          <Package className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

export function OrderDetailsPanel({ order, isPersian }: OrderDetailsPanelProps) {
  const address = order.deliveryAddress;
  const unknown = isPersian ? 'ثبت نشده' : 'Not recorded';
  const dateTime = (value?: string | null) => {
    if (!value) return unknown;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return unknown;
    return new Intl.DateTimeFormat(isPersian ? 'fa-IR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: isPersian ? 'Asia/Tehran' : 'UTC',
    }).format(date);
  };
  const paymentLabel = {
    online: isPersian ? 'پرداخت آنلاین' : 'Online payment',
    cod: isPersian ? 'پرداخت هنگام تحویل' : 'Cash on delivery',
    installment: isPersian ? 'پرداخت اقساطی' : 'Installment payment',
  }[order.paymentMethod];
  const shippingLabel = !order.shippingMethod || order.shippingMethod === 'standard'
    ? (isPersian ? 'ارسال استاندارد' : 'Standard shipping')
    : order.shippingMethod;
  const trackingUrl = safeHttpUrl(order.trackingUrl);
  const history = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <h4 className="flex items-center gap-2 text-sm font-black text-brand-text">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-border bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h4>
  );

  const Detail = ({ label, value, dir }: { label: string; value?: React.ReactNode; dir?: 'ltr' | 'rtl' }) => (
    <div className="min-w-0 rounded-xl border border-brand-border/70 bg-brand-surface-elevated/50 px-3.5 py-3">
      <div className="mb-1 text-[11px] font-bold text-brand-text-muted">{label}</div>
      <div dir={dir} className="break-words text-xs font-bold leading-6 text-brand-text">
        {value || unknown}
      </div>
    </div>
  );

  return (
    <div dir={isPersian ? 'rtl' : 'ltr'} className="space-y-5 text-start">
      <section className="space-y-3">
        <SectionTitle icon={Package}>{isPersian ? 'اقلام سفارش' : 'Order items'}</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
          <div className="hidden grid-cols-[minmax(0,1fr)_5rem_9rem_9rem] gap-3 border-b border-brand-border bg-brand-surface-elevated/60 px-4 py-2.5 text-[11px] font-black text-brand-text-muted sm:grid">
            <span>{isPersian ? 'محصول' : 'Product'}</span>
            <span className="text-center">{isPersian ? 'تعداد' : 'Qty'}</span>
            <span className="text-end">{isPersian ? 'قیمت هر واحد' : 'Unit price'}</span>
            <span className="text-end">{isPersian ? 'جمع ردیف' : 'Line total'}</span>
          </div>
          <div className="divide-y divide-brand-border/70">
            {(order.items || []).map((item, index) => (
              <div key={`${item.product}-${index}`} className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_5rem_9rem_9rem] sm:items-center">
                <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <OrderItemImage src={item.image} alt={item.title} />
                  <div className="min-w-0">
                    <Link
                      href={PATHS.PRODUCT(item.product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-xs font-black text-brand-text underline-offset-4 transition-colors hover:text-brand-bronze hover:underline dark:hover:text-brand-gold"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-0.5 text-[10px] font-medium text-brand-text-muted">
                      {isPersian ? 'مشاهدهٔ اطلاعات و موجودی فعلی محصول' : 'View current product details and stock'}
                    </div>
                    {(item.selectedAttributes || item.selectedVariant?.title) && (
                      <div className="mt-1 text-[11px] text-brand-text-muted">
                        {item.selectedAttributes || (isPersian ? item.selectedVariant?.title : item.selectedVariant?.titleEn || item.selectedVariant?.title)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs font-bold text-brand-text-muted sm:text-center">
                  <span className="sm:hidden">{isPersian ? 'تعداد: ' : 'Qty: '}</span>
                  {isPersian ? toPersianDigits(item.quantity) : item.quantity}
                </div>
                <div className="text-xs font-bold text-brand-text-muted sm:text-end">
                  <span className="sm:hidden">{isPersian ? 'واحد: ' : 'Unit: '}</span>
                  {formatToman(item.price, isPersian)}
                </div>
                <div className="col-span-2 text-xs font-black text-brand-bronze dark:text-brand-gold sm:col-span-1 sm:text-end">
                  <span className="sm:hidden">{isPersian ? 'جمع: ' : 'Total: '}</span>
                  {formatToman(item.price * item.quantity, isPersian)}
                </div>
              </div>
            ))}
            {order.items?.length ? null : (
              <div className="px-4 py-6 text-center text-xs text-brand-text-muted">
                {isPersian ? 'اقلام سفارش در دسترس نیست.' : 'Order items are unavailable.'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle icon={Calendar}>{isPersian ? 'زمان‌بندی و وضعیت سفارش' : 'Order timeline'}</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          <Detail label={isPersian ? 'تاریخ ثبت سفارش' : 'Order placed'} value={dateTime(order.createdAt)} />
          <Detail label={isPersian ? 'تاریخ ارسال' : 'Shipped at'} value={dateTime(order.shippedAt)} />
          <Detail label={isPersian ? 'تاریخ تحویل به مشتری' : 'Delivered at'} value={dateTime(order.deliveredAt)} />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border/70 bg-brand-surface-elevated/50 px-3.5 py-3 text-xs">
          <span className="font-bold text-brand-text-muted">{isPersian ? 'وضعیت فعلی:' : 'Current status:'}</span>
          <span className="rounded-full border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1 font-black text-brand-bronze dark:text-brand-gold">
            {statusLabels[order.status]?.[isPersian ? 'fa' : 'en'] || order.status}
          </span>
        </div>
        {history.length > 0 && (
          <ol className="space-y-2 rounded-xl border border-brand-border/70 bg-brand-surface-elevated/30 p-3">
            {history.map((entry, index) => (
              <li key={`${entry.status}-${entry.changedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-brand-text">
                  {statusLabels[entry.status]?.[isPersian ? 'fa' : 'en'] || entry.status}
                  {entry.note ? <span className="font-normal text-brand-text-muted"> — {entry.note}</span> : null}
                </span>
                <time className="text-brand-text-muted">{dateTime(entry.changedAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle icon={CreditCard}>{isPersian ? 'پرداخت و ریز مبالغ' : 'Payment and totals'}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <Detail label={isPersian ? 'روش پرداخت' : 'Payment method'} value={paymentLabel} />
            <Detail label={isPersian ? 'مبلغ اقلام' : 'Items subtotal'} value={formatToman(order.subtotal, isPersian)} />
            <Detail label={isPersian ? 'هزینه ارسال' : 'Shipping fee'} value={formatToman(order.shippingFee, isPersian)} />
            <Detail label={isPersian ? 'مالیات' : 'Tax'} value={formatToman(order.tax, isPersian)} />
            {(order.couponDiscount > 0 || order.couponCode) && (
              <Detail
                label={isPersian ? 'کد تخفیف و مبلغ آن' : 'Coupon and discount'}
                value={<>{order.couponCode ? <span dir="ltr" className="me-2 font-mono">{order.couponCode}</span> : null}{formatToman(order.couponDiscount, isPersian)}</>}
              />
            )}
            {order.vipDiscount > 0 && (
              <Detail label={isPersian ? 'تخفیف باشگاه مشتریان' : 'VIP discount'} value={formatToman(order.vipDiscount, isPersian)} />
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3">
            <span className="text-xs font-black text-brand-text">{isPersian ? 'مبلغ نهایی سفارش' : 'Order total'}</span>
            <span className="text-sm font-black text-brand-bronze dark:text-brand-gold">{formatToman(order.total, isPersian)}</span>
          </div>
          <p className="text-[11px] leading-5 text-brand-text-muted">
            {isPersian
              ? 'وضعیت تسویه و شناسه تراکنش بانکی در سامانه سفارش ذخیره نمی‌شود.'
              : 'Settlement status and bank transaction reference are not stored in the order system.'}
          </p>
        </section>

        <section className="space-y-3">
          <SectionTitle icon={Truck}>{isPersian ? 'ارسال و پیگیری' : 'Shipping and tracking'}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <Detail label={isPersian ? 'روش ارسال' : 'Shipping method'} value={shippingLabel} />
            <Detail label={isPersian ? 'شرکت حمل' : 'Carrier'} value={order.shippingProvider} />
            <Detail label={isPersian ? 'کد رهگیری' : 'Tracking code'} value={order.trackingCode} dir="ltr" />
            {trackingUrl && (
              <Detail
                label={isPersian ? 'پیگیری مرسوله' : 'Track shipment'}
                value={
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-bronze underline underline-offset-2 dark:text-brand-gold">
                    {isPersian ? 'باز کردن صفحه رهگیری' : 'Open tracking page'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                }
              />
            )}
          </div>
        </section>
      </div>

      {address && (
        <section className="space-y-3">
          <SectionTitle icon={MapPin}>{isPersian ? 'نشانی تحویل ثبت‌شده برای این سفارش' : 'Delivery address saved with this order'}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <Detail label={isPersian ? 'تحویل‌گیرنده' : 'Recipient'} value={address.fullName} />
            <Detail label={isPersian ? 'تلفن تماس' : 'Phone'} value={address.phone} dir="ltr" />
            <Detail label={isPersian ? 'ایمیل' : 'Email'} value={address.email} dir="ltr" />
            <Detail label={isPersian ? 'استان و شهر' : 'Province and city'} value={`${address.province}، ${address.city}`} />
            <Detail label={isPersian ? 'کد پستی' : 'Postal code'} value={address.postalCode} dir="ltr" />
            <Detail label={isPersian ? 'ساختمان و واحد' : 'Building and unit'} value={[address.buildingNumber, address.unit].filter(Boolean).join(isPersian ? '، واحد ' : ', unit ')} />
            <div className="sm:col-span-2">
              <Detail label={isPersian ? 'نشانی کامل' : 'Full address'} value={address.addressDetail} />
            </div>
            {address.description && (
              <div className="sm:col-span-2">
                <Detail label={isPersian ? 'توضیحات نشانی' : 'Address notes'} value={address.description} />
              </div>
            )}
          </div>
        </section>
      )}

      {order.notes && (
        <section className="space-y-2">
          <h4 className="text-xs font-black text-brand-text">{isPersian ? 'یادداشت سفارش' : 'Order notes'}</h4>
          <p className="rounded-xl border border-brand-border/70 bg-brand-surface-elevated/50 px-3.5 py-3 text-xs leading-6 text-brand-text">{order.notes}</p>
        </section>
      )}
    </div>
  );
}

export default OrderDetailsPanel;
