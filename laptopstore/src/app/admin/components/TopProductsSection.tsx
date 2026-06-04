import { useState } from 'react';
import { TrendingUp, Star } from 'lucide-react';
import type { TopProductDto } from '../api/productReportApi';

type SortKey = 'sold' | 'revenue' | 'rating';

const rankClasses: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-gray-100 text-gray-700',
  3: 'bg-orange-50 text-orange-700',
  4: 'bg-gray-50 text-gray-500',
  5: 'bg-gray-50 text-gray-500',
};

interface TopProductsSectionProps {
  products: TopProductDto[];
}

export function TopProductsSection({ products }: TopProductsSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>('sold');

  const sortedProducts = [...products].sort((a, b) => {
    if (sortKey === 'revenue') return b.revenue - a.revenue;
    if (sortKey === 'rating')  return (b.rating ?? 0) - (a.rating ?? 0);
    return b.sold - a.sold;
  });

  // BE trả VND tuyệt đối → chia 1_000_000_000 để hiển thị T đ
  const displayRevenue = (vnd: number) =>
    (vnd / 1_000_000_000).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5 animate-[fadeIn_0.3s_ease_both]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <h3 className="text-[15px] font-black text-gray-900">Top 5 Sản Phẩm Bán Chạy Nhất</h3>
        </div>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-[13px] font-semibold bg-white cursor-pointer hover:border-gray-400 transition-colors"
        >
          <option value="sold">Đã bán</option>
          <option value="revenue">Doanh thu</option>
          <option value="rating">Đánh giá</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-2.5 py-2 text-left text-[11.5px] font-bold text-gray-500 uppercase tracking-wide w-8"></th>
              <th className="px-2.5 py-2 text-left text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Sản phẩm</th>
              <th className="px-2.5 py-2 text-right text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Đã bán</th>
              <th className="px-2.5 py-2 text-right text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Doanh thu</th>
              <th className="px-2.5 py-2 text-right text-[11.5px] font-bold text-gray-500 uppercase tracking-wide">Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, index) => (
              <tr
                key={product.sku}
                className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer animate-[fadeIn_0.3s_ease_both]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-2.5 py-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${rankClasses[product.rank] ?? 'bg-gray-50 text-gray-500'}`}>
                    {product.rank}
                  </span>
                </td>
                <td className="px-2.5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900 leading-tight">{product.name}</span>
                    <span className="text-[11px] text-gray-500">{product.sku}</span>
                  </div>
                </td>
                <td className="px-2.5 py-3 text-right font-bold">{product.sold}</td>
                <td className="px-2.5 py-3 text-right font-bold text-green-600">
                  {displayRevenue(product.revenue)} T đ
                </td>
                <td className="px-2.5 py-3 text-right">
                  {product.rating != null ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-gray-900">{Number(product.rating).toFixed(1)}</span>
                      <span className="text-gray-500 text-xs">({product.reviews})</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}