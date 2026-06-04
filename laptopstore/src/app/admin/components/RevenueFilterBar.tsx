import { Calendar } from 'lucide-react';

interface RevenueFilterBarProps {
  mode: 'day' | 'month' | 'year';
  onModeChange: (mode: 'day' | 'month' | 'year') => void;
  totalRevenue: string;
  growth: string;
}

const RevenueFilterBar = ({ mode, onModeChange, totalRevenue, growth }: RevenueFilterBarProps) => {
  return (
    <div className="flex items-center gap-6 bg-white border border-gray-200 rounded-xl px-5.5 py-4 mb-5 shadow-sm flex-wrap">
      {/* Time Selector */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <span className="flex items-center gap-1.75 text-[13.5px] font-semibold text-gray-600 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          Chọn thời gian:
        </span>
        <div className="flex bg-slate-50 rounded-lg p-0.75 gap-0.5">
          <button
            onClick={() => onModeChange('day')}
            className={`px-5.5 py-2 rounded-lg text-[13.5px] font-semibold transition-all whitespace-nowrap ${
              mode === 'day'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            Theo ngày
          </button>
          <button
            onClick={() => onModeChange('month')}
            className={`px-5.5 py-2 rounded-lg text-[13.5px] font-semibold transition-all whitespace-nowrap ${
              mode === 'month'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            Theo tháng
          </button>
          <button
            onClick={() => onModeChange('year')}
            className={`px-5.5 py-2 rounded-lg text-[13.5px] font-semibold transition-all whitespace-nowrap ${
              mode === 'year'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            Theo năm
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex gap-9 ml-auto">
        <div className="text-right">
          <span className="block text-xs text-gray-400 mb-0.75">
            {mode === 'day' ? 'Tổng doanh thu hôm nay' : mode === 'month' ? 'Tổng doanh thu tháng này' : 'Tổng doanh thu năm 2025'}
          </span>
          <span className="block text-2xl font-black text-gray-900 leading-none">{totalRevenue}</span>
        </div>
        <div className="text-right">
          <span className="block text-xs text-gray-400 mb-0.75">Tăng trưởng trung bình</span>
          <span className="block text-2xl font-black text-emerald-600 leading-none">{growth}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueFilterBar;
