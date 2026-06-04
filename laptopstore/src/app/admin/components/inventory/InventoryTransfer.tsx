import React, { useState } from 'react';
import {
  Download, RefreshCw, ChevronDown, ChevronUp,
  ArrowRight, Plus, Trash2, ArrowRightLeft, Loader2, X,
} from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';
import type { TicketLineDto } from '../../api/inventoryApi';

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
function totalQty(lines: TicketLineDto[]) {
  return lines.reduce((s, l) => s + (l.qty ?? 0), 0);
}

// ── LinesRow ──────────────────────────────────────────────────────────────────

function LinesRow({ lines }: { lines: TicketLineDto[] }) {
  return (
    <tr>
      <td colSpan={8} className="px-6 py-0">
        <div className="bg-gray-50 border border-gray-200 rounded-lg my-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {['SKU', 'Tên sản phẩm', 'Số lượng'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ── Line editor ───────────────────────────────────────────────────────────────

interface LineItem { productId: string; qty: string; }
const emptyLine = (): LineItem => ({ productId: '', qty: '' });

function LineEditor({
  lines, products, onChange,
}: {
  lines: LineItem[];
  products: HookReturn['products'];
  onChange: (lines: LineItem[]) => void;
}) {
  const update = (i: number, field: keyof LineItem, val: string) =>
    onChange(lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i));
  const add    = () => onChange([...lines, emptyLine()]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
        <span>Sản phẩm</span><span>Số lượng</span><span />
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
          <select
            value={l.productId} onChange={e => update(i, 'productId', e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">— Chọn SP —</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>[{p.sku}] {p.name}</option>
            ))}
          </select>
          <input
            type="number" min={1} placeholder="SL"
            value={l.qty} onChange={e => update(i, 'qty', e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={() => remove(i)} disabled={lines.length <= 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-sm text-purple-600 font-bold hover:text-purple-800 mt-1">
        <Plus className="w-4 h-4" /> Thêm dòng
      </button>
    </div>
  );
}

// ── CREATE TRANSFER FORM ──────────────────────────────────────────────────────

function CreateTransferForm({ hook, onClose }: { hook: HookReturn; onClose: () => void }) {
  const { branches, products, handleCreateTransfer, actionLoading, actionError } = hook;

  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId,   setToBranchId]   = useState('');
  const [reason,       setReason]       = useState('');
  const [note,         setNote]         = useState('');
  const [lines,        setLines]        = useState<LineItem[]>([emptyLine()]);
  const [touched,      setTouched]      = useState(false);

  const validLines   = lines.filter(l => l.productId && Number(l.qty) > 0);
  const branchError  = fromBranchId && toBranchId && fromBranchId === toBranchId;
  const canSubmit    = fromBranchId && toBranchId && !branchError && validLines.length > 0;

  const fromBranch = branches.find(b => String(b.branchId) === fromBranchId);
  const toBranch   = branches.find(b => String(b.branchId) === toBranchId);

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await handleCreateTransfer({
      fromBranchId: Number(fromBranchId),
      toBranchId:   Number(toBranchId),
      reason:       reason.trim() || undefined,
      note:         note.trim()   || undefined,
      lines: validLines.map(l => ({
        productId: Number(l.productId),
        qty:       Number(l.qty),
      })),
    });
    if (!actionError) onClose();
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-purple-600" /> Tạo phiếu chuyển kho
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Branch selector — visual arrow */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
          Tuyến chuyển kho <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <select
              value={fromBranchId} onChange={e => setFromBranchId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">— Chi nhánh xuất —</option>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId} disabled={String(b.branchId) === toBranchId}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-2">
            <ArrowRight className="w-6 h-6 text-purple-500" />
            {fromBranch && toBranch && (
              <span className="text-xs text-purple-500 font-bold whitespace-nowrap">chuyển tới</span>
            )}
          </div>

          <div className="flex-1">
            <select
              value={toBranchId} onChange={e => setToBranchId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">— Chi nhánh nhận —</option>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId} disabled={String(b.branchId) === fromBranchId}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation messages */}
        {touched && !fromBranchId && (
          <p className="text-red-500 text-xs mt-1">Chọn chi nhánh xuất</p>
        )}
        {touched && !toBranchId && (
          <p className="text-red-500 text-xs mt-1">Chọn chi nhánh nhận</p>
        )}
        {branchError && (
          <p className="text-red-500 text-xs mt-1">Chi nhánh xuất và nhận không được trùng nhau</p>
        )}

        {/* Preview route */}
        {fromBranch && toBranch && !branchError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2 font-bold">
            <span>{fromBranch.name}</span>
            <ArrowRight className="w-4 h-4" />
            <span>{toBranch.name}</span>
            <span className="ml-auto text-xs font-normal text-purple-500">
              Tồn kho hiện tại: {fromBranch.totalQuantity} sp
            </span>
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Lý do chuyển</label>
        <input
          value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Ví dụ: Cân bằng tồn kho, điều phối nhu cầu..."
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Line items */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
          Sản phẩm chuyển kho <span className="text-red-500">*</span>
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
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>

      {/* Summary */}
      {validLines.length > 0 && fromBranch && toBranch && !branchError && (
        <div className="bg-purple-50 rounded-lg px-4 py-3 text-sm text-purple-800 font-bold flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Chuyển {validLines.reduce((s, l) => s + Number(l.qty), 0)} đơn vị
          ({validLines.length} loại SP) từ <b>{fromBranch.name}</b> → <b>{toBranch.name}</b>
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
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-sm disabled:opacity-50"
        >
          {actionLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
            : <><ArrowRightLeft className="w-4 h-4" /> Tạo phiếu chuyển kho</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function InventoryTransfer({ hook }: { hook: HookReturn }) {
  const {
    transfers, transferTotal, transferPages, transferPage,
    setTransferPage, transfersLoading, handleExport, refresh,
  } = hook;

  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Chuyển Kho</h2>
          <p className="text-gray-500 mt-1">Quản lý phiếu chuyển kho giữa các chi nhánh</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh} disabled={transfersLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${transfersLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button
            onClick={() => handleExport('TRANSFERS')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Xuất XLSX
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold"
          >
            {showForm ? <><X className="w-4 h-4" /> Đóng</> : <><Plus className="w-4 h-4" /> Tạo phiếu chuyển</>}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && <CreateTransferForm hook={hook} onClose={() => setShowForm(false)} />}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          {transfersLoading ? 'Đang tải...' : `${transferTotal.toLocaleString('vi-VN')} phiếu chuyển kho`}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Từ chi nhánh', '', 'Đến chi nhánh', 'Tổng SL', 'Trạng thái', 'Ngày tạo', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transfersLoading && transfers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải...
                </td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Không có phiếu chuyển kho nào
                </td></tr>
              ) : transfers.map(t => (
                <React.Fragment key={t.ticketId}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-purple-600 font-bold text-sm">#{t.ticketId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{t.fromBranchName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400"><ArrowRight className="w-4 h-4" /></td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{t.toBranchName ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{totalQty(t.lines)}</td>
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
                  {expanded === t.ticketId && <LinesRow lines={t.lines} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">Trang <b>{transferPage + 1}</b> / {transferPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setTransferPage(p => Math.max(0, p - 1))} disabled={transferPage <= 0 || transfersLoading}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-bold text-sm">Trước</button>
            <button onClick={() => setTransferPage(p => Math.min(transferPages - 1, p + 1))} disabled={transferPage >= transferPages - 1 || transfersLoading}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 font-bold text-sm">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}