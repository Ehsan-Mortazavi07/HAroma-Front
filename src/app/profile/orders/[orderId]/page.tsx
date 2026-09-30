'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Skeleton } from '@heroui/react';
import { ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react';
import { IOrder } from '@/common/interfaces';
import axiosInstance from '@/common/axiosInstance';
import { PATHS } from '@/common/constants/PATHS';
import { OrderDetailsPanel } from '@/components/common/OrderDetailsPanel';
import { useTranslation } from '@/common/i18n';
import { toPersianDigits } from '@/common/utils';

export default function ProfileOrderDetailsRoute() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { isPersian } = useTranslation();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    axiosInstance
      .get<IOrder>(`/orders/my/${encodeURIComponent(orderId)}`)
      .then(({ data }) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        if (active) {
          setOrder(null);
          setNotFound(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const goToOrders = () => router.push(`${PATHS.PROFILE}#orders`);

  return (
    <main dir={isPersian ? 'rtl' : 'ltr'} className="min-h-[70vh] bg-brand-background px-4 py-8 text-start sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button
          variant="flat"
          onPress={goToOrders}
          startContent={isPersian ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          className="h-10 rounded-xl border border-brand-border bg-brand-surface px-4 text-xs font-bold text-brand-text"
        >
          {isPersian ? 'بازگشت به سفارش‌ها' : 'Back to orders'}
        </Button>

        {loading ? (
          <Card className="space-y-5 rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-8">
            <Skeleton className="h-8 w-56 rounded-xl bg-brand-surface-elevated" />
            <Skeleton className="h-24 w-full rounded-2xl bg-brand-surface-elevated" />
            <Skeleton className="h-64 w-full rounded-2xl bg-brand-surface-elevated" />
          </Card>
        ) : notFound || !order ? (
          <Card className="flex flex-col items-center gap-4 rounded-3xl border border-brand-border bg-brand-surface px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold">
              <PackageSearch className="h-7 w-7" />
            </span>
            <div className="space-y-1">
              <h1 className="text-lg font-black text-brand-text">
                {isPersian ? 'سفارش پیدا نشد' : 'Order not found'}
              </h1>
              <p className="max-w-md text-sm leading-6 text-brand-text-muted">
                {isPersian
                  ? 'این سفارش وجود ندارد یا به حساب کاربری شما تعلق ندارد.'
                  : 'This order does not exist or does not belong to your account.'}
              </p>
            </div>
            <Button
              onPress={goToOrders}
              className="h-10 rounded-xl bg-brand-gold px-5 text-xs font-black text-[#141914]"
            >
              {isPersian ? 'رفتن به سفارش‌های من' : 'View my orders'}
            </Button>
          </Card>
        ) : (
          <>
            <Card className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-xs sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-brand-text-muted">
                    {isPersian ? 'جزئیات سفارش' : 'Order details'}
                  </p>
                  <h1 className="mt-1 text-xl font-black text-brand-text sm:text-2xl">
                    {isPersian
                      ? `سفارش ${toPersianDigits(order.orderNumber)}`
                      : `Order ${order.orderNumber}`}
                  </h1>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-surface-elevated px-3 py-2 text-xs font-bold text-brand-text-muted">
                  {isPersian
                    ? `${toPersianDigits(order.items?.length || 0)} قلم کالا`
                    : `${order.items?.length || 0} items`}
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-brand-border bg-brand-surface p-5 shadow-xs sm:p-7">
              <OrderDetailsPanel order={order} isPersian={isPersian} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
