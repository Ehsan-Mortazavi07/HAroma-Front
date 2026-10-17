'use client';

import React from 'react';
import {
  Activity,
  CalendarClock,
  Compass,
  DoorOpen,
  Eye,
  Filter,
  Globe,
  Hourglass,
  Layers,
  LogIn,
  Monitor,
  MousePointerClick,
  Search,
  Timer,
  UserPlus,
  Users,
} from 'lucide-react';
import { reportsApi } from '@/common/api/reports';
import { BarList, DonutChart, Funnel, Heatmap, Legend, TrendChart, VIZ } from './charts';
import { DataTable, ErrorState, KpiTile, LoadingGrid, Note, Panel, ValuePair } from './ui';
import { useReport } from './useReport';
import { LiveStrip, type TabProps } from './OverviewTab';
import {
  DEVICE_LABELS,
  PAGE_TYPE_LABELS,
  digits,
  formatBucketLabel,
  formatCompact,
  formatDuration,
  formatDurationShort,
  formatNumber,
  formatPercent,
  label,
  referrerLabel,
} from './format';

const WEEKDAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const WEEKDAYS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const DURATION_BUCKETS: Record<string, [string, string]> = {
  '0': ['کمتر از ۱۰ ثانیه', '< 10s'],
  '10': ['۱۰ تا ۳۰ ثانیه', '10–30s'],
  '30': ['۳۰ ثانیه تا ۱ دقیقه', '30s–1m'],
  '60': ['۱ تا ۳ دقیقه', '1–3m'],
  '180': ['۳ تا ۱۰ دقیقه', '3–10m'],
  '600': ['۱۰ تا ۳۰ دقیقه', '10–30m'],
  '1800+': ['بیش از ۳۰ دقیقه', '30m+'],
};
const DEPTH_BUCKETS: Record<string, [string, string]> = {
  '0': ['۱ صفحه', '1 page'],
  '2': ['۲ صفحه', '2 pages'],
  '3': ['۳ تا ۴ صفحه', '3–4 pages'],
  '5': ['۵ تا ۹ صفحه', '5–9 pages'],
  '10+': ['۱۰ صفحه و بیشتر', '10+ pages'],
};

