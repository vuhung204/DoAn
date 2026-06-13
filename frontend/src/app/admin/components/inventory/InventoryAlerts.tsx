import React, { useState } from 'react';
import {
  AlertCircle, RefreshCw, Download, PackagePlus,
  Loader2, X, Plus, Trash2,
} from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';
import type { InventoryAlertDto } from '../../api/inventoryApi';

type HookReturn = ReturnType<typeof useInventory>;

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Nghiêm trọng',
  warning:  'Cảnh báo',
  info:     'Thông tin',
};
const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border border-red-200',
  warning:  'bg-orange-100 text-orange-800 border border-orange-200',
  info:     'bg-blue-100 text-blue-800 border border-blue-200',
};
const SEVERITY_ROW: Record<string, string> = {
  critical: 'bg-red-50 border-l-4 border-l-red-500',
  warning:  'bg-orange-50 border-l-4 border-l-orange-400',
  info:     '',
};

// ── Quick Import Modal ────────────────────────────────────────────────────────
// Cho phép staff tạo nhanh phiếu nhập cho 1 sản phẩm từ alert

interface QuickLine { qty: string; unitPrice: string; }

function QuickImportModal({
  alert,
  hook,
  onClose,
}: {
  alert: InventoryAlertDto;
  hook: HookReturn;
  onClose: () => void;
}) {
  const { branches, handleCreateImport, actionLoading, actionError } = hook;

  const [branchId,  setBranchId]  = useState(String(alert.branchId));
  const [supplier,  setSupplier]  = useState('');
  const [note,      setNote]      = useState('');
  const [line,      setLine]      = useState<QuickLine>({ qty: '', unitPrice: '' });
  const [touched,   setTouched]   = useState(false);

  // Gợi ý số lượng cần nhập để đạt minStock * 1.5
  const suggested = Math.max(1, Math.ceil(alert.minStock * 1.5) - alert.stock);

  const canSubmit = branchId && Number(line.qty) > 0;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await handleCreateImport({
      branchId:  Number(branchId),
      supplier:  supplier.trim() || undefined,
      note:      note.trim()     || undefined,
      lines: [{
        productId: alert.productId,
        qty:       Number(line.qty),
        unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
      }],
    });
    if (!actionError) onClose();
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div>
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-600" /> Nhập kho nhanh
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              [{alert.sku}] {alert.productName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Stock status */}
          <div className="flex gap-3 text-sm">
            <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-red-500 font-bold mb-0.5">Tồn kho hiện tại</div>
              <div className="text-2xl font-extrabold text-red-600">{alert.stock}</div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-gray-500 font-bold mb-0.5">Ngưỡng tối thiểu</div>
              <div className="text-2xl font-extrabold text-gray-700">{alert.minStock}</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-blue-500 font-bold mb-0.5">Gợi ý nhập thêm</div>
              <div className="text-2xl font-extrabold text-blue-600">{suggested}</div>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Chi nhánh nhập <span className="text-red-500">*</span>
            </label>
            <select
              value={branchId} onChange={e => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
            </select>
          </div>

          {/* Qty & price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Số lượng nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number" min={1}
                  value={line.qty}
                  onChange={e => setLine(l => ({ ...l, qty: e.target.value }))}
                  placeholder={String(suggested)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {touched && !Number(line.qty) && (
                  <p className="text-red-500 text-xs mt-1">Bắt buộc</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Đơn giá (đ)
              </label>
              <input
                type="number" min={0}
                value={line.unitPrice}
                onChange={e => setLine(l => ({ ...l, unitPrice: e.target.value }))}
                placeholder="Tùy chọn"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Shortcut: apply suggestion */}
          <button
            onClick={() => setLine(l => ({ ...l, qty: String(suggested) }))}
            className="text-xs text-blue-600 font-bold hover:text-blue-800"
          >
            Dùng số lượng gợi ý ({suggested})
          </button>

          {/* Supplier & note */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nhà cung cấp</label>
            <input
              value={supplier} onChange={e => setSupplier(e.target.value)}
              placeholder="Tên nhà cung cấp (tùy chọn)"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ghi chú</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Nhập bù do cảnh báo tồn kho thấp..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              ⚠️ {actionError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={handleSubmit} disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm disabled:opacity-50"
          >
            {actionLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
              : <><PackagePlus className="w-4 h-4" /> Tạo phiếu nhập</>}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function InventoryAlerts({ hook }: { hook: HookReturn }) {
  const {
    alerts, alertsLoading, alertSeverity, setAlertSeverity,
    handleExport, handleSyncAlerts, actionLoading,
  } = hook;

  const [quickImportAlert, setQuickImportAlert] = useState<InventoryAlertDto | null>(null);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount  = alerts.filter(a => a.severity === 'warning').length;

  const isRefreshing = alertsLoading || actionLoading;

  return (
    <div className="space-y-5">

      {/* Quick Import Modal */}
      {quickImportAlert && (
        <QuickImportModal
          alert={quickImportAlert}
          hook={hook}
          onClose={() => setQuickImportAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Cảnh Báo Tồn Kho</h2>
          <p className="text-gray-500 mt-1">Danh sách sản phẩm cần nhập bổ sung</p>
        </div>
        <div className="flex gap-2">
          {/* Làm mới: gọi alerts/sync (qua handleSyncAlerts) rồi tải lại danh sách + overview */}
          <button
            onClick={handleSyncAlerts} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={() => handleExport('ALERTS')}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Xuất XLSX
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 bg-red-50 text-red-900 border border-red-100">
          <div className="text-xs font-bold opacity-75 mb-1">Nghiêm trọng (stock = 0)</div>
          <div className="text-3xl font-extrabold">{criticalCount}</div>
          <div className="text-xs text-red-600 mt-1 font-medium">Hết hàng hoàn toàn</div>
        </div>
        <div className="rounded-xl p-4 bg-orange-50 text-orange-900 border border-orange-100">
          <div className="text-xs font-bold opacity-75 mb-1">Cảnh báo (dưới ngưỡng)</div>
          <div className="text-3xl font-extrabold">{warningCount}</div>
          <div className="text-xs text-orange-600 mt-1 font-medium">Sắp hết hàng</div>
        </div>
        <div className="rounded-xl p-4 bg-gray-50 text-gray-900 border border-gray-100">
          <div className="text-xs font-bold opacity-75 mb-1">Tổng cảnh báo</div>
          <div className="text-3xl font-extrabold">{alerts.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Tất cả mức độ</div>
        </div>
      </div>

      {/* Critical highlight banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-600 text-white rounded-xl px-5 py-3 font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            {criticalCount} sản phẩm đã hết hàng hoàn toàn — cần nhập kho ngay.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Severity filter */}
        <div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">
          {['', 'critical', 'warning', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setAlertSeverity(s || undefined)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                alertSeverity === (s || undefined)
                  ? 'bg-gray-800 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s ? SEVERITY_LABELS[s] : 'Tất cả'}
              {s === 'critical' && criticalCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{criticalCount}</span>
              )}
              {s === 'warning' && warningCount > 0 && (
                <span className="ml-1.5 bg-orange-400 text-white text-xs rounded-full px-1.5 py-0.5">{warningCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Sản phẩm', 'SKU', 'Chi nhánh', 'Tồn kho', 'Ngưỡng', 'Mức độ', 'Ghi chú', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertsLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải...
                </td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  Không có cảnh báo nào 🎉
                </td></tr>
              ) : alerts.map(a => (
                <tr
                  key={`${a.productId}-${a.branchId}`}
                  className={`border-b border-gray-100 transition-colors hover:brightness-95 ${SEVERITY_ROW[a.severity] ?? ''}`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-[180px] truncate" title={a.productName}>
                    {a.productName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.sku}</td>
                  <td className="px-4 py-3 text-gray-700">{a.branchName}</td>
                  <td className="px-4 py-3">
                    <span className={`font-extrabold text-lg ${a.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {a.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-bold">{a.minStock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${SEVERITY_BADGE[a.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                      {SEVERITY_LABELS[a.severity] ?? a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate" title={a.note ?? ''}>
                    {a.note ?? '—'}
                  </td>
                  {/* Quick import action */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setQuickImportAlert(a)}
                      title="Nhập kho nhanh"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Nhập kho
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}