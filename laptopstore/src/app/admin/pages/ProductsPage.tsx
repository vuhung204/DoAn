import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductTable } from '../components/ProductTable';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ProductForm } from '../components/ProductForm';
import { DeleteModal } from '../components/DeleteModal';
import { Toast } from '../components/Toast';
import {
  fetchProducts, fetchFiltersMeta, deleteProduct,
  type ProductListDto, type ProductFiltersMetaDto,
} from '../api/productApi';

const PAGE_SIZE = 8;

export default function ProductsPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Data
  const [products, setProducts]     = useState<ProductListDto[]>([]);
  const [meta, setMeta]             = useState<ProductFiltersMetaDto | null>(null);
  const [totalElements, setTotal]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search,         setSearch]         = useState('');
  const [filterBrandId,  setFilterBrandId]  = useState<number | undefined>();
  const [filterCatId,    setFilterCatId]    = useState<number | undefined>();
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [page,           setPage]           = useState(1);

  // Modals
  const [deleteModal,    setDeleteModal]    = useState<{ id: number; name: string } | null>(null);
  const [toastMsg,       setToastMsg]       = useState('');
  const [toastVisible,   setToastVisible]   = useState(false);

  const showToast = (msg: string) => { setToastMsg(msg); setToastVisible(true); };

  // Load filter meta once
  useEffect(() => {
    fetchFiltersMeta().then(setMeta).catch(console.error);
  }, []);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProducts({
        page:       page - 1,
        size:       PAGE_SIZE,
        q:          search || undefined,
        brandId:    filterBrandId,
        categoryId: filterCatId,
        status:     filterStatus === 'all' ? undefined : filterStatus,
      });
      setProducts(result.content);
      setTotal(result.totalElements);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBrandId, filterCatId, filterStatus]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setPage(1); }, [search, filterBrandId, filterCatId, filterStatus]);

  const handleClearFilters = () => {
    setSearch(''); setFilterBrandId(undefined);
    setFilterCatId(undefined); setFilterStatus('all'); setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteProduct(deleteModal.id);
      showToast(`🗑️ Đã xoá sản phẩm "${deleteModal.name}"`);
      loadProducts();
    } catch { showToast('❌ Xoá thất bại'); }
    setDeleteModal(null);
  };

  const handleSaved = (name: string, isEdit: boolean) => {
    showToast(isEdit ? `✅ Đã cập nhật "${name}"` : `✅ Đã thêm "${name}"`);
    setView('list');
    setEditingId(null);
    loadProducts();
  };

  // Brand/category name → id lookup
  const brandIdByName = (name: string) =>
    meta?.brands.find(b => b.name === name)?.id;
  const catIdByName = (name: string) =>
    meta?.categories.find(c => c.name === name)?.id;

  const brandNames    = meta?.brands.map(b => b.name)    ?? [];
  const categoryNames = meta?.categories.map(c => c.name) ?? [];

  if (view === 'form') {
    return (
      <ProductForm
        productId={editingId}
        meta={meta}
        onSaved={handleSaved}
        onCancel={() => { setView('list'); setEditingId(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-black text-gray-900">Quản Lý Sản Phẩm</h1>
          <p className="text-gray-600">Tìm kiếm, chỉnh sửa và quản lý sản phẩm</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setView('form'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Sản Phẩm
        </button>
      </div>

      <ProductFilterBar
        search={search}
        onSearchChange={setSearch}
        filterBrand={meta?.brands.find(b => b.id === filterBrandId)?.name ?? ''}
        onBrandChange={name => setFilterBrandId(name ? brandIdByName(name) : undefined)}
        filterCategory={meta?.categories.find(c => c.id === filterCatId)?.name ?? ''}
        onCategoryChange={name => setFilterCatId(name ? catIdByName(name) : undefined)}
        filterStatus={filterStatus === 'all' ? '' : filterStatus}
        onStatusChange={v => setFilterStatus(v || 'all')}
        onClearFilters={handleClearFilters}
        brands={brandNames}
        categories={categoryNames}
      />

      <div className="flex items-center justify-between px-0.5 pb-2.5">
        <span className="text-sm text-gray-500">
          {loading ? 'Đang tải...' : `Hiển thị ${products.length} / ${totalElements} sản phẩm`}
        </span>
        <button onClick={handleClearFilters} className="text-sm font-semibold text-blue-600 hover:opacity-70 transition-opacity">
          Xoá bộ lọc
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-[13px]">Đang tải...</span>
        </div>
      ) : products.length > 0 ? (
        <>
          <ProductTable
            products={products}
            onEdit={id => { setEditingId(id); setView('form'); }}
            onDelete={(id, name) => setDeleteModal({ id, name })}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState onClearFilters={handleClearFilters} />
      )}

      <DeleteModal
        isOpen={!!deleteModal}
        productName={deleteModal?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
      <Toast message={toastMsg} isVisible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}