import { Boxes, ShoppingBag, TriangleAlert, Ban } from 'lucide-react';
import type { ProductStatDto } from '../api/productReportApi';

const ICONS = [Boxes, ShoppingBag, TriangleAlert, Ban];
const ICON_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-orange-100 text-orange-600',
  'bg-purple-100 text-purple-600',
];

interface ProductStatCardsProps {
  stats: ProductStatDto[];
}

export function ProductStatCards({ stats }: ProductStatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3.5 mb-5">
      {stats.map((stat, index) => {
        const Icon = ICONS[index % ICONS.length];
        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-[fadeIn_0.3s_ease_both]"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${ICON_COLORS[index % ICON_COLORS.length]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-gray-900">{stat.formattedValue}</div>
          </div>
        );
      })}
    </div>
  );
}