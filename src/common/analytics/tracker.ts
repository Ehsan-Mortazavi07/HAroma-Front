'use client';

import { BASE_API_URL } from '../constants/URL';

/**
 * First-party visitor analytics. Measures engaged time (tab visible and the
 * visitor interacted within the last minute) per page view and ships batches
 * to `/analytics/collect` as text/plain so beacons never need a preflight.
 */

const VISITOR_KEY = 'hatefaroma_vid';
const SESSION_KEY = 'hatefaroma_sid';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_AFTER_MS = 60 * 1000;
const FLUSH_INTERVAL_MS = 15 * 1000;
const COLLECT_URL = `${BASE_API_URL}/analytics/collect`;

type TrackerEvent = Record<string, unknown> & { t: 'view' | 'ping' | 'event' };
export type TrackedEventName = 'add_to_cart' | 'begin_checkout' | 'purchase';

let queue: TrackerEvent[] = [];
let currentView: { id: string; activeSeconds: number; reportedSeconds: number; scrollDepth: number } | null = null;
let lastInteractionAt = Date.now();
let started = false;
let lastView = { key: '', at: 0 };

function randomId(length = 32): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode: ids live for this page load only.
  }
}

let memoryVisitorId = '';
function visitorId(): string {
  const stored = readStorage(VISITOR_KEY);
  if (stored && /^[A-Za-z0-9_-]{16,64}$/.test(stored)) return stored;
  memoryVisitorId ||= randomId();
  writeStorage(VISITOR_KEY, memoryVisitorId);
  return memoryVisitorId;
}

let memorySession: { id: string; last: number } | null = null;
function sessionId(): string {
  const now = Date.now();
  let session = memorySession;
  try {
    const stored = JSON.parse(readStorage(SESSION_KEY) || 'null');
    if (stored && typeof stored.id === 'string' && typeof stored.last === 'number') session = stored;
  } catch {
    // Corrupt value; start a fresh session.
  }
  if (!session || now - session.last > SESSION_TIMEOUT_MS) session = { id: randomId(), last: now };
  session.last = now;
  memorySession = session;
  writeStorage(SESSION_KEY, JSON.stringify(session));
  return session.id;
}

function isTrackablePath(pathname: string) {
  return !pathname.startsWith('/admin');
}

function send(useBeacon: boolean) {
  if (!queue.length) return;
  const payload = JSON.stringify({ v: visitorId(), s: sessionId(), e: queue.splice(0, 40) });
  const body = new Blob([payload], { type: 'text/plain' });
  try {
    if (useBeacon && navigator.sendBeacon?.(COLLECT_URL, body)) return;
    void fetch(COLLECT_URL, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'text/plain' },
      credentials: 'include',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the storefront.
  }
  if (queue.length) send(useBeacon);
}

function queuePing() {
  if (!currentView || currentView.activeSeconds === currentView.reportedSeconds) return;
  currentView.reportedSeconds = currentView.activeSeconds;
  queue.push({ t: 'ping', id: currentView.id, a: currentView.activeSeconds, d: currentView.scrollDepth });
}

function measureScroll() {
  if (!currentView) return;
  const doc = document.documentElement;
  const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
  const depth = doc.scrollHeight <= window.innerHeight ? 100 : Math.round((window.scrollY / scrollable) * 100);
  currentView.scrollDepth = Math.max(currentView.scrollDepth, Math.min(100, depth));
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const markActive = () => {
    lastInteractionAt = Date.now();
  };
  for (const name of ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel']) {
    window.addEventListener(name, markActive, { passive: true });
  }
  window.addEventListener('scroll', () => {
    markActive();
    measureScroll();
  }, { passive: true });

  window.setInterval(() => {
    if (!currentView || document.visibilityState !== 'visible') return;
    if (Date.now() - lastInteractionAt > IDLE_AFTER_MS) return;
    currentView.activeSeconds += 1;
  }, 1000);

  window.setInterval(() => {
    queuePing();
    send(false);
  }, FLUSH_INTERVAL_MS);

  const flushOnExit = () => {
    queuePing();
    send(true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnExit();
    else markActive();
  });
  window.addEventListener('pagehide', flushOnExit);
}

/** Records a page view; call on every client-side navigation. */
export function trackPageView(pathname: string, search: string) {
  if (typeof window === 'undefined') return;
  // React Strict Mode (and some router transitions) fire the same navigation twice.
  const key = `${pathname}?${search}`;
  if (lastView.key === key && Date.now() - lastView.at < 1500) return;
  lastView = { key, at: Date.now() };
  start();
  queuePing();
  if (!isTrackablePath(pathname)) {
    currentView = null;
    send(false);
    return;
  }

  const params = new URLSearchParams(search);
  const utm = params.get('utm_source')
    ? { source: params.get('utm_source'), campaign: params.get('utm_campaign') || '' }
    : undefined;
  const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : '';
  const q = params.get('q');

  currentView = { id: randomId(), activeSeconds: 0, reportedSeconds: 0, scrollDepth: 0 };
  lastInteractionAt = Date.now();
  queue.push({ t: 'view', id: currentView.id, p: q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, r: referrer, utm });
  window.setTimeout(measureScroll, 500);
  send(false);
}

/** Records a commerce event such as add-to-cart or a completed purchase. */
export function trackEvent(name: TrackedEventName, data: { productId?: string; quantity?: number; value?: number } = {}) {
  if (typeof window === 'undefined' || !isTrackablePath(window.location.pathname)) return;
  start();
  queue.push({ t: 'event', n: name, pid: data.productId, q: data.quantity, val: data.value });
  send(false);
}
