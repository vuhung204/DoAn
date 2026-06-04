import React, { useState } from 'react';
import {
  Download, RefreshCw, ChevronDown, ChevronUp,
  Plus, Trash2, PackagePlus, PackageMinus, Loader2, X,
} from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';
import type { ImportTicketDto, ExportTicketDto, TicketLineDto } from '../../api/inventoryApi';

type HookReturn = ReturnType<typeof useInventory>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', CONFIRMED: 'Đã xác nhận', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800',
};

function fmtDt(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function fmtVND(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('vi-VN') + 'đ';
}
function totalQty(lines: TicketLineDto[]) {
  return lines.reduce((s, l) => s + (l.qty ?? 0), 0);
}

// ── Shared: Expanded lines sub-row ────────────────────────────────────────────

function LinesRow({ lines, colSpan }: { lines: TicketLineDto[]; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-0">
        <div className="bg-gray-50 border border-gray-200 rounded-lg my-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {['SKU', 'Tên sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{l.sku ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-900">{l.name ?? '—'}</td>
                  <td className="px-4 py-2 font-bold">{l.qty}</td>
                  <td className="px-4 py-2">{fmtVND(l.unitPrice)}</td>
                  <td className="px-4 py-2 font-bold">{fmtVND(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ── Shared: Pagination ────────────────────────────────────────────────────────

function Pagination({ page, total, onPage, loading }: {
  page: number; total: number; onPage: (p: number) => void; loading: boolean;
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
      <span className="text-sm text-gray-600">Trang <b>{page + 1}</b> / {total || 1}</span>
      <div className="flex gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page <= 0 || loading}
          className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-bold text-sm">
          Trước
        </button>
        <button onClick={() => onPage(page + 1)} disabled={page >= total - 1 || loading}
          className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-bold text-sm">
          Sau
        </button>
      </div>
    </div>
  );
}

// ── Line item editor (dùng chung cho import & export form) ────────────────────

interface LineItem { productId: string; qty: string; unitPrice: string; }
const emptyLine = (): LineItem => ({ productId: '', qty: '', unitPrice: '' });

function LineEditor({
  lines, products, onChange,
}: {
  lines: LineItem[];
  products: HookReturn['products'];
  onChange: (lines: LineItem[]) => void;
}) {
  const update = (i: number, field: keyof LineItem, val: string) => {
    const next = lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    onChange(next);
  };
  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i));
  const add    = () => onChange([...lines, emptyLine()]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_120px_32px] gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
        <span>Sản phẩm</span><span>Số lượng</span><span>Đơn giá (đ)</span><span />
      </div>

      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_120px_32px] gap-2 items-center">
          <select
            value={l.productId}
            onChange={e => update(i, 'productId', e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Chọn SP —</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>[{p.sku}] {p.name}</option>
            ))}
          </select>

          <input
            type="number" min={1} placeholder="SL"
            value={l.qty}
            onChange={e => update(i, 'qty', e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number" min={0} placeholder="Tùy chọn"
            value={l.unitPrice}
            onChange={e => update(i, 'unitPrice', e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => remove(i)}
            disabled={lines.length <= 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-blue-600 font-bold hover:text-blue-800 mt-1"
      >
        <Plus className="w-4 h-4" /> Thêm dòng
      </button>
    </div>
  );
}

// ── CREATE IMPORT FORM ────────────────────────────────────────────────────────

function CreateImportForm({ hook, onClose }: { hook: HookReturn; onClose: () => void }) {
  const { branches, products, handleCreateImport, actionLoading, actionError } = hook;

  const [branchId,  setBranchId]  = useState('');
  const [supplier,  setSupplier]  = useState('');
  const [note,      setNote]      = useState('');
  const [lines,     setLines]     = useState<LineItem[]>([emptyLine()]);
  const [touched,   setTouched]   = useState(false);

  const validLines = lines.filter(l => l.productId && Number(l.qty) > 0);
  const canSubmit  = branchId && validLines.length > 0;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await handleCreateImport({
      branchId:  Number(branchId),
      supplier:  supplier.trim() || undefined,
      note:      note.trim()     || undefined,
      lines: validLines.map(l => ({
        productId: Number(l.productId),
        qty:       Number(l.qty),
        unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
      })),
    });
    if (!actionError) onClose();
  };

  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-blue-600" /> Tạo phiếu nhập kho
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Row 1: chi nhánh + nhà cung cấp */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Chi nhánh nhập <span className="text-red-500">*</span>
          </label>
          <select
            value={branchId} onChange={e => setBranchId(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Chọn chi nhánh —</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
          </select>
          {touched && !branchId && <p className="text-red-500 text-xs mt-1">Bắt buộc</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Nhà cung cấp
          </label>
          <input
            value={supplier} onChange={e => setSupplier(e.target.value)}
            placeholder="Tên nhà cung cấp (tùy chọn)"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
          Danh sách sản phẩm <span className="text-red-500">*</span>
        </label>
        <LineEditor lines={lines} products={products} onChange={setLines} />
        {touched && validLines.length === 0 && (
          <p className="text-red-500 text-xs mt-1">Cần ít nhất 1 sản phẩm hợp lệ</p>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ghi chú</label>
        <textarea
          value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="Ghi chú nội bộ..."
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Summary */}
      {validLines.length > 0 && (
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800 font-bold">
          Tổng: {validLines.length} loại sản phẩm —{' '}
          {validLines.reduce((s, l) => s + Number(l.qty), 0)} đơn vị
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          ⚠️ {actionError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSubmit} disabled={actionLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm disabled:opacity-50"
        >
          {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : <><PackagePlus className="w-4 h-4" /> Tạo phiếu nhập</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ── CREATE EXPORT FORM ────────────────────────────────────────────────────────

function CreateExportForm({ hook, onClose }: { hook: HookReturn; onClose: () => void }) {
  const { branches, products, handleCreateExport, actionLoading, actionError } = hook;

  const [branchId, setBranchId] = useState('');
  const [reason,   setReason]   = useState('');
  const [note,     setNote]     = useState('');
  const [lines,    setLines]    = useState<LineItem[]>([emptyLine()]);
  const [touched,  setTouched]  = useState(false);

  const validLines = lines.filter(l => l.productId && Number(l.qty) > 0);
  const canSubmit  = branchId && validLines.length > 0;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await handleCreateExport({
      branchId:  Number(branchId),
      reason:    reason.trim() || undefined,
      note:      note.trim()   || undefined,
      lines: validLines.map(l => ({
        productId: Number(l.productId),
        qty:       Number(l.qty),
        unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
      })),
    });
    if (!actionError) onClose();
  };

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 shadow-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
          <PackageMinus className="w-5 h-5 text-orange-600" /> Tạo phiếu xuất kho
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Chi nhánh xuất <span className="text-red-500">*</span>
          </label>
          <select
            value={branchId} onChange={e => setBranchId(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">— Chọn chi nhánh —</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
          </select>
          {touched && !branchId && <p className="text-red-500 text-xs mt-1">Bắt buộc</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Lý do xuất
          </label>
          <input
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Ví dụ: Thanh lý, hỏng hóc..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
          Danh sách sản phẩm <span className="text-red-500">*</span>
        </label>
        <LineEditor lines={lines} products={products} onChange={setLines} />
        {touched && validLines.length === 0 && (
          <p className="text-red-500 text-xs mt-1">Cần ít nhất 1 sản phẩm hợp lệ</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ghi chú</label>
        <textarea
          value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="Ghi chú nội bộ..."
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      {validLines.length > 0 && (
        <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-orange-800 font-bold">
          Tổng: {validLines.length} loại sản phẩm —{' '}
          {validLines.reduce((s, l) => s + Number(l.qty), 0)} đơn vị sẽ bị xuất khỏi kho
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          ⚠️ {actionError}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSubmit} disabled={actionLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold text-sm disabled:opacity-50"
        >
          {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : <><PackageMinus className="w-4 h-4" /> Tạo phiếu xuất</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ── IMPORT LIST TAB ───────────────────────────────────────────────────────────

function ImportTab({ hook }: { hook: HookReturn }) {
  const { imports, importTotal, importPages, importPage, setImportPage, importsLoading, handleExport } = hook;
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-lg">Phiếu Nhập Kho</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('IMPORTS')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Xuất XLSX
          </button>
          <button
            onClick={() => { setShowForm(v => !v); }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold"
          >
            {showForm ? <><X className="w-4 h-4" /> Đóng</> : <><Plus className="w-4 h-4" /> Tạo phiếu nhập</>}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && <CreateImportForm hook={hook} onClose={() => setShowForm(false)} />}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          {importsLoading ? 'Đang tải...' : `${importTotal.toLocaleString('vi-VN')} phiếu nhập`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Chi nhánh', 'Nhà cung cấp', 'Tổng SL', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importsLoading && imports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1" /> Đang tải...
                </td></tr>
              ) : imports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Không có phiếu nhập nào</td></tr>
              ) : imports.map((t: ImportTicketDto) => (
                <React.Fragment key={t.ticketId}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold text-sm">#{t.ticketId}</td>
                    <td className="px-4 py-3 text-gray-700">{t.branchName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{t.supplier ?? '—'}</td>
                    <td className="px-4 py-3 font-bold">{totalQty(t.lines)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDt(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === t.ticketId ? null : t.ticketId)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        {expanded === t.ticketId
                          ? <ChevronUp className="w-4 h-4 text-gray-500" />
                          : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                    </td>
                  </tr>
                  {expanded === t.ticketId && <LinesRow lines={t.lines} colSpan={7} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={importPage} total={importPages} onPage={setImportPage} loading={importsLoading} />
      </div>
    </div>
  );
}

// ── EXPORT LIST TAB ───────────────────────────────────────────────────────────

function ExportTab({ hook }: { hook: HookReturn }) {
  const { exports, exportTotal, exportPages, exportPage, setExportPage, exportsLoading, handleExport } = hook;
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-lg">Phiếu Xuất Kho</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('EXPORTS')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Xuất XLSX
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-bold"
          >
            {showForm ? <><X className="w-4 h-4" /> Đóng</> : <><Plus className="w-4 h-4" /> Tạo phiếu xuất</>}
          </button>
        </div>
      </div>

      {showForm && <CreateExportForm hook={hook} onClose={() => setShowForm(false)} />}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          {exportsLoading ? 'Đang tải...' : `${exportTotal.toLocaleString('vi-VN')} phiếu xuất`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Chi nhánh', 'Lý do', 'Tổng SL', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exportsLoading && exports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1" /> Đang tải...
                </td></tr>
              ) : exports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Không có phiếu xuất nào</td></tr>
              ) : exports.map((t: ExportTicketDto) => (
                <React.Fragment key={t.ticketId}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold text-sm">#{t.ticketId}</td>
                    <td className="px-4 py-3 text-gray-700">{t.branchName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm max-w-[160px] truncate" title={t.reason ?? ''}>{t.reason ?? '—'}</td>
                    <td className="px-4 py-3 font-bold">{totalQty(t.lines)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDt(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === t.ticketId ? null : t.ticketId)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        {expanded === t.ticketId
                          ? <ChevronUp className="w-4 h-4 text-gray-500" />
                          : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                    </td>
                  </tr>
                  {expanded === t.ticketId && <LinesRow lines={t.lines} colSpan={7} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={exportPage} total={exportPages} onPage={setExportPage} loading={exportsLoading} />
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function InventoryImportExport({ hook }: { hook: HookReturn }) {
  const [subTab, setSubTab] = useState<'import' | 'export'>('import');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Nhập / Xuất Kho</h2>
        <p className="text-gray-500 mt-1">Quản lý phiếu nhập và xuất kho</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['import', 'export'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
              subTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'import' ? '📥 Phiếu Nhập' : '📤 Phiếu Xuất'}
          </button>
        ))}
      </div>

      {subTab === 'import' && <ImportTab hook={hook} />}
      {subTab === 'export' && <ExportTab hook={hook} />}
    </div>
  );
}