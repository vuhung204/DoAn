// src/api/warrantyApi.ts
import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type WarrantyStatus =
  | 'PENDING' | 'APPROVED' | 'IN_REPAIR' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface WarrantyListItem {
  warrantyId:       number;
  status:           WarrantyStatus;
  statusLabel:      string;
  orderId:          number;
  orderCode:        string;
  orderItemId:      number;
  productName:      string;
  quantity:         number;
  userId:           number;
  customerName:     string;
  customerEmail:    string;
  customerPhone:    string;
  handledById:      number | null;
  handledByName:    string | null;
  issueDescription: string;
  staffNote:        string | null;
  rejectionReason:  string | null;
  createdAt:        string;
  processedAt:      string | null;
  completedAt:      string | null;
  updatedAt:        string;
}

export interface UpdateWarrantyStatusPayload {
  newStatus:        WarrantyStatus;
  staffNote?:       string;
  rejectionReason?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

const BASE = '/admin/warranty';

/** GET /api/admin/warranty?status=...&page=...&size=... */
export async function fetchAdminWarranties(params?: {
  status?: WarrantyStatus | '';
  page?:   number; // 0-based
  size?:   number;
}): Promise<PageDto<WarrantyListItem>> {
  const { data } = await api.get<PageDto<WarrantyListItem>>(BASE, {
    params: {
      status: params?.status || undefined,
      page:   params?.page ?? 0,
      size:   params?.size ?? 20,
    },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

/** GET /api/admin/warranty/:id */
export async function fetchAdminWarrantyDetail(id: number): Promise<WarrantyListItem> {
  const { data } = await api.get<WarrantyListItem>(`${BASE}/${id}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

/** PATCH /api/admin/warranty/:id/status */
export async function updateAdminWarrantyStatus(
  id:      number,
  payload: UpdateWarrantyStatusPayload,
): Promise<WarrantyListItem> {
  const { data } = await api.patch<WarrantyListItem>(`${BASE}/${id}/status`, payload);
  return data;
}

export { api as warrantyApiInstance };