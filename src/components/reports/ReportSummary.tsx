"use client";

import { motion, Variants } from "framer-motion";
import { Database, ShoppingCart, TicketPercent } from "lucide-react";
import { formatIDR } from "@/lib/format";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

interface ReportSummaryProps {
  totalRevenue?: number;
  totalOrders?: number;
  avgTicket?: number;
}

export function ReportSummary({ totalRevenue = 0, totalOrders = 0, avgTicket = 0 }: ReportSummaryProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
    >
      <motion.div
        variants={item}
        className="md:col-span-2 bg-foreground text-background p-8 rounded-2xl relative overflow-hidden group shadow-lg"
      >
        <div className="relative z-10">
          <p className="text-background/60 font-medium mb-1">Total Pendapatan</p>
          <h3 className="font-headline text-5xl sm:text-6xl font-bold tracking-tighter mb-4 tabular-nums">
            {formatIDR(totalRevenue)}
          </h3>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Langsung dari database kasir</span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
      </motion.div>

      <motion.div
        variants={item}
        className="bg-card p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:-translate-y-1 transition-transform"
      >
        <div>
          <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Total Pesanan
          </p>
          <h3 className="font-headline text-4xl font-bold text-foreground tabular-nums">{totalOrders}</h3>
        </div>
        <div className="h-1 bg-secondary w-full rounded-full overflow-hidden mt-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "85%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="bg-card p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:-translate-y-1 transition-transform"
      >
        <div>
          <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
            <TicketPercent className="w-4 h-4" />
            Rata-rata Transaksi
          </p>
          <h3 className="font-headline text-4xl font-bold text-foreground tabular-nums">
            {formatIDR(avgTicket)}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground/80">Rata-rata dari semua kasir</p>
      </motion.div>
    </motion.div>
  );
}
