import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2 } from 'lucide-react';
import type { CategoryDto, CreateCategoryBody, UpdateCategoryBody } from '../api/categoryApi';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: CategoryDto | null;   // null = create mode
  flatList: CategoryDto[];               // dùng cho select parent
  loading: boolean;
  error: string | null;
  onSave: (data: CreateCategoryBody | UpdateCategoryBody) => void;
  onClose: () => void;
}

// ── Slug helper (giữ nguyên logic từ mock) ───────────────────────────────
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CategoryModal({
  isOpen, editingCategory, flatList,
  loading, error, onSave, onClose,
}: CategoryModalProps) {
  const isEditing = !!editingCategory;

  const [formData, setFormData] = useState({
    name:      '',
    slug:      '',
    parentId:  '' as string,
    sortOrder: 1,            // BE field: sortOrder (không phải order)
    visible:   true,
  });

  const [formError, setFormError]               = useState('');
  const [slugManuallyEdited, setSlugEdited]     = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name:      editingCategory.name,
        slug:      editingCategory.slug,
        parentId:  editingCategory.parentId?.toString() ?? '',
        sortOrder: editingCategory.sortOrder,   // dùng sortOrder
        visible:   editingCategory.visible,
      });
      setSlugEdited(true);
    } else {
      setFormData({ name: '', slug: '', parentId: '', sortOrder: 1, visible: true });
      setSlugEdited(false);
    }
    setFormError('');
  }, [editingCategory, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : toSlug(name),
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }
    const body: CreateCategoryBody | UpdateCategoryBody = {
      name:      formData.name.trim(),
      slug:      formData.slug.trim() || toSlug(formData.name),
      parentId:  formData.parentId ? Number(formData.parentId) : null,
      sortOrder: formData.sortOrder,   // gửi sortOrder lên BE
      visible:   formData.visible,
    };
    onSave(body);
  };

  // Loại bỏ chính nó và descendants khỏi danh sách parent
  const getDescendantIds = (id: number): number[] => {
    const ids: number[] = [];
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      flatList.filter(c => c.parentId === cur).forEach(c => {
        ids.push(c.id);
        queue.push(c.id);
      });
    }
    return ids;
  };

  const excludeIds = editingCategory
    ? [editingCategory.id, ...getDescendantIds(editingCategory.id)]
    : [];

  const buildOptions = (parentId: number | null, depth: number): React.JSX.Element[] => {
    const cats = flatList
      .filter(c => c.parentId === parentId && !excludeIds.includes(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);  // sort theo sortOrder

    const opts: React.JSX.Element[] = [];
    cats.forEach(c => {
      opts.push(
        <option key={c.id} value={c.id}>
          {'├ '.repeat(depth)}{c.name}
        </option>
      );
      opts.push(...buildOptions(c.id, depth + 1));
    });
    return opts;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-[440px] max-w-[95vw] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200">
          <h3 className="font-black text-gray-900">
            {isEditing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
          </h3>
          <button onClick={onClose} disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-200 text-gray-500 disabled:opacity-50">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* API error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Tên danh mục <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="VD: Laptop Gaming"
              disabled={loading}
              className={`w-full px-3 py-2 border ${formError ? 'border-red-600' : 'border-gray-300'} rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-50`}
              autoFocus
            />
            {formError && <span className="text-xs text-red-600 mt-1 block">{formError}</span>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Slug (URL)</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50 focus-within:border-blue-600">
              <span className="px-3 py-2 text-sm text-gray-500 bg-gray-100 border-r border-gray-300">/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={e => { setFormData(p => ({ ...p, slug: e.target.value })); setSlugEdited(true); }}
                disabled={loading}
                placeholder="VD: laptop-gaming"
                className="flex-1 px-2 py-2 text-sm bg-transparent outline-none disabled:opacity-50"
              />
            </div>
            <span className="text-xs text-gray-500 mt-1 block">Tự động tạo từ tên, có thể chỉnh sửa</span>
          </div>

          {/* Parent */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Danh mục cha</label>
            <select
              value={formData.parentId}
              onChange={e => setFormData(p => ({ ...p, parentId: e.target.value }))}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 disabled:opacity-50"
            >
              <option value="">-- Không có (Danh mục gốc) --</option>
              {buildOptions(null, 0)}
            </select>
          </div>

          {/* Sort order — field sortOrder (không phải order) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Thứ tự sắp xếp</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={e => setFormData(p => ({ ...p, sortOrder: parseInt(e.target.value) || 1 }))}
              min="0"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 disabled:opacity-50"
            />
            <span className="text-xs text-gray-500 mt-1 block">Số nhỏ hơn hiển thị trước</span>
          </div>

          {/* Visible toggle */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => !loading && setFormData(p => ({ ...p, visible: !p.visible }))}
                className={`w-10 h-5.5 rounded-full relative transition-colors cursor-pointer ${formData.visible ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${formData.visible ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-semibold text-gray-900">Hiển thị danh mục</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 pt-3.5 pb-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading}
            className="px-5 py-2 border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5">
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
              : isEditing
                ? <><Save className="w-3.5 h-3.5" /> Lưu thay đổi</>
                : <><Plus className="w-3.5 h-3.5" /> Thêm Danh Mục</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}