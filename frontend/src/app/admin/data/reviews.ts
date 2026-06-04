export interface Review {
  id: number;
  productName: string;
  customerName: string;
  email: string;
  rating: number;
  title: string;
  text: string;
  images: number;
  date: string;
  status: 'pending' | 'approved' | 'hidden';
  reply: {
    by: string;
    text: string;
  } | null;
}

export const REVIEWS_DATA: Review[] = [
  {
    id: 1,
    productName: 'MSI Creator M16 HX',
    customerName: 'Nguyễn Văn A',
    email: 'nva@email.com',
    rating: 5,
    title: 'Sản phẩm tuyệt vời!',
    text: 'Laptop rất mạnh mẽ, hiệu năng xử lý công việc lập trình rất tốt. Màn hình sắc nét, pin đủ dùng cả ngày làm việc.',
    images: 3,
    date: '2026-04-05',
    status: 'pending',
    reply: null,
  },
  {
    id: 2,
    productName: 'Asus ROG Strix G16',
    customerName: 'Trần Thị B',
    email: 'ttb@email.com',
    rating: 4,
    title: 'Tốt nhưng hơi nóng',
    text: 'Hiệu năng chơi game rất tốt, fps luôn cao 60-144 FPS. Chỉ có điểm yếu là nhiệt độ hơi cao khi chơi game nặng.',
    images: 0,
    date: '2026-04-03',
    status: 'approved',
    reply: { by: 'Admin', text: 'Cảm ơn bạn đã chia sẻ. Chúng tôi khuyến cáo sử dụng đệm tản nhiệt để tối ưu hóa.' },
  },
  {
    id: 3,
    productName: 'Dell XPS 13 9340',
    customerName: 'Lê Văn C',
    email: 'lvc@email.com',
    rating: 3,
    title: 'Bình thường',
    text: 'Laptop nhỏ gọn, dễ mang theo. Nhưng hiệu năng không mạnh bằng các laptop khác ở mức giá tương tự.',
    images: 1,
    date: '2026-04-01',
    status: 'hidden',
    reply: null,
  },
  {
    id: 4,
    productName: 'Lenovo ThinkPad Pro',
    customerName: 'Phạm Thế D',
    email: 'ptd@email.com',
    rating: 5,
    title: 'Xuất sắc cho lập trình viên',
    text: 'Bàn phím rất thoải mái, pin tuổi thọ tốt. Đây là laptop hoàn hảo cho developer.',
    images: 2,
    date: '2026-03-30',
    status: 'approved',
    reply: { by: 'Admin', text: 'Cảm ơn đánh giá tích cực. Hy vọng bạn sẽ tiếp tục ưa thích sản phẩm của chúng tôi!' },
  },
  {
    id: 5,
    productName: 'HP Pavilion 15',
    customerName: 'Vũ Ngọc E',
    email: 'vne@email.com',
    rating: 2,
    title: 'Không đáng tiền',
    text: 'Nhiệt độ rất cao, pin yếu. Không thể dùng lâu mà không cần sạc. Rất hối hận khi mua.',
    images: 0,
    date: '2026-03-28',
    status: 'approved',
    reply: null,
  },
];
