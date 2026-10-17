'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  CornerDownLeft,
  Crown,
  FileSearch,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Package,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import axiosInstance from '@/common/axiosInstance';
import { resolveMediaUrl } from '@/common/constants/URL';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';
import { useAppSelector } from '@/stores/hooks';
import { ADMIN_SEARCH_EVENT } from '@/common/hooks/useAdminSearchParam';

interface SearchHit {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
}

type GroupKey = 'products' | 'orders' | 'users' | 'categories' | 'brands' | 'attributes' | 'coupons' | 'vipPlans' | 'chats';

interface Entry {
  key: string;
  group: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
  icon: LucideIcon;
  href: string;
}

const GROUPS: Record<GroupKey, { fa: string; en: string; icon: LucideIcon; href: (hit: SearchHit) => string }> = {
  products: { fa: 'محصولات', en: 'Products', icon: Package, href: (hit) => PATHS.ADMIN_PRODUCT_EDIT(hit.id) },
  orders: { fa: 'سفارش‌ها', en: 'Orders', icon: ShoppingBag, href: (hit) => `${PATHS.ADMIN_ORDERS}?q=${encodeURIComponent(hit.title)}` },
  users: { fa: 'کاربران', en: 'Users', icon: Users, href: (hit) => `${PATHS.ADMIN_USERS}?q=${encodeURIComponent(hit.title)}` },
  chats: { fa: 'گفتگوهای مشاوره', en: 'Consultations', icon: MessageSquare, href: () => PATHS.ADMIN_CONSULTATION_CHAT },
  categories: { fa: 'دسته‌بندی‌ها', en: 'Categories', icon: Layers, href: () => PATHS.ADMIN_CATEGORIES },
  brands: { fa: 'برندها', en: 'Brands', icon: Award, href: () => PATHS.ADMIN_BRANDS },
  attributes: { fa: 'ویژگی‌ها', en: 'Attributes', icon: Sparkles, href: () => PATHS.ADMIN_ATTRIBUTES },
  coupons: { fa: 'کدهای تخفیف', en: 'Coupons', icon: Ticket, href: () => PATHS.ADMIN_COUPONS },
  vipPlans: { fa: 'پلن‌های VIP', en: 'VIP plans', icon: Crown, href: () => PATHS.ADMIN_VIP_PLANS },
};
const GROUP_ORDER: GroupKey[] = ['products', 'orders', 'users', 'chats', 'categories', 'brands', 'attributes', 'coupons', 'vipPlans'];

const PAGES: { fa: string; en: string; href: string; icon: LucideIcon; adminOnly?: boolean; words: string }[] = [
  { fa: 'داشبورد و آمار فروش', en: 'Dashboard & sales', href: PATHS.ADMIN_DASHBOARD, icon: LayoutDashboard, words: 'داشبورد آمار گزارش مالی حسابداری dashboard analytics report finance' },
  { fa: 'مدیریت محصولات', en: 'Products', href: PATHS.ADMIN_PRODUCTS, icon: Package, words: 'محصولات عطر products' },
  { fa: 'تعریف محصول جدید', en: 'New product', href: PATHS.ADMIN_PRODUCT_NEW, icon: Package, words: 'محصول جدید افزودن ساخت new product add create' },
  { fa: 'دسته‌بندی‌ها', en: 'Categories', href: PATHS.ADMIN_CATEGORIES, icon: Layers, words: 'دسته categories' },
  { fa: 'برندها و خانه‌های عطر', en: 'Brands', href: PATHS.ADMIN_BRANDS, icon: Award, words: 'برند brands' },
  { fa: 'تنوع‌ها و ویژگی‌های عطر', en: 'Attributes', href: PATHS.ADMIN_ATTRIBUTES, icon: Sparkles, words: 'ویژگی تنوع attributes variants' },
  { fa: 'مدیریت سفارشات', en: 'Orders', href: PATHS.ADMIN_ORDERS, icon: ShoppingBag, words: 'سفارش orders' },
  { fa: 'گفت‌وگوهای مشاوره', en: 'Consultation chats', href: PATHS.ADMIN_CONSULTATION_CHAT, icon: MessageSquare, words: 'چت مشاوره گفتگو chat support' },
  { fa: 'کدهای تخفیف', en: 'Coupons', href: PATHS.ADMIN_COUPONS, icon: Ticket, adminOnly: true, words: 'کد تخفیف coupon discount' },
  { fa: 'پلن‌های اشتراک VIP', en: 'VIP plans', href: PATHS.ADMIN_VIP_PLANS, icon: Crown, adminOnly: true, words: 'vip اشتراک پلن plans' },
  { fa: 'مدیریت کاربران و نقش‌ها', en: 'Users & roles', href: PATHS.ADMIN_USERS, icon: Users, adminOnly: true, words: 'کاربر نقش users roles' },
  { fa: 'شخصی‌ساز صفحات و بخش‌ها', en: 'Page sections', href: PATHS.ADMIN_PAGE_SECTIONS, icon: Settings2, words: 'صفحه اصلی بنر بخش page sections homepage' },
];

const STATUS_LABELS: Record<string, [string, string]> = {
  pending: ['در انتظار', 'Pending'],
  processing: ['در حال پردازش', 'Processing'],
  shipped: ['ارسال شده', 'Shipped'],
  delivered: ['تحویل شده', 'Delivered'],
  cancelled: ['لغو شده', 'Cancelled'],
  open: ['باز', 'Open'],
  closed: ['بسته', 'Closed'],
  admin: ['ادمین', 'Admin'],
  editor: ['ویراستار', 'Editor'],
  vip: ['VIP', 'VIP'],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک');

/** Opens with Ctrl/Cmd+K (or "/"), searches every part of the admin panel at once. */
export function AdminSearch({ variant = 'pill' }: { variant?: 'pill' | 'icon' }) {
  const { isPersian, isRTL } = useTranslation();
  const role = useAppSelector((state) => state.auth.user?.role);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<Partial<Record<GroupKey, SearchHit[]>>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const tr = (fa: string, en: string) => (isPersian ? fa : en);
  const isAdmin = role === 'admin';

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setGroups({});
    setFailed(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((event.target as HTMLElement)?.tagName || '') || (event.target as HTMLElement)?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  // Debounced server search; late responses from older keystrokes are ignored.
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setGroups({});
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    const request = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      try {
        const res = await axiosInstance.get<{ groups: Partial<Record<GroupKey, SearchHit[]>> }>('/admin/search', { params: { q: trimmed } });
        if (request !== requestRef.current) return;
        setGroups(res.data.groups || {});
        setFailed(false);
      } catch {
        if (request === requestRef.current) {
          setGroups({});
          setFailed(true);
        }
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  const entries = useMemo<Entry[]>(() => {
    const needle = normalize(query.trim());
    const pages = PAGES.filter((page) => (!page.adminOnly || isAdmin) && (!needle || normalize(`${page.fa} ${page.en} ${page.words}`).includes(needle))).map(
      (page): Entry => ({ key: `page:${page.href}`, group: 'pages', title: isPersian ? page.fa : page.en, subtitle: page.href, icon: page.icon, href: page.href }),
    );
    const results: Entry[] = [];
    for (const group of GROUP_ORDER) {
      for (const hit of groups[group] || []) {
        results.push({
          key: `${group}:${hit.id}`,
          group,
          title: hit.title,
          subtitle: hit.subtitle,
          meta: hit.meta,
          image: hit.image,
          icon: GROUPS[group].icon,
          href: GROUPS[group].href(hit),
        });
      }
    }
    // Records first once a real query exists; otherwise the page list doubles as quick navigation.
    return needle.length >= 2 ? [...results, ...pages.slice(0, 5)] : pages;
  }, [groups, query, isAdmin, isPersian]);

  useEffect(() => setActive(0), [entries.length, query]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    close();
    router.push(entry.href);
    // Already on that list page? Tell it to re-read ?q= once the URL has updated.
    window.setTimeout(() => window.dispatchEvent(new Event(ADMIN_SEARCH_EVENT)), 200);
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(entries.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(entries[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const groupLabel = (group: string) => (group === 'pages' ? tr('بخش‌های پنل', 'Panel pages') : tr(GROUPS[group as GroupKey].fa, GROUPS[group as GroupKey].en));
  const metaLabel = (meta?: string) => (meta ? STATUS_LABELS[meta]?.[isPersian ? 0 : 1] || meta : undefined);
  const trimmed = query.trim();
  const showEmpty = trimmed.length >= 2 && !loading && !failed && !entries.some((entry) => entry.group !== 'pages');

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tr('جستجو در پنل', 'Search the panel')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3e4c3e] bg-[#242c24] text-[#e6dcce] shadow-sm transition-colors hover:border-[#bfa27a]/60 hover:bg-[#2e3a2e] hover:text-[#f7f4ee]"
      >
        <Search className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tr('جستجو در پنل', 'Search the panel')}
        className="hidden h-9 items-center gap-2 rounded-full border border-[#3e4c3e] bg-[#242c24] px-3 text-xs font-bold text-[#a69c8e] transition-all hover:border-brand-gold/50 hover:bg-[#2e3a2e] hover:text-[#f7f4ee] md:flex"
      >
        <Search className="h-3.5 w-3.5 text-brand-gold" />
        <span className="hidden xl:inline">{tr('جستجو در همه‌چیز…', 'Search everything…')}</span>
        <kbd className="rounded-md border border-[#3e4c3e] bg-[#1c231c] px-1.5 py-0.5 font-sans text-[10px] text-[#a69c8e]" dir="ltr">
          Ctrl K
        </kbd>
      </button>
    );

  return (
    <>
      {trigger}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[220] flex items-start justify-center px-3 pt-[9vh] sm:pt-[12vh]" dir={isRTL ? 'rtl' : 'ltr'}>
                <motion.div
                  className="absolute inset-0 bg-black/55"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  onClick={close}
                  aria-hidden
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={tr('جستجوی سراسری پنل', 'Global admin search')}
                  className="relative flex h-[min(34rem,76vh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-surface text-brand-text shadow-2xl dark:border-brand-gold/25"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3 border-b border-brand-border px-4 py-3.5">
                    <Search className="h-5 w-5 shrink-0 text-brand-bronze dark:text-brand-gold" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={onInputKeyDown}
                      // Empty: follow the UI direction so the placeholder is right-aligned in Persian.
                      // Typed text: pick the direction per content (Latin order numbers stay LTR).
                      dir={query ? 'auto' : isRTL ? 'rtl' : 'ltr'}
                      placeholder={tr('محصول، سفارش، کاربر، دسته، کد تخفیف، چت…', 'Products, orders, users, categories, coupons, chats…')}
                      aria-label={tr('عبارت جستجو', 'Search query')}
                      className="min-w-0 flex-1 bg-transparent text-start text-sm font-bold text-brand-text outline-none placeholder:font-semibold placeholder:text-brand-text-muted"
                    />
                    {loading && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" aria-label={tr('در حال جستجو', 'Searching')} />}
                    {query && !loading && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          inputRef.current?.focus();
                        }}
                        aria-label={tr('پاک کردن', 'Clear')}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-text-muted hover:bg-brand-surface-elevated hover:text-brand-text"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <kbd className="hidden shrink-0 rounded-md border border-brand-border bg-brand-surface-elevated px-1.5 py-0.5 font-sans text-[10px] font-bold text-brand-text-muted sm:block">Esc</kbd>
                  </div>

                  <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" role="listbox" aria-label={tr('نتایج', 'Results')}>
                    {failed && <p className="px-3 py-8 text-center text-xs font-bold text-rose-600 dark:text-rose-400">{tr('جستجو انجام نشد؛ دوباره تلاش کنید.', 'Search failed. Try again.')}</p>}
                    {showEmpty && (
                      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                        <FileSearch className="h-7 w-7 text-brand-text-muted/60" />
                        <p className="text-xs font-bold text-brand-text">{tr(`نتیجه‌ای برای «${trimmed}» پیدا نشد`, `No results for “${trimmed}”`)}</p>
                        <p className="text-[11px] text-brand-text-muted">{tr('نام، شماره سفارش، موبایل، ایمیل یا اسلاگ را امتحان کنید.', 'Try a name, order number, phone, email or slug.')}</p>
                      </div>
                    )}
                    {trimmed.length < 2 && (
                      <p className="px-3 pb-1 pt-2 text-[11px] font-bold text-brand-text-muted">{tr('پرش سریع به بخش‌ها — یا حداقل دو حرف تایپ کنید تا همه‌چیز جستجو شود', 'Jump to a section — or type 2+ characters to search everything')}</p>
                    )}
                    {entries.map((entry, index) => {
                      const showHeading = index === 0 || entries[index - 1].group !== entry.group;
                      const isActive = index === active;
                      const Icon = entry.icon;
                      const meta = metaLabel(entry.meta);
                      return (
                        <React.Fragment key={entry.key}>
                          {showHeading && trimmed.length >= 2 && (
                            <div className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wide text-brand-text-muted">{groupLabel(entry.group)}</div>
                          )}
                          <button
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            data-active={isActive}
                            onMouseMove={() => setActive(index)}
                            onClick={() => go(entry)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition-colors ${
                              isActive ? 'bg-brand-gold/15 ring-1 ring-brand-gold/40' : 'hover:bg-brand-surface-elevated'
                            }`}
                          >
                            {entry.image ? (
                              <Image src={resolveMediaUrl(entry.image)} alt="" width={36} height={36} unoptimized className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold">
                                <Icon className="h-4 w-4" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-black text-brand-text" dir="auto">{entry.title}</span>
                              {entry.subtitle && <span className="mt-0.5 block truncate text-[11px] font-semibold text-brand-text-muted" dir="auto">{entry.subtitle}</span>}
                            </span>
                            {meta && <span className="shrink-0 rounded-full bg-brand-surface-elevated px-2 py-0.5 text-[10px] font-bold text-brand-text-muted">{meta}</span>}
                            {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand-bronze dark:text-brand-gold" />}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-brand-border bg-brand-surface-elevated/60 px-4 py-2 text-[10px] font-semibold text-brand-text-muted">
                    <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-3 w-3" />{tr('جستجو در محصولات، سفارش‌ها، کاربران، دسته‌ها، برندها، ویژگی‌ها، کدها و چت‌ها', 'Searches products, orders, users, categories, brands, attributes, coupons and chats')}</span>
                    <span className="hidden shrink-0 sm:inline" dir="ltr">↑ ↓ · Enter · Esc</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
