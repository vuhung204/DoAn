import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import type { useSystem } from '../../hooks/useSystem';
import type { CreateStaffBody, UpdateStaffBody } from '../../api/systemApi';

type HookReturn = ReturnType<typeof useSystem>;

export function StaffForm({ hook }: { hook: HookReturn }) {
  const {
    editingId, editingStaff, detailLoading,
    handleSaveStaff, backToList,
    actionLoading, actionError,
    stores,   // danh sách store từ API — thay thế hardcode "Hoàn Kiếm, Quận 1..."
    roles,    // danh sách role từ GET /api/admin/staff/roles — thay thế hardcode
  } = hook;

  const isEditing = !!editingId;

  const [form, setForm] = useState({
    fullName:   '',
    email:      '',
    phone:      '',
    storeId:    '' as string,   // string để dùng với select value
    roleId:     '' as string,
    password:   '',
    status:     'active' as 'active' | 'inactive',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  // ── Populate form khi edit ────────────────────────────────────────────────
  useEffect(() => {
    if (editingStaff) {
      setForm({
        fullName: editingStaff.fullName,
        email:    editingStaff.email,
        phone:    editingStaff.phone ?? '',
        // BE trả storeId (Long) + roleId (Long) — dùng trực tiếp cho select
        storeId:  editingStaff.storeId != null ? String(editingStaff.storeId) : '',
        roleId:   editingStaff.roleId  != null ? String(editingStaff.roleId)  : '',
        password: '',   // không hiển thị password cũ
        status:   editingStaff.status,
      });
    } else if (!isEditing) {
      setForm({ fullName: '', email: '', phone: '', storeId: '', roleId: '', password: '', status: 'active' });
    }
    setErrors({});
  }, [editingStaff, isEditing]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.email.trim())    e.email    = 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.storeId)         e.storeId  = 'Vui lòng chọn chi nhánh';
    if (!form.roleId)          e.roleId   = 'Vui lòng chọn vai trò';
    if (!isEditing && !form.password.trim()) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isEditing) {
      // Update: chỉ gửi field có giá trị, password bỏ qua
      const body: UpdateStaffBody = {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        storeId:  Number(form.storeId),
        roleId:   Number(form.roleId),
        status:   form.status,
      };
      handleSaveStaff(body);
    } else {
      // Create: gửi đầy đủ, bao gồm password
      const body: CreateStaffBody = {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        storeId:  Number(form.storeId),   // BE nhận Long storeId, không phải string branch
        roleId:   Number(form.roleId),    // BE nhận Long roleId, không phải string role
        password: form.password.trim(),
        status:   form.status,
      };
      handleSaveStaff(body);
    }
  };

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={backToList}
        className="inline-flex items-center gap-2 text-[var(--blue)] text-sm font-semibold hover:opacity-75 mb-3">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {isEditing ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Nhập thông tin nhân viên</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4">

        {/* API error */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            ⚠️ {actionError}
          </div>
        )}

        {/* Họ tên + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Họ và tên *" error={errors.fullName}>
            <input type="text" value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className={iCls(!!errors.fullName)} />
          </Field>
          <Field label="Email *" error={errors.email}>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@laptopstore.vn"
              disabled={isEditing}   // email không đổi sau khi tạo (BE validate unique)
              className={iCls(!!errors.email) + (isEditing ? ' opacity-60 cursor-not-allowed' : '')} />
          </Field>
        </div>

        {/* SĐT + Mật khẩu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Số điện thoại">
            <input type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="0912345678"
              className={iCls(false)} />
          </Field>
          {!isEditing && (
            <Field label="Mật khẩu *" error={errors.password}>
              <input type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Mật khẩu ban đầu"
                className={iCls(!!errors.password)} />
            </Field>
          )}
        </div>

        {/* Chi nhánh + Vai trò — FIX: dùng storeId/roleId từ API thay vì string hardcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Chi nhánh *" error={errors.storeId}>
            <select value={form.storeId}
              onChange={e => set('storeId', e.target.value)}
              className={iCls(!!errors.storeId)}>
              <option value="">— Chọn chi nhánh —</option>
              {/* Danh sách từ API /api/admin/stores, không hardcode */}
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Vai trò *" error={errors.roleId}>
            <select value={form.roleId}
              onChange={e => set('roleId', e.target.value)}
              className={iCls(!!errors.roleId)}>
              <option value="">— Chọn vai trò —</option>
              {/* Danh sách từ API /api/admin/staff/roles, không hardcode */}
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Trạng thái */}
        <Field label="Trạng thái">
          <select value={form.status}
            onChange={e => set('status', e.target.value as 'active' | 'inactive')}
            className={iCls(false)}>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </Field>

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={handleSubmit} disabled={actionLoading}
            className="px-5 py-2.5 bg-[var(--blue)] text-white rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {actionLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              : <><Save className="w-4 h-4" /> Lưu Nhân Viên</>
            }
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

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-[var(--text-secondary)]">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function iCls(hasError: boolean): string {
  return `px-3 py-2 border ${
    hasError ? 'border-red-500' : 'border-[var(--border)]'
  } rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all w-full bg-white`;
}