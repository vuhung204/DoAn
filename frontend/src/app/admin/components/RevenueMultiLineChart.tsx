import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import type { BranchMeta, PivotRow } from '../api/revenueApi';

interface RevenueMultiLineChartProps {
  mode: 'day' | 'month' | 'year';
  data: PivotRow[];        // đã pivot sẵn từ hook
  branches: BranchMeta[];  // derive từ BE comparison
}

const RevenueMultiLineChart = ({ mode, data, branches }: RevenueMultiLineChartProps) => {
  const [activeBranches, setActiveBranches] = useState<string[]>(() =>
    branches.map(b => b.id)
  );

  // FIX: sync lại activeBranches mỗi khi branches thay đổi (đổi mode day/month/year)
  // Nếu không có useEffect này, khi đổi mode branches mới sẽ có id khác
  // nhưng activeBranches vẫn giữ id cũ → activeSet.has() luôn false → không line nào hiện
  useEffect(() => {
    setActiveBranches(branches.map(b => b.id));
  }, [branches]);

  const activeSet = new Set(activeBranches);

  const toggleBranch = (id: string) => {
    setActiveBranches(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const title =
    mode === 'day'   ? 'Biểu đồ doanh thu 30 ngày qua' :
    mode === 'month' ? 'Biểu đồ doanh thu 12 tháng gần đây' :
                       'Biểu đồ doanh thu theo năm';

  const unit = mode === 'day' ? 'Tr đ' : 'T đ';

  // BE trả VND tuyệt đối — chia theo unit để hiển thị
  const divisor = mode === 'day' ? 1_000_000 : 1_000_000_000;

  // FIX: key trong chartData dùng String(storeId) — khớp với branch.id từ extractBranches()
  const chartData = data.map(row => {
    const mapped: Record<string, string | number> = { label: row.label };
    for (const b of branches) {
      const raw = row[b.id]; // b.id = String(storeId) — khớp với pivotSeries()
      mapped[b.id] = raw != null ? Number(raw) / divisor : 0;
    }
    return mapped;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5.5 mb-5 shadow-sm animate-in fade-in">
      <div className="flex items-center justify-between mb-4.5 gap-3 flex-wrap">
        <h3 className="text-[15px] font-extrabold text-gray-900">{title}</h3>
        <div className="flex gap-2.5 flex-wrap">
          {branches.map(branch => {
            const isActive = activeSet.has(branch.id);
            return (
              <label
                key={branch.id}
                className={`flex items-center gap-1.25 px-2.5 py-1 rounded-full border cursor-pointer select-none text-[12.5px] font-semibold transition-all ${isActive ? 'opacity-100' : 'opacity-40 line-through'}`}
                style={{ color: branch.color, borderColor: branch.color + '55', backgroundColor: isActive ? branch.color + '08' : 'white' }}
              >
                <input type="checkbox" checked={isActive} onChange={() => toggleBranch(branch.id)} className="hidden" />
                <span className="w-2.25 h-2.25 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />
                {branch.name}
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Be Vietnam Pro' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Be Vietnam Pro' }} tickFormatter={v => `${v} ${unit}`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-gray-900/93 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg text-xs min-w-[170px]">
                    <div className="font-extrabold text-[13px] mb-1.75 pb-1.25 border-b border-white/15">{label}</div>
                    {payload.map((entry: any, i: number) => {
                      if (!activeSet.has(entry.dataKey)) return null;
                      return (
                        <div key={i} className="flex items-center gap-1.75 mb-0.75 text-xs">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="flex-1">{entry.name}</span>
                          <span className="font-bold" style={{ color: entry.color }}>{Number(entry.value).toFixed(1)} {unit}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {branches.map(branch =>
              activeSet.has(branch.id) ? (
                <Line
                  key={branch.id}
                  type="monotone"
                  dataKey={branch.id}
                  name={branch.name}
                  stroke={branch.color}
                  strokeWidth={2.2}
                  dot={{ fill: '#fff', stroke: branch.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-5 mt-3.5 flex-wrap">
        {branches.map(branch => (
          <div
            key={branch.id}
            onClick={() => toggleBranch(branch.id)}
            className={`flex items-center gap-1.5 text-[12.5px] text-gray-600 cursor-pointer transition-opacity ${activeSet.has(branch.id) ? 'opacity-100' : 'opacity-35'}`}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: branch.color }} />
            {branch.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueMultiLineChart;