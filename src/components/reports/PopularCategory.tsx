"use client";

import { Coffee, Croissant, Sandwich, Shirt, Tag } from "lucide-react";
import type { CategoryShare } from "@/components/reports/types";

interface PopularCategoryProps {
  data?: CategoryShare[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  coffee: Coffee,
  bakery_dining: Croissant,
  lunch_dining: Sandwich,
  local_mall: Shirt,
};

export function PopularCategory({ data = [] }: PopularCategoryProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-accent/10 rounded-2xl p-8 h-full flex flex-col border border-accent/20 group hover:shadow-sm transition-all">
      <h4 className="font-headline text-xl font-bold text-foreground mb-6">
        Kategori Terlaris
      </h4>
      <div className="space-y-6 flex-1">
        {data.map((item, i) => {
          const Icon = ICON_MAP[item.icon] ?? Tag;
          return (
            <div key={i} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center group-hover/item:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">{item.pct}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
