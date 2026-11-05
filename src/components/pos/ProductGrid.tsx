"use client";

import { AnimatePresence } from "framer-motion";
import type { Product, CategoryValue } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  activeCategory: CategoryValue | string;
  searchQuery?: string;
  isAdmin?: boolean;
}

export function ProductGrid({ products, activeCategory, searchQuery = "", isAdmin = false }: ProductGridProps) {
  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {filtered.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} isAdmin={isAdmin} />
        ))}
      </AnimatePresence>
    </div>
  );
}
