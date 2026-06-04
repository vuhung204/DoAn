import React from 'react';
import RefundList from '../components/RefundList';
import RefundDetailModal from '../components/RefundDetailModal';
import RefundProcessModal from '../components/RefundProcessModal';
import { useRefunds } from '../hooks/useRefunds';

export default function RefundsPage() {
  const hook = useRefunds(10);

  return (
    <div>
      <RefundList hook={hook} />

      {hook.selectedId !== null && (
        <RefundDetailModal
          detail={hook.detail}
          loading={hook.detailLoading}
          onClose={hook.closeDetail}
          onProcess={hook.openProcess}
        />
      )}

      {hook.processingId !== null && (
        <RefundProcessModal
          refundId={hook.processingId}
          summary={hook.refunds.find(r => r.id === hook.processingId) ?? null}
          currentStatus={
            hook.refunds.find(r => r.id === hook.processingId)?.status ?? 'waiting'
          }
          onClose={hook.closeProcess}
          onApprove={hook.handleApprove}
          onReject={hook.handleReject}
          onComplete={hook.handleComplete}
          loading={hook.actionLoading}
          error={hook.actionError}
        />
      )}

      {hook.toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg font-bold z-[100]">
          {hook.toast}
        </div>
      )}
    </div>
  );
}