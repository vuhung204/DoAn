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

// ── Types (khớp với BE DTOs) ─────────────────────────────────────────────

/** Khớp BranchInventoryDto */
export interface BranchInventoryDto {
  branchId: number;
  name: string;
  productCount: number;
  totalQuantity: number;
  lowStockCount: number;
  inventoryValue: number;   // BigDecimal → number, VND tuyệt đối
}

/** Khớp InventoryOverviewDto */
export interface InventoryOverviewDto {
  branches: BranchInventoryDto[];
  totalProducts: number;
  totalQuantity: number;
  totalLowStock: number;
  totalValue: number;
}

/** Khớp ProductInventoryDto */
export interface ProductInventoryDto {
  productId: number;
  sku: string;
  name: string;
  stockByBranch: Record<string, number>;  // branchId(string) → quantity
  totalStock: number;
  minStock: number;
  lowStock: boolean;
  estimatedValue: number;
}

/** Khớp InventoryTicketLineDto */
export interface TicketLineDto {
  productId: number | null;
  sku: string | null;
  name: string | null;
  qty: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

/** Khớp ImportTicketDto */
export interface ImportTicketDto {
  ticketId: number;
  branchId: number | null;
  branchName: string | null;
  supplier: string | null;
  lines: TicketLineDto[];
  status: TicketStatus;
  createdAt: string;
  processedAt: string | null;
  createdBy: number | null;
}

/** Khớp ExportTicketDto */
export interface ExportTicketDto {
  ticketId: number;
  branchId: number | null;
  branchName: string | null;
  reason: string | null;
  lines: TicketLineDto[];
  status: TicketStatus;
  createdAt: string;
  processedAt: string | null;
  createdBy: number | null;
}

/** Khớp TransferTicketDto */
export interface TransferTicketDto {
  ticketId: number;
  fromBranchId: number | null;
  fromBranchName: string | null;
  toBranchId: number | null;
  toBranchName: string | null;
  reason: string | null;
  lines: TicketLineDto[];
  status: TicketStatus;
  createdAt: string;
  processedAt: string | null;
  createdBy: number | null;
}

/** Khớp InventoryAlertDto */
export interface InventoryAlertDto {
  productId: number;
  sku: string;
  productName: string;
  branchId: number;
  branchName: string;
  stock: number;
  minStock: number;
  severity: 'critical' | 'warning' | 'info';
  note: string | null;
}

/** Khớp InventoryHistoryDto */
export interface InventoryHistoryDto {
  id: number;
  productId: number | null;
  branchId: number | null;
  delta: number;
  actionType: string;
  refId: string | null;
  createdAt: string;
  createdBy: number | null;
  note: string | null;
}

/** Khớp PageDto<T> */
export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // 0-indexed
  size: number;
  first: boolean;
  last: boolean;
}

export type TicketStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// ── Params helpers ────────────────────────────────────────────────────────

export interface TicketListParams {
  branchId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface ProductListParams {
  branchId?: number;
  q?: string;
  lowStockOnly?: boolean;
  page?: number;
  size?: number;
}

// ── Request bodies ────────────────────────────────────────────────────────

export interface CreateImportBody {
  branchId: number;
  lines: { productId: number; qty: number; unitPrice?: number }[];
  supplier?: string;
  note?: string;
  createdBy?: number;
}

export interface CreateExportBody {
  branchId: number;
  lines: { productId: number; qty: number; unitPrice?: number }[];
  reason?: string;
  note?: string;
  createdBy?: number;
}

export interface CreateTransferBody {
  fromBranchId: number;
  toBranchId: number;
  lines: { productId: number; qty: number; unitPrice?: number }[];
  reason?: string;
  note?: string;
  createdBy?: number;
}

export interface AdjustStockBody {
  productId: number;
  branchId: number;
  delta: number;
  reason?: string;
  staffId?: number;
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /admin/inventory/overview */
export async function fetchOverview(): Promise<InventoryOverviewDto> {
  const { data } = await api.get<InventoryOverviewDto>('/admin/inventory/overview');
  return data;
}

/** GET /admin/inventory/branches */
export async function fetchBranches(): Promise<BranchInventoryDto[]> {
  const { data } = await api.get<BranchInventoryDto[]>('/admin/inventory/branches');
  return data;
}

/** GET /admin/inventory/products */
export async function fetchProducts(params?: ProductListParams): Promise<PageDto<ProductInventoryDto>> {
  const { data } = await api.get<PageDto<ProductInventoryDto>>('/admin/inventory/products', { params });
  return data;
}

/** GET /admin/inventory/products/{productId}/history */
export async function fetchProductHistory(
  productId: number,
  params?: { branchId?: number; fromDate?: string; toDate?: string; page?: number; size?: number },
): Promise<PageDto<InventoryHistoryDto>> {
  const { data } = await api.get<PageDto<InventoryHistoryDto>>(
    `/admin/inventory/products/${productId}/history`,
    { params },
  );
  return data;
}

/** GET /admin/inventory/imports */
export async function fetchImports(params?: TicketListParams): Promise<PageDto<ImportTicketDto>> {
  const { data } = await api.get<PageDto<ImportTicketDto>>('/admin/inventory/imports', { params });
  return data;
}

/** POST /admin/inventory/imports */
export async function createImport(body: CreateImportBody): Promise<ImportTicketDto> {
  const { data } = await api.post<ImportTicketDto>('/admin/inventory/imports', body);
  return data;
}

/** GET /admin/inventory/exports */
export async function fetchExports(params?: TicketListParams): Promise<PageDto<ExportTicketDto>> {
  const { data } = await api.get<PageDto<ExportTicketDto>>('/admin/inventory/exports', { params });
  return data;
}

/** POST /admin/inventory/exports */
export async function createExport(body: CreateExportBody): Promise<ExportTicketDto> {
  const { data } = await api.post<ExportTicketDto>('/admin/inventory/exports', body);
  return data;
}

/** GET /admin/inventory/transfers */
export async function fetchTransfers(params?: TicketListParams & {
  fromBranch?: number;
  toBranch?: number;
}): Promise<PageDto<TransferTicketDto>> {
  const { data } = await api.get<PageDto<TransferTicketDto>>('/admin/inventory/transfers', { params });
  return data;
}

/** POST /admin/inventory/transfers */
export async function createTransfer(body: CreateTransferBody): Promise<TransferTicketDto> {
  const { data } = await api.post<TransferTicketDto>('/admin/inventory/transfers', body);
  return data;
}

/** POST /admin/inventory/adjust */
export async function adjustStock(body: AdjustStockBody): Promise<void> {
  await api.post('/admin/inventory/adjust', body);
}

/** GET /admin/inventory/alerts */
export async function fetchAlerts(params?: {
  severity?: string;
  branchId?: number;
}): Promise<InventoryAlertDto[]> {
  const { data } = await api.get<InventoryAlertDto[]>('/admin/inventory/alerts', { params });
  return data;
}

/** GET /admin/inventory/export — tải file xlsx */
export async function exportInventory(params: {
  exportType: 'PRODUCTS' | 'IMPORTS' | 'EXPORTS' | 'TRANSFERS' | 'ALERTS';
  q?: string;
  storeId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<void> {
  const response = await api.get('/admin/inventory/export', {
    params,
    responseType: 'blob',
  });

  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;

  const disposition = response.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  link.download     = match ? match[1] : `inventory-${params.exportType.toLowerCase()}-${Date.now()}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}