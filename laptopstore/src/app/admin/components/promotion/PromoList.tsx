import { useState } from 'react';
import { Tag, CheckCircle, Clock, Search, Edit, Trash2, Percent, Truck, Download, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import type { usePromotions } from '../../hooks/usePromotions';
import type { PromotionListDto, PromoStatus, PromoType } from '../../api/promotionApi';

type HookReturn = ReturnType<typeof usePromotions>;

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<PromoStatus, string> = {
  active:   'Đang hoạt động',
  inactive: 'Không hoạt động',
  upcoming: 'Sắp bắt đầu',
  expired:  'Đã hết hạn',
};

const STATUS_COLORS: Record<PromoStatus, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  upcoming: 'bg-blue-100 text-blue-700',
  expired:  'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<PromoType, string> = {
  percent:   'Giảm theo %',
  fixed:     'Giảm cố định',
  free_ship: 'Miễn phí ship',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function formatVND(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString('vi-VN') + 'đ';
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

/** maxUses: null hoặc 0 đều = không giới hạn */
function formatMaxUses(maxUses: number | null): string {
  return maxUses ? maxUses.toString() : 'Không giới hạn';
}

function getDiscountText(promo: PromotionListDto): string {
  if (promo.type === 'percent') {
    const max = promo.maxDiscount ? ` (tối đa ${formatVND(promo.maxDiscount)})` : '';
    return `${promo.discount}%${max}`;
  }
  if (promo.type === 'fixed') return formatVND(promo.discount);
  return 'Miễn phí vận chuyển';
}

// ── Component ─────────────────────────────────────────────────────────────

export function PromoList({ hook }: { hook: HookReturn }) {
  const {
    promos, totalElements, totalPages, currentPage,
    loading, error,
    filter, setFilter, setPage, refresh,
    stats,
    openCreate, openEdit,
    handleDelete, handleToggleStatus, handleExport,
    actionLoading,
  } = hook;

  const [localQ, setLocalQ] = useState(filter.q);
  const commitSearch = () => { if (localQ !== filter.q) setFilter({ q: localQ }); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Quản Lý Khuyến Mãi</h1>
          <p className="text-sm text-[var(--text-muted)]">Danh sách mã giảm giá và cấu hình khuyến mãi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Xuất XLSX
          </button>
          <button
            onClick={openCreate}
            className="bg-[var(--blue)] text-white px-4 py-2 rounded-md hover:bg-[#1d4ed8] transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <span className="text-xl leading-none">+</span> Tạo Mã Giảm Giá
          </button>
        </div>
      </div>

      {/* Stats — tính từ API totalElements + content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Tag}          label="Tổng mã"          value={stats.total.toString()}    color="blue"   />
        <StatCard icon={CheckCircle}  label="Đang hoạt động"   value={stats.active.toString()}   color="green"  />
        <StatCard icon={Clock}        label="Sắp bắt đầu"      value={stats.upcoming.toString()}  color="orange" />
        <StatCard icon={Tag}          label="Đã hết hạn"       value={stats.expired.toString()}  color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 mb-5 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm mã, tên khuyến mãi..."
              value={localQ}
              onChange={e => setLocalQ(e.target.value)}
              onBlur={commitSearch}
              onKeyDown={e => e.key === 'Enter' && commitSearch()}
              className="flex-1 outline-none bg-transparent text-sm"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Trạng thái</label>
          <select
            value={filter.status}
            onChange={e => setFilter({ status: e.target.value as PromoStatus | '' })}
            className="px-2 py-2 border border-[var(--border)] rounded-md text-sm outline-none"
          >
            <option value="">Tất cả</option>
            {(Object.entries(STATUS_LABELS) as [PromoStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Loại</label>
          <select
            value={filter.type}
            onChange={e => setFilter({ type: e.target.value as PromoType | '' })}
            className="px-2 py-2 border border-[var(--border)] rounded-md text-sm outline-none"
          >
            <option value="">Tất cả</option>
            {(Object.entries(TYPE_LABELS) as [PromoType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          ⚠️ {error}
          <button onClick={refresh} className="ml-auto underline font-bold">Thử lại</button>
        </div>
      )}

      {/* List */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden">
        {loading && promos.length === 0 ? (
          <div className="py-10 text-center text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Đang tải...
          </div>
        ) : promos.length === 0 ? (
          <div className="py-10 text-center text-[var(--text-muted)]">Không tìm thấy khuyến mãi nào</div>
        ) : (
          promos.map((promo, idx) => (
            <div
              key={promo.id}
              className={`p-4 flex gap-4 items-start hover:bg-gray-50 transition-colors ${loading ? 'opacity-60' : ''} ${idx < promos.length - 1 ? 'border-b border-[var(--card-border)]' : ''}`}
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-[var(--blue-light)] text-[var(--blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                {promo.type === 'free_ship' ? <Truck className="w-5 h-5" /> : <Percent className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-black text-sm text-[var(--blue)] font-mono">{promo.code}</span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{promo.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[promo.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[promo.status] ?? promo.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                  <span><b className="text-[var(--text-secondary)]">Mức giảm:</b> {getDiscountText(promo)}</span>
                  <span>
                    <b className="text-[var(--text-secondary)]">Hạn dùng:</b> {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                  </span>
                  {/* FIX: maxUses null = unlimited, không phải 0 */}
                  <span>
                    <b className="text-[var(--text-secondary)]">Lần dùng:</b> {promo.usedCount} / {formatMaxUses(promo.maxUses)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                {/* Toggle active/inactive */}
                {(promo.status === 'active' || promo.status === 'inactive') && (
                  <button
                    onClick={() => handleToggleStatus(promo.id, promo.status)}
                    disabled={actionLoading}
                    title={promo.status === 'active' ? 'Tắt' : 'Bật'}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                      promo.status === 'active'
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {promo.status === 'active'
                      ? <ToggleRight className="w-3.5 h-3.5" />
                      : <ToggleLeft  className="w-3.5 h-3.5" />
                    }
                    {promo.status === 'active' ? 'Tắt' : 'Bật'}
                  </button>
                )}
                <button
                  onClick={() => openEdit(promo.id)}
                  className="px-3 py-1.5 bg-[var(--blue-light)] text-[var(--blue)] rounded text-xs font-semibold hover:bg-blue-200 flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-[var(--red-light)] text-[var(--red)] rounded text-xs font-semibold hover:bg-red-200 flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" /> Xóa
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalElements > 0 && (
          <div className="px-4 py-3 border-t border-[var(--card-border)] bg-gray-50 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Tổng {totalElements.toLocaleString('vi-VN')} — Trang <b>{currentPage + 1}</b> / {totalPages || 1}</span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 0 || loading}
                className="px-2 py-1 border border-[var(--border)] rounded bg-white disabled:opacity-50"
              >Trước</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const half = 2;
                let start = Math.max(0, currentPage - half);
                const end = Math.min(totalPages - 1, start + 4);
                start = Math.max(0, end - 4);
                return start + i;
              }).filter(idx => idx < totalPages).map(idx => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`px-2 py-1 border rounded ${idx === currentPage ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-white border-[var(--border)]'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="px-2 py-1 border border-[var(--border)] rounded bg-white disabled:opacity-50"
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue:   'bg-[var(--blue-light)] text-[var(--blue)]',
    green:  'bg-[var(--green-light)] text-[var(--green)]',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] ?? ''}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-[var(--text-muted)]">{label}</div>
        <div className="text-2xl font-black text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}