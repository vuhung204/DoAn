import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-[var(--blue-light)]',
    green: 'bg-[var(--green-light)]',
    orange: 'bg-[var(--orange-light)]',
    purple: 'bg-[var(--purple-light)]',
  };

  const textColors = {
    blue: 'text-[var(--blue)]',
    green: 'text-[var(--green)]',
    orange: 'text-[var(--orange)]',
    purple: 'text-[var(--purple)]',
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 flex gap-3 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5 transition-all">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${bgColors[color]} ${textColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
        <div className="text-xl font-black text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}
