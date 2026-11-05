import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { shifts, shopSettings } from "@/lib/db/schema";
import type { shifts as shiftsTable } from "@/lib/db/schema";
import { roundMoney } from "@/lib/format";

export type ShopSettings = typeof shopSettings.$inferSelect;
export type Shift = typeof shiftsTable.$inferSelect;

export async function getShopSettings(): Promise<ShopSettings> {
	const [row] = await db.select().from(shopSettings).where(eq(shopSettings.id, "default"));
	if (row) return row;

	const [created] = await db.insert(shopSettings).values({ id: "default" }).returning();
	return created;
}

/**
 * Returns the currently open shift, or null if none is open.
 * Only one shift may be open at a time (single-register shop).
 */
export async function getActiveShift(): Promise<Shift | null> {
	const [row] = await db
		.select()
		.from(shifts)
		.where(isNull(shifts.closedAt))
		.orderBy(desc(shifts.openedAt))
		.limit(1);
	return row ?? null;
}

export { roundMoney };
