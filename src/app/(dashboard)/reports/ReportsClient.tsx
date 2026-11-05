"use client";

import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileDown, FileText, Search } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { TransactionTable } from "@/components/reports/TransactionTable";
import { VolumeTrends } from "@/components/reports/VolumeTrends";
import { PopularCategory } from "@/components/reports/PopularCategory";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { shortId } from "@/lib/format";
import type { ReportTransaction, VolumePoint, CategoryShare } from "@/components/reports/types";

interface ReportsClientProps {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  transactions: ReportTransaction[];
  volumeData: VolumePoint[];
  categoryData: CategoryShare[];
  isAdmin: boolean;
}

export function ReportsClient({
  totalRevenue,
  totalOrders,
  avgTicket,
  transactions,
  volumeData,
  categoryData,
  isAdmin,
}: ReportsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [appliedDateRange, setAppliedDateRange] = useState("all");
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState("all");

  const handleApplyFilters = () => {
    setAppliedDateRange(dateRange);
    setAppliedPaymentMethod(paymentMethod);
    toast.success("Filter diterapkan", {
      description: `Periode: ${dateRange}, Metode: ${paymentMethod}`,
    });
  };

  // Filter transactions based on applied filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Date range filter
    if (appliedDateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (appliedDateRange === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (appliedDateRange === "7days") {
        cutoff.setDate(now.getDate() - 7);
      } else if (appliedDateRange === "30days") {
        cutoff.setDate(now.getDate() - 30);
      } else if (appliedDateRange === "90days") {
        cutoff.setDate(now.getDate() - 90);
      }
      filtered = filtered.filter((tx) => new Date(tx.rawDate) >= cutoff);
    }

    // Payment method filter
    if (appliedPaymentMethod !== "all") {
      filtered = filtered.filter((tx) => tx.paymentMethod === appliedPaymentMethod);
    }

    return filtered;
  }, [transactions, appliedDateRange, appliedPaymentMethod]);

  // Recalculate metrics based on filtered data (completed only)
  const filteredCompleted = filteredTransactions.filter((tx) => tx.status !== "cancelled");
  const filteredRevenue = filteredCompleted.reduce((sum: number, tx) => sum + tx.total, 0);
  const filteredOrders = filteredCompleted.length;
  const filteredAvgTicket = filteredOrders > 0 ? filteredRevenue / filteredOrders : 0;

  const isFiltered = appliedDateRange !== "all" || appliedPaymentMethod !== "all";

  // PDF Export
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Laporan_Transaksi",
    onAfterPrint: () => toast.success("Export PDF selesai"),
  });

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Tanggal", "Waktu", "Pelanggan", "Kasir", "Metode", "Total", "Status"];
      const rows = filteredTransactions.map((tx) => [
        shortId(tx.id),
        `"${tx.date}"`,
        `"${tx.time}"`,
        `"${tx.customer}"`,
        `"${tx.cashier}"`,
        tx.paymentMethod,
        tx.total.toFixed(2),
        tx.status,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Transaksi_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV berhasil diunduh");
    } catch {
      toast.error("Gagal membuat CSV");
    }
  };

  return (
    <>
      <TopNav
        searchPlaceholder="Cari transaksi berdasarkan ID atau pelanggan..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="pt-24 px-4 sm:px-8 pb-12 font-sans min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-accent font-bold tracking-[0.2em] uppercase text-xs mb-2">
              Ringkasan Kinerja
            </p>
            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Laporan & Riwayat
            </h2>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-5 h-11 bg-card text-muted-foreground rounded-xl font-medium shadow-sm border border-border hover:bg-secondary transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              className="flex items-center gap-2 px-5 h-11 bg-foreground text-background rounded-xl font-medium shadow-md hover:opacity-90 transition-all active:scale-95"
              onClick={handleExportCSV}
            >
              <FileDown className="w-4 h-4" />
              Download CSV
            </Button>
          </div>
        </div>

        <ReportSummary
          totalRevenue={isFiltered ? filteredRevenue : totalRevenue}
          totalOrders={isFiltered ? filteredOrders : totalOrders}
          avgTicket={isFiltered ? filteredAvgTicket : avgTicket}
        />

        <ReportFilters
          dateRange={dateRange}
          paymentMethod={paymentMethod}
          onDateRangeChange={setDateRange}
          onPaymentMethodChange={setPaymentMethod}
          onApply={handleApplyFilters}
        />

        <div ref={printRef} className="print:p-8 print:bg-white print:text-black">
          <TransactionTable
            searchQuery={searchQuery}
            items={filteredTransactions}
            isAdmin={isAdmin}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-2">
            <VolumeTrends data={volumeData} />
          </div>
          <div>
            <PopularCategory data={categoryData} />
          </div>
        </motion.div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Search className="w-3.5 h-3.5" />
          Data transaksi ditarik langsung dari database kasir — selalu terbaru.
        </p>
      </main>
    </>
  );
}
