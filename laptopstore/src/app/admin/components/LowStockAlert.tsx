interface LowStockItemDto {
  productId: number;
  sku: string;
  name: string;
  storeId: number;
  storeName: string;
  stock: number;
  minQuantity: number;
  status: 'critical' | 'warning' | 'ok';
}

interface LowStockAlertProps {
  items?: LowStockItemDto[];
}

// Fallback mock
const MOCK_ITEMS: LowStockItemDto[] = [
  { productId: 1, sku: 'SKU001', name: 'MSI Creator M16 HX',  storeId: 3, storeName: 'Hải Phòng',   stock: 0, minQuantity: 2, status: 'critical' },
  { productId: 2, sku: 'SKU002', name: 'Asus ROG Strix G16',   storeId: 3, storeName: 'Hải Phòng',   stock: 4, minQuantity: 3, status: 'warning'  },
  { productId: 3, sku: 'SKU003', name: 'Dell XPS 13 9340',     storeId: 3, storeName: 'Hải Phòng',   stock: 3, minQuantity: 3, status: 'warning'  },
  { productId: 4, sku: 'SKU004', name: 'Asus ROG Strix G16',   storeId: 5, storeName: 'Bình Thạnh',  stock: 5, minQuantity: 3, status: 'ok'       },
  { productId: 5, sku: 'SKU005', name: 'Dell XPS 13 9340',     storeId: 4, storeName: 'Cầu Giấy',    stock: 4, minQuantity: 3, status: 'warning'  },
];

const STATUS_COLORS: Record<string, string> = {
  critical: 'text-red-500',
  warning:  'text-orange-500',
  ok:       'text-green-500',
};

export default function LowStockAlert({ items }: LowStockAlertProps) {
  const list = items ?? MOCK_ITEMS;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-extrabold text-gray-900">Cảnh báo tồn kho thấp</h3>
        <a href="#" className="text-[12.5px] text-[#2563eb] font-semibold hover:opacity-75 transition-opacity">
          Xem tất cả
        </a>
      </div>
      <div className="flex flex-col max-h-[220px] overflow-y-auto">
        {list.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2.5 px-0.5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 hover:px-1.5 hover:rounded-md transition-all cursor-pointer"
          >
            <div>
              {/* name từ BE (LowStockItemDto.name) */}
              <div className="text-[13.5px] font-semibold text-gray-900 mb-0.5">{item.name}</div>
              {/* storeName → hiển thị như branch */}
              <div className="text-xs text-gray-500">{item.storeName}</div>
            </div>
            <div className="text-right">
              {/* stock / minQuantity thay cho stock / min cũ */}
              <span className={`block text-[13.5px] font-bold ${STATUS_COLORS[item.status]}`}>
                {item.stock} / {item.minQuantity}
              </span>
              <span className="block text-[11px] text-gray-500">Tồn / Tối thiểu</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}