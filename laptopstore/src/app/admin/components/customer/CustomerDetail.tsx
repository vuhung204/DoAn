import { useState, useEffect } from 'react';
import { ArrowLeft, Unlock, Key, Lock, CheckCircle, Loader2 } from 'lucide-react';
import {
  fetchCustomerDetail,
  updateCustomerStatus,
  resetCustomerPassword,
  type CustomerDetailDto,
  type OrderSummaryDto,
} from '../../api/customerApi';

interface CustomerDetailProps {
  customerId: number;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  active:     'Hoạt động',
  unverified: 'Chưa xác thực',
  locked:     'Bị khóa',
};

const statusClasses: Record<string, string> = {
  active:     'bg-green-100 text-green-700',
  unverified: 'bg-gray-100 text-gray-500',
  locked:     'bg-red-100 text-red-700',
};

const orderStatusLabels: Record<string, string> = {
  COMPLETED:  'Hoàn thành',
  SHIPPING:   'Đang giao',
  PROCESSING: 'Đang xử lý',
  CONFIRMED:  'Đã xác nhận',
  PENDING:    'Chờ xác nhận',
  CANCELLED:  'Đã huỷ',
  REFUNDED:   'Đã hoàn tiền',
};

const formatPrice = (vnd: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN');

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN');

export function CustomerDetail({ customerId, onBack }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerDetailDto | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerDetail(customerId);
      setCustomer(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [customerId]);

  const handleUnlock = async () => {
    if (!customer) return;
    await updateCustomerStatus(customer.id, 'active', 'Mở khóa bởi admin');
    showToast('✅ Tài khoản đã được mở khóa');
    reload();
  };

  const handleLock = async () => {
    if (!customer || !confirm('Bạn chắc chắn muốn khóa tài khoản này?')) return;
    await updateCustomerStatus(customer.id, 'locked', 'Khóa bởi admin');
    showToast('🔒 Tài khoản đã được khóa');
    reload();
  };

  const handleResetPassword = async () => {
    if (!customer) return;
    await resetCustomerPassword(customer.id);
    showToast('📧 Đã gửi email đặt lại mật khẩu cho khách hàng');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!customer) return null;

  const avgSpent = customer.avgPerOrder ?? 0;

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-blue-600 text-[13px] font-semibold mb-3 hover:opacity-75 transition-opacity">
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      <div className="mb-6 mt-3">
        <h1 className="text-2xl font-black text-gray-900">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Personal Info */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-black text-gray-900 uppercase">Thông Tin Cá Nhân</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              ['Họ và Tên',   customer.name],
              ['Email',       customer.email],
              ['Điện thoại',  customer.phone ?? '—'],
              ['Địa chỉ',     customer.primaryAddress ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="pb-3 border-b border-gray-100 last:border-0">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">{label}</label>
                <p className="text-[13px] text-gray-900">{value}</p>
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Trạng thái</label>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${statusClasses[customer.status] ?? 'bg-gray-100'}`}>
                {statusLabels[customer.status] ?? customer.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-black text-gray-900 uppercase">Thống Kê</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {[
              ['Tổng đơn hàng',  String(customer.totalOrders)],
              ['Tổng chi tiêu',  formatPrice(customer.totalSpent)],
              ['Trung bình/đơn', formatPrice(avgSpent)],
              ['Ngày tham gia',  customer.joined ? formatDate(customer.joined) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</div>
                <div className="text-lg font-black text-blue-600">{value}</div>
              </div>
            ))}
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
              {customer.ordersPreview.content.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-5 text-center text-gray-500">Chưa có đơn hàng</td></tr>
              ) : customer.ordersPreview.content.map((order: OrderSummaryDto) => (
                <tr key={order.orderCode} className="border-b border-gray-200 hover:bg-gray-50">
                  {/* orderCode từ BE */}
                  <td className="px-4 py-3"><strong>{order.orderCode}</strong></td>
                  {/* totalAmount từ BE là VND */}
                  <td className="px-4 py-3 text-right">{formatPrice(order.totalAmount)}</td>
                  {/* paymentMethod từ BE */}
                  <td className="px-4 py-3 text-gray-700">{order.paymentMethod ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-700">
                      {orderStatusLabels[order.status] ?? order.status}
                    </span>
                  </td>
                  {/* orderedAt từ BE */}
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(order.orderedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-black text-gray-900 uppercase">Địa Chỉ</h3>
        </div>
        <div className="p-5">
          {customer.addresses.length === 0 ? (
            <p className="text-center text-gray-500 py-5">Chưa có địa chỉ</p>
          ) : (
            <div className="space-y-3">
              {customer.addresses.map(addr => (
                <div key={addr.id} className={`p-3 rounded-lg border ${addr.isDefault ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  {/* isDefault từ BE (thay vì addr.default) */}
                  {addr.isDefault && (
                    <div className="flex items-center gap-1 text-blue-600 text-[11px] font-bold uppercase mb-1">
                      <CheckCircle className="w-3 h-3" />
                      Mặc định
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 mb-0.5">{addr.label}</div>
                  <div className="text-[13px] text-gray-900">{addr.text}</div>
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
          {customer.status === 'locked' && (
            <button onClick={handleUnlock} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-colors">
              <Unlock className="w-4 h-4" />
              Mở Khóa Tài Khoản
            </button>
          )}
          <button onClick={handleResetPassword} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg text-[13px] font-bold hover:border-blue-600 hover:text-blue-600 transition-colors">
            <Key className="w-4 h-4" />
            Đặt Lại Mật Khẩu
          </button>
          {customer.status !== 'locked' && (
            <button onClick={handleLock} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-600 rounded-lg text-[13px] font-bold hover:bg-red-100 transition-colors">
              <Lock className="w-4 h-4" />
              Khóa Tài Khoản
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold z-50 animate-in fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}