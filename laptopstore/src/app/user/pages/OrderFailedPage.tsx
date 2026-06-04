import { useSearchParams, Link } from 'react-router';
import { Header } from '../components/Header';
import { XCircle, RefreshCw, Home, Phone, Mail, AlertCircle } from 'lucide-react';

export default function OrderFailedPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg">

          {/* Card chính */}
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">

            {/* Icon */}
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-12 text-red-600" />
            </div>

            {/* Tiêu đề */}
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Thanh toán thất bại</h1>
            <p className="mb-6 text-gray-500">
              Giao dịch không thành công hoặc đã bị huỷ. Đơn hàng của bạn vẫn được giữ lại.
            </p>

            {/* Mã đơn hàng */}
            {orderId && (
              <div className="mb-8 rounded-xl bg-gray-50 px-6 py-4">
                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                <p className="mt-1 text-xl font-bold text-gray-900">#{orderId}</p>
              </div>
            )}

            {/* Lý do thường gặp */}
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="mb-2 text-sm font-semibold text-amber-900">Nguyên nhân thường gặp:</p>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li>• Hết thời gian thanh toán (quá 15 phút)</li>
                    <li>• Số dư tài khoản không đủ</li>
                    <li>• Thẻ bị từ chối bởi ngân hàng</li>
                    <li>• Bạn đã huỷ giao dịch</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {/* ✅ Trỏ về order detail để retry */}
              <Link
                to={orderId ? `/order-success?orderId=${orderId}` : '/profile?tab=orders'}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="size-5" />
                Xem đơn hàng & thanh toán lại
              </Link>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Home className="size-5" />
                Về trang chủ
              </Link>
            </div>
          </div>

          {/* Hỗ trợ */}
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="mb-3 text-sm font-semibold text-blue-900">Cần hỗ trợ?</p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <Phone className="size-4" />
                <a href="tel:1900xxxx" className="font-medium hover:underline">
                  Hotline: 1900 xxxx
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                <a href="mailto:support@laptopshop.vn" className="font-medium hover:underline">
                  support@laptopshop.vn
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}