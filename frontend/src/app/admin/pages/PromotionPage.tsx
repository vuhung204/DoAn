import React from 'react';
import { PromoList } from '../components/promotion/PromoList';
import { PromoForm } from '../components/promotion/PromoForm';
import { Toast } from '../components/Toast';
import { usePromotions } from '../hooks/usePromotions';

export default function PromotionPage() {
  const hook = usePromotions();

  return (
    <>
      {hook.view === 'list' ? (
        <PromoList hook={hook} />
      ) : (
        <PromoForm hook={hook} />
      )}

      <Toast
        message={hook.toast}
        isVisible={hook.toastVisible}
        onHide={() => {}}
      />
    </>
  );
}