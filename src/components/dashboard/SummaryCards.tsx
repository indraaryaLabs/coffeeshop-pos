"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Banknote, ShoppingBag, TriangleAlert, ChevronDown, ChevronUp } from "lucide-react";
import { formatIDR } from "@/lib/format";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface LowStockItem {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  status: string;
}

export function SummaryCards({
  revenueToday = 0,
  itemsSold = 0,
  lowStockCount = 0,
  lowStockItems = [],
}: {
  revenueToday?: number;
  itemsSold?: number;
  lowStockCount?: number;
  lowStockItems?: LowStockItem[];
}) {
  const [showLowStock, setShowLowStock] = useState(false);

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      >
        {/* Revenue Card */}
        <motion.div
          variants={item}
          className="bg-card p-8 rounded-xl shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-border"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-secondary text-primary rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">
              Pendapatan Hari Ini
            </p>
            <h3 className="font-headline text-4xl font-extrabold text-foreground mt-2 tracking-tight tabular-nums">
              {formatIDR(revenueToday)}
            </h3>
          </div>
        </motion.div>

        {/* Items Sold Card */}
        <motion.div
          variants={item}
          className="bg-card p-8 rounded-xl shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-border"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-secondary text-accent rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">
              Item Terjual
            </p>
            <h3 className="font-headline text-4xl font-extrabold text-foreground mt-2 tracking-tight tabular-nums">
              {itemsSold}
            </h3>
          </div>
        </motion.div>

        {/* Low Stock Card */}
        <motion.div
          variants={item}
          className="bg-card p-8 rounded-xl shadow-sm border-l-4 border-l-primary flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-secondary text-accent rounded-xl">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLowStock(!showLowStock);
                }}
                className="text-accent font-bold text-xs uppercase tracking-tighter hover:text-foreground transition-colors flex items-center gap-1"
              >
                {showLowStock ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showLowStock ? "Sembunyikan" : "Detail"}
              </button>
              <Link
                href="/inventory"
                onClick={(e) => e.stopPropagation()}
                className="text-accent font-bold text-xs underline underline-offset-4 uppercase tracking-tighter hover:text-foreground transition-colors"
              >
                Restok
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">
              Stok Menipis
            </p>
            <h3 className="font-headline text-4xl font-extrabold text-foreground mt-2 tracking-tight tabular-nums">
              {lowStockCount.toString().padStart(2, "0")}{" "}
              <span className="text-lg font-medium text-muted-foreground">item</span>
            </h3>
          </div>
        </motion.div>
      </motion.div>

      {/* Low Stock Detail Panel */}
      <AnimatePresence>
        {showLowStock && lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="w-5 h-5 text-primary" />
                  <h4 className="font-headline text-lg font-bold text-foreground">
                    Inventory Stok Menipis
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  Data langsung dari inventory
                </span>
              </div>
              <div className="grid gap-3">
                {lowStockItems.map((stockItem) => (
                  <div
                    key={stockItem.productId}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          stockItem.currentStock === 0 ? "bg-destructive animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-sm text-foreground">{stockItem.productName}</p>
                        <p className="text-xs text-muted-foreground">{stockItem.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-headline font-bold text-sm tabular-nums ${
                          stockItem.currentStock === 0 ? "text-destructive" : "text-amber-500"
                        }`}
                      >
                        {stockItem.currentStock} {stockItem.unit}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {stockItem.currentStock === 0 ? "Stok Habis" : "Stok Menipis"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
