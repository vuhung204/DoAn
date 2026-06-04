import { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Clock,
  Building2,
  CreditCard,
  Banknote,
  AlertCircle,
  QrCode,
} from 'lucide-react';

export interface BankTransferOrderInfo {
  orderId: number;
  orderCode: string;
  amount: number;
  description: string;
  /** ISO hoặc chuỗi `yyyy-MM-dd HH:mm:ss` từ API */
  orderedAt?: string;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}

const DEFAULT_BANK: BankInfo = {
  bankName: 'Ngân hàng TMCP Á Châu (ACB)',
  accountNumber: '123456789',
  accountName: 'CONG TY TNHH LAPTOP STORE',
  branch: 'Chi nhánh TP. Hồ Chí Minh',
};

interface BankTransferPaymentProps {
  order: BankTransferOrderInfo;
  bankInfo?: BankInfo;
  onBack?: () => void;
  onDone: () => void;
}

function parseOrderedAt(orderedAt?: string): Date {
  if (!orderedAt) return new Date();
  const normalized = orderedAt.includes('T') ? orderedAt : orderedAt.replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function BankTransferPayment({ order, bankInfo = DEFAULT_BANK, onBack, onDone }: BankTransferPaymentProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const expiresAt = useMemo(() => {
    const start = parseOrderedAt(order.orderedAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }, [order.orderedAt]);

  const transferContent = `${order.orderCode} ${order.description}`;

  useEffect(() => {
    const tick = () => {
      const diff = expiresAt.getTime() - Date.now();
      setTimeRemaining(Math.max(0, diff));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const createdLabel = order.orderedAt ?? '—';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {onBack && (
              <button type="button" onClick={onBack} className="mb-3 text-sm font-medium text-blue-600 hover:underline">
                ← Quay lại chỉnh sửa đơn
              </button>
            )}
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Thanh toán chuyển khoản</h1>
            <p className="text-gray-600">Vui lòng chuyển khoản theo thông tin bên dưới</p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-sm text-gray-500">Mã đơn hàng</div>
            <div className="text-lg font-semibold text-gray-900">{order.orderCode}</div>
          </div>
        </div>
      </div>

      {timeRemaining > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Thời gian còn lại để thanh toán (ước tính)</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{formatTime(timeRemaining)}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-900">Đã quá thời gian gợi ý — vui lòng liên hệ hỗ trợ nếu cần.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Thông tin tài khoản nhận</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-600">Ngân hàng</div>
                <div className="font-semibold text-gray-900">{bankInfo.bankName}</div>
                {bankInfo.branch && <div className="mt-1 text-sm text-gray-500">{bankInfo.branch}</div>}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-600">Số tài khoản</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl font-bold text-gray-900">{bankInfo.accountNumber}</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankInfo.accountNumber, 'accountNumber')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    {copied === 'accountNumber' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-600">Chủ tài khoản</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-gray-900">{bankInfo.accountName}</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankInfo.accountName, 'accountName')}
                    className="flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    {copied === 'accountName' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="mb-1 text-sm text-gray-600">Số tiền cần chuyển</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(order.amount)}</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(order.amount), 'amount')}
                    className="flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    {copied === 'amount' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-600">Nội dung chuyển khoản</div>
                <div className="flex items-start justify-between gap-2">
                  <div className="break-all font-semibold text-gray-900">{transferContent}</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, 'content')}
                    className="flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    {copied === 'content' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-600">Sản phẩm</span>
                <span className="max-w-[60%] text-right font-medium text-gray-900">{order.description}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-600">Mã đơn hàng</span>
                <span className="font-medium text-gray-900">{order.orderCode}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-600">Thời gian tạo</span>
                <span className="font-medium text-gray-900">{createdLabel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tổng tiền</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Mã QR</h2>
            </div>
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 p-6">
              <div className="text-center">
                <QrCode className="mx-auto mb-2 h-16 w-16 text-gray-400" />
                <p className="text-sm text-gray-500">Quét mã QR để thanh toán nhanh</p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-500">Sử dụng app ngân hàng để quét mã QR</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Hướng dẫn</h2>
            </div>

            <ol className="space-y-3 text-sm text-gray-600">
              {[
                'Mở app ngân hàng hoặc Internet Banking',
                'Chọn chức năng chuyển khoản',
                'Nhập thông tin tài khoản nhận và số tiền',
                'Nhập chính xác nội dung chuyển khoản',
                'Xác nhận và hoàn tất giao dịch',
              ].map((text, i) => (
                <li key={text} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    {i + 1}
                  </span>
                  <span>
                    {i === 3 ? <strong className="text-gray-800">Quan trọng: </strong> : null}
                    {text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-xs text-amber-900">
                  <p className="mb-1 font-semibold">Lưu ý quan trọng:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Chuyển đúng số tiền</li>
                    <li>Ghi đúng nội dung chuyển khoản</li>
                    <li>Đơn hàng sẽ được xác nhận sau khi nhận được tiền</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-medium text-blue-900">Cần hỗ trợ?</p>
            <p className="text-sm text-blue-700">
              Hotline:{' '}
              <a href="tel:1900xxxx" className="font-semibold hover:underline">
                1900 xxxx
              </a>
            </p>
            <p className="text-sm text-blue-700">
              Email:{' '}
              <a href="mailto:support@laptopstore.vn" className="font-semibold hover:underline">
                support@laptopstore.vn
              </a>
            </p>
          </div>

          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Đã chuyển khoản — Xem trạng thái đơn
          </button>
        </div>
      </div>
    </div>
  );
}
