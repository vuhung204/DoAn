import { useState } from 'react';
import { Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProductStatCards } from '../components/ProductStatCards';
import { TopProductsSection } from '../components/TopProductsSection';
import { OverstockList, DeadStockList } from '../components/InventoryWidgets';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { useProductReport } from '../hooks/useProductReport';
import type { ReportPeriod } from '../api/productReportApi';

const periodLabels: Record<ReportPeriod, string> = {
  week:    '7 ngày',
  month:   'Tháng này',
  quarter: 'Quý này',
};

export default function ProductsReport() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const { summary, loading, error, refetch, exporting, handleExport } = useProductReport(period);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-[14px]">Đang tải báo cáo sản phẩm...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13.5px]">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Báo Cáo Sản Phẩm</h1>
          <p className="text-sm text-gray-600">Phân tích hiệu suất và tồn kho sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg p-0.5 gap-0.5 border border-gray-200">
            {(['week', 'month', 'quarter'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                  period === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <button
            onClick={refetch}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 transition-all"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport('SUMMARY')}
            disabled={exporting}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stat Cards — từ BE */}
      <ProductStatCards stats={summary?.statCards ?? []} />

      {/* Top Products — từ BE */}
      <TopProductsSection products={summary?.topProductsPreview ?? []} />

      {/* Inventory Widgets — từ BE */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <OverstockList items={summary?.overstockPreview?.content ?? []} />
        <DeadStockList items={summary?.deadstockPreview?.content ?? []} />
      </div>

      {/* Category Breakdown — từ BE */}
      <CategoryBreakdown categories={summary?.categoryBreakdownSnapshot ?? []} />
    </div>
  );
}