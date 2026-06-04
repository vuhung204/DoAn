import React from 'react';
import { X, Settings, Loader2 } from 'lucide-react';
import type { RefundDetailDto } from '../api/refundApi';

interface RefundDetailModalProps {
  detail: RefundDetailDto | null;
  loading: boolean;
  onClose: () => void;
  onProcess: (refundId: number) => void;
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

const METHOD_LABELS: Record<string, string> = {
  BANK:  'Chuyển khoản',
  CASH:  'Tiền mặt',
  MOMO:  'MoMo',
  VNPAY: 'VNPay',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDatetime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('vi-VN') + ' ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatVND(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ── Component ─────────────────────────────────────────────────────────────

export default function RefundDetailModal({ detail, loading, onClose, onProcess }: RefundDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-xl font-extrabold text-gray-900">Chi Tiết Yêu Cầu Hoàn Trả</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !detail ? (
          <div className="px-6 py-12 text-center text-gray-400">Không thể tải dữ liệu</div>
        ) : (
          <div className="p-6 space-y-5">

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Mã đơn hàng" value={detail.orderCode}    valueClass="text-blue-600 font-bold" />
              <InfoField label="Khách hàng"  value={detail.customerName} />
              <InfoField label="Chi nhánh"   value={detail.branchName}   />
              <InfoField label="Số tiền hoàn" value={formatVND(detail.amount)} valueClass="text-red-600 font-extrabold" />
            </div>

            {/* Sản phẩm */}
            {detail.products.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-extrabold text-gray-900 mb-2">Sản phẩm hoàn trả</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {detail.products.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {/* Lý do */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-extrabold text-gray-900 mb-2">Lý do hoàn trả</h4>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                {detail.reason}
              </div>
            </div>

            {/* Trạng thái & thời gian */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">Trạng thái</div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[detail.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[detail.status] ?? detail.status}
                  </span>
                </div>
                <InfoField label="Ngày yêu cầu" value={formatDatetime(detail.requestedAt)} />
                {detail.processedAt && <InfoField label="Ngày xử lý"  value={formatDatetime(detail.processedAt)} />}
                {detail.processedBy && <InfoField label="Xử lý bởi"   value={detail.processedBy} />}
              </div>
            </div>

            {/* Thông tin hoàn tiền (khi done) */}
            {detail.status === 'done' && (detail.transactionRef || detail.paymentMethod) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3">Thông tin hoàn tiền</h4>
                <div className="grid grid-cols-2 gap-4 bg-green-50 rounded-xl p-4">
                  {detail.paymentMethod && (
                    <InfoField label="Phương thức" value={METHOD_LABELS[detail.paymentMethod] ?? detail.paymentMethod} />
                  )}
                  {detail.transactionRef && (
                    <InfoField label="Mã giao dịch" value={detail.transactionRef} valueClass="font-mono text-sm" />
                  )}
                </div>
              </div>
            )}

            {/* Ghi chú */}
            {detail.note && (
              <div className="pt-4 border-t border-gray-200">
                <InfoField label="Ghi chú xử lý" value={detail.note} />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold">
            Đóng
          </button>
          {detail && (detail.status === 'waiting' || detail.status === 'approved') && (
            <button
              onClick={() => { onClose(); onProcess(detail.id); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
            >
              <Settings className="w-4 h-4" />
              Xử lý yêu cầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className={`font-semibold text-gray-900 ${valueClass}`}>{value}</div>
    </div>
  );
}