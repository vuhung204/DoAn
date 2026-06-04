import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types khớp BE DTOs ────────────────────────────────────────────────────

export interface CustomerStatsSummaryDto {
  totalCustomers: number;
  newCustomers: number;
  hotCustomers: number;
  lockedAccounts: number;
  totalCustomersFormatted: string;
  newCustomersFormatted: string;
}

export interface CustomerListDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;   // VND
  type: 'new' | 'vip' | 'regular';
  status: 'active' | 'locked' | 'unverified';
  joined: string;       // "YYYY-MM-DD"
}

export interface TopCustomerDto {
  id: number;
  name: string;
  email: string;
  revenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface OrderSummaryDto {
  orderCode: string;
  totalAmount: number;  // VND
  paymentMethod: string | null;
  status: string;
  orderedAt: string;    // ISO datetime
}

export interface AddressDto {
  id: number;
  label: string;
  text: string;
  isDefault: boolean;
}

export interface CustomerDetailDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  primaryAddress: string | null;
  status: 'active' | 'locked' | 'unverified';
  type: 'new' | 'vip' | 'regular';
  totalOrders: number;
  totalSpent: number;
  avgPerOrder: number | null;
  joined: string;
  addresses: AddressDto[];
  ordersPreview: PageDto<OrderSummaryDto>;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /api/admin/customers/summary */
export async function fetchCustomerStats(
  period = 'month',
): Promise<CustomerStatsSummaryDto> {
  const { data } = await api.get<CustomerStatsSummaryDto>('/admin/customers/summary', {
    params: { period },
  });
  return data;
}

/** GET /api/admin/customers */
export async function fetchCustomers(params: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  type?: string;
  sort?: string;
}): Promise<PageDto<CustomerListDto>> {
  const { data } = await api.get<PageDto<CustomerListDto>>('/admin/customers', { params });
  return data;
}

/** GET /api/admin/customers/{id} */
export async function fetchCustomerDetail(id: number): Promise<CustomerDetailDto> {
  const { data } = await api.get<CustomerDetailDto>(`/admin/customers/${id}`);
  return data;
}

/** GET /api/admin/customers/{id}/orders */
export async function fetchCustomerOrders(
  id: number,
  page = 0,
  size = 10,
): Promise<PageDto<OrderSummaryDto>> {
  const { data } = await api.get<PageDto<OrderSummaryDto>>(
    `/admin/customers/${id}/orders`,
    { params: { page, size } },
  );
  return data;
}

/** PUT /api/admin/customers/{id}/status */
export async function updateCustomerStatus(
  id: number,
  status: string,
  staffNote?: string,
): Promise<void> {
  await api.put(`/admin/customers/${id}/status`, { status, staffNote });
}

/** POST /api/admin/customers/{id}/reset-password */
export async function resetCustomerPassword(id: number): Promise<{ emailSent: boolean }> {
  const { data } = await api.post(`/admin/customers/${id}/reset-password`);
  return data;
}

/** GET /api/admin/customers/export */
export async function exportCustomers(params?: {
  type?: string;
  search?: string;
  status?: string;
}): Promise<void> {
  const response = await api.get('/admin/customers/export', {
    params: { type: 'LIST', ...params },
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : 'customers.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}