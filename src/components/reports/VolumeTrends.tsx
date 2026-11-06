"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { BarChart3 } from "lucide-react";
import type { VolumePoint } from "@/components/reports/types";

interface VolumeTrendsProps {
  data?: VolumePoint[];
}

export function VolumeTrends({ data = [] }: VolumeTrendsProps) {
  const { resolvedTheme } = useTheme();

  const displayData = data;
  const maxValue =
    displayData.length > 0 ? Math.max(...displayData.map((d) => d.orders)) : 0;
  // Highlight only the first bar reaching the max (ties keep the base color).
  const firstMaxIndex = displayData.findIndex(
    (d) => d.orders === maxValue && maxValue > 0
  );

  const baseColor = resolvedTheme === "dark" ? "#8C5A3C" : "#D9C5B2";
  const hoverColor = resolvedTheme === "dark" ? "#C08552" : "#8C5A3C";
  const maxColor = resolvedTheme === "dark" ? "#FEBB84" : "#4B2E2B";

  return (
    <div className="bg-card rounded-2xl p-8 h-full flex flex-col shadow-sm border border-border">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-headline text-xl font-bold text-foreground">
          Tren Volume Pesanan
        </h4>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          7 Hari Terakhir
        </span>
      </div>

      <div className="flex-1 min-h-[160px]">
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Belum ada data</p>
            <p className="text-xs">Data volume akan tampil setelah ada transaksi</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={displayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
                        <p className="text-primary font-headline font-bold">
                          {`${payload[0].value} Pesanan`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="orders" radius={[12, 12, 0, 0]} animationDuration={1000}>
                {displayData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === firstMaxIndex ? maxColor : baseColor}
                    className="hover:fill-[var(--chart-hover)] transition-all cursor-pointer duration-300"
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
