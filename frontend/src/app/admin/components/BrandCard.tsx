import { Edit, Trash2 } from 'lucide-react';
import type { BrandDto } from '../api/brandApi';

interface BrandCardProps {
  brand: BrandDto;
  color: string;
  index: number;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export function BrandCard({ brand, color, index, onEdit, onDelete }: BrandCardProps) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Banner */}
      <div
        className="h-22 flex items-center justify-center text-5xl font-black text-white/95 relative"
        style={{
          background: `linear-gradient(135deg, ${color}aa, ${color})`,
          textShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div className="relative z-10">{brand.name[0].toUpperCase()}</div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/5 pointer-events-none" />
      </div>

      {/* Body */}
      <div className="p-4.5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-lg font-black text-gray-900 tracking-tight">{brand.name}</span>
          <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700">
            {brand.productCount} sản phẩm
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${brand.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {brand.active ? 'Hoạt động' : 'Tạm ngưng'}
          </span>
        </div>

        {/* description từ BE (thay vì desc) */}
        <div className="text-sm text-gray-600 leading-snug mb-3.5 min-h-[40px] line-clamp-2 flex-1">
          {brand.description ?? '—'}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 mt-auto border-t border-gray-200">
          <button
            onClick={() => onEdit(brand.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />Sửa
          </button>
          <button
            onClick={() => onDelete(brand.id, brand.name)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}