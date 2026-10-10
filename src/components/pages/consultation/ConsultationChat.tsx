'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Chip, Input, Textarea } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCheck,
  Clock3,
  Headset,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { consultationChatApi } from '@/common/api/consultation-chat';
import { connectConsultationSocket, emitConsultationSocket, type ConsultationSocket } from '@/common/socket/consultation-chat';
import type { IConsultationConversation, IConsultationMessage } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { useAppSelector } from '@/stores/hooks';

const SESSION_STORAGE_KEY = 'hatefaroma_consultation_session';
const NAME_STORAGE_KEY = 'hatefaroma_consultation_name';

type MobileView = 'list' | 'chat' | 'request';

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

function statusLabel(status: IConsultationConversation['status']) {
  if (status === 'pending') return 'در انتظار تأیید';
  if (status === 'open') return 'در جریان';
  return 'پایان‌یافته';
}

function statusStyle(status: IConsultationConversation['status']) {
  if (status === 'pending') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (status === 'open') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  return 'bg-default-100 text-default-500';
}

export function ConsultationChat() {
  const reduceMotion = useReducedMotion();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authLoading = useAppSelector((state) => state.auth.isLoading);
  const [sessionToken, setSessionToken] = useState('');
  const [guestName, setGuestName] = useState('');
  const [subject, setSubject] = useState('');
  const [conversations, setConversations] = useState<IConsultationConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<IConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmNewRequest, setConfirmNewRequest] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const lastMessageIdRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ConsultationSocket | null>(null);
  const selectedConversationIdRef = useRef('');
  const markReadTimerRef = useRef<number | undefined>(undefined);
  selectedConversationIdRef.current = selectedConversationId;

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  ) || null;
  const openConversation = conversations.find((conversation) => conversation.status === 'open') || null;
  const pendingConversation = conversations.find((conversation) => conversation.status === 'pending') || null;

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

    void consultationChatApi.getConversations(token)
      .then((items) => {
        if (cancelled) return;
        setConversations(items);
        setSelectedConversationId(items[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) setConnectionError('دریافت فهرست گفت‌وگوها ناموفق بود. دوباره تلاش کن.');
      })
      .finally(() => {
        if (!cancelled) setLoadingConversations(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let disposed = false;
    let firstConnection = true;
    const socket = connectConsultationSocket(sessionToken);
    socketRef.current = socket;

    const syncAfterReconnect = async () => {
      try {
        const items = await consultationChatApi.getConversations(sessionToken);
        if (disposed) return;
        setConversations(items);
        setSelectedConversationId((current) =>
          current && items.some((conversation) => conversation.id === current)
            ? current
            : items[0]?.id || '',
        );
        const conversationId = selectedConversationIdRef.current;
        if (conversationId) {
          const incoming = await consultationChatApi.getMessages(
            sessionToken,
            conversationId,
            lastMessageIdRef.current || undefined,
          );
          if (!disposed && selectedConversationIdRef.current === conversationId) appendMessages(incoming);
        }
        if (!disposed) setConnectionError('');
      } catch {
        if (!disposed) setConnectionError('همگام‌سازی پس از اتصال مجدد انجام نشد؛ دوباره تلاش کن.');
      }
    };

    const onConnect = () => {
      setConnectionError('');
      const conversationId = selectedConversationIdRef.current;
      if (conversationId) {
        void emitConsultationSocket(socket, 'conversation:join', { conversationId })
          .catch((error: Error) => { if (!disposed) setConnectionError(error.message); });
      }
      if (firstConnection) {
        firstConnection = false;
        return;
      }
      void syncAfterReconnect();
    };
    const onConnectError = () => {
      if (!disposed) setConnectionError('اتصال زنده برقرار نشد؛ در حال تلاش دوباره…');
    };
    const onConversationUpdated = (conversation: IConsultationConversation) => {
      if (disposed) return;
      setConversations((current) => {
        const exists = current.some((item) => item.id === conversation.id);
        const next = exists
          ? current.map((item) => item.id === conversation.id ? conversation : item)
          : [...current, conversation];
        return next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    };
    const onConversationDeleted = ({ id }: { id: string }) => {
      if (disposed) return;
      setConversations((current) => current.filter((item) => item.id !== id));
      if (selectedConversationIdRef.current === id) {
        setSelectedConversationId('');
        setMessages([]);
        lastMessageIdRef.current = '';
      }
    };
    const onNewMessage = (message: IConsultationMessage) => {
      if (!disposed && message.conversationId === selectedConversationIdRef.current) {
        appendMessages([message]);
        if (message.senderRole === 'admin') {
          if (markReadTimerRef.current !== undefined) window.clearTimeout(markReadTimerRef.current);
          markReadTimerRef.current = window.setTimeout(() => {
            if (socket.connected) socket.emit('conversation:read');
            markReadTimerRef.current = undefined;
          }, 500);
        }
      }
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('conversation:deleted', onConversationDeleted);
    socket.on('message:new', onNewMessage);

    return () => {
      disposed = true;
      if (markReadTimerRef.current !== undefined) window.clearTimeout(markReadTimerRef.current);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('conversation:deleted', onConversationDeleted);
      socket.off('message:new', onNewMessage);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [appendMessages, sessionToken]);

  useEffect(() => {
    lastMessageIdRef.current = '';
    setMessages([]);

    if (!sessionToken || !selectedConversationId) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    let cancelled = false;
    void consultationChatApi.getMessages(sessionToken, selectedConversationId)
      .then((history) => {
        if (cancelled) return;
        appendMessages(history);
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
  }, [appendMessages, selectedConversationId, sessionToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !selectedConversationId) return;
    void emitConsultationSocket(socket, 'conversation:join', { conversationId: selectedConversationId })
      .catch((error: Error) => setConnectionError(error.message));
  }, [selectedConversationId]);

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
    setMobileView('chat');
  };

  const openRequestForm = () => {
    setSubject('');
    setConnectionError('');
    setMobileView('request');
  };

  const submitNewConversation = async () => {
    if (!sessionToken || sending || pendingConversation) return;
    if (!isAuthenticated && !guestName.trim()) {
      setConnectionError('برای شروع گفت‌وگو نامت را وارد کن.');
      return;
    }
    if (subject.trim().length < 3) {
      setConnectionError('موضوع گفت‌وگو را بنویس (حداقل ۳ حرف).');
      return;
    }

    setSending(true);
    setConnectionError('');
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      const next = await emitConsultationSocket<IConsultationConversation>(socket, 'conversation:start', {
        subject: subject.trim(),
        guestName: isAuthenticated ? undefined : guestName.trim(),
      });
      const closedAt = new Date().toISOString();
      setConversations((current) => [
        ...current
          .filter((item) => item.id !== next.id)
          .map((item) => item.status === 'open'
            ? { ...item, status: 'closed' as const, closedAt, closedByAdminId: null, closedByAdminName: '' }
            : item),
        next,
      ]);
      setSelectedConversationId(next.id);
      setMessages([]);
      lastMessageIdRef.current = '';
      setMobileView('chat');
      if (!isAuthenticated) {
        try {
          window.localStorage.setItem(NAME_STORAGE_KEY, guestName.trim());
        } catch {
          // The open tab can continue without browser storage.
        }
      }
    } catch (requestError: any) {
      setConnectionError(requestError?.message || requestError?.response?.data?.message || 'درخواست گفت‌وگو ثبت نشد. دوباره تلاش کن.');
    } finally {
      setSending(false);
      setConfirmNewRequest(false);
    }
  };

  const requestNewConversation = () => {
    if (openConversation) {
      setConfirmNewRequest(true);
      return;
    }
    void submitNewConversation();
  };

  const sendMessage = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !sessionToken || sending || selectedConversation?.status !== 'open') return;

    setSending(true);
    setConnectionError('');
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      const message = await emitConsultationSocket<IConsultationMessage>(socket, 'message:send', {
        conversationId: selectedConversation.id,
        body,
      });
      appendMessages([message]);
      setConversations((current) => current.map((item) => item.id === selectedConversation.id
        ? { ...item, lastMessageText: body, lastMessageAt: message.createdAt }
        : item));
      setDraft('');
    } catch (error: any) {
      setConnectionError(
        error?.message || error?.response?.data?.message || 'پیام ارسال نشد. اتصال را بررسی کن و دوباره بفرست.',
      );
    } finally {
      setSending(false);
    }
  };

  const renderRequestForm = () => (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <Button
          type="button"
          isIconOnly
          aria-label="بازگشت به گفتگوها"
          onPress={() => setMobileView('list')}
          className="h-11 min-w-11 shrink-0 rounded-2xl bg-brand-surface-elevated text-brand-text lg:hidden"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="text-base font-black text-brand-text">درخواست مشاورهٔ تازه</h3>
          <p className="mt-1 text-xs leading-6 text-brand-text-muted">
            موضوع را برای ادمین بفرست. بعد از تأیید، امکان گفت‌وگو و ارسال پیام فعال می‌شود.
          </p>
        </div>
      </div>

      {isAuthenticated ? (
        <div className="mb-4 rounded-2xl border border-brand-border bg-brand-surface-elevated p-4">
          <p className="text-[11px] font-bold text-brand-text-muted">درخواست به نام حساب شما ثبت می‌شود</p>
          <p className="mt-1 text-sm font-extrabold text-brand-text">{user?.fullName || 'کاربر واردشده'}</p>
        </div>
      ) : (
        <Input
          isRequired
          label="نام و نام خانوادگی"
          aria-label="نام و نام خانوادگی"
          value={guestName}
          onValueChange={setGuestName}
          maxLength={80}
          placeholder="نامت را وارد کن"
          variant="bordered"
          className="mb-4"
          classNames={{
            inputWrapper: 'min-h-12 rounded-2xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
            input: 'text-sm text-brand-text placeholder:text-brand-text-muted',
            label: 'text-xs font-bold text-brand-text-muted',
          }}
        />
      )}

      <Input
        isRequired
        label="موضوع مشاوره"
        aria-label="موضوع مشاوره"
        value={subject}
        onValueChange={setSubject}
        maxLength={120}
        placeholder="مثلاً انتخاب عطر مناسب برای هدیه"
        variant="bordered"
        classNames={{
          inputWrapper: 'min-h-12 rounded-2xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
          input: 'text-sm text-brand-text placeholder:text-brand-text-muted',
          label: 'text-xs font-bold text-brand-text-muted',
        }}
      />

      {pendingConversation ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-6">درخواست «{pendingConversation.subject}» منتظر بررسی ادمین است. برای ثبت درخواست تازه، ابتدا باید این درخواست بررسی شود.</p>
        </div>
      ) : (
        <div className="mt-auto pt-6">
          <Button
            type="button"
            onPress={requestNewConversation}
            isDisabled={sending || subject.trim().length < 3 || (!isAuthenticated && !guestName.trim()) || authLoading}
            isLoading={sending}
            startContent={!sending && <Plus className="h-4 w-4" />}
            className="h-12 w-full rounded-2xl bg-brand-gold font-black text-brand-olive shadow-sm disabled:opacity-50"
          >
            ثبت درخواست مشاوره
          </Button>
          <p className="mt-3 text-center text-[11px] leading-5 text-brand-text-muted">تا زمان تأیید ادمین، پیام‌رسانی فعال نیست.</p>
        </div>
      )}
    </div>
  );

  const renderMessageThread = () => {
    if (loadingConversations || loadingMessages) {
      return (
        <div className="flex min-h-56 flex-1 items-center justify-center text-sm text-brand-text-muted">
          <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
          در حال بارگذاری گفت‌وگو…
        </div>
      );
    }

    if (!selectedConversation) {
      return (
        <div className="flex min-h-56 flex-1 items-center justify-center p-6 text-center">
          <div>
            <MessageCircle className="mx-auto mb-3 h-9 w-9 text-brand-gold" />
            <h3 className="font-extrabold text-brand-text">گفت‌وگویی را انتخاب کن</h3>
            <p className="mt-2 text-xs leading-6 text-brand-text-muted">از فهرست گفتگوها انتخاب کن یا درخواست مشاورهٔ تازه ثبت کن.</p>
          </div>
        </div>
      );
    }

    if (selectedConversation.status === 'pending') {
      return (
        <div className="flex min-h-56 flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <Clock3 className="mx-auto mb-3 h-9 w-9 text-amber-600 dark:text-amber-300" />
            <h3 className="font-extrabold text-brand-text">در انتظار تأیید ادمین</h3>
            <p className="mt-2 text-sm leading-7 text-brand-text-muted">
              درخواست «{selectedConversation.subject}» ثبت شده است. پس از تأیید، همین‌جا می‌توانی پیام بفرستی.
            </p>
          </div>
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="flex min-h-56 flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <MessageCircle className="mx-auto mb-3 h-9 w-9 text-brand-gold" />
            <h3 className="font-extrabold text-brand-text">هنوز پیامی در این گفت‌وگو نیست</h3>
            <p className="mt-2 text-sm leading-7 text-brand-text-muted">گفت‌وگو تأیید شده؛ هر وقت آماده‌ای پیام اولت را بفرست.</p>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const mine = message.senderRole === 'customer';
          const sentAt = new Date(message.createdAt).getTime();
          const readAt = selectedConversation.lastCustomerMessageReadAt
            ? new Date(selectedConversation.lastCustomerMessageReadAt).getTime()
            : 0;
          const isRead = mine && readAt >= sentAt;
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
                  {!mine && <div className="mb-1 text-[11px] font-extrabold text-brand-gold">ادمین</div>}
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                </div>
                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-brand-text-muted">
                  <time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>
                  {mine && (isRead
                    ? <CheckCheck aria-label="خوانده‌شده" className="h-3.5 w-3.5 text-brand-gold" />
                    : <Check aria-label="ارسال‌شده" className="h-3.5 w-3.5" />)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    );
  };

  const renderComposer = () => {
    if (!selectedConversation) return null;
    if (selectedConversation.status === 'pending') {
      return (
        <div className="border-t border-brand-border bg-brand-surface px-4 py-4 text-center text-xs leading-6 text-brand-text-muted">
          پیام‌رسانی بعد از تأیید درخواست توسط ادمین فعال می‌شود.
        </div>
      );
    }
    if (selectedConversation.status === 'closed') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border p-4">
          <p className="text-xs leading-6 text-brand-text-muted">این گفت‌وگو پایان یافته؛ برای مشاورهٔ تازه، درخواست جدید ثبت کن.</p>
          <Button
            type="button"
            onPress={openRequestForm}
            isDisabled={!!pendingConversation}
            startContent={<RefreshCw className="h-4 w-4" />}
            className="min-h-11 rounded-full bg-brand-gold px-5 font-bold text-brand-olive"
          >
            گفت‌وگوی جدید
          </Button>
        </div>
      );
    }
    return (
      <form onSubmit={(event) => void sendMessage(event)} className="border-t border-brand-border bg-brand-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <div className="flex items-end gap-2 sm:gap-3">
          <Textarea
            className="min-w-0 flex-1"
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
          <Button
            isIconOnly
            type="submit"
            aria-label="ارسال پیام"
            isDisabled={!draft.trim() || loadingConversations || loadingMessages || sending}
            isLoading={sending}
            className="h-11 min-w-11 shrink-0 rounded-2xl bg-brand-gold text-brand-olive shadow-sm disabled:opacity-45"
          >
            {!sending && <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 flex justify-between gap-2 px-1 text-[10px] text-brand-text-muted">
          <span>Enter برای ارسال · Shift + Enter برای خط جدید</span>
          <span className="shrink-0">{toPersianDigits(draft.length)} / {toPersianDigits(2000)}</span>
        </div>
      </form>
    );
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-10" dir="rtl">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="mb-4 sm:mb-6"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-gold">
          <Headset className="h-3.5 w-3.5" />
          مشاوره تخصصی عطر
        </div>
        <h1 className="text-xl font-black leading-tight text-brand-text sm:text-3xl">با کارشناس هاتف آروما گفت‌وگو کن</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-brand-text-muted sm:text-sm sm:leading-7">
          درخواستت را با یک موضوع ثبت کن؛ بعد از تأیید ادمین، چت آنلاین همین‌جا فعال می‌شود.
        </p>
      </motion.div>

      <Card className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-brand-border px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-olive text-brand-gold sm:h-11 sm:w-11">
              <Headset className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-brand-surface bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold text-brand-text sm:text-base">مشاورهٔ هاتف آروما</h2>
              <p className="mt-0.5 truncate text-[11px] text-brand-text-muted">
                {isAuthenticated ? `به نام ${user?.fullName || 'حساب شما'}` : 'گفت‌وگوی آنلاین با ادمین'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            isDisabled={sending || !!pendingConversation || authLoading}
            onPress={openRequestForm}
            startContent={<Plus className="h-4 w-4" />}
            className="h-11 shrink-0 rounded-full bg-brand-gold px-3 text-xs font-bold text-brand-olive sm:px-4"
          >
            <span className="hidden sm:inline">درخواست مشاورهٔ جدید</span>
            <span className="sm:hidden">چت جدید</span>
          </Button>
        </header>

        <CardBody className="gap-0 p-0">
          <div className="grid min-h-[min(72dvh,780px)] lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 flex-col border-b border-brand-border lg:flex lg:border-b-0 lg:border-l`}>
              <div className="flex items-center justify-between gap-2 border-b border-brand-border p-3 sm:p-4">
                <div>
                  <h3 className="text-sm font-black text-brand-text">گفت‌وگوهای من</h3>
                  <p className="mt-1 text-[11px] text-brand-text-muted">{toPersianDigits(conversations.length)} گفت‌وگو</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  isDisabled={sending || !!pendingConversation || authLoading}
                  onPress={openRequestForm}
                  startContent={<Plus className="h-3.5 w-3.5" />}
                  className="h-10 rounded-full border border-brand-border bg-brand-surface-elevated px-3 text-xs font-bold text-brand-text"
                >
                  گفت‌وگوی جدید
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {loadingConversations ? (
                  <div className="flex min-h-24 items-center justify-center"><LoaderCircle className="h-5 w-5 animate-spin text-brand-gold" /></div>
                ) : conversations.length === 0 ? (
                  <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl bg-brand-surface-elevated px-4 text-center">
                    <MessageCircle className="mb-2 h-6 w-6 text-brand-gold" />
                    <p className="text-xs leading-6 text-brand-text-muted">هنوز گفت‌وگویی نداری. درخواست مشاوره را ثبت کن تا بعد از تأیید، چت شروع شود.</p>
                  </div>
                ) : conversations.map((item) => {
                  const selected = item.id === selectedConversationId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectConversation(item.id)}
                      className={`w-full min-h-[76px] rounded-2xl border p-3 text-right transition-colors ${selected ? 'border-brand-gold bg-brand-surface-elevated' : 'border-brand-border bg-transparent hover:bg-brand-surface-elevated/70'}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-extrabold text-brand-text">{item.subject || 'مشاوره'}</span>
                          <span className="mt-1 block truncate text-[11px] text-brand-text-muted">{item.lastMessageText || item.guestName || 'درخواست ثبت شده'}</span>
                        </span>
                        <time className="shrink-0 text-[10px] text-brand-text-muted" dateTime={item.lastMessageAt}>{conversationTime(item.lastMessageAt)}</time>
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(item.status)}`}>{statusLabel(item.status)}</span>
                        {item.unreadForGuest > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[10px] font-black text-brand-olive">{toPersianDigits(item.unreadForGuest)}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className={`${mobileView === 'list' ? 'hidden' : 'flex'} min-h-[min(72dvh,780px)] min-w-0 flex-col lg:flex lg:min-h-0`}>
              {mobileView === 'request' ? (
                renderRequestForm()
              ) : (
                <>
                  <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-brand-border px-3 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <Button
                        type="button"
                        isIconOnly
                        aria-label="بازگشت به فهرست گفتگوها"
                        onPress={() => setMobileView('list')}
                        className="h-11 min-w-11 shrink-0 rounded-2xl bg-brand-surface-elevated text-brand-text lg:hidden"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-brand-text">
                          {selectedConversation?.subject || 'گفت‌وگوی مشاوره'}
                        </h3>
                        <p className="mt-1 truncate text-[11px] text-brand-text-muted">
                          {selectedConversation
                            ? `شروع ${conversationTime(selectedConversation.createdAt)}`
                            : isAuthenticated ? user?.fullName : guestName || 'مشتری'}
                        </p>
                      </div>
                    </div>
                    {selectedConversation && (
                      <Chip size="sm" variant="flat" className={`shrink-0 ${statusStyle(selectedConversation.status)}`}>
                        {statusLabel(selectedConversation.status)}
                      </Chip>
                    )}
                  </div>

                  <div
                    className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-brand-surface-elevated/40 px-3 py-4 sm:px-6 sm:py-6"
                    aria-live="polite"
                    aria-relevant="additions text"
                  >
                    {renderMessageThread()}
                    <div ref={messagesEndRef} />
                  </div>

                  {connectionError && (
                    <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                      {connectionError}
                    </div>
                  )}

                  {renderComposer()}
                </>
              )}
            </section>
          </div>
        </CardBody>
      </Card>

      {mobileView === 'request' && connectionError && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">{connectionError}</p>
      )}

      <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-brand-text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-gold" />
        <span>تاریخچهٔ گفتگوها در حساب شما و مرورگر فعلی نگه‌داری می‌شود.</span>
      </div>

      <AdminConfirmModal
        isOpen={confirmNewRequest}
        onOpenChange={setConfirmNewRequest}
        title="ثبت گفت‌وگوی تازه؟"
        description={(
          <p>
            اگر درخواست تازه را ثبت کنی، گفت‌وگوی فعال «<strong>{openConversation?.subject || 'مشاوره قبلی'}</strong>» بسته می‌شود. درخواست جدید پس از تأیید ادمین قابل چت خواهد بود.
          </p>
        )}
        confirmText="ثبت درخواست تازه"
        cancelText="ادامهٔ گفت‌وگوی فعلی"
        confirmColor="warning"
        isLoading={sending}
        onConfirm={submitNewConversation}
      />
    </section>
  );
}
