// ─── Product trong đơn hàng ───────────────────────────────────────────────────
export type OrderProduct = {
  name:  string;
  sku:   string;
  qty:   number;
  price: number;
};

// ─── Lịch sử trạng thái ───────────────────────────────────────────────────────
export type OrderHistoryItem = {
  label: string;
  time:  string;   // string "2026-04-05 10:30" hoặc ""
  done:  boolean;
};

// ─── Các trạng thái FE ────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'done'
  | 'cancelled'
  | 'refunded';

// ─── Order entity chính ───────────────────────────────────────────────────────
export type Order = {
  id:        string;       // orderCode — dùng hiển thị
  _id?:      number;       // orderId numeric — dùng gọi API
  customer:  string;
  branch:    string;       // storeName từ API
  total:     number;
  products:  OrderProduct[];
  payment:   string;
  payStatus: string;
  status:    OrderStatus | string;
  date:      string;       // string "2026-04-05 10:30"
  phone?:    string;
  email?:    string;
  address?:  string;
  history?:  OrderHistoryItem[];
};

// ─── Stats từ /api/admin/orders/stats ────────────────────────────────────────
export type OrdersStats = {
  total:       number;
  pending:     number;
  confirmed:   number;
  processing:  number;
  shipping:    number;
  done:        number;
  cancelled:   number;
  refunded:    number;
  totalRevenue: number;
};

// ─── Page wrapper từ Spring Page<T> ──────────────────────────────────────────
export type PageResponse<T> = {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;   // current page (0-based)
  size:          number;
};