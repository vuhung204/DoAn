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

export interface BrandDto {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;  // FE dùng 'desc' → map sang 'description'
  website: string | null;
  active: boolean;
  productCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BrandStatsDto {
  totalBrands: number;
  activeBrands: number;
  brandsWithProducts: number;
  totalProducts: number;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateBrandRequest {
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  active?: boolean;
}

export interface UpdateBrandRequest {
  name?: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  active?: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /api/admin/brands/summary */
export async function fetchBrandStats(): Promise<BrandStatsDto> {
  const { data } = await api.get<BrandStatsDto>('/admin/brands/summary');
  return data;
}

/** GET /api/admin/brands */
export async function fetchBrands(params?: {
  page?: number;
  size?: number;
  q?: string;
  active?: boolean;
  sort?: string;
  direction?: string;
}): Promise<PageDto<BrandDto>> {
  const { data } = await api.get<PageDto<BrandDto>>('/admin/brands', { params });
  return data;
}

/** GET /api/admin/brands/{id} */
export async function fetchBrand(id: number): Promise<BrandDto> {
  const { data } = await api.get<BrandDto>(`/admin/brands/${id}`);
  return data;
}

/** POST /api/admin/brands */
export async function createBrand(req: CreateBrandRequest): Promise<BrandDto> {
  const { data } = await api.post<BrandDto>('/admin/brands', req);
  return data;
}

/** PUT /api/admin/brands/{id} */
export async function updateBrand(id: number, req: UpdateBrandRequest): Promise<BrandDto> {
  const { data } = await api.put<BrandDto>(`/admin/brands/${id}`, req);
  return data;
}

/** DELETE /api/admin/brands/{id} */
export async function deleteBrand(id: number): Promise<void> {
  await api.delete(`/admin/brands/${id}`);
}

/** PATCH /api/admin/brands/{id}/active */
export async function setBrandActive(id: number, active: boolean): Promise<void> {
  await api.patch(`/admin/brands/${id}/active`, { active });
}

/** GET /api/admin/brands/export */
export async function exportBrands(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const response = await api.get('/admin/brands/export', {
    params: { format },
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : `brands.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}