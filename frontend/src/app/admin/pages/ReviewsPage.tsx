import React from 'react';
import { ReviewStats } from '../components/ReviewStats';
import { ReviewList } from '../components/ReviewList';

export default function ReviewsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Quản Lý Đánh Giá</h1>
        <p className="text-sm text-gray-600">Duyệt, ẩn/hiện và phản hồi đánh giá sản phẩm</p>
      </div>

      <ReviewStats />

      <ReviewList />
    </div>
  );
}