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

export type PromoType   = 'percent' | 'fixed' | 'free_ship';
export type PromoStatus = 'active' | 'inactive' | 'upcoming' | 'expired';

/** Khớp PromotionListDto */
export interface PromotionListDto {
  id: number;
  code: string;
  name: string;
  type: PromoType;
  discount: number;
  maxDiscount: number | null;
  startDate: string;       // LocalDate → "YYYY-MM-DD"
  endDate: string;
  usedCount: number;
  maxUses: number | null;  // null = unlimited (BE null, mock dùng 0)
  status: PromoStatus;
}

/** Khớp PromotionDetailDto */
export interface PromotionDetailDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: PromoType;
  discount: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  minQty: number | null;
  startDate: string;
  endDate: string;
  usedCount: number;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  applyMode: 'all' | 'select';
  productIds: number[];
  categoryIds: number[];
  status: PromoStatus;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string | null;
}

/** Khớp PageDto<PromotionListDto> */
export interface PromotionPageDto {
  content: PromotionListDto[];
  totalElements: number;
  totalPages: number;
  number: number;   // 0-indexed
  size: number;
  first: boolean;
  last: boolean;
}

/** Khớp PromotionValidateResponseDto */
export interface ValidateCodeDto {
  valid: boolean;
  message: string;
}

// ── Request bodies ────────────────────────────────────────────────────────

export interface CreatePromotionBody {
  code: string;
  name: string;
  description?: string;
  type: PromoType;           // percent | fixed | free_ship
  discount: number;
  maxDiscount?: number;
  minOrderAmount?: number;   // BE field: minOrderAmount (FE mock dùng conditionValue)
  minQty?: number;           // BE field: minQty
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;
  maxUses?: number;          // null/0 = unlimited
  maxUsesPerUser?: number;
  applyMode?: 'all' | 'select';
  productIds?: number[];
  categoryIds?: number[];
}

export interface UpdatePromotionBody {
  name?: string;
  description?: string;
  type?: PromoType;
  discount?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  minQty?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  applyMode?: 'all' | 'select';
  productIds?: number[];
  categoryIds?: number[];
}

export interface SearchPromotionParams {
  q?: string;
  status?: PromoStatus | '';
  type?: PromoType | '';
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /admin/promotions */
export async function fetchPromotions(params?: SearchPromotionParams): Promise<PromotionPageDto> {
  const { data } = await api.get<PromotionPageDto>('/admin/promotions', { params });
  return data;
}

/** GET /admin/promotions/{id} */
export async function fetchPromotionDetail(id: number): Promise<PromotionDetailDto> {
  const { data } = await api.get<PromotionDetailDto>(`/admin/promotions/${id}`);
  return data;
}

/** POST /admin/promotions */
export async function createPromotion(body: CreatePromotionBody): Promise<PromotionDetailDto> {
  const { data } = await api.post<PromotionDetailDto>('/admin/promotions', body);
  return data;
}

/** PUT /admin/promotions/{id} */
export async function updatePromotion(id: number, body: UpdatePromotionBody): Promise<PromotionDetailDto> {
  const { data } = await api.put<PromotionDetailDto>(`/admin/promotions/${id}`, body);
  return data;
}

/** PATCH /admin/promotions/{id}/status */
export async function changePromotionStatus(id: number, status: 'active' | 'inactive'): Promise<void> {
  await api.patch(`/admin/promotions/${id}/status`, { status });
}

/** DELETE /admin/promotions/{id} */
export async function deletePromotion(id: number): Promise<void> {
  await api.delete(`/admin/promotions/${id}`);
}

/** POST /admin/promotions/{id}/assign-products */
export async function assignProducts(id: number, productIds: number[]): Promise<void> {
  await api.post(`/admin/promotions/${id}/assign-products`, { productIds });
}

/** GET /admin/promotions/validate-code */
export async function validateCode(code: string, excludeId?: number): Promise<ValidateCodeDto> {
  const { data } = await api.get<ValidateCodeDto>('/admin/promotions/validate-code', {
    params: { code, excludeId },
  });
  return data;
}

/** GET /admin/promotions/export */
export async function exportPromotions(params?: {
  q?: string;
  status?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<void> {
  const response = await api.get('/admin/promotions/export', {
    params,
    responseType: 'blob',
  });

  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;

  const disposition = response.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  link.download     = match ? match[1] : `promotions-${Date.now()}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}