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

// ── Types ─────────────────────────────────────────────────────────────────

export interface ProductListDto {
  id: number;
  name: string;
  sku: string;
  brand: string | null;
  category: string | null;
  basePrice: number;
  salePrice: number | null;
  stock: number;
  minStock: number;
  visible: boolean;
  primaryImageUrl: string | null;
}

export interface ProductSpecsDto {
  cpu?: string;
  ram?: string;
  storage?: string;
  display?: string;
  gpu?: string;
  os?: string;
  weightKg?: number;
  batteryWh?: number;
  ports?: string;
  color?: string;
}

export interface ProductImageDto {
  imageId: number;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDetailDto {
  id: number;
  name: string;
  sku: string;
  slug: string;
  brandId: number | null;
  brand: string | null;
  categoryId: number | null;
  category: string | null;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  stock: number;
  minStock: number;
  specs: ProductSpecsDto | null;
  images: ProductImageDto[];
  visible: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BrandDto {
  id: number;
  name: string;
  logoUrl: string | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
}

export interface ProductFiltersMetaDto {
  brands: BrandDto[];
  categories: CategoryDto[];
  statuses: string[];
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  brandId: number;
  categoryId: number;
  description?: string;
  basePrice: number;
  salePrice?: number;
  stock: number;
  minStock: number;
  visible: boolean;
  specs?: ProductSpecsDto;
  imageUrls?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  brandId?: number;
  categoryId?: number;
  description?: string;
  basePrice?: number;
  salePrice?: number;
  stock?: number;
  minStock?: number;
  visible?: boolean;
  specs?: ProductSpecsDto;
  imageUrls?: string[];
}

// ── API functions ─────────────────────────────────────────────────────────

/** POST /api/admin/upload/image — trả về URL lưu trên server */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('access_token');
  const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api';
  const res = await fetch(`${baseURL}/admin/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  const data = await res.json();
  return data.url as string;
}

/** GET /api/admin/products/filters/meta */
export async function fetchFiltersMeta(): Promise<ProductFiltersMetaDto> {
  const { data } = await api.get<ProductFiltersMetaDto>('/admin/products/filters/meta');
  return data;
}

/** GET /api/admin/products */
export async function fetchProducts(params: {
  page?: number;
  size?: number;
  q?: string;
  brandId?: number;
  categoryId?: number;
  status?: string;
  sort?: string;
  direction?: string;
}): Promise<PageDto<ProductListDto>> {
  const { data } = await api.get<PageDto<ProductListDto>>('/admin/products', { params });
  return data;
}

/** GET /api/admin/products/{id} */
export async function fetchProduct(id: number): Promise<ProductDetailDto> {
  const { data } = await api.get<ProductDetailDto>(`/admin/products/${id}`);
  return data;
}

/** POST /api/admin/products */
export async function createProduct(req: CreateProductRequest): Promise<ProductDetailDto> {
  const { data } = await api.post<ProductDetailDto>('/admin/products', req);
  return data;
}

/** PUT /api/admin/products/{id} */
export async function updateProduct(id: number, req: UpdateProductRequest): Promise<ProductDetailDto> {
  const { data } = await api.put<ProductDetailDto>(`/admin/products/${id}`, req);
  return data;
}

/** DELETE /api/admin/products/{id} */
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

/** PATCH /api/admin/products/{id}/visibility */
export async function setProductVisibility(id: number, visible: boolean): Promise<void> {
  await api.patch(`/admin/products/${id}/visibility`, { visible });
}

/** GET /api/admin/products/export */
export async function exportProducts(params?: {
  type?: string;
  q?: string;
  brandId?: number;
  categoryId?: number;
  status?: string;
}): Promise<void> {
  const response = await api.get('/admin/products/export', {
    params: { type: 'LIST', ...params },
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : 'products.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}