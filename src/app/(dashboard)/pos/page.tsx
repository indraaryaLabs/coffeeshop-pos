import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, inventory, recipeIngredients, transactions } from "@/lib/db/schema";
import { POSClient } from "@/components/pos/POSClient";
import type { Product } from "@/lib/catalog";
import { getShopSettings, getActiveShift } from "@/lib/shop";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface RawMaterialForPOS {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

export default async function POSPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const cashierName = session?.user?.name || "Kasir";
  const isAdmin = session?.user?.role === "admin";

  // 1. Fetch menu + retail items for POS (raw_material excluded)
  const dbProducts = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      category: products.category,
      imageUrl: products.imageUrl,
      type: products.type,
      stock: inventory.currentStock,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(inArray(products.type, ["menu", "retail"]));

  // 2. Fetch all recipe ingredients for menu items, joined with raw material inventory
  const allRecipes = await db
    .select({
      menuProductId: recipeIngredients.menuProductId,
      rawMaterialId: recipeIngredients.rawMaterialId,
      quantityNeeded: recipeIngredients.quantityNeeded,
      rawMaterialName: products.name,
      rawMaterialStock: inventory.currentStock,
      rawMaterialUnit: recipeIngredients.unit,
    })
    .from(recipeIngredients)
    .innerJoin(products, eq(recipeIngredients.rawMaterialId, products.id))
    .leftJoin(inventory, eq(recipeIngredients.rawMaterialId, inventory.productId));

  // Build a map: menuProductId -> { hasRecipe, ingredientsMissing[] }
  const recipeMap = new Map<string, { hasRecipe: boolean; missingIngredients: string[] }>();
  for (const r of allRecipes) {
    if (!recipeMap.has(r.menuProductId)) {
      recipeMap.set(r.menuProductId, { hasRecipe: true, missingIngredients: [] });
    }
    const entry = recipeMap.get(r.menuProductId)!;
    const stock = r.rawMaterialStock ?? 0;
    const needed = Number(r.quantityNeeded) || 1;
    if (stock < needed) {
      entry.missingIngredients.push(r.rawMaterialName);
    }
  }

  // 3. Map to the Product UI interface
  const initialProducts: Product[] = dbProducts.map((p) => {
    if (p.type === "menu") {
      const recipe = recipeMap.get(p.id);
      // Menu with recipe: check if ingredients are available
      // Menu without recipe: always available  
      const ingredientsMissing = recipe?.missingIngredients || [];
      const isUnavailable = recipe ? ingredientsMissing.length > 0 : false;
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        category: p.category,
        image: p.imageUrl || "/images/placeholder.jpg",
        type: p.type as Product["type"],
        stock: isUnavailable ? 0 : undefined,
        unavailableReason: isUnavailable
          ? `Bahan habis: ${ingredientsMissing.join(", ")}`
          : undefined,
      };
    }

    // Retail: use actual inventory stock
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      category: p.category,
      image: p.imageUrl || "/images/placeholder.jpg",
      type: p.type as Product["type"],
      stock: p.stock ?? 0,
    };
  });

  // 4. Fetch raw materials for the "Add Menu" dialog ingredient picker
  const rawMaterials: RawMaterialForPOS[] = await db
    .select({
      id: products.id,
      name: products.name,
      currentStock: inventory.currentStock,
      unit: inventory.unit,
    })
    .from(products)
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(eq(products.type, "raw_material"));

  // 5. Shop profile + shift context for the register
  const [shop, activeShift] = await Promise.all([getShopSettings(), getActiveShift()]);

  let shiftSummary = null as null | {
    openedAt: string;
    openingCash: number;
    cashTotal: number;
    cardTotal: number;
    qrisTotal: number;
    orderCount: number;
  };

  if (activeShift) {
    const [totals] = await db
      .select({
        cashTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'cash' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
        cardTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'card' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
        qrisTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'qr_code' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(and(eq(transactions.shiftId, activeShift.id), eq(transactions.status, "completed")));

    shiftSummary = {
      openedAt: activeShift.openedAt.toISOString(),
      openingCash: Number(activeShift.openingCash),
      cashTotal: Number(totals?.cashTotal ?? 0),
      cardTotal: Number(totals?.cardTotal ?? 0),
      qrisTotal: Number(totals?.qrisTotal ?? 0),
      orderCount: totals?.orderCount ?? 0,
    };
  }

  return (
    <POSClient
      initialProducts={initialProducts}
      rawMaterials={rawMaterials.map((r) => ({
        id: r.id,
        name: r.name,
        currentStock: r.currentStock ?? 0,
        unit: r.unit,
      }))}
      shop={{
        shopName: shop.shopName,
        address: shop.address,
        phone: shop.phone,
        receiptFooter: shop.receiptFooter,
        taxEnabled: shop.taxEnabled,
        taxRatePercent: Number(shop.taxRatePercent),
      }}
      shiftSummary={shiftSummary}
      cashierName={cashierName}
      isAdmin={isAdmin}
    />
  );
}
