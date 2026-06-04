import React, { useState } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import type { useRefunds } from '../hooks/useRefunds';
import type { RefundStatus } from '../api/refundApi';

type HookReturn = ReturnType<typeof useRefunds>;

interface RefundListProps {
  hook: HookReturn;
}

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  waiting:   'Chờ xử lý',
  approved:  'Đã duyệt',
  done:      'Hoàn thành',
  rejected:  'Từ chối',
  received:  'Đã nhận hàng',
  cancelled: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, string> = {
  waiting:   'bg-orange-100 text-orange-800',
  approved:  'bg-blue-100 text-blue-800',
  done:      'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  received:  'bg-purple-100 text-purple-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDatetime(iso: string): [string, string] {
  if (!iso) return ['—', ''];
  const d = new Date(iso);
  return [
    d.toLocaleDateString('vi-VN'),
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  ];
}

function formatVND(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ── Component ─────────────────────────────────────────────────────────────

export default function RefundList({ hook }: RefundListProps) {
  const {
    refunds, totalElements, totalPages, currentPage,
    loading, error,
    filter, setFilter, setPage, refresh,
    stats, statsLoading,
    handleExport, openDetail, openProcess,
  } = hook;

  // Local search: chỉ gửi API khi Enter hoặc blur
  const [localSearch, setLocalSearch] = useState(filter.q);

  const commitSearch = () => {
    if (localSearch !== filter.q) setFilter({ q: localSearch });
  };

  const statsData = {
    total:    stats?.totalRequests               ?? totalElements,
    waiting:  stats?.countsByStatus?.['waiting'] ?? 0,
    approved: stats?.countsByStatus?.['approved'] ?? 0,
    rejected: stats?.countsByStatus?.['rejected'] ?? 0,
    done:     stats?.countsByStatus?.['done']     ?? 0,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Quản Lý Hoàn Trả</h1>
          <p className="text-gray-500 mt-1">Xử lý yêu cầu đổi trả và hoàn tiền</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Xuất XLSX
          </button>
        </div>
      </div>

      {/* Stats cards — click để filter nhanh */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Tổng yêu cầu" value={statsData.total}    color="bg-gray-100 text-gray-900"   loading={statsLoading} />
        <StatCard label="Chờ xử lý"    value={statsData.waiting}  color="bg-orange-100 text-orange-900" loading={statsLoading} active={filter.status === 'waiting'}  onClick={() => setFilter({ status: filter.status === 'waiting'  ? '' : 'waiting'  })} />
        <StatCard label="Đã duyệt"     value={statsData.approved} color="bg-blue-100 text-blue-900"   loading={statsLoading} active={filter.status === 'approved'} onClick={() => setFilter({ status: filter.status === 'approved' ? '' : 'approved' })} />
        <StatCard label="Từ chối"      value={statsData.rejected} color="bg-red-100 text-red-900"     loading={statsLoading} active={filter.status === 'rejected'} onClick={() => setFilter({ status: filter.status === 'rejected' ? '' : 'rejected' })} />
        <StatCard label="Hoàn thành"   value={statsData.done}     color="bg-green-100 text-green-900" loading={statsLoading} active={filter.status === 'done'}     onClick={() => setFilter({ status: filter.status === 'done'     ? '' : 'done'     })} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  onBlur={commitSearch}
                  onKeyDown={e => e.key === 'Enter' && commitSearch()}
                  placeholder="Mã đơn hàng hoặc tên khách hàng..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Trạng thái</label>
              <select
                value={filter.status}
                onChange={e => setFilter({ status: e.target.value as RefundStatus | '' })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {(filter.q || filter.status) && (
              <button
                onClick={() => { setLocalSearch(''); setFilter({ q: '', status: '' }); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
          {loading ? 'Đang tải...' : `Tổng ${totalElements.toLocaleString('vi-VN')} yêu cầu`}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️ {error}</span>
            <button onClick={refresh} className="ml-auto underline font-bold">Thử lại</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                {['Mã đơn hàng', 'Khách hàng', 'Chi nhánh', 'Số tiền hoàn', 'Trạng thái', 'Ngày yêu cầu', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Không có yêu cầu hoàn trả nào
                  </td>
                </tr>
              ) : (
                refunds.map(refund => {
                  const [date, time] = formatDatetime(refund.requestedAt);
                  return (
                    <tr key={refund.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${loading ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="text-blue-600 font-bold">{refund.orderCode}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {refund.customerName}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {refund.branchName}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-red-600 whitespace-nowrap">
                        {formatVND(refund.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[refund.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[refund.status] ?? refund.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {date}<br />{time}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDetail(refund.id)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold"
                          >
                            Xem
                          </button>
                          {(refund.status === 'waiting' || refund.status === 'approved') && (
                            <button
                              onClick={() => openProcess(refund.id)}
                              className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 text-xs font-bold"
                            >
                              Xử lý
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang <span className="font-bold">{currentPage + 1}</span> / {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 0 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-bold text-sm"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const half  = 2;
              let start   = Math.max(0, currentPage - half);
              const end   = Math.min(totalPages - 1, start + 4);
              start       = Math.max(0, end - 4);
              return start + i;
            }).filter(idx => idx < totalPages).map(idx => (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                disabled={loading}
                className={`w-10 h-10 rounded-lg font-bold text-sm ${idx === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-bold text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, loading, onClick, active,
}: {
  label: string; value: number; color: string;
  loading?: boolean; onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${color} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${active ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
      onClick={onClick}
    >
      <div className="text-xs font-bold opacity-75 mb-1">{label}</div>
      {loading
        ? <div className="h-8 w-10 bg-current opacity-20 rounded animate-pulse" />
        : <div className="text-2xl font-extrabold">{value.toLocaleString('vi-VN')}</div>
      }
    </div>
  );
}