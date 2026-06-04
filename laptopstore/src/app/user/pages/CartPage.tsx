import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  ChevronRight, Minus, Plus, X, ShoppingCart,
  Tag, Truck, Shield, ArrowLeft, Loader2,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import api, { ENDPOINTS } from '../config/apiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItemResponse {
  productId: number;
  productName: string;
  brandName: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
}

interface CartResponse {
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
}

/**
 * Kết quả trả về từ POST /api/promotions/validate
 */
interface PromotionResult {
  promotionId: number;
  code: string;
  name: string;
  discountType: 'percent' | 'fixed' | 'free_ship';
  discountValue: number;
  /** Số tiền thực được giảm — dùng để hiển thị */
  discountAmount: number;
  /** Phí ship sau khi áp mã (= 0 nếu FREE_SHIP) */
  shippingFeeAfterDiscount: number;
  /** Tổng thanh toán đã tính sẵn trên BE */
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREE_SHIP_THRESHOLD = 10_000_000;
const DEFAULT_SHIPPING_FEE = 200_000;

function calcShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIP_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // ── Coupon state ────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  /** Kết quả validate từ BE — null = chưa áp / đã xoá mã */
  const [appliedPromotion, setAppliedPromotion] = useState<PromotionResult | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchCart = async () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await fetch(`(import.meta as any).env?.VITE_API_URL || 'http://localhost:9765'`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) throw new Error('Không thể tải giỏ hàng');
      const data: CartResponse = await res.json();
      setCart(data);

