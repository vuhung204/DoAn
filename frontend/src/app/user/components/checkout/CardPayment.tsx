import { useState } from 'react';
import { CreditCard, Lock, AlertCircle, Calendar, Shield } from 'lucide-react';

export interface CardPaymentOrderInfo {
  orderId: number;
  orderCode: string;
  amount: number;
  description: string;
}

interface CardPaymentProps {
  order: CardPaymentOrderInfo;
  onPay: () => Promise<void>;
  onBack?: () => void;
}

export function CardPayment({ order, onPay, onBack }: CardPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    if (value.length <= 5) setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    setIsProcessing(true);
    try {
      await onPay();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể khởi tạo thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardType = (number: string) => {
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    return '';
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-3 text-sm font-medium text-blue-600 hover:underline"
              >
                ← Quay lại chỉnh sửa đơn
              </button>
            )}
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Thanh toán bằng thẻ</h1>
            <p className="text-gray-600">
              Giao diện minh họa thông tin thẻ. Thanh toán thực tế diễn ra trên cổng VNPay sau khi bạn bấm
              thanh toán.
            </p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-sm text-gray-500">Mã đơn hàng</div>
            <div className="text-lg font-semibold text-gray-900">{order.orderCode}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Thông tin thẻ (minh họa)</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="mb-2 block text-sm font-medium text-gray-700">
                    Số thẻ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="cardNumber"
                      value={formatCardNumber(cardNumber)}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cardNumber.length > 0 && (
                        <span className="text-xs font-semibold text-gray-500">{getCardType(cardNumber)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="cardName" className="mb-2 block text-sm font-medium text-gray-700">
                    Tên chủ thẻ
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiryDate" className="mb-2 block text-sm font-medium text-gray-700">
                      Ngày hết hạn
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="expiryDate"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Calendar className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cvv" className="mb-2 block text-sm font-medium text-gray-700">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cvv"
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="saveCard" className="text-sm text-gray-700">
                    Lưu thông tin thẻ cho lần mua sau
                  </label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isProcessing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang chuyển hướng...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Thanh toán {formatCurrency(order.amount)} qua VNPay
                </>
              )}
            </button>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="text-sm text-green-900">
                  <p className="mb-1 font-semibold">Giao dịch được bảo mật</p>
                  <p>Thông tin thẻ thật chỉ nhập trên trang thanh toán của VNPay, không gửi qua máy chủ cửa hàng.</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tóm tắt đơn hàng</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-sm text-gray-600">Sản phẩm</span>
                <span className="max-w-[55%] text-right text-sm font-medium text-gray-900">{order.description}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-sm text-gray-600">Mã đơn hàng</span>
                <span className="text-sm font-medium text-gray-900">{order.orderCode}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-sm text-gray-600">Phí xử lý</span>
                <span className="text-sm font-medium text-gray-900">Miễn phí</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-200 py-3">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Thẻ được chấp nhận</h2>
            <div className="grid grid-cols-2 gap-3">
              {['Visa', 'Mastercard', 'Amex', 'JCB'].map((label) => (
                <div key={label} className="flex items-center justify-center rounded-lg border border-gray-200 p-3">
                  <div className="text-center">
                    <CreditCard className="mx-auto mb-1 h-8 w-8 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Câu hỏi thường gặp</p>
            </div>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Thẻ tín dụng và thẻ ghi nợ đều được chấp nhận trên VNPay</li>
              <li>• Giao dịch được xử lý ngay sau khi hoàn tất trên cổng</li>
              <li>• Hỗ trợ thanh toán quốc tế (tùy ngân hàng phát hành thẻ)</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-sm font-medium text-gray-900">Cần hỗ trợ?</p>
            <p className="text-sm text-gray-700">
              Hotline:{' '}
              <a href="tel:1900xxxx" className="font-semibold text-blue-600 hover:underline">
                1900 xxxx
              </a>
            </p>
            <p className="text-sm text-gray-700">
              Email:{' '}
              <a href="mailto:support@laptopstore.vn" className="font-semibold text-blue-600 hover:underline">
                support@laptopstore.vn
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
