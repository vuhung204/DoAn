import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: tự gắn JWT nếu có ──────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface DashboardStatDto {
  label: string;
  value: string;
  trend: string;
  trendClass: 'up' | 'down' | 'warn' | 'neutral';
  icon: string;
  iconClass: string;
}

export interface RevenuePointDto {
  date: string;       // "2026-04-18"
  label: string;      // "18/04"
  revenue: number;
}

export interface BranchRevenueDto {
  storeId: number;
  storeName: string;
  revenue: number;
}

export interface OrderStatusCountDto {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface LowStockItemDto {
  productId: number;
  sku: string;
  name: string;
  storeId: number;
  storeName: string;
  stock: number;
  minQuantity: number;
  status: 'critical' | 'warning' | 'ok';
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface DashboardSummaryDto {
  stats: DashboardStatDto[];
  revenueSeries: RevenuePointDto[];
  branchRevenues: BranchRevenueDto[];
  orderStatusCounts: OrderStatusCountDto[];
  lowStockPreview: PageDto<LowStockItemDto>;
}

// ── Params helpers ────────────────────────────────────────────────────────

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  storeId?: number;
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /admin/dashboard/summary — page load đầu tiên */
export async function fetchDashboardSummary(params?: DateRangeParams): Promise<DashboardSummaryDto> {
  const { data } = await api.get<DashboardSummaryDto>('/admin/dashboard/summary', { params });
  return data;
}

/** GET /admin/dashboard/stats */
export async function fetchDashboardStats(date?: string, storeId?: number): Promise<DashboardStatDto[]> {
  const { data } = await api.get<DashboardStatDto[]>('/admin/dashboard/stats', {
    params: { date, storeId },
  });
  return data;
}

/** GET /admin/dashboard/revenue */
export async function fetchRevenue(
  startDate: string,
  endDate: string,
  storeId?: number,
  granularity = 'day',
): Promise<RevenuePointDto[]> {
  const { data } = await api.get<RevenuePointDto[]>('/admin/dashboard/revenue', {
    params: { startDate, endDate, storeId, granularity },
  });
  return data;
}

/** GET /admin/dashboard/branches */
export async function fetchBranchRevenues(
  params?: DateRangeParams & { limit?: number },
): Promise<BranchRevenueDto[]> {
  const { data } = await api.get<BranchRevenueDto[]>('/admin/dashboard/branches', { params });
  return data;
}

/** GET /admin/dashboard/order-status */
export async function fetchOrderStatus(params?: DateRangeParams): Promise<OrderStatusCountDto[]> {
  const { data } = await api.get<OrderStatusCountDto[]>('/admin/dashboard/order-status', { params });
  return data;
}

/** GET /admin/dashboard/low-stock */
export async function fetchLowStock(
  params?: { storeId?: number; page?: number; size?: number; threshold?: number },
): Promise<PageDto<LowStockItemDto>> {
  const { data } = await api.get<PageDto<LowStockItemDto>>('/admin/dashboard/low-stock', { params });
  return data;
}

/** GET /admin/dashboard/export — tải file xlsx */
export async function exportReport(params: {
  startDate: string;
  endDate: string;
  storeId?: number;
  type?: 'REVENUE' | 'ORDERS' | 'INVENTORY';
}): Promise<void> {
  const response = await api.get('/admin/dashboard/export', {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : `dashboard-${params.type ?? 'report'}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}