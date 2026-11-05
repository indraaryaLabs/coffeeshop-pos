import { InventoryClient } from "./InventoryClient";
import { db } from "@/lib/db";
import { products, inventory } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export default async function InventoryPage() {
  // Only fetch retail and raw_material items (menu items don't appear in inventory)
  const data = await db
    .select({
      id: products.id,
      name: products.name,
      subtitle: products.category,
      currentStock: inventory.currentStock,
      pricePerUnit: products.price,
      image: products.imageUrl,
      productType: products.type,
    })
    .from(products)
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(inArray(products.type, ["retail", "raw_material"]))
    .orderBy(desc(products.createdAt));

  const initialItems = data.map((item) => ({
    ...item,
    unit: "Items",
    status:
      (item.currentStock <= 0
        ? "out_of_stock"
        : item.currentStock <= 5
        ? "low_stock"
        : "in_stock") as "in_stock" | "low_stock" | "out_of_stock",
    pricePerUnit: `$${Number(item.pricePerUnit).toFixed(2)}`,
  }));

  return <InventoryClient initialItems={initialItems} />;
}
