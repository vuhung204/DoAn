import React, { useState } from 'react';
import { Search, Plus, Download, Edit, Trash2, ToggleLeft, ToggleRight, Key, RefreshCw } from 'lucide-react';
import type { useSystem } from '../../hooks/useSystem';

type HookReturn = ReturnType<typeof useSystem>;

export function StaffList({ hook }: { hook: HookReturn }) {
  const {
    staffList, staffTotalEl, staffTotalPages, staffPage, setStaffPage,
    staffQ, setStaffQ, staffStoreId, setStaffStoreId,
    staffRole, setStaffRole, staffStatus, setStaffStatus,
    staffLoading, stores, openCreateStaff, openEditStaff,
    handleDeleteStaff, handleToggleStaffStatus,
    handleResetPassword, handleExportStaff,
  } = hook;

  const [localQ, setLocalQ] = useState(staffQ);
  const commitSearch = () => { if (localQ !== staffQ) setStaffQ(localQ); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Danh Sách Nhân Viên</h2>
        <div className="flex gap-2">
          <button onClick={handleExportStaff}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50">
            <Download className="w-4 h-4" /> Xuất XLSX
          </button>
          <button onClick={openCreateStaff}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white rounded-md text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={e => e.key === 'Enter' && commitSearch()}
            placeholder="Tên hoặc email nhân viên..."
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>
        {/* Filter by store */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Chi nhánh</label>
          <select value={staffStoreId ?? ''}
            onChange={e => { setStaffStoreId(e.target.value ? Number(e.target.value) : undefined); setStaffPage(0); }}
            className="px-2 py-2 border border-[var(--border)] rounded-md text-sm outline-none">
            <option value="">Tất cả</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {/* Filter by status */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Trạng thái</label>
          <select value={staffStatus}
            onChange={e => { setStaffStatus(e.target.value); setStaffPage(0); }}
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
          {staffLoading ? 'Đang tải...' : `${staffTotalEl.toLocaleString('vi-VN')} nhân viên`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[var(--card-border)]">
              <tr>
                {['Họ tên', 'Email', 'Chi nhánh', 'Vai trò', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffLoading && staffList.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1" />Đang tải...
                </td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Không có nhân viên nào</td></tr>
              ) : staffList.map(st => (
                <tr key={st.id} className="border-b border-[var(--card-border)] hover:bg-gray-50 transition-colors">
                  {/* BE field: fullName (không phải name) */}
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{st.fullName}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{st.email}</td>
                  {/* BE field: branchName (không phải branch) */}
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{st.branchName ?? '—'}</td>
                  {/* BE field: roleName (không phải role) */}
                  <td className="px-4 py-3">
                    {st.roleName ? (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{st.roleName}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      st.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {st.status === 'active' ? 'Hoạt động' : 'Không HĐ'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggleStaffStatus(st.id, st.status)}
                        className={`p-1.5 rounded ${st.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title={st.status === 'active' ? 'Tắt' : 'Bật'}>
                        {st.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditStaff(st.id)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(st.id)}
                        className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                        title="Reset mật khẩu">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteStaff(st.id)}
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
        <div className="px-4 py-3 border-t border-[var(--card-border)] flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Trang <b>{staffPage + 1}</b> / {staffTotalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setStaffPage(p => Math.max(0, p - 1))} disabled={staffPage <= 0 || staffLoading}
              className="px-3 py-1.5 border border-[var(--border)] rounded bg-white disabled:opacity-50 text-sm font-semibold">Trước</button>
            <button onClick={() => setStaffPage(p => Math.min(staffTotalPages - 1, p + 1))} disabled={staffPage >= staffTotalPages - 1 || staffLoading}
              className="px-3 py-1.5 border border-[var(--border)] rounded bg-white disabled:opacity-50 text-sm font-semibold">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}