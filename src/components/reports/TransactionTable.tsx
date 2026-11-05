"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ReceiptText, Undo2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { voidTransaction } from "@/lib/actions/transaction";
import { formatIDR } from "@/lib/format";
import type { ReportTransaction } from "@/components/reports/types";

interface TransactionTableProps {
  searchQuery?: string;
  items?: ReportTransaction[];
  isAdmin?: boolean;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  qr_code: "QRIS",
};

export function TransactionTable({ searchQuery = "", items = [], isAdmin = false }: TransactionTableProps) {
  const [voidTarget, setVoidTarget] = useState<ReportTransaction | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const filteredTransactions = items.filter(
    (tx) =>
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoid = async () => {
    if (!voidTarget) return;
    setIsVoiding(true);
    const res = await voidTransaction(voidTarget.id);
    setIsVoiding(false);
    if (res.success) {
      toast.success("Transaksi dibatalkan", {
        description: `#${voidTarget.id.substring(0, 8).toUpperCase()} — stok dikembalikan ke inventory.`,
      });
      setVoidTarget(null);
    } else {
      toast.error(res.error || "Gagal membatalkan transaksi");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
    >
      <div className="px-6 sm:px-8 py-5 border-b border-border flex items-center justify-between gap-3">
        <h4 className="font-headline text-lg font-bold text-foreground flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-muted-foreground" />
          Riwayat Transaksi
        </h4>
        {isAdmin && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Admin dapat membatalkan transaksi
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 text-muted-foreground text-[10px] uppercase tracking-widest font-bold hover:bg-secondary/30">
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[140px]">ID Transaksi</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[150px]">Tanggal & Waktu</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[150px]">Kasir</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto min-w-[110px]">Metode</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto text-right min-w-[130px]">Total</TableHead>
              <TableHead className="px-6 sm:px-8 py-4 h-auto w-[90px]">Status</TableHead>
              {isAdmin && <TableHead className="px-6 sm:px-8 py-4 h-auto w-[70px]">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-muted-foreground">
                  Belum ada transaksi.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const isCancelled = tx.status === "cancelled";
                return (
                  <TableRow key={tx.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="px-6 sm:px-8 py-5">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        #{tx.id.substring(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 sm:px-8 py-5">
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">{tx.date}</p>
                        <p className="text-xs text-muted-foreground/60">{tx.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 sm:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-accent flex items-center justify-center text-[10px] font-bold">
                          {tx.cashierInitials}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {tx.cashier.length > 16 ? tx.cashier.substring(0, 16) + "…" : tx.cashier}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 sm:px-8 py-5">
                      <Badge
                        variant="secondary"
                        className="bg-secondary/80 text-foreground text-[10px] font-bold uppercase tracking-wider border-none"
                      >
                        {METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`px-6 sm:px-8 py-5 text-right font-headline font-bold tabular-nums ${
                        isCancelled ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {formatIDR(tx.total)}
                    </TableCell>
                    <TableCell className="px-6 sm:px-8 py-5">
                      {isCancelled ? (
                        <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                          Dibatalkan
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/15 text-green-600 text-[10px] font-bold uppercase tracking-wider border-none">
                          Selesai
                        </Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="px-6 sm:px-8 py-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isCancelled}
                          onClick={() => setVoidTarget(tx)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-lg text-xs font-bold"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Void
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-border">
        <p className="text-sm text-muted-foreground/70">
          Menampilkan <span className="font-bold text-foreground">{filteredTransactions.length}</span> dari{" "}
          {items.length} transaksi
        </p>
      </div>

      {/* Void confirmation */}
      <Dialog open={voidTarget !== null} onOpenChange={(v) => !v && setVoidTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Batalkan Transaksi #{voidTarget?.id.substring(0, 8).toUpperCase()}?
            </DialogTitle>
            <DialogDescription>
              Transaksi senilai {voidTarget ? formatIDR(voidTarget.total) : ""} akan ditandai batal dan
              stok produk akan dikembalikan ke inventory. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setVoidTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isVoiding}>
              {isVoiding ? "Memproses..." : "Ya, Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
