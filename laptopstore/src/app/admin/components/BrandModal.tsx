import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { BrandDto } from '../api/brandApi';

interface BrandModalProps {
  isOpen: boolean;
  brand: BrandDto | null;
  onSave: (data: {
    name: string;
    slug: string;
    description: string;
    website: string;
    active: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function BrandModal({ isOpen, brand, onSave, onClose }: BrandModalProps) {
  const isEditing = !!brand;

  const [formData, setFormData] = useState({
    name:        '',
    slug:        '',
    description: '',  // BE field name — không dùng 'desc'
    website:     '',
    active:      true,
  });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (brand) {
      setFormData({
        name:        brand.name        ?? '',
        slug:        brand.slug        ?? '',
        description: brand.description ?? '',  // map từ BE field
        website:     brand.website     ?? '',
        active:      brand.active !== false,
      });
    } else {
      setFormData({ name: '', slug: '', description: '', website: '', active: true });
    }
    setError('');
  }, [brand, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug khi tạo mới
      slug: isEditing ? prev.slug : name.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên thương hiệu.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name:        formData.name.trim(),
        slug:        formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        website:     formData.website.trim(),
        active:      formData.active,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-in fade-in duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-[440px] w-[92%] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="font-black text-gray-900">
            {isEditing ? 'Chỉnh Sửa Thương Hiệu' : 'Thêm Thương Hiệu'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Tên thương hiệu <span className="text-red-600">*</span>
            </label>
            <input type="text" name="name" value={formData.name}
              onChange={handleNameChange} placeholder="VD: Asus" autoFocus
              className={`w-full px-3.5 py-2.5 border ${error ? 'border-red-600' : 'border-gray-300'} rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all`}
            />
            {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Slug</label>
            <input type="text" name="slug" value={formData.slug}
              onChange={handleChange} placeholder="VD: asus"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Mô tả</label>
            {/* name="description" khớp với BE field */}
            <textarea name="description" value={formData.description}
              onChange={handleChange} rows={3}
              placeholder="Mô tả ngắn về thương hiệu..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Website</label>
            <input type="text" name="website" value={formData.website}
              onChange={handleChange} placeholder="VD: https://asus.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={formData.active}
              onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-900">Đang hoạt động</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 p-5 border-t border-gray-200">
          <button onClick={onClose}
            className="flex-1 px-3 py-2.5 border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Lưu thay đổi' : 'Thêm Thương Hiệu'}
          </button>
        </div>
      </div>
    </div>
  );
}