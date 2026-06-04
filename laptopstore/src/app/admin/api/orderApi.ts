import axios from 'axios';

/**
 * Local axios instance (same style as your customers API file).
 * If you already have a shared instance exported elsewhere, you can replace this
 * with `import api from './path/to/sharedApi'` to reuse it.
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) config.headers = config.headers ?? {}, (config.headers.Authorization = `Bearer ${token}`);
  } catch {
    // ignore
  }
  return config;
});

// -------------------- Types --------------------

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

/** Order list row returned to FE */
export interface OrderListDto {
  orderId: number;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  storeName?: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod?: string;
  payStatus?: string;
  status?: string;     // frontend status string like "pending","done"...
  orderedAt?: string;  // "YYYY-MM-DD HH:mm" or ISO string
}

/** Order item */
export interface OrderItemDto {
  itemId: number;
  productId: number;
  sku?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** Order detail returned to FE */
export interface OrderDetailDto {
  orderId: number;
  orderCode: string;
  userId?: number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: {
    recipientName?: string;
    phone?: string;
    addressLine?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  branchName?: string;
  paymentMethod?: string;
  payStatus?: string;
  status?: string;
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  totalAmount?: number;
  note?: string;
  orderedAt?: string; // formatted string "YYYY-MM-DD HH:mm"
  items?: OrderItemDto[];
  history?: { label?: string; time?: string; staff?: string; note?: string; done?: boolean }[];
}

/** Refund DTO returned when creating a refund */
export interface RefundDto {
  returnId: number;
  orderId: number;
  refundAmount: number;
  status: string;
  reason?: string;
  requestedAt?: string;
}

/** Stats flattened as you requested earlier */
export interface OrdersStatsDto {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipping: number;
  done: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
}

export interface StoreOptionDto {
  id: number;
  name: string;
}

// -------------------- API functions --------------------

const BASE = '/admin/orders';

/**
 * GET /api/admin/orders
 * params: { q, status, storeId, page (0-based), size, fromDate, toDate }
 */
export async function fetchOrders(params?: {
  q?: string;
  status?: string;
  storeId?: number;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<PageDto<OrderListDto>> {
  const { data } = await api.get<PageDto<OrderListDto>>(BASE, {
    params,
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

/**
 * GET /api/admin/orders/{orderRef}
 * orderRef may be numeric id or orderCode string
 */
export async function fetchOrderDetail(orderRef: string): Promise<OrderDetailDto> {
  const { data } = await api.get<OrderDetailDto>(`${BASE}/${encodeURIComponent(orderRef)}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

/**
 * GET /api/admin/orders/{orderRef}/items
 */
export async function fetchOrderItems(orderRef: string, page = 0, size = 50): Promise<PageDto<OrderItemDto>> {
  const { data } = await api.get<PageDto<OrderItemDto>>(`${BASE}/${encodeURIComponent(orderRef)}/items`, {
    params: { page, size },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

/**
 * PATCH /api/admin/orders/{orderRef}/status
 * body: { status: "confirmed", staffNote?: "..." }
 */
export async function updateOrderStatus(
  orderRef: string,
  status: string,
  staffNote?: string,
  storeId?: number
): Promise<void> {
  await api.patch(`${BASE}/${encodeURIComponent(orderRef)}/status`, {
    status,
    staffNote,
    storeId,
  }, {
    headers: { 'Cache-Control': 'no-cache' },
  });
}

export async function fetchStoresForOrder(): Promise<StoreOptionDto[]> {
  const { data } = await api.get<StoreOptionDto[]>(`${BASE}/stores`);
  return data;
}

/**
 * POST /api/admin/orders/{orderRef}/refund
 * body: { amount: number, reason: string }
 */
export async function createRefund(orderRef: string, amount: number, reason: string): Promise<RefundDto> {
  const { data } = await api.post<RefundDto>(`${BASE}/${encodeURIComponent(orderRef)}/refund`, {
    amount,
    reason,
  });
  return data;
}

/**
 * POST /api/admin/orders/{orderRef}/ship
 * body: { carrier: string, trackingNumber?: string, shippedAt?: string (ISO) }
 */
export async function shipOrder(orderRef: string, payload: { carrier: string; trackingNumber?: string; shippedAt?: string }): Promise<void> {
  await api.post(`${BASE}/${encodeURIComponent(orderRef)}/ship`, payload);
}

/**
 * GET /api/admin/orders/export
 * returns xlsx blob and triggers download
 */
export async function exportOrders(params?: {
  exportType?: string; // LIST | DETAIL | REFUNDS
  q?: string;
  status?: string;
  storeId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<void> {
  const response = await api.get(`${BASE}/export`, {
    params: { exportType: params?.exportType ?? 'LIST', ...params },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : 'orders.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * GET /api/admin/orders/stats
 * params: { fromDate?, toDate?, storeId? }
 */
export async function fetchOrdersStats(params?: { fromDate?: string; toDate?: string; storeId?: number }): Promise<OrdersStatsDto> {
  const { data } = await api.get<OrdersStatsDto>(`${BASE}/stats`, {
    params,
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

export interface AdminCreateOrderLine {
  productId: number;
  quantity: number;
}

export interface WalkInCustomer {
  name: string;
  phone: string;
  email?: string;
}

/**
 * Body gửi lên POST /api/admin/orders
 *
 * Hai trường hợp:
 *   - Khách có tài khoản : { userId, storeId, paymentMethod, items }
 *   - Khách vãng lai     : { walkInCustomer, storeId, paymentMethod, items }
 */
export interface AdminCreateOrderRequest {
  userId?: number;                     // khách có tài khoản
  walkInCustomer?: WalkInCustomer;     // khách vãng lai
  storeId: number;
  paymentMethod: string;               // COD | CASH | BANK_TRANSFER | MOMO | VNPAY ...
  items: AdminCreateOrderLine[];
  note?: string;
  promotionId?: number;
}

export interface AdminCreateOrderResult {
  orderId: number;
  orderCode: string;
  customerType: 'registered' | 'walk_in';
  customerName: string;
  customerPhone: string;
  storeName: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  note?: string;
  orderedAt: string;
}

// -------------------- Product search (dùng trong modal) --------------------

export interface ProductSearchItem {
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  salePrice?: number;
  stockQuantity?: number;
}

/**
 * GET /api/admin/products?q=...&page=0&size=10
 * Tái dùng endpoint products hiện có — chỉ lấy các trường cần thiết.
 * Nếu bạn có endpoint riêng, đổi BASE_PRODUCTS cho phù hợp.
 */
export async function searchProducts(q: string, storeId?: number): Promise<ProductSearchItem[]> {
  const { data } = await api.get('/admin/products', {
    params: { q: q || undefined, storeId, page: 0, size: 20, isActive: true },
  });
  // hỗ trợ cả { content: [...] } lẫn mảng trực tiếp
  const raw: any[] = Array.isArray(data) ? data : (data?.content ?? []);
  return raw.map((p: any) => ({
    productId:     p.productId ?? p.id ?? p.product_id,
    name:          p.name ?? p.productName ?? '',
    sku:           p.sku ?? '',
    basePrice:     Number(p.basePrice ?? p.base_price ?? 0),
    salePrice:     p.salePrice != null ? Number(p.salePrice) : undefined,
    stockQuantity: p.stockQuantity ?? p.quantity ?? undefined,
  }));
}

/**
 * GET /api/admin/stores — lấy danh sách chi nhánh đang hoạt động.
 * Dùng để populate dropdown "Chi nhánh" trong modal.
 */
export interface StoreOption {
  storeId: number;
  name: string;
}

export async function fetchActiveStores(): Promise<StoreOption[]> {
  const { data } = await api.get('/admin/stores', {
    params: { isActive: true, size: 100 },
  });
  const raw: any[] = Array.isArray(data) ? data : (data?.content ?? []);
  return raw.map((s: any) => ({
    storeId: s.storeId ?? s.id ?? s.store_id,
    name:    s.name ?? '',
  }));
}

// -------------------- API call --------------------

/**
 * POST /api/admin/orders
 * Admin/Staff tạo đơn hàng tại quầy.
 */
export async function createOrderByStaff(
  request: AdminCreateOrderRequest
): Promise<AdminCreateOrderResult> {
  const { data } = await api.post<AdminCreateOrderResult>(BASE, request);
  return data;
}

/**
 * Kết quả tìm kiếm user (trả về từ GET /api/admin/users/search)
 */
export interface UserSearchResult {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}
 
/**
 * GET /api/admin/users/search?q=...
 *
 * Tìm user theo số điện thoại hoặc email.
 * Trả về tối đa 10 kết quả.
 * q phải >= 3 ký tự, server trả [] nếu ngắn hơn.
 */
export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  if (!q || q.trim().length < 3) return [];
  const { data } = await api.get<UserSearchResult[]>('/admin/users/search', {
    params: { q: q.trim() },
  });
  return Array.isArray(data) ? data : [];
}

// Export axios instance in case other modules want to reuse it
export { api as ordersApiInstance };