export function TrafficTab({ params, isPersian, refreshKey }: TabProps) {
  const { data, loading, error, reload } = useReport(
    () => reportsApi.traffic(params),
    [params.from, params.to, params.granularity, refreshKey],
    isPersian,
  );

  if (loading && !data) return <LoadingGrid tiles={8} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} retryLabel={isPersian ? 'تلاش دوباره' : 'Retry'} />;
  if (!data) return null;

  const s = data.summary;
  const p = data.previous;
  const granularity = params.granularity || 'day';
  const xLabels = data.series.map((point) => formatBucketLabel(String(point.label), granularity, isPersian));
  const n = (value: number) => formatNumber(value, isPersian);
  const compact = (value: number) => formatCompact(value, isPersian);
  const duration = (value: number) => formatDuration(value, isPersian);
  const tr = (fa: string, en: string) => (isPersian ? fa : en);
  const sessionsText = (value: number) => tr(`${digits(value, true)} جلسه`, `${value} sessions`);

  const trafficSeries = [
    { key: 'pageViews', name: tr('بازدید صفحه', 'Page views'), color: VIZ[0] },
    { key: 'sessions', name: tr('جلسه', 'Sessions'), color: VIZ[1] },
    { key: 'visitors', name: tr('بازدیدکننده یکتا', 'Unique visitors'), color: VIZ[2] },
  ];
  const visitorMix = [
    { key: 'newVisitors', name: tr('بازدیدکننده جدید', 'New visitors'), color: VIZ[0] },
  ];

  const pathCell = (path: string, title?: string) => (
    <span className="flex max-w-[280px] flex-col">
      {title && <span className="truncate font-bold">{title}</span>}
      <span dir="ltr" className={`truncate text-start ${title ? 'text-[10px] text-brand-text-muted' : ''}`}>
        {decodeURIComponent(path)}
      </span>
    </span>
  );

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <LiveStrip live={data.live} isPersian={isPersian} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile emphasis isPersian={isPersian} icon={Users} label={tr('بازدیدکنندگان یکتا', 'Unique visitors')} value={n(s.visitors)} current={s.visitors} previous={p.visitors} />
        <KpiTile isPersian={isPersian} icon={Activity} label={tr('جلسات (ویزیت)', 'Sessions')} value={n(s.sessions)} current={s.sessions} previous={p.sessions} />
        <KpiTile isPersian={isPersian} icon={Eye} label={tr('بازدید صفحات', 'Page views')} value={n(s.pageViews)} current={s.pageViews} previous={p.pageViews} />
        <KpiTile isPersian={isPersian} icon={Timer} label={tr('میانگین مدت هر جلسه', 'Avg. session duration')} value={duration(s.avgSessionDuration)} current={s.avgSessionDuration} previous={p.avgSessionDuration} />
        <KpiTile isPersian={isPersian} icon={Hourglass} label={tr('مجموع زمان حضور کاربران', 'Total engaged time')} value={duration(s.totalDuration)} current={s.totalDuration} previous={p.totalDuration} />
        <KpiTile isPersian={isPersian} icon={Layers} label={tr('صفحه در هر جلسه', 'Pages per session')} value={formatNumber(s.pagesPerSession, isPersian, 2)} current={s.pagesPerSession} previous={p.pagesPerSession} />
        <KpiTile isPersian={isPersian} lowerIsBetter icon={DoorOpen} label={tr('نرخ پرش (تک‌صفحه‌ای)', 'Bounce rate')} value={formatPercent(s.bounceRate, isPersian)} current={s.bounceRate} previous={p.bounceRate} />
        <KpiTile isPersian={isPersian} icon={UserPlus} label={tr('جدید / بازگشتی', 'New / returning')} value={<ValuePair items={[{ value: n(s.newVisitors), label: tr('جدید', 'new') }, { value: n(s.returningVisitors), label: tr('بازگشتی', 'returning') }]} />} hint={tr(`${digits(s.loggedInUsers, true)} کاربر وارد شده`, `${s.loggedInUsers} signed-in users`)} />
      </div>

      <Panel title={tr('روند بازدید', 'Traffic over time')} icon={Activity}>
        <div className="mb-3">
          <Legend series={trafficSeries} />
        </div>
        <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار بازدید', 'Traffic chart')} kind="line" data={data.series} xLabels={xLabels} series={trafficSeries} format={n} axisFormat={compact} height={260} />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title={tr('میانگین مدت ماندن', 'Avg. time on site')} icon={Timer}>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار مدت ماندن', 'Duration chart')} data={data.series} xLabels={xLabels} series={[{ key: 'avgDuration', name: tr('میانگین', 'Average'), color: VIZ[0] }]} format={duration} axisFormat={(value) => formatDurationShort(value, isPersian)} height={200} />
        </Panel>
        <Panel title={tr('نرخ پرش', 'Bounce rate')} icon={DoorOpen}>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار نرخ پرش', 'Bounce chart')} kind="line" data={data.series} xLabels={xLabels} series={[{ key: 'bounceRate', name: tr('نرخ پرش', 'Bounce'), color: VIZ[0] }]} format={(value) => formatPercent(value, isPersian)} height={200} />
        </Panel>
        <Panel title={tr('بازدیدکنندگان جدید', 'New visitors')} icon={UserPlus}>
          <TrendChart
            emptyLabel={isPersian ? 'داده‌ای در این بازه ثبت نشده' : 'No data in this range'} ariaLabel={tr('نمودار بازدیدکننده جدید', 'New visitors chart')} kind="bar" data={data.series} xLabels={xLabels} series={visitorMix} format={n} axisFormat={compact} height={200} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={tr('قیف خرید', 'Purchase funnel')} subtitle={tr('چند درصد جلسات به هر مرحله رسیده‌اند', 'How many sessions reached each step')} icon={Filter}>
          <Funnel
            isPersian={isPersian}
            format={n}
            steps={[
              { key: 'sessions', label: tr('ورود به سایت', 'Visited site'), value: data.funnel.sessions },
              { key: 'product', label: tr('مشاهده محصول', 'Viewed a product'), value: data.funnel.viewedProduct },
              { key: 'cart', label: tr('افزودن به سبد', 'Added to cart'), value: data.funnel.addedToCart },
              { key: 'checkout', label: tr('شروع تسویه حساب', 'Began checkout'), value: data.funnel.beganCheckout },
              { key: 'purchase', label: tr('خرید موفق', 'Purchased'), value: data.funnel.purchased },
            ]}
          />
        </Panel>
        <Panel title={tr('ساعات اوج بازدید', 'Peak hours')} subtitle={tr('تعداد جلسات بر اساس روز هفته و ساعت (وقت تهران)', 'Sessions by weekday and hour (Tehran time)')} icon={CalendarClock}>
          <Heatmap matrix={data.heatmap} rowLabels={isPersian ? WEEKDAYS_FA : WEEKDAYS_EN} format={sessionsText} isPersian={isPersian} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={tr('دستگاه', 'Devices')} icon={Monitor}>
          <DonutChart
            isPersian={isPersian}
            centerLabel={tr('جلسات', 'Sessions')}
            format={n}
            slices={['mobile', 'desktop', 'tablet'].map((device, index) => ({
              key: device,
              name: label(DEVICE_LABELS, device, isPersian),
              value: data.devices.find((row) => row.name === device)?.sessions || 0,
              color: VIZ[index],
            }))}
          />
        </Panel>
        <Panel title={tr('مرورگر', 'Browsers')} icon={Globe}>
          <BarList empty={tr('داده‌ای نیست', 'No data')} format={sessionsText} items={data.browsers.map((row) => ({ key: row.name, label: row.name, value: row.sessions }))} />
        </Panel>
        <Panel title={tr('سیستم‌عامل', 'Operating systems')} icon={Monitor}>
          <BarList empty={tr('داده‌ای نیست', 'No data')} format={sessionsText} items={data.os.map((row) => ({ key: row.name, label: row.name, value: row.sessions }))} />
        </Panel>
        <Panel title={tr('منابع ورودی', 'Traffic sources')} subtitle={tr('سایتی که کاربر از آن وارد شده', 'Where visitors came from')} icon={Compass}>
          <BarList
            empty={tr('داده‌ای نیست', 'No data')}
            format={sessionsText}
            items={data.referrers.map((row) => ({ key: row.name, label: <span dir="ltr">{referrerLabel(row.name, isPersian)}</span>, value: row.sessions, sub: duration(row.avgDuration) }))}
          />
        </Panel>
        <Panel title={tr('کمپین‌ها (UTM)', 'Campaigns (UTM)')} icon={MousePointerClick}>
          <BarList empty={tr('کمپینی ثبت نشده', 'No campaigns')} format={sessionsText} items={data.utmSources.map((row) => ({ key: row.name, label: <span dir="ltr">{row.name}</span>, value: row.sessions }))} />
        </Panel>
        <Panel title={tr('نوع صفحات', 'Page types')} icon={Layers}>
          <BarList
            empty={tr('داده‌ای نیست', 'No data')}
            format={n}
            items={data.pageTypes.map((row) => ({ key: row.type, label: label(PAGE_TYPE_LABELS, row.type, isPersian), value: row.views, sub: duration(row.avgTime) }))}
          />
        </Panel>
        <Panel title={tr('توزیع مدت ماندن', 'Session length')} icon={Hourglass}>
          <BarList empty={tr('داده‌ای نیست', 'No data')} format={sessionsText} items={data.durationBuckets.map((row) => ({ key: row.bucket, label: label(DURATION_BUCKETS, row.bucket, isPersian), value: row.sessions }))} />
        </Panel>
        <Panel title={tr('عمق بازدید', 'Session depth')} icon={Layers}>
          <BarList empty={tr('داده‌ای نیست', 'No data')} format={sessionsText} items={data.depthBuckets.map((row) => ({ key: row.bucket, label: label(DEPTH_BUCKETS, row.bucket, isPersian), value: row.sessions }))} />
        </Panel>
        <Panel title={tr('جستجوهای کاربران', 'Site searches')} icon={Search}>
          <BarList
            empty={tr('جستجویی ثبت نشده', 'No searches')}
            format={n}
            items={data.searches.map((row) => ({ key: row.term, label: row.term, value: row.count, sub: tr(`${digits(row.visitors, true)} نفر`, `${row.visitors} people`) }))}
          />
        </Panel>
      </div>

      <Panel title={tr('پربازدیدترین صفحات', 'Top pages')} icon={Eye}>
        <DataTable
          isPersian={isPersian}
          rows={data.topPages}
          rowKey={(row) => row.path}
          csvName="top-pages"
          empty={tr('هنوز بازدیدی ثبت نشده', 'No page views yet')}
          initialSort={{ key: 'views', dir: 'desc' }}
          columns={[
            { key: 'path', header: tr('صفحه', 'Page'), render: (row) => pathCell(row.path, row.title), value: (row) => row.path },
            { key: 'type', header: tr('نوع', 'Type'), render: (row) => label(PAGE_TYPE_LABELS, row.pageType, isPersian), value: (row) => row.pageType },
            { key: 'views', header: tr('بازدید', 'Views'), align: 'end', render: (row) => n(row.views), value: (row) => row.views },
            { key: 'visitors', header: tr('نفر', 'Visitors'), align: 'end', render: (row) => n(row.visitors), value: (row) => row.visitors },
            { key: 'avgTime', header: tr('میانگین زمان', 'Avg. time'), align: 'end', render: (row) => duration(row.avgTime), value: (row) => row.avgTime },
            { key: 'scroll', header: tr('اسکرول', 'Scroll'), align: 'end', render: (row) => formatPercent(row.avgScroll, isPersian), value: (row) => row.avgScroll },
          ]}
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={tr('صفحات ورود', 'Landing pages')} icon={LogIn}>
          <DataTable
            isPersian={isPersian}
            rows={data.landingPages}
            rowKey={(row) => row.name}
            csvName="landing-pages"
            empty={tr('داده‌ای نیست', 'No data')}
            columns={[
              { key: 'path', header: tr('صفحه', 'Page'), render: (row) => pathCell(row.name), value: (row) => row.name },
              { key: 'sessions', header: tr('جلسه', 'Sessions'), align: 'end', render: (row) => n(row.sessions), value: (row) => row.sessions },
              { key: 'avg', header: tr('میانگین ماندن', 'Avg. stay'), align: 'end', render: (row) => duration(row.avgDuration), value: (row) => row.avgDuration },
            ]}
          />
        </Panel>
        <Panel title={tr('صفحات خروج', 'Exit pages')} subtitle={tr('آخرین صفحه‌ای که کاربر قبل از ترک سایت دیده', 'Last page seen before leaving')} icon={DoorOpen}>
          <DataTable
            isPersian={isPersian}
            rows={data.exitPages}
            rowKey={(row) => row.name}
            csvName="exit-pages"
            empty={tr('داده‌ای نیست', 'No data')}
            columns={[
              { key: 'path', header: tr('صفحه', 'Page'), render: (row) => pathCell(row.name), value: (row) => row.name },
              { key: 'sessions', header: tr('جلسه', 'Sessions'), align: 'end', render: (row) => n(row.sessions), value: (row) => row.sessions },
            ]}
          />
        </Panel>
      </div>

      <Note>
        {tr(
          'مدت ماندن فقط زمانی شمرده می‌شود که تب سایت باز و فعال باشد و کاربر در یک دقیقه اخیر تعاملی داشته باشد. هر جلسه بعد از ۳۰ دقیقه بی‌فعالیتی بسته می‌شود. بازدید مدیران و ربات‌ها شمرده نمی‌شود.',
          'Time is counted only while the tab is visible and the visitor interacted in the last minute. Sessions end after 30 minutes of inactivity. Staff and bot traffic is excluded.',
        )}
      </Note>
    </div>
  );
}
