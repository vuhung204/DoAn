import { useState } from 'react';
import { Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import RevenueFilterBar from '../components/RevenueFilterBar';
import RevenueMultiLineChart from '../components/RevenueMultiLineChart';
import BranchComparisonTable from '../components/BranchComparisonTable';
import YearlyBarChart from '../components/YearlyBarChart';
import { useRevenue } from '../hooks/useRevenue';
import type { RevenueMode } from '../api/revenueApi';

const RevenuePage = () => {
  const [mode, setMode] = useState<RevenueMode>('month');
  const { summary, yearly, comparison, branches, pivoted, loading, error, refetch, exporting, handleExport } = useRevenue(mode);

  // KPI từ BE: lấy card "Tổng doanh thu" (index 0) cho FilterBar
  const totalKpi   = summary?.kpis?.[0];
  const totalRevenue = totalKpi?.formattedValue ?? '—';
  const growth       = totalKpi?.growth ?? '—';

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-[14px]">Đang tải dữ liệu doanh thu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center p-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13.5px] max-w-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-semibold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto px-7 py-7 pb-10">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Báo Cáo Doanh Thu</h1>
          <p className="text-[13px] text-gray-400">Phân tích doanh thu theo thời gian và chi nhánh</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <button onClick={refetch} className="flex items-center gap-1.5 px-3.5 py-2.25 rounded-lg text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-all" title="Làm mới">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleExport('SUMMARY')}
            disabled={exporting}
            className="flex items-center gap-1.75 px-4.5 py-2.25 rounded-lg bg-white text-gray-900 border border-gray-200 text-[13.5px] font-bold hover:border-blue-600 hover:text-blue-600 disabled:opacity-60 transition-all"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Filter Bar — truyền KPI từ BE */}
      <RevenueFilterBar
        mode={mode}
        onModeChange={setMode}
        totalRevenue={totalRevenue}
        growth={growth}
      />

      {/* Charts */}
      {mode === 'year' ? (
        <YearlyBarChart data={yearly} />
      ) : (
        <RevenueMultiLineChart mode={mode} data={pivoted} branches={branches} />
      )}

      {/* Branch Comparison Table — truyền data từ BE */}
      <BranchComparisonTable mode={mode} branches={branches} data={comparison} />
    </div>
  );
};

export default RevenuePage;