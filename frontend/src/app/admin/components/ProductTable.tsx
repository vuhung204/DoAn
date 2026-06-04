import { Laptop, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { ProductListDto } from '../api/productApi';

interface ProductTableProps {
  products: ProductListDto[];
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  // BE trả VND tuyệt đối
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + ' đ';

  const getStockClass = (stock: number, minStock: number) => {
    if (stock <= minStock)     return 'bg-red-100 text-red-700';
    if (stock <= minStock * 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto mb-4">
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            {['Sản phẩm','Thương hiệu','Danh mục','Giá gốc','Giá bán','Tồn kho','Trạng thái','Thao tác'].map(h => (
              <th key={h} className="px-3.5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr
              key={product.id}
              onClick={() => onEdit(product.id)}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <td className="px-3.5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.primaryImageUrl
                      ? <img src={product.primaryImageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <Laptop className="w-4.5 h-4.5 text-gray-400" />
                    }
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 leading-tight mb-0.5">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.sku}</div>
                  </div>
                </div>
              </td>
              <td className="px-3.5 py-3.5 text-gray-700">{product.brand ?? '—'}</td>
              <td className="px-3.5 py-3.5">
                <span className="text-blue-600 font-medium">{product.category ?? '—'}</span>
              </td>
              {/* basePrice từ BE là VND tuyệt đối */}
              <td className="px-3.5 py-3.5 text-right">
                <span className="text-xs text-gray-500 line-through">{formatPrice(product.basePrice)}</span>
              </td>
              <td className="px-3.5 py-3.5 text-right">
                {product.salePrice && product.salePrice !== product.basePrice ? (
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500 line-through">{formatPrice(product.basePrice)}</div>
                    <div className="text-sm font-bold text-gray-900">{formatPrice(product.salePrice)}</div>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-gray-900">{formatPrice(product.basePrice)}</span>
                )}
              </td>
              <td className="px-3.5 py-3.5 text-right">
                <span className={`inline-flex items-center justify-center min-w-[36px] h-6.5 rounded-lg px-2 text-sm font-bold ${getStockClass(product.stock, product.minStock)}`}>
                  {product.stock}
                </span>
              </td>
              {/* visible từ BE (isActive) */}
              <td className="px-3.5 py-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {product.visible ? (
                    <><Eye className="w-3 h-3 text-green-600" /><span className="text-green-600">Hiện thị</span></>
                  ) : (
                    <><EyeOff className="w-3 h-3 text-gray-500" /><span className="text-gray-500">Ẩn</span></>
                  )}
                </div>
              </td>
              <td className="px-3.5 py-3.5">
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit(product.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Edit className="w-3 h-3" />Sửa
                  </button>
                  <button
                    onClick={() => onDelete(product.id, product.name)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}