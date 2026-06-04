import { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText, X, Loader2 } from 'lucide-react';
import type { usePromotions } from '../../hooks/usePromotions';
import type { CreatePromotionBody, UpdatePromotionBody, PromoType } from '../../api/promotionApi';

type HookReturn = ReturnType<typeof usePromotions>;

// ── Helpers ───────────────────────────────────────────────────────────────

function formatVND(v: number): string {
  return v.toLocaleString('vi-VN') + 'đ';
}

// ── Form state type ───────────────────────────────────────────────────────

interface FormState {
  code: string;
  name: string;
  description: string;
  type: PromoType;
  discount: string;
  maxDiscount: string;
  conditionType: 'none' | 'min_price' | 'min_qty';
  conditionValue: string;
  startDate: string;
  endDate: string;
  maxUses: string;          
  maxUsesPerUser: string;
  applyMode: 'all' | 'select';
  productIds: number[];
}

const DEFAULT_FORM: FormState = {
  code: '', name: '', description: '',
  type: 'percent',
  discount: '', maxDiscount: '',
  conditionType: 'none', conditionValue: '',
  startDate: '', endDate: '',
  maxUses: '', maxUsesPerUser: '',
  applyMode: 'all',
  productIds: [],
};

// ── Component ─────────────────────────────────────────────────────────────

