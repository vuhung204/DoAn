import React, { useState } from 'react';
import { Sliders, Loader2, Search } from 'lucide-react';
import type { useInventory } from '../../hooks/useInventory';

type HookReturn = ReturnType<typeof useInventory>;

export default function InventoryAdjust({ hook }: { hook: HookReturn }) {
  const { branches, products, productsLoading, handleAdjustStock, actionLoading, actionError } = hook;

  const [productId, setProductId]   = useState('');
  const [branchId, setBranchId]     = useState('');
  const [delta, setDelta]           = useState('');
  const [reason, setReason]         = useState('');
  const [submitted, setSubmitted]   = useState(false);

  const isValid = productId && branchId && delta && delta !== '0';

  const handleSubmit = async () => {
    if (!isValid) return;
    await handleAdjustStock({
      productId: Number(productId),
      branchId:  Number(branchId),
      delta:     Number(delta),
      reason:    reason.trim() || undefined,
    });
    // Reset form khi thành công
    if (!actionError) {
      setProductId('');
      setBranchId('');
      setDelta('');
      setReason('');
      setSubmitted(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Điều Chỉnh Tồn Kho</h2>
        <p className="text-gray-500 mt-1">Tăng hoặc giảm số lượng tồn kho thủ công</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">

        {/* Product select */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
            Sản phẩm <span className="text-red-500">*</span>
          </label>
          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            disabled={productsLoading}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">— Chọn sản phẩm —</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>
                [{p.sku}] {p.name}
              </option>
            ))}
          </select>
          {submitted && !productId && (
            <p className="text-red-500 text-xs mt-1">Vui lòng chọn sản phẩm</p>
          )}
        </div>

        {/* Branch select */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
            Chi nhánh <span className="text-red-500">*</span>
          </label>
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Chọn chi nhánh —</option>
            {branches.map(b => (
              <option key={b.branchId} value={b.branchId}>{b.name}</option>
            ))}
          </select>
          {submitted && !branchId && (
            <p className="text-red-500 text-xs mt-1">Vui lòng chọn chi nhánh</p>
          )}
        </div>

        {/* Delta */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
            Số lượng điều chỉnh <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              placeholder="Dương = nhập thêm, âm = giảm. Ví dụ: +10 hoặc -3"
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {delta && Number(delta) !== 0 && (
            <p className={`text-xs mt-1 font-bold ${Number(delta) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(delta) > 0 ? `▲ Tăng ${Number(delta)} đơn vị` : `▼ Giảm ${Math.abs(Number(delta))} đơn vị`}
            </p>
          )}
          {submitted && (!delta || delta === '0') && (
            <p className="text-red-500 text-xs mt-1">Delta phải khác 0</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
            Lý do điều chỉnh
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Ví dụ: Kiểm kho định kỳ, hàng bị hỏng, nhập bù..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            ⚠️ {actionError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => { setSubmitted(true); handleSubmit(); }}
          disabled={actionLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
            : <><Sliders className="w-4 h-4" /> Xác nhận điều chỉnh</>
          }
        </button>
      </div>
    </div>
  );
}