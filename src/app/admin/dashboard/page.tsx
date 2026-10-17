'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, CalendarDays, CalendarRange, LayoutDashboard, Package, RefreshCw, UserRound, Wallet } from 'lucide-react';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';
import type { Granularity } from '@/common/api/reports';
import { OverviewTab } from '@/components/admin/reports/OverviewTab';
import { FinanceTab } from '@/components/admin/reports/FinanceTab';
import { TrafficTab } from '@/components/admin/reports/TrafficTab';
import { ProductDetailModal, ProductsTab } from '@/components/admin/reports/ProductsTab';
import { VisitorDetailModal, VisitorsTab } from '@/components/admin/reports/VisitorsTab';
import { Segmented } from '@/components/admin/reports/ui';
import { JalaliRangePicker } from '@/components/admin/reports/JalaliRangePicker';
import {
  RANGE_PRESETS,
  type RangePreset,
  defaultGranularity,
  formatDateTime,
  formatJalaliLabel,
  presetRange,
  toRangeParams,
} from '@/components/admin/reports/format';

type TabKey = 'overview' | 'finance' | 'traffic' | 'products' | 'visitors';
const AUTO_REFRESH_MS = 60_000;

function DashboardContent() {
  const { isPersian } = useTranslation();
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = role === 'admin';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tr = (fa: string, en: string) => (isPersian ? fa : en);

  const requestedTab = (searchParams.get('tab') as TabKey) || 'overview';
  const tab: TabKey = requestedTab === 'finance' && !isAdmin ? 'overview' : requestedTab;
  const setTab = (next: TabKey) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('tab', next);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const [preset, setPreset] = useState<RangePreset>('30d');
  const [custom, setCustom] = useState<{ from: Date; to: Date } | null>(null);
  const [granularityOverride, setGranularityOverride] = useState<Granularity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());
  const [customOpen, setCustomOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // The sentinel scrolls past the sticky offset exactly when the bar becomes stuck.
    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
      rootMargin: `-${window.innerWidth >= 640 ? 89 : 77}px 0px 0px 0px`,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  const [visitorKey, setVisitorKey] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  // `to` follows "now" for open-ended presets, so it is recomputed on refresh.
  const range = useMemo(
    () => (preset === 'custom' && custom ? custom : presetRange(preset === 'custom' ? '30d' : preset)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, custom, refreshKey],
  );
  const granularity = granularityOverride || defaultGranularity(range.from, range.to);
  const params = useMemo(() => toRangeParams(range.from, range.to, granularity), [range, granularity]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((key) => key + 1);
        setRefreshedAt(new Date());
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = () => {
    setRefreshKey((key) => key + 1);
    setRefreshedAt(new Date());
  };

  const closeCustom = useCallback(() => setCustomOpen(false), []);
  const applyCustom = (from: Date, to: Date) => {
    setCustom({ from, to });
    setPreset('custom');
    setGranularityOverride(null);
    setCustomOpen(false);
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: tr('نمای کلی', 'Overview'), icon: LayoutDashboard },
    ...(isAdmin ? [{ key: 'finance' as TabKey, label: tr('مالی و حسابداری', 'Finance'), icon: Wallet }] : []),
    { key: 'traffic', label: tr('بازدید و رفتار', 'Traffic & behaviour'), icon: BarChart3 },
    { key: 'products', label: tr('تحلیل محصولات', 'Products'), icon: Package },
    { key: 'visitors', label: tr('کاربران و بازدیدکنندگان', 'People'), icon: UserRound },
  ];

  const tabProps = {
    params,
    isPersian,
    isAdmin,
    refreshKey,
    onOpenVisitor: setVisitorKey,
    onOpenProduct: setProductId,
  };

  return (
    <div className="space-y-6 pb-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">{tr('داشبورد تحلیل و حسابداری', 'Analytics & accounting')}</h1>
          <p className="mt-1 text-xs font-medium text-brand-text-muted">
            {tr(
              'درآمد، سفارش‌ها، بازدید سایت، رفتار کاربران و عملکرد محصولات — همه در یک جا',
              'Revenue, orders, site traffic, visitor behaviour and product performance in one place',
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-text-muted">
          <span>
            {tr('به‌روزرسانی:', 'Updated:')} {formatDateTime(refreshedAt.toISOString(), isPersian)}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 font-bold text-brand-text transition-colors hover:border-brand-gold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {tr('بارگذاری مجدد', 'Refresh')}
          </button>
        </div>
      </motion.header>

      <div ref={sentinelRef} aria-hidden className="mb-0 h-0" />
      {/* Once stuck, the band above the bar hides content scrolling between it and the floating navbar. */}
      <div
        className={`sticky top-[76px] z-20 -mx-1 space-y-3 rounded-3xl border border-brand-border bg-brand-surface p-3 transition-shadow sm:top-[88px] ${
          isStuck
            ? "shadow-[0_12px_32px_-18px_rgba(0,0,0,0.4)] before:pointer-events-none before:absolute before:inset-x-[-12px] before:bottom-full before:h-28 before:bg-brand-bg before:content-['']"
            : ''
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                    active ? 'bg-brand-text text-brand-bg' : 'text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <Segmented<Granularity>
            size="sm"
            value={granularity}
            onChange={setGranularityOverride}
            options={[
              { value: 'day', label: tr('روزانه', 'Daily'), disabled: (range.to.getTime() - range.from.getTime()) / 86_400_000 > 400 },
              { value: 'month', label: tr('ماهانه', 'Monthly') },
              { value: 'year', label: tr('سالانه', 'Yearly') },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="h-4 w-4 text-brand-text-muted" />
          {RANGE_PRESETS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setPreset(item.key);
                setGranularityOverride(null);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                preset === item.key ? 'bg-brand-gold text-[#141914]' : 'bg-brand-surface text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {isPersian ? item.fa : item.en}
            </button>
          ))}
          <button
            type="button"
            data-range-trigger
            aria-expanded={customOpen}
            onClick={() => setCustomOpen((open) => !open)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
              preset === 'custom' ? 'bg-brand-gold text-[#141914]' : 'bg-brand-surface text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {preset === 'custom' && custom
              ? `${formatJalaliLabel(custom.from, isPersian)} – ${formatJalaliLabel(new Date(custom.to.getTime() - 1), isPersian)}`
              : tr('انتخاب از تقویم', 'Pick from calendar')}
          </button>
        </div>
        <AnimatePresence>
          {customOpen && (
            <JalaliRangePicker
              isPersian={isPersian}
              initialFrom={range.from}
              initialTo={range.to}
              onApply={applyCustom}
              onClose={closeCustom}
            />
          )}
        </AnimatePresence>
      </div>

      {tab === 'overview' && <OverviewTab {...tabProps} />}
      {tab === 'finance' && isAdmin && <FinanceTab {...tabProps} />}
      {tab === 'traffic' && <TrafficTab {...tabProps} />}
      {tab === 'products' && <ProductsTab {...tabProps} />}
      {tab === 'visitors' && <VisitorsTab {...tabProps} />}

      <VisitorDetailModal visitorKey={visitorKey} params={params} isPersian={isPersian} isAdmin={isAdmin} onClose={() => setVisitorKey(null)} />
      <ProductDetailModal productId={productId} params={params} isPersian={isPersian} isAdmin={isAdmin} onClose={() => setProductId(null)} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
