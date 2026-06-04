import React from 'react';
import { SystemSettings } from '../components/SystemSettings';
import { Toast } from '../components/Toast';
import { useSystem } from '../hooks/useSystem';

export default function SystemPage() {
  const hook = useSystem();

  return (
    <div className="p-8">
      <SystemSettings hook={hook} />
      <Toast message={hook.toast} isVisible={hook.toastVisible} onHide={() => {}} />
    </div>
  );
}