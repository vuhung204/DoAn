export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  joined: string;
  status: 'active' | 'inactive' | 'locked';
  type: 'new' | 'regular' | 'vip';
  orders: Order[];
  addresses: Address[];
}

export interface Order {
  id: string;
  total: number;
  payment: string;
  status: 'done' | 'processing';
  date: string;
}

export interface Address {
  id: number;
  label: string;
  text: string;
  default: boolean;
}

export const CUSTOMERS_DATA: Customer[] = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'nva@email.com',
    phone: '0912345678',
    dob: '1990-05-15',
    address: '123 Đường Hoàn Kiếm, Hà Nội',
    totalOrders: 12,
    totalSpent: 145000000,
    joined: '2024-01-15',
    status: 'active',
    type: 'regular',
    orders: [
      { id: 'ORD001', total: 45000000, payment: 'Thanh toán đủ', status: 'done', date: '2026-03-20' },
      { id: 'ORD002', total: 32000000, payment: 'Chuyển khoản', status: 'done', date: '2026-02-10' },
    ],
    addresses: [
      { id: 1, label: 'Nhà riêng', text: '123 Đường Hoàn Kiếm, Hoàn Kiếm, Hà Nội', default: true },
      { id: 2, label: 'Cơ quan', text: '456 Đường Cầu Giấy, Cầu Giấy, Hà Nội', default: false },
    ],
  },
  {
    id: 2,
    name: 'Trần Thị B',
    email: 'ttb@email.com',
    phone: '0987654321',
    dob: '1995-08-22',
    address: '456 Đường Quận 1, TP.HCM',
    totalOrders: 28,
    totalSpent: 320000000,
    joined: '2023-06-10',
    status: 'active',
    type: 'vip',
    orders: [
      { id: 'ORD015', total: 25000000, payment: 'Chuyển khoản', status: 'done', date: '2026-04-15' },
      { id: 'ORD012', total: 38000000, payment: 'Thanh toán đủ', status: 'done', date: '2026-04-01' },
    ],
    addresses: [
      { id: 1, label: 'Nhà riêng', text: '456 Đường Quận 1, Quận 1, TP.HCM', default: true },
    ],
  },
  {
    id: 3,
    name: 'Lê Văn C',
    email: 'lvc@email.com',
    phone: '0901234567',
    dob: '1988-12-03',
    address: '789 Đường Cầu Giấy, Hà Nội',
    totalOrders: 5,
    totalSpent: 75000000,
    joined: '2026-02-20',
    status: 'active',
    type: 'new',
    orders: [],
    addresses: [],
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    email: 'ptd@email.com',
    phone: '0909876543',
    dob: '1992-03-10',
    address: '321 Đường Bình Thạnh, TP.HCM',
    totalOrders: 18,
    totalSpent: 195000000,
    joined: '2023-11-05',
    status: 'active',
    type: 'regular',
    orders: [],
    addresses: [],
  },
  {
    id: 5,
    name: 'Hoàng Văn E',
    email: 'hve@email.com',
    phone: '0911223344',
    dob: '1985-07-18',
    address: '654 Đường Hai Bà Trưng, Hà Nội',
    totalOrders: 2,
    totalSpent: 28000000,
    joined: '2026-03-01',
    status: 'inactive',
    type: 'new',
    orders: [],
    addresses: [],
  },
  {
    id: 6,
    name: 'Đỗ Thị F',
    email: 'dtf@email.com',
    phone: '0922334455',
    dob: '1998-11-25',
    address: '987 Đường Tân Bình, TP.HCM',
    totalOrders: 0,
    totalSpent: 0,
    joined: '2026-04-10',
    status: 'locked',
    type: 'new',
    orders: [],
    addresses: [],
  },
];
