// hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import api, { ENDPOINTS } from '../config/apiConfig';

export interface NotificationItem {
  id:            number;
  type:          string;
  title:         string;
  body:          string | null;
  referenceId:   number | null;
  referenceType: string | null;
  isRead:        boolean;
  createdAt:     string;
}

interface NotifPage {
  content:       NotificationItem[];
  totalElements: number;
  totalPages:    number;
  currentPage:   number;
  unreadCount:   number;
}

const POLL_MS        = 30_000; // badge polling khi đóng
const OPEN_POLL_MS   = 15_000; // list polling khi mở

export function useNotifications(loggedIn: boolean) {
  const [items,   setItems]   = useState<NotificationItem[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page,    setPage]    = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const loggedInRef  = useRef(loggedIn);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const openPollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOpenRef    = useRef(false); // track dropdown open state

  useEffect(() => { loggedInRef.current = loggedIn; }, [loggedIn]);

  // ── Fetch unread count (nhẹ, dùng cho badge polling) ─────────────────────
  const fetchUnread = useCallback(async () => {
    if (!loggedInRef.current) return;
    try {
      const res = await api.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD);
      setUnread(res.data.count);
    } catch { /* silent */ }
  }, []);

  // ── Fetch danh sách ───────────────────────────────────────────────────────
  const fetchList = useCallback(async (p = 0) => {
    if (!loggedInRef.current) return;
    setLoading(true);
    try {
      const res = await api.get<NotifPage>(ENDPOINTS.NOTIFICATIONS.BASE, {
        params: { page: p, size: 15 },
      });
      const data = res.data;
      setItems(prev => p === 0 ? data.content : [...prev, ...data.content]);
      setUnread(data.unreadCount);
      setHasMore(data.currentPage < data.totalPages - 1);
      setPage(p);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const loadMore = useCallback(() => fetchList(page + 1), [fetchList, page]);

  // ── Gọi khi dropdown mở/đóng ─────────────────────────────────────────────
  const onDropdownOpen = useCallback(() => {
    isOpenRef.current = true;
    // Fetch ngay lập tức
    fetchList(0);
    // ✅ Polling list mỗi 15s khi dropdown đang mở
    if (openPollRef.current) clearInterval(openPollRef.current);
    openPollRef.current = setInterval(() => {
      if (isOpenRef.current) fetchList(0);
    }, OPEN_POLL_MS);
  }, [fetchList]);

  const onDropdownClose = useCallback(() => {
    isOpenRef.current = false;
    // Dừng polling list khi đóng dropdown
    if (openPollRef.current) {
      clearInterval(openPollRef.current);
      openPollRef.current = null;
    }
  }, []);

  // ── Mark actions ──────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await api.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
      setUnread(0);
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }, []);

  const markOneRead = useCallback(async (id: number) => {
    try {
      await api.patch(ENDPOINTS.NOTIFICATIONS.READ_ONE(id));
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  // ── Badge polling (30s khi đóng) ──────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!loggedIn) {
      setItems([]); setUnread(0); setPage(0);
      return;
    }
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, POLL_MS);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (openPollRef.current) { clearInterval(openPollRef.current); openPollRef.current = null; }
    };
  }, [loggedIn, fetchUnread]);

  return {
    items, unread, loading, hasMore,
    // ✅ Thay fetchList bằng onDropdownOpen/Close để caller quản lý polling
    fetchList,
    onDropdownOpen,
    onDropdownClose,
    loadMore, markAllRead, markOneRead,
  };
}