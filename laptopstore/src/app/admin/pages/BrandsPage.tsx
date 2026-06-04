import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { StatBar } from '../components/StatBar';
import { BrandCard } from '../components/BrandCard';
import { BrandModal } from '../components/BrandModal';
import { BrandDeleteModal } from '../components/BrandDeleteModal';
import { BrandEmptyState } from '../components/BrandEmptyState';
import { Toast } from '../components/Toast';
import {
  fetchBrands, fetchBrandStats, createBrand, updateBrand,
  deleteBrand, type BrandDto, type BrandStatsDto,
} from '../api/brandApi';

export const brandColors = [
  '#1e3a5f','#166534','#92400e',
  '#5b21b6','#1d4ed8','#9f1239','#065f46',
];

export default function BrandsPage() {
  const [brands,    setBrands]    = useState<BrandDto[]>([]);
  const [stats,     setStats]     = useState<BrandStatsDto | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [editingId,       setEditingId]       = useState<number | null>(null);
  const [brandModalOpen,  setBrandModalOpen]   = useState(false);
  const [deleteModal,     setDeleteModal]      = useState<{ id: number; name: string } | null>(null);

  const [toastMsg,     setToastMsg]     = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (msg: string) => { setToastMsg(msg); setToastVisible(true); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pageResult, statsResult] = await Promise.all([
        fetchBrands({ size: 100, sort: 'name', direction: 'asc' }),
        fetchBrandStats(),
      ]);
      setBrands(pageResult.content);
      setStats(statsResult);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Không thể tải dữ liệu thương hiệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveBrand = async (formData: {
    name: string; slug: string; description: string; website: string; active: boolean;
  }) => {
    try {
      const req = {
        name:        formData.name,
        slug:        formData.slug || undefined,
        description: formData.description || undefined,
        website:     formData.website || undefined,
        active:      formData.active,
      };

      if (editingId !== null) {
        await updateBrand(editingId, req);
        showToast(`✅ Đã cập nhật thương hiệu "${formData.name}"`);
      } else {
        await createBrand(req);
        showToast(`✅ Đã thêm thương hiệu "${formData.name}"`);
      }

      setBrandModalOpen(false);
      setEditingId(null);
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Lưu thất bại';
      showToast(`❌ ${msg}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteBrand(deleteModal.id);
      showToast(`🗑️ Đã xoá thương hiệu "${deleteModal.name}"`);
      load();
    } catch (e: any) {
      // BE trả 409/500 nếu còn sản phẩm
      const msg = e?.response?.data?.message ?? 'Xoá thất bại';
      showToast(`❌ ${msg}`);
    }
    setDeleteModal(null);
  };

  // Stats từ BE
  const statItems = stats ? [
    { label: 'Tổng thương hiệu', value: stats.totalBrands,        colorClass: 'text-gray-900' },
    { label: 'Đang hoạt động',   value: stats.activeBrands,       colorClass: 'text-green-600' },
    { label: 'Có sản phẩm',      value: stats.brandsWithProducts, colorClass: 'text-blue-600' },
    { label: 'Tổng sản phẩm',    value: stats.totalProducts,      colorClass: 'text-purple-600' },
  ] : [];

  const editingBrand = editingId !== null ? brands.find(b => b.id === editingId) ?? null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-[13px]">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13.5px]">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-black text-gray-900">Quản Lý Thương Hiệu</h1>
          <p className="text-gray-600">Danh sách các thương hiệu laptop</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setBrandModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Thương Hiệu
        </button>
      </div>

      {/* Stats từ BE */}
      <StatBar stats={statItems} />

      {brands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {brands.map((brand, idx) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              color={brandColors[idx % brandColors.length]}
              index={idx}
              onEdit={id => { setEditingId(id); setBrandModalOpen(true); }}
              onDelete={(id, name) => setDeleteModal({ id, name })}
            />
          ))}
        </div>
      ) : (
        <BrandEmptyState />
      )}

      <BrandModal
        isOpen={brandModalOpen}
        brand={editingBrand}
        onSave={handleSaveBrand}
        onClose={() => { setBrandModalOpen(false); setEditingId(null); }}
      />

      <BrandDeleteModal
        isOpen={!!deleteModal}
        brandName={deleteModal?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />

      <Toast message={toastMsg} isVisible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}