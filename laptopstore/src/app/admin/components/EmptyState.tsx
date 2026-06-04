import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
      <PackageOpen className="w-13 h-13 text-gray-300 mx-auto mb-4" />
      <h3 className="font-black text-gray-700 mb-1.5">Không tìm thấy sản phẩm</h3>
      <p className="text-gray-500 mb-4.5">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
      <button
        onClick={onClearFilters}
        className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}
