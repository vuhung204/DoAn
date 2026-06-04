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

// ── Types khớp BE DTOs ────────────────────────────────────────────────────

export interface RevenueKpiDto {
  label: string;
  formattedValue: string;
  value: number;
  growth: string;
}

export interface RevenueSeriesPointDto {
  label: string;
  storeId: number | null;
  storeKey: string | null;
  revenue: number;
}

export interface BranchRevenueDto {
  storeId: number;
  storeKey: string;
  storeName: string;
  revenue: number;
}

export interface BranchComparisonDto {
  storeId: number;
  storeKey: string;
  storeName: string;
  curRevenue: number;
  prevRevenue: number;
  growthPercent: number | null;
  sharePercent: number;
}

export interface YearlyRevenueDto {
  year: number;
  revenue: number;
  note: string | null;
}

export interface RevenueSummaryDto {
  kpis: RevenueKpiDto[];
  series: RevenueSeriesPointDto[];
  topBranches: BranchRevenueDto[];
  branchComparisonSnapshot: BranchComparisonDto[];
}

// ── Pivot helper: flat series rows → { label, [storeKey]: revenue } ───────
export interface PivotRow {
  label: string;
  [storeKey: string]: string | number;
}

export function pivotSeries(rows: RevenueSeriesPointDto[]): PivotRow[] {
  const map = new Map<string, PivotRow>();
  for (const row of rows) {
    const key = row.storeKey ?? 'all';
    if (!map.has(row.label)) map.set(row.label, { label: row.label });
    map.get(row.label)![key] = Number(row.revenue);
  }
  return Array.from(map.values());
}

// ── Branches helper: derive unique branches từ series ─────────────────────
const PALETTE = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

export interface BranchMeta {
  id: string;       // storeKey
  name: string;     // storeName
  color: string;
}

export function extractBranches(comparison: BranchComparisonDto[]): BranchMeta[] {
  return comparison.map((b, i) => ({
    id:    b.storeKey,
    name:  b.storeName,
    color: PALETTE[i % PALETTE.length],
  }));
}

// ── API functions ─────────────────────────────────────────────────────────

export type RevenueMode = 'day' | 'month' | 'year';

/** GET /api/admin/revenue/summary — page load */
export async function fetchRevenueSummary(
  mode: RevenueMode,
  startDate?: string,
  endDate?: string,
): Promise<RevenueSummaryDto> {
  const { data } = await api.get<RevenueSummaryDto>('/admin/revenue/summary', {
    params: { mode, startDate, endDate },
  });
  return data;
}

/** GET /api/admin/revenue/series */
export async function fetchRevenueSeries(
  mode: RevenueMode,
  startDate: string,
  endDate: string,
  branchIds?: number[],
): Promise<RevenueSeriesPointDto[]> {
  const { data } = await api.get<RevenueSeriesPointDto[]>('/admin/revenue/series', {
    params: { mode, startDate, endDate, branchIds: branchIds?.join(',') },
  });
  return data;
}

/** GET /api/admin/revenue/yearly */
export async function fetchYearlyRevenue(
  startYear?: number,
  endYear?: number,
): Promise<YearlyRevenueDto[]> {
  const { data } = await api.get<YearlyRevenueDto[]>('/admin/revenue/yearly', {
    params: { startYear, endYear },
  });
  return data;
}

/** GET /api/admin/revenue/compare-branches */
export async function fetchCompareBranches(
  mode: RevenueMode,
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  sortBy = 'revenue',
): Promise<BranchComparisonDto[]> {
  const { data } = await api.get<BranchComparisonDto[]>('/admin/revenue/compare-branches', {
    params: { mode, startDate, endDate, prevStartDate, prevEndDate, sortBy },
  });
  return data;
}

/** GET /api/admin/revenue/export — tải file xlsx */
export async function exportRevenueReport(params: {
  mode: RevenueMode;
  startDate: string;
  endDate: string;
  type?: string;
}): Promise<void> {
  const response = await api.get('/admin/revenue/export', {
    params,
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  const disposition = response.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  link.download     = match ? match[1] : `revenue-${params.mode}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}