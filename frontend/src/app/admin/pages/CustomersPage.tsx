import { useState } from 'react';
import { CustomerStats } from '../components/customer/CustomerStats';
import { CustomerList } from '../components/customer/CustomerList';
import { CustomerDetail } from '../components/customer/CustomerDetail';

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  return (
    <div className="p-6">
      {selectedCustomerId === null ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Quản Lý Khách Hàng</h1>
            <p className="text-sm text-gray-600">Danh sách và tìm kiếm khách hàng</p>
          </div>
          <CustomerStats />
          <CustomerList onViewDetail={setSelectedCustomerId} />
        </>
      ) : (
        <CustomerDetail
          customerId={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}