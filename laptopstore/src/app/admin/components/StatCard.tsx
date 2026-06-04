import { TrendingUp, ShoppingCart, AlertTriangle, Box } from 'lucide-react';

interface StatCardProps {
  icon: string;
  iconClass: string;
  trend: string;
  trendClass: string;
  label: string;
  value: string;
}

const ICONS: Record<string, any> = {
  'chart-line': TrendingUp,
  'shopping-cart': ShoppingCart,
  'alert-triangle': AlertTriangle,
  'box': Box,
};

const ICON_BG_COLORS: Record<string, string> = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
};

const TREND_COLORS: Record<string, string> = {
  up: 'bg-green-50 text-green-600',
  down: 'bg-red-50 text-red-600',
  warn: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatCard({ icon, iconClass, trend, trendClass, label, value }: StatCardProps) {
  const Icon = ICONS[icon] || Box;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4.5 px-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all cursor-default">
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ICON_BG_COLORS[iconClass]}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className={`text-xs font-bold px-2.25 py-0.75 rounded-full ${TREND_COLORS[trendClass]}`}>
          {trend}
        </span>
      </div>
      <div className="text-[12.5px] text-gray-500 mb-1">{label}</div>
      <div className="text-[26px] font-black text-gray-900 leading-none">{value}</div>
    </div>
  );
}
