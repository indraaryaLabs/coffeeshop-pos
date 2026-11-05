"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { SlidersHorizontal, FileDown, X } from "lucide-react";
import { formatIDR, shortId } from "@/lib/format";
import type { RecentTxRow } from "@/components/dashboard/types";

interface RecentTransactionsProps {
  transactions?: RecentTxRow[];
}

type FilterStatus = "all" | "completed" | "pending" | "cancelled";
type FilterPayment = "all" | "cash" | "card" | "qr_code";

const STATUS_LABEL: Record<string, string> = {
  completed: "Selesai",
  pending: "Menunggu",
  cancelled: "Dibatalkan",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  qr_code: "QRIS",
};

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<FilterPayment>("all");

  // Filter logic
  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      const matchStatus = statusFilter === "all" || tx.status === statusFilter;
      const matchPayment = paymentFilter === "all" || tx.paymentMethod === paymentFilter;
      return matchStatus && matchPayment;
    });
  }, [transactions, statusFilter, paymentFilter]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    if (filteredTx.length === 0) return;

    const headers = ["ID", "Pelanggan", "Metode", "Status", "Total", "Tanggal"];
    const rows = filteredTx.map((tx) => [
      shortId(tx.id),
      tx.customerName || "Guest",
      PAYMENT_LABEL[tx.paymentMethod] || tx.paymentMethod,
      STATUS_LABEL[tx.status] || tx.status,
      String(Number(tx.totalAmount)),
      tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell: string) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transaksi_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredTx]);

  const clearFilters = () => {
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 sm:px-8 py-5 flex justify-between items-center bg-secondary/30">
        <h4 className="font-headline text-xl font-bold text-foreground">Transaksi Terbaru</h4>
        <div className="flex gap-4 items-center">
          {/* Filter Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilter(!showFilter)}
              className={`text-muted-foreground hover:text-foreground transition-all relative ${
                showFilter ? "bg-secondary text-foreground" : ""
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Export CSV Button */}
          <Button
            onClick={handleExportCSV}
            disabled={filteredTx.length === 0}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 sm:px-8 py-5 bg-secondary/20 border-b border-border flex flex-wrap items-center gap-6">
              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Status:
                </span>
                <div className="flex gap-1">
                  {(["all", "completed", "pending", "cancelled"] as FilterStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === s
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-card/40"
                      }`}
                    >
                      {s === "all" ? "Semua" : STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Metode:
                </span>
                <div className="flex gap-1">
                  {(["all", "cash", "card", "qr_code"] as FilterPayment[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaymentFilter(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        paymentFilter === p
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-card/40"
                      }`}
                    >
                      {p === "all" ? "Semua" : PAYMENT_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-primary hover:text-foreground transition-colors ml-auto flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Bersihkan Filter
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/50">
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[110px]">ID Transaksi</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[150px]">Pelanggan</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[110px]">Metode</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto">Status</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTx.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {transactions.length === 0
                    ? "Belum ada transaksi."
                    : "Tidak ada transaksi yang cocok dengan filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTx.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-secondary/20 transition-colors group border-b-secondary"
                >
                  <TableCell className="px-6 sm:px-8 py-5 text-sm font-medium text-foreground font-mono">
                    {shortId(tx.id)}
                  </TableCell>
                  <TableCell className="px-6 sm:px-8 py-5 text-sm font-semibold text-foreground">
                    {tx.customerName || "Guest"}
                  </TableCell>
                  <TableCell className="px-6 sm:px-8 py-5 text-xs text-foreground/80">
                    {PAYMENT_LABEL[tx.paymentMethod] ?? tx.paymentMethod}
                  </TableCell>
                  <TableCell className="px-6 sm:px-8 py-5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight border-none ${
                        tx.status === "completed"
                          ? "bg-green-500/15 text-green-600"
                          : tx.status === "pending"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {STATUS_LABEL[tx.status] ?? tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 sm:px-8 py-5 text-right font-headline font-bold text-foreground tabular-nums">
                    {formatIDR(Number(tx.totalAmount))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 sm:px-8 py-5 text-center border-t border-border flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-muted-foreground">
          Menampilkan {filteredTx.length} dari {transactions.length} transaksi
        </span>
        <Link href="/reports">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all"
          >
            Lihat Semua Transaksi
          </Button>
        </Link>
      </div>
    </div>
  );
}
