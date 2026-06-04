import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface OrderStatusCountDto {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface OrderStatusChartProps {
  data?: OrderStatusCountDto[];
}

// Fallback mock
const MOCK_DATA: OrderStatusCountDto[] = [
  { status: 'COMPLETED',  label: 'Hoàn thành',    count: 45, color: '#10b981' },
  { status: 'SHIPPING',   label: 'Đang giao',      count: 28, color: '#2563eb' },
  { status: 'PROCESSING', label: 'Đang xử lý',     count: 18, color: '#f59e0b' },
  { status: 'PENDING',    label: 'Chờ xác nhận',   count: 9,  color: '#9ca3af' },
];

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  // Map BE fields: label → name, count → value (đúng với recharts dataKey)
  const chartData = (data ?? MOCK_DATA).map(item => ({
    name:   item.label,
    value:  item.count,
    color:  item.color,
    status: item.status,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-extrabold text-gray-900">Trạng thái đơn hàng</h3>
      </div>
      <div className="flex items-center gap-7">
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={70}
                paddingAngle={0}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[26px] font-black text-gray-900">{total}</span>
            <span className="text-[11px] text-gray-500">Đơn hàng</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[13px] text-gray-600 flex-1">{item.name}</span>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}