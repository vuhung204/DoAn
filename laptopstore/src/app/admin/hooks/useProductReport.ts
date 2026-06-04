import { useEffect, useState, useCallback } from 'react';
import {
  fetchProductReportSummary,
  exportProductReport,
  type ReportPeriod,
  type ProductReportSummaryDto,
} from '../api/productReportApi';

interface UseProductReportReturn {
  summary:   ProductReportSummaryDto | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
  exporting: boolean;
  handleExport: (type?: string) => Promise<void>;
}

export function useProductReport(period: ReportPeriod): UseProductReportReturn {
  const [summary,   setSummary]   = useState<ProductReportSummaryDto | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductReportSummary(period);
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải dữ liệu báo cáo sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const handleExport = useCallback(async (type = 'SUMMARY') => {
    setExporting(true);
    try {
      await exportProductReport({ period, type });
    } finally {
      setExporting(false);
    }
  }, [period]);

  return { summary, loading, error, refetch: load, exporting, handleExport };
}