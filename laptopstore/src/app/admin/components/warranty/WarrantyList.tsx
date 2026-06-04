// src/components/warranty/WarrantyList.tsx
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useWarranty } from '../../hooks/useWarranty';
import type { WarrantyStatus, WarrantyListItem } from '../../api/warrantyApi';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<WarrantyStatus, string> = {
  PENDING:   'Chờ xử lý',
  APPROVED:  'Đã tiếp nhận',
  IN_REPAIR: 'Đang sửa chữa',
  COMPLETED: 'Hoàn thành',
  REJECTED:  'Từ chối',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<WarrantyStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-800',
  APPROVED:  'bg-blue-100 text-blue-800',
  IN_REPAIR: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const FILTER_OPTIONS: { value: WarrantyStatus | ''; label: string }[] = [
  { value: '',          label: 'Tất cả'        },
  { value: 'PENDING',   label: 'Chờ xử lý'     },
  { value: 'APPROVED',  label: 'Đã tiếp nhận'  },
  { value: 'IN_REPAIR', label: 'Đang sửa chữa' },
  { value: 'COMPLETED', label: 'Hoàn thành'    },
  { value: 'REJECTED',  label: 'Từ chối'       },
  { value: 'CANCELLED', label: 'Đã hủy'        },
];

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WarrantyListProps {
  onSelectWarranty: (id: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WarrantyList({ onSelectWarranty }: WarrantyListProps) {
  const { list, loadingList, totalPages, totalElements, loadList } = useWarranty();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | ''>('');
  const [localPage, setLocalPage]     = useState(1);
  const perPage = 20;

  // Load khi filter/page thay đổi
  useEffect(() => {
    loadList({ status: statusFilter, page: localPage, size: perPage }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, localPage]);

  // Client-side search filter trên list đã load
  const filtered = search.trim()
    ? list.filter(w =>
        w.customerName.toLowerCase().includes(search.toLowerCase()) ||
        w.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        w.productName.toLowerCase().includes(search.toLowerCase()) ||
        String(w.warrantyId).includes(search)
      )
    : list;

  // Stats từ list hiện tại (tổng server-side)
  const statsValues = {
    total:    totalElements,
    pending:  list.filter(w => w.status === 'PENDING').length,
    approved: list.filter(w => w.status === 'APPROVED').length,
    inRepair: list.filter(w => w.status === 'IN_REPAIR').length,
    completed:list.filter(w => w.status === 'COMPLETED').length,
    rejected: list.filter(w => w.status === 'REJECTED').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Quản Lý Bảo Hành</h1>
          <p className="text-gray-500 mt-1">Danh sách và xử lý yêu cầu bảo hành</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <StatCard label="Tổng yêu cầu"   value={statsValues.total}     color="bg-gray-100 text-gray-900" />
        <StatCard label="Chờ xử lý"       value={statsValues.pending}   color="bg-amber-100 text-amber-900" />
        <StatCard label="Đã tiếp nhận"    value={statsValues.approved}  color="bg-blue-100 text-blue-900" />
        <StatCard label="Đang sửa chữa"   value={statsValues.inRepair}  color="bg-purple-100 text-purple-900" />
        <StatCard label="Hoàn thành"      value={statsValues.completed} color="bg-green-100 text-green-900" />
        <StatCard label="Từ chối"         value={statsValues.rejected}  color="bg-red-100 text-red-900" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setLocalPage(1); }}
                  placeholder="Mã bảo hành, tên khách, sản phẩm..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as WarrantyStatus | ''); setLocalPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FILTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Count info */}
        <div className="p-4 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
          Hiển thị {filtered.length > 0 ? (localPage - 1) * perPage + 1 : 0}–{Math.min(localPage * perPage, totalElements)} / {totalElements} yêu cầu
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Mã BH</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Đơn hàng</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Người xử lý</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w: WarrantyListItem) => (
                <tr
                  key={w.warrantyId}
                  onClick={() => onSelectWarranty(w.warrantyId)}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-600 font-bold">#{w.warrantyId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{w.customerName}</div>
                    <div className="text-xs text-gray-400">{w.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 max-w-[200px] truncate">{w.productName}</div>
                    <div className="text-xs text-gray-400">SL: {w.quantity}</div>
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{w.orderCode}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[w.status] ?? w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {w.handledByName ?? <span className="text-gray-400 italic">Chưa phân công</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {fmtDate(w.createdAt).split(' ')[0]}<br/>
                    {fmtDate(w.createdAt).split(' ')[1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingList && (
            <div className="p-6 text-center text-sm text-gray-500">Đang tải...</div>
          )}
          {!loadingList && filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🔧</p>
              <p className="font-semibold">Không có yêu cầu bảo hành nào</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">Trang {localPage} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocalPage(p => Math.max(1, p - 1))}
              disabled={localPage <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-bold text-sm"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setLocalPage(p)}
                className={`w-10 h-10 rounded-lg font-bold text-sm ${p === localPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setLocalPage(p => Math.min(totalPages, p + 1))}
              disabled={localPage >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-bold text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-xs font-bold opacity-75 mb-1">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}