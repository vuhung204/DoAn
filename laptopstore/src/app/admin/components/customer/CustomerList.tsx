import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Loader2 } from 'lucide-react';
import { fetchCustomers, type CustomerListDto } from '../../api/customerApi';

const statusLabels: Record<string, string> = {
  active:      'Hoạt động',
  unverified:  'Chưa xác thực',
  locked:      'Bị khóa',
};

const typeLabels: Record<string, string> = {
  new:     'Mới',
  regular: 'Thường xuyên',
  vip:     'VIP',
};

const statusClasses: Record<string, string> = {
  active:     'bg-green-100 text-green-700',
  unverified: 'bg-gray-100 text-gray-500',
  locked:     'bg-red-100 text-red-700',
};

const typeClasses: Record<string, string> = {
  new:     'bg-blue-100 text-blue-700',
  regular: 'bg-green-100 text-green-700',
  vip:     'bg-yellow-100 text-yellow-800',
};

const formatPrice = (vnd: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd);

interface CustomerListProps {
  onViewDetail: (customerId: number) => void;
}

export function CustomerList({ onViewDetail }: CustomerListProps) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [customers,    setCustomers]    = useState<CustomerListDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page,         setPage]         = useState(0);
  const size = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCustomers({
        page,
        size,
        search:  search  || undefined,
        status:  statusFilter || undefined,
        type:    typeFilter   || undefined,
      });
      setCustomers(result.content);
      setTotalElements(result.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(0); }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(totalElements / size);

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tên, email, điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px] outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-[13px] bg-white"
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="unverified">Chưa xác thực</option>
            <option value="locked">Bị khóa</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Loại khách</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-[13px] bg-white"
          >
            <option value="">Tất cả</option>
            <option value="new">Mới</option>
            <option value="regular">Thường xuyên</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-[13px]">Đang tải...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Khách Hàng</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Điện Thoại</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Đơn Hàng</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Tổng Chi Tiêu</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Trạng Thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Không tìm thấy khách hàng</td></tr>
                ) : customers.map(cust => (
                  <tr key={cust.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><strong className="text-gray-900">{cust.name}</strong></td>
                    <td className="px-4 py-3 text-gray-700">{cust.email}</td>
                    <td className="px-4 py-3 text-gray-700">{cust.phone}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{cust.totalOrders}</td>
                    {/* totalSpent từ BE là VND tuyệt đối */}
                    <td className="px-4 py-3 text-right text-gray-900">{formatPrice(cust.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${typeClasses[cust.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {typeLabels[cust.type] ?? cust.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${statusClasses[cust.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[cust.status] ?? cust.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewDetail(cust.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              {totalElements} khách hàng · Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold disabled:opacity-40 hover:border-blue-600 hover:text-blue-600 transition-colors"
              >Trước</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold disabled:opacity-40 hover:border-blue-600 hover:text-blue-600 transition-colors"
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}