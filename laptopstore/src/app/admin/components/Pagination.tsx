interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between pt-1 pb-0.5">
      <span className="text-sm text-gray-500">
        Trang {currentPage} / {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-1.75 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:border-gray-300 disabled:hover:text-gray-700"
        >
          Trước
        </button>
        <div className="flex gap-1.25">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8.5 h-8.5 border rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-1.75 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:border-gray-300 disabled:hover:text-gray-700"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
