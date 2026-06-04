import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPromotions,
  fetchPromotionDetail,
  createPromotion,
  updatePromotion,
  deletePromotion,
  changePromotionStatus,
  exportPromotions,
  type PromotionListDto,
  type PromotionDetailDto,
  type PromotionPageDto,
  type PromoStatus,
  type PromoType,
  type SearchPromotionParams,
  type CreatePromotionBody,
  type UpdatePromotionBody,
} from '../api/promotionApi';

// ── Hook ─────────────────────────────────────────────────────────────────

export function usePromotions() {
  // List
  const [page, setPage]           = useState(0);
  const [filter, setFilterState]  = useState({
    q: '', status: '' as PromoStatus | '', type: '' as PromoType | '',
  });
  const [pageData, setPageData]   = useState<PromotionPageDto | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // View: 'list' | 'form'
  const [view, setView]           = useState<'list' | 'form'>('list');

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDetail, setEditingDetail] = useState<PromotionDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // Toast
  const [toast, setToast]   = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 10;

  // ── Load list ─────────────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: SearchPromotionParams = {
        page, size: PAGE_SIZE, sort: 'created_at', dir: 'desc',
      };
      if (filter.q)      params.q      = filter.q;
      if (filter.status) params.status = filter.status;
      if (filter.type)   params.type   = filter.type;
      const data = await fetchPromotions(params);
      setPageData(data);
    } catch (e) {
      setError(extractMsg(e));
    } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { loadList(); }, [loadList]);

  const setFilter = useCallback((partial: Partial<typeof filter>) => {
    setFilterState(prev => ({ ...prev, ...partial }));
    setPage(0);
  }, []);

  const refresh = useCallback(() => loadList(), [loadList]);

  // ── Stats tính từ list ────────────────────────────────────────────────────
  const stats = {
    total:    pageData?.totalElements ?? 0,
    active:   (pageData?.content ?? []).filter(p => p.status === 'active').length,
    upcoming: (pageData?.content ?? []).filter(p => p.status === 'upcoming').length,
    expired:  (pageData?.content ?? []).filter(p => p.status === 'expired').length,
  };

  // ── Open create form ──────────────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditingId(null);
    setEditingDetail(null);
    setActionError(null);
    setView('form');
  }, []);

  // ── Open edit form ────────────────────────────────────────────────────────
  const openEdit = useCallback(async (id: number) => {
    setEditingId(id);
    setEditingDetail(null);
    setActionError(null);
    setDetailLoading(true);
    setView('form');
    try {
      const data = await fetchPromotionDetail(id);
      setEditingDetail(data);
    } catch (e) {
      showToast('❌ Không thể tải chi tiết: ' + extractMsg(e));
    } finally { setDetailLoading(false); }
  }, []);

  const backToList = useCallback(() => {
    setView('list');
    setEditingId(null);
    setEditingDetail(null);
    setActionError(null);
  }, []);

  // ── Save (create/update) ──────────────────────────────────────────────────
  const handleSave = useCallback(async (body: CreatePromotionBody | UpdatePromotionBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      if (editingId !== null) {
        await updatePromotion(editingId, body as UpdatePromotionBody);
        showToast('✅ Đã cập nhật khuyến mãi');
      } else {
        await createPromotion(body as CreatePromotionBody);
        showToast('✅ Đã tạo khuyến mãi mới');
      }
      backToList();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [editingId, backToList, refresh]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa khuyến mãi này?')) return;
    setActionLoading(true);
    try {
      await deletePromotion(id);
      showToast('🗑️ Đã xóa khuyến mãi');
      refresh();
    } catch (e) {
      showToast('❌ ' + extractMsg(e));
    } finally { setActionLoading(false); }
  }, [refresh]);

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggleStatus = useCallback(async (id: number, currentStatus: PromoStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await changePromotionStatus(id, newStatus);
      showToast(newStatus === 'active' ? '✅ Đã kích hoạt' : '⏸️ Đã tắt');
      refresh();
    } catch (e) {
      showToast('❌ ' + extractMsg(e));
    }
  }, [refresh]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    try {
      await exportPromotions({
        q:      filter.q      || undefined,
        status: filter.status || undefined,
        type:   filter.type   || undefined,
      });
      showToast('📥 Đang tải file xuất');
    } catch (e) {
      showToast('❌ Xuất file thất bại: ' + extractMsg(e));
    }
  }, [filter]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    setToastVisible(true);
    toastRef.current = setTimeout(() => setToastVisible(false), 2800);
  };

  return {
    // list
    promos:        pageData?.content      ?? [],
    totalElements: pageData?.totalElements ?? 0,
    totalPages:    pageData?.totalPages    ?? 0,
    currentPage:   pageData?.number        ?? 0,
    loading, error,
    // filter
    filter, setFilter, setPage, refresh,
    // stats
    stats,
    // view
    view,
    openCreate, openEdit, backToList,
    // form
    editingId, editingDetail, detailLoading,
    // actions
    handleSave,
    handleDelete,
    handleToggleStatus,
    handleExport,
    actionLoading,
    actionError,
    // toast
    toast, toastVisible,
  };
}

function extractMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const ae = e as { response?: { data?: { message?: string } }; message?: string };
    return ae.response?.data?.message ?? ae.message ?? 'Lỗi không xác định';
  }
  return String(e);
}