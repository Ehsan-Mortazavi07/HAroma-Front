'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Input, Textarea } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Headset, LoaderCircle, MessageCircle, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { consultationChatApi } from '@/common/api/consultation-chat';
import type { IConsultationConversation, IConsultationMessage } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';

const SESSION_STORAGE_KEY = 'hatefaroma_consultation_session';
const NAME_STORAGE_KEY = 'hatefaroma_consultation_name';

function createSessionToken() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export function ConsultationChat() {
  const reduceMotion = useReducedMotion();
  const [sessionToken, setSessionToken] = useState('');
  const [guestName, setGuestName] = useState('');
  const [conversation, setConversation] = useState<IConsultationConversation | null>(null);
  const [messages, setMessages] = useState<IConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const lastMessageIdRef = useRef('');
  const pollBusyRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const appendMessages = useCallback((incoming: IConsultationMessage[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const additions = incoming.filter((message) => !known.has(message.id));
      if (!additions.length) return current;
      const combined = [...current, ...additions].sort((a, b) => a.id.localeCompare(b.id));
      lastMessageIdRef.current = combined.at(-1)?.id || lastMessageIdRef.current;
      return combined;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      let token = '';
      let savedName = '';
      try {
        token = window.localStorage.getItem(SESSION_STORAGE_KEY) || '';
        savedName = window.localStorage.getItem(NAME_STORAGE_KEY) || '';
        if (!token) {
          token = createSessionToken();
          window.localStorage.setItem(SESSION_STORAGE_KEY, token);
        }
      } catch {
        token = createSessionToken();
      }
      if (cancelled) return;
      setSessionToken(token);
      setGuestName(savedName);

      try {
        const current = await consultationChatApi.getCurrentConversation(token);
        if (cancelled) return;
        setConversation(current);
        if (current) {
          const history = await consultationChatApi.getMessages(token, current.id);
          if (cancelled) return;
          lastMessageIdRef.current = history.at(-1)?.id || '';
          setMessages(history);
        }
      } catch {
        if (!cancelled) setConnectionError('اتصال به گفت‌وگوی پشتیبانی برقرار نشد. دوباره تلاش کن.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionToken || !conversation || conversation.status !== 'open') return;

    const pollMessages = async () => {
      if (pollBusyRef.current) return;
      pollBusyRef.current = true;
      try {
        const incoming = await consultationChatApi.getMessages(
          sessionToken,
          conversation.id,
          lastMessageIdRef.current || undefined,
        );
        appendMessages(incoming);
        setConnectionError('');
      } catch {
        setConnectionError('ارتباط موقتاً قطع شده؛ در حال تلاش دوباره…');
      } finally {
        pollBusyRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => void pollMessages(), 3000);
    return () => window.clearInterval(intervalId);
  }, [appendMessages, conversation, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !conversation || conversation.status !== 'open') return;
    let cancelled = false;
    let busy = false;

    const syncConversation = async () => {
      if (busy) return;
      busy = true;
      try {
        const current = await consultationChatApi.getCurrentConversation(sessionToken);
        if (cancelled || !current) return;

        if (current.id !== conversation.id) {
          const history = await consultationChatApi.getMessages(sessionToken, current.id);
          if (cancelled) return;
          lastMessageIdRef.current = history.at(-1)?.id || '';
          setMessages(history);
          setConversation(current);
          return;
        }

        if (current.status !== conversation.status) setConversation(current);
      } catch {
        // Message polling reports connection issues; this check only synchronizes chat status.
      } finally {
        busy = false;
      }
    };

    const intervalId = window.setInterval(() => void syncConversation(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [conversation, sessionToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages, reduceMotion]);

  const sendMessage = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !sessionToken || sending || conversation?.status === 'closed') return;

    setSending(true);
    setConnectionError('');
    try {
      let activeConversation = conversation;
      if (!activeConversation) {
        activeConversation = await consultationChatApi.startConversation(sessionToken, guestName.trim());
        setConversation(activeConversation);
        try {
          window.localStorage.setItem(NAME_STORAGE_KEY, guestName.trim());
        } catch {
          // The current tab can continue without browser storage.
        }
      }
      const message = await consultationChatApi.sendMessage(sessionToken, activeConversation.id, body);
      appendMessages([message]);
      setDraft('');
    } catch (error: any) {
      setConnectionError(
        error?.response?.data?.message || 'پیام ارسال نشد. اتصال را بررسی کن و دوباره بفرست.',
      );
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async () => {
    if (!sessionToken || sending) return;
    setSending(true);
    setConnectionError('');
    try {
      const next = await consultationChatApi.startConversation(sessionToken, guestName.trim());
      setConversation(next);
      setMessages([]);
      setDraft('');
      lastMessageIdRef.current = '';
    } catch {
      setConnectionError('گفت‌وگوی جدید شروع نشد. لطفاً دوباره تلاش کن.');
    } finally {
      setSending(false);
    }
  };

  const isClosed = conversation?.status === 'closed';

  return (
    <section className="mx-auto w-full max-w-5xl py-8 sm:py-12" dir="rtl">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-gold">
          <Headset className="h-3.5 w-3.5" />
          مشاوره تخصصی عطر
        </div>
        <h1 className="text-2xl font-black leading-tight text-brand-text sm:text-3xl">
          با کارشناس هاتف آروما گفت‌وگو کن
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-text-muted">
          خواسته‌ات را بنویس؛ پیام به پنل مشاوره می‌رسد و پاسخ کارشناس را همین‌جا می‌بینی.
        </p>
      </motion.div>

      <Card className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-olive text-brand-gold">
              <Headset className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-brand-surface bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold text-brand-text sm:text-base">مشاورهٔ هاتف آروما</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                {isClosed ? 'این گفت‌وگو بسته شده' : 'پیام‌ها به‌صورت خودکار همگام می‌شوند'}
              </p>
            </div>
          </div>
          {!conversation && (
            <Input
              aria-label="نام شما، اختیاری"
              value={guestName}
              onValueChange={setGuestName}
              maxLength={80}
              placeholder="نام شما (اختیاری)"
              variant="bordered"
              radius="full"
              className="w-full sm:max-w-56"
              classNames={{
                inputWrapper: 'min-h-10 border-brand-border bg-brand-surface-elevated shadow-none',
                input: 'text-xs text-brand-text placeholder:text-brand-text-muted',
              }}
            />
          )}
        </div>

        <CardBody className="gap-0 p-0">
          <div className="flex h-[min(68vh,720px)] min-h-[480px] flex-col">
            <div
              className="flex-1 space-y-3 overflow-y-auto bg-brand-surface-elevated/40 px-3 py-4 sm:px-6 sm:py-6"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-brand-text-muted">
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                  در حال بارگذاری گفت‌وگو…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center py-8">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface text-brand-gold">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-extrabold text-brand-text">گفت‌وگو را شروع کن</h3>
                    <p className="mt-2 text-sm leading-7 text-brand-text-muted">
                      بگو دنبال چه عطری هستی، چه رایحه‌هایی را دوست داری یا دربارهٔ یک محصول مشخص بپرس. کارشناس پاسخ را در همین گفت‌وگو می‌فرستد.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-text-muted">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" />
                      تاریخچهٔ گفت‌وگو در همین مرورگر باقی می‌ماند
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const mine = message.senderRole === 'customer';
                    return (
                      <motion.div
                        key={message.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`flex ${mine ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[88%] sm:max-w-[75%] ${mine ? 'items-start' : 'items-end'} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-xs ${
                              mine
                                ? 'rounded-tr-md bg-brand-olive text-[#f7f4ee]'
                                : 'rounded-tl-md border border-brand-border bg-brand-surface text-brand-text'
                            }`}
                          >
                            {!mine && <div className="mb-1 text-[11px] font-extrabold text-brand-gold">{message.senderName}</div>}
                            <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                          </div>
                          <time className="mt-1 px-1 text-[10px] text-brand-text-muted" dateTime={message.createdAt}>
                            {messageTime(message.createdAt)}
                          </time>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {connectionError && (
              <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                {connectionError}
              </div>
            )}

            {isClosed ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border p-4">
                <p className="text-sm text-brand-text-muted">برای ادامهٔ مشاوره، گفت‌وگوی تازه‌ای باز کن.</p>
                <Button
                  type="button"
                  onPress={() => void startNewConversation()}
                  isLoading={sending}
                  startContent={!sending && <RefreshCw className="h-4 w-4" />}
                  className="rounded-full bg-brand-gold px-5 font-bold text-brand-olive"
                >
                  گفت‌وگوی جدید
                </Button>
              </div>
            ) : (
              <form onSubmit={(event) => void sendMessage(event)} className="border-t border-brand-border p-3 sm:p-4">
                <div className="flex items-end gap-2 sm:gap-3">
                  <Textarea
                    aria-label="متن پیام"
                    value={draft}
                    onValueChange={setDraft}
                    maxLength={2000}
                    minRows={1}
                    maxRows={4}
                    isDisabled={loading || sending}
                    placeholder="پیامت را بنویس…"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(event);
                      }
                    }}
                    variant="bordered"
                    classNames={{
                      inputWrapper: 'min-h-12 rounded-2xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
                      input: 'py-2 text-sm leading-6 text-brand-text placeholder:text-brand-text-muted',
                    }}
                  />
                  <Button
                    isIconOnly
                    type="submit"
                    aria-label="ارسال پیام"
                    isDisabled={!draft.trim() || loading || sending}
                    isLoading={sending}
                    className="h-12 min-w-12 rounded-2xl bg-brand-gold text-brand-olive shadow-sm disabled:opacity-45"
                  >
                    {!sending && <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="mt-2 flex justify-between px-1 text-[10px] text-brand-text-muted">
                  <span>Enter برای ارسال · Shift + Enter برای خط جدید</span>
                  <span>{toPersianDigits(draft.length)} / {toPersianDigits(2000)}</span>
                </div>
              </form>
            )}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
