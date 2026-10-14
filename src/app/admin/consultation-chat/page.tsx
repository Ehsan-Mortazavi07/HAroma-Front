'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, CardBody, Chip, Input, Spinner, Textarea } from '@heroui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Archive,
  Check,
  CheckCheck,
  CircleDot,
  ChevronDown,
  Clock3,
  Inbox,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { connectConsultationSocket, emitConsultationSocket, type ConsultationSocket } from '@/common/socket/consultation-chat';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import type { IConsultationConversation, IConsultationMessage, IUser } from '@/common/interfaces';
import { toPersianDigits } from '@/common/utils';
import { useAppSelector } from '@/stores/hooks';

type ConversationFilter = 'pending' | 'open' | 'closed' | 'all';
type ConversationGroup = {
  key: string;
  name: string;
  contact: string;
  kind: 'user' | 'guest';
  conversations: IConsultationConversation[];
};

function statusLabel(status: IConsultationConversation['status']) {
  if (status === 'pending') return 'در انتظار تأیید';
  if (status === 'open') return 'باز';
  return 'بسته';
}

function historyActionLabel(action: NonNullable<IConsultationConversation['statusHistory']>[number]['action']) {
  switch (action) {
    case 'requested': return 'درخواست مشاوره ثبت شد';
    case 'accepted': return 'درخواست پذیرفته شد';
    case 'opened': return 'گفت‌وگو باز شد';
    case 'reopened': return 'گفت‌وگو بازگشایی شد';
    case 'closed': return 'گفت‌وگو بسته شد';
    default: return 'گفت‌وگو ثبت شد';
  }
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
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);
  const [messages, setMessages] = useState<IConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [conversationToClose, setConversationToClose] = useState<IConsultationConversation | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<IConsultationConversation | null>(null);
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(() => new Set());
  const [bulkConfirmAction, setBulkConfirmAction] = useState<'open' | 'close' | 'delete' | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [newConversationSubject, setNewConversationSubject] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [newConversationError, setNewConversationError] = useState('');
  const lastMessageIdRef = useRef('');
  const conversationRequestIdRef = useRef(0);
  const messagesPaneRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const userSearchRequestIdRef = useRef(0);
  const socketRef = useRef<ConsultationSocket | null>(null);
  const selectedIdRef = useRef('');
  const filterRef = useRef<ConversationFilter>(filter);
  const markReadTimerRef = useRef<number | undefined>(undefined);
  selectedIdRef.current = selectedId;
  filterRef.current = filter;

  const appendMessages = useCallback((incoming: IConsultationMessage[]) => {
    if (!incoming.length) return;
    const newestIncomingId = incoming.at(-1)?.id;
    if (newestIncomingId && newestIncomingId > lastMessageIdRef.current) {
      lastMessageIdRef.current = newestIncomingId;
    }
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const additions = incoming.filter((message) => !known.has(message.id));
      return additions.length
        ? [...current, ...additions].sort((a, b) => a.id.localeCompare(b.id))
        : current;
    });
  }, []);

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

  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!isAdmin) return;
    let disposed = false;
    let firstConnection = true;
    const socket = connectConsultationSocket();
    socketRef.current = socket;

    const syncAfterReconnect = async () => {
      void loadConversationsRef.current();
      const conversationId = selectedIdRef.current;
      if (!conversationId) return;
      try {
        const incoming = await adminApi.getConsultationMessages(
          conversationId,
          lastMessageIdRef.current || undefined,
        );
        if (!disposed && selectedIdRef.current === conversationId) appendMessages(incoming);
      } catch {
        if (!disposed) setError('گفت‌وگو دوباره وصل شد؛ بارگذاری پیام‌های ازدست‌رفته ناموفق بود.');
      }
    };

    const onConnect = () => {
      setRealtimeConnected(true);
      setError((current) => current.includes('اتصال') ? '' : current);
      const conversationId = selectedIdRef.current;
      if (conversationId) {
        void emitConsultationSocket(socket, 'conversation:join', { conversationId })
          .catch((socketError: Error) => { if (!disposed) setError(socketError.message); });
      }
      if (firstConnection) {
        firstConnection = false;
        return;
      }
      void syncAfterReconnect();
    };
    const onDisconnect = () => {
      setRealtimeConnected(false);
    };
    const onConnectError = () => {
      if (!disposed) setError('اتصال زنده برقرار نشد؛ در حال تلاش دوباره…');
    };
    const onConversationUpdated = (conversation: IConsultationConversation) => {
      if (disposed) return;
      const currentFilter = filterRef.current;
      const matchesFilter = currentFilter === 'all' || conversation.status === currentFilter;
      if (!matchesFilter) {
        setSelectedConversationIds((current) => {
          if (!current.has(conversation.id)) return current;
          const next = new Set(current);
          next.delete(conversation.id);
          return next;
        });
      }
      setConversations((current) => {
        if (!matchesFilter) return current.filter((item) => item.id !== conversation.id);
        const exists = current.some((item) => item.id === conversation.id);
        const next = exists
          ? current.map((item) => item.id === conversation.id ? conversation : item)
          : [conversation, ...current];
        return next.sort((a, b) => {
          const statusOrder = a.status.localeCompare(b.status);
          return statusOrder || new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
      });
    };
    const onConversationDeleted = ({ id }: { id: string }) => {
      if (disposed) return;
      setConversations((current) => current.filter((item) => item.id !== id));
      setSelectedConversationIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      if (selectedIdRef.current === id) {
        setSelectedId('');
        setMessages([]);
        lastMessageIdRef.current = '';
        setMobileDetailOpen(false);
      }
    };
    const onNewMessage = (message: IConsultationMessage) => {
      if (!disposed && message.conversationId === selectedIdRef.current) {
        appendMessages([message]);
        if (message.senderRole === 'customer') {
          if (markReadTimerRef.current !== undefined) window.clearTimeout(markReadTimerRef.current);
          markReadTimerRef.current = window.setTimeout(() => {
            if (socket.connected) socket.emit('conversation:read');
            markReadTimerRef.current = undefined;
          }, 500);
        }
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('conversation:deleted', onConversationDeleted);
    socket.on('message:new', onNewMessage);
    return () => {
      disposed = true;
      if (markReadTimerRef.current !== undefined) window.clearTimeout(markReadTimerRef.current);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('conversation:deleted', onConversationDeleted);
      socket.off('message:new', onNewMessage);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setRealtimeConnected(false);
    };
  }, [appendMessages, isAdmin]);

  useEffect(() => {
    setMessages([]);
    lastMessageIdRef.current = '';
    if (!selectedId || !isAdmin) return;
    let cancelled = false;
    void adminApi.getConsultationMessages(selectedId)
      .then((history) => {
        if (cancelled) return;
        appendMessages(history);
      })
      .catch((requestError: any) => {
        if (!cancelled) setError(requestError?.response?.data?.message || 'بارگذاری پیام‌ها ناموفق بود.');
      });

    return () => {
      cancelled = true;
    };
  }, [appendMessages, isAdmin, selectedId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !selectedId) return;
    void emitConsultationSocket(socket, 'conversation:join', { conversationId: selectedId })
      .catch((socketError: Error) => setError(socketError.message));
  }, [selectedId]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [selectedId]);

  useEffect(() => {
    const pane = messagesPaneRef.current;
    if (!pane || !shouldAutoScrollRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const currentPane = messagesPaneRef.current;
      currentPane?.scrollTo({
        top: currentPane.scrollHeight,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, reduceMotion]);

  useEffect(() => {
    if (!isNewConversationOpen) return;
    const requestId = ++userSearchRequestIdRef.current;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingUsers(true);
      setUserSearchError('');
      void adminApi.getUsers({
        page: 1,
        pageSize: 12,
        role: 'user',
        q: userSearch.trim() || undefined,
      }).then((result: { items?: IUser[] }) => {
        if (!cancelled && requestId === userSearchRequestIdRef.current) {
          setUsers(Array.isArray(result?.items) ? result.items : []);
        }
      }).catch((requestError: any) => {
        if (!cancelled && requestId === userSearchRequestIdRef.current) {
          setUserSearchError(requestError?.response?.data?.message || 'فهرست کاربران بارگذاری نشد.');
        }
      }).finally(() => {
        if (!cancelled && requestId === userSearchRequestIdRef.current) setLoadingUsers(false);
      });
    }, userSearch.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isNewConversationOpen, userSearch]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;
  const conversationGroups = useMemo<ConversationGroup[]>(() => {
    const groups = new Map<string, IConsultationConversation[]>();
    conversations.forEach((conversation) => {
      const key = conversation.userId ? `user:${conversation.userId}` : 'guests';
      const items = groups.get(key) || [];
      items.push(conversation);
      groups.set(key, items);
    });

    return [...groups.entries()]
      .map(([key, items]) => ({
        key,
        name: items[0].userId ? items[0].guestName || 'کاربر سایت' : 'گفت‌وگوهای مهمان',
        contact: items[0].userId
          ? items[0].guestPhone || items[0].guestEmail || (items[0].guestUsername ? `@${items[0].guestUsername}` : '')
          : 'همهٔ درخواست‌های ثبت‌شده بدون حساب کاربری',
        kind: items[0].userId ? 'user' as const : 'guest' as const,
        conversations: [...items].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
      }))
      .sort((a, b) => new Date(b.conversations[0].lastMessageAt).getTime() - new Date(a.conversations[0].lastMessageAt).getTime());
  }, [conversations]);
  const visibleSelectedIds = conversations
    .filter((conversation) => selectedConversationIds.has(conversation.id))
    .map((conversation) => conversation.id);
  const selectedOpenableCount = conversations.filter(
    (conversation) => selectedConversationIds.has(conversation.id) && conversation.status !== 'open',
  ).length;
  const selectedClosableCount = conversations.filter(
    (conversation) => selectedConversationIds.has(conversation.id) && conversation.status !== 'closed',
  ).length;
  const selectedClosedCount = conversations.filter(
    (conversation) => selectedConversationIds.has(conversation.id) && conversation.status === 'closed',
  ).length;
  const allVisibleSelected = conversations.length > 0 && visibleSelectedIds.length === conversations.length;
  const someVisibleSelected = visibleSelectedIds.length > 0 && !allVisibleSelected;

  const toggleConversationSelection = (conversationId: string, checked: boolean) => {
    if (checked && !selectedConversationIds.has(conversationId) && visibleSelectedIds.length >= 100) {
      setError('در هر تغییر گروهی حداکثر ۱۰۰ گفت‌وگو را انتخاب کن.');
      return;
    }
    setSelectedConversationIds((current) => {
      const next = new Set(current);
      if (checked) next.add(conversationId);
      else next.delete(conversationId);
      return next;
    });
  };

  const applyBulkStatus = async (status: 'open' | 'closed') => {
    const ids = conversations
      .filter((conversation) => selectedConversationIds.has(conversation.id)
        && (status === 'open' ? conversation.status !== 'open' : conversation.status !== 'closed'))
      .map((conversation) => conversation.id);
    if (!ids.length || bulkActionLoading) return;
    setBulkActionLoading(true);
    setError('');
    try {
      const updated = status === 'open'
        ? await adminApi.bulkOpenConsultationConversations(ids)
        : await adminApi.bulkCloseConsultationConversations(ids);
      const updatedById = new Map(updated.map((conversation) => [conversation.id, conversation]));
      const updatedIds = new Set(updatedById.keys());
      const nextConversations = conversations
        .map((conversation) => updatedById.get(conversation.id) || conversation)
        .filter((conversation) => filterRef.current === 'all' || conversation.status === filterRef.current);
      setConversations((current) => current
        .map((conversation) => updatedById.get(conversation.id) || conversation)
        .filter((conversation) => filterRef.current === 'all' || conversation.status === filterRef.current));
      setSelectedConversationIds(new Set());
      setBulkConfirmAction(null);

      if (
        updatedIds.has(selectedIdRef.current) && !nextConversations.some((conversation) => conversation.id === selectedIdRef.current)
      ) {
        setSelectedId(nextConversations[0]?.id || '');
        setMessages([]);
        lastMessageIdRef.current = '';
        setMobileDetailOpen(false);
      }
    } catch (requestError: any) {
      const fallback = status === 'open' ? 'بازگشایی گروهی گفت‌وگوها انجام نشد.' : 'بستن گروهی گفت‌وگوها انجام نشد.';
      setError(requestError?.response?.data?.message || fallback);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const deleteSelectedConversations = async () => {
    const ids = visibleSelectedIds;
    if (!ids.length || bulkActionLoading) return;
    setBulkActionLoading(true);
    setError('');
    try {
      const result = await adminApi.bulkDeleteConsultationConversations(ids);
      const deletedIds = new Set(result.ids);
      const remaining = conversations.filter((conversation) => !deletedIds.has(conversation.id));
      setConversations((current) => current.filter((conversation) => !deletedIds.has(conversation.id)));
      setSelectedConversationIds(new Set());
      setBulkConfirmAction(null);
      if (deletedIds.has(selectedIdRef.current)) {
        setSelectedId(remaining[0]?.id || '');
        setMessages([]);
        lastMessageIdRef.current = '';
        setMobileDetailOpen(false);
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'حذف گروهی گفت‌وگوها انجام نشد.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const runBulkConfirmation = async () => {
    if (bulkConfirmAction === 'close') await applyBulkStatus('closed');
    else if (bulkConfirmAction === 'open') await applyBulkStatus('open');
    else if (bulkConfirmAction === 'delete') await deleteSelectedConversations();
  };

  const startConversationForUser = async (event: FormEvent) => {
    event.preventDefault();
    const subject = newConversationSubject.trim();
    if (!selectedUser || subject.length < 3 || startingConversation) return;
    setStartingConversation(true);
    setNewConversationError('');
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      const result = await emitConsultationSocket<{
        conversation: IConsultationConversation;
        reused: boolean;
      }>(socket, 'conversation:create-for-user', {
        userId: selectedUser._id,
        subject,
      });
      const conversation = result.conversation;
      const changingConversation = selectedId !== conversation.id;
      setConversations((current) => {
        const exists = current.some((item) => item.id === conversation.id);
        return exists
          ? current.map((item) => item.id === conversation.id ? conversation : item)
          : [conversation, ...current];
      });
      setFilter('open');
      setSelectedId(conversation.id);
      setMobileDetailOpen(true);
      shouldAutoScrollRef.current = true;
      if (changingConversation) {
        lastMessageIdRef.current = '';
        setMessages([]);
        setDraft('');
      }
      setIsNewConversationOpen(false);
      setSelectedUser(null);
      setNewConversationSubject('');
      setError('');
    } catch (requestError: any) {
      setNewConversationError(requestError?.message || requestError?.response?.data?.message || 'ایجاد گفت‌وگو انجام نشد.');
    } finally {
      setStartingConversation(false);
    }
  };

  const sendReply = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending || selectedConversation?.status !== 'open') return;
    setSending(true);
    setError('');
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      const message = await emitConsultationSocket<IConsultationMessage>(socket, 'message:send', {
        conversationId: selectedId,
        body,
      });
      appendMessages([message]);
      setDraft('');
    } catch (requestError: any) {
      setError(requestError?.message || requestError?.response?.data?.message || 'پاسخ ارسال نشد. دوباره تلاش کن.');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (
    conversationId: string,
    nextStatus: 'open' | 'closed',
  ): Promise<boolean> => {
    if (updatingStatus) return false;
    setUpdatingStatus(true);
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      const updated = await emitConsultationSocket<IConsultationConversation>(socket, 'conversation:status', {
        conversationId,
        status: nextStatus,
      });
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setFilter(nextStatus);
      setError('');
      return true;
    } catch (requestError: any) {
      setError(requestError?.message || requestError?.response?.data?.message || 'وضعیت گفت‌وگو تغییر نکرد.');
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteConversation = async () => {
    if (!conversationToDelete || deletingConversation) return;
    setDeletingConversation(true);
    try {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.');
      await emitConsultationSocket<{ id: string; deleted: boolean }>(socket, 'conversation:delete', {
        conversationId: conversationToDelete.id,
      });
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
      setError(requestError?.message || requestError?.response?.data?.message || 'حذف گفت‌وگو انجام نشد.');
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
          <p className="mt-1 text-sm text-brand-text-muted">پاسخ بده یا برای یک کاربر گفت‌وگوی تازه‌ای را شروع کن.</p>
        </div>
        <Chip startContent={<CircleDot className={`h-3 w-3 ${realtimeConnected ? 'text-emerald-500' : 'text-amber-500'}`} />} variant="flat" className="border border-brand-border bg-brand-surface text-brand-text-muted">
          {realtimeConnected ? 'اتصال زنده' : 'در حال اتصال…'}
        </Chip>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface shadow-sm">
        <div className="grid h-[min(76vh,820px)] min-h-[420px] overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className={`${mobileDetailOpen ? 'hidden' : 'flex'} h-full min-h-0 flex-col overflow-hidden border-b border-brand-border lg:flex lg:border-b-0 lg:border-l`}>
            {isNewConversationOpen ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-brand-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-brand-text">گفت‌وگوی جدید</h2>
                      <p className="mt-1 text-[11px] leading-5 text-brand-text-muted">اگر کاربر گفت‌وگوی بازی داشته باشد، همان گفتگو باز می‌شود.</p>
                    </div>
                    <Button
                      type="button"
                      isIconOnly
                      aria-label="بازگشت به فهرست گفتگوها"
                      onPress={() => setIsNewConversationOpen(false)}
                      className="h-10 min-w-10 rounded-xl bg-brand-surface-elevated text-brand-text"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    aria-label="جستجوی کاربر"
                    value={userSearch}
                    onValueChange={setUserSearch}
                    placeholder="نام، شماره یا نام کاربری"
                    startContent={<Search className="h-4 w-4 text-brand-text-muted" />}
                    variant="bordered"
                    classNames={{
                      inputWrapper: 'h-11 rounded-xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
                      input: 'text-sm text-brand-text placeholder:text-brand-text-muted',
                    }}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {loadingUsers ? (
                    <div className="flex h-36 items-center justify-center"><Spinner color="warning" /></div>
                  ) : userSearchError ? (
                    <p role="alert" className="p-5 text-center text-xs text-rose-600 dark:text-rose-300">{userSearchError}</p>
                  ) : users.length ? (
                    <div className="divide-y divide-brand-border/70">
                      {users.map((candidate) => {
                        const selected = selectedUser?._id === candidate._id;
                        return (
                          <button
                            type="button"
                            key={candidate._id}
                            onClick={() => setSelectedUser(candidate)}
                            aria-pressed={selected}
                            className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-brand-surface-elevated ${selected ? 'bg-brand-surface-elevated' : ''}`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-brand-gold text-brand-olive' : 'bg-brand-olive text-brand-gold'}`}>
                              <UserRound className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-brand-text">{candidate.fullName || candidate.username || 'کاربر'}</span>
                              <span className="mt-1 block truncate text-[11px] text-brand-text-muted" dir="ltr">
                                {candidate.phone || candidate.email || `@${candidate.username}`}
                              </span>
                            </span>
                            {selected && <Check className="h-4 w-4 shrink-0 text-brand-gold" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-5 py-10 text-center text-xs leading-6 text-brand-text-muted">کاربری پیدا نشد. نام، شماره یا نام کاربری را جستجو کن.</p>
                  )}
                </div>
                <form onSubmit={(event) => void startConversationForUser(event)} className="space-y-3 border-t border-brand-border p-4">
                  {selectedUser && (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-surface-elevated px-3 py-2">
                      <span className="min-w-0 truncate text-xs font-bold text-brand-text">گیرنده: {selectedUser.fullName || selectedUser.username}</span>
                      <button type="button" aria-label="پاک‌کردن انتخاب کاربر" onClick={() => setSelectedUser(null)} className="rounded-lg p-1 text-brand-text-muted hover:bg-brand-surface">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <Input
                    aria-label="موضوع گفت‌وگو"
                    value={newConversationSubject}
                    onValueChange={setNewConversationSubject}
                    minLength={3}
                    maxLength={120}
                    placeholder="موضوع گفت‌وگو"
                    variant="bordered"
                    classNames={{
                      inputWrapper: 'h-11 rounded-xl border-brand-border bg-brand-surface-elevated shadow-none data-[hover=true]:border-brand-gold group-data-[focus=true]:border-brand-gold',
                      input: 'text-sm text-brand-text placeholder:text-brand-text-muted',
                    }}
                  />
                  {newConversationError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">{newConversationError}</p>}
                  <Button
                    type="submit"
                    isDisabled={!selectedUser || newConversationSubject.trim().length < 3 || startingConversation || !realtimeConnected}
                    isLoading={startingConversation}
                    startContent={!startingConversation && <MessageCircle className="h-4 w-4" />}
                    className="h-11 w-full rounded-xl bg-brand-gold font-bold text-brand-olive disabled:opacity-45"
                  >
                    شروع یا ادامهٔ گفت‌وگو
                  </Button>
                  {!realtimeConnected && <p className="text-center text-[10px] text-brand-text-muted">برای شروع گفت‌وگو منتظر اتصال زنده بمان.</p>}
                </form>
              </div>
            ) : (
              <>
            <div className="border-b border-brand-border p-4">
              <Button
                type="button"
                onPress={() => {
                  setUserSearch('');
                  setSelectedUser(null);
                  setNewConversationSubject('');
                  setNewConversationError('');
                  setMobileDetailOpen(false);
                  setIsNewConversationOpen(true);
                }}
                startContent={<Plus className="h-4 w-4" />}
                className="group mb-3 h-12 w-full justify-between rounded-2xl border border-[#bfa27a]/55 bg-[#273027] px-3 text-xs font-black text-[#f7f4ee] shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d4be9b] hover:bg-[#303a30] hover:text-white hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4be9b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141914]"
                endContent={<MessageCircle className="h-4 w-4 text-[#d4be9b] transition-transform duration-200 group-hover:scale-110" />}
              >
                گفت‌وگوی جدید با کاربر
              </Button>
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
                    onPress={() => {
                      setSelectedConversationIds(new Set());
                      setError('');
                      setFilter(value);
                    }}
                    className={`h-11 min-w-0 rounded-xl text-[11px] font-bold ${filter === value ? 'bg-brand-gold text-brand-olive' : 'text-brand-text-muted'}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-brand-border px-3 py-2">
              <div className="flex min-h-9 items-center gap-2">
                <SmoothCheckbox
                  size="sm"
                  ariaLabel="انتخاب گفت‌وگوهای فهرست"
                  isSelected={allVisibleSelected}
                  isIndeterminate={someVisibleSelected}
                  onValueChange={(checked) => {
                    if (checked) {
                      setSelectedConversationIds(new Set(conversations.slice(0, 100).map((conversation) => conversation.id)));
                      setError(conversations.length > 100 ? 'برای تغییر گروهی حداکثر ۱۰۰ گفت‌وگو انتخاب شد.' : '');
                    } else {
                      setSelectedConversationIds(new Set());
                      setError('');
                    }
                  }}
                  className="gap-2"
                >
                  انتخاب همه
                </SmoothCheckbox>
                {visibleSelectedIds.length > 0 && (
                  <span className="rounded-full bg-brand-gold/15 px-2.5 py-1 text-[10px] font-extrabold text-brand-gold">
                    {toPersianDigits(visibleSelectedIds.length)} انتخاب
                  </span>
                )}
              </div>
            </div>
            {error && visibleSelectedIds.length > 0 && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{error}</p>}

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
                <div>
                  {conversationGroups.map((group) => {
                    const selectedInGroup = group.conversations.filter((item) => selectedConversationIds.has(item.id)).length;
                    const isGroupSelected = selectedInGroup === group.conversations.length;
                    const isGroupPartiallySelected = selectedInGroup > 0 && !isGroupSelected;
                    return (
                    <section key={group.key} className="border-b border-brand-border/70">
                      <div className="flex items-center gap-3 bg-brand-surface-elevated/60 px-4 py-3">
                        <SmoothCheckbox
                          size="sm"
                          ariaLabel={`انتخاب همه گفتگوهای ${group.name}`}
                          isSelected={isGroupSelected}
                          isIndeterminate={isGroupPartiallySelected}
                          onValueChange={(checked) => {
                            const nextSelectedCount = checked
                              ? selectedConversationIds.size + group.conversations.filter((conversation) => !selectedConversationIds.has(conversation.id)).length
                              : selectedConversationIds.size;
                            if (checked && nextSelectedCount > 100) {
                              setError('برای تغییر گروهی حداکثر ۱۰۰ گفت‌وگو را انتخاب کن؛ گفت‌وگوها را جداگانه انتخاب کن.');
                              return;
                            }
                            setSelectedConversationIds((current) => {
                              const next = new Set(current);
                              group.conversations.forEach((conversation) => {
                                if (checked) next.add(conversation.id);
                                else next.delete(conversation.id);
                              });
                              return next;
                            });
                            setError('');
                          }}
                          className="gap-0"
                        />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-olive text-brand-gold">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xs font-extrabold text-brand-text">{group.name}</h3>
                          <p className="mt-0.5 truncate text-[10px] text-brand-text-muted" dir={group.kind === 'guest' ? 'rtl' : 'ltr'}>
                            {group.kind === 'guest' ? group.contact : group.contact || 'کاربر عضو سایت'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-brand-surface px-2 py-1 text-[10px] font-bold text-brand-gold">
                          {toPersianDigits(group.conversations.length)} گفتگو
                        </span>
                      </div>
                      <div className="divide-y divide-brand-border/50">
                        {group.conversations.map((item) => {
                          const selected = item.id === selectedId;
                          const checked = selectedConversationIds.has(item.id);
                          return (
                            <div key={item.id} className={`flex items-stretch gap-2 px-3 py-2 ${selected ? 'bg-brand-surface-elevated' : 'bg-transparent'}`}>
                              <span className="flex w-8 shrink-0 items-center justify-center">
                                <SmoothCheckbox
                                  size="sm"
                                  ariaLabel={`انتخاب گفت‌وگوی ${item.subject || 'مشاوره'} با ${item.guestName || 'مشتری مهمان'}`}
                                  isSelected={checked}
                                  onValueChange={(value) => toggleConversationSelection(item.id, value)}
                                  className="gap-0"
                                />
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setMobileDetailOpen(true);
                                }}
                                className="min-w-0 flex-1 rounded-xl px-2 py-2 text-right transition-colors hover:bg-brand-surface-elevated"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate text-[11px] font-extrabold text-brand-text">{item.guestName || 'مشتری مهمان'}</span>
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      className={`h-[18px] shrink-0 px-1.5 text-[9px] font-bold ${item.userId
                                        ? 'bg-brand-gold/10 text-brand-bronze dark:text-brand-gold'
                                        : 'bg-default-100 text-default-500'}`}
                                    >
                                      {item.userId ? 'کاربر سایت' : 'مهمان'}
                                    </Chip>
                                  </span>
                                  <time className="shrink-0 text-[10px] text-brand-text-muted" dateTime={item.createdAt}>ثبت {shortTime(item.createdAt)}</time>
                                </span>
                                <span className="mt-1 flex items-center justify-between gap-2">
                                  <span className="truncate text-[11px] font-bold text-brand-gold">موضوع: {item.subject || 'مشاوره'}</span>
                                  <time className="shrink-0 text-[10px] text-brand-text-muted" dateTime={item.lastMessageAt}>آخرین فعالیت {shortTime(item.lastMessageAt)}</time>
                                </span>
                                <span className="mt-1 flex min-w-0 items-center justify-between gap-2">
                                  <span className="truncate text-[10px] text-brand-text-muted" dir="ltr">
                                    {[item.guestPhone, item.guestEmail, item.guestUsername ? `@${item.guestUsername}` : ''].filter(Boolean).join(' · ') || (item.userId ? 'عضو سایت' : 'اطلاعات تماس ثبت نشده')}
                                  </span>
                                  {!!item.unreadForAdmin && (
                                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[10px] font-black text-brand-olive">
                                      {toPersianDigits(item.unreadForAdmin)}
                                    </span>
                                  )}
                                </span>
                                {item.lastMessageText && (
                                  <span className="mt-1 block truncate text-[10px] text-brand-text-muted">{item.lastMessageText}</span>
                                )}
                                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : item.status === 'open' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-default-100 text-default-500'}`}>
                                  {statusLabel(item.status)}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}
          </aside>

          <section className={`${mobileDetailOpen ? 'flex' : 'hidden'} h-full min-h-0 min-w-0 flex-col overflow-hidden lg:flex`}>
            {selectedConversation ? (
              <>
                <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-brand-border px-3 py-3 sm:px-5">
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

                <section className="shrink-0 border-b border-brand-border bg-brand-surface px-3 py-2.5 sm:px-5">
                  <button
                    type="button"
                    aria-expanded={isAuditExpanded}
                    aria-controls="consultation-status-history"
                    onClick={() => setIsAuditExpanded((expanded) => !expanded)}
                    className="flex min-h-8 w-full items-center justify-between gap-3 text-right"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-xs font-extrabold text-brand-text">
                      <Clock3 className="h-4 w-4 shrink-0 text-brand-gold" />
                      تاریخچهٔ درخواست و تغییر وضعیت
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[10px] text-brand-text-muted">
                      {toPersianDigits(selectedConversation.statusHistory?.length || 0)} رویداد
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAuditExpanded ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isAuditExpanded && (
                      <motion.ol
                        id="consultation-status-history"
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-2 max-h-36 space-y-1.5 overflow-y-auto overscroll-contain"
                      >
                        {(selectedConversation.statusHistory || []).map((event, index) => (
                          <li key={`${event.action}-${event.occurredAt}-${index}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg bg-brand-surface-elevated/65 px-2.5 py-1.5 text-[10px]">
                            <span className="font-bold text-brand-text">
                              {historyActionLabel(event.action)}
                              {event.fromStatus && event.toStatus && event.fromStatus !== event.toStatus && (
                                <span className="ms-1 font-normal text-brand-text-muted">({statusLabel(event.fromStatus)} ← {statusLabel(event.toStatus)})</span>
                              )}
                            </span>
                            <time className="shrink-0 text-brand-text-muted" dateTime={event.occurredAt}>
                              {new Date(event.occurredAt).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })}
                            </time>
                            <span className="w-full text-brand-text-muted">
                              {event.actorRole === 'admin'
                                ? `ادمین: ${event.actorName || 'نامشخص'}`
                                : event.actorRole === 'customer'
                                  ? `کاربر: ${event.actorName || selectedConversation.guestName}`
                                  : event.actorName || 'سامانه'}
                            </span>
                          </li>
                        ))}
                        {!selectedConversation.statusHistory?.length && (
                          <li className="px-2 py-2 text-[10px] text-brand-text-muted">هنوز رویدادی ثبت نشده است.</li>
                        )}
                      </motion.ol>
                    )}
                  </AnimatePresence>
                </section>

                <div
                  ref={messagesPaneRef}
                  role="log"
                  aria-label="پیام‌های گفت‌وگو"
                  aria-live="polite"
                  onScroll={(event) => {
                    const pane = event.currentTarget;
                    shouldAutoScrollRef.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 120;
                  }}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-brand-surface-elevated/35 px-3 py-4 sm:px-6"
                >
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
                            <div className={`rounded-2xl px-4 py-2.5 ${mine ? 'rounded-tr-md bg-brand-gold text-brand-olive shadow-sm ring-1 ring-brand-border/40' : 'rounded-tl-md border border-brand-border bg-brand-surface text-brand-text dark:border-[#465247] dark:bg-[#29322b]'}`}>
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
                </div>

                {error && <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{error}</div>}

                {selectedConversation.status === 'open' ? (
                  <form onSubmit={(event) => void sendReply(event)} className="shrink-0 border-t border-brand-border p-3 sm:p-4">
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
      <AnimatePresence>
        {visibleSelectedIds.length > 0 && (
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 sm:bottom-7 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 30, scale: reduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 22, scale: reduceMotion ? 1 : 0.97 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex w-[min(100%,36rem)] flex-col gap-2 rounded-2xl border border-brand-gold/40 bg-[#141a14]/[.97] p-2.5 text-[#f7f4ee] shadow-2xl shadow-black/40 backdrop-blur-2xl sm:w-auto sm:max-w-[calc(100vw-2rem)] sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:p-2 sm:ps-3.5 sm:pe-2"
            >
              <div className="flex items-center justify-between gap-3 px-1 sm:px-0">
                <span className="flex items-center gap-2 text-xs font-extrabold text-brand-gold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand-gold" />
                  {toPersianDigits(visibleSelectedIds.length)} گفت‌وگو انتخاب شده
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="light"
                  isDisabled={bulkActionLoading}
                  onPress={() => setSelectedConversationIds(new Set())}
                  className="h-8 min-w-0 rounded-full px-2 text-[11px] font-bold text-neutral-300 hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <X className="h-3.5 w-3.5" />
                  انصراف
                </Button>
              </div>

              <span className="hidden h-5 w-px bg-white/15 sm:block" />
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2">
                {selectedClosableCount > 0 && (filter === 'open' || filter === 'all') && (
                  <Button
                    type="button"
                    size="sm"
                    isLoading={bulkActionLoading}
                    isDisabled={bulkActionLoading}
                    onPress={() => setBulkConfirmAction('close')}
                    startContent={!bulkActionLoading && <Archive className="h-3.5 w-3.5" />}
                    className="h-9 min-w-0 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 text-[11px] font-extrabold text-amber-200 transition-colors hover:bg-amber-500/25"
                  >
                    {filter === 'all' ? 'بستن گروهی' : 'بستن انتخاب‌شده‌ها'}
                  </Button>
                )}
                {selectedOpenableCount > 0 && (filter === 'closed' || filter === 'pending' || filter === 'all') && (
                  <Button
                    type="button"
                    size="sm"
                    isLoading={bulkActionLoading}
                    isDisabled={bulkActionLoading}
                    onPress={() => setBulkConfirmAction('open')}
                    startContent={!bulkActionLoading && (filter === 'pending' ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />)}
                    className="h-9 min-w-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 text-[11px] font-extrabold text-emerald-200 transition-colors hover:bg-emerald-500/25"
                  >
                    {filter === 'pending' ? 'تأیید گروهی' : 'بازگشایی گروهی'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  isLoading={bulkActionLoading}
                  isDisabled={bulkActionLoading}
                  onPress={() => setBulkConfirmAction('delete')}
                  startContent={!bulkActionLoading && <Trash2 className="h-3.5 w-3.5" />}
                  className="h-9 min-w-0 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 text-[11px] font-extrabold text-rose-200 transition-colors hover:bg-rose-500/25"
                >
                  حذف گروهی
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="light"
                  isDisabled={bulkActionLoading}
                  onPress={() => setSelectedConversationIds(new Set())}
                  className="hidden h-9 min-w-0 rounded-full px-2.5 text-[11px] font-bold text-neutral-300 hover:bg-white/10 hover:text-white sm:flex"
                >
                  <X className="h-3.5 w-3.5" />
                  انصراف
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
      <AdminConfirmModal
        isOpen={bulkConfirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !bulkActionLoading) setBulkConfirmAction(null);
        }}
        title={bulkConfirmAction === 'delete'
          ? 'حذف گروهی گفت‌وگوها'
          : bulkConfirmAction === 'open'
            ? filter === 'pending' ? 'تأیید گروهی گفت‌وگوها' : 'بازگشایی گروهی گفت‌وگوها'
            : 'بستن گروهی گفت‌وگوها'}
        description={(
          <p>
            {bulkConfirmAction === 'delete'
              ? `${toPersianDigits(visibleSelectedIds.length)} گفت‌وگو و تمام پیام‌های وابسته به آن‌ها برای همیشه حذف می‌شوند. این کار قابل بازگشت نیست.`
              : bulkConfirmAction === 'open'
                ? `وضعیت ${toPersianDigits(selectedOpenableCount)} گفت‌وگوی انتخاب‌شده به «باز» تغییر می‌کند. اگر چند گفت‌وگو از یک کاربر انتخاب شده باشد، با همین تأیید همهٔ آن‌ها باز می‌مانند و کاربر می‌تواند هم‌زمان در چند گفتگو پیام بدهد.`
                : `وضعیت ${toPersianDigits(selectedClosableCount)} گفت‌وگوی باز یا در انتظار به «بسته» تغییر می‌کند. پیام‌ها و سوابق آن‌ها باقی می‌ماند.`}
          </p>
        )}
        confirmText={bulkConfirmAction === 'delete'
          ? 'حذف گفت‌وگوها و پیام‌ها'
          : bulkConfirmAction === 'open'
            ? filter === 'pending' ? 'تأیید و بازکردن' : 'بازگشایی گفت‌وگوها'
            : 'بستن گفت‌وگوهای انتخاب‌شده'}
        cancelText="انصراف"
        confirmColor={bulkConfirmAction === 'delete' ? 'danger' : bulkConfirmAction === 'open' ? 'success' : 'warning'}
        icon={bulkConfirmAction === 'delete'
          ? <Trash2 className="h-4 w-4" />
          : bulkConfirmAction === 'open'
            ? <RotateCcw className="h-4 w-4" />
            : <Archive className="h-4 w-4" />}
        isLoading={bulkActionLoading}
        onConfirm={runBulkConfirmation}
      />
    </main>
  );
}
