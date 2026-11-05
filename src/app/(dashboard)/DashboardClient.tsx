"use client";

import { TopNav } from "@/components/layout/TopNav";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { WeeklyRevenueChart } from "@/components/dashboard/WeeklyRevenueChart";
import { TopSellers } from "@/components/dashboard/TopSellers";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { motion } from "framer-motion";
import type { RecentTxRow } from "@/components/dashboard/types";

interface LowStockItem {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  status: string;
}

interface TopSellerItem {
  name: string;
  sold: number;
  revenue: number;
  image: string;
}

interface WeeklyDataPoint {
  day: string;
  revenue: number;
  orders: number;
}

interface DashboardClientProps {
  revenueToday: number;
  itemsSold: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
  recentTx: RecentTxRow[];
  topSellers: TopSellerItem[];
  weeklyPerformance: WeeklyDataPoint[];
}

export function DashboardClient({
  revenueToday,
  itemsSold,
  lowStockCount,
  lowStockItems,
  recentTx,
  topSellers,
  weeklyPerformance,
}: DashboardClientProps) {
  return (
    <>
      <TopNav
        title="Ringkasan Harian"
        subtitle={new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />
      <main className="pt-24 px-10 pb-12 min-h-screen font-sans">
        <SummaryCards 
          revenueToday={revenueToday}
          itemsSold={itemsSold}
          lowStockCount={lowStockCount}
          lowStockItems={lowStockItems}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 h-full"
          >
            <WeeklyRevenueChart data={weeklyPerformance} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 h-full"
          >
            <TopSellers items={topSellers} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <RecentTransactions transactions={recentTx} />
        </motion.div>
      </main>
    </>
  );
}
