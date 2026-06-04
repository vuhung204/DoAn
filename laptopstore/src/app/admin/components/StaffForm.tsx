import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Staff {
  id: number;
  name: string;
  email: string;
  branch: string;
  role: string;
  status: 'active' | 'inactive';
}

interface StaffFormProps {
  onBack: () => void;
  staff?: Staff | null;
  onSave: (staff: Partial<Staff>) => void;
}

export function StaffForm({ onBack, staff, onSave }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: '',
    role: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        branch: staff.branch,
        role: staff.role,
        status: staff.status,
      });
    }
  }, [staff]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
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
          {staff ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Nhập thông tin nhân viên</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Họ và tên *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Chi nhánh</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              >
                <option value="">Chọn chi nhánh</option>
                <option>Hoàn Kiếm</option>
                <option>Quận 1</option>
                <option>Cầu Giấy</option>
                <option>Bình Thạnh</option>
                <option>Hải Phòng</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-3 py-2 border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all"
              >
                <option value="">Chọn vai trò</option>
                <option>Quản lý</option>
                <option>Nhân viên bán hàng</option>
                <option>Nhân viên kho</option>
                <option>Thu ngân</option>
              </select>
            </div>
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

        <div className="pt-5 mt-5 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[var(--blue)] text-white rounded-md hover:bg-[#1d4ed8] transition-colors flex items-center gap-2 font-bold text-sm"
          >
            <Save className="w-4 h-4" /> Lưu Nhân Viên
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
