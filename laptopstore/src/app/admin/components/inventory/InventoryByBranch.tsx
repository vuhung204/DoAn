import React, { useState } from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';

type HookReturn = ReturnType<typeof useInventory>;

function formatVND(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' tr';
  return v.toLocaleString('vi-VN') + 'đ';
}

export default function InventoryByBranch({ hook }: { hook: HookReturn }) {
  const {
    products, productTotal, productPages, productPage,
    setProductPage, productQ, setProductQ,
    branchFilter, setBranchFilter,
    lowStockOnly, setLowStockOnly,
    productsLoading, branches, handleExport,
  } = hook;

  const [localQ, setLocalQ] = useState(productQ);

  const commitSearch = () => {
    if (localQ !== productQ) setProductQ(localQ);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Tồn Kho Theo Sản Phẩm</h2>
          <p className="text-gray-500 mt-1">Tồn kho chi tiết từng sản phẩm theo chi nhánh</p>
        </div>
        <button
          onClick={() => handleExport('PRODUCTS')}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Xuất XLSX
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={localQ}
                onChange={e => setLocalQ(e.target.value)}
                onBlur={commitSearch}
                onKeyDown={e => e.key === 'Enter' && commitSearch()}
                placeholder="Tên sản phẩm hoặc SKU..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Branch filter */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Chi nhánh</label>
            <select
              value={branchFilter ?? ''}
              onChange={e => setBranchFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Low stock toggle */}
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={e => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-bold text-orange-600">Chỉ hàng thấp</span>
          </label>
        </div>

        {/* Result count */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          {productsLoading ? 'Đang tải...' : `Tổng ${productTotal.toLocaleString('vi-VN')} sản phẩm`}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">SKU</th>
                {/* Hiển thị cột động theo branches */}
                {branches.map(b => (
                  <th key={b.branchId} className="px-4 py-3 text-center text-xs font-extrabold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {b.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-extrabold text-gray-600 uppercase tracking-wider">Tổng</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-600 uppercase tracking-wider">Giá trị</th>
                <th className="px-4 py-3 text-center text-xs font-extrabold text-gray-600 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {productsLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={5 + branches.length} className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5 + branches.length} className="px-4 py-12 text-center text-gray-400">
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.productId} className={`border-b border-gray-100 hover:bg-gray-50 ${productsLoading ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-gray-900 max-w-[200px] truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.sku}</td>

                    {/* Stock per branch — BE trả Map<branchId, qty> */}
                    {branches.map(b => {
                      const qty = p.stockByBranch?.[String(b.branchId)] ?? 0;
                      return (
                        <td key={b.branchId} className="px-4 py-3 text-center">
                          <span className={`font-bold ${qty <= p.minStock ? 'text-orange-600' : 'text-gray-700'}`}>
                            {qty}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-center font-extrabold text-gray-900">
                      {p.totalStock.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      {formatVND(p.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.lowStock ? (
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                          Thấp
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang <span className="font-bold">{productPage + 1}</span> / {productPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setProductPage(p => Math.max(0, p - 1))}
              disabled={productPage <= 0 || productsLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-bold text-sm"
            >
              Trước
            </button>
            <button
              onClick={() => setProductPage(p => Math.min(productPages - 1, p + 1))}
              disabled={productPage >= productPages - 1 || productsLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-bold text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}