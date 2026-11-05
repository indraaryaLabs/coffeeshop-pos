import { InventoryClient } from "./InventoryClient";
import { db } from "@/lib/db";
import { products, inventory } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";

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
      unit: inventory.unit,
      supplier: inventory.supplier,
    })
    .from(products)
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(inArray(products.type, ["retail", "raw_material"]))
    .orderBy(desc(products.createdAt));

  const initialItems = data.map((item) => ({
    id: item.id,
    name: item.name,
    subtitle: item.subtitle,
    currentStock: item.currentStock,
    pricePerUnit: String(item.pricePerUnit),
    image: item.image,
    productType: item.productType,
    unit: item.unit,
    supplier: item.supplier,
    status:
      (item.currentStock <= 0
        ? "out_of_stock"
        : item.currentStock <= 5
          ? "low_stock"
          : "in_stock") as "in_stock" | "low_stock" | "out_of_stock",
  }));

  return <InventoryClient initialItems={initialItems} isAdmin={isAdmin} />;
}
