// src/pages/Dashboard.tsx
import { useState } from 'react';
import { Download, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import BranchChart from '../components/BranchChart';
import OrderStatusChart from '../components/OrderStatusChart';
import LowStockAlert from '../components/LowStockAlert';
import { useDashboard } from '../hooks/useDashboard';

// Lấy 7 ngày gần nhất làm default range
function getDefaultRange() {
  const end   = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  return { startDate: fmt(start), endDate: fmt(end) };
}

export default function Dashboard() {
  const [range] = useState(getDefaultRange);

  const {
    summary,
    lowStock,
    loading,
    error,
    refetch,
    handleExport,
    exporting,
  } = useDashboard({ startDate: range.startDate, endDate: range.endDate });

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-fadeIn flex flex-col gap-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="text-[14px]">Đang tải dashboard...</span>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="animate-fadeIn flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13.5px]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={refetch}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Dashboard Tổng Quan</h1>
          <p className="text-[13px] text-gray-500">Thống kê hoạt động hôm nay - {today}</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3.5 py-2.25 rounded-lg text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleExport('REVENUE')}
            disabled={exporting}
            className="flex items-center gap-1.75 px-4.5 py-2.25 rounded-lg text-[13.5px] font-bold bg-white text-gray-900 border border-gray-200 hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-60 transition-all"
          >
            {exporting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stat Cards — từ BE (summary.stats) */}
      <div className="grid grid-cols-4 gap-4 mb-5.5">
        {summary?.stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <RevenueChart data={summary?.revenueSeries} />
        <BranchChart  data={summary?.branchRevenues} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        <OrderStatusChart data={summary?.orderStatusCounts} />
        <LowStockAlert    items={lowStock?.content} />
      </div>
    </div>
  );
}