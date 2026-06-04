import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ isOpen, productName, onConfirm, onCancel }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl p-9 max-w-[420px] w-[92%] text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5.5 h-5.5 text-red-600" />
        </div>
        <h3 className="font-black mb-2">Xác nhận xoá?</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Sản phẩm "<strong>{productName}</strong>" sẽ bị xoá vĩnh viễn và không thể khôi phục.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2.75 border border-gray-300 bg-white rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2.75 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
          >
            Xoá sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
