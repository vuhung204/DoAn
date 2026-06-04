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


export interface ReviewListDto {
  id: number;
  productId: number;
  productName: string;
  userId: number | null;
  customerName: string;
  email: string;
  rating: number;
  title: string | null;
  shortText: string | null;
  imageCount: number;
  createdAt: string;        // ISO datetime
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
}

export interface ReviewReplyDto {
  by: string;
  text: string;
  repliedAt: string | null;
}

export interface ReviewDetailDto {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  userId: number | null;
  customerName: string;
  email: string;
  rating: number;
  title: string | null;
  text: string | null;
  imageUrls: string[];
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  reply: ReviewReplyDto | null;
  orderCode: string | null;
}

export interface RatingDistributionDto {
  rating: number;
  count: number;
  percent: number;
}

export interface ReviewStatsDto {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
  ratingDistribution: RatingDistributionDto[] | null;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// ── API functions ─────────────────────────────────────────────────────────

/** GET /api/admin/reviews */
export async function fetchReviews(params: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
  rating?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  direction?: string;
}): Promise<PageDto<ReviewListDto>> {
  const { data } = await api.get<PageDto<ReviewListDto>>('/admin/reviews', { params });
  return data;
}

/** GET /api/admin/reviews/stats */
export async function fetchReviewStats(
  startDate?: string,
  endDate?: string,
): Promise<ReviewStatsDto[]> {
  const { data } = await api.get<ReviewStatsDto[]>('/admin/reviews/stats', {
    params: { startDate, endDate },
  });
  return data;
}

/** GET /api/admin/reviews/{id} */
export async function fetchReviewDetail(id: number): Promise<ReviewDetailDto> {
  const { data } = await api.get<ReviewDetailDto>(`/admin/reviews/${id}`);
  return data;
}

/** PATCH /api/admin/reviews/{id}/status */
export async function updateReviewStatus(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'HIDDEN',
): Promise<void> {
  await api.patch(`/admin/reviews/${id}/status`, { status });
}

/** POST /api/admin/reviews/{id}/reply */
export async function replyReview(id: number, replyText: string): Promise<ReviewDetailDto> {
  const { data } = await api.post<ReviewDetailDto>(`/admin/reviews/${id}/reply`, { replyText });
  return data;
}

/** DELETE /api/admin/reviews/{id} */
export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/admin/reviews/${id}`);
}

/** GET /api/admin/reviews/export */
export async function exportReviews(params?: {
  status?: string;
  rating?: number;
  format?: 'XLSX' | 'CSV';
}): Promise<void> {
  const response = await api.get('/admin/reviews/export', {
    params: { format: 'XLSX', ...params },
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : 'reviews.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}