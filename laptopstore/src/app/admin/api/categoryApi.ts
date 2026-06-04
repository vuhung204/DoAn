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

/** Khớp CategoryDto */
export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;       // BE field: sortOrder (mock dùng "order" — đã fix)
  visible: boolean;        // BE field: visible (từ isActive)
  productCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Khớp CategoryTreeDto */
export interface CategoryTreeDto {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  productCount: number;
  children: CategoryTreeDto[];
}

/** Khớp PageDto<CategoryDto> */
export interface CategoryPageDto {
  content: CategoryDto[];
  totalElements: number;
  totalPages: number;
  number: number;   // 0-indexed
  size: number;
  first: boolean;
  last: boolean;
}

// ── Request bodies ────────────────────────────────────────────────────────

export interface CreateCategoryBody {
  name: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  visible?: boolean;
}

export interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  visible?: boolean;
}

export interface ReorderCategoryBody {
  parentId?: number | null;
  orderedCategoryIds: number[];
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /admin/categories/tree */
export async function fetchCategoryTree(): Promise<CategoryTreeDto[]> {
  const { data } = await api.get<CategoryTreeDto[]>('/admin/categories/tree');
  return data;
}

/** GET /admin/categories — danh sách phẳng có phân trang */
export async function fetchCategories(params?: {
  q?: string;
  visible?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}): Promise<CategoryPageDto> {
  const { data } = await api.get<CategoryPageDto>('/admin/categories', { params });
  return data;
}

/** POST /admin/categories */
export async function createCategory(body: CreateCategoryBody): Promise<CategoryDto> {
  const { data } = await api.post<CategoryDto>('/admin/categories', body);
  return data;
}

/** PUT /admin/categories/{id} */
export async function updateCategory(id: number, body: UpdateCategoryBody): Promise<CategoryDto> {
  const { data } = await api.put<CategoryDto>(`/admin/categories/${id}`, body);
  return data;
}

/** DELETE /admin/categories/{id} */
export async function deleteCategory(id: number, force = false): Promise<void> {
  await api.delete(`/admin/categories/${id}`, { params: { force } });
}

/** PATCH /admin/categories/{id}/visibility */
export async function setCategoryVisibility(id: number, visible: boolean): Promise<void> {
  await api.patch(`/admin/categories/${id}/visibility`, { visible });
}

/** PATCH /admin/categories/reorder */
export async function reorderCategories(body: ReorderCategoryBody): Promise<void> {
  await api.patch('/admin/categories/reorder', body);
}

/** GET /admin/categories/export */
export async function exportCategories(): Promise<void> {
  const response = await api.get('/admin/categories/export', { responseType: 'blob' });

  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;

  const disposition = response.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  link.download     = match ? match[1] : `categories-${Date.now()}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}