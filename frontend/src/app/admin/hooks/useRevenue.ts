import { useEffect, useState, useCallback } from 'react';
import {
  fetchRevenueSummary,
  fetchYearlyRevenue,
  fetchCompareBranches,
  pivotSeries,
  extractBranches,
  type RevenueMode,
  type RevenueSummaryDto,
  type YearlyRevenueDto,
  type BranchComparisonDto,
  type BranchMeta,
  type PivotRow,
} from '../api/revenueApi';

// ── Date helpers ──────────────────────────────────────────────────────────
function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function getRange(mode: RevenueMode): { start: string; end: string; prevStart: string; prevEnd: string } {
  const today = new Date();
  const end   = fmt(today);
  let start: Date;

  if (mode === 'year') {
    start = new Date(today.getFullYear() - 4, 0, 1);
  } else if (mode === 'month') {
    start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  } else {
    start = new Date(today); start.setDate(today.getDate() - 29);
  }

  const startStr = fmt(start);
  const days     = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd  = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - (days - 1));

  return { start: startStr, end, prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
}

// ── Hook ──────────────────────────────────────────────────────────────────
interface UseRevenueReturn {
  summary:    RevenueSummaryDto | null;
  yearly:     YearlyRevenueDto[];
  comparison: BranchComparisonDto[];
  branches:   BranchMeta[];
  pivoted:    PivotRow[];
  loading:    boolean;
  error:      string | null;
  refetch:    () => void;
  exporting:  boolean;
  handleExport: (type?: string) => Promise<void>;
}

export function useRevenue(mode: RevenueMode): UseRevenueReturn {
  const [summary,    setSummary]    = useState<RevenueSummaryDto | null>(null);
  const [yearly,     setYearly]     = useState<YearlyRevenueDto[]>([]);
  const [comparison, setComparison] = useState<BranchComparisonDto[]>([]);
  const [branches,   setBranches]   = useState<BranchMeta[]>([]);
  const [pivoted,    setPivoted]    = useState<PivotRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [exporting,  setExporting]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end, prevStart, prevEnd } = getRange(mode);

      const [sum, yr, cmp] = await Promise.all([
        fetchRevenueSummary(mode, start, end),
        mode === 'year' ? fetchYearlyRevenue() : Promise.resolve([]),
        fetchCompareBranches(mode, start, end, prevStart, prevEnd),
      ]);

      setSummary(sum);
      setYearly(yr);
      setComparison(cmp);
      setBranches(extractBranches(cmp));
      setPivoted(pivotSeries(sum.series));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  const handleExport = useCallback(async (type = 'SUMMARY') => {
    const { start, end } = getRange(mode);
    setExporting(true);
    try {
      const { exportRevenueReport } = await import('../api/revenueApi');
      await exportRevenueReport({ mode, startDate: start, endDate: end, type });
    } finally {
      setExporting(false);
    }
  }, [mode]);

  return { summary, yearly, comparison, branches, pivoted, loading, error, refetch: load, exporting, handleExport };
}