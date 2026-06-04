import { useEffect, useState } from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Plus } from 'lucide-react';
import CreateOrderModal from './CreateOrderModal';
import type { AdminCreateOrderResult } from '../api/orderApi';

interface OrderListProps {
  onSelectOrder: (orderRef: string) => void;
}

export default function OrderList({ onSelectOrder }: OrderListProps) {
  const {
    list,
    loadingList,
    page,
    size,
    totalPages,
    totalElements, // <-- thêm ở đây
    stats,
    fetchOrders,
    fetchStats,
    setPage,
    handleExport,
    exporting,
  } = useOrders() as any;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const perPage = 6;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastCreated, setLastCreated] = useState<AdminCreateOrderResult | null>(null);
  
  const handleOrderCreated = (result: AdminCreateOrderResult) => {
    setShowCreateModal(false);
    setLastCreated(result);
    // refresh danh sách ngay lập tức
    fetchOrders({ q: search || undefined, status: statusFilter || undefined, page: 1, size: perPage }).catch(() => {});
    fetchStats().catch(() => {});
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping: 'Đang giao',
    done: 'Hoàn thành',
    cancelled: 'Đã huỷ',
    refunded: 'Đã hoàn tiền',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-orange-100 text-orange-800',
    shipping: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  };

  useEffect(() => {
    fetchOrders({ q: '', status: '', page: 1, size: perPage }).catch(() => {});
    fetchStats().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOrders({
      q: search || undefined,
      status: statusFilter || undefined,
      branch: branchFilter || undefined,
      page: localPage,
      size: perPage
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, branchFilter, localPage]);

  const statsValues = {
    total: Number(stats?.totalOrders ?? 0),
    pending: Number(stats?.statusCounts?.pending ?? list.filter((o:any)=>o.status==='pending').length),
    processing: Number(stats?.statusCounts?.processing ?? list.filter((o:any)=>o.status==='processing').length),
    shipping: Number(stats?.statusCounts?.shipping ?? list.filter((o:any)=>o.status==='shipping').length),
    done: Number(stats?.statusCounts?.done ?? list.filter((o:any)=>o.status==='done').length),
    cancelled: Number(stats?.statusCounts?.cancelled ?? list.filter((o:any)=>o.status==='cancelled').length),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="text-gray-500 mt-1">Danh sách và theo dõi đơn hàng</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Nút Tạo đơn hàng — MỚI */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo đơn hàng
          </button>
        
          {/* Nút Xuất Excel — giữ nguyên */}
          <button
            onClick={async () => {
              try {
                await handleExport({
                  exportType: 'LIST',
                  q: search || undefined,
                  status: statusFilter || undefined,
                });
              } catch {
                window.alert('Xuất Excel thất bại. Vui lòng thử lại.');
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <StatCard label="Tổng đơn hàng" value={statsValues.total} color="bg-gray-100 text-gray-900" />
        <StatCard label="Chờ xác nhận" value={statsValues.pending} color="bg-yellow-100 text-yellow-900" />
        <StatCard label="Đang xử lý" value={statsValues.processing} color="bg-orange-100 text-orange-900" />
        <StatCard label="Đang giao" value={statsValues.shipping} color="bg-blue-100 text-blue-900" />
        <StatCard label="Hoàn thành" value={statsValues.done} color="bg-green-100 text-green-900" />
        <StatCard label="Đã huỷ" value={statsValues.cancelled} color="bg-red-100 text-red-900" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setLocalPage(1); }}
                  placeholder="Mã đơn hàng hoặc tên khách hàng..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setLocalPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Chi nhánh</label>
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setLocalPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option>Hoàn Kiếm</option>
                <option>Quận 1</option>
                <option>Cầu Giấy</option>
                <option>Bình Thạnh</option>
                <option>Hải Phòng</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 text-sm text-gray-600">
          Hiển thị {list.length ? ( (localPage-1)*perPage + 1 ) : 0 }-{Math.min((localPage)*perPage, totalElements ?? 0)} / {totalElements ?? 0} đơn hàng
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Mã đơn hàng</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Chi nhánh</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-600 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-600 uppercase tracking-wider">Số SP</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Thanh toán</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {list.map((order: any) => (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-600 font-bold">{order.id}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{order.customer}</td>
                  <td className="px-4 py-3 text-gray-700">{order.branch}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{Number(order.total).toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3 text-right text-gray-700">{order.productsCount}</td>
                  <td className="px-4 py-3 text-gray-700">{order.payment}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.date.split(' ')[0]}<br/>{order.date.split(' ')[1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingList && <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>}
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang {localPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocalPage(p => Math.max(1, p - 1))}
              disabled={localPage <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-bold text-sm"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setLocalPage(pageNum)}
                className={`w-10 h-10 rounded-lg font-bold text-sm ${ pageNum === localPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50' }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setLocalPage(p => Math.min(totalPages, p + 1))}
              disabled={localPage >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-bold text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
          {lastCreated && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-green-200 rounded-2xl shadow-xl px-6 py-4 flex items-start gap-4 max-w-md w-full">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-gray-900 text-sm">Tạo đơn hàng thành công!</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-bold text-blue-600">{lastCreated.orderCode}</span>
            {' · '}{lastCreated.customerName}
            {' · '}{Number(lastCreated.totalAmount).toLocaleString('vi-VN')}đ
          </p>
        </div>
        <button
          onClick={() => setLastCreated(null)}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )}
    
        {/* Modal tạo đơn hàng */}
        {showCreateModal && (
          <CreateOrderModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleOrderCreated}
          />
        )}
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