export interface RecentTxRow {
  id: string;
  createdAt: Date | string | null;
  totalAmount: string;
  status: string;
  customerName: string | null;
  paymentMethod: string;
}