export function PromoForm({ hook }: { hook: HookReturn }) {
  const {
    editingId, editingDetail, detailLoading,
    handleSave, backToList,
    actionLoading, actionError,
  } = hook;

  const isEditing = editingId !== null;

  const [form, setForm]           = useState<FormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Populate form khi edit ────────────────────────────────────────────────
  useEffect(() => {
    if (editingDetail) {
      // Reverse-map minOrderAmount/minQty → conditionType/Value
      let conditionType: FormState['conditionType'] = 'none';
      let conditionValue = '';
      if (editingDetail.minOrderAmount && editingDetail.minOrderAmount > 0) {
        conditionType  = 'min_price';
        conditionValue = String(editingDetail.minOrderAmount);
      } else if (editingDetail.minQty && editingDetail.minQty > 0) {
        conditionType  = 'min_qty';
        conditionValue = String(editingDetail.minQty);
      }

      setForm({
        code:          editingDetail.code,
        name:          editingDetail.name,
        description:   editingDetail.description ?? '',
        type:          editingDetail.type,
        discount:      String(editingDetail.discount ?? ''),
        maxDiscount:   editingDetail.maxDiscount != null ? String(editingDetail.maxDiscount) : '',
        conditionType,
        conditionValue,
        startDate:     editingDetail.startDate ?? '',
        endDate:       editingDetail.endDate   ?? '',
        // FIX: null = unlimited → hiển thị "" không phải "0"
        maxUses:       editingDetail.maxUses != null ? String(editingDetail.maxUses) : '',
        maxUsesPerUser: editingDetail.maxUsesPerUser != null ? String(editingDetail.maxUsesPerUser) : '',
        applyMode:     editingDetail.applyMode ?? 'all',
        productIds:    editingDetail.productIds ?? [],
      });
    } else if (!isEditing) {
      setForm(DEFAULT_FORM);
    }
    setFormErrors({});
  }, [editingDetail, isEditing]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: typeof formErrors = {};
    if (!form.code.trim())      errors.code      = 'Vui lòng nhập mã giảm giá';
    if (!form.name.trim())      errors.name      = 'Vui lòng nhập tên';
    if (!form.discount && form.type !== 'free_ship')
                                errors.discount  = 'Vui lòng nhập mức giảm';
    if (!form.startDate)        errors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!form.endDate)          errors.endDate   = 'Vui lòng chọn ngày kết thúc';
    if (form.startDate && form.endDate && form.startDate > form.endDate)
                                errors.endDate   = 'Ngày kết thúc phải sau ngày bắt đầu';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Build request body ────────────────────────────────────────────────────
  const buildBody = (): CreatePromotionBody | UpdatePromotionBody => {
    // Map conditionType/Value → minOrderAmount / minQty (BE fields)
    const minOrderAmount = form.conditionType === 'min_price' && form.conditionValue
      ? Number(form.conditionValue) : undefined;
    const minQty = form.conditionType === 'min_qty' && form.conditionValue
      ? Number(form.conditionValue) : undefined;

    return {
      code:           form.code.trim().toUpperCase(),
      name:           form.name.trim(),
      description:    form.description.trim() || undefined,
      type:           form.type,
      discount:       Number(form.discount) || 0,
      maxDiscount:    form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minOrderAmount,
      minQty,
      startDate:      form.startDate,
      endDate:        form.endDate,
      // FIX: "" → undefined (null = unlimited), bukan 0
      maxUses:        form.maxUses ? Number(form.maxUses) : undefined,
      maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : undefined,
      applyMode:      form.applyMode,
      productIds:     form.applyMode === 'select' ? form.productIds : undefined,
    };
  };

  const handleSubmit = () => {
    if (!validate()) return;
    handleSave(buildBody());
  };

  const set = (partial: Partial<FormState>) =>
    setForm(prev => ({ ...prev, ...partial }));

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <button
        onClick={backToList}
        className="inline-flex items-center gap-2 text-[var(--blue)] text-sm font-semibold hover:opacity-75 mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {isEditing ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá'}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Cấu hình đầy đủ khuyến mãi và áp dụng cho sản phẩm</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-6">

        {/* API error */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            ⚠️ {actionError}
          </div>
        )}

        {/* ── Thông tin cơ bản ── */}
        <section className="pb-6 border-b border-[var(--border)]">
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--text-primary)] mb-4">Thông Tin Cơ Bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Mã giảm giá *" error={formErrors.code}>
              <input
                type="text"
                value={form.code}
                onChange={e => set({ code: e.target.value.toUpperCase() })}
                placeholder="VD: TET2026"
                maxLength={20}
                disabled={isEditing}   // code không đổi sau khi tạo
                className={inputCls(!!formErrors.code) + ' uppercase font-mono'}
              />
            </Field>
            <Field label="Tên khuyến mãi *" error={formErrors.name}>
              <input
                type="text"
                value={form.name}
                onChange={e => set({ name: e.target.value })}
                placeholder="Khuyến mãi Tết 2026"
                className={inputCls(!!formErrors.name)}
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <textarea
              value={form.description}
              onChange={e => set({ description: e.target.value })}
              rows={3}
              placeholder="Mô tả chi tiết khuyến mãi..."
              className={inputCls(false) + ' resize-y'}
            />
          </Field>
        </section>

        {/* ── Loại & mức giảm ── */}
        <section className="pb-6 border-b border-[var(--border)]">
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--text-primary)] mb-4">Loại & Mức Giảm</h3>

          {/* Type radio */}
          <div className="mb-4">
            <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Loại khuyến mãi *</label>
            <div className="space-y-2">
              {([
                { value: 'percent',   label: 'Giảm theo phần trăm (%)' },
                { value: 'fixed',     label: 'Giảm cố định (₫)' },
                { value: 'free_ship', label: 'Miễn phí vận chuyển' },
              ] as { value: PromoType; label: string }[]).map(opt => (
                <label key={opt.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={form.type === opt.value}
                    onChange={() => set({ type: opt.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {form.type !== 'free_ship' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mức giảm *" error={formErrors.discount}>
                <div className="relative">
                  <input
                    type="number" min="0"
                    value={form.discount}
                    onChange={e => set({ discount: e.target.value })}
                    placeholder="0"
                    className={inputCls(!!formErrors.discount) + ' pr-10'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    {form.type === 'percent' ? '%' : '₫'}
                  </span>
                </div>
              </Field>
              <Field label="Giảm tối đa (₫)">
                <input
                  type="number" min="0"
                  value={form.maxDiscount}
                  onChange={e => set({ maxDiscount: e.target.value })}
                  placeholder="0 = không giới hạn"
                  className={inputCls(false)}
                />
              </Field>
            </div>
          )}

          {/* Điều kiện áp dụng — FIX: map sang minOrderAmount / minQty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Điều kiện áp dụng">
              <select
                value={form.conditionType}
                onChange={e => set({ conditionType: e.target.value as FormState['conditionType'], conditionValue: '' })}
                className={inputCls(false)}
              >
                <option value="none">Không yêu cầu</option>
                <option value="min_price">Đơn hàng tối thiểu (minOrderAmount)</option>
                <option value="min_qty">Số lượng sản phẩm tối thiểu (minQty)</option>
              </select>
            </Field>
            {form.conditionType !== 'none' && (
              <Field label={form.conditionType === 'min_price' ? 'Giá trị tối thiểu (₫)' : 'Số lượng tối thiểu'}>
                <input
                  type="number" min="0"
                  value={form.conditionValue}
                  onChange={e => set({ conditionValue: e.target.value })}
                  placeholder="0"
                  className={inputCls(false)}
                />
              </Field>
            )}
          </div>
        </section>

        {/* ── Thời gian ── */}
        <section className="pb-6 border-b border-[var(--border)]">
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--text-primary)] mb-4">Thời Gian Áp Dụng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu *" error={formErrors.startDate}>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set({ startDate: e.target.value })}
                className={inputCls(!!formErrors.startDate)}
              />
            </Field>
            <Field label="Ngày kết thúc *" error={formErrors.endDate}>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set({ endDate: e.target.value })}
                min={form.startDate}
                className={inputCls(!!formErrors.endDate)}
              />
            </Field>
          </div>
        </section>

        {/* ── Giới hạn sử dụng ── */}
        <section className="pb-6 border-b border-[var(--border)]">
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--text-primary)] mb-4">Giới Hạn Sử Dụng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Số lần tối đa (toàn hệ thống)">
              <input
                type="number" min="0"
                value={form.maxUses}
                onChange={e => set({ maxUses: e.target.value })}
                // FIX: placeholder rõ hơn — để trống = unlimited (không phải nhập 0)
                placeholder="Để trống = không giới hạn"
                className={inputCls(false)}
              />
              <span className="text-xs text-gray-400 mt-1 block">Để trống = không giới hạn</span>
            </Field>
            <Field label="Số lần dùng / khách hàng">
              <input
                type="number" min="0"
                value={form.maxUsesPerUser}
                onChange={e => set({ maxUsesPerUser: e.target.value })}
                placeholder="Để trống = không giới hạn"
                className={inputCls(false)}
              />
            </Field>
          </div>
        </section>

        {/* ── Áp dụng sản phẩm ── */}
        <section>
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--text-primary)] mb-4">Áp Dụng Cho Sản Phẩm</h3>
          <div className="space-y-2 mb-4">
            {([
              { value: 'all',    label: 'Áp dụng cho tất cả sản phẩm' },
              { value: 'select', label: 'Áp dụng cho sản phẩm được chọn' },
            ] as { value: 'all' | 'select'; label: string }[]).map(opt => (
              <label key={opt.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  value={opt.value}
                  checked={form.applyMode === opt.value}
                  onChange={() => set({ applyMode: opt.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>

          {form.applyMode === 'select' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              💡 Sau khi lưu, sử dụng tính năng "Gán sản phẩm" để chọn sản phẩm áp dụng.
              {isEditing && editingDetail?.productIds?.length ? (
                <span className="ml-2 font-bold">Hiện tại: {editingDetail.productIds.length} sản phẩm</span>
              ) : null}
            </div>
          )}
        </section>

        {/* ── Actions ── */}
        <div className="pt-5 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-[var(--blue)] text-white rounded-md hover:bg-[#1d4ed8] disabled:opacity-50 flex items-center gap-2 font-bold text-sm"
          >
            {actionLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              : <><Save className="w-4 h-4" /> {isEditing ? 'Lưu thay đổi' : 'Lưu & Kích Hoạt'}</>
            }
          </button>
          <button
            onClick={backToList}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:border-[var(--text-secondary)] disabled:opacity-50 flex items-center gap-2 font-bold text-sm"
          >
            <X className="w-4 h-4" /> Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 border ${hasError ? 'border-red-500' : 'border-[var(--border)]'} rounded-md text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue-light)] transition-all`;
}

function Field({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-[var(--text-secondary)]">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}