import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Printer, Laptop, User, Phone, Mail,
  Wallet, CheckCircle, Store, Calendar, MapPin
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { fetchStoresForOrder } from '../api/orderApi';
import type { StoreOptionDto } from '../api/orderApi';

interface OrderDetailProps {
  orderRef: string;
  onBack: () => void;
  showToast?: (msg: string) => void;
}

function getAllowedTransitions(currentStatus?: string): string[] {
  const s = String(currentStatus ?? '').toLowerCase();
  const map: Record<string, string[]> = {
    pending:    ['confirmed', 'cancelled'],
    confirmed:  ['processing', 'cancelled'],
    processing: ['shipping', 'cancelled'],
    shipping:   ['done', 'refunded'],
    done:       [],
    cancelled:  [],
    refunded:   [],
  };
  return map[s] ?? [];
}

export default function OrderDetail({ orderRef, onBack, showToast }: OrderDetailProps) {
  const { fetchOrder, loadingDetail, updateOrderStatus } = useOrders() as any;

  const [localDetail, setLocalDetail]       = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [stores, setStores]                 = useState<StoreOptionDto[]>([]);
  const [updating, setUpdating]             = useState(false);

  const statusLabels: Record<string, string> = {
    pending:    'Chờ xác nhận',
    confirmed:  'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping:   'Đang giao hàng',
    done:       'Hoàn thành',
    cancelled:  'Huỷ đơn',
    refunded:   'Đã hoàn tiền',
  };

  // Load order detail
  useEffect(() => {
    if (!orderRef) return;
    fetchOrder(orderRef)
      .then((d: any) => {
        setLocalDetail(d);
        const allowed = getAllowedTransitions(d?.status);
        setSelectedStatus(allowed.length ? allowed[0] : (d?.status ?? ''));
        setSelectedStoreId('');
      })
      .catch(() => {});
  }, [orderRef]);

  // Load danh sách chi nhánh một lần
  useEffect(() => {
    fetchStoresForOrder()
      .then(setStores)
      .catch(() => {});
  }, []);

  // Reset selectedStoreId khi đổi trạng thái
  useEffect(() => {
    setSelectedStoreId('');
  }, [selectedStatus]);

  const handleUpdate = async () => {
    if (!orderRef) return;

    const current  = String(localDetail?.status ?? '').toLowerCase();
    const selected = String(selectedStatus ?? '').toLowerCase();

    if (current === selected) {
      showToast?.('Trạng thái không thay đổi');
      return;
    }

    const allowed = getAllowedTransitions(localDetail?.status);
    if (!allowed.includes(selected)) {
      showToast?.('Chuyển trạng thái không hợp lệ');
      return;
    }

    // Bắt buộc chọn chi nhánh khi xác nhận
    if (selected === 'confirmed' && !selectedStoreId) {
      showToast?.('⚠️ Vui lòng chọn chi nhánh xử lý');
      return;
    }

    setUpdating(true);
    try {
      await updateOrderStatus(
        orderRef,
        selectedStatus,
        undefined,
        selected === 'confirmed' ? (selectedStoreId as number) : undefined
      );
      showToast?.(`✅ Cập nhật trạng thái: ${statusLabels[selectedStatus] ?? selectedStatus}`);

      const newDetail = await fetchOrder(orderRef);
      setLocalDetail(newDetail);
      const newAllowed = getAllowedTransitions(newDetail?.status);
      setSelectedStatus(newAllowed.length ? newAllowed[0] : (newDetail?.status ?? ''));
      setSelectedStoreId('');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Không thể cập nhật';
      showToast?.(`❌ Lỗi: ${msg}`);
    } finally {
      setUpdating(false);
    }
  };

  const products     = (localDetail?.products ?? localDetail?.items ?? []) as any[];
  const subtotal     = products.reduce((s: number, p: any) => {
    const qty   = Number(p.qty ?? p.quantity ?? 1);
    const price = Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0);
    return s + price * qty;
  }, 0);
  const historyItems = (localDetail?.history ?? []).filter((h: any) => h?.label);
  const allowedNow   = getAllowedTransitions(localDetail?.status);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold mb-4 transition-all hover:-translate-x-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Chi Tiết Đơn Hàng</h1>
          <p className="text-blue-600 font-extrabold mt-1">Mã đơn: {orderRef}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-bold"
        >
          <Printer className="w-4 h-4" />
          In phiếu
        </button>
      </div>

      {loadingDetail ? (
        <div>Đang tải chi tiết...</div>
      ) : !localDetail ? (
        <div>Không tìm thấy đơn hàng</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5">

          {/* ── LEFT ── */}
          <div className="space-y-4">

            {/* Sản phẩm */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Sản Phẩm Đã Đặt
              </h3>
              <div className="space-y-3">
                {products.map((product: any, idx: number) => {
                  const name     = product.name ?? product.productName ?? '';
                  const sku      = product.sku ?? product.skuCode ?? '';
                  const qty      = Number(product.qty ?? product.quantity ?? 1);
                  const priceNum = Number(product.price ?? product.unitPrice ?? product.unit_price ?? 0);
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3 hover:bg-blue-50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                        <Laptop className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">SKU: {sku}</div>
                        <div className="text-xs text-gray-600 mt-1">Số lượng: {qty}</div>
                      </div>
                      <div className="font-bold text-blue-600">
                        {Number(priceNum).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tổng tiền */}
              <div className="mt-4 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Tạm tính:</span>
                  <span className="font-bold">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Giảm giá:</span>
                  <span className="font-bold text-red-600">-0 đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Phí vận chuyển:</span>
                  <span className="font-bold">0 đ</span>
                </div>
                <div className="flex justify-between text-base pt-3 border-t-2 border-gray-300">
                  <span className="font-extrabold text-gray-900">Tổng cộng:</span>
                  <span className="font-extrabold text-blue-600 text-lg">
                    {Number(localDetail.total ?? localDetail.totalAmount ?? 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Lịch sử */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Lịch Sử Đơn Hàng
              </h3>
              <div className="space-y-5">
                {historyItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-sm ${item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {item.done && <CheckCircle className="w-3 h-3" />}
                      </div>
                      {idx < historyItems.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[18px] my-1 rounded ${item.done ? 'bg-gradient-to-b from-green-500 to-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="font-extrabold text-gray-900">{item.label}</div>
                      {item.time && <div className="text-xs text-gray-500 mt-1">{item.time}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">

            {/* Cập nhật trạng thái */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Cập Nhật Trạng Thái
              </h3>

              {/* Trạng thái hiện tại */}
              <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-4 mb-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  Trạng thái hiện tại:
                </div>
                <div className="text-base font-extrabold text-orange-900">
                  {statusLabels[localDetail.status] ?? localDetail.status}
                </div>
              </div>

              {/* Select trạng thái — chỉ render options hợp lệ */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Chuyển sang trạng thái:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {allowedNow.length === 0 ? (
                    <option value={localDetail.status}>
                      {statusLabels[localDetail.status] ?? localDetail.status} (không thể thay đổi)
                    </option>
                  ) : (
                    allowedNow.map((s) => (
                      <option key={s} value={s}>{statusLabels[s] ?? s}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Dropdown chi nhánh — chỉ hiện khi chọn "confirmed" */}
              {selectedStatus === 'confirmed' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Chi nhánh xử lý <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleUpdate}
                disabled={
                  updating ||
                  allowedNow.length === 0 ||
                  String(localDetail?.status ?? '').toLowerCase() === String(selectedStatus ?? '').toLowerCase() ||
                  (selectedStatus === 'confirmed' && !selectedStoreId)
                }
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
              </button>
            </div>

            <InfoCard
              title="Thông Tin Khách Hàng"
              icon={<User className="w-4 h-4 text-blue-600" />}
              items={[
                { icon: User,  label: 'Tên khách hàng', value: localDetail.customerName ?? localDetail.customer?.name ?? '—' },
                { icon: Phone, label: 'Số điện thoại',  value: localDetail.phone ?? localDetail.customer?.phone ?? '—' },
                { icon: Mail,  label: 'Email',           value: localDetail.email ?? localDetail.customer?.email ?? '—' },
              ]}
            />

            <InfoCard
              title="Thanh Toán"
              icon={<Wallet className="w-4 h-4 text-blue-600" />}
              items={[
                { icon: Wallet,      label: 'Phương thức',         value: localDetail.paymentMethod ?? localDetail.payment ?? '—' },
                { icon: CheckCircle, label: 'Trạng thái thanh toán', value: localDetail.payStatus ?? localDetail.paymentStatus ?? '—' },
              ]}
            />

            <InfoCard
              title="Chi Nhánh Xử Lý"
              icon={<Store className="w-4 h-4 text-blue-600" />}
              items={[
                { icon: Store,    label: 'Chi nhánh', value: localDetail.branchName ?? localDetail.branch ?? '—' },
                { icon: Calendar, label: 'Ngày đặt',  value: localDetail.orderedAt ?? localDetail.date ?? '—' },
              ]}
            />

            <InfoCard
              title="Địa Chỉ Giao Hàng"
              icon={<MapPin className="w-4 h-4 text-red-600" />}
              items={[
                { icon: User,   label: '', value: localDetail.customerName ?? '—' },
                { icon: Phone,  label: '', value: localDetail.phone ?? '—' },
                { icon: MapPin, label: '', value: localDetail.shippingAddress?.addressLine ?? localDetail.address ?? '—' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title, icon, items,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ icon: any; label: string; value?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
        {icon}{title}
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
              <Icon className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                {item.label && (
                  <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                    {item.label}
                  </div>
                )}
                <div className="font-semibold text-gray-900">{item.value ?? '—'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}