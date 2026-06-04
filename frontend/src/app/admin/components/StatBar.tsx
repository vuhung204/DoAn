interface StatItem {
  label: string;
  value: number;
  colorClass: string;
}

interface StatBarProps {
  stats: StatItem[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <div className="text-sm text-gray-600 mb-1.5">{stat.label}</div>
          <div className={`text-3xl font-black ${stat.colorClass}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
