'use client';

import React from 'react';
import {
  AlertTriangle,
  Banknote,
  BadgePercent,
  Boxes,
  CircleSlash,
  Crown,
  Landmark,
  MapPin,
  Package,
  PieChart,
  Receipt,
  ScrollText,
  Tag,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { reportsApi } from '@/common/api/reports';
import { BarList, DonutChart, Legend, TrendChart, VIZ } from './charts';
import { DataTable, ErrorState, KpiTile, LoadingGrid, Note, Panel, ValuePair } from './ui';
import { useReport } from './useReport';
import type { TabProps } from './OverviewTab';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  PERIOD_LABELS,
  digits,
  formatBucketLabel,
  formatCompact,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  label,
} from './format';

const STATUS_ORDER = ['delivered', 'shipped', 'processing', 'pending', 'cancelled'];

export function FinanceTab({ params, isPersian, refreshKey, onOpenVisitor, onOpenProduct }: TabProps) {
  const { data, loading, error, reload } = useReport(
    () => reportsApi.finance(params),
    [params.from, params.to, params.granularity, refreshKey],
    isPersian,
  );

  if (loading && !data) return <LoadingGrid tiles={12} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} retryLabel={isPersian ? 'تلاش دوباره' : 'Retry'} />;
  if (!data) return null;

  const s = data.summary;
  const p = data.previous;
  const granularity = params.granularity || 'day';
  const xLabels = data.series.map((point) => formatBucketLabel(String(point.label), granularity, isPersian));
  const money = (value: number) => formatMoney(value, isPersian);
  const compact = (value: number) => formatCompact(value, isPersian);
  const n = (value: number) => formatNumber(value, isPersian);
  const tr = (fa: string, en: string) => (isPersian ? fa : en);

  const incomeSeries = [
    { key: 'net', name: tr('فروش خالص', 'Net sales'), color: VIZ[0] },
    { key: 'subscriptions', name: tr('اشتراک VIP', 'VIP subscriptions'), color: VIZ[1] },
  ];
  const grossSeries = [
    { key: 'gross', name: tr('فروش ناخالص', 'Gross sales'), color: VIZ[0] },
    { key: 'discounts', name: tr('تخفیف‌ها', 'Discounts'), color: VIZ[3] },
    { key: 'cancelled', name: tr('لغو شده', 'Cancelled'), color: VIZ[4] },
  ];

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile emphasis isPersian={isPersian} icon={Wallet} label={tr('درآمد کل بازه', 'Total income')} value={money(s.income)} current={s.income} previous={p.income} />
        <KpiTile isPersian={isPersian} icon={Banknote} label={tr('فروش خالص (پس از تخفیف)', 'Net sales')} value={money(s.net)} current={s.net} previous={p.net} />
        <KpiTile isPersian={isPersian} icon={Receipt} label={tr('فروش ناخالص کالا', 'Gross merchandise')} value={money(s.gross)} current={s.gross} previous={p.gross} />
        <KpiTile isPersian={isPersian} icon={Crown} label={tr('درآمد اشتراک VIP', 'VIP subscriptions')} value={money(s.subscriptionRevenue)} current={s.subscriptionRevenue} previous={p.subscriptionRevenue} hint={tr(`${digits(s.subscriptions, true)} اشتراک`, `${s.subscriptions} subs`)} />
        <KpiTile isPersian={isPersian} lowerIsBetter icon={BadgePercent} label={tr('کل تخفیف‌ها', 'Total discounts')} value={money(s.discounts)} current={s.discounts} previous={p.discounts} hint={tr(`${formatPercent(s.discountRate, true)} از ناخالص`, `${formatPercent(s.discountRate, false)} of gross`)} />
        <KpiTile isPersian={isPersian} icon={Truck} label={tr('هزینه ارسال دریافتی', 'Shipping collected')} value={money(s.shipping)} current={s.shipping} previous={p.shipping} />
        <KpiTile isPersian={isPersian} icon={Landmark} label={tr('مالیات', 'Tax')} value={money(s.tax)} current={s.tax} previous={p.tax} />
        <KpiTile isPersian={isPersian} icon={Receipt} label={tr('میانگین مبلغ سفارش', 'Average order value')} value={money(s.aov)} current={s.aov} previous={p.aov} />
        <KpiTile isPersian={isPersian} icon={Package} label={tr('سفارش / اقلام', 'Orders / items')} value={<ValuePair items={[{ value: n(s.orders), label: tr('سفارش', 'orders') }, { value: n(s.itemsSold), label: tr('قلم', 'items') }]} />} current={s.orders} previous={p.orders} />
        <KpiTile isPersian={isPersian} lowerIsBetter icon={CircleSlash} label={tr('سفارش‌های لغو شده', 'Cancelled orders')} value={money(s.cancelledAmount)} hint={tr(`${digits(s.cancelledOrders, true)} سفارش · نرخ ${formatPercent(s.cancellationRate, true)}`, `${s.cancelledOrders} orders · ${formatPercent(s.cancellationRate, false)}`)} />
        <KpiTile isPersian={isPersian} icon={Users} label={tr('مشتری جدید / بازگشتی', 'New / returning buyers')} value={<ValuePair items={[{ value: n(s.newCustomers), label: tr('جدید', 'new') }, { value: n(s.returningCustomers), label: tr('بازگشتی', 'returning') }]} />} />
        <KpiTile
          isPersian={isPersian}
          icon={ScrollText}
          label={s.avgDailyIncome !== null ? tr('میانگین درآمد روزانه', 'Avg. daily income') : tr('بهترین دوره', 'Best period')}
          value={s.avgDailyIncome !== null ? money(s.avgDailyIncome) : s.bestPeriod ? formatBucketLabel(s.bestPeriod.label, granularity, isPersian) : '—'}
          hint={s.bestPeriod && s.avgDailyIncome !== null ? tr(`رکورد: ${digits(s.bestPeriod.label, true)}`, `best: ${s.bestPeriod.label}`) : undefined}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: tr('تحقق‌یافته (تحویل شده)', 'Realized (delivered)'), value: s.deliveredRevenue, tone: 'text-emerald-700 dark:text-emerald-400' },
          { label: tr('در جریان (ثبت تا ارسال)', 'In pipeline'), value: s.inProgressRevenue, tone: 'text-amber-700 dark:text-amber-400' },
          { label: tr('مطالبات پرداخت در محل', 'Outstanding COD'), value: s.codOutstanding, tone: 'text-rose-700 dark:text-rose-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-brand-border bg-brand-surface p-4">
            <div className="text-[11px] font-bold text-brand-text-muted">{item.label}</div>
            <div className={`mt-1 text-lg font-black ${item.tone}`}>{money(item.value)}</div>
          </div>
        ))}
      </div>

      <Panel title={tr('ترکیب درآمد', 'Income composition')} subtitle={tr('فروش خالص + درآمد اشتراک در هر بازه', 'Net sales + subscription income per period')} icon={Wallet}>
        <div className="mb-3">
          <Legend series={incomeSeries} />
        </div>
        <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار درآمد', 'Income chart')} kind="bar" stacked data={data.series} xLabels={xLabels} series={incomeSeries} format={money} axisFormat={compact} height={260} />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={tr('ناخالص، تخفیف و لغو', 'Gross, discounts & cancellations')} icon={BadgePercent}>
          <div className="mb-3">
            <Legend series={grossSeries} />
          </div>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار فروش ناخالص', 'Gross chart')} kind="line" data={data.series} xLabels={xLabels} series={grossSeries} format={money} axisFormat={compact} />
        </Panel>
        <Panel title={tr('تعداد سفارش معتبر', 'Valid orders')} icon={Receipt}>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار سفارش', 'Orders chart')} kind="bar" data={data.series} xLabels={xLabels} series={[{ key: 'orders', name: tr('سفارش', 'Orders'), color: VIZ[0] }]} format={n} axisFormat={compact} />
        </Panel>
      </div>

      <Panel title={tr('دفتر درآمد (ریز دوره‌ای)', 'Income ledger')} subtitle={tr('همان اعداد نمودارها به‌صورت جدول؛ برای حسابدار قابل خروجی است', 'The chart figures as a table, exportable for accounting')} icon={ScrollText}>
        <DataTable
          isPersian={isPersian}
          rows={[...data.series].reverse()}
          rowKey={(row) => String(row.key)}
          csvName={`income-ledger-${granularity}`}
          empty="—"
          maxRows={31}
          columns={[
            { key: 'label', header: tr('دوره', 'Period'), render: (row) => formatBucketLabel(String(row.label), granularity, isPersian), value: (row) => String(row.label), sortable: false },
            { key: 'orders', header: tr('سفارش', 'Orders'), align: 'end', render: (row) => n(Number(row.orders)), value: (row) => Number(row.orders) },
            { key: 'gross', header: tr('ناخالص', 'Gross'), align: 'end', render: (row) => money(Number(row.gross)), value: (row) => Number(row.gross) },
            { key: 'discounts', header: tr('تخفیف', 'Discounts'), align: 'end', render: (row) => money(Number(row.discounts)), value: (row) => Number(row.discounts) },
            { key: 'shipping', header: tr('ارسال', 'Shipping'), align: 'end', render: (row) => money(Number(row.shipping)), value: (row) => Number(row.shipping) },
            { key: 'tax', header: tr('مالیات', 'Tax'), align: 'end', render: (row) => money(Number(row.tax)), value: (row) => Number(row.tax) },
            { key: 'net', header: tr('فروش خالص', 'Net'), align: 'end', render: (row) => money(Number(row.net)), value: (row) => Number(row.net) },
            { key: 'subscriptions', header: tr('اشتراک', 'Subs'), align: 'end', render: (row) => money(Number(row.subscriptions)), value: (row) => Number(row.subscriptions) },
            { key: 'income', header: tr('درآمد کل', 'Income'), align: 'end', render: (row) => <span className="font-black">{money(Number(row.income))}</span>, value: (row) => Number(row.income) },
            { key: 'cancelled', header: tr('لغو شده', 'Cancelled'), align: 'end', render: (row) => <span className="text-rose-700 dark:text-rose-400">{money(Number(row.cancelled))}</span>, value: (row) => Number(row.cancelled) },
          ]}
        />
      </Panel>

      <Panel title={tr('خلاصه دوره‌های تقویمی', 'Calendar periods')} subtitle={tr('امروز، این ماه، امسال و کل دوران — مستقل از بازه بالا', 'Today, this month, this year, all time — independent of the range above')} icon={Landmark}>
        <DataTable
          isPersian={isPersian}
          rows={data.periods}
          rowKey={(row) => row.key}
          csvName="calendar-periods"
          empty="—"
          columns={[
            { key: 'period', header: tr('دوره', 'Period'), render: (row) => label(PERIOD_LABELS, row.key, isPersian), value: (row) => label(PERIOD_LABELS, row.key, isPersian), sortable: false },
            { key: 'orders', header: tr('سفارش', 'Orders'), align: 'end', render: (row) => n(row.orders), value: (row) => row.orders },
            { key: 'discounts', header: tr('تخفیف', 'Discounts'), align: 'end', render: (row) => money(row.discounts), value: (row) => row.discounts },
            { key: 'net', header: tr('فروش خالص', 'Net sales'), align: 'end', render: (row) => money(row.net), value: (row) => row.net },
            { key: 'subs', header: tr('اشتراک', 'Subs'), align: 'end', render: (row) => money(row.subscriptionRevenue), value: (row) => row.subscriptionRevenue },
            { key: 'aov', header: tr('میانگین سفارش', 'AOV'), align: 'end', render: (row) => money(row.aov), value: (row) => row.aov },
            { key: 'income', header: tr('درآمد کل', 'Income'), align: 'end', render: (row) => <span className="font-black">{money(row.income)}</span>, value: (row) => row.income },
          ]}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={tr('روش پرداخت', 'Payment methods')} icon={Banknote}>
          <DonutChart
            isPersian={isPersian}
            centerLabel={tr('فروش خالص', 'Net sales')}
            format={compact}
            slices={data.byPayment.map((row, index) => ({ key: row.method, name: `${label(PAYMENT_LABELS, row.method, isPersian)} (${n(row.orders)})`, value: row.amount, color: VIZ[index % VIZ.length] }))}
          />
        </Panel>
        <Panel title={tr('VIP در برابر عادی', 'VIP vs regular')} subtitle={tr('سفارش‌هایی که تخفیف VIP خورده‌اند', 'Orders that received a VIP discount')} icon={Crown}>
          <DonutChart
            isPersian={isPersian}
            centerLabel={tr('فروش خالص', 'Net sales')}
            format={compact}
            slices={['vip', 'regular'].map((segment, index) => {
              const row = data.segments.find((item) => item.segment === segment);
              return {
                key: segment,
                name: `${segment === 'vip' ? tr('مشتریان VIP', 'VIP') : tr('مشتریان عادی', 'Regular')} (${n(row?.orders || 0)})`,
                value: row?.amount || 0,
                color: VIZ[index],
              };
            })}
          />
        </Panel>
        <Panel title={tr('وضعیت سفارش‌ها', 'Order status')} icon={Receipt}>
          <BarList
            empty={tr('سفارشی نیست', 'No orders')}
            format={money}
            items={STATUS_ORDER.map((status) => data.byStatus.find((row) => row.status === status))
              .filter(Boolean)
              .map((row) => ({ key: row!.status, label: label(ORDER_STATUS_LABELS, row!.status, isPersian), value: row!.amount, sub: tr(`${digits(row!.orders, true)} سفارش`, `${row!.orders} orders`) }))}
          />
        </Panel>
        <Panel title={tr('فروش بر اساس دسته‌بندی', 'Sales by category')} icon={PieChart}>
          <BarList
            empty={tr('فروشی ثبت نشده', 'No sales')}
            format={money}
            items={data.byCategory.slice(0, 10).map((row) => ({ key: String(row.categoryId), label: isPersian ? row.name : row.nameEn || row.name, value: row.amount, sub: tr(`${digits(row.quantity, true)} عدد`, `${row.quantity} pcs`) }))}
          />
        </Panel>
        <Panel title={tr('فروش بر اساس استان', 'Sales by province')} icon={MapPin}>
          <BarList
            empty={tr('فروشی ثبت نشده', 'No sales')}
            format={money}
            items={data.byProvince.slice(0, 10).map((row) => ({ key: row.province, label: row.province, value: row.amount, sub: tr(`${digits(row.orders, true)} سفارش`, `${row.orders} orders`) }))}
          />
        </Panel>
        <Panel title={tr('روش ارسال', 'Shipping methods')} icon={Truck}>
          <BarList
            empty={tr('سفارشی نیست', 'No orders')}
            format={n}
            items={data.byShipping.map((row) => ({ key: row.method, label: row.method, value: row.orders, display: tr(`${digits(row.orders, true)} سفارش`, `${row.orders} orders`), sub: money(row.fees) }))}
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={tr('پرفروش‌ترین محصولات (مبلغ)', 'Top products by revenue')} icon={Package}>
          <DataTable
            isPersian={isPersian}
            rows={data.topProducts}
            rowKey={(row) => String(row.productId)}
            csvName="top-products"
            empty={tr('فروشی ثبت نشده', 'No sales')}
            onRowClick={(row) => onOpenProduct(String(row.productId))}
            initialSort={{ key: 'amount', dir: 'desc' }}
            columns={[
              { key: 'title', header: tr('محصول', 'Product'), render: (row) => <span className="block max-w-[220px] truncate">{row.title}</span>, value: (row) => row.title },
              { key: 'quantity', header: tr('تعداد', 'Qty'), align: 'end', render: (row) => n(row.quantity), value: (row) => row.quantity },
              { key: 'orders', header: tr('سفارش', 'Orders'), align: 'end', render: (row) => n(row.orders), value: (row) => row.orders },
              { key: 'amount', header: tr('مبلغ', 'Revenue'), align: 'end', render: (row) => <span className="font-black">{money(row.amount)}</span>, value: (row) => row.amount },
            ]}
          />
        </Panel>
        <Panel title={tr('مشتریان برتر', 'Top customers')} icon={Users}>
          <DataTable
            isPersian={isPersian}
            rows={data.topCustomers}
            rowKey={(row) => String(row._id)}
            csvName="top-customers"
            empty={tr('خریدی ثبت نشده', 'No purchases')}
            onRowClick={(row) => onOpenVisitor(String(row._id))}
            columns={[
              {
                key: 'name',
                header: tr('مشتری', 'Customer'),
                render: (row) => (
                  <span className="inline-flex items-center gap-1.5">
                    {row.fullName || row.username || '—'}
                    {row.isVip && <Crown className="h-3 w-3 text-brand-bronze dark:text-brand-gold" />}
                  </span>
                ),
                value: (row) => row.fullName || row.username,
              },
              { key: 'phone', header: tr('موبایل', 'Phone'), render: (row) => <span dir="ltr">{row.phone || '—'}</span>, value: (row) => row.phone },
              { key: 'orders', header: tr('سفارش', 'Orders'), align: 'end', render: (row) => n(row.orders), value: (row) => row.orders },
              { key: 'amount', header: tr('مجموع خرید', 'Spent'), align: 'end', render: (row) => <span className="font-black">{money(row.amount)}</span>, value: (row) => row.amount },
              { key: 'last', header: tr('آخرین خرید', 'Last order'), render: (row) => formatDateTime(row.lastOrderAt, isPersian, false), value: (row) => row.lastOrderAt },
            ]}
          />
        </Panel>
        <Panel title={tr('کدهای تخفیف', 'Coupons')} icon={Tag}>
          <DataTable
            isPersian={isPersian}
            rows={data.coupons}
            rowKey={(row) => row.code}
            csvName="coupons"
            empty={tr('از کد تخفیفی استفاده نشده', 'No coupon usage')}
            columns={[
              { key: 'code', header: tr('کد', 'Code'), render: (row) => <span dir="ltr" className="font-black">{row.code}</span>, value: (row) => row.code },
              { key: 'uses', header: tr('دفعات', 'Uses'), align: 'end', render: (row) => n(row.uses), value: (row) => row.uses },
              { key: 'discount', header: tr('تخفیف داده‌شده', 'Discount given'), align: 'end', render: (row) => money(row.discount), value: (row) => row.discount },
              { key: 'amount', header: tr('فروش حاصل', 'Sales'), align: 'end', render: (row) => money(row.amount), value: (row) => row.amount },
            ]}
          />
        </Panel>
        <Panel title={tr('پلن‌های VIP', 'VIP plans')} icon={Crown}>
          <DataTable
            isPersian={isPersian}
            rows={data.vipPlans}
            rowKey={(row) => String(row.planId)}
            csvName="vip-plans"
            empty={tr('در این بازه اشتراکی فروخته نشده', 'No subscriptions in range')}
            columns={[
              { key: 'title', header: tr('پلن', 'Plan'), render: (row) => row.title, value: (row) => row.title },
              { key: 'count', header: tr('تعداد', 'Count'), align: 'end', render: (row) => n(row.count), value: (row) => row.count },
              { key: 'amount', header: tr('درآمد', 'Revenue'), align: 'end', render: (row) => money(row.amount), value: (row) => row.amount },
            ]}
          />
        </Panel>
      </div>

      <Panel title={tr('ارزش موجودی انبار', 'Inventory valuation')} subtitle={tr('محاسبه با قیمت فروش فعلی؛ قیمت خرید (بهای تمام‌شده) هنوز در سیستم ثبت نمی‌شود', 'Valued at current selling price; cost prices are not recorded yet')} icon={Boxes}>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: tr('ارزش ریالی موجودی', 'Retail value'), value: money(data.inventory.retailValue) },
            { label: tr('تعداد کل واحدها', 'Units in stock'), value: n(data.inventory.units) },
            { label: tr('محصولات فعال', 'Active products'), value: n(data.inventory.products) },
            { label: tr('ناموجود', 'Out of stock'), value: n(data.inventory.outOfStock) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-brand-surface-elevated p-3">
              <div className="text-[11px] font-bold text-brand-text-muted">{item.label}</div>
              <div className="mt-1 text-base font-black text-brand-text">{item.value}</div>
            </div>
          ))}
        </div>
        {data.inventory.lowStock.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {tr('موجودی رو به اتمام (۳ عدد یا کمتر)', 'Low stock (3 or fewer)')}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.inventory.lowStock.map((item) => (
                <button
                  key={String(item.productId)}
                  type="button"
                  onClick={() => onOpenProduct(String(item.productId))}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-brand-text hover:border-amber-500"
                >
                  {item.title} · {digits(item.stock, isPersian)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Note>
        {tr(
          'درآمد = جمع مبلغ نهایی سفارش‌های لغونشده (شامل ارسال و مالیات، پس از کسر تخفیف) + مبلغ اشتراک‌های VIP. تاریخ مبنا زمان ثبت سفارش به وقت تهران است. برای محاسبه سود خالص، ثبت قیمت خرید محصولات لازم است.',
          'Income = final totals of non-cancelled orders (incl. shipping and tax, after discounts) + VIP subscription payments, dated by order time in Tehran. Net profit needs product cost prices, which are not recorded yet.',
        )}
      </Note>
    </div>
  );
}
