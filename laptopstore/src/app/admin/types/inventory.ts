export interface BranchInventory {
  id: number;
  name: string;
  products: number;
  quantity: number;
  lowStock: number;
  value: number;
}

export interface ProductInventory {
  id: number;
  name: string;
  sku: string;
  hoanKiem: number;
  quan1: number;
  cauGiay: number;
  binhThan: number;
  haiPhong: number;
  total: number;
}

export interface ImportTicket {
  id: string;
  branch: string;
  supplier: string;
  qty: number;
  date: string;
  status: 'draft' | 'pending' | 'approved' | 'done';
}

export interface ExportTicket {
  id: string;
  branch: string;
  reason: string;
  qty: number;
  date: string;
  status: 'pending' | 'done';
}

export interface InventoryAlert {
  id: number;
  product: string;
  branch: string;
  stock: number;
  min: number;
  severity: 'critical' | 'warning';
}

export interface TransferTicket {
  id: string;
  from: string;
  to: string;
  qty: number;
  date: string;
  status: 'preparing' | 'in_transit' | 'received';
}

export interface AdjustmentItem {
  id: number;
  name: string;
  qty: number;
}
