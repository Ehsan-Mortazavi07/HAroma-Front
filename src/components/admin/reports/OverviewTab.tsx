'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Clock,
  Eye,
  MousePointerClick,
  Package,
  Radio,
  Receipt,
  ShoppingBag,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { reportsApi, type ReportRangeParams } from '@/common/api/reports';
import { PATHS } from '@/common/constants/PATHS';
import { TrendChart, VIZ, Legend } from './charts';
import { DataTable, ErrorState, KpiTile, LoadingGrid, Panel } from './ui';
import { useReport } from './useReport';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  PERIOD_LABELS,
  digits,
  formatBucketLabel,
  formatCompact,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatNumber,
  formatPercent,
  label,
} from './format';

export interface TabProps {
  params: ReportRangeParams;
  isPersian: boolean;
  isAdmin: boolean;
  refreshKey: number;
  onOpenVisitor: (key: string) => void;
  onOpenProduct: (id: string) => void;
}

export function LiveStrip({ live, isPersian }: { live: { visitors: number; loggedIn: number; mobile: number; pages: { path: string; visitors: number }[] }; isPersian: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <div>
          <div className="text-sm font-black text-brand-text">
            {isPersian
              ? `${digits(live.visitors, true)} بازدیدکننده آنلاین`
              : `${live.visitors} visitor${live.visitors === 1 ? '' : 's'} online now`}
          </div>
          <div className="text-[11px] font-semibold text-brand-text-muted">
            {isPersian
              ? `${digits(live.loggedIn, true)} کاربر وارد شده · ${digits(live.mobile, true)} موبایل/تبلت · ۵ دقیقه اخیر`
              : `${live.loggedIn} signed in · ${live.mobile} mobile/tablet · last 5 minutes`}
          </div>
        </div>
      </div>
      {live.pages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {live.pages.map((page) => (
            <span key={page.path} className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-2.5 py-1 text-[10px] font-bold text-brand-text" dir="ltr">
              <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {decodeURIComponent(page.path)}
              <span className="text-brand-text-muted">×{page.visitors}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function OverviewTab({ params, isPersian, isAdmin, refreshKey }: TabProps) {
  const { data, loading, error, reload } = useReport(
    () => reportsApi.overview(params),
    [params.from, params.to, params.granularity, refreshKey],
    isPersian,
  );

  if (loading && !data) return <LoadingGrid tiles={12} />;
  if (error && !data) {
    return <ErrorState message={error} onRetry={reload} retryLabel={isPersian ? 'تلاش دوباره' : 'Retry'} />;
  }
  if (!data) return null;

  const k = data.kpis;
  const granularity = params.granularity || 'day';
  const xLabels = data.series.map((point) => formatBucketLabel(String(point.label), granularity, isPersian));
  const n = (value: number) => formatNumber(value, isPersian);
  const money = (value: number) => formatMoney(value, isPersian);

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <LiveStrip live={data.live} isPersian={isPersian} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {k.revenue && (
          <KpiTile
            emphasis
            isPersian={isPersian}
            icon={Wallet}
            label={isPersian ? 'درآمد کل (فروش + اشتراک)' : 'Total income'}
            value={money(k.revenue.value)}
            current={k.revenue.value}
            previous={k.revenue.previous}
          />
        )}
        <KpiTile isPersian={isPersian} icon={ShoppingBag} label={isPersian ? 'سفارش‌های معتبر' : 'Valid orders'} value={n(k.orders!.value)} current={k.orders!.value} previous={k.orders!.previous} />
        {k.aov && (
          <KpiTile isPersian={isPersian} icon={Receipt} label={isPersian ? 'میانگین مبلغ سفارش' : 'Average order value'} value={money(k.aov.value)} current={k.aov.value} previous={k.aov.previous} />
        )}
        <KpiTile isPersian={isPersian} icon={Package} label={isPersian ? 'اقلام فروخته‌شده' : 'Items sold'} value={n(k.itemsSold!.value)} current={k.itemsSold!.value} previous={k.itemsSold!.previous} />
        <KpiTile isPersian={isPersian} icon={Users} label={isPersian ? 'بازدیدکنندگان یکتا' : 'Unique visitors'} value={n(k.visitors!.value)} current={k.visitors!.value} previous={k.visitors!.previous} />
        <KpiTile isPersian={isPersian} icon={Activity} label={isPersian ? 'جلسات بازدید' : 'Sessions'} value={n(k.sessions!.value)} current={k.sessions!.value} previous={k.sessions!.previous} />
        <KpiTile isPersian={isPersian} icon={Eye} label={isPersian ? 'بازدید صفحات' : 'Page views'} value={n(k.pageViews!.value)} current={k.pageViews!.value} previous={k.pageViews!.previous} />
        <KpiTile isPersian={isPersian} icon={Timer} label={isPersian ? 'میانگین مدت ماندن' : 'Avg. time on site'} value={formatDuration(k.avgSessionDuration!.value, isPersian)} current={k.avgSessionDuration!.value} previous={k.avgSessionDuration!.previous} />
        <KpiTile isPersian={isPersian} icon={MousePointerClick} label={isPersian ? 'نرخ تبدیل (جلسه‌های منجر به خرید)' : 'Conversion rate (sessions)'} value={formatPercent(k.conversionRate!.value, isPersian)} current={k.conversionRate!.value} previous={k.conversionRate!.previous} />
        <KpiTile isPersian={isPersian} lowerIsBetter icon={TrendingUp} label={isPersian ? 'نرخ پرش' : 'Bounce rate'} value={formatPercent(k.bounceRate!.value, isPersian)} current={k.bounceRate!.value} previous={k.bounceRate!.previous} />
        <KpiTile isPersian={isPersian} icon={UserPlus} label={isPersian ? 'مشتریان جدید' : 'New customers'} value={n(k.newCustomers!.value)} hint={isPersian ? 'اولین خرید در این بازه' : 'first purchase in range'} />
        <KpiTile isPersian={isPersian} icon={Users} label={isPersian ? 'خریداران' : 'Buyers'} value={n(k.buyers!.value)} current={k.buyers!.value} previous={k.buyers!.previous} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {isAdmin && (
          <Panel title={isPersian ? 'روند درآمد' : 'Income trend'} subtitle={isPersian ? 'فروش خالص سفارش‌های معتبر در هر بازه' : 'Net sales of valid orders per period'} icon={Wallet}>
            <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'}
              ariaLabel={isPersian ? 'نمودار درآمد' : 'Revenue chart'}
              data={data.series}
              xLabels={xLabels}
              series={[{ key: 'revenue', name: isPersian ? 'درآمد' : 'Revenue', color: VIZ[0] }]}
              format={money}
              axisFormat={(value) => formatCompact(value, isPersian)}
            />
          </Panel>
        )}
        <Panel title={isPersian ? 'روند بازدید' : 'Traffic trend'} subtitle={isPersian ? 'بازدیدکننده یکتا و جلسات' : 'Unique visitors and sessions'} icon={Activity}>
          <div className="mb-3">
            <Legend
              series={[
                { key: 'visitors', name: isPersian ? 'بازدیدکننده' : 'Visitors', color: VIZ[0] },
                { key: 'sessions', name: isPersian ? 'جلسه' : 'Sessions', color: VIZ[1] },
              ]}
            />
          </div>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'}
            kind="line"
            ariaLabel={isPersian ? 'نمودار بازدید' : 'Traffic chart'}
            data={data.series}
            xLabels={xLabels}
            series={[
              { key: 'visitors', name: isPersian ? 'بازدیدکننده' : 'Visitors', color: VIZ[0] },
              { key: 'sessions', name: isPersian ? 'جلسه' : 'Sessions', color: VIZ[1] },
            ]}
            format={n}
            axisFormat={(value) => formatCompact(value, isPersian)}
          />
        </Panel>
        <Panel title={isPersian ? 'تعداد سفارش' : 'Orders'} icon={ShoppingBag} className="xl:col-span-2">
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'}
            kind="bar"
            ariaLabel={isPersian ? 'نمودار سفارش' : 'Orders chart'}
            data={data.series}
            xLabels={xLabels}
            series={[{ key: 'orders', name: isPersian ? 'سفارش' : 'Orders', color: VIZ[0] }]}
            format={n}
            axisFormat={(value) => formatCompact(value, isPersian)}
            height={200}
          />
        </Panel>
        {isAdmin && data.periods && (
          <Panel className="xl:col-span-2" title={isPersian ? 'خلاصه دوره‌های تقویمی' : 'Calendar periods'} subtitle={isPersian ? 'مستقل از بازه انتخاب‌شده، بر اساس تقویم شمسی' : 'Independent of the selected range, Jalali calendar'} icon={Clock}>
            <DataTable
              isPersian={isPersian}
              rows={data.periods}
              rowKey={(row) => row.key}
              empty="—"
              csvName="period-summary"
              columns={[
                { key: 'period', header: isPersian ? 'دوره' : 'Period', render: (row) => label(PERIOD_LABELS, row.key, isPersian), value: (row) => label(PERIOD_LABELS, row.key, isPersian), sortable: false },
                { key: 'orders', header: isPersian ? 'سفارش' : 'Orders', align: 'end', render: (row) => n(row.orders), value: (row) => row.orders },
                { key: 'net', header: isPersian ? 'فروش خالص' : 'Net sales', align: 'end', render: (row) => money(row.net), value: (row) => row.net },
                { key: 'subs', header: isPersian ? 'اشتراک VIP' : 'VIP subs', align: 'end', render: (row) => money(row.subscriptionRevenue), value: (row) => row.subscriptionRevenue },
                { key: 'income', header: isPersian ? 'درآمد کل' : 'Income', align: 'end', render: (row) => <span className="font-black">{money(row.income)}</span>, value: (row) => row.income },
              ]}
            />
          </Panel>
        )}
      </div>

      <Panel
        title={isPersian ? 'آخرین سفارش‌ها' : 'Latest orders'}
        icon={Receipt}
        actions={
          <Link href={PATHS.ADMIN_ORDERS} className="text-xs font-bold text-brand-bronze hover:underline dark:text-brand-gold">
            {isPersian ? 'همه سفارش‌ها' : 'All orders'}
          </Link>
        }
      >
        <DataTable
          isPersian={isPersian}
          rows={data.recentOrders}
          rowKey={(row) => row._id}
          empty={isPersian ? 'هنوز سفارشی ثبت نشده است.' : 'No orders yet.'}
          columns={[
            { key: 'number', header: isPersian ? 'شماره' : 'Number', render: (row) => <span className="font-black text-brand-bronze dark:text-brand-gold">{digits(row.orderNumber, isPersian)}</span> },
            { key: 'customer', header: isPersian ? 'مشتری' : 'Customer', render: (row) => row.customer || '—' },
            { key: 'items', header: isPersian ? 'اقلام' : 'Items', align: 'end', render: (row) => n(row.items) },
            ...(isAdmin ? [{ key: 'total', header: isPersian ? 'مبلغ' : 'Total', align: 'end' as const, render: (row: (typeof data.recentOrders)[number]) => money(row.total || 0) }] : []),
            { key: 'payment', header: isPersian ? 'پرداخت' : 'Payment', render: (row) => label(PAYMENT_LABELS, row.paymentMethod, isPersian) },
            { key: 'status', header: isPersian ? 'وضعیت' : 'Status', render: (row) => label(ORDER_STATUS_LABELS, row.status, isPersian) },
            { key: 'date', header: isPersian ? 'زمان' : 'Date', render: (row) => formatDateTime(row.createdAt, isPersian) },
          ]}
        />
      </Panel>
    </div>
  );
}
