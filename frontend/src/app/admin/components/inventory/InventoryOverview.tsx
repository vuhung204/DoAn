import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';

type HookReturn = ReturnType<typeof useInventory>;

function formatVND(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1) + ' tr';
  return v.toLocaleString('vi-VN') + 'đ';
}

export default function InventoryOverview({ hook }: { hook: HookReturn }) {
  const { overview, overviewLoading, branches, refresh, handleExport } = hook;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Tổng Quan Tồn Kho</h2>
          <p className="text-gray-500 mt-1">Tổng hợp tồn kho toàn hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={overviewLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => handleExport('PRODUCTS')}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Xuất XLSX
          </button>
        </div>
      </div>

      {/* Summary cards — từ InventoryOverviewDto */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          label="Tổng sản phẩm"
          value={overview?.totalProducts?.toLocaleString('vi-VN') ?? '—'}
          color="bg-blue-50 text-blue-900"
          loading={overviewLoading}
        />
        <SummaryCard
          label="Tổng tồn kho"
          value={overview?.totalQuantity != null ? overview.totalQuantity.toLocaleString('vi-VN') + ' sp' : '—'}
          color="bg-gray-50 text-gray-900"
          loading={overviewLoading}
        />
        <SummaryCard
          label="Hàng sắp hết"
          value={overview?.totalLowStock?.toLocaleString('vi-VN') ?? '—'}
          color="bg-orange-50 text-orange-900"
          loading={overviewLoading}
        />
        <SummaryCard
          label="Giá trị tồn kho"
          value={formatVND(overview?.totalValue)}
          color="bg-green-50 text-green-900"
          loading={overviewLoading}
        />
      </div>

      {/* Branches table — từ BranchInventoryDto[] */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-extrabold text-gray-900">Tồn Kho Theo Chi Nhánh</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Chi nhánh', 'Sản phẩm', 'Tổng tồn', 'Hàng thấp', 'Giá trị'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overviewLoading && branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Không có dữ liệu</td>
                </tr>
              ) : (
                branches.map(b => (
                  <tr key={b.branchId} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* BE field: branchId, name, productCount, totalQuantity, lowStockCount, inventoryValue */}
                    <td className="px-6 py-3 font-bold text-gray-900">{b.name}</td>
                    <td className="px-6 py-3 text-gray-700">{b.productCount.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-3 text-gray-700">{b.totalQuantity.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-3">
                      {b.lowStockCount > 0 ? (
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                          {b.lowStockCount} sp
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold text-xs">OK</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">{formatVND(b.inventoryValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, loading }: {
  label: string; value: string; color: string; loading?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <div className="text-xs font-bold opacity-70 mb-2">{label}</div>
      {loading
        ? <div className="h-8 w-24 bg-current opacity-20 rounded animate-pulse" />
        : <div className="text-2xl font-extrabold">{value}</div>
      }
    </div>
  );
}