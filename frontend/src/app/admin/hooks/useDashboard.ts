import { useEffect, useState, useCallback } from 'react';
import {
  fetchDashboardSummary,
  fetchLowStock,
  exportReport,
  type DashboardSummaryDto,
  type LowStockItemDto,
  type PageDto,
} from '../api/dashboardApi';

interface UseDashboardOptions {
  startDate?: string;
  endDate?: string;
  storeId?: number;
}

interface UseDashboardReturn {
  summary: DashboardSummaryDto | null;
  lowStock: PageDto<LowStockItemDto> | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadMoreLowStock: (page: number) => void;
  handleExport: (type?: 'REVENUE' | 'ORDERS' | 'INVENTORY') => Promise<void>;
  exporting: boolean;
}

export function useDashboard(opts: UseDashboardOptions = {}): UseDashboardReturn {
  const { startDate, endDate, storeId } = opts;

  const [summary, setSummary]     = useState<DashboardSummaryDto | null>(null);
  const [lowStock, setLowStock]   = useState<PageDto<LowStockItemDto> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary({ startDate, endDate, storeId });
      setSummary(data);
      setLowStock(data.lowStockPreview);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, storeId]);

  useEffect(() => { load(); }, [load]);

  const loadMoreLowStock = useCallback(async (page: number) => {
    try {
      const data = await fetchLowStock({ storeId, page, size: 10 });
      setLowStock(data);
    } catch {
      // giữ nguyên data cũ nếu lỗi
    }
  }, [storeId]);

  const handleExport = useCallback(async (type: 'REVENUE' | 'ORDERS' | 'INVENTORY' = 'REVENUE') => {
    if (!startDate || !endDate) return;
    setExporting(true);
    try {
      await exportReport({ startDate, endDate, storeId, type });
    } catch {
      // có thể toast lỗi ở đây
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, storeId]);

  return { summary, lowStock, loading, error, refetch: load, loadMoreLowStock, handleExport, exporting };
}