import { Users, UserCheck, Flame, Ban } from 'lucide-react';

const stats = [
  {
    icon: Users,
    iconClass: 'bg-blue-100 text-blue-600',
    label: 'Tổng khách hàng',
    value: '2,456',
    meta: null,
  },
  {
    icon: UserCheck,
    iconClass: 'bg-green-100 text-green-600',
    label: 'Khách hàng mới',
    value: '84',
    meta: 'Tháng này',
  },
  {
    icon: Flame,
    iconClass: 'bg-orange-100 text-orange-600',
    label: 'Khách hàng hot',
    value: '32',
    meta: 'Mua 5+ lần',
  },
  {
    icon: Ban,
    iconClass: 'bg-purple-100 text-purple-600',
    label: 'Tài khoản bị khóa',
    value: '5',
    meta: null,
  },
];

export function CustomerStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
              {stat.meta && <div className="text-[11px] text-gray-500 mt-0.5">{stat.meta}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
