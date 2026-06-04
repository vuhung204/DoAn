import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchStores, fetchStoreDetail, createStore, updateStore,
  changeStoreStatus, deleteStore, exportStores,
  fetchStaff, fetchStaffDetail, createStaff, updateStaff,
  changeStaffStatus, deleteStaff, resetStaffPassword, exportStaff,
  fetchRoles,
  type StoreListDto, type StoreDetailDto, type StorePageDto,
  type StaffListDto, type StaffDetailDto, type StaffPageDto,
  type RoleOption,
  type CreateStoreBody, type UpdateStoreBody,
  type CreateStaffBody, type UpdateStaffBody,
} from '../api/systemApi';

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSystem() {
  // ── Active tab: 'stores' | 'staff'
  const [tab, setTab] = useState<'stores' | 'staff'>('stores');

  // ── Stores
  const [storePage, setStorePage]       = useState(0);
  const [storeQ, setStoreQ]             = useState('');
  const [storeStatus, setStoreStatus]   = useState('');
  const [storeData, setStoreData]       = useState<StorePageDto | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);

  // ── Staff
  const [staffPage, setStaffPage]       = useState(0);
  const [staffQ, setStaffQ]             = useState('');
  const [staffStoreId, setStaffStoreId] = useState<number | undefined>(undefined);
  const [staffRole, setStaffRole]       = useState('');
  const [staffStatus, setStaffStatus]   = useState('');
  const [staffData, setStaffData]       = useState<StaffPageDto | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);

  // ── Roles (cho form select)
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // ── Form / modal
  const [view, setView]                 = useState<'list' | 'form'>('list');
  const [formType, setFormType]         = useState<'store' | 'staff'>('store');
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editingStore, setEditingStore] = useState<StoreDetailDto | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Action
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // ── Toast
  const [toast, setToast]         = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 10;

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const data = await fetchStores({
        q: storeQ || undefined,
        status: storeStatus || undefined,
        page: storePage, size: PAGE_SIZE,
      });
      setStoreData(data);
    } catch { /* fail silently */ }
    finally { setStoresLoading(false); }
  }, [storePage, storeQ, storeStatus]);

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const data = await fetchStaff({
        q: staffQ || undefined,
        storeId: staffStoreId,
        role: staffRole || undefined,
        status: staffStatus || undefined,
        page: staffPage, size: PAGE_SIZE,
      });
      setStaffData(data);
    } catch { /* fail silently */ }
    finally { setStaffLoading(false); }
  }, [staffPage, staffQ, staffStoreId, staffRole, staffStatus]);

  const loadRoles = useCallback(async () => {
    try { setRoles(await fetchRoles()); } catch { /* fail silently */ }
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);
  useEffect(() => { loadStaff();  }, [loadStaff]);
  useEffect(() => { loadRoles();  }, [loadRoles]);

  const refresh = useCallback(() => { loadStores(); loadStaff(); }, [loadStores, loadStaff]);

  // ── Open forms ────────────────────────────────────────────────────────────────

  const openCreateStore = useCallback(() => {
    setFormType('store');
    setEditingId(null); setEditingStore(null); setActionError(null);
    setView('form');
  }, []);

  const openEditStore = useCallback(async (id: number) => {
    setFormType('store');
    setEditingId(id); setEditingStore(null); setActionError(null);
    setDetailLoading(true); setView('form');
    try { setEditingStore(await fetchStoreDetail(id)); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
    finally { setDetailLoading(false); }
  }, []);

  const openCreateStaff = useCallback(() => {
    setFormType('staff');
    setEditingId(null); setEditingStaff(null); setActionError(null);
    setView('form');
  }, []);

  const openEditStaff = useCallback(async (id: number) => {
    setFormType('staff');
    setEditingId(id); setEditingStaff(null); setActionError(null);
    setDetailLoading(true); setView('form');
    try { setEditingStaff(await fetchStaffDetail(id)); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
    finally { setDetailLoading(false); }
  }, []);

  const backToList = useCallback(() => {
    setView('list'); setEditingId(null);
    setEditingStore(null); setEditingStaff(null); setActionError(null);
  }, []);

  // ── Store actions ─────────────────────────────────────────────────────────────

  const handleSaveStore = useCallback(async (body: CreateStoreBody | UpdateStoreBody) => {
    setActionLoading(true); setActionError(null);
    try {
      if (editingId) { await updateStore(editingId, body as UpdateStoreBody); showToast('✅ Đã cập nhật chi nhánh'); }
      else           { await createStore(body as CreateStoreBody);            showToast('✅ Đã thêm chi nhánh'); }
      backToList(); loadStores();
    } catch (e) { const m = extractMsg(e); setActionError(m); showToast('❌ ' + m); }
    finally { setActionLoading(false); }
  }, [editingId, backToList, loadStores]);

  const handleDeleteStore = useCallback(async (id: number) => {
    if (!confirm('Xác nhận xoá chi nhánh này?')) return;
    try { await deleteStore(id); showToast('🗑️ Đã xoá chi nhánh'); loadStores(); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [loadStores]);

  const handleToggleStoreStatus = useCallback(async (id: number, current: 'active' | 'inactive') => {
    const next = current === 'active' ? 'inactive' : 'active';
    try { await changeStoreStatus(id, next); showToast(next === 'active' ? '✅ Đã kích hoạt' : '⏸️ Đã tắt'); loadStores(); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [loadStores]);

  const handleExportStores = useCallback(async () => {
    try { await exportStores(storeStatus || undefined); showToast('📥 Đang tải file'); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [storeStatus]);

  // ── Staff actions ─────────────────────────────────────────────────────────────

  const handleSaveStaff = useCallback(async (body: CreateStaffBody | UpdateStaffBody) => {
    setActionLoading(true); setActionError(null);
    try {
      if (editingId) { await updateStaff(editingId, body as UpdateStaffBody); showToast('✅ Đã cập nhật nhân viên'); }
      else           { await createStaff(body as CreateStaffBody);            showToast('✅ Đã thêm nhân viên'); }
      backToList(); loadStaff();
    } catch (e) { const m = extractMsg(e); setActionError(m); showToast('❌ ' + m); }
    finally { setActionLoading(false); }
  }, [editingId, backToList, loadStaff]);

  const handleDeleteStaff = useCallback(async (id: number) => {
    if (!confirm('Xác nhận xoá nhân viên này?')) return;
    try { await deleteStaff(id); showToast('🗑️ Đã xoá nhân viên'); loadStaff(); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [loadStaff]);

  const handleToggleStaffStatus = useCallback(async (id: number, current: 'active' | 'inactive') => {
    const next = current === 'active' ? 'inactive' : 'active';
    try { await changeStaffStatus(id, next); showToast(next === 'active' ? '✅ Đã kích hoạt' : '⏸️ Đã tắt'); loadStaff(); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [loadStaff]);

  const handleResetPassword = useCallback(async (id: number) => {
    if (!confirm('Reset mật khẩu nhân viên này?')) return;
    try { await resetStaffPassword(id, false); showToast('🔑 Đã reset mật khẩu'); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, []);

  const handleExportStaff = useCallback(async () => {
    try { await exportStaff({ storeId: staffStoreId, role: staffRole || undefined, status: staffStatus || undefined }); showToast('📥 Đang tải file'); }
    catch (e) { showToast('❌ ' + extractMsg(e)); }
  }, [staffStoreId, staffRole, staffStatus]);

  // ── Toast ─────────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg); setToastVisible(true);
    toastRef.current = setTimeout(() => setToastVisible(false), 2800);
  };

  return {
    tab, setTab,
    // stores
    stores:         storeData?.content       ?? [],
    storeTotalEl:   storeData?.totalElements ?? 0,
    storeTotalPages: storeData?.totalPages   ?? 0,
    storePage, setStorePage,
    storeQ, setStoreQ,
    storeStatus, setStoreStatus,
    storesLoading,
    handleSaveStore, handleDeleteStore, handleToggleStoreStatus, handleExportStores,
    openCreateStore, openEditStore,
    // staff
    staffList:      staffData?.content       ?? [],
    staffTotalEl:   staffData?.totalElements ?? 0,
    staffTotalPages: staffData?.totalPages   ?? 0,
    staffPage, setStaffPage,
    staffQ, setStaffQ,
    staffStoreId, setStaffStoreId,
    staffRole, setStaffRole,
    staffStatus, setStaffStatus,
    staffLoading,
    handleSaveStaff, handleDeleteStaff, handleToggleStaffStatus,
    handleResetPassword, handleExportStaff,
    openCreateStaff, openEditStaff,
    // roles
    roles,
    // form
    view, formType, backToList,
    editingId, editingStore, editingStaff, detailLoading,
    actionLoading, actionError,
    // toast
    toast, toastVisible,
    refresh,
  };
}

function extractMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const ae = e as { response?: { data?: { message?: string } }; message?: string };
    return ae.response?.data?.message ?? ae.message ?? 'Lỗi không xác định';
  }
  return String(e);
}