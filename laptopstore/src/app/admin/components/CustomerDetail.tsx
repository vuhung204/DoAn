import { ArrowLeft, Edit, Plus, Unlock, Key, Lock, CheckCircle } from 'lucide-react';
import { CUSTOMERS_DATA, Customer } from '../data/customers';

interface CustomerDetailProps {
  customerId: number;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Bị khóa',
};

const statusClasses: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  locked: 'bg-red-100 text-red-700',
};

export function CustomerDetail({ customerId, onBack }: CustomerDetailProps) {
  const customer = CUSTOMERS_DATA.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khách hàng</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const avgSpent = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-blue-600 text-[13px] font-semibold mb-3 hover:opacity-75 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      {/* Header */}
      <div className="mb-6 mt-3">
        <h1 className="text-2xl font-black text-gray-900">{customer.name}</h1>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Personal Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase">Thông Tin Cá Nhân</h3>
            <button
              onClick={() => alert('Mở form chỉnh sửa thông tin khách hàng')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Sửa
            </button>
          </div>
          <div className="p-5">
            <div className="mb-4 pb-3 border-b border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Họ và Tên</label>
              <p className="text-[13px] text-gray-900">{customer.name}</p>
            </div>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Email</label>
              <p className="text-[13px] text-gray-900">{customer.email}</p>
            </div>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Điện thoại</label>
              <p className="text-[13px] text-gray-900">{customer.phone}</p>
            </div>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Ngày sinh</label>
              <p className="text-[13px] text-gray-900">{formatDate(customer.dob)}</p>
            </div>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Địa chỉ</label>
              <p className="text-[13px] text-gray-900">{customer.address}</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Trạng thái</label>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${statusClasses[customer.status]}`}>
                {statusLabels[customer.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-black text-gray-900 uppercase">Thống Kê</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Tổng đơn hàng</div>
              <div className="text-lg font-black text-blue-600">{customer.totalOrders}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Tổng chi tiêu</div>
              <div className="text-lg font-black text-blue-600">{formatPrice(customer.totalSpent)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Trung bình/đơn</div>
              <div className="text-lg font-black text-blue-600">{formatPrice(avgSpent)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Ngày tham gia</div>
              <div className="text-lg font-black text-blue-600">{formatDate(customer.joined)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-black text-gray-900 uppercase">Lịch Sử Đơn Hàng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Mã Đơn</th>
                <th className="px-4 py-3 text-right font-bold text-gray-600">Tổng Tiền</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Thanh Toán</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Trạng Thái</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600">Ngày Đặt</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-center text-gray-500">
                    Chưa có đơn hàng
                  </td>
                </tr>
              ) : (
                customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <strong className="text-gray-900">{order.id}</strong>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-gray-700">{order.payment}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-700">
                        {order.status === 'done' ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(order.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 uppercase">Địa Chỉ Ghi Chú</h3>
          <button
            onClick={() => alert('Mở form thêm địa chỉ mới')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm
          </button>
        </div>
        <div className="p-5">
          {customer.addresses.length === 0 ? (
            <p className="text-center text-gray-500 py-5">Chưa có địa chỉ ghi chú</p>
          ) : (
            <div className="space-y-3">
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-3 rounded-lg border ${
                    addr.default ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {addr.default && (
                    <div className="flex items-center gap-1 text-blue-600 text-[11px] font-bold uppercase mb-1">
                      <CheckCircle className="w-3 h-3" />
                      Mặc định
                    </div>
                  )}
                  <div className="text-[13px] text-gray-900 leading-relaxed">{addr.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-black text-gray-900 uppercase">Hành Động</h3>
        </div>
        <div className="p-5 flex gap-2.5 flex-wrap">
          <button
            onClick={() => alert('Tài khoản đã được mở khóa!')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-colors"
          >
            <Unlock className="w-4 h-4" />
            Mở Khóa Tài Khoản
          </button>
          <button
            onClick={() => alert('Đã gửi email đặt lại mật khẩu cho khách hàng')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg text-[13px] font-bold hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            <Key className="w-4 h-4" />
            Đặt Lại Mật Khẩu
          </button>
          <button
            onClick={() => {
              if (confirm('Bạn chắc chắn muốn khóa tài khoản này?')) {
                alert('Tài khoản đã được khóa!');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-600 rounded-lg text-[13px] font-bold hover:bg-red-100 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Khóa Tài Khoản
          </button>
        </div>
      </div>
    </div>
  );
}
