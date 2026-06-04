import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';
import type { YearlyRevenueDto } from '../api/revenueApi';

interface YearlyBarChartProps {
  data?: YearlyRevenueDto[];
}

// Fallback mock khi chưa có data
const MOCK_DATA: YearlyRevenueDto[] = [
  { year: 2023, revenue: 125_000_000_000, note: 'Cả năm' },
  { year: 2024, revenue: 160_000_000_000, note: 'Cả năm' },
  { year: 2025, revenue: 218_000_000_000, note: 'Cả năm' },
  { year: 2026, revenue: 92_000_000_000,  note: 'Q1 2026' },
];

const YearlyBarChart = ({ data }: YearlyBarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // BE trả year là int — convert thành string cho XAxis
  const chartData = (data && data.length > 0 ? data : MOCK_DATA).map(d => ({
    year:    String(d.year),          // int → string cho XAxis
    revenue: d.revenue / 1_000_000_000, // VND → T đ
    note:    d.note ?? 'Cả năm',
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5.5 mb-5 shadow-sm animate-in fade-in">
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="text-[15px] font-extrabold text-gray-900">Biểu đồ doanh thu theo năm</h3>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={state => {
              if (state.isTooltipActive !== undefined) {
                setHoveredIndex(state.activeTooltipIndex ?? null);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Be Vietnam Pro' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Be Vietnam Pro' }}
              tickFormatter={v => `${v} T đ`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900/93 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg text-xs min-w-[170px]">
                      <div className="font-extrabold text-[13px] mb-1.75 pb-1.25 border-b border-white/15">
                        {payload[0].payload.year}
                      </div>
                      <div className="flex items-center justify-between gap-3 mb-0.75 text-xs">
                        <span>{payload[0].payload.note}</span>
                        <span className="font-bold text-blue-400">
                          {Number(payload[0].value).toFixed(1)} T đ
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={hoveredIndex === index ? '#3b82f6' : '#2563eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YearlyBarChart;