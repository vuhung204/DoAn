import { ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import type { BranchComparisonDto, BranchMeta } from '../api/revenueApi';

interface BranchComparisonTableProps {
  mode: 'day' | 'month' | 'year';
  branches: BranchMeta[];
  // FE nhận thẳng BranchComparisonDto từ BE — không cần mock shape cũ
  data: BranchComparisonDto[];
}

const BranchComparisonTable = ({ mode, branches, data }: BranchComparisonTableProps) => {
  const [sortBy, setSortBy] = useState<'revenue' | 'growth' | 'share'>('revenue');

  // Sort dựa trên field BE (curRevenue, growthPercent, sharePercent)
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'growth') return (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity);
    if (sortBy === 'share')  return b.sharePercent - a.sharePercent;
    return b.curRevenue - a.curRevenue;
  });

  const maxRevenue = Math.max(...data.map(d => d.curRevenue), 1);

  const unit = mode === 'day' ? 'Tr đ' : 'T đ';

  // Chia giá trị theo unit để hiển thị (BE trả VND tuyệt đối)
  const display = (val: number) =>
    mode === 'day'
      ? (val / 1_000_000).toFixed(1)
      : (val / 1_000_000_000).toFixed(1);

  const title =
    mode === 'day'   ? 'So sánh chi nhánh (Tuần qua)'     :
    mode === 'month' ? 'So sánh chi nhánh (Tháng này)'    :
                       'So sánh chi nhánh (Năm nay vs năm trước)';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5.5 mb-5 shadow-sm animate-in fade-in">
      <div className="flex items-center justify-between mb-4.5 gap-3 flex-wrap">
        <h3 className="text-[15px] font-extrabold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-gray-400">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'revenue' | 'growth' | 'share')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 bg-slate-50 cursor-pointer outline-none focus:border-blue-600 transition-colors"
          >
            <option value="revenue">Doanh thu</option>
            <option value="growth">Tăng trưởng</option>
            <option value="share">% Đóng góp</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-3 py-2.5 text-left   text-xs font-bold text-gray-400 uppercase tracking-wider">Chi nhánh</th>
              <th className="px-3 py-2.5 text-right  text-xs font-bold text-gray-400 uppercase tracking-wider">
                {mode === 'month' ? 'Tháng này' : mode === 'day' ? 'Tuần này' : 'Năm nay'}
              </th>
              <th className="px-3 py-2.5 text-right  text-xs font-bold text-gray-400 uppercase tracking-wider">
                {mode === 'month' ? 'Tháng trước' : mode === 'day' ? 'Tuần trước' : 'Năm trước'}
              </th>
              <th className="px-3 py-2.5 text-right  text-xs font-bold text-gray-400 uppercase tracking-wider">Tăng trưởng</th>
              <th className="px-3 py-2.5 text-xs     font-bold text-gray-400 uppercase tracking-wider">Biểu đồ mini</th>
              <th className="px-3 py-2.5 text-right  text-xs font-bold text-gray-400 uppercase tracking-wider">% Đóng góp</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const branch   = branches.find(b => b.id === row.storeKey);
              const color    = branch?.color ?? '#6b7280';
              const barWidth = Math.round((row.curRevenue / maxRevenue) * 100);
              const growth   = row.growthPercent;

              return (
                <tr key={row.storeId} className="border-b border-gray-200 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-3 py-3.25">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-gray-900">{row.storeName}</span>
                    </div>
                  </td>
                  {/* curRevenue → display theo unit */}
                  <td className="px-3 py-3.25 text-right font-bold text-gray-900">
                    {display(row.curRevenue)} {unit}
                  </td>
                  <td className="px-3 py-3.25 text-right text-gray-400">
                    {display(row.prevRevenue)} {unit}
                  </td>
                  <td className="px-3 py-3.25 text-right">
                    {growth == null ? (
                      <span className="text-gray-400 text-xs">N/A</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-bold text-[13px] ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {growth >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {growth >= 0 ? '+' : ''}{Number(growth).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.25">
                    <div className="w-20 h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                    </div>
                  </td>
                  <td className="px-3 py-3.25 text-right font-semibold text-gray-600">
                    {Number(row.sharePercent).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchComparisonTable;