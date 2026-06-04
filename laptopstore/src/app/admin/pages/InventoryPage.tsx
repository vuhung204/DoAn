import React from 'react';
import Inventory from '../components/Inventory';
import { useInventory } from '../hooks/useInventory';

export default function InventoryPage() {
  const hook = useInventory();

  return (
    <>
      <Inventory hook={hook} />

      {hook.toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg font-bold z-[100]">
          {hook.toast}
        </div>
      )}
    </>
  );
}