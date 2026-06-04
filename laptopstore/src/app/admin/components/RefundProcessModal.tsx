import React, { useState } from 'react';
import { X, Check, XCircle, DollarSign, Loader2 } from 'lucide-react';
import type { RefundListDto, RefundStatus, ProcessRefundBody, CompleteRefundBody } from '../api/refundApi';

interface RefundProcessModalProps {
  refundId: number;
  summary: RefundListDto | null;
  currentStatus: RefundStatus;
  onClose: () => void;
  onApprove: (id: number, body?: ProcessRefundBody) => Promise<void>;
  onReject:  (id: number, body?: ProcessRefundBody) => Promise<void>;
  onComplete:(id: number, body: CompleteRefundBody)  => Promise<void>;
  loading: boolean;
  error: string | null;
}

const PAYMENT_METHODS = [
  { value: 'BANK',  label: 'Chuyển khoản' },
  { value: 'CASH',  label: 'Tiền mặt' },
  { value: 'MOMO',  label: 'MoMo' },
  { value: 'VNPAY', label: 'VNPay' },
];

function formatVND(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

export default function RefundProcessModal({
  refundId, summary, currentStatus,
  onClose, onApprove, onReject, onComplete,
  loading, error,
}: RefundProcessModalProps) {
  const [note,   setNote]   = useState('');
  const [method, setMethod] = useState('BANK');
  const [txnRef, setTxnRef] = useState('');

  const isApproveFlow  = currentStatus === 'waiting';
  const isCompleteFlow = currentStatus === 'approved';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-extrabold text-gray-900">
            {isCompleteFlow ? 'Xác Nhận Hoàn Tiền' : 'Xử Lý Yêu Cầu Hoàn Trả'}
          </h3>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Tóm tắt */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-extrabold text-gray-900 text-lg">
              {summary?.orderCode ?? `Refund #${refundId}`}
            </div>
            {summary && (
              <>
                <div className="text-red-600 font-extrabold mt-1">{formatVND(summary.amount)}</div>
                <div className="text-sm text-gray-500 mt-1">{summary.customerName} — {summary.branchName}</div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Flow 1: Approve / Reject */}
          {isApproveFlow && (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                Ghi chú xử lý
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                disabled={loading}
                placeholder="Ghi chú về quyết định xử lý (tùy chọn)..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Flow 2: Complete */}
          {isCompleteFlow && (
            <>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  Phương thức hoàn tiền <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                        method === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.value}
                        checked={method === m.value}
                        onChange={() => setMethod(m.value)}
                        disabled={loading}
                        className="sr-only"
                      />
                      <span className="text-sm font-bold">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  Mã giao dịch <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={e => setTxnRef(e.target.value)}
                  disabled={loading}
                  placeholder="VNP240405001234..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  disabled={loading}
                  placeholder="Ghi chú thêm (tùy chọn)..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold disabled:opacity-50">
            Huỷ
          </button>

          {isApproveFlow && (
            <>
              <button
                onClick={() => onReject(refundId, { note: note.trim() || undefined })}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Từ chối
              </button>
              <button
                onClick={() => onApprove(refundId, { note: note.trim() || undefined })}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Phê duyệt
              </button>
            </>
          )}

          {isCompleteFlow && (
            <button
              onClick={() => onComplete(refundId, { method, transactionRef: txnRef.trim() || undefined })}
              disabled={loading || !method}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Xác nhận hoàn tiền
            </button>
          )}
        </div>
      </div>
    </div>
  );
}