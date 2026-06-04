import React, { useState } from 'react';
import { Search, Plus, Download, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import type { useSystem } from '../../hooks/useSystem';

type HookReturn = ReturnType<typeof useSystem>;

export function StoreList({ hook }: { hook: HookReturn }) {
  const {
    stores, storeTotalEl, storeTotalPages, storePage, setStorePage,
    storeQ, setStoreQ, storeStatus, setStoreStatus,
    storesLoading, openCreateStore, openEditStore,
    handleDeleteStore, handleToggleStoreStatus, handleExportStores,
  } = hook;

  const [localQ, setLocalQ] = useState(storeQ);
  const commitSearch = () => { if (localQ !== storeQ) setStoreQ(localQ); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Danh Sách Chi Nhánh</h2>
        <div className="flex gap-2">
          <button onClick={handleExportStores}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50">
            <Download className="w-4 h-4" /> Xuất XLSX
          </button>
          <button onClick={openCreateStore}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white rounded-md text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Thêm Chi Nhánh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text" value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={e => e.key === 'Enter' && commitSearch()}
            placeholder="Tên hoặc địa chỉ chi nhánh..."
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Trạng thái</label>
          <select value={storeStatus}
            onChange={e => { setStoreStatus(e.target.value); setStorePage(0); }}
            className="px-2 py-2 border border-[var(--border)] rounded-md text-sm outline-none">
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-[var(--card-border)] text-sm text-[var(--text-muted)]">
          {storesLoading ? 'Đang tải...' : `${storeTotalEl.toLocaleString('vi-VN')} chi nhánh`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[var(--card-border)]">
              <tr>
                {['Tên chi nhánh', 'Địa chỉ', 'Thành phố', 'SĐT', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storesLoading && stores.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1" />Đang tải...
                </td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Không có chi nhánh nào</td></tr>
              ) : stores.map(store => (
                <tr key={store.id} className="border-b border-[var(--card-border)] hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{store.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-[200px] truncate">{store.address}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{store.city}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{store.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {store.status === 'active' ? 'Hoạt động' : 'Không HĐ'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggleStoreStatus(store.id, store.status)}
                        className={`p-1.5 rounded text-xs ${store.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title={store.status === 'active' ? 'Tắt' : 'Bật'}>
                        {store.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditStore(store.id)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteStore(store.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[var(--card-border)] flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Trang <b>{storePage + 1}</b> / {storeTotalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setStorePage(p => Math.max(0, p - 1))} disabled={storePage <= 0 || storesLoading}
              className="px-3 py-1.5 border border-[var(--border)] rounded bg-white disabled:opacity-50 text-sm font-semibold">Trước</button>
            <button onClick={() => setStorePage(p => Math.min(storeTotalPages - 1, p + 1))} disabled={storePage >= storeTotalPages - 1 || storesLoading}
              className="px-3 py-1.5 border border-[var(--border)] rounded bg-white disabled:opacity-50 text-sm font-semibold">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}