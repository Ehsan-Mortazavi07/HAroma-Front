'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Crown, Monitor, Search, Smartphone, Tablet, UserRound } from 'lucide-react';
import { reportsApi, type ReportRangeParams, type VisitorRow } from '@/common/api/reports';
import { PaginationControls } from '@/components/common/PaginationControls';
import { BarList, TrendChart, VIZ } from './charts';
import { DataTable, ErrorState, LoadingGrid, Panel, Segmented } from './ui';
import { useReport } from './useReport';
import { Drawer } from './Drawer';
import type { TabProps } from './OverviewTab';
import {
  ORDER_STATUS_LABELS,
  PAGE_TYPE_LABELS,
  digits,
  formatBucketLabel,
  formatDateTime,
  formatDuration,
  formatDurationShort,
  formatMoney,
  formatNumber,
  label,
  referrerLabel,
} from './format';

type VisitorType = 'users' | 'guests';
type VisitorSort = 'lastSeen' | 'duration' | 'sessions' | 'pageViews' | 'spent';

const DeviceIcon = ({ device }: { device: string }) =>
  device === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : device === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />;

export function VisitorsTab({ params, isPersian, isAdmin, refreshKey, onOpenVisitor }: TabProps) {
  const [type, setType] = useState<VisitorType>('users');
  const [sortBy, setSortBy] = useState<VisitorSort>('lastSeen');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const tr = (fa: string, en: string) => (isPersian ? fa : en);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => setPage(1), [type, sortBy, debouncedQuery, params.from, params.to]);

  const { data, loading, error, reload } = useReport(
    () => reportsApi.visitors({ ...params, type, sortBy: type === 'guests' && sortBy === 'spent' ? 'lastSeen' : sortBy, q: debouncedQuery || undefined, page, pageSize: 20 }),
    [params.from, params.to, type, sortBy, debouncedQuery, page, refreshKey],
    isPersian,
  );
  const n = (value: number) => formatNumber(value, isPersian);

  return (
    <div className="space-y-5">
      <Panel
        title={tr('رفتار تک‌تک بازدیدکنندگان', 'Every visitor, individually')}
        subtitle={tr('مدت حضور، تعداد ورود، صفحات دیده‌شده و خرید هر نفر. روی هر ردیف بزنید تا جزئیات کامل را ببینید.', 'Time on site, visits, pages and purchases per person. Click a row for the full profile.')}
        icon={UserRound}
        actions={
          <Segmented<VisitorType>
            value={type}
            onChange={setType}
            options={[
              { value: 'users', label: tr('کاربران عضو', 'Members') },
              { value: 'guests', label: tr('مهمان‌ها', 'Guests') },
            ]}
          />
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted start-3" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={type === 'users' ? tr('نام، نام کاربری، موبایل یا ایمیل', 'Name, username, phone or email') : tr('شناسه یا صفحه ورود', 'Id or landing page')}
              className="h-10 w-full rounded-full border border-brand-border bg-brand-surface-elevated pe-4 ps-9 text-xs font-semibold text-brand-text outline-none transition-colors focus:border-brand-gold"
            />
          </label>
          <Segmented<VisitorSort>
            size="sm"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'lastSeen', label: tr('آخرین بازدید', 'Last seen') },
              { value: 'duration', label: tr('بیشترین زمان', 'Most time') },
              { value: 'sessions', label: tr('بیشترین ورود', 'Most visits') },
              { value: 'pageViews', label: tr('بیشترین صفحه', 'Most pages') },
              ...(type === 'users' && isAdmin ? [{ value: 'spent' as VisitorSort, label: tr('بیشترین خرید', 'Top spenders') }] : []),
            ]}
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={reload} retryLabel={tr('تلاش دوباره', 'Retry')} />
        ) : loading && !data ? (
          <LoadingGrid tiles={0} />
        ) : data ? (
          <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <div className="mb-2 text-[11px] font-bold text-brand-text-muted">
              {tr(`${digits(data.total, true)} نفر در این بازه`, `${data.total} people in range`)}
            </div>
            <DataTable<VisitorRow>
              isPersian={isPersian}
              rows={data.items}
              rowKey={(row) => row.key}
              csvName={`visitors-${type}-page-${page}`}
              empty={tr('در این بازه بازدیدی ثبت نشده است.', 'No visits in this range.')}
              onRowClick={(row) => onOpenVisitor(row.key)}
              columns={[
                {
                  key: 'who',
                  header: type === 'users' ? tr('کاربر', 'User') : tr('بازدیدکننده', 'Visitor'),
                  render: (row) =>
                    row.user ? (
                      <span className="flex flex-col">
                        <span className="inline-flex items-center gap-1 font-bold">
                          {row.user.fullName || row.user.username}
                          {row.user.isVip && <Crown className="h-3 w-3 text-brand-bronze dark:text-brand-gold" />}
                        </span>
                        <span className="text-[10px] text-brand-text-muted" dir="ltr">{row.user.phone || row.user.email || `@${row.user.username}`}</span>
                      </span>
                    ) : (
                      <span className="flex flex-col">
                        <span className="font-bold">{tr('مهمان', 'Guest')}</span>
                        <span className="font-mono text-[10px] text-brand-text-muted" dir="ltr">{row.key.slice(0, 10)}…</span>
                      </span>
                    ),
                  value: (row) => row.user?.fullName || row.user?.username || row.key,
                },
                { key: 'sessions', header: tr('دفعات ورود', 'Visits'), align: 'end', render: (row) => n(row.sessions), value: (row) => row.sessions },
                { key: 'duration', header: tr('کل زمان حضور', 'Total time'), align: 'end', render: (row) => <span className="font-black">{formatDuration(row.duration, isPersian)}</span>, value: (row) => row.duration },
                { key: 'avg', header: tr('میانگین هر ورود', 'Avg. per visit'), align: 'end', render: (row) => formatDuration(row.avgSessionDuration, isPersian), value: (row) => row.avgSessionDuration },
                { key: 'pages', header: tr('صفحات', 'Pages'), align: 'end', render: (row) => n(row.pageViews), value: (row) => row.pageViews },
                ...(type === 'users'
                  ? [
                      { key: 'orders', header: tr('سفارش', 'Orders'), align: 'end' as const, render: (row: VisitorRow) => n(row.orders), value: (row: VisitorRow) => row.orders },
                      ...(isAdmin
                        ? [{ key: 'spent', header: tr('خرید', 'Spent'), align: 'end' as const, render: (row: VisitorRow) => formatMoney(row.spent || 0, isPersian), value: (row: VisitorRow) => row.spent || 0 }]
                        : []),
                    ]
                  : [{ key: 'landing', header: tr('صفحه ورود', 'Landing'), render: (row: VisitorRow) => <span dir="ltr" className="block max-w-[160px] truncate">{decodeURIComponent(row.landingPath || '/')}</span>, value: (row: VisitorRow) => row.landingPath }]),
                {
                  key: 'devices',
                  header: tr('دستگاه', 'Device'),
                  render: (row) => (
                    <span className="inline-flex gap-1 text-brand-text-muted">
                      {row.devices.map((device) => (
                        <DeviceIcon key={device} device={device} />
                      ))}
                    </span>
                  ),
                  value: (row) => row.devices.join(' '),
                  sortable: false,
                },
                { key: 'source', header: tr('منبع', 'Source'), render: (row) => <span dir="ltr">{row.referrers[0] || referrerLabel('(direct)', isPersian)}</span>, value: (row) => row.referrers.join(' '), sortable: false },
                { key: 'first', header: tr('اولین بازدید', 'First seen'), render: (row) => formatDateTime(row.firstSeenAt, isPersian), value: (row) => row.firstSeenAt },
                { key: 'last', header: tr('آخرین بازدید', 'Last seen'), render: (row) => formatDateTime(row.lastSeenAt, isPersian), value: (row) => row.lastSeenAt },
              ]}
            />
            {data.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <PaginationControls currentPage={page} totalPages={data.totalPages} isPersian={isPersian} onPageChange={setPage} isLoading={loading} />
              </div>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

export function VisitorDetailModal({
  visitorKey,
  params,
  isPersian,
  isAdmin,
  onClose,
}: {
  visitorKey: string | null;
  params: ReportRangeParams;
  isPersian: boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  // Keep the last key so the drawer can animate out with its content intact.
  const [shownKey, setShownKey] = useState<string | null>(visitorKey);
  useEffect(() => {
    if (visitorKey) setShownKey(visitorKey);
  }, [visitorKey]);
  return shownKey ? (
    <VisitorDetailBody visitorKey={shownKey} open={!!visitorKey} onClose={onClose} params={params} isPersian={isPersian} isAdmin={isAdmin} />
  ) : null;
}

function VisitorDetailBody({
  visitorKey,
  open,
  onClose,
  params,
  isPersian,
  isAdmin,
}: {
  visitorKey: string;
  open: boolean;
  onClose: () => void;
  params: ReportRangeParams;
  isPersian: boolean;
  isAdmin: boolean;
}) {
  const [openSession, setOpenSession] = useState<string | null>(null);
  const { data, loading, error, reload } = useReport(
    () => reportsApi.visitorDetail(visitorKey, params),
    [visitorKey, params.from, params.to, params.granularity],
    isPersian,
  );
  const tr = (fa: string, en: string) => (isPersian ? fa : en);
  const n = (value: number) => formatNumber(value, isPersian);
  const granularity = params.granularity || 'day';
  const current = data && data.key === visitorKey ? data : null;
  const user = current?.user;

  return (
      <Drawer
        open={open}
        onClose={onClose}
        isRTL={isPersian}
        closeLabel={tr('بستن', 'Close')}
        leading={
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-bronze dark:text-brand-gold">
            <UserRound className="h-5 w-5" />
          </span>
        }
        title={
          <span className="inline-flex items-center gap-1.5">
            {user ? user.fullName || user.username : current ? tr('بازدیدکننده مهمان', 'Guest visitor') : tr('در حال بارگذاری…', 'Loading…')}
            {user?.isVip && <Crown className="h-4 w-4 text-brand-bronze dark:text-brand-gold" />}
          </span>
        }
        subtitle={<span dir="ltr">{user ? [user.phone, user.email, `@${user.username}`].filter(Boolean).join(' · ') : visitorKey}</span>}
      >
        {error && !current ? (
          <ErrorState message={error} onRetry={reload} retryLabel={tr('تلاش دوباره', 'Retry')} />
        ) : (loading && !current) || !current ? (
          <div className="h-72 animate-pulse rounded-3xl bg-brand-surface-elevated" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: tr('کل زمان حضور (همیشه)', 'Lifetime time on site'), value: formatDuration(current.lifetime.duration, isPersian) },
                { label: tr('دفعات ورود', 'Visits'), value: n(current.lifetime.sessions) },
                { label: tr('میانگین هر ورود', 'Avg. per visit'), value: formatDuration(current.lifetime.avgSessionDuration, isPersian) },
                { label: tr('صفحات دیده‌شده', 'Pages viewed'), value: n(current.lifetime.pageViews) },
                { label: tr('اولین بازدید', 'First seen'), value: formatDateTime(current.lifetime.firstSeenAt, isPersian, false) },
                { label: tr('آخرین بازدید', 'Last seen'), value: formatDateTime(current.lifetime.lastSeenAt, isPersian) },
                { label: tr('افزودن به سبد (بازه)', 'Add-to-cart (range)'), value: n(current.addToCart) },
                current.isUser
                  ? { label: tr('سفارش / خرید', 'Orders / spent'), value: isAdmin ? `${n(current.lifetime.orders)} · ${formatMoney(current.lifetime.spent, isPersian)}` : n(current.lifetime.orders) }
                  : { label: tr('دستگاه‌ها', 'Devices'), value: n(current.lifetime.devicesCount) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-brand-surface-elevated p-3">
                  <div className="text-[10px] font-bold text-brand-text-muted">{item.label}</div>
                  <div className="mt-1 text-sm font-black">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-brand-text-muted">
              {[...current.lifetime.devices.map((device: string) => label({ mobile: ['موبایل', 'Mobile'], desktop: ['دسکتاپ', 'Desktop'], tablet: ['تبلت', 'Tablet'] }, device, isPersian)), ...current.lifetime.browsers, ...current.lifetime.os].map((tag: string) => (
                <span key={tag} className="rounded-full border border-brand-border px-2 py-0.5">
                  {tag}
                </span>
              ))}
              {user?.province && <span className="rounded-full border border-brand-border px-2 py-0.5">{[user.province, user.city].filter(Boolean).join('، ')}</span>}
              {user?.createdAt && <span className="rounded-full border border-brand-border px-2 py-0.5">{tr('عضویت:', 'Joined:')} {formatDateTime(user.createdAt, isPersian, false)}</span>}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title={tr('زمان حضور در این بازه', 'Time on site in range')}>
                <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'}
                  ariaLabel={tr('زمان حضور', 'Time on site')}
                  kind="bar"
                  data={current.series}
                  xLabels={current.series.map((point) => formatBucketLabel(String(point.label), granularity, isPersian))}
                  series={[{ key: 'duration', name: tr('زمان', 'Time'), color: VIZ[0] }]}
                  format={(value) => formatDuration(value, isPersian)}
                  axisFormat={(value) => formatDurationShort(value, isPersian)}
                  height={180}
                />
              </Panel>
              <Panel title={tr('زمان صرف‌شده در هر بخش', 'Time by section')}>
                <BarList
                  empty={tr('داده‌ای نیست', 'No data')}
                  format={(value) => formatDuration(value, isPersian)}
                  items={current.pageTypes.map((row) => ({ key: row.type, label: label(PAGE_TYPE_LABELS, row.type, isPersian), value: row.duration, sub: tr(`${digits(row.views, true)} بازدید`, `${row.views} views`) }))}
                />
              </Panel>
            </div>

            <Panel title={tr('محصولاتی که دیده', 'Products viewed')} subtitle={tr('مرتب‌شده بر اساس زمانی که روی هر محصول گذاشته', 'Sorted by time spent on each product')}>
              <BarList
                empty={tr('محصولی ندیده است', 'No products viewed')}
                format={(value) => formatDuration(value, isPersian)}
                items={current.products.map((row) => ({ key: String(row.productId), label: row.title, value: row.duration, sub: tr(`${digits(row.views, true)} بار`, `${row.views}×`) }))}
              />
            </Panel>

            <Panel title={tr('تاریخچه جلسات', 'Session history')} subtitle={tr('هر جلسه را باز کنید تا مسیر حرکت کاربر صفحه‌به‌صفحه را ببینید', 'Expand a session to see the page-by-page journey')}>
              {current.sessions.length === 0 ? (
                <p className="py-6 text-center text-xs text-brand-text-muted">{tr('در این بازه جلسه‌ای نیست', 'No sessions in range')}</p>
              ) : (
                <ul className="space-y-2">
                  {current.sessions.map((session) => {
                    const open = openSession === session.sessionId;
                    return (
                      <li key={session.sessionId} className="rounded-2xl border border-brand-border">
                        <button
                          type="button"
                          onClick={() => setOpenSession(open ? null : session.sessionId)}
                          aria-expanded={open}
                          className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-start text-xs"
                        >
                          <span className="inline-flex items-center gap-2 font-bold">
                            <DeviceIcon device={session.device} />
                            {formatDateTime(session.startedAt, isPersian)}
                          </span>
                          <span className="inline-flex items-center gap-3 font-semibold text-brand-text-muted">
                            <span>{formatDuration(session.duration, isPersian)}</span>
                            <span>{tr(`${digits(session.pageViews, true)} صفحه`, `${session.pageViews} pages`)}</span>
                            <span dir="ltr">{referrerLabel(session.referrer, isPersian)}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </span>
                        </button>
                        {open && (
                          <ol className="space-y-1 border-t border-brand-border px-3 py-2">
                            {session.pages.map((page, index) => (
                              <li key={`${page.enteredAt}-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="w-5 shrink-0 text-brand-text-muted">{digits(index + 1, isPersian)}</span>
                                  <span className="truncate font-semibold">{page.title || label(PAGE_TYPE_LABELS, page.pageType, isPersian)}</span>
                                  <span dir="ltr" className="hidden truncate text-brand-text-muted sm:inline">{decodeURIComponent(page.path)}</span>
                                </span>
                                <span className="shrink-0 font-bold text-brand-text-muted">{formatDuration(page.duration, isPersian)}</span>
                              </li>
                            ))}
                            <li className="pt-1 text-[10px] text-brand-text-muted">
                              {session.browser} · {session.os}
                            </li>
                          </ol>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            {current.isUser && (
              <Panel title={tr('سفارش‌ها', 'Orders')}>
                <DataTable
                  isPersian={isPersian}
                  rows={current.orders}
                  rowKey={(row) => String(row._id)}
                  empty={tr('سفارشی ثبت نکرده', 'No orders')}
                  columns={[
                    { key: 'number', header: tr('شماره', 'Number'), render: (row) => digits(row.orderNumber, isPersian) },
                    { key: 'items', header: tr('اقلام', 'Items'), render: (row) => <span className="block max-w-[260px] truncate">{row.items.map((item) => `${item.title} ×${item.quantity}`).join('، ')}</span> },
                    ...(isAdmin ? [{ key: 'total', header: tr('مبلغ', 'Total'), align: 'end' as const, render: (row: (typeof current.orders)[number]) => formatMoney(row.total || 0, isPersian) }] : []),
                    { key: 'status', header: tr('وضعیت', 'Status'), render: (row) => label(ORDER_STATUS_LABELS, row.status, isPersian) },
                    { key: 'date', header: tr('تاریخ', 'Date'), render: (row) => formatDateTime(row.createdAt, isPersian) },
                  ]}
                />
              </Panel>
            )}
          </>
        )}
      </Drawer>
  );
}
