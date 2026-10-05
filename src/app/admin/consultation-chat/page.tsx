'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Chip, Spinner, Textarea } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Archive,
  Check,
  CheckCheck,
  CircleDot,
  Clock3,
  Inbox,
  MessageCircle,
  Trash2,
  RotateCcw,
  Send,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { ChatEmojiPicker } from '@/components/chat/ChatEmojiPicker';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import type { IConsultationConversation, IConsultationMessage } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';
import { useAppSelector } from '@/stores/hooks';

type ConversationFilter = 'pending' | 'open' | 'closed' | 'all';

function statusLabel(status: IConsultationConversation['status']) {
  if (status === 'pending') return 'در انتظار تأیید';
  if (status === 'open') return 'باز';
  return 'بسته';
}

function shortTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}

function fullTime(value: string) {
  return new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminConsultationChatPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [conversations, setConversations] = useState<IConsultationConversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [messages, setMessages] = useState<IConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [conversationToClose, setConversationToClose] = useState<IConsultationConversation | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<IConsultationConversation | null>(null);
  const [error, setError] = useState('');
  const lastMessageIdRef = useRef('');
  const conversationRequestIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!isAdmin) {
      setLoadingInbox(false);
      return;
    }
    const requestId = ++conversationRequestIdRef.current;
    try {
      const items = await adminApi.getConsultationConversations(filter);
      if (requestId !== conversationRequestIdRef.current) return;
      setConversations(items);
      setSelectedId((current) =>
        current && items.some((conversation) => conversation.id === current)
          ? current
          : items[0]?.id || '',
      );
      setError('');
    } catch (requestError: any) {
      if (requestId !== conversationRequestIdRef.current) return;
      setError(requestError?.response?.data?.message || 'دریافت گفت‌وگوها ناموفق بود.');
    } finally {
      if (requestId === conversationRequestIdRef.current) setLoadingInbox(false);
    }
  }, [filter, isAdmin]);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    setMessages([]);
    lastMessageIdRef.current = '';
    if (!selectedId || !isAdmin) return;
    let cancelled = false;
    let pollBusy = false;

    const pollMessages = async () => {
      if (cancelled || pollBusy) return;
      pollBusy = true;
      try {
        const incoming = await adminApi.getConsultationMessages(
          selectedId,
          lastMessageIdRef.current || undefined,
        );
        if (cancelled || !incoming.length) return;
        const newestIncomingId = incoming.at(-1)?.id;
        if (newestIncomingId && newestIncomingId > lastMessageIdRef.current) {
          lastMessageIdRef.current = newestIncomingId;
        }
        setMessages((current) => {
          const known = new Set(current.map((message) => message.id));
          const additions = incoming.filter((message) => !known.has(message.id));
          return [...current, ...additions].sort((a, b) => a.id.localeCompare(b.id));
        });
      } catch {
        // Keep the current messages visible and retry on the next poll.
      } finally {
        pollBusy = false;
      }
    };

    let timer: number | undefined;
    void adminApi.getConsultationMessages(selectedId)
      .then((history) => {
        if (cancelled) return;
        setMessages(history);
        lastMessageIdRef.current = history.at(-1)?.id || '';
      })
      .catch((requestError: any) => {
        if (!cancelled) setError(requestError?.response?.data?.message || 'بارگذاری پیام‌ها ناموفق بود.');
      })
      .finally(() => {
        if (!cancelled) timer = window.setInterval(() => void pollMessages(), 3000);
      });

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [isAdmin, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages, reduceMotion]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;

  const sendReply = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending || selectedConversation?.status !== 'open') return;
    setSending(true);
    setError('');
    try {
      const message = await adminApi.sendConsultationMessage(selectedId, body);
      if (message.id > lastMessageIdRef.current) lastMessageIdRef.current = message.id;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message].sort((a, b) => a.id.localeCompare(b.id));
      });
      setDraft('');
      void loadConversations();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'پاسخ ارسال نشد. دوباره تلاش کن.');
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setDraft((current) => `${current}${current && !/\s$/.test(current) ? ' ' : ''}${emoji}`);
  };

  const updateStatus = async (
    conversationId: string,
    nextStatus: 'open' | 'closed',
  ): Promise<boolean> => {
    if (updatingStatus) return false;
    setUpdatingStatus(true);
    try {
      const updated = await adminApi.setConsultationConversationStatus(conversationId, nextStatus);
      const closedAt = new Date().toISOString();
      setConversations((current) => current.map((item) => {
        if (item.id === updated.id) return updated;
        if (nextStatus === 'open' && updated.userId && item.userId === updated.userId && item.status === 'open') {
          return { ...item, status: 'closed', closedAt, closedByAdminId: null, closedByAdminName: '' };
        }
        return item;
      }));
      setFilter(nextStatus);
      setError('');
      return true;
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'وضعیت گفت‌وگو تغییر نکرد.');
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteConversation = async () => {
    if (!conversationToDelete || deletingConversation) return;
    setDeletingConversation(true);
    try {
      await adminApi.deleteConsultationConversation(conversationToDelete.id);
      const remaining = conversations.filter((item) => item.id !== conversationToDelete.id);
      setConversations(remaining);
      if (selectedId === conversationToDelete.id) {
        setSelectedId(remaining[0]?.id || '');
        setMessages([]);
        setMobileDetailOpen(false);
      }
      setConversationToDelete(null);
      setError('');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'حذف گفت‌وگو انجام نشد.');
    } finally {
      setDeletingConversation(false);
    }
  };

  if (user && !isAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6" dir="rtl">
        <Card className="rounded-3xl border border-brand-border bg-brand-surface">
          <CardBody className="p-8 text-center">
            <h1 className="text-xl font-black text-brand-text">دسترسی محدود است</h1>
            <p className="mt-2 text-sm text-brand-text-muted">صندوق گفت‌وگوها فقط برای نقش ادمین در دسترس است.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-5" dir="rtl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-bold text-brand-gold">
            <MessageCircle className="h-4 w-4" />
            پشتیبانی مشتریان
          </div>
          <h1 className="text-2xl font-black text-brand-text">گفت‌وگوهای مشاوره</h1>
          <p className="mt-1 text-sm text-brand-text-muted">پیام مشتری را بخوان و پاسخ را در همین صفحه بفرست.</p>
        </div>
        <Chip startContent={<CircleDot className="h-3 w-3 text-emerald-500" />} variant="flat" className="border border-brand-border bg-brand-surface text-brand-text-muted">
          همگام‌سازی خودکار
        </Chip>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-sm">
        <div className="grid min-h-[min(76vh,820px)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className={`${mobileDetailOpen ? 'hidden' : 'flex'} min-h-0 flex-col border-b border-brand-border lg:flex lg:border-b-0 lg:border-l`}>
            <div className="border-b border-brand-border p-4">
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-brand-surface-elevated p-1">
                {([
                  ['pending', 'در انتظار'],
                  ['open', 'باز'],
                  ['closed', 'بسته'],
                  ['all', 'همه'],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={filter === value ? 'solid' : 'light'}
                    onPress={() => setFilter(value)}
                    className={`h-11 min-w-0 rounded-xl text-[11px] font-bold ${filter === value ? 'bg-brand-gold text-brand-olive' : 'text-brand-text-muted'}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingInbox ? (
                <div className="flex h-40 items-center justify-center"><Spinner color="warning" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                  <Inbox className="h-8 w-8 text-brand-text-muted/50" />
                  <p className="mt-3 text-sm font-bold text-brand-text">گفت‌وگویی در این بخش نیست</p>
                  <p className="mt-1 text-xs leading-6 text-brand-text-muted">پیام‌های جدید مشتریان اینجا نمایش داده می‌شود.</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border/70">
                  {conversations.map((item) => {
                    const selected = item.id === selectedId;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSelectedId(item.id);
                          setMobileDetailOpen(true);
                        }}
                        className={`w-full px-4 py-4 text-right transition-colors hover:bg-brand-surface-elevated ${selected ? 'bg-brand-surface-elevated' : 'bg-transparent'}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${selected ? 'bg-brand-gold text-brand-olive' : 'bg-brand-olive text-brand-gold'}`}>
                            {(item.guestName || 'م').slice(0, 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-extrabold text-brand-text">{item.guestName || 'مشتری مهمان'}</span>
                              <time className="shrink-0 text-[10px] text-brand-text-muted" dateTime={item.lastMessageAt}>{shortTime(item.lastMessageAt)}</time>
                            </span>
                            <span className="mt-1 block truncate text-[11px] font-bold text-brand-gold">{item.subject || 'مشاوره'}</span>
                            <span className="mt-1 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-brand-text-muted">{item.lastMessageText || (item.status === 'pending' ? 'درخواست مشاوره ثبت شده' : 'گفت‌وگو آغاز شده است')}</span>
                              {!!item.unreadForAdmin && (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[10px] font-black text-brand-olive">
                                  {toPersianDigits(item.unreadForAdmin)}
                                </span>
                              )}
                            </span>
                            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : item.status === 'open' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-default-100 text-default-500'}`}>
                              {statusLabel(item.status)}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-brand-text-muted" dir="ltr">
                              {item.guestPhone && <span>{item.guestPhone}</span>}
                              {item.guestEmail && <span className="max-w-[180px] truncate">{item.guestEmail}</span>}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className={`${mobileDetailOpen ? 'flex' : 'hidden'} min-h-[min(76vh,820px)] min-w-0 flex-col lg:flex lg:min-h-0`}>
            {selectedConversation ? (
              <>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-3 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      type="button"
                      isIconOnly
                      aria-label="بازگشت به فهرست گفتگوها"
                      onPress={() => setMobileDetailOpen(false)}
                      className="h-11 min-w-11 shrink-0 rounded-2xl bg-brand-surface-elevated text-brand-text lg:hidden"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-olive font-extrabold text-brand-gold">
                      {(selectedConversation.guestName || 'م').slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-extrabold text-brand-text">{selectedConversation.guestName || 'مشتری مهمان'}</h2>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-brand-gold">موضوع: {selectedConversation.subject || 'مشاوره'}</p>
                      <p className="mt-0.5 text-[11px] text-brand-text-muted">
                        {selectedConversation.status === 'pending'
                          ? `درخواست ثبت‌شده · ${shortTime(selectedConversation.createdAt)}`
                          : selectedConversation.status === 'open'
                            ? `گفت‌وگوی باز · شروع ${shortTime(selectedConversation.createdAt)}`
                            : `پایان ${selectedConversation.closedAt ? shortTime(selectedConversation.closedAt) : ''}${selectedConversation.closedByAdminName ? ` توسط ${selectedConversation.closedByAdminName}` : ''}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-brand-text-muted">
                        {selectedConversation.guestPhone && <span dir="ltr">{selectedConversation.guestPhone}</span>}
                        {selectedConversation.guestEmail && <span dir="ltr">{selectedConversation.guestEmail}</span>}
                        {selectedConversation.guestUsername && <span dir="ltr">@{selectedConversation.guestUsername}</span>}
                        {(selectedConversation.guestCity || selectedConversation.guestProvince) && (
                          <span>{[selectedConversation.guestCity, selectedConversation.guestProvince].filter(Boolean).join('، ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="flat"
                      isDisabled={updatingStatus}
                      onPress={() => {
                        if (selectedConversation.status === 'open') {
                          setConversationToClose(selectedConversation);
                        } else {
                          void updateStatus(selectedConversation.id, 'open');
                        }
                      }}
                      startContent={selectedConversation.status === 'pending'
                        ? <Check className="h-4 w-4" />
                        : selectedConversation.status === 'open'
                          ? <Archive className="h-4 w-4" />
                          : <RotateCcw className="h-4 w-4" />}
                      className="min-h-11 rounded-full bg-brand-surface-elevated font-bold text-brand-text"
                    >
                      {selectedConversation.status === 'pending'
                        ? 'تأیید و شروع چت'
                        : selectedConversation.status === 'open' ? 'بستن گفت‌وگو' : 'بازگشایی'}
                    </Button>
                    <Button
                      type="button"
                      isIconOnly
                      size="sm"
                      aria-label="حذف گفت‌وگو"
                      isDisabled={deletingConversation}
                      onPress={() => setConversationToDelete(selectedConversation)}
                      className="h-11 min-w-11 rounded-full text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-brand-surface-elevated/35 px-3 py-4 sm:px-6">
                  {selectedConversation.status === 'pending' ? (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                      <Clock3 className="h-8 w-8 text-amber-600 dark:text-amber-300" />
                      <p className="mt-3 text-sm font-bold text-brand-text">درخواست منتظر تأیید شماست</p>
                      <p className="mt-1 max-w-sm text-xs leading-6 text-brand-text-muted">پس از تأیید، مشتری می‌تواند در همین گفتگو پیام بفرستد.</p>
                    </div>
                  ) : messages.length === 0 && (
                    <div className="flex h-full min-h-48 items-center justify-center text-sm text-brand-text-muted">هنوز پیامی ارسال نشده است.</div>
                  )}
                  <AnimatePresence initial={false}>
                    {messages.map((message) => {
                      const mine = message.senderRole === 'admin';
                      return (
                        <motion.div
                          key={message.id}
                          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.16 }}
                          className={`flex ${mine ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex max-w-[88%] flex-col ${mine ? 'items-start' : 'items-end'} sm:max-w-[75%]`}>
                            <div className={`rounded-2xl px-4 py-2.5 ${mine ? 'rounded-tr-md bg-brand-olive text-[#f7f4ee]' : 'rounded-tl-md border border-brand-border bg-brand-surface text-brand-text'}`}>
                              {!mine && <p className="mb-1 text-[11px] font-extrabold text-brand-gold">{message.senderName}</p>}
                              <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-brand-text-muted">
                              <time dateTime={message.createdAt}>{fullTime(message.createdAt)}</time>
                              {mine && (selectedConversation.lastAdminMessageReadAt
                                && new Date(selectedConversation.lastAdminMessageReadAt).getTime() >= new Date(message.createdAt).getTime()
                                ? <CheckCheck aria-label="خوانده‌شده" className="h-3.5 w-3.5 text-brand-gold" />
                                : <Check aria-label="ارسال‌شده" className="h-3.5 w-3.5" />)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {error && <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{error}</div>}

                {selectedConversation.status === 'open' ? (
                  <form onSubmit={(event) => void sendReply(event)} className="border-t border-brand-border p-3 sm:p-4">
                    <div className="flex items-end gap-2 sm:gap-3">
                      <Textarea
                        className="min-w-0 flex-1"
                        aria-label="پاسخ به مشتری"
                        value={draft}
                        onValueChange={setDraft}
                        maxLength={2000}
                        minRows={1}
                        maxRows={4}
                        placeholder="پاسخت را بنویس…"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void sendReply(event);
                          }
                        }}
                        variant="bordered"
                        classNames={{
                          inputWrapper: 'min-h-12 rounded-2xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
                          input: 'py-2 text-sm leading-6 text-brand-text placeholder:text-brand-text-muted',
                        }}
                      />
                      <ChatEmojiPicker onSelect={addEmoji} isDisabled={sending} />
                      <Button
                        isIconOnly
                        type="submit"
                        aria-label="ارسال پاسخ"
                        isDisabled={!draft.trim() || sending}
                        isLoading={sending}
                        className="h-12 min-w-12 rounded-2xl bg-brand-gold text-brand-olive disabled:opacity-45"
                      >
                        {!sending && <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 px-1 text-[10px] text-brand-text-muted">Enter برای ارسال · Shift + Enter برای خط جدید</p>
                  </form>
                ) : selectedConversation.status === 'pending' ? (
                  <div className="border-t border-brand-border p-4 text-center text-sm text-brand-text-muted">با تأیید درخواست، کادر ارسال پاسخ فعال می‌شود.</div>
                ) : (
                  <div className="border-t border-brand-border p-4 text-center text-sm text-brand-text-muted">برای پاسخ‌دادن، ابتدا گفت‌وگو را بازگشایی کن.</div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                {loadingInbox ? <Spinner color="warning" /> : <MessageCircle className="h-10 w-10 text-brand-text-muted/50" />}
                <p className="mt-4 text-sm font-bold text-brand-text">یک گفت‌وگو را انتخاب کن</p>
                <p className="mt-1 max-w-sm text-xs leading-6 text-brand-text-muted">وقتی مشتری از صفحهٔ مشاوره پیام بدهد، گفت‌وگو در این صندوق ظاهر می‌شود.</p>
                {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
              </div>
            )}
          </section>
        </div>
      </Card>
      <AdminConfirmModal
        isOpen={conversationToClose !== null}
        onOpenChange={(open) => {
          if (!open && !updatingStatus) setConversationToClose(null);
        }}
        title="پایان‌دادن به گفت‌وگو"
        description={
          <p>
            بعد از تأیید، مشتری دیگر نمی‌تواند در این گفت‌وگو پیام بفرستد. تمام پیام‌ها، زمان پایان و نام ادمین در تاریخچهٔ گفت‌وگو ذخیره می‌ماند و ادمین می‌تواند بعداً آن را بازگشایی کند.
          </p>
        }
        confirmText="تأیید و پایان گفت‌وگو"
        cancelText="ادامهٔ گفت‌وگو"
        confirmColor="warning"
        icon={<Archive className="h-4 w-4" />}
        isLoading={updatingStatus}
        onConfirm={async () => {
          if (!conversationToClose) return;
          const closed = await updateStatus(conversationToClose.id, 'closed');
          if (closed) setConversationToClose(null);
        }}
      />
      <AdminConfirmModal
        isOpen={conversationToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingConversation) setConversationToDelete(null);
        }}
        title="حذف گفت‌وگو"
        description={(
          <p>
            گفت‌وگوی «<strong>{conversationToDelete?.subject || 'مشاوره'}</strong>» و تمام پیام‌های آن حذف می‌شوند. این کار قابل بازگشت نیست.
          </p>
        )}
        confirmText="حذف گفت‌وگو"
        cancelText="انصراف"
        confirmColor="danger"
        icon={<Trash2 className="h-4 w-4" />}
        isLoading={deletingConversation}
        onConfirm={deleteConversation}
      />
    </main>
  );
}
