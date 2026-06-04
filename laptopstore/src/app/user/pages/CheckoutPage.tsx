import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  PlusCircle,
  Tag,
  Truck,
  User,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { PaymentMethodSelector, type UiPaymentMethodId } from '../components/checkout/PaymentMethodSelector';
import { CardPayment } from '../components/checkout/CardPayment';
import { BankTransferPayment } from '../components/checkout/BankTransferPayment';
import api, { ENDPOINTS } from '../config/apiConfig';
import { notifyCartUpdated } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_SHIP_THRESHOLD = 10_000_000;
const DEFAULT_SHIPPING_FEE = 200_000;

function calcShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIP_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'cod' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay' | 'credit_card';
type AddressSelection = number | 'new' | null;

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

interface AddressResponse {
  id: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string | null;
  district: string;
  city: string;
  isDefault: boolean;
}

interface AddressRequest {
  recipientName: string;
  phone: string;
  addressLine: string;
  ward?: string;
  district: string;
  city: string;
  isDefault: boolean;
}

/**
 * Dữ liệu mã giảm giá đã áp dụng từ CartPage (lưu trong sessionStorage).
 * Cấu trúc khớp với ValidatePromotionResponse của BE.
 */
interface AppliedPromotion {
  promotionId: number;
  code: string;
  name: string;
  discountType: 'percent' | 'fixed' | 'free_ship';
  discountValue: number;
  discountAmount: number;
  shippingFeeAfterDiscount: number;
  total: number;
}

interface CreateOrderRequest {
  addressId: number;
  note?: string;
  paymentMethod: string;
  /** null = không áp mã giảm giá */
  promotionId?: number | null;
}

interface OrderItemBrief {
  productName: string;
  quantity: number;
}

interface OrderResponse {
  id: number;
  orderCode: string;
  totalAmount: number;
  status: string;
  orderedAt?: string;
  items?: OrderItemBrief[];
}

