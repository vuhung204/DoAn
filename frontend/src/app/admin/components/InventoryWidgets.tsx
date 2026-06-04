import { Package, AlertCircle } from 'lucide-react';
import type { OverstockItemDto, DeadStockItemDto } from '../api/productReportApi';

// ── Overstock ─────────────────────────────────────────────────────────────

interface OverstockListProps {
  items: OverstockItemDto[];
}

export function OverstockList({ items }: OverstockListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-[fadeIn_0.3s_ease_both]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <h3 className="text-[15px] font-black text-gray-900">Tồn Kho Nhiều</h3>
        </div>
      </div>

      <div className="flex flex-col">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có sản phẩm tồn kho cao</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.productId}-${item.storeId}`}
              className="flex items-center justify-between py-3 px-1 border-b border-gray-200 last:border-0 hover:bg-gray-50 hover:px-2 transition-all cursor-pointer rounded-md animate-[fadeIn_0.3s_ease_both]"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div>
                {/* name từ BE (OverstockItemDto.name) */}
                <div className="text-[13.5px] font-bold text-gray-900 mb-0.5">{item.name}</div>
                {/* storeName → branch */}
                <div className="text-xs text-blue-600">{item.storeName}</div>
              </div>
              <div className="text-right">
                {/* totalStock → count */}
                <span className="text-[15px] font-black text-blue-600 block">{item.totalStock} cái</span>
                {/* formattedAvg → avg */}
                <span className="text-[11.5px] text-gray-500">{item.formattedAvg}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        * Các sản phẩm có tồn kho cao so với lượng bán trung bình
      </p>
    </div>
  );
}

// ── Dead Stock ────────────────────────────────────────────────────────────

/** Tính stockClass từ totalStock */
function resolveStockClass(stock: number): string {
  if (stock > 20) return 'high';
  if (stock > 10) return 'medium';
  return 'low';
}

const stockBadgeClasses: Record<string, string> = {
  high:   'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-50 text-orange-700',
  low:    'bg-gray-50 text-gray-500',
};

const stockLabel: Record<string, string> = {
  high:   'Tồn nhiều',
  medium: 'Tồn vừa',
  low:    'Tồn ít',
};

interface DeadStockListProps {
  items: DeadStockItemDto[];
}

export function DeadStockList({ items }: DeadStockListProps) {
  // BE trả price là VND tuyệt đối
  const displayPrice = (vnd: number) =>
    (vnd / 1_000_000).toLocaleString('vi-VN') + ' Tr đ';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-[fadeIn_0.3s_ease_both]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <h3 className="text-[15px] font-black text-gray-900">Sản Phẩm Không Bán Được</h3>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Không có sản phẩm tồn đọng</p>
        ) : (
          items.map((item, index) => {
            const cls = resolveStockClass(item.totalStock);
            return (
              <div
                key={`${item.productId}-${item.storeId}`}
                className="border border-gray-200 rounded-lg p-3.5 hover:border-orange-600 hover:shadow-md transition-all cursor-pointer animate-[fadeIn_0.3s_ease_both]"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <div>
                    <div className="text-[13.5px] font-bold text-gray-900 mb-0.5">{item.name}</div>
                    <div className="text-[11px] text-gray-500">{item.sku}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap flex-shrink-0 ${stockBadgeClasses[cls]}`}>
                    {stockLabel[cls]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Lần bán cuối: <span className="text-orange-600 font-semibold">{item.formattedLastSale}</span>
                  </div>
                  <div className="text-[13.5px] font-bold text-gray-900">{displayPrice(item.price)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        * Sản phẩm không có đơn hàng trong 4 tuần trở lên
      </p>
    </div>
  );
}