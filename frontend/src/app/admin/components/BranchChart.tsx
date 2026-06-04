import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BranchRevenueDto {
  storeId: number;
  storeName: string;
  revenue: number;
}

interface BranchChartProps {
  data?: BranchRevenueDto[];
}

// Fallback mock để component render được khi chưa có API
const MOCK_DATA: BranchRevenueDto[] = [
  { storeId: 1, storeName: 'Hoàn Kiếm',  revenue: 120 },
  { storeId: 2, storeName: 'Quận 1',     revenue: 158 },
  { storeId: 3, storeName: 'Hải Phòng',  revenue: 95  },
  { storeId: 4, storeName: 'Cầu Giấy',   revenue: 85  },
  { storeId: 5, storeName: 'Bình Thạnh', revenue: 62  },
];

export default function BranchChart({ data }: BranchChartProps) {
  // Map BE field storeName → branch (tên hiển thị trên trục X)
  const chartData = (data ?? MOCK_DATA).map(item => ({
    branch:  item.storeName,
    revenue: item.revenue,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-extrabold text-gray-900">Doanh thu theo chi nhánh hôm nay</h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis
              dataKey="branch"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Be Vietnam Pro, sans-serif' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Be Vietnam Pro, sans-serif' }}
              tickFormatter={(value) => `${value}M`}
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
              cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              formatter={(value: any) => [`${value.toLocaleString('vi-VN')} triệu đ`, 'Doanh thu']}
            />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              radius={[5, 5, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}