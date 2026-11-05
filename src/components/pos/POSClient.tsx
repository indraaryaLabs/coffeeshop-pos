"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { CategoryFilter } from "@/components/pos/CategoryFilter";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import type { CategoryValue, Product } from "@/lib/catalog";
import { AddProductDialog } from "./AddProductDialog";

interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

export interface ShiftSummary {
  openedAt: string;
  openingCash: number;
  cashTotal: number;
  cardTotal: number;
  qrisTotal: number;
  orderCount: number;
}

export interface ShopProfile {
  shopName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRatePercent: number;
}

interface POSClientProps {
  initialProducts: Product[];
  rawMaterials?: RawMaterial[];
  shop: ShopProfile;
  shiftSummary: ShiftSummary | null;
  cashierName: string;
  isAdmin: boolean;
}

export function POSClient({
  initialProducts,
  rawMaterials = [],
  shop,
  shiftSummary,
  cashierName,
  isAdmin,
}: POSClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryValue | string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleShiftChanged = () => router.refresh();

  return (
    <>
      <TopNav
        searchPlaceholder="Cari menu..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="pt-16 flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] overflow-hidden lg:overflow-hidden">
        {/* Product Catalog */}
        <section className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <CategoryFilter
              activeCategory={activeCategory as CategoryValue}
              onCategoryChange={setActiveCategory}
            />
            {isAdmin && <AddProductDialog rawMaterials={rawMaterials} />}
          </div>

          <ProductGrid
            products={initialProducts}
            activeCategory={activeCategory as CategoryValue}
            searchQuery={searchQuery}
            isAdmin={isAdmin}
          />
        </section>

        {/* Order Panel */}
        <OrderSidebar
          shop={shop}
          activeShift={shiftSummary}
          cashierName={cashierName}
          onShiftChanged={handleShiftChanged}
        />
      </main>
    </>
  );
}
