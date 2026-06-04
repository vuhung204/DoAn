// Dữ liệu mẫu (mock) được tách ra từ App.tsx
import { Order } from '../types/orders';
import { Refund } from '../types/refund';
import {
  BranchInventory,
  ProductInventory,
  ImportTicket,
  ExportTicket,
  InventoryAlert,
  TransferTicket
} from '../types/inventory';

export const ORDERS: Order[] = [
  {
    id: 'ORD-20260405-0001',
    customer: 'Nguyễn Văn A',
    branch: 'Hoàn Kiếm',
    total: 34990000,
    products: [{ name: 'MacBook Air M3 13 inch', sku: 'AP-MBA-M3-13', qty: 1, price: 29990000 }],
    payment: 'Chuyển khoản',
    payStatus: 'Đã thanh toán',
    status: 'done',
    date: '2026-04-05 10:30',
    phone: '0912345678',
    email: 'nguyenvana@email.com',
    address: '123 Nguyễn Huệ, Q1, HCM',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-05 10:30', done: true },
      { label: 'Đã xác nhận', time: '2026-04-05 10:35', done: true },
      { label: 'Đang xử lý', time: '2026-04-05 11:00', done: true },
      { label: 'Đang giao hàng', time: '2026-04-05 14:00', done: true },
      { label: 'Hoàn thành', time: '2026-04-05 17:30', done: true }
    ]
  },
  {
    id: 'ORD-20260405-0002',
    customer: 'Trần Thị B',
    branch: 'Quận 1',
    total: 29990000,
    products: [{ name: 'Apple MacBook Air M3', sku: 'AP-MBA-M3-13', qty: 1, price: 29990000 }],
    payment: 'COD',
    payStatus: 'Chưa thanh toán',
    status: 'shipping',
    date: '2026-04-05 11:15',
    phone: '0987654321',
    email: 'tranthib@email.com',
    address: '456 Lê Lợi, Q1, HCM',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-05 11:15', done: true },
      { label: 'Đã xác nhận', time: '2026-04-05 11:30', done: true },
      { label: 'Đang xử lý', time: '2026-04-05 12:00', done: true },
      { label: 'Đang giao hàng', time: '2026-04-05 15:00', done: true },
      { label: 'Hoàn thành', time: '', done: false }
    ]
  },
  {
    id: 'ORD-20260405-0003',
    customer: 'Lê Văn C',
    branch: 'Cầu Giấy',
    total: 52480000,
    products: [
      { name: 'Asus ROG Strix G16 G614JV', sku: 'AS-ROG-G16-G614JV', qty: 1, price: 32990000 },
      { name: 'Dell XPS 13 9340', sku: 'DE-XPS13-9340', qty: 1, price: 32990000 }
    ],
    payment: 'MoMo',
    payStatus: 'Đã thanh toán',
    status: 'processing',
    date: '2026-04-05 14:20',
    phone: '0912345678',
    email: 'levanc@email.com',
    address: '123 Nguyễn Trãi, P3, Q5, HCM',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-05 14:20', done: true },
      { label: 'Đã xác nhận', time: '2026-04-05 14:25', done: true },
      { label: 'Đang xử lý', time: '2026-04-05 14:30', done: true },
      { label: 'Đang giao hàng', time: '', done: false },
      { label: 'Hoàn thành', time: '', done: false }
    ]
  },
  {
    id: 'ORD-20260404-0125',
    customer: 'Phạm Thị D',
    branch: 'Bình Thạnh',
    total: 17490000,
    products: [{ name: 'Asus TUF Gaming A15', sku: 'AS-TUF-A15-FA506NF', qty: 1, price: 17490000 }],
    payment: 'VNPay',
    payStatus: 'Đã thanh toán',
    status: 'confirmed',
    date: '2026-04-04 16:45',
    phone: '0901234567',
    email: 'phamthid@email.com',
    address: '789 Đinh Tiên Hoàng, Q1, HCM',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-04 16:45', done: true },
      { label: 'Đã xác nhận', time: '2026-04-04 16:50', done: true },
      { label: 'Đang xử lý', time: '', done: false },
      { label: 'Đang giao hàng', time: '', done: false },
      { label: 'Hoàn thành', time: '', done: false }
    ]
  },
  {
    id: 'ORD-20260404-0124',
    customer: 'Hoàng Văn E',
    branch: 'Hoàn Kiếm',
    total: 67980000,
    products: [
      { name: 'MSI Creator M16 HX', sku: 'MS-CRM16-HX', qty: 1, price: 37990000 },
      { name: 'Lenovo ThinkPad E14', sku: 'LV-TPE14-GEN5', qty: 1, price: 20990000 }
    ],
    payment: 'Chuyển khoản',
    payStatus: 'Đã thanh toán',
    status: 'done',
    date: '2026-04-04 09:30',
    phone: '0923456789',
    email: 'hoangvane@email.com',
    address: '12 Trần Hưng Đạo, HK, HN',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-04 09:30', done: true },
      { label: 'Đã xác nhận', time: '2026-04-04 09:40', done: true },
      { label: 'Đang xử lý', time: '2026-04-04 10:00', done: true },
      { label: 'Đang giao hàng', time: '2026-04-04 14:00', done: true },
      { label: 'Hoàn thành', time: '2026-04-04 17:00', done: true }
    ]
  },
  {
    id: 'ORD-20260403-0089',
    customer: 'Vũ Thị F',
    branch: 'Hải Phòng',
    total: 22490000,
    products: [{ name: 'Lenovo ThinkPad E14 Gen 5', sku: 'LV-TPE14-GEN5', qty: 1, price: 20990000 }],
    payment: 'COD',
    payStatus: 'Chưa thanh toán',
    status: 'pending',
    date: '2026-04-03 15:20',
    phone: '0934567890',
    email: 'vuthif@email.com',
    address: '55 Lê Thánh Tông, HP',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-03 15:20', done: true },
      { label: 'Đã xác nhận', time: '', done: false },
      { label: 'Đang xử lý', time: '', done: false },
      { label: 'Đang giao hàng', time: '', done: false },
      { label: 'Hoàn thành', time: '', done: false }
    ]
  },
  {
    id: 'ORD-20260403-0088',
    customer: 'Đỗ Văn G',
    branch: 'Quận 1',
    total: 15000000,
    products: [{ name: 'Asus TUF Gaming A15', sku: 'AS-TUF-A15-FA506NF', qty: 1, price: 17490000 }],
    payment: 'VNPay',
    payStatus: 'Hoàn tiền',
    status: 'cancelled',
    date: '2026-04-03 14:10',
    phone: '0945678901',
    email: 'dovang@email.com',
    address: '99 Pasteur, Q3, HCM',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-03 14:10', done: true },
      { label: 'Đã xác nhận', time: '2026-04-03 14:15', done: true },
      { label: 'Đã huỷ', time: '2026-04-03 14:30', done: true },
      { label: '', time: '', done: false },
      { label: '', time: '', done: false }
    ]
  },
  {
    id: 'ORD-20260402-0156',
    customer: 'Bùi Thị H',
    branch: 'Cầu Giấy',
    total: 37990000,
    products: [{ name: 'MSI Creator M16 HX', sku: 'MS-CRM16-HX', qty: 1, price: 37990000 }],
    payment: 'Chuyển khoản',
    payStatus: 'Hoàn tiền',
    status: 'refunded',
    date: '2026-04-02 11:00',
    phone: '0956789012',
    email: 'buithih@email.com',
    address: '42 Xuân Thủy, CG, HN',
    history: [
      { label: 'Đơn hàng đã đặt', time: '2026-04-02 11:00', done: true },
      { label: 'Đã xác nhận', time: '2026-04-02 11:10', done: true },
      { label: 'Hoàn tiền', time: '2026-04-03 09:00', done: true },
      { label: '', time: '', done: false },
      { label: '', time: '', done: false }
    ]
  }
];

export const REFUNDS: Refund[] = [
  {
    id: 'RF-001',
    orderId: 'ORD-20260402-0156',
    customer: 'Bùi Thị H',
    branch: 'Cầu Giấy',
    amount: 37990000,
    products: ['MSI Creator M16 HX'],
    reason: 'Sản phẩm bị lỗi màn hình, có điểm chết.',
    status: 'waiting',
    date: '2026-04-05 10:30',
    processedDate: null,
    note: ''
  },
  {
    id: 'RF-002',
    orderId: 'ORD-20260401-0098',
    customer: 'Nguyễn Văn K',
    branch: 'Hoàn Kiếm',
    amount: 32990000,
    products: ['Apple MacBook Air M3'],
    reason: 'Khách hàng đổi ý, không còn nhu cầu.',
    status: 'approved',
    date: '2026-04-04 14:20',
    processedDate: '2026-04-05 09:00',
    note: 'Đã xác nhận hoàn tiền qua chuyển khoản.'
  },
  {
    id: 'RF-003',
    orderId: 'ORD-20260331-0234',
    customer: 'Trần Văn L',
    branch: 'Quận 1',
    amount: 17490000,
    products: ['Asus TUF Gaming A15'],
    reason: 'Sản phẩm không đúng mô tả, màu khác.',
    status: 'done',
    date: '2026-04-02 09:15',
    processedDate: '2026-04-03 10:00',
    note: 'Hoàn tiền thành công, đã chuyển khoản.'
  },
  {
    id: 'RF-004',
    orderId: 'ORD-20260330-0187',
    customer: 'Lê Thị M',
    branch: 'Bình Thạnh',
    amount: 22490000,
    products: ['Lenovo ThinkPad E14 Gen 5'],
    reason: 'Giao hàng quá chậm, khách hàng không còn nhu cầu.',
    status: 'rejected',
    date: '2026-04-01 16:45',
    processedDate: '2026-04-02 10:20',
    note: 'Từ chối vì quá hạn đổi trả 7 ngày.'
  },
  {
    id: 'RF-005',
    orderId: 'ORD-20260405-0045',
    customer: 'Phạm Văn N',
    branch: 'Hải Phòng',
    amount: 29990000,
    products: ['Dell XPS 13 9340'],
    reason: 'Sản phẩm bị trầy xước khi giao hàng.',
    status: 'waiting',
    date: '2026-04-05 15:10',
    processedDate: null,
    note: ''
  }
];

export const BRANCH_DATA: BranchInventory[] = [
  { id: 1, name: 'Hoàn Kiếm', products: 180, quantity: 950, lowStock: 2, value: 3.2 },
  { id: 2, name: 'Quận 1', products: 175, quantity: 920, lowStock: 3, value: 3.1 },
  { id: 3, name: 'Cầu Giấy', products: 165, quantity: 850, lowStock: 4, value: 2.9 },
  { id: 4, name: 'Bình Thạnh', products: 170, quantity: 900, lowStock: 2, value: 3.0 },
  { id: 5, name: 'Hải Phòng', products: 166, quantity: 901, lowStock: 1, value: 2.3 },
];

export const PRODUCT_DATA: ProductInventory[] = [
  { id: 1, name: 'MSI Creator M16 HX', sku: 'MSI-M16HX-001', hoanKiem: 15, quan1: 12, cauGiay: 10, binhThan: 18, haiPhong: 8, total: 63 },
  { id: 2, name: 'Asus ROG Strix G16', sku: 'ASUS-ROG-G16', hoanKiem: 22, quan1: 18, cauGiay: 16, binhThan: 20, haiPhong: 14, total: 90 },
  { id: 3, name: 'Dell XPS 13 9340', sku: 'DELL-XPS-13', hoanKiem: 25, quan1: 28, cauGiay: 30, binhThan: 26, haiPhong: 24, total: 133 },
  { id: 4, name: 'Lenovo ThinkPad Pro', sku: 'LENOVO-THK-PRO', hoanKiem: 18, quan1: 20, cauGiay: 16, binhThan: 19, haiPhong: 15, total: 88 },
];

export const IMPORT_DATA: ImportTicket[] = [
  { id: 'PND001', branch: 'Hoàn Kiếm', supplier: 'NPV Technology', qty: 120, date: '2026-04-05', status: 'done' },
  { id: 'PND002', branch: 'Quận 1', supplier: 'Kỹ Năng Số', qty: 85, date: '2026-04-04', status: 'done' },
  { id: 'PND003', branch: 'Cầu Giấy', supplier: 'CyberLand', qty: 150, date: '2026-04-03', status: 'approved' },
  { id: 'PND004', branch: 'Bình Thạnh', supplier: 'Tech Store', qty: 95, date: '2026-04-06', status: 'pending' },
];

export const EXPORT_DATA: ExportTicket[] = [
  { id: 'PXK001', branch: 'Hoàn Kiếm', reason: 'Bán hàng', qty: 85, date: '2026-04-05', status: 'done' },
  { id: 'PXK002', branch: 'Quận 1', reason: 'Kiểm kho', qty: 12, date: '2026-04-04', status: 'done' },
  { id: 'PXK003', branch: 'Cầu Giấy', reason: 'Hàng hỏng', qty: 5, date: '2026-04-06', status: 'pending' },
];

export const ALERT_DATA: InventoryAlert[] = [
  { id: 1, product: 'MSI Creator M16 HX', branch: 'Hải Phòng', stock: 2, min: 5, severity: 'critical' },
  { id: 2, product: 'Asus ROG Strix G16', branch: 'Hải Phòng', stock: 4, min: 5, severity: 'warning' },
  { id: 3, product: 'Dell XPS 13 9340', branch: 'Hoàn Kiếm', stock: 3, min: 5, severity: 'warning' },
  { id: 4, product: 'Lenovo ThinkPad Pro', branch: 'Cầu Giấy', stock: 5, min: 8, severity: 'warning' },
  { id: 5, product: 'HP Pavilion 15', branch: 'Bình Thạnh', stock: 1, min: 3, severity: 'critical' },
];

export const TRANSFER_DATA: TransferTicket[] = [
  { id: 'PCC001', from: 'Hoàn Kiếm', to: 'Hải Phòng', qty: 45, date: '2026-04-05', status: 'received' },
  { id: 'PCC002', from: 'Quận 1', to: 'Cầu Giấy', qty: 60, date: '2026-04-04', status: 'in_transit' },
  { id: 'PCC003', from: 'Bình Thạnh', to: 'Hoàn Kiếm', qty: 35, date: '2026-04-06', status: 'preparing' },
];