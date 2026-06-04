import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { CUSTOMERS_DATA, Customer } from '../data/customers';

const statusLabels: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Bị khóa',
};

const typeLabels: Record<string, string> = {
  new: 'Mới',
  regular: 'Thường xuyên',
  vip: 'VIP',
};

const statusClasses: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  locked: 'bg-red-100 text-red-700',
};

const typeClasses: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  regular: 'bg-green-100 text-green-700',
  vip: 'bg-yellow-100 text-yellow-800',
};

interface CustomerListProps {
  onViewDetail: (customerId: number) => void;
}

export function CustomerList({ onViewDetail }: CustomerListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredCustomers = CUSTOMERS_DATA.filter((cust) => {
    const matchSearch =
      cust.name.toLowerCase().includes(search.toLowerCase()) ||
      cust.email.toLowerCase().includes(search.toLowerCase()) ||
      cust.phone.includes(search);
    const matchStatus = !statusFilter || cust.status === statusFilter;
    const matchType = !typeFilter || cust.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tên, email, điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] outline-none bg-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-[13px] bg-white"
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[11px] font-bold text-gray-600 uppercase">Loại khách</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <strong className="text-gray-900">{cust.name}</strong>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{cust.email}</td>
                  <td className="px-4 py-3 text-gray-700">{cust.phone}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{cust.totalOrders}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatPrice(cust.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${typeClasses[cust.type]}`}>
                      {typeLabels[cust.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${statusClasses[cust.status]}`}>
                      {statusLabels[cust.status]}
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
      </div>
    </>
  );
}
