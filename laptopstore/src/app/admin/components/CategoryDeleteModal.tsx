import { Trash2, Loader2 } from 'lucide-react';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  categoryName: string;
  childrenCount: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CategoryDeleteModal({
  isOpen, categoryName, childrenCount,
  loading, onConfirm, onCancel,
}: CategoryDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={e => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div className="bg-white rounded-2xl w-[380px] max-w-[95vw] px-8 pt-7 pb-6 text-center shadow-2xl">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3.5">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-black mb-2 text-gray-900">Xác nhận xoá?</h3>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Danh mục "<strong>{categoryName}</strong>" sẽ bị xoá.
          {childrenCount > 0 && (
            <span className="text-xs text-orange-600 font-semibold block mt-1">
              ⚠️ {childrenCount} danh mục con sẽ bị xoá theo!
            </span>
          )}
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xoá...</>
              : <><Trash2 className="w-4 h-4" /> Xoá</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}