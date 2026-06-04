import React, { useState } from 'react';
import { Building2, Users } from 'lucide-react';
import { StoreList } from './system/StoreList';
import { StaffList } from './system/StaffList';
import { StoreForm } from './system/StoreForm';
import { StaffForm } from './system/StaffForm';
import type { useSystem } from '../hooks/useSystem';

type HookReturn = ReturnType<typeof useSystem>;

export function SystemSettings({ hook }: { hook: HookReturn }) {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Hệ Thống</h1>
        <p className="text-sm text-[var(--text-muted)]">Quản lý chi nhánh và nhân viên</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--card-border)]">
        {([
          { id: 'stores', label: 'Chi Nhánh', icon: Building2 },
          { id: 'staff',  label: 'Nhân Viên', icon: Users },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { hook.setTab(tab.id); hook.backToList(); }}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                hook.tab === tab.id
                  ? 'border-[var(--blue)] text-[var(--blue)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {hook.view === 'list' && hook.tab === 'stores' && <StoreList hook={hook} />}
      {hook.view === 'list' && hook.tab === 'staff'  && <StaffList hook={hook} />}
      {hook.view === 'form' && hook.formType === 'store' && <StoreForm hook={hook} />}
      {hook.view === 'form' && hook.formType === 'staff'  && <StaffForm hook={hook} />}
    </div>
  );
}