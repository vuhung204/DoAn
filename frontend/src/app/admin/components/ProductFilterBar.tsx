import { Search, Filter, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterBrand: string;
  onBrandChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  brands: string[];
  categories: string[];
}

export function ProductFilterBar({
  search,
  onSearchChange,
  filterBrand,
  onBrandChange,
  filterCategory,
  onCategoryChange,
  filterStatus,
  onStatusChange,
  onClearFilters,
  brands,
  categories,
}: ProductFilterBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên, SKU..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50"
        />
      </div>

      {/* Filter icon */}
      <Filter className="w-3.5 h-3.5 text-gray-400" />

      {/* Brand filter */}
      <CustomSelect
        label={filterBrand || 'Tất cả thương hiệu'}
        options={[{ label: 'Tất cả thương hiệu', value: '' }, ...brands.map((b) => ({ label: b, value: b }))]}
        value={filterBrand}
        onChange={onBrandChange}
        isFiltered={!!filterBrand}
      />

      {/* Category filter */}
      <CustomSelect
        label={filterCategory || 'Tất cả danh mục'}
        options={[
          { label: 'Tất cả danh mục', value: '' },
          ...categories.map((c) => ({ label: c, value: c })),
        ]}
        value={filterCategory}
        onChange={onCategoryChange}
        isFiltered={!!filterCategory}
      />

      {/* Status filter */}
      <CustomSelect
        label={filterStatus ? (filterStatus === 'visible' ? 'Hiện thị' : 'Ẩn') : 'Tất cả trạng thái'}
        options={[
          { label: 'Tất cả trạng thái', value: '' },
          { label: 'Hiện thị', value: 'visible' },
          { label: 'Ẩn', value: 'hidden' },
        ]}
        value={filterStatus}
        onChange={onStatusChange}
        isFiltered={!!filterStatus}
      />
    </div>
  );
}

interface CustomSelectProps {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  isFiltered?: boolean;
}

function CustomSelect({ label, options, value, onChange, isFiltered }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors min-w-[150px] justify-between ${
          isFiltered
            ? 'border-blue-600 bg-blue-50 text-blue-600'
            : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-white'
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors border-b border-gray-100 last:border-0 ${
                option.value === value
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
