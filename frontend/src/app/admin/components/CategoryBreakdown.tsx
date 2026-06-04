import { LayoutGrid } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdownDto } from '../api/productReportApi';

interface CategoryBreakdownProps {
  categories: CategoryBreakdownDto[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-purple-600" />
          <h3 className="text-[15px] font-black text-gray-900">Doanh Thu Theo Danh Mục</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu danh mục</p>
      </div>
    );
  }

  // BE trả VND tuyệt đối → chia 1_000_000_000 để hiển thị T đ
  const toTDong = (vnd: number) => (vnd / 1_000_000_000).toFixed(1);

  const totalVnd  = categories.reduce((sum, c) => sum + c.revenue, 0);
  const totalTDong = toTDong(totalVnd);
  const maxRevenue = Math.max(...categories.map(c => c.revenue), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-[fadeIn_0.3s_ease_both]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-purple-600" />
          <h3 className="text-[15px] font-black text-gray-900">Doanh Thu Theo Danh Mục</h3>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-8 items-center">
        {/* Donut Chart */}
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={categories}
                cx={90} cy={90}
                innerRadius={52} outerRadius={80}
                paddingAngle={0}
                dataKey="revenue"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-gray-900">{totalTDong} T đ</span>
            <span className="text-[11px] text-gray-500">Tổng DT</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-2.5 py-2 text-left text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Danh mục</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Doanh thu</th>
                <th className="px-2.5 py-2 text-left text-[11.5px] font-bold text-gray-500 uppercase tracking-wide min-w-[100px]">Tỷ lệ</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">% Đóng góp</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => {
                const barWidth = Math.round((cat.revenue / maxRevenue) * 100);
                return (
                  <tr
                    key={cat.categoryId}
                    className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer animate-[fadeIn_0.3s_ease_both]"
                    style={{ animationDelay: `${index * 0.06}s` }}
                  >
                    <td className="px-2.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                        {cat.categoryName}
                      </div>
                    </td>
                    <td className="px-2.5 py-3 text-right font-bold">{toTDong(cat.revenue)} T đ</td>
                    <td className="px-2.5 py-3">
                      <div className="w-[120px] h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-700 ease-out"
                          style={{ backgroundColor: cat.color, width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                    {/* sharePercent từ BE — đã tính sẵn */}
                    <td className="px-2.5 py-3 text-right text-gray-600 font-semibold">
                      {Number(cat.sharePercent).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}