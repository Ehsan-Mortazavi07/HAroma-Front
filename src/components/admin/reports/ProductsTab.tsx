'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Crown, EyeOff, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { reportsApi, type ProductReportRow, type ReportRangeParams } from '@/common/api/reports';
import { resolveMediaUrl } from '@/common/constants/URL';
import { PATHS } from '@/common/constants/PATHS';
import { BarList, Legend, TrendChart, VIZ } from './charts';
import { DataTable, ErrorState, KpiTile, LoadingGrid, Note, Panel, Segmented, ValuePair } from './ui';
import { useReport } from './useReport';
import { Drawer } from './Drawer';
import type { TabProps } from './OverviewTab';
import {
  digits,
  formatBucketLabel,
  formatCompact,
  formatDuration,
  formatMoney,
  formatNumber,
  formatPercent,
  referrerLabel,
} from './format';

type SortKey = 'views' | 'revenue' | 'quantity' | 'addToCart' | 'conversion' | 'avgTime';

function ProductThumb({ image, title, size = 32 }: { image: string; title: string; size?: number }) {
  return image ? (
    <Image src={resolveMediaUrl(image)} alt={title} width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-xl object-cover" unoptimized />
  ) : (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-xl bg-brand-surface-elevated">
      <Package className="h-4 w-4 text-brand-text-muted" />
    </span>
  );
}

export function ProductsTab({ params, isPersian, isAdmin, refreshKey, onOpenProduct }: TabProps) {
  const [sortBy, setSortBy] = useState<SortKey>('views');
  const { data, loading, error, reload } = useReport(
    () => reportsApi.products({ ...params, sortBy }),
    [params.from, params.to, params.granularity, sortBy, refreshKey],
    isPersian,
  );
  const tr = (fa: string, en: string) => (isPersian ? fa : en);
  const n = (value: number) => formatNumber(value, isPersian);
  const money = (value: number) => formatMoney(value, isPersian);

  if (loading && !data) return <LoadingGrid tiles={4} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} retryLabel={tr('تلاش دوباره', 'Retry')} />;
  if (!data) return null;

  const t = data.totals;
  const top = (key: keyof ProductReportRow) =>
    [...data.items].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0)).filter((row) => Number(row[key]) > 0).slice(0, 8);

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile emphasis isPersian={isPersian} icon={TrendingUp} label={tr('بازدید صفحات محصول', 'Product page views')} value={n(t.views)} />
        <KpiTile isPersian={isPersian} icon={ShoppingCart} label={tr('افزودن به سبد', 'Add-to-cart')} value={n(t.addToCart)} hint={tr(`نرخ ${formatPercent(t.views ? (t.addToCart / t.views) * 100 : 0, true)}`, `${formatPercent(t.views ? (t.addToCart / t.views) * 100 : 0, false)} rate`)} />
        <KpiTile isPersian={isPersian} icon={Package} label={tr('تعداد فروخته‌شده', 'Units sold')} value={n(t.quantity)} hint={t.amount !== null ? money(t.amount) : undefined} />
        <KpiTile isPersian={isPersian} icon={EyeOff} label={tr('بدون بازدید / بدون فروش', 'Never viewed / never sold')} value={<ValuePair items={[{ value: n(t.neverViewed), label: tr('بی‌بازدید', 'unviewed') }, { value: n(t.neverSold), label: tr('بی‌فروش', 'unsold') }]} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={tr('پربازدیدترین‌ها', 'Most viewed')} icon={TrendingUp}>
          <BarList empty={tr('بازدیدی نیست', 'No views')} format={n} items={top('views').map((row) => ({ key: row.productId, label: row.title, value: row.views, sub: formatDuration(row.avgTime, isPersian), onClick: () => onOpenProduct(row.productId) }))} />
        </Panel>
        <Panel title={tr('بیشترین زمان مشاهده', 'Longest attention')} subtitle={tr('مجموع زمانی که کاربران روی صفحه محصول بوده‌اند', 'Total time spent on product page')} icon={TrendingUp}>
          <BarList empty={tr('داده‌ای نیست', 'No data')} format={(value) => formatDuration(value, isPersian)} items={top('totalTime').map((row) => ({ key: row.productId, label: row.title, value: row.totalTime, onClick: () => onOpenProduct(row.productId) }))} />
        </Panel>
        <Panel title={isAdmin ? tr('بیشترین فروش (مبلغ)', 'Top revenue') : tr('بیشترین فروش (تعداد)', 'Top sellers')} icon={Package}>
          <BarList
            empty={tr('فروشی نیست', 'No sales')}
            format={isAdmin ? money : n}
            items={top(isAdmin ? 'amount' : 'quantity').map((row) => ({ key: row.productId, label: row.title, value: Number(isAdmin ? row.amount : row.quantity), sub: tr(`${digits(row.quantity, true)} عدد`, `${row.quantity} pcs`), onClick: () => onOpenProduct(row.productId) }))}
          />
        </Panel>
      </div>

      <Panel
        title={tr('عملکرد تک‌تک محصولات', 'Every product, in detail')}
        subtitle={tr('روی هر ردیف بزنید تا روند روزانه همان محصول را ببینید', 'Click a row for that product’s daily trend')}
        icon={Package}
        actions={
          <Segmented<SortKey>
            size="sm"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'views', label: tr('بازدید', 'Views') },
              { value: 'avgTime', label: tr('زمان', 'Time') },
              { value: 'addToCart', label: tr('سبد', 'Cart') },
              { value: 'quantity', label: tr('فروش', 'Sold') },
              ...(isAdmin ? [{ value: 'revenue' as SortKey, label: tr('مبلغ', 'Revenue') }] : []),
              { value: 'conversion', label: tr('تبدیل', 'Conversion') },
            ]}
          />
        }
      >
        <DataTable
          isPersian={isPersian}
          rows={data.items}
          rowKey={(row) => row.productId}
          csvName="products-performance"
          empty={tr('محصولی وجود ندارد', 'No products')}
          onRowClick={(row) => onOpenProduct(row.productId)}
          maxRows={25}
          columns={[
            {
              key: 'title',
              header: tr('محصول', 'Product'),
              render: (row) => (
                <span className="flex items-center gap-2">
                  <ProductThumb image={row.image} title={row.title} />
                  <span className="max-w-[200px] truncate">{isPersian ? row.title : row.titleEn || row.title}</span>
                  {row.isVipOnly && <Crown className="h-3 w-3 text-brand-bronze dark:text-brand-gold" />}
                  {!row.isPublished && <EyeOff className="h-3 w-3 text-brand-text-muted" />}
                </span>
              ),
              value: (row) => row.title,
            },
            { key: 'views', header: tr('بازدید', 'Views'), align: 'end', render: (row) => n(row.views), value: (row) => row.views },
            { key: 'visitors', header: tr('نفر', 'People'), align: 'end', render: (row) => n(row.visitors), value: (row) => row.visitors },
            { key: 'avgTime', header: tr('میانگین زمان', 'Avg. time'), align: 'end', render: (row) => formatDuration(row.avgTime, isPersian), value: (row) => row.avgTime },
            { key: 'totalTime', header: tr('کل زمان', 'Total time'), align: 'end', render: (row) => formatDuration(row.totalTime, isPersian), value: (row) => row.totalTime },
            { key: 'scroll', header: tr('اسکرول', 'Scroll'), align: 'end', render: (row) => formatPercent(row.avgScroll, isPersian), value: (row) => row.avgScroll },
            { key: 'cart', header: tr('افزودن به سبد', 'Add to cart'), align: 'end', render: (row) => n(row.addToCart), value: (row) => row.addToCart },
            { key: 'cartRate', header: tr('نرخ سبد', 'Cart rate'), align: 'end', render: (row) => formatPercent(row.cartRate, isPersian), value: (row) => row.cartRate },
            { key: 'quantity', header: tr('فروخته‌شده', 'Sold'), align: 'end', render: (row) => n(row.quantity), value: (row) => row.quantity },
            ...(isAdmin
              ? [{ key: 'amount', header: tr('مبلغ فروش', 'Revenue'), align: 'end' as const, render: (row: ProductReportRow) => money(row.amount || 0), value: (row: ProductReportRow) => row.amount || 0 }]
              : []),
            { key: 'conversion', header: tr('نرخ تبدیل', 'Conversion'), align: 'end', render: (row) => formatPercent(row.conversion, isPersian), value: (row) => row.conversion },
            {
              key: 'stock',
              header: tr('موجودی', 'Stock'),
              align: 'end',
              render: (row) => <span className={row.stock <= 0 ? 'text-rose-700 dark:text-rose-400' : row.stock <= 3 ? 'text-amber-700 dark:text-amber-400' : ''}>{n(row.stock)}</span>,
              value: (row) => row.stock,
            },
          ]}
        />
      </Panel>
      <Note>
        {tr(
          'نرخ تبدیل = تعداد سفارش‌های شامل این محصول ÷ تعداد افراد یکتایی که صفحه آن را دیده‌اند.',
          'Conversion = orders containing the product ÷ unique people who viewed its page.',
        )}
      </Note>
    </div>
  );
}

export function ProductDetailModal({
  productId,
  params,
  isPersian,
  isAdmin,
  onClose,
}: {
  productId: string | null;
  params: ReportRangeParams;
  isPersian: boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  // Keep the last id so the drawer can animate out with its content intact.
  const [shownId, setShownId] = useState<string | null>(productId);
  useEffect(() => {
    if (productId) setShownId(productId);
  }, [productId]);
  const tr = (fa: string, en: string) => (isPersian ? fa : en);
  const { data, loading, error, reload } = useReport(
    () => (shownId ? reportsApi.productDetail(shownId, params) : Promise.resolve(null)),
    [shownId, params.from, params.to, params.granularity],
    isPersian,
  );
  const current = data && shownId && data.product._id === shownId ? data : null;
  const granularity = params.granularity || 'day';
  const n = (value: number) => formatNumber(value, isPersian);
  const xLabels = current?.series.map((point) => formatBucketLabel(String(point.label), granularity, isPersian)) || [];
  const totals = (key: string) => (current?.series || []).reduce((sum, point) => sum + (Number(point[key]) || 0), 0);
  const engagement = [
    { key: 'views', name: tr('بازدید', 'Views'), color: VIZ[0] },
    { key: 'addToCart', name: tr('افزودن به سبد', 'Add to cart'), color: VIZ[1] },
    { key: 'quantity', name: tr('فروش (عدد)', 'Units sold'), color: VIZ[2] },
  ];

  return (
    <Drawer
      open={!!productId}
      onClose={onClose}
      isRTL={isPersian}
      closeLabel={tr('بستن', 'Close')}
      leading={current ? <ProductThumb image={current.product.images?.[0] || ''} title={current.product.title} size={44} /> : undefined}
      title={current ? (isPersian ? current.product.title : current.product.titleEn || current.product.title) : tr('در حال بارگذاری…', 'Loading…')}
      subtitle={
        current?.product.slug ? (
          <a href={PATHS.PRODUCT(current.product.slug)} target="_blank" rel="noreferrer" className="font-bold text-brand-bronze hover:underline dark:text-brand-gold">
            {tr('مشاهده در فروشگاه ↗', 'Open in store ↗')}
          </a>
        ) : undefined
      }
    >
      {error && !current ? (
        <ErrorState message={error} onRetry={reload} retryLabel={tr('تلاش دوباره', 'Retry')} />
      ) : (loading && !current) || !current ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-[76px] animate-pulse rounded-2xl bg-brand-surface-elevated" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-3xl bg-brand-surface-elevated" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: tr('بازدید', 'Views'), value: n(totals('views')) },
              { label: tr('میانگین زمان مشاهده', 'Avg. view time'), value: formatDuration(totals('views') ? totals('duration') / totals('views') : 0, isPersian) },
              { label: tr('افزودن به سبد', 'Add to cart'), value: n(totals('addToCart')) },
              isAdmin
                ? { label: tr('مبلغ فروش', 'Revenue'), value: formatMoney(totals('amount'), isPersian) }
                : { label: tr('فروخته‌شده', 'Sold'), value: n(totals('quantity')) },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-brand-border bg-brand-surface p-3.5">
                <div className="text-[11px] font-bold text-brand-text-muted">{item.label}</div>
                <div className="mt-1 break-words text-base font-black">{item.value}</div>
              </div>
            ))}
          </div>
          <Panel title={tr('روند تعامل', 'Engagement trend')}>
            <div className="mb-3">
              <Legend series={engagement} />
            </div>
            <TrendChart ariaLabel={tr('روند محصول', 'Product trend')} kind="line" data={current.series} xLabels={xLabels} series={engagement} format={n} axisFormat={(value) => formatCompact(value, isPersian)} height={240} emptyLabel={tr('در این بازه تعاملی ثبت نشده', 'No activity in this range')} />
          </Panel>
          {isAdmin && (
            <Panel title={tr('مبلغ فروش', 'Revenue')}>
              <TrendChart ariaLabel={tr('فروش محصول', 'Product revenue')} kind="bar" data={current.series} xLabels={xLabels} series={[{ key: 'amount', name: tr('مبلغ', 'Revenue'), color: VIZ[0] }]} format={(value) => formatMoney(value, isPersian)} axisFormat={(value) => formatCompact(value, isPersian)} height={200} emptyLabel={tr('در این بازه فروشی ثبت نشده', 'No sales in this range')} />
            </Panel>
          )}
          <Panel title={tr('کاربران از کجا به این محصول رسیده‌اند', 'How visitors arrived')}>
            <BarList empty={tr('داده‌ای نیست', 'No data')} format={n} items={current.referrers.map((row) => ({ key: row.name, label: <span dir="ltr">{referrerLabel(row.name, isPersian)}</span>, value: row.views }))} />
          </Panel>
        </>
      )}
    </Drawer>
  );
}
