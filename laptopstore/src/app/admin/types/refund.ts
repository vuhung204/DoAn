export interface Refund {
  id: string;
  orderId: string;
  customer: string;
  branch: string;
  amount: number;
  products: string[];
  reason: string;
  status: 'waiting' | 'approved' | 'done' | 'rejected';
  date: string;
  processedDate: string | null;
  note: string;
}