interface PaymentResponse {
  id: number;
  status: string;
  paymentUrl?: string;
  amount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

async function apiFetch<T>(
  path: string,
  options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown },
): Promise<T> {
  try {
    const response = await api.request<T>({
      url: path,
      method: options?.method ?? 'GET',
      data: options?.body,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Không thể kết nối máy chủ.',
    );
  }
}

function toApiPaymentMethod(method: PaymentMethod): string {
  return method.toUpperCase();
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString('vi-VN')}₫`;
}

function toAddressForm(address: AddressResponse) {
  return {
    fullName: address.recipientName,
    phone: address.phone,
    email: '',
    city: address.city,
    district: address.district,
    ward: address.ward ?? '',
    address: address.addressLine,
    note: '',
  };
}

/** Đọc mã giảm giá đã áp dụng từ CartPage (nếu có). */
function readAppliedPromotion(): AppliedPromotion | null {
  try {
    const raw = sessionStorage.getItem('appliedPromotion');
    return raw ? (JSON.parse(raw) as AppliedPromotion) : null;
  } catch {
    return null;
  }
}

function uiPaymentToMethod(ui: UiPaymentMethodId): PaymentMethod {
  switch (ui) {
    case 'card':
      return 'credit_card';
    case 'bank-transfer':
      return 'bank_transfer';
    case 'cod':
      return 'cod';
    case 'ewallet':
      return 'momo';
    default: {
      const _x: never = ui;
      return _x;
    }
  }
}

function methodToUiPayment(m: PaymentMethod): UiPaymentMethodId | null {
  if (m === 'credit_card') return 'card';
  if (m === 'bank_transfer') return 'bank-transfer';
  if (m === 'cod') return 'cod';
  return null;
}

function cartProductSummary(items: CartItemResponse[]): string {
  if (!items.length) return '—';
  if (items.length === 1) return items[0].productName;
  return `${items[0].productName} và ${items.length - 1} sản phẩm khác`;
}

function orderProductSummary(order: OrderResponse): string {
  const items = order.items;
  if (!items?.length) return 'Đơn hàng của bạn';
  if (items.length === 1) return items[0].productName;
  return `${items[0].productName} và ${items.length - 1} món khác`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState('');

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<AddressSelection>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [saveInfo, setSaveInfo] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '',
    city: '', district: '', ward: '', address: '', note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  type PayStep = 'address' | 'bank' | 'card';
  const [payStep, setPayStep] = useState<PayStep>('address');
  const [postOrder, setPostOrder] = useState<OrderResponse | null>(null);

  // Đọc mã giảm giá đã áp từ CartPage
  const appliedPromotion = readAppliedPromotion();

  const onlinePaymentMethods: PaymentMethod[] = ['momo', 'vnpay', 'zalopay', 'credit_card'];
  const onlinePaymentLabel: Record<PaymentMethod, string> = {
    cod: 'COD', bank_transfer: 'chuyển khoản',
    momo: 'MoMo', vnpay: 'VNPay', zalopay: 'ZaloPay', credit_card: 'cổng thẻ',
  };

  const isUsingNewAddress = selectedAddressId === 'new' || addresses.length === 0;

  const redirectToGateway = async (orderId: number, method: PaymentMethod) => {
    const payment = await apiFetch<PaymentResponse>(ENDPOINTS.PAYMENT.BASE, {
      method: 'POST',
      body: { orderId, method: toApiPaymentMethod(method) },
    });
    if (payment.paymentUrl) {
      window.location.href = payment.paymentUrl;
      return;
    }
    navigate(`/order-success?orderId=${orderId}`);
  };

  // Tính phí ship & tổng nhất quán với CartPage
  const shippingFee = appliedPromotion
    ? appliedPromotion.shippingFeeAfterDiscount
    : calcShippingFee(cartSubtotal);

  const discountAmount = appliedPromotion?.discountAmount ?? 0;

  const total = appliedPromotion
    ? appliedPromotion.total
    : cartSubtotal + shippingFee;

  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }

    const loadCheckoutData = async () => {
      try {
        const [cart, userAddresses] = await Promise.all([
          apiFetch<CartResponse>(ENDPOINTS.CART.BASE),
          apiFetch<AddressResponse[]>(ENDPOINTS.USER.ADDRESSES),
        ]);

        setCartItems(cart.items);
        setCartSubtotal(cart.totalPrice);
        setAddresses(userAddresses);

        if (userAddresses.length > 0) {
          const defaultAddress = userAddresses.find((a) => a.isDefault) ?? userAddresses[0];
          setSelectedAddressId(defaultAddress.id);
          setFormData((prev) => ({
            ...prev,
            ...toAddressForm(defaultAddress),
            note: prev.note,
            email: prev.email,
          }));
        } else {
          setSelectedAddressId('new');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu checkout.';
        if (message.includes('401')) { navigate('/login'); return; }
        setCartError(message);
        setAddressError(message);
      } finally {
        setLoadingCart(false);
        setLoadingAddresses(false);
      }
    };

    loadCheckoutData();
  }, [navigate]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelection = (value: string) => {
    if (value === 'new') {
      setSelectedAddressId('new');
      setFormData((prev) => ({ ...prev, fullName: '', phone: '', city: '', district: '', ward: '', address: '' }));
      return;
    }
    const addressId = Number(value);
    const selected = addresses.find((a) => a.id === addressId);
    if (!selected) return;
    setSelectedAddressId(addressId);
    setFormData((prev) => ({ ...prev, ...toAddressForm(selected), note: prev.note, email: prev.email }));
  };

  const createAddressIfNeeded = async (): Promise<number> => {
    if (!isUsingNewAddress && typeof selectedAddressId === 'number') {
      return selectedAddressId;
    }
    if (!formData.fullName || !formData.phone || !formData.city || !formData.district || !formData.address) {
      throw new Error('Vui lòng nhập đầy đủ thông tin giao hàng.');
    }
    const payload: AddressRequest = {
      recipientName: formData.fullName,
      phone: formData.phone,
      city: formData.city,
      district: formData.district,
      addressLine: formData.address,
      isDefault: saveInfo,
      ...(formData.ward ? { ward: formData.ward } : {}),
    };
    const newAddress = await apiFetch<AddressResponse>(ENDPOINTS.USER.ADDRESSES, { method: 'POST', body: payload });
    setAddresses((prev) => [newAddress, ...prev]);
    setSelectedAddressId(newAddress.id);
    return newAddress.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms || cartItems.length === 0) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const addressId = await createAddressIfNeeded();

      const orderPayload: CreateOrderRequest = {
        addressId,
        paymentMethod: toApiPaymentMethod(paymentMethod),
        ...(formData.note ? { note: formData.note } : {}),
        // Truyền promotionId nếu user đã áp mã ở CartPage
        ...(appliedPromotion ? { promotionId: appliedPromotion.promotionId } : {}),
      };

      const order = await apiFetch<OrderResponse>(ENDPOINTS.ORDERS.BASE, {
        method: 'POST',
        body: orderPayload,
      });

      // Xoá promotion khỏi session sau khi đặt hàng thành công
      sessionStorage.removeItem('appliedPromotion');
      notifyCartUpdated(); 

      if (paymentMethod === 'bank_transfer') {
        setPostOrder(order);
        setPayStep('bank');
        return;
      }

      if (paymentMethod === 'credit_card') {
        setPostOrder(order);
        setPayStep('card');
        return;
      }

      if (onlinePaymentMethods.includes(paymentMethod)) {
        await redirectToGateway(order.id, paymentMethod);
        return;
      }

      navigate(`/order-success?orderId=${order.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đặt hàng thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-red-600">Trang chủ</Link>
            <ChevronRight className="size-4" />
            <Link to="/cart" className="hover:text-red-600">Giỏ hàng</Link>
            <ChevronRight className="size-4" />
            <span className="text-gray-900">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Thanh toán</h1>

        {(cartError || addressError) && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="size-5 flex-shrink-0" />
            <span>{cartError || addressError}</span>
          </div>
        )}

        {payStep === 'bank' && postOrder ? (
          <BankTransferPayment
            order={{
              orderId: postOrder.id,
              orderCode: postOrder.orderCode,
              amount: Number(postOrder.totalAmount),
              description: orderProductSummary(postOrder),
              orderedAt: postOrder.orderedAt,
            }}
            onBack={() => navigate(`/order-success?orderId=${postOrder.id}`)}
            onDone={() => navigate(`/order-success?orderId=${postOrder.id}`)}
          />
        ) : payStep === 'card' && postOrder ? (
          <CardPayment
            order={{
              orderId: postOrder.id,
              orderCode: postOrder.orderCode,
              amount: Number(postOrder.totalAmount),
              description: orderProductSummary(postOrder),
            }}
            onBack={() => navigate(`/order-success?orderId=${postOrder.id}`)}
            onPay={() => redirectToGateway(postOrder.id, 'credit_card')}
          />
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* ── Left column ─────────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Địa chỉ giao hàng */}
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
                    <MapPin className="size-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold">Địa chỉ giao hàng</h2>
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="size-4 animate-spin" /> Đang tải danh sách địa chỉ...
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="mb-6 space-y-4">
                    <RadioGroup
                      value={selectedAddressId === 'new' ? 'new' : String(selectedAddressId)}
                      onValueChange={handleAddressSelection}
                    >
                      {addresses.map((address) => (
                        <div key={address.id} className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:border-red-300">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={String(address.id)} id={`address-${address.id}`} />
                            <Label htmlFor={`address-${address.id}`} className="cursor-pointer space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{address.recipientName}</span>
                                {address.isDefault && (
                                  <Badge variant="outline" className="border-green-600 text-green-600">Mặc định</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600">
                                {[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ')}
                              </p>
                            </Label>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
                        <RadioGroupItem value="new" id="address-new" />
                        <Label htmlFor="address-new" className="flex cursor-pointer items-center gap-2 font-medium">
                          <PlusCircle className="size-4 text-red-600" /> Sử dụng địa chỉ mới
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
                    Bạn chưa có địa chỉ lưu. Hãy nhập địa chỉ mới để tiếp tục đặt hàng.
                  </div>
                )}

                <div className="mb-6 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
                    <User className="size-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold">
                    {isUsingNewAddress ? 'Thông tin người nhận' : 'Thông tin địa chỉ đã chọn'}
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input id="fullName" name="fullName" placeholder="Nguyễn Văn A"
                      value={formData.fullName} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} required={isUsingNewAddress} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="0912345678"
                      value={formData.phone} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} required={isUsingNewAddress} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="example@email.com"
                      value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="city">Tỉnh/Thành phố</Label>
                    <Input id="city" name="city" placeholder="Hồ Chí Minh"
                      value={formData.city} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} required={isUsingNewAddress} />
                  </div>
                  <div>
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Input id="district" name="district" placeholder="Quận 1"
                      value={formData.district} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} required={isUsingNewAddress} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input id="ward" name="ward" placeholder="Bến Nghé"
                      value={formData.ward} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Địa chỉ chi tiết</Label>
                    <Input id="address" name="address" placeholder="Số nhà, tên đường..."
                      value={formData.address} onChange={handleInputChange}
                      disabled={!isUsingNewAddress} required={isUsingNewAddress} />
                  </div>
                </div>

                {isUsingNewAddress && (
                  <div className="mt-4 flex items-center gap-2">
                    <Checkbox id="saveInfo" checked={saveInfo} onCheckedChange={(c) => setSaveInfo(c as boolean)} />
                    <Label htmlFor="saveInfo" className="cursor-pointer">Lưu địa chỉ này cho lần mua sau</Label>
                  </div>
                )}
              </div>

              {/* Vận chuyển */}
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
                    <Truck className="size-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold">Vận chuyển</h2>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">Giao hàng tiêu chuẩn</p>
                      <p className="text-sm text-gray-500">
                        {cartSubtotal >= FREE_SHIP_THRESHOLD
                          ? 'Đơn hàng đủ điều kiện miễn phí vận chuyển.'
                          : `Miễn phí ship cho đơn từ ${(FREE_SHIP_THRESHOLD).toLocaleString('vi-VN')}₫.`}
                      </p>
                    </div>
                    <span className="font-semibold whitespace-nowrap">
                      {shippingFee === 0
                        ? <span className="text-green-600">Miễn phí</span>
                        : formatCurrency(shippingFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
                    <CreditCard className="size-4 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold">Phương thức thanh toán</h2>
                </div>

                <PaymentMethodSelector
                  selectedId={methodToUiPayment(paymentMethod)}
                  onSelectMethod={(id) => setPaymentMethod(uiPaymentToMethod(id))}
                  preview={{
                    orderCode: null,
                    productSummary: cartProductSummary(cartItems),
                    totalAmount: total,
                  }}
                />

                {onlinePaymentMethods.includes(paymentMethod) && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Sau khi đặt hàng, bạn sẽ được chuyển sang trang thanh toán của{' '}
                    <strong>{onlinePaymentLabel[paymentMethod]}</strong>.
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="size-5 text-gray-600" />
                  <h2 className="text-lg font-bold">Ghi chú đơn hàng</h2>
                </div>
                <Textarea id="note" name="note" placeholder="Thêm ghi chú giao hàng nếu cần..."
                  rows={4} value={formData.note} onChange={handleInputChange} />
              </div>
            </div>

            {/* ── Right column: order summary ──────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border bg-white p-6">
                <h2 className="mb-6 text-xl font-bold">Đơn hàng của bạn</h2>

                {/* Cart items */}
                <div className="mb-6 max-h-64 space-y-4 overflow-y-auto border-b pb-6">
                  {loadingCart ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      <span className="text-sm">Đang tải giỏ hàng...</span>
                    </div>
                  ) : cartItems.length === 0 && !cartError ? (
                    <p className="py-4 text-center text-sm text-gray-500">Giỏ hàng trống</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <ImageWithFallback
                            src={item.image || ''}
                            alt={item.productName}
                            className="h-16 w-16 rounded border object-cover"
                          />
                          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 line-clamp-2 text-sm font-medium">{item.productName}</h3>
                          {item.brandName && <p className="mb-1 text-xs text-gray-500">{item.brandName}</p>}
                          <p className="text-sm font-semibold text-red-600">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Price breakdown */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium">{formatCurrency(cartSubtotal)}</span>
                  </div>

                  {/* Hiển thị mã giảm giá từ CartPage nếu có */}
                  {appliedPromotion && (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-1 text-green-700">
                        <Tag className="size-4" />
                        <span className="font-medium">{appliedPromotion.code}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium">
                      {shippingFee === 0
                        ? <span className="text-green-600">Miễn phí</span>
                        : formatCurrency(shippingFee)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-b py-4">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-red-600">{formatCurrency(total)}</span>
                </div>

                {submitError && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="mt-6">
                  <div className="mb-4 flex items-start gap-2">
                    <Checkbox id="terms" checked={agreeTerms}
                      onCheckedChange={(c) => setAgreeTerms(c as boolean)} className="mt-1" />
                    <Label htmlFor="terms" className="cursor-pointer text-sm">
                      Tôi đã đọc và đồng ý với các điều khoản của website
                    </Label>
                  </div>

                  {!agreeTerms && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      <AlertCircle className="size-4 flex-shrink-0" />
                      <span>Vui lòng đồng ý với điều khoản để tiếp tục.</span>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full bg-red-600 hover:bg-red-700"
                    disabled={!agreeTerms || submitting || loadingCart || loadingAddresses}>
                    {submitting ? (
                      <><Loader2 className="mr-2 size-5 animate-spin" /> Đang xử lý...</>
                    ) : (
                      <><CheckCircle className="mr-2 size-5" /> Hoàn tất đơn hàng</>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-xs text-gray-500">
                    Bằng việc đặt hàng, bạn đồng ý với các điều khoản sử dụng của chúng tôi.
                  </p>
                </div>

                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="size-4 text-green-600" />
                    <span>Thanh toán an toàn và bảo mật</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}