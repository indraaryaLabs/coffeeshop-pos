"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { TrendingUp, ReceiptText, BarChart3 } from "lucide-react";
import { formatIDR } from "@/lib/format";

interface WeeklyDataPoint {
  day: string;
  revenue: number;
  orders: number;
}

export function WeeklyRevenueChart({ data = [] }: { data?: WeeklyDataPoint[] }) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const { resolvedTheme } = useTheme();

  // Find max value to color it differently
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d[metric])) : 0;
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  const baseColor = resolvedTheme === "dark" ? "#C08552" : "#E2C3A8";
  const hoverColor = resolvedTheme === "dark" ? "#FEBB84" : "#C08552";
  const maxColor = resolvedTheme === "dark" ? "#FEBB84" : "#8C5A3C";

  return (
    <div className="bg-secondary/50 rounded-xl p-8 relative overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-end mb-4 flex-wrap gap-3">
        <div>
          <h4 className="font-headline text-2xl font-bold text-foreground tracking-tight">
            Kinerja Mingguan
          </h4>
          <p className="text-muted-foreground text-sm">7 hari terakhir</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMetric("revenue")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              metric === "revenue"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/40"
            }`}
          >
            Pendapatan
          </button>
          <button
            onClick={() => setMetric("orders")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              metric === "orders"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/40"
            }`}
          >
            Pesanan
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground tabular-nums">{formatIDR(totalRevenue)}</span>
          <span className="text-xs text-muted-foreground">total pendapatan</span>
        </div>
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-foreground tabular-nums">{totalOrders}</span>
          <span className="text-xs text-muted-foreground">pesanan</span>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Belum ada data untuk periode ini</p>
            <p className="text-xs">Selesaikan transaksi untuk melihat kinerja mingguan</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor", fontSize: 10, fontWeight: "bold", opacity: 0.4 }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border px-3 py-2 rounded-lg shadow-lg">
                        <p className="font-bold text-sm text-foreground">{payload[0].payload.day}</p>
                        <p className="text-primary font-headline font-bold tabular-nums">
                          {metric === "revenue"
                            ? formatIDR(Number(payload[0].value))
                            : `${payload[0].value} Pesanan`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey={metric} radius={[6, 6, 0, 0]} animationDuration={1000}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry[metric] === maxValue && maxValue > 0 ? maxColor : baseColor}
                    className="hover:fill-[var(--chart-hover)] transition-all duration-300"
                    style={{ "--chart-hover": hoverColor } as React.CSSProperties}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
