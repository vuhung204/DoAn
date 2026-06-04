import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchRefunds,
  fetchRefundStats,
  fetchRefundDetail,
  approveRefund,
  rejectRefund,
  completeRefund,
  exportRefunds,
  type RefundListDto,
  type RefundDetailDto,
  type RefundStatsDto,
  type RefundPageDto,
  type RefundStatus,
  type SearchRefundsParams,
  type ProcessRefundBody,
  type CompleteRefundBody,
} from '../api/refundApi';

// ── Types ────────────────────────────────────────────────────────────────

export interface RefundFilter {
  q: string;
  status: RefundStatus | '';
  storeId?: number;
  fromDate?: string;
  toDate?: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useRefunds(pageSize = 10) {
  // List
  const [page, setPage]           = useState(0);
  const [filter, setFilterState]  = useState<RefundFilter>({ q: '', status: '' });
  const [pageData, setPageData]   = useState<RefundPageDto | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Stats
  const [stats, setStats]             = useState<RefundStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Detail modal
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [detail, setDetail]             = useState<RefundDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Process modal
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Action
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // Toast
  const [toast, setToast]   = useState<string | null>(null);
  const toastRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load list ───────────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: SearchRefundsParams = { page, size: pageSize, sort: 'requestedAt', dir: 'desc' };
      if (filter.q)        params.q        = filter.q;
      if (filter.status)   params.status   = filter.status;
      if (filter.storeId)  params.storeId  = filter.storeId;
      if (filter.fromDate) params.fromDate = filter.fromDate;
      if (filter.toDate)   params.toDate   = filter.toDate;
      const data = await fetchRefunds(params);
      setPageData(data);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter]);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Load stats ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchRefundStats();
      setStats(data);
    } catch {
      // stats không critical, fail silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Filter ──────────────────────────────────────────────────────────────
  const setFilter = useCallback((partial: Partial<RefundFilter>) => {
    setFilterState(prev => ({ ...prev, ...partial }));
    setPage(0);
  }, []);

  const refresh = useCallback(() => {
    loadList();
    loadStats();
  }, [loadList, loadStats]);

  // ── Detail ──────────────────────────────────────────────────────────────
  const openDetail = useCallback(async (id: number) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await fetchRefundDetail(id);
      setDetail(data);
    } catch (e) {
      showToast('❌ Không thể tải chi tiết: ' + extractMsg(e));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  // ── Process modal ───────────────────────────────────────────────────────
  const openProcess  = useCallback((id: number) => setProcessingId(id), []);
  const closeProcess = useCallback(() => {
    setProcessingId(null);
    setActionError(null);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (id: number, body?: ProcessRefundBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await approveRefund(id, body);
      showToast('✅ Đã phê duyệt yêu cầu hoàn trả');
      closeProcess();
      closeDetail();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally {
      setActionLoading(false);
    }
  }, [closeProcess, closeDetail, refresh]);

  const handleReject = useCallback(async (id: number, body?: ProcessRefundBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await rejectRefund(id, body);
      showToast('🚫 Đã từ chối yêu cầu hoàn trả');
      closeProcess();
      closeDetail();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally {
      setActionLoading(false);
    }
  }, [closeProcess, closeDetail, refresh]);

  const handleComplete = useCallback(async (id: number, body: CompleteRefundBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await completeRefund(id, body);
      showToast('💰 Hoàn tiền thành công');
      closeProcess();
      closeDetail();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally {
      setActionLoading(false);
    }
  }, [closeProcess, closeDetail, refresh]);

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    try {
      await exportRefunds({
        q:        filter.q      || undefined,
        status:   filter.status || undefined,
        storeId:  filter.storeId,
        fromDate: filter.fromDate,
        toDate:   filter.toDate,
      });
      showToast('📥 Đã tải file xuất');
    } catch (e) {
      showToast('❌ Xuất file thất bại: ' + extractMsg(e));
    }
  }, [filter]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };

  return {
    // list
    refunds:       pageData?.content       ?? [],
    totalElements: pageData?.totalElements ?? 0,
    totalPages:    pageData?.totalPages    ?? 0,
    currentPage:   pageData?.number        ?? 0,
    pageSize,
    loading,
    error,
    // filter
    filter,
    setFilter,
    setPage,
    refresh,
    // stats
    stats,
    statsLoading,
    // detail
    selectedId,
    detail,
    detailLoading,
    openDetail,
    closeDetail,
    // process
    processingId,
    openProcess,
    closeProcess,
    // actions
    handleApprove,
    handleReject,
    handleComplete,
    actionLoading,
    actionError,
    // export
    handleExport,
    // toast
    toast,
  };
}

// ── Util ─────────────────────────────────────────────────────────────────

function extractMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const ae = e as { response?: { data?: { message?: string } }; message?: string };
    return ae.response?.data?.message ?? ae.message ?? 'Lỗi không xác định';
  }
  return String(e);
}