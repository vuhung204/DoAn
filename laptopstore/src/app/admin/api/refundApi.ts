import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: tự gắn JWT nếu có ──────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type RefundStatus =
  | 'waiting'   // PENDING
  | 'approved'  // APPROVED
  | 'done'      // REFUNDED
  | 'rejected'  // REJECTED
  | 'received'  // RECEIVED
  | 'cancelled'; // CANCELLED

export interface RefundListDto {
  id: number;
  orderCode: string;
  customerName: string;
  branchName: string;
  amount: number;        // BigDecimal → number, VND tuyệt đối
  status: RefundStatus;
  requestedAt: string;   // ISO datetime string
}

export interface RefundDetailDto {
  id: number;
  orderCode: string;
  customerName: string;
  branchName: string;
  amount: number;
  products: string[];
  reason: string;
  status: RefundStatus;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;   // tên staff
  note: string | null;
  transactionRef: string | null;
  paymentMethod: string | null; // BANK | CASH | MOMO | VNPAY
}

export interface RefundStatsDto {
  totalRequests: number;
  countsByStatus: Record<string, number>; // key = frontend status string
  totalAmountRequested: number;
  totalAmountRefunded: number;
}

export interface RefundPageDto {
  content: RefundListDto[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page, 0-indexed
  size: number;
  first: boolean;
  last: boolean;
}

// ── Params helpers ────────────────────────────────────────────────────────

export interface SearchRefundsParams {
  q?: string;
  status?: RefundStatus | '';
  storeId?: number;
  fromDate?: string;      // ISO datetime e.g. "2026-01-01T00:00:00"
  toDate?: string;
  page?: number;          // 0-indexed
  size?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export interface ProcessRefundBody {
  processedById?: number;
  note?: string;
}

export interface CompleteRefundBody {
  method: string;          // BANK | CASH | MOMO | VNPAY
  transactionRef?: string;
  processedById?: number;
}

export interface CreateRefundBody {
  orderId?: number;
  orderCode?: string;
  amount: number;
  reason: string;
  products?: string[];
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /admin/refunds — danh sách có filter + phân trang */
export async function fetchRefunds(params?: SearchRefundsParams): Promise<RefundPageDto> {
  const { data } = await api.get<RefundPageDto>('/admin/refunds', { params });
  return data;
}

/** GET /admin/refunds/stats */
export async function fetchRefundStats(params?: {
  fromDate?: string;
  toDate?: string;
  storeId?: number;
}): Promise<RefundStatsDto> {
  const { data } = await api.get<RefundStatsDto>('/admin/refunds/stats', { params });
  return data;
}

/** GET /admin/refunds/{id} */
export async function fetchRefundDetail(id: number): Promise<RefundDetailDto> {
  const { data } = await api.get<RefundDetailDto>(`/admin/refunds/${id}`);
  return data;
}

/** POST /admin/refunds */
export async function createRefund(body: CreateRefundBody): Promise<RefundDetailDto> {
  const { data } = await api.post<RefundDetailDto>('/admin/refunds', body);
  return data;
}

/** PATCH /admin/refunds/{id}/approve */
export async function approveRefund(id: number, body?: ProcessRefundBody): Promise<RefundDetailDto> {
  const { data } = await api.patch<RefundDetailDto>(`/admin/refunds/${id}/approve`, body ?? {});
  return data;
}

/** PATCH /admin/refunds/{id}/reject */
export async function rejectRefund(id: number, body?: ProcessRefundBody): Promise<RefundDetailDto> {
  const { data } = await api.patch<RefundDetailDto>(`/admin/refunds/${id}/reject`, body ?? {});
  return data;
}

/** POST /admin/refunds/{id}/complete */
export async function completeRefund(id: number, body: CompleteRefundBody): Promise<RefundDetailDto> {
  const { data } = await api.post<RefundDetailDto>(`/admin/refunds/${id}/complete`, body);
  return data;
}

/** GET /admin/refunds/export — tải file xlsx */
export async function exportRefunds(params?: {
  q?: string;
  status?: string;
  storeId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<void> {
  const response = await api.get('/admin/refunds/export', {
    params,
    responseType: 'blob',
  });

  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;

  const disposition = response.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  link.download     = match ? match[1] : `refunds-${Date.now()}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}