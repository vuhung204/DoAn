import { Award } from 'lucide-react';

export function BrandEmptyState() {
  return (
    <div className="text-center p-16 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
      <Award className="w-13 h-13 text-gray-300 mx-auto mb-3.5 opacity-85" />
      <p className="font-semibold">Chưa có thương hiệu nào.</p>
    </div>
  );
}
