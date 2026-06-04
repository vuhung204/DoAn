import { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, subtitle, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">{title}</h1>
        {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
      </div>
      <div className="text-center py-20 px-5 bg-white rounded-xl border border-gray-200">
        <Icon className="w-12 h-12 text-gray-200 mx-auto mb-3.5" />
        <p className="text-gray-500 text-[15px]">Trang {title} đang phát triển</p>
      </div>
    </div>
  );
}
