import React, { useState } from 'react';
import OrderList from '../components/OrderList';
import OrderDetail from '../components/OrderDetail';

export default function OrdersPage() {
  const [selectedOrderRef, setSelectedOrderRef] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div>
      {selectedOrderRef ? (
        <OrderDetail
          orderRef={selectedOrderRef}
          onBack={() => setSelectedOrderRef(null)}
          showToast={showToast}
        />
      ) : (
        <OrderList onSelectOrder={(ref) => setSelectedOrderRef(ref)} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}