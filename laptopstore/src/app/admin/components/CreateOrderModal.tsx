/**
 * CreateOrderModal.tsx
 *
 * Modal tạo đơn hàng tại quầy cho admin/staff.
 *
 * Thay đổi so với phiên bản cũ:
 *   - Tìm khách hàng bằng SĐT, email hoặc tên (debounced search, dropdown kết quả)
 *   - Nếu tìm thấy nhiều user → hiển thị danh sách để staff chọn
 *   - Sau khi chọn user → hiển thị card thông tin (giống phần tìm sản phẩm)
 *   - Vẫn hỗ trợ "Khách vãng lai" nếu không tìm thấy
 */

import {
  useState, useEffect, useRef, useCallback,
  type ChangeEvent, type KeyboardEvent,
} from 'react';
import {
  X, Search, User, Phone, Mail, ShoppingCart,
  Package, Plus, Minus, Trash2, ChevronDown,
  AlertCircle, CheckCircle2, Loader2, UserX,
} from 'lucide-react';
import {
  searchProducts,
  searchUsers,
  fetchActiveStores,
  createOrderByStaff,
  type ProductSearchItem,
  type UserSearchResult,
  type StoreOption,
  type AdminCreateOrderRequest,
  type AdminCreateOrderResult,
} from '../api/orderApi';

// ── helpers ───────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAYMENT_METHODS = [
  { value: 'COD',           label: 'Tiền mặt (COD)' },
  { value: 'CASH',          label: 'Tiền mặt tại quầy' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO',          label: 'MoMo' },
  { value: 'VNPAY',         label: 'VNPay' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface CartLine {
  product:   ProductSearchItem;
  quantity:  number;
}

interface WalkInForm {
  name:  string;
  phone: string;
  email: string;
}

interface Props {
  onClose:   () => void;
  onSuccess: (result: AdminCreateOrderResult) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateOrderModal({ onClose, onSuccess }: Props) {

  // ── Customer search ──────────────────────────────────────────────────────
  const [customerQuery, setCustomerQuery]     = useState('');
  const [customerResults, setCustomerResults] = useState<UserSearchResult[]>([]);
  const [searchingUser, setSearchingUser]     = useState(false);
  const [selectedUser, setSelectedUser]       = useState<UserSearchResult | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isWalkIn, setIsWalkIn]               = useState(false);
  const [walkIn, setWalkIn]                   = useState<WalkInForm>({ name: '', phone: '', email: '' });

  const debouncedCustomerQuery = useDebounce(customerQuery, 350);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef  = useRef<HTMLDivElement>(null);

  // ── Product search ───────────────────────────────────────────────────────
  const [productQuery, setProductQuery]       = useState('');
  const [productResults, setProductResults]   = useState<ProductSearchItem[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productInputRef    = useRef<HTMLInputElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const debouncedProductQuery = useDebounce(productQuery, 300);

  // ── Cart ─────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartLine[]>([]);

  // ── Order meta ───────────────────────────────────────────────────────────
  const [stores, setStores]           = useState<StoreOption[]>([]);
  const [storeId, setStoreId]         = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote]               = useState('');

  // ── Submit ───────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Load stores on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchActiveStores()
      .then((list) => {
        setStores(list);
        if (list.length === 1) setStoreId(list[0].storeId);
      })
      .catch(() => {});
  }, []);

  // ── Search users ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedCustomerQuery || debouncedCustomerQuery.trim().length < 2) {
      setCustomerResults([]);
      setShowUserDropdown(false);
      return;
    }
    if (selectedUser || isWalkIn) return;

    setSearchingUser(true);
    searchUsers(debouncedCustomerQuery)
      .then((res) => {
        setCustomerResults(res);
        setShowUserDropdown(res.length > 0);
      })
      .catch(() => setCustomerResults([]))
      .finally(() => setSearchingUser(false));
  }, [debouncedCustomerQuery, selectedUser, isWalkIn]);

  // ── Search products ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedProductQuery || debouncedProductQuery.trim().length < 2) {
      setProductResults([]);
      setShowProductDropdown(false);
      return;
    }
    setSearchingProduct(true);
    searchProducts(debouncedProductQuery, storeId || undefined)
      .then((res) => {
        setProductResults(res);
        setShowProductDropdown(true);
      })
      .catch(() => setProductResults([]))
      .finally(() => setSearchingProduct(false));
  }, [debouncedProductQuery, storeId]);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const selectUser = (u: UserSearchResult) => {
    setSelectedUser(u);
    setCustomerQuery('');
    setCustomerResults([]);
    setShowUserDropdown(false);
    setIsWalkIn(false);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setIsWalkIn(false);
    setCustomerQuery('');
    setTimeout(() => customerInputRef.current?.focus(), 50);
  };

  const switchToWalkIn = () => {
    setSelectedUser(null);
    setIsWalkIn(true);
    setCustomerQuery('');
    setCustomerResults([]);
    setShowUserDropdown(false);
  };

  const addToCart = (product: ProductSearchItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product.productId === product.productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductQuery('');
    setProductResults([]);
    setShowProductDropdown(false);
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.productId === productId
            ? { ...l, quantity: Math.max(1, l.quantity + delta) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) =>
    setCart((prev) => prev.filter((l) => l.product.productId !== productId));

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce(
    (sum, l) => sum + (l.product.salePrice ?? l.product.basePrice) * l.quantity,
    0
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const isValid =
    (selectedUser || (isWalkIn && walkIn.name.trim() && walkIn.phone.trim())) &&
    cart.length > 0 &&
    storeId !== '';

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const body: AdminCreateOrderRequest = {
        storeId: storeId as number,
        paymentMethod,
        items: cart.map((l) => ({ productId: l.product.productId, quantity: l.quantity })),
        note: note.trim() || undefined,
        ...(selectedUser
          ? { userId: selectedUser.userId }
          : {
              walkInCustomer: {
                name:  walkIn.name.trim(),
                phone: walkIn.phone.trim(),
                email: walkIn.email.trim() || undefined,
              },
            }),
      };
      const result = await createOrderByStaff(body);
      onSuccess(result);
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.message ?? e?.message ?? 'Tạo đơn thất bại, vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Tạo đơn hàng tại quầy</h2>
            <p className="text-xs text-gray-400 mt-0.5">Điền thông tin khách hàng và chọn sản phẩm</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── SECTION 1: Khách hàng ── */}
          <section>
            <SectionLabel icon={<User className="w-3.5 h-3.5" />} text="Khách hàng" />

            {/* Đã chọn user có tài khoản */}
            {selectedUser && (
              <UserCard user={selectedUser} onClear={clearUser} />
            )}

            {/* Khách vãng lai form */}
            {isWalkIn && (
              <WalkInFields walkIn={walkIn} onChange={setWalkIn} onClear={clearUser} />
            )}

            {/* Search input — ẩn khi đã có lựa chọn */}
            {!selectedUser && !isWalkIn && (
              <div className="relative" ref={userDropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  {searchingUser && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerQuery(e.target.value)}
                    onFocus={() => customerQuery && customerResults.length > 0 && setShowUserDropdown(true)}
                    placeholder="Tìm khách hàng (tên, SĐT hoặc email)..."
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Dropdown kết quả */}
                {showUserDropdown && customerResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                      {customerResults.length} kết quả — chọn khách hàng
                    </div>
                    {customerResults.map((u) => (
                      <button
                        key={u.userId}
                        onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <UserAvatar name={u.fullName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900">{u.fullName}</div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {u.phone && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />{u.phone}
                              </span>
                            )}
                            {u.email && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                                <Mail className="w-3 h-3" />{u.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Trường hợp không tìm thấy hoặc ít ký tự */}
                {customerQuery.length > 0 && customerQuery.length < 2 && (
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                )}

                {customerQuery.length >= 2 && customerResults.length === 0 && !searchingUser && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 flex items-center gap-2 mb-2">
                      <UserX className="w-4 h-4" />
                      Không tìm thấy khách hàng nào
                    </p>
                    <button
                      onClick={switchToWalkIn}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Nhập khách vãng lai (không có tài khoản)
                    </button>
                  </div>
                )}

                {customerQuery.length === 0 && (
                  <button
                    onClick={switchToWalkIn}
                    className="mt-2 text-xs text-blue-600 hover:underline font-medium"
                  >
                    + Nhập khách vãng lai (không có tài khoản)
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── SECTION 2: Chi nhánh & Thanh toán ── */}
          <section>
            <SectionLabel icon={<ShoppingCart className="w-3.5 h-3.5" />} text="Thông tin đơn hàng" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Chi nhánh *</label>
                <div className="relative">
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    <option value="">Chọn chi nhánh</option>
                    {stores.map((s) => (
                      <option key={s.storeId} value={s.storeId}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Thanh toán *</label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 3: Sản phẩm ── */}
          <section>
            <SectionLabel icon={<Package className="w-3.5 h-3.5" />} text="Sản phẩm" />

            {/* Product search */}
            <div className="relative mb-3" ref={productDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                {searchingProduct && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
                <input
                  ref={productInputRef}
                  type="text"
                  value={productQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProductQuery(e.target.value)}
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {showProductDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto">
                  {productResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                  ) : (
                    productResults.map((p) => (
                      <button
                        key={p.productId}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.sku}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-blue-600">
                            {(p.salePrice ?? p.basePrice).toLocaleString('vi-VN')}đ
                          </div>
                          {p.stockQuantity != null && (
                            <div className="text-[10px] text-gray-400">Tồn: {p.stockQuantity}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cart table */}
            {cart.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-sm text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Chưa có sản phẩm nào — tìm và thêm ở trên
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">Sản phẩm</th>
                      <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase w-28">Số lượng</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase">Thành tiền</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((line) => {
                      const price = line.product.salePrice ?? line.product.basePrice;
                      return (
                        <tr key={line.product.productId} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-gray-900 text-sm leading-tight">{line.product.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {price.toLocaleString('vi-VN')}đ / cái
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => updateQty(line.product.productId, -1)}
                                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{line.quantity}</span>
                              <button
                                onClick={() => updateQty(line.product.productId, +1)}
                                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-blue-600">
                            {(price * line.quantity).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="pr-2">
                            <button
                              onClick={() => removeFromCart(line.product.productId)}
                              className="w-6 h-6 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 4: Ghi chú ── */}
          <section>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Ghi chú đơn hàng</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú thêm cho đơn hàng..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {/* Tổng tiền */}
          {cart.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">Tổng cộng ({cart.reduce((s, l) => s + l.quantity, 0)} sản phẩm)</span>
              <span className="text-xl font-extrabold text-blue-600">{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Tạo đơn hàng</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <span className="text-blue-500">{icon}</span>
      <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">{text}</span>
    </div>
  );
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const letters = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const cls = size === 'sm'
    ? 'w-9 h-9 text-sm'
    : 'w-11 h-11 text-base';
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {letters || <User className="w-4 h-4" />}
    </div>
  );
}

/** Card hiển thị user đã chọn */
function UserCard({ user, onClear }: { user: UserSearchResult; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-0">
      <UserAvatar name={user.fullName} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 text-sm truncate">{user.fullName}</div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {user.phone && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Phone className="w-3 h-3 text-blue-400" />{user.phone}
            </span>
          )}
          {user.email && (
            <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
              <Mail className="w-3 h-3 text-blue-400" />{user.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Đã chọn</span>
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
          title="Xoá lựa chọn"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Form nhập thông tin khách vãng lai */
function WalkInFields({
  walkIn,
  onChange,
  onClear,
}: {
  walkIn: WalkInForm;
  onChange: (v: WalkInForm) => void;
  onClear: () => void;
}) {
  return (
    <div className="border border-dashed border-orange-300 bg-orange-50 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-orange-700 flex items-center gap-1">
          <UserX className="w-3.5 h-3.5" /> Khách vãng lai
        </span>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" /> Huỷ
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1">Tên khách *</label>
          <input
            type="text"
            value={walkIn.name}
            onChange={(e) => onChange({ ...walkIn, name: e.target.value })}
            placeholder="Nguyễn Văn A"
            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-600 mb-1">Số điện thoại *</label>
          <input
            type="tel"
            value={walkIn.phone}
            onChange={(e) => onChange({ ...walkIn, phone: e.target.value })}
            placeholder="0912345678"
            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-600 mb-1">Email (tuỳ chọn)</label>
        <input
          type="email"
          value={walkIn.email}
          onChange={(e) => onChange({ ...walkIn, email: e.target.value })}
          placeholder="email@example.com"
          className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </div>
  );
}
