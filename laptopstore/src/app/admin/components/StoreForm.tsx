import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  city: string;
  status: 'active' | 'inactive';
}

interface StoreFormProps {
  onBack: () => void;
  store?: Store | null;
  onSave: (store: Partial<Store>) => void;
}

export function StoreForm({ onBack, store, onSave }: StoreFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        address: store.address,
        phone: store.phone,
        city: store.city,
        status: store.status,
      });
    }
  }, [store]);

  const handleSubmit = () => {
    if (!formData.name || !formData.address) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    onSave(formData);
  };

  return (
    <div>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onBack();
        }}
        className="inline-flex items-center gap-2 text-[var(--blue)] text-sm font-semibold hover:opacity-75 transition-opacity mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </a>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {store ? 'Chỉnh Sửa Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Nhập thông tin chi nhánh cửa hàng</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Tên chi nhánh *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Hoàn Kiếm"
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Thành phố</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="VD: Hà Nội"
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[var(--text-secondary)]">Địa chỉ *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Đường Hoàn Kiếm"
              className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-5 mt-5 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[var(--blue)] text-white rounded-md hover:bg-[#1d4ed8] transition-colors flex items-center gap-2 font-bold text-sm"
          >
            <Save className="w-4 h-4" /> Lưu Chi Nhánh
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 font-bold text-sm"
          >
            <X className="w-4 h-4" /> Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
