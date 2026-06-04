import { Trash2 } from 'lucide-react';

interface BrandDeleteModalProps {
  isOpen: boolean;
  brandName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BrandDeleteModal({
  isOpen,
  brandName,
  onConfirm,
  onCancel,
}: BrandDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl max-w-[400px] w-[92%] p-7 pb-6 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300">
        <div className="w-14 h-14 bg-red-100 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-3.5">
          <Trash2 className="w-5.5 h-5.5 text-red-600" />
        </div>
        <h3 className="font-black mb-2 text-gray-900">Xác nhận xoá?</h3>
        <p className="text-sm text-gray-600 mb-5.5 leading-relaxed">
          Thương hiệu "<strong>{brandName}</strong>" sẽ bị xoá vĩnh viễn.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2.5 border border-gray-300 bg-white rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