      // Nếu giỏ thay đổi, re-validate mã đang áp để cập nhật discountAmount
      if (appliedPromotion) {
        await revalidatePromotion(appliedPromotion.code, data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cart operations ────────────────────────────────────────────────────────

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) return;
    setUpdatingId(productId);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:9765/api';
      const res = await fetch(`${baseUrl}/cart/${productId}?quantity=${newQuantity}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: CartResponse = await res.json();
        setCart(data);
        window.dispatchEvent(new Event('cart-updated'));

        // Re-validate mã để cập nhật discount theo subtotal mới
        if (appliedPromotion) {
          await revalidatePromotion(appliedPromotion.code, data);
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId: number) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) return;
    setUpdatingId(productId);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:9765/api';
      const res = await fetch(`${baseUrl}/cart/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchCart();
        window.dispatchEvent(new Event('cart-updated'));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Coupon: gọi API thực sự ────────────────────────────────────────────────

  /**
   * Gọi POST /api/promotions/validate.
   * Dùng lại cho cả lần đầu (applyCoupon) và re-validate khi cart thay đổi.
   */
  const callValidateApi = async (
    code: string,
    cartData: CartResponse,
  ): Promise<PromotionResult> => {
    const subtotal = cartData.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const totalQty = cartData.items.reduce((sum, item) => sum + item.quantity, 0);

    const response = await api.post<PromotionResult>(ENDPOINTS.PROMOTIONS.VALIDATE, {
      code: code.trim().toUpperCase(),
      subtotal,
      totalQty,
    });
    return response.data;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!cart || cart.items.length === 0) {
      setCouponError('Giỏ hàng trống, không thể áp mã giảm giá.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setAppliedPromotion(null);

    try {
      const result = await callValidateApi(couponCode, cart);
      setAppliedPromotion(result);
      setCouponCode('');
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Mã giảm giá không hợp lệ.';
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  /** Re-validate im lặng khi cart thay đổi (không hiện loading spinner to) */
  const revalidatePromotion = async (code: string, cartData: CartResponse) => {
    try {
      const result = await callValidateApi(code, cartData);
      setAppliedPromotion(result);
    } catch {
      // Mã không còn hợp lệ với giỏ mới → xoá
      setAppliedPromotion(null);
      setCouponError('Mã giảm giá không còn hợp lệ với giỏ hàng hiện tại.');
    }
  };

  const removeCoupon = () => {
    setAppliedPromotion(null);
    setCouponError(null);
  };

  // ─── Derived values ──────────────────────────────────────────────────────────

  const subtotal = cart?.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  ) ?? 0;

  const shippingFee = appliedPromotion
    ? appliedPromotion.shippingFeeAfterDiscount  // BE đã tính (FREE_SHIP = 0)
    : calcShippingFee(subtotal);

  const discountAmount = appliedPromotion?.discountAmount ?? 0;

  const total = appliedPromotion
    ? appliedPromotion.total  // dùng total đã tính sẵn từ BE
    : subtotal + shippingFee;

  // ─── Persist applied promotion for CheckoutPage ──────────────────────────────
  // Lưu vào sessionStorage để CheckoutPage đọc và truyền promotionId vào order
  useEffect(() => {
    if (appliedPromotion) {
      sessionStorage.setItem('appliedPromotion', JSON.stringify(appliedPromotion));
    } else {
      sessionStorage.removeItem('appliedPromotion');
    }
  }, [appliedPromotion]);

  // ─── Render guards ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-10 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <Button onClick={fetchCart}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg border bg-white p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-6 flex size-32 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="size-16 text-gray-400" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">Giỏ hàng trống</h2>
              <p className="mb-6 text-gray-600">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
              </p>
              <Link to="/products">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  <ArrowLeft className="mr-2 size-4" />
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-red-600">Trang chủ</Link>
            <ChevronRight className="size-4" />
            <span className="text-gray-900">Giỏ hàng</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Giỏ hàng của bạn</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Cart items ─────────────────────────────────────────────────── */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Sản phẩm ({cart.items.length} sản phẩm)</h2>
                <Link to="/products" className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                  <ArrowLeft className="size-4" />
                  Tiếp tục mua sắm
                </Link>
              </div>

              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4 border-b pb-4 last:border-b-0">
                    <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                      <ImageWithFallback
                        src={item.image || ''}
                        alt={item.productName}
                        className="h-32 w-32 rounded-lg border object-cover"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          {item.brandName && (
                            <Badge variant="outline" className="mb-2 border-red-600 text-red-600">
                              {item.brandName}
                            </Badge>
                          )}
                          <Link to={`/product/${item.productId}`}>
                            <h3 className="mb-2 font-medium hover:text-red-600 line-clamp-2">
                              {item.productName}
                            </h3>
                          </Link>
                          <div className="space-y-1 text-sm text-gray-600">
                            {item.cpu     && <p>CPU: {item.cpu}</p>}
                            {item.ram     && <p>RAM: {item.ram}</p>}
                            {item.storage && <p>Ổ cứng: {item.storage}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          disabled={updatingId === item.productId}
                          className="ml-2 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                        >
                          {updatingId === item.productId
                            ? <Loader2 className="size-5 animate-spin" />
                            : <X className="size-5" />}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={item.quantity <= 1 || updatingId === item.productId}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="min-w-[3rem] px-4 text-center font-medium">
                            {updatingId === item.productId
                              ? <Loader2 className="mx-auto size-4 animate-spin" />
                              : item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={updatingId === item.productId}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600">
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}₫
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">
                              {item.unitPrice.toLocaleString('vi-VN')}₫ / sản phẩm
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="rounded-lg border bg-white p-4">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { Icon: Truck,  title: 'Miễn phí vận chuyển', sub: 'Đơn từ 10 triệu' },
                  { Icon: Shield, title: 'Bảo hành chính hãng', sub: 'Toàn quốc' },
                  { Icon: Tag,    title: 'Giá tốt nhất',         sub: 'Cam kết chính hãng' },
                ].map(({ Icon, title, sub }) => (
                  <div key={title} className="flex items-center gap-3">
                    <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
                      <Icon className="size-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Order summary ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">Tóm tắt đơn hàng</h2>

              {/* Coupon input */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Mã giảm giá</label>

                {appliedPromotion ? (
                  /* Hiển thị mã đã áp dụng thành công */
                  <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Tag className="size-4" />
                      <span className="font-medium">{appliedPromotion.code}</span>
                      <span className="text-green-600">— {appliedPromotion.name}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="ml-2 text-gray-400 hover:text-red-500"
                      title="Xoá mã"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  /* Form nhập mã */
                  <>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Nhập mã giảm giá"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        disabled={couponLoading}
                        className="uppercase placeholder:normal-case"
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="whitespace-nowrap"
                      >
                        {couponLoading
                          ? <Loader2 className="size-4 animate-spin" />
                          : 'Áp dụng'}
                      </Button>
                    </div>

                    {couponError && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                        <X className="size-4 flex-shrink-0" />
                        {couponError}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Giảm giá
                      {appliedPromotion?.discountType === 'percent'
                        ? ` (${appliedPromotion.discountValue}%)`
                        : ''}
                    </span>
                    <span className="font-medium text-green-600">
                      -{discountAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )}

                {appliedPromotion?.discountType === 'free_ship' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium text-green-600">Miễn phí</span>
                  </div>
                )}

                {appliedPromotion?.discountType !== 'free_ship' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium">
                      {shippingFee === 0
                        ? <span className="text-green-600">Miễn phí</span>
                        : `${shippingFee.toLocaleString('vi-VN')}₫`}
                    </span>
                  </div>
                )}

                {shippingFee > 0 && !appliedPromotion && (
                  <p className="text-xs text-gray-500">
                    Mua thêm {(FREE_SHIP_THRESHOLD - subtotal).toLocaleString('vi-VN')}₫ để được miễn phí vận chuyển
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-b py-4">
                <span className="text-lg font-bold">Tổng cộng</span>
                <span className="text-2xl font-bold text-red-600">
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <Link to="/checkout">
                <Button size="lg" className="mt-6 w-full bg-red-600 hover:bg-red-700">
                  Tiến hành thanh toán
                </Button>
              </Link>

              <p className="mt-4 text-center text-xs text-gray-500">(Giá đã bao gồm VAT)</p>

              <div className="mt-6 border-t pt-6">
                <p className="mb-3 text-sm text-gray-600">Phương thức thanh toán:</p>
                <div className="flex flex-wrap gap-2">
                  {['COD', 'Chuyển khoản', 'Thẻ tín dụng', 'Ví điện tử'].map((m) => (
                    <Badge key={m} variant="outline">{m}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}