// src/pages/AdminWarrantyPage.tsx
import { useState } from 'react';
import WarrantyList from '../components/warranty/WarrantyList';
import WarrantyDetail from '../components/warranty/WarrantyDetail';

export default function AdminWarrantyPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div>
      {selectedId !== null ? (
        <WarrantyDetail
          warrantyId={selectedId}
          onBack={() => setSelectedId(null)}
          showToast={showToast}
        />
      ) : (
        <WarrantyList onSelectWarranty={id => setSelectedId(id)} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg font-bold z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}