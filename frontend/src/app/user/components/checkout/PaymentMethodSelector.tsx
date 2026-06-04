import { CreditCard, Building2, Wallet, Smartphone } from 'lucide-react';

export type UiPaymentMethodId = 'card' | 'bank-transfer' | 'ewallet' | 'cod';

export interface PaymentMethodPreview {
  /** Hiển thị mã đơn — trước khi đặt hàng có thể để null */
  orderCode: string | null;
  productSummary: string;
  totalAmount: number;
}

interface PaymentMethodSelectorProps {
  selectedId: UiPaymentMethodId | null;
  onSelectMethod: (method: UiPaymentMethodId) => void;
  preview: PaymentMethodPreview;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function PaymentMethodSelector({ selectedId, onSelectMethod, preview }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'card' as const,
      icon: CreditCard,
      title: 'Thẻ tín dụng / Ghi nợ',
      description: 'Visa, Mastercard, JCB, Amex (VNPay)',
      recommended: true,
    },
    {
      id: 'bank-transfer' as const,
      icon: Building2,
      title: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua Internet Banking',
    },
    {
      id: 'ewallet' as const,
      icon: Wallet,
      title: 'Ví điện tử',
      description: 'MoMo, ZaloPay, VNPay',
      comingSoon: true,
    },
    {
      id: 'cod' as const,
      icon: Smartphone,
      title: 'Thanh toán khi nhận hàng',
      description: 'COD - Cash on Delivery',
    },
  ];

  return (
    <div className="max-w-none">
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Chọn phương thức thanh toán</h2>
        <p className="text-gray-600">Vui lòng chọn phương thức thanh toán phù hợp với bạn</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedId === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => !method.comingSoon && onSelectMethod(method.id)}
              disabled={method.comingSoon}
              className={`rounded-lg border-2 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md ${
                method.comingSoon
                  ? 'cursor-not-allowed border-gray-200 opacity-60'
                  : 'cursor-pointer border-gray-200 hover:border-blue-500'
              } ${method.recommended && !isSelected ? 'ring-2 ring-blue-100' : ''} ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-lg p-3 ${method.comingSoon ? 'bg-gray-100' : 'bg-blue-50'}`}
                >
                  <Icon
                    className={`h-6 w-6 ${method.comingSoon ? 'text-gray-400' : 'text-blue-600'}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{method.title}</h3>
                    {method.recommended && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Phổ biến
                      </span>
                    )}
                    {method.comingSoon && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Sắp ra mắt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm text-blue-700">Mã đơn hàng</p>
            <p className="font-semibold text-blue-900">{preview.orderCode ?? '— (sau khi đặt hàng)'}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-blue-700">Sản phẩm</p>
            <p className="line-clamp-2 font-semibold text-blue-900">{preview.productSummary}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-blue-700">Tổng tiền</p>
            <p className="text-xl font-bold text-blue-900">{formatVnd(preview.totalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
