import { useEffect, useState } from 'react';
import { Users, UserCheck, Flame, Ban } from 'lucide-react';
import { fetchCustomerStats, type CustomerStatsSummaryDto } from '../../api/customerApi';

const ICON_CONFIG = [
  { icon: Users,     iconClass: 'bg-blue-100 text-blue-600',   label: 'Tổng khách hàng',      meta: null },
  { icon: UserCheck, iconClass: 'bg-green-100 text-green-600', label: 'Khách hàng mới',        meta: 'Tháng này' },
  { icon: Flame,     iconClass: 'bg-orange-100 text-orange-600', label: 'Khách hàng hot',      meta: 'Chi tiêu cao' },
  { icon: Ban,       iconClass: 'bg-purple-100 text-purple-600', label: 'Tài khoản bị khóa',   meta: null },
];

export function CustomerStats() {
  const [stats, setStats] = useState<CustomerStatsSummaryDto | null>(null);

  useEffect(() => {
    fetchCustomerStats('month').then(setStats).catch(console.error);
  }, []);

  const values = stats
    ? [
        String(stats.totalCustomers),
        String(stats.newCustomers),
        String(stats.hotCustomers),
        String(stats.lockedAccounts),
      ]
    : ['—', '—', '—', '—'];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {ICON_CONFIG.map((cfg, index) => {
        const Icon = cfg.icon;
        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">{cfg.label}</div>
              <div className="text-xl font-black text-gray-900">{values[index]}</div>
              {cfg.meta && <div className="text-[11px] text-gray-500 mt-0.5">{cfg.meta}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}