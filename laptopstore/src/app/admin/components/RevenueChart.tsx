// src/components/RevenueChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RevenuePointDto } from '../api/dashboardApi';

interface RevenueChartProps {
  data?: RevenuePointDto[];
}

const MOCK_DATA: RevenuePointDto[] = [
  { date: '2026-03-29', label: '29/3', revenue: 258 },
  { date: '2026-03-30', label: '30/3', revenue: 295 },
  { date: '2026-03-31', label: '31/3', revenue: 312 },
  { date: '2026-04-01', label: '01/4', revenue: 270 },
  { date: '2026-04-02', label: '02/4', revenue: 288 },
  { date: '2026-04-03', label: '03/4', revenue: 335 },
  { date: '2026-04-04', label: '04/4', revenue: 280 },
];

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = (data ?? MOCK_DATA).map(p => ({
    date:    p.label,
    revenue: p.revenue,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-extrabold text-gray-900">Doanh thu 7 ngày qua</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
          Doanh thu
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Be Vietnam Pro, sans-serif' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Be Vietnam Pro, sans-serif' }}
              tickFormatter={(v) => `${v}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17,24,39,0.9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12.5px',
                fontFamily: 'Be Vietnam Pro, sans-serif',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '3px' }}
              formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} triệu đ`, 'Doanh thu']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              dot={{ fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2.5, r: 4 }}
              activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}