'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Chip, Input, Textarea } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CheckCheck,
  Headset,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { consultationChatApi } from '@/common/api/consultation-chat';
import type { IConsultationConversation, IConsultationMessage } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';
import { ChatEmojiPicker } from '@/components/chat/ChatEmojiPicker';

const SESSION_STORAGE_KEY = 'hatefaroma_consultation_session';
const NAME_STORAGE_KEY = 'hatefaroma_consultation_name';

function createSessionToken() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function conversationTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? messageTime(value)
    : date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}

export function ConsultationChat() {
  const reduceMotion = useReducedMotion();
  const [sessionToken, setSessionToken] = useState('');
  const [guestName, setGuestName] = useState('');
  const [conversations, setConversations] = useState<IConsultationConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<IConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const lastMessageIdRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  ) || null;
  const openConversation = conversations.find((conversation) => conversation.status === 'open') || null;

  const appendMessages = useCallback((incoming: IConsultationMessage[]) => {
    if (!incoming.length) return;
    const newestIncomingId = incoming.at(-1)?.id;
    if (newestIncomingId && newestIncomingId > lastMessageIdRef.current) {
      lastMessageIdRef.current = newestIncomingId;
    }
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const additions = incoming.filter((message) => !known.has(message.id));
      if (!additions.length) return current;
      return [...current, ...additions].sort((a, b) => a.id.localeCompare(b.id));
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
        const items = await consultationChatApi.getConversations(token);
        if (cancelled) return;
        setConversations(items);
        setSelectedConversationId(items[0]?.id || '');
      } catch {
        if (!cancelled) setConnectionError('دریافت فهرست گفت‌وگوها ناموفق بود. دوباره تلاش کن.');
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    let busy = false;

    const syncConversations = async () => {
      if (busy) return;
      busy = true;
      try {
        const items = await consultationChatApi.getConversations(sessionToken);
        if (cancelled) return;
        setConversations(items);
        setSelectedConversationId((current) =>
          current && items.some((conversation) => conversation.id === current)
            ? current
            : items[0]?.id || '',
        );
        setConnectionError('');
      } catch {
        if (!cancelled) setConnectionError('ارتباط موقتاً قطع شده؛ در حال تلاش دوباره…');
      } finally {
        busy = false;
      }
    };

    const intervalId = window.setInterval(() => void syncConversations(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [sessionToken]);

  useEffect(() => {
    let cancelled = false;
    lastMessageIdRef.current = '';
    setMessages([]);

    if (!sessionToken || !selectedConversationId) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    void consultationChatApi.getMessages(sessionToken, selectedConversationId)
      .then((history) => {
        if (cancelled) return;
        setMessages(history);
        lastMessageIdRef.current = history.at(-1)?.id || '';
      })
      .catch(() => {
        if (!cancelled) setConnectionError('بارگذاری تاریخچهٔ گفت‌وگو ناموفق بود. دوباره تلاش کن.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !selectedConversationId || selectedConversation?.status !== 'open' || loadingMessages) {
      return;
    }

    let cancelled = false;
    let busy = false;
    const pollMessages = async () => {
      if (cancelled || busy) return;
      busy = true;
      try {
        const incoming = await consultationChatApi.getMessages(
          sessionToken,
          selectedConversationId,
          lastMessageIdRef.current || undefined,
        );
        if (cancelled) return;
        appendMessages(incoming);
        setConnectionError('');
      } catch {
        if (!cancelled) setConnectionError('ارتباط موقتاً قطع شده؛ در حال تلاش دوباره…');
      } finally {
        busy = false;
      }
    };

    const intervalId = window.setInterval(() => void pollMessages(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [appendMessages, loadingMessages, selectedConversation?.status, selectedConversationId, sessionToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages, reduceMotion]);

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDraft('');
    setConnectionError('');
  };

  const startNewConversation = async () => {
    if (!sessionToken || sending) return;
    if (openConversation) {
      selectConversation(openConversation.id);
      return;
    }

    setSending(true);
    setConnectionError('');
    try {
      const next = await consultationChatApi.startConversation(sessionToken, guestName.trim());
      setConversations((current) => [next, ...current.filter((item) => item.id !== next.id)]);
      setSelectedConversationId(next.id);
      setMessages([]);
      lastMessageIdRef.current = '';
      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, guestName.trim());
      } catch {
        // The active tab can continue without browser storage.
      }
    } catch {
      setConnectionError('گفت‌وگوی جدید شروع نشد. لطفاً دوباره تلاش کن.');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !sessionToken || sending || selectedConversation?.status === 'closed') return;

    setSending(true);
    setConnectionError('');
    try {
      let conversation = selectedConversation;
      if (!conversation) {
        conversation = await consultationChatApi.startConversation(sessionToken, guestName.trim());
        setConversations((current) => [conversation!, ...current.filter((item) => item.id !== conversation!.id)]);
        setSelectedConversationId(conversation.id);
        try {
          window.localStorage.setItem(NAME_STORAGE_KEY, guestName.trim());
        } catch {
          // The current tab can continue without browser storage.
        }
      }

      const message = await consultationChatApi.sendMessage(sessionToken, conversation.id, body);
      appendMessages([message]);
      setConversations((current) => current.map((item) => item.id === conversation!.id
        ? { ...item, lastMessageText: body, lastMessageAt: message.createdAt }
        : item));
      setDraft('');
    } catch (error: any) {
      setConnectionError(
        error?.response?.data?.message || 'پیام ارسال نشد. اتصال را بررسی کن و دوباره بفرست.',
      );
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setDraft((current) => `${current}${current && !/\s$/.test(current) ? ' ' : ''}${emoji}`);
  };

  const isClosed = selectedConversation?.status === 'closed';

  return (
    <section className="mx-auto w-full max-w-6xl py-8 sm:py-12" dir="rtl">
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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-olive text-brand-gold">
              <Headset className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-brand-surface bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold text-brand-text sm:text-base">مشاورهٔ هاتف آروما</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                {isClosed ? 'این گفت‌وگو پایان یافته' : 'پیام‌ها به‌صورت خودکار همگام می‌شوند'}
              </p>
            </div>
          </div>
          {!selectedConversation && (
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
        </header>

        <CardBody className="gap-0 p-0">
          <div className="grid min-h-[min(68vh,720px)] lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col border-b border-brand-border lg:border-b-0 lg:border-l">
              <div className="flex items-center justify-between gap-2 border-b border-brand-border p-3 sm:p-4">
                <div>
                  <h3 className="text-sm font-black text-brand-text">گفت‌وگوهای من</h3>
                  <p className="mt-1 text-[11px] text-brand-text-muted">
                    {toPersianDigits(conversations.length)} گفت‌وگو
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  isDisabled={sending || (!!openConversation && openConversation.id === selectedConversationId)}
                  onPress={() => void startNewConversation()}
                  startContent={openConversation ? <MessageCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  className="h-9 rounded-full bg-brand-gold px-3 text-xs font-bold text-brand-olive"
                >
                  {openConversation ? 'ادامهٔ گفت‌وگو' : 'گفت‌وگوی جدید'}
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
                {loadingConversations ? (
                  <div className="flex min-h-20 w-full items-center justify-center"><LoaderCircle className="h-5 w-5 animate-spin text-brand-gold" /></div>
                ) : conversations.length === 0 ? (
                  <div className="flex min-h-20 w-full items-center justify-center rounded-2xl bg-brand-surface-elevated px-4 text-center text-xs leading-6 text-brand-text-muted">
                    هنوز گفت‌وگویی نداری. پیام اولت را بفرست تا مشاوره شروع شود.
                  </div>
                ) : conversations.map((item) => {
                  const selected = item.id === selectedConversationId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectConversation(item.id)}
                      className={`min-w-[220px] rounded-2xl border p-3 text-right transition-colors lg:min-w-0 ${selected ? 'border-brand-gold bg-brand-surface-elevated' : 'border-brand-border bg-transparent hover:bg-brand-surface-elevated/70'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-extrabold text-brand-text">{item.guestName || 'مشتری مهمان'}</span>
                        <time className="shrink-0 text-[10px] text-brand-text-muted" dateTime={item.lastMessageAt}>{conversationTime(item.lastMessageAt)}</time>
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-brand-text-muted">{item.lastMessageText || 'گفت‌وگو آغاز شده است'}</span>
                        {item.unreadForGuest > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[10px] font-black text-brand-olive">
                            {toPersianDigits(item.unreadForGuest)}
                          </span>
                        ) : (
                          <span className={`shrink-0 text-[10px] font-bold ${item.status === 'open' ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-text-muted'}`}>
                            {item.status === 'open' ? 'باز' : 'پایان‌یافته'}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-[480px] min-w-0 flex-col">
              {selectedConversation && (
                <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-brand-text">
                      گفت‌وگو با {selectedConversation.guestName || 'کارشناس هاتف آروما'}
                    </h3>
                    <p className="mt-1 text-[11px] text-brand-text-muted">
                      شروع {conversationTime(selectedConversation.createdAt)}
                    </p>
                  </div>
                  <Chip size="sm" variant="flat" className={selectedConversation.status === 'open' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-default-100 text-default-500'}>
                    {selectedConversation.status === 'open' ? 'در جریان' : 'پایان‌یافته'}
                  </Chip>
                </div>
              )}

              <div
                className="flex-1 space-y-3 overflow-y-auto bg-brand-surface-elevated/40 px-3 py-4 sm:px-6 sm:py-6"
                aria-live="polite"
                aria-relevant="additions text"
              >
                {loadingConversations || loadingMessages ? (
                  <div className="flex h-full min-h-56 items-center justify-center text-sm text-brand-text-muted">
                    <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                    در حال بارگذاری گفت‌وگو…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-full items-center justify-center py-8">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface text-brand-gold">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <h3 className="font-extrabold text-brand-text">{selectedConversation ? 'هنوز پیامی در این گفت‌وگو نیست' : 'گفت‌وگو را شروع کن'}</h3>
                      <p className="mt-2 text-sm leading-7 text-brand-text-muted">
                        خواسته‌ات را دربارهٔ رایحه یا محصولی که دنبالش هستی بنویس. کارشناس پاسخ را در همین گفت‌وگو می‌فرستد.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-text-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" />
                        تاریخچه در همین مرورگر باقی می‌ماند
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
                          <div className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${mine ? 'items-start' : 'items-end'}`}>
                            <div className={`rounded-2xl px-4 py-2.5 shadow-xs ${mine ? 'rounded-tr-md bg-brand-olive text-[#f7f4ee]' : 'rounded-tl-md border border-brand-border bg-brand-surface text-brand-text'}`}>
                              {!mine && <div className="mb-1 text-[11px] font-extrabold text-brand-gold">{message.senderName}</div>}
                              <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-brand-text-muted">
                              <time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>
                              {mine && <CheckCheck className="h-3 w-3 text-brand-gold" />}
                            </div>
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
                  <p className="text-sm text-brand-text-muted">این گفت‌وگو پایان یافته؛ برای ادامه، گفت‌وگوی تازه‌ای باز کن.</p>
                  <Button
                    type="button"
                    onPress={() => void startNewConversation()}
                    isDisabled={sending}
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
                      isDisabled={loadingConversations || loadingMessages || sending}
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
                    <ChatEmojiPicker onSelect={addEmoji} isDisabled={loadingConversations || loadingMessages || sending} />
                    <Button
                      isIconOnly
                      type="submit"
                      aria-label="ارسال پیام"
                      isDisabled={!draft.trim() || loadingConversations || loadingMessages || sending}
                      isLoading={sending}
                      className="h-11 min-w-11 rounded-2xl bg-brand-gold text-brand-olive shadow-sm disabled:opacity-45"
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
            </section>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
