import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCategoryTree,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryVisibility,
  reorderCategories,
  exportCategories,
  type CategoryDto,
  type CategoryTreeDto,
  type CategoryPageDto,
  type CreateCategoryBody,
  type UpdateCategoryBody,
} from '../api/categoryApi';

// ── Hook ─────────────────────────────────────────────────────────────────

export function useCategories() {
  // Tree
  const [tree, setTree]             = useState<CategoryTreeDto[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  // Flat list (cho modal select parent)
  const [flatList, setFlatList]     = useState<CategoryDto[]>([]);
  const [flatLoading, setFlatLoading] = useState(false);

  // Modal state
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);

  // Delete modal
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [deletingChildCount, setDeletingChildCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Action
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // Toast
  const [toast, setToast]   = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load tree ─────────────────────────────────────────────────────────────
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const data = await fetchCategoryTree();
      setTree(data);
    } catch { /* fail silently */ }
    finally { setTreeLoading(false); }
  }, []);

  // ── Load flat list — dùng cho modal select parent ─────────────────────────
  const loadFlatList = useCallback(async () => {
    setFlatLoading(true);
    try {
      const data = await fetchCategories({ size: 200, sort: 'sortOrder', dir: 'asc' });
      setFlatList(data.content);
    } catch { /* fail silently */ }
    finally { setFlatLoading(false); }
  }, []);

  useEffect(() => { loadTree(); },     [loadTree]);
  useEffect(() => { loadFlatList(); }, [loadFlatList]);

  const refresh = useCallback(() => {
    loadTree();
    loadFlatList();
  }, [loadTree, loadFlatList]);

  // ── Count descendants từ tree (dùng cho delete confirmation) ─────────────
  const countDescendants = useCallback((id: number): number => {
    const countInList = (items: CategoryTreeDto[]): number => {
      for (const item of items) {
        if (item.id === id) {
          // Đếm tất cả descendants
          const countAll = (nodes: CategoryTreeDto[]): number =>
            nodes.reduce((sum, n) => sum + 1 + countAll(n.children), 0);
          return countAll(item.children);
        }
        const found = countInList(item.children);
        if (found >= 0) return found;
      }
      return 0;
    };
    return countInList(tree);
  }, [tree]);

  // ── Modal handlers ────────────────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditingId(null);
    setEditingCategory(null);
    setActionError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((id: number) => {
    const found = flatList.find(c => c.id === id) ?? null;
    setEditingId(id);
    setEditingCategory(found);
    setActionError(null);
    setModalOpen(true);
  }, [flatList]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setEditingCategory(null);
    setActionError(null);
  }, []);

  // ── Delete modal handlers ─────────────────────────────────────────────────
  const openDelete = useCallback((id: number, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setDeletingChildCount(countDescendants(id));
    setDeleteModalOpen(true);
  }, [countDescendants]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingId(null);
    setDeletingName('');
    setDeletingChildCount(0);
  }, []);

  // ── CRUD actions ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async (body: CreateCategoryBody | UpdateCategoryBody) => {
    setActionLoading(true);
    setActionError(null);
    try {
      if (editingId !== null) {
        await updateCategory(editingId, body as UpdateCategoryBody);
        showToast(`✅ Đã cập nhật danh mục "${body.name ?? ''}"`);
      } else {
        await createCategory(body as CreateCategoryBody);
        showToast(`✅ Đã thêm danh mục "${body.name ?? ''}"`);
      }
      closeModal();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      setActionError(msg);
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [editingId, closeModal, refresh]);

  const handleDelete = useCallback(async (force = false) => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await deleteCategory(deletingId, force);
      showToast(`🗑️ Đã xoá danh mục "${deletingName}"`);
      closeDeleteModal();
      refresh();
    } catch (e) {
      const msg = extractMsg(e);
      // Nếu BE trả 409 (có con) → thử lại với force=true (FE đã confirm)
      showToast('❌ ' + msg);
    } finally { setActionLoading(false); }
  }, [deletingId, deletingName, closeDeleteModal, refresh]);

  const handleToggleVisibility = useCallback(async (id: number, visible: boolean) => {
    try {
      await setCategoryVisibility(id, visible);
      showToast(visible ? '👁️ Đã hiển thị danh mục' : '🙈 Đã ẩn danh mục');
      refresh();
    } catch (e) {
      showToast('❌ ' + extractMsg(e));
    }
  }, [refresh]);

  const handleExport = useCallback(async () => {
    try {
      await exportCategories();
      showToast('📥 Đang tải file xuất');
    } catch (e) {
      showToast('❌ Xuất file thất bại: ' + extractMsg(e));
    }
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    setToastVisible(true);
    toastRef.current = setTimeout(() => setToastVisible(false), 2800);
  };

  return {
    // tree
    tree, treeLoading,
    // flat list (cho modal)
    flatList, flatLoading,
    // modal
    modalOpen, editingId, editingCategory,
    openCreate, openEdit, closeModal,
    // delete modal
    deleteModalOpen, deletingName, deletingChildCount,
    openDelete, closeDeleteModal,
    // actions
    handleSave,
    handleDelete,
    handleToggleVisibility,
    handleExport,
    actionLoading,
    actionError,
    // toast
    toast, toastVisible,
    // utils
    refresh,
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