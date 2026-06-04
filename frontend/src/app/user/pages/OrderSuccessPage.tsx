import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  CheckCircle, Package, Truck, MapPin, Phone, Mail,
  Calendar, CreditCard, FileText, Printer, Home,
  ShoppingBag, ArrowRight, Loader2, AlertCircle,
  Star, X, SendHorizonal, RefreshCw, Wrench, RotateCcw,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import api, { ENDPOINTS } from '../config/apiConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipping' | 'delivered' | 'completed'
  | 'cancelled' | 'refunded';

type PaymentMethod = 'cod' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay' | 'credit_card';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItemResponse {
  itemId:      number;
  productId:   number;
  productName: string;
  brandName:   string | null;
  image:       string | null;
  unitPrice:   number;
  quantity:    number;
  totalPrice:  number;
  reviewed?:   boolean;
  hasWarranty?: boolean;
  hasRefunded?: boolean;
}

interface AddressResponse {
  recipientName: string;
  phone:         string;
  addressLine:   string;
  ward:          string | null;
  district:      string;
  city:          string;
}

interface PaymentResponse {
  method:        string | PaymentMethod;
  status:        PaymentStatus;
  amount:        number;
  transactionId: string | null;
  paidAt:        string | null;
}

interface OrderDetailResponse {
  id:             number;
  orderCode:      string;
  status:         OrderStatus;
  subtotal:       number;
  discountAmount: number;
  shippingFee:    number;
  totalAmount:    number;
  note:           string | null;
  orderedAt:      string;
  items:          OrderItemResponse[];
  address:        AddressResponse | null;
  payment:        PaymentResponse | null;
}

interface ItemTarget {
  itemId:      number;
  productId:   number;
  productName: string;
  image:       string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Phải khớp với WARRANTY_MONTHS trong WarrantyService.java */
const WARRANTY_MONTHS = 12;

/** Phải khớp với chính sách hoàn trả — 7 ngày + 3 ngày buffer vận chuyển */
const REFUND_DAYS = 7;
const SHIP_BUFFER_DAYS = 3;

// ── Deadline helpers ──────────────────────────────────────────────────────────

function isWithinWarranty(orderedAt: string): boolean {
  const deadline = new Date(orderedAt);
  deadline.setMonth(deadline.getMonth() + WARRANTY_MONTHS);
  return new Date() <= deadline;
}

function isWithinRefundWindow(orderedAt: string): boolean {
  const deadline = new Date(orderedAt);
  deadline.setDate(deadline.getDate() + REFUND_DAYS + SHIP_BUFFER_DAYS);
  return new Date() <= deadline;
}

function formatDeadlineRemaining(orderedAt: string, type: 'warranty' | 'refund'): string {
  const deadline = new Date(orderedAt);
  if (type === 'warranty') {
    deadline.setMonth(deadline.getMonth() + WARRANTY_MONTHS);
  } else {
    deadline.setDate(deadline.getDate() + REFUND_DAYS + SHIP_BUFFER_DAYS);
  }

  const diffMs   = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffDays <= 0)  return 'Đã hết hạn';
  if (diffDays <= 30) return `còn ${diffDays} ngày`;
  return `còn ${Math.floor(diffDays / 30)} tháng`;
}

// ── Other helpers ─────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod:           'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo:          'Ví MoMo',
  vnpay:         'VNPay',
  zalopay:       'ZaloPay',
  credit_card:   'Thẻ tín dụng / Ghi nợ',
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { label: string; color: string }> = {
  pending:  { label: 'Chờ thanh toán', color: 'bg-amber-500' },
  paid:     { label: 'Đã thanh toán',  color: 'bg-green-500' },
  failed:   { label: 'Thất bại',       color: 'bg-red-500'   },
  refunded: { label: 'Đã hoàn tiền',   color: 'bg-gray-500'  },
};

const RATING_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

const TIMELINE_STEPS: {
  status: OrderStatus[];
  label:  string;
  sub:    string;
  icon:   React.ReactNode;
}[] = [
  {
    status: ['pending','confirmed','processing','shipping','delivered','completed'],
    label: 'Đơn hàng đã đặt', sub: '',
    icon: <CheckCircle className="size-5 text-white" />,
  },
  {
    status: ['confirmed','processing','shipping','delivered','completed'],
    label: 'Đã xác nhận', sub: 'Shop đã xác nhận đơn',
    icon: <Package className="size-5" />,
  },
  {
    status: ['processing','shipping','delivered','completed'],
    label: 'Đang xử lý', sub: 'Đang đóng gói sản phẩm',
    icon: <Package className="size-5" />,
  },
  {
    status: ['shipping','delivered','completed'],
    label: 'Đang vận chuyển', sub: 'Đơn hàng đang trên đường',
    icon: <Truck className="size-5" />,
  },
  {
    status: ['delivered','completed'],
    label: 'Hoàn thành', sub: 'Giao hàng thành công',
    icon: <CheckCircle className="size-5" />,
  },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function estimatedDeliveryDate(orderedAt: string) {
  const d = new Date(orderedAt);
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

async function apiFetch<T>(
  path: string,
  options?: { method?: 'GET'|'POST'|'PUT'|'DELETE'; body?: unknown },
): Promise<T> {
  const response = await api.request<T>({
    url:    path,
    method: options?.method ?? 'GET',
    data:   options?.body,
  });
  return response.data;
}

const ORDER_BASE = ENDPOINTS?.ORDERS?.BASE ?? '/orders';

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  target, onClose, onSuccess,
}: {
  target: ItemTarget; onClose: () => void; onSuccess: (itemId: number) => void;
}) {
  const [rating,      setRating]      = useState(0);
  const [comment,     setComment]     = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0)               { setError('Vui lòng chọn số sao đánh giá.'); return; }
    if (comment.trim().length < 10) { setError('Nội dung đánh giá phải có ít nhất 10 ký tự.'); return; }
    setSubmitting(true); setError(null);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: { productId: target.productId, orderItemId: target.itemId, rating, comment: comment.trim() },
      });
      onSuccess(target.itemId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Đánh giá sản phẩm" onClose={onClose} />
      <ProductMiniCard target={target} />
      <div className="p-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Chất lượng sản phẩm</p>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(star => (
              <button
                key={star} type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => { setRating(star); setError(null); }}
                className="transition-transform hover:scale-110"
              >
                <Star className={`size-9 transition-colors ${
                  star <= (hoveredStar || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                }`} />
              </button>
            ))}
            {(hoveredStar || rating) > 0 && (
              <span className="ml-2 text-sm font-medium text-yellow-600">
                {RATING_LABELS[hoveredStar || rating]}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Nội dung đánh giá</p>
          <textarea
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow"
            value={comment}
            onChange={e => { setComment(e.target.value); setError(null); }}
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</p>
        </div>
        {error && <ModalError message={error} />}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <SendHorizonal className="size-4 mr-2" />}
            Gửi đánh giá
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Warranty Modal ────────────────────────────────────────────────────────────

function WarrantyModal({
  target, onClose, onSuccess,
}: {
  target: ItemTarget; onClose: () => void; onSuccess: (itemId: number) => void;
}) {
  const [issue,      setIssue]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async () => {
    if (issue.trim().length < 10) { setError('Mô tả lỗi phải có ít nhất 10 ký tự.'); return; }
    setSubmitting(true); setError(null);
    try {
      await apiFetch('/warranty', {
        method: 'POST',
        body: { orderItemId: target.itemId, issueDescription: issue.trim() },
      });
      onSuccess(target.itemId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Gửi yêu cầu bảo hành thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Yêu cầu bảo hành" onClose={onClose} />
      <ProductMiniCard target={target} />
      <div className="p-5 space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          Bảo hành áp dụng cho lỗi kỹ thuật, phần cứng do nhà sản xuất.
          Không áp dụng cho hư hỏng do tác động vật lý hoặc chất lỏng.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mô tả vấn đề <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Vd: Máy tính không thể sạc pin, đèn báo sạc không sáng dù đã cắm điện đúng cách..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow"
            value={issue}
            onChange={e => { setIssue(e.target.value); setError(null); }}
            maxLength={2000}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">Tối thiểu 10 ký tự</span>
            <span className={`text-xs ${issue.length < 10 ? 'text-gray-400' : 'text-green-600'}`}>
              {issue.length}/2000
            </span>
          </div>
        </div>
        {error && <ModalError message={error} />}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Wrench className="size-4 mr-2" />}
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Refund Modal ──────────────────────────────────────────────────────────────

function RefundModal({
  target, orderId, onClose, onSuccess,
}: {
  target: ItemTarget; orderId: number; onClose: () => void; onSuccess: (itemId: number) => void;
}) {
  const [quantity,   setQuantity]   = useState(1);
  const [reason,     setReason]     = useState('');
  const [itemReason, setItemReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) { setError('Lý do hoàn trả phải có ít nhất 10 ký tự.'); return; }
    setSubmitting(true); setError(null);
    try {
      await apiFetch('/v1/returns', {
        method: 'POST',
        body: {
          orderId,
          reason: reason.trim(),
          items: [{ orderItemId: target.itemId, quantity, reason: itemReason.trim() || reason.trim() }],
        },
      });
      onSuccess(target.itemId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Gửi yêu cầu hoàn trả thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Yêu cầu hoàn trả" onClose={onClose} />
      <ProductMiniCard target={target} />
      <div className="p-5 space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Yêu cầu hoàn trả chỉ được chấp nhận trong vòng {REFUND_DAYS} ngày kể từ khi nhận hàng.
          Sản phẩm phải còn nguyên vẹn và đầy đủ phụ kiện.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng hoàn trả</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg">−</button>
            <span className="w-8 text-center font-bold text-base">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)}
              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 font-bold text-lg">+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Lý do hoàn trả <span className="text-red-500">*</span>
          </label>
          <textarea rows={3}
            placeholder="Vd: Sản phẩm không đúng mô tả, bị lỗi khi nhận hàng..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            value={reason}
            onChange={e => { setReason(e.target.value); setError(null); }}
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{reason.length}/1000</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chú thêm <span className="text-gray-400 ml-1 font-normal">(tùy chọn)</span>
          </label>
          <textarea rows={2}
            placeholder="Chi tiết thêm về lỗi của sản phẩm này..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            value={itemReason}
            onChange={e => setItemReason(e.target.value)}
            maxLength={500}
          />
        </div>
        {error && <ModalError message={error} />}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <RotateCcw className="size-4 mr-2" />}
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Shared Modal Sub-components ───────────────────────────────────────────────

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
      <h2 className="text-lg font-bold">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
        <X className="size-5 text-gray-500" />
      </button>
    </div>
  );
}

function ProductMiniCard({ target }: { target: ItemTarget }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b">
      {target.image ? (
        <img src={target.image} alt={target.productName}
          className="size-14 object-cover rounded-lg border"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56?text=?'; }} />
      ) : (
        <div className="size-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
      )}
      <p className="text-sm font-medium line-clamp-2 flex-1">{target.productName}</p>
    </div>
  );
}

function ModalError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <AlertCircle className="size-4 flex-shrink-0" />{message}
    </div>
  );
}

// ── Success Toast ─────────────────────────────────────────────────────────────

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium">
      <CheckCircle className="size-4 text-green-400" />{message}
    </div>
  );
}

// ── Item Action Buttons ───────────────────────────────────────────────────────

function ItemActionButtons({
  target,
  orderedAt,
  hasReviewed,
  hasWarranty,
  hasRefunded,
  onReview,
  onWarranty,
  onRefund,
}: {
  target:      ItemTarget;
  orderedAt:   string;
  hasReviewed: boolean;
  hasWarranty: boolean;
  hasRefunded: boolean;
  onReview:    () => void;
  onWarranty:  () => void;
  onRefund:    () => void;
}) {
  const withinWarranty = isWithinWarranty(orderedAt);
  const withinRefund   = isWithinRefundWindow(orderedAt);

  return (
    <div className="mt-2 flex flex-wrap gap-2">

      {/* ── Đánh giá — không giới hạn thời gian ── */}
      {hasReviewed ? (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
          <CheckCircle className="size-3.5" /> Đã đánh giá
        </span>
      ) : (
        <button
          onClick={onReview}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Star className="size-3.5" /> Viết đánh giá
        </button>
      )}

      {/* ── Bảo hành ── */}
      {hasWarranty ? (
        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
          <CheckCircle className="size-3.5" /> Đã yêu cầu bảo hành
        </span>
      ) : withinWarranty ? (
        <button
          onClick={onWarranty}
          title={`Bảo hành ${WARRANTY_MONTHS} tháng`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Wrench className="size-3.5" />
          Yêu cầu bảo hành
          <span className="text-blue-400 font-normal ml-0.5">
            · {formatDeadlineRemaining(orderedAt, 'warranty')}
          </span>
        </button>
      ) : (
        <span
          title={`Đã hết hạn bảo hành ${WARRANTY_MONTHS} tháng`}
          className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium cursor-not-allowed select-none"
        >
          <Wrench className="size-3.5" /> Hết hạn bảo hành
        </span>
      )}

      {/* ── Hoàn trả ── */}
      {hasRefunded ? (
        <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
          <CheckCircle className="size-3.5" /> Đã yêu cầu hoàn trả
        </span>
      ) : withinRefund ? (
        <button
          onClick={onRefund}
          title={`Hoàn trả trong ${REFUND_DAYS} ngày`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Yêu cầu hoàn trả
          <span className="text-orange-400 font-normal ml-0.5">
            · {formatDeadlineRemaining(orderedAt, 'refund')}
          </span>
        </button>
      ) : (
        <span
          title={`Đã quá ${REFUND_DAYS} ngày kể từ khi đặt hàng`}
          className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium cursor-not-allowed select-none"
        >
          <RotateCcw className="size-3.5" /> Hết hạn hoàn trả
        </span>
      )}

    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const orderId        = searchParams.get('orderId');

  const [order,        setOrder]        = useState<OrderDetailResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [reviewTarget,   setReviewTarget]   = useState<ItemTarget | null>(null);
  const [warrantyTarget, setWarrantyTarget] = useState<ItemTarget | null>(null);
  const [refundTarget,   setRefundTarget]   = useState<ItemTarget | null>(null);

  const [reviewedItems,  setReviewedItems]  = useState<Set<number>>(new Set());
  const [warrantyItems,  setWarrantyItems]  = useState<Set<number>>(new Set());
  const [refundedItems,  setRefundedItems]  = useState<Set<number>>(new Set());

  const [toast,      setToast]      = useState<string | null>(null);
  const [retrying,   setRetrying]   = useState(false);
  const [retryError, setRetryError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderId) { setError('Không tìm thấy mã đơn hàng.'); setLoading(false); return; }

    apiFetch<OrderDetailResponse>(`${ORDER_BASE}/${orderId}`)
      .then(data => {
        setOrder(data);
        setReviewedItems(new Set(data.items.filter(i => i.reviewed).map(i => i.itemId)));
        setWarrantyItems(new Set(data.items.filter(i => i.hasWarranty).map(i => i.itemId)));
        setRefundedItems(new Set(data.items.filter(i => i.hasRefunded).map(i => i.itemId)));
      })
      .catch((err: any) => {
        if (err.response?.status === 401) {
          setUnauthorized(true);
          setError('Bạn chưa đăng nhập hoặc phiên đã hết hạn.');
        } else {
          setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể tải thông tin đơn hàng.');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetrying(true); setRetryError('');
    try {
      const res = await apiFetch<{ paymentUrl?: string }>(ENDPOINTS.PAYMENT.BASE, {
        method: 'POST',
        body: { orderId: order.id, method: String(order.payment?.method ?? 'VNPAY').toUpperCase() },
      });
      if (res.paymentUrl) window.location.href = res.paymentUrl;
    } catch (err: any) {
      setRetryError(err.response?.data?.message || err.message || 'Không thể khởi tạo thanh toán.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex justify-center items-center h-96"><Loader2 className="size-10 animate-spin text-red-600" /></div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="size-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        {unauthorized ? (
          <div className="flex flex-col items-center gap-3">
            <Button onClick={() => { const next = encodeURIComponent(`/order-success?orderId=${orderId ?? ''}`); navigate(`/login?next=${next}`); }}>
              Đăng nhập để xem đơn hàng
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Về trang chủ</Button>
          </div>
        ) : (
          <Button onClick={() => navigate('/profile')}>Xem đơn hàng của tôi</Button>
        )}
      </div>
    </div>
  );

  const payment          = order.payment;
  const address          = order.address;
  const isCancelled      = order.status === 'cancelled' || order.status === 'refunded';
  const isCompleted      = order.status === 'completed';
  const paymentMethodKey = payment ? (String(payment.method).toLowerCase() as PaymentMethod) : null;

  const canRetryPayment =
    payment !== null &&
    (payment.status === 'failed' || payment.status === 'pending') &&
    paymentMethodKey !== 'cod' &&
    paymentMethodKey !== 'bank_transfer';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {reviewTarget && (
        <ReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)}
          onSuccess={itemId => { setReviewedItems(p => new Set([...p, itemId])); setReviewTarget(null); setToast('✅ Đánh giá đã được gửi!'); }} />
      )}
      {warrantyTarget && (
        <WarrantyModal target={warrantyTarget} onClose={() => setWarrantyTarget(null)}
          onSuccess={itemId => { setWarrantyItems(p => new Set([...p, itemId])); setWarrantyTarget(null); setToast('🔧 Yêu cầu bảo hành đã được gửi!'); }} />
      )}
      {refundTarget && (
        <RefundModal target={refundTarget} orderId={order.id} onClose={() => setRefundTarget(null)}
          onSuccess={itemId => { setRefundedItems(p => new Set([...p, itemId])); setRefundTarget(null); setToast('↩️ Yêu cầu hoàn trả đã được gửi!'); }} />
      )}
      {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}

      <div className="container mx-auto px-4 py-8">

        {/* Banner */}
        <div className={`rounded-lg p-8 mb-8 text-white ${isCancelled ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="size-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              {isCancelled ? <AlertCircle className="size-12 text-red-500" /> : <CheckCircle className="size-12 text-green-600" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {isCancelled ? 'Đơn hàng đã bị huỷ' : 'Đặt hàng thành công!'}
            </h1>
            <p className="text-green-50 text-lg mb-6">
              {isCancelled ? 'Đơn hàng của bạn đã bị huỷ hoặc hoàn tiền.' : 'Cảm ơn bạn đã mua hàng tại LaptopShop. Đơn hàng đang được xử lý.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {[
                { label: 'Mã đơn hàng',    value: order.orderCode },
                { label: 'Tổng thanh toán', value: `${order.totalAmount.toLocaleString('vi-VN')}₫` },
                { label: 'Thời gian đặt',   value: formatDateTime(order.orderedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <p className="text-sm text-green-100 mb-1">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Timeline */}
            {!isCancelled && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">Trạng thái đơn hàng</h2>
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />
                  <div className="space-y-6 relative">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const active = step.status.includes(order.status);
                      return (
                        <div key={idx} className="flex gap-4">
                          <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${active ? 'bg-green-500' : 'bg-gray-200'}`}>
                            <span className={active ? 'text-white' : 'text-gray-400'}>{step.icon}</span>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${active ? '' : 'text-gray-400'}`}>{step.label}</h3>
                            <p className={`text-sm ${active ? 'text-gray-600' : 'text-gray-400'}`}>
                              {idx === 0 ? formatDateTime(order.orderedAt) : step.sub}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {['pending','confirmed','processing','shipping'].includes(order.status) && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <Calendar className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Dự kiến giao hàng</h4>
                      <p className="text-blue-700 text-sm">{estimatedDeliveryDate(order.orderedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order items */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
                {isCompleted && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
                    ⭐ Đơn hoàn thành — hãy đánh giá sản phẩm!
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {order.items.map(item => {
                  const target: ItemTarget = {
                    itemId: item.itemId, productId: item.productId,
                    productName: item.productName, image: item.image,
                  };
                  return (
                    <div key={item.itemId} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <ImageWithFallback
                        src={item.image || ''} alt={item.productName}
                        className="size-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{item.brandName}</p>
                        <h3 className="font-medium mb-1 line-clamp-2">{item.productName}</h3>
                        <p className="text-sm text-gray-500">
                          {item.unitPrice.toLocaleString('vi-VN')}₫ × {item.quantity}
                        </p>
                        {isCompleted && (
                          <ItemActionButtons
                            target={target}
                            orderedAt={order.orderedAt}
                            hasReviewed={reviewedItems.has(item.itemId)}
                            hasWarranty={warrantyItems.has(item.itemId)}
                            hasRefunded={refundedItems.has(item.itemId)}
                            onReview={() => setReviewTarget(target)}
                            onWarranty={() => setWarrantyTarget(target)}
                            onRefund={() => setRefundTarget(target)}
                          />
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-red-600">{item.totalPrice.toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tổng tiền */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-medium">{order.subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-medium text-green-600">-{order.discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-medium">
                    {order.shippingFee === 0
                      ? <span className="text-green-600">Miễn phí</span>
                      : `${order.shippingFee.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <span className="font-bold text-2xl text-red-600">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {order.note && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
                  <FileText className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600"><span className="font-medium">Ghi chú:</span> {order.note}</p>
                </div>
              )}
            </div>

            {/* Address + Payment */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="size-5 text-red-600" />
                  <h3 className="font-bold">Địa chỉ giao hàng</h3>
                </div>
                {address ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{address.recipientName}</p>
                    <p className="text-gray-600">{address.addressLine}</p>
                    <p className="text-gray-600">{[address.ward, address.district, address.city].filter(Boolean).join(', ')}</p>
                    <div className="flex items-center gap-2 pt-2 border-t mt-3">
                      <Phone className="size-4 text-gray-400" />
                      <span className="text-gray-600">{address.phone}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Mua trực tiếp tại cửa hàng</p>
                )}
              </div>

              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="size-5 text-red-600" />
                  <h3 className="font-bold">Phương thức thanh toán</h3>
                </div>
                {payment ? (
                  <div className="space-y-2 text-sm">
                    <Badge className={`${PAYMENT_STATUS_LABEL[payment.status].color} hover:opacity-90`}>
                      {PAYMENT_STATUS_LABEL[payment.status].label}
                    </Badge>
                    <p className="text-gray-700 font-medium">
                      {paymentMethodKey && PAYMENT_METHOD_LABEL[paymentMethodKey]
                        ? PAYMENT_METHOD_LABEL[paymentMethodKey]
                        : String(payment.method)}
                    </p>
                    {payment.transactionId && <p className="text-gray-500">Mã GD: {payment.transactionId}</p>}
                    {payment.paidAt && <p className="text-gray-500">Thanh toán lúc: {formatDateTime(payment.paidAt)}</p>}
                    {payment.status === 'pending' && (paymentMethodKey === 'cod' || String(payment.method).toLowerCase() === 'cod') && (
                      <p className="text-gray-600 pt-2 border-t mt-3">
                        Vui lòng chuẩn bị <span className="font-semibold text-red-600">{order.totalAmount.toLocaleString('vi-VN')}₫</span> khi nhận hàng
                      </p>
                    )}
                    {canRetryPayment && (
                      <div className="pt-3 border-t mt-3 space-y-2">
                        <p className="text-amber-600 text-xs font-medium flex items-center gap-1">
                          <AlertCircle className="size-3.5" /> Giao dịch chưa hoàn tất
                        </p>
                        <button onClick={handleRetryPayment} disabled={retrying}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
                          {retrying ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</> : <><RefreshCw className="size-4" /> Thanh toán lại</>}
                        </button>
                        {retryError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="size-3.5" /> {retryError}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có thông tin thanh toán</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-bold mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.print()}>
                  <Printer className="size-4 mr-2" /> In đơn hàng
                </Button>
                <Link to="/profile?tab=orders">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="size-4 mr-2" /> Xem tất cả đơn hàng
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200 p-6">
              <h3 className="font-bold mb-3 text-red-900">Cần hỗ trợ đơn hàng?</h3>
              <p className="text-sm text-gray-700 mb-4">Liên hệ với chúng tôi qua hotline hoặc email để được hỗ trợ nhanh nhất.</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700"><Phone className="size-4 text-red-600" /><span className="font-medium">Hotline: 1900 xxxx</span></div>
                <div className="flex items-center gap-2 text-gray-700"><Mail className="size-4 text-red-600" /><span>support@laptopshop.vn</span></div>
              </div>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700">Liên hệ hỗ trợ</Button>
            </div>

            {!isCancelled && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-bold mb-4">Các bước tiếp theo</h3>
                <div className="space-y-3 text-sm">
                  {[
                    'Chúng tôi sẽ gọi điện xác nhận đơn hàng trong vòng 24h',
                    'Đơn hàng sẽ được đóng gói và giao cho đơn vị vận chuyển',
                    'Bạn sẽ nhận được thông báo khi đơn hàng đang được giao',
                    'Kiểm tra sản phẩm và thanh toán khi nhận hàng',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="size-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-red-600">{i + 1}</span>
                      </div>
                      <p className="text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link to="/"><Button variant="outline" className="w-full justify-center" size="lg"><Home className="size-4 mr-2" /> Về trang chủ</Button></Link>
              <Link to="/products">
                <Button className="w-full justify-center bg-red-600 hover:bg-red-700" size="lg">
                  <ShoppingBag className="size-4 mr-2" /> Tiếp tục mua sắm <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Mail className="size-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-bold text-blue-900 mb-2">Email xác nhận đã được gửi</h3>
          <p className="text-sm text-blue-700">
            Chúng tôi đã gửi email xác nhận đơn hàng <strong>{order.orderCode}</strong> đến địa chỉ email của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}