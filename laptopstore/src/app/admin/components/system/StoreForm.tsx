import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import type { useSystem } from '../../hooks/useSystem';
import type { CreateStoreBody, UpdateStoreBody } from '../../api/systemApi';

type HookReturn = ReturnType<typeof useSystem>;

export function StoreForm({ hook }: { hook: HookReturn }) {
  const { editingId, editingStore, detailLoading, handleSaveStore, backToList, actionLoading, actionError } = hook;
  const isEditing = !!editingId;

  const [form, setForm] = useState({
    name: '', address: '', district: '', city: '',
    phone: '', email: '', status: 'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    if (editingStore) {
      setForm({
        name:     editingStore.name,
        address:  editingStore.address,
        district: editingStore.district ?? '',
        city:     editingStore.city,
        phone:    editingStore.phone ?? '',
        email:    editingStore.email ?? '',
        status:   editingStore.status,
      });
    } else if (!isEditing) {
      setForm({ name: '', address: '', district: '', city: '', phone: '', email: '', status: 'active' });
    }
    setErrors({});
  }, [editingStore, isEditing]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim())    e.name    = 'Vui lòng nhập tên chi nhánh';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!form.city.trim())    e.city    = 'Vui lòng nhập thành phố';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const body: CreateStoreBody | UpdateStoreBody = {
      name:     form.name.trim(),
      address:  form.address.trim(),
      district: form.district.trim() || undefined,
      city:     form.city.trim(),
      phone:    form.phone.trim()  || undefined,
      email:    form.email.trim()  || undefined,
      status:   form.status,
    };
    handleSaveStore(body);
  };

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  if (detailLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div>
      <button onClick={backToList} className="inline-flex items-center gap-2 text-[var(--blue)] text-sm font-semibold hover:opacity-75 mb-3">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {isEditing ? 'Chỉnh Sửa Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Nhập thông tin chi nhánh cửa hàng</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">⚠️ {actionError}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tên chi nhánh *" error={errors.name}>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="VD: Hoàn Kiếm" className={iCls(!!errors.name)} />
          </Field>
          <Field label="Thành phố *" error={errors.city}>
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="VD: Hà Nội" className={iCls(!!errors.city)} />
          </Field>
        </div>

        <Field label="Địa chỉ *" error={errors.address}>
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="VD: 123 Phố Hoàn Kiếm" className={iCls(!!errors.address)} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Quận/Huyện">
            <input type="text" value={form.district} onChange={e => set('district', e.target.value)}
              placeholder="VD: Hoàn Kiếm" className={iCls(false)} />
          </Field>
          <Field label="Điện thoại">
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="0912345678" className={iCls(false)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="branch@laptopstore.vn" className={iCls(false)} />
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={iCls(false)}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </Field>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={handleSubmit} disabled={actionLoading}
            className="px-5 py-2.5 bg-[var(--blue)] text-white rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Save className="w-4 h-4" />Lưu Chi Nhánh</>}
          </button>
          <button onClick={backToList} disabled={actionLoading}
            className="px-5 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-md font-bold text-sm hover:border-gray-500 disabled:opacity-50 flex items-center gap-2">
            <X className="w-4 h-4" /> Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-[var(--text-secondary)]">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function iCls(hasError: boolean) {
  return `px-3 py-2 border ${hasError ? 'border-red-500' : 'border-[var(--border)]'} rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all w-full`;
}