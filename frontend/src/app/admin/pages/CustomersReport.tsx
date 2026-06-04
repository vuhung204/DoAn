import { useState } from 'react';
import { CustomerStats } from '../components/CustomerStats';
import { CustomerList } from '../components/CustomerList';
import { CustomerDetail } from '../components/CustomerDetail';

export default function CustomersReport() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const handleViewCustomerDetail = (customerId: number) => {
    setSelectedCustomerId(customerId);
  };

  const handleBackToCustomerList = () => {
    setSelectedCustomerId(null);
  };

  return (
    <div>
      {selectedCustomerId === null ? (
        <>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Quản Lý Khách Hàng</h1>
            <p className="text-sm text-gray-600">Danh sách và tìm kiếm khách hàng</p>
          </div>

          {/* Stats */}
          <CustomerStats />

          {/* Customer List */}
          <CustomerList onViewDetail={handleViewCustomerDetail} />
        </>
      ) : (
        <CustomerDetail customerId={selectedCustomerId} onBack={handleBackToCustomerList} />
      )}
    </div>
  );
}