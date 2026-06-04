import { useState } from 'react';
import { PieChart, GitBranch, ArrowLeftRight, Sliders, AlertCircle, ArrowRightLeft } from 'lucide-react';
import InventoryOverview    from './inventory/InventoryOverview';
import InventoryByBranch    from './inventory/InventoryByBranch';
import InventoryImportExport from './inventory/InventoryImportExport';
import InventoryAdjust      from './inventory/InventoryAdjust';
import InventoryAlerts      from './inventory/InventoryAlerts';
import InventoryTransfer    from './inventory/InventoryTransfer';
import type { useInventory } from '../hooks/useInventory';

type HookReturn = ReturnType<typeof useInventory>;

interface InventoryProps {
  hook: HookReturn;
}

type TabId = 'overview' | 'by-branch' | 'import-export' | 'adjust' | 'alerts' | 'transfer';

const TABS = [
  { id: 'overview',       label: 'Tổng quát',       icon: PieChart      },
  { id: 'by-branch',      label: 'Theo chi nhánh',  icon: GitBranch     },
  { id: 'import-export',  label: 'Nhập/Xuất',       icon: ArrowLeftRight },
  { id: 'adjust',         label: 'Điều chỉnh',      icon: Sliders       },
  { id: 'alerts',         label: 'Cảnh báo',        icon: AlertCircle   },
  { id: 'transfer',       label: 'Chuyển kho',      icon: ArrowRightLeft },
] as const;

export default function Inventory({ hook }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {/* Badge cảnh báo */}
              {tab.id === 'alerts' && hook.alerts.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {hook.alerts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview'      && <InventoryOverview    hook={hook} />}
        {activeTab === 'by-branch'     && <InventoryByBranch    hook={hook} />}
        {activeTab === 'import-export' && <InventoryImportExport hook={hook} />}
        {activeTab === 'adjust'        && <InventoryAdjust      hook={hook} />}
        {activeTab === 'alerts'        && <InventoryAlerts      hook={hook} />}
        {activeTab === 'transfer'      && <InventoryTransfer    hook={hook} />}
      </div>
    </div>
  );
}