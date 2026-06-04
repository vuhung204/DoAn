import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export interface ProductStatDto {
  label: string;
  formattedValue: string;
  value: number;
}

export interface TopProductDto {
  rank: number;
  productId: number;
  name: string;
  sku: string;
  sold: number;
  revenue: number;   // VND
  rating: number | null;
  reviews: number;
}

export interface OverstockItemDto {
  productId: number;
  sku: string;
  name: string;
  storeId: number;
  storeName: string;
  totalStock: number;
  estMonthlySales: number;
  monthsOfStock: number | null;
  formattedAvg: string;
}

export interface DeadStockItemDto {
  productId: number;
  sku: string;
  name: string;
  storeId: number;
  storeName: string;
  totalStock: number;
  lastSoldAt: string | null;
  formattedLastSale: string;
  price: number;  // VND
}

export interface CategoryBreakdownDto {
  categoryId: number;
  categoryName: string;
  revenue: number;   // VND
  unitsSold: number;
  sharePercent: number;
  color: string;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface ProductReportSummaryDto {
  statCards: ProductStatDto[];
  topProductsPreview: TopProductDto[];
  overstockPreview: PageDto<OverstockItemDto>;
  deadstockPreview: PageDto<DeadStockItemDto>;
  categoryBreakdownSnapshot: CategoryBreakdownDto[];
}

export type ReportPeriod = 'week' | 'month' | 'quarter';

// ── API functions ─────────────────────────────────────────────────────────

/** GET /api/admin/products/report/summary — page load */
export async function fetchProductReportSummary(
  period: ReportPeriod,
  storeId?: number,
  categoryId?: number,
): Promise<ProductReportSummaryDto> {
  const { data } = await api.get<ProductReportSummaryDto>('/admin/products/report/summary', {
    params: { period, storeId, categoryId },
  });
  return data;
}

/** GET /api/admin/products/report/top-products */
export async function fetchTopProducts(
  period: ReportPeriod,
  limit = 5,
  storeId?: number,
  categoryId?: number,
): Promise<TopProductDto[]> {
  const { data } = await api.get<TopProductDto[]>('/admin/products/report/top-products', {
    params: { period, limit, storeId, categoryId },
  });
  return data;
}

/** GET /api/admin/products/report/overstock */
export async function fetchOverstock(
  storeId?: number,
  page = 0,
  size = 5,
): Promise<PageDto<OverstockItemDto>> {
  const { data } = await api.get<PageDto<OverstockItemDto>>('/admin/products/report/overstock', {
    params: { storeId, page, size },
  });
  return data;
}

/** GET /api/admin/products/report/deadstock */
export async function fetchDeadstock(
  storeId?: number,
  page = 0,
  size = 5,
): Promise<PageDto<DeadStockItemDto>> {
  const { data } = await api.get<PageDto<DeadStockItemDto>>('/admin/products/report/deadstock', {
    params: { storeId, page, size },
  });
  return data;
}

/** GET /api/admin/products/report/category-breakdown */
export async function fetchCategoryBreakdown(
  storeId?: number,
): Promise<CategoryBreakdownDto[]> {
  const { data } = await api.get<CategoryBreakdownDto[]>('/admin/products/report/category-breakdown', {
    params: { storeId },
  });
  return data;
}

/** GET /api/admin/products/report/export */
export async function exportProductReport(params: {
  period: ReportPeriod;
  type?: string;
  storeIds?: number[];
}): Promise<void> {
  const response = await api.get('/admin/products/report/export', {
    params: { ...params, storeIds: params.storeIds?.join(',') },
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : `products-report-${params.period}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}