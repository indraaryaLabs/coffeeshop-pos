export interface ReportTransaction {
  id: string;
  customer: string;
  rawDate: string;
  date: string;
  time: string;
  cashier: string;
  cashierInitials: string;
  paymentMethod: string;
  total: number;
  status: string;
}

export interface VolumePoint {
  day: string;
  revenue?: number;
  orders: number;
}

export interface CategoryShare {
  icon: string;
  label: string | null;
  pct: string;
}
