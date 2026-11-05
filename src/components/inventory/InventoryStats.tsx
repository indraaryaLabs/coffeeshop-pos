"use client";

import { motion } from "framer-motion";
import { TriangleAlert, Banknote, Sparkles } from "lucide-react";
import { formatIDR } from "@/lib/format";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

interface InventoryStatsProps {
  lowStockCount: number;
  totalValue: number;
}

export function InventoryStats({ lowStockCount, totalValue }: InventoryStatsProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
    >
      <motion.div
        variants={item}
        className="col-span-1 p-6 bg-card rounded-xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Item Stok Menipis
        </span>
        <div className="flex items-end justify-between mt-4">
          <span className="font-headline text-4xl font-extrabold text-destructive tabular-nums">
            {lowStockCount.toString().padStart(2, "0")}
          </span>
          <div className="p-2 bg-destructive/10 rounded-lg">
            <TriangleAlert className="w-5 h-5 text-destructive" />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="col-span-1 p-6 bg-card rounded-xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Nilai Total Stok
        </span>
        <div className="flex items-end justify-between mt-4">
          <span className="font-headline text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
            {formatIDR(totalValue)}
          </span>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Banknote className="w-5 h-5 text-primary" />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="col-span-2 p-6 bg-accent rounded-xl flex items-center justify-between text-accent-foreground shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group"
      >
        <div className="space-y-1 relative z-10">
          <p className="font-bold">Pemantauan Stok</p>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed">
            {lowStockCount > 0
              ? `Ada ${lowStockCount} item yang stoknya menipis. Pertimbangkan untuk restok segera.`
              : "Semua level stok sehat. Tidak ada yang perlu direstok."}
          </p>
        </div>
        <Sparkles className="w-12 h-12 opacity-20 absolute right-6 group-hover:scale-110 transition-transform" />
      </motion.div>
    </motion.div>
  );
}
