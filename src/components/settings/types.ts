export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface ShiftHistoryRow {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  /** null while the shift is still open */
  countedCash: number | null;
  expectedCash: number | null;
  note: string | null;
  cashierName: string;
}
