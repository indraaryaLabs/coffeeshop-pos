"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	products,
	inventory,
	shifts,
	transactions,
	transactionItems,
	recipeIngredients,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveShift, getShopSettings } from "@/lib/shop";
import { roundMoney } from "@/lib/format";

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutPayload = {
	items: CheckoutItem[];
	paymentMethod: "cash" | "card" | "qr_code";
	/** Cash handed over by the customer. Required for cash payments. */
	paidAmount?: number;
	/** Order-level discount amount. Clamped to [0, subtotal]. */
	discountAmount?: number;
	customerName?: string;
	tableNumber?: string;
};

async function requireSession() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session || !session.user) {
		return { error: "Unauthorized. Please log in first." as const, session: null };
	}
	return { error: null, session };
}

/**
 * Atomically decrements stock for a retail product.
 * The conditional WHERE makes the check-and-decrement safe against
 * concurrent orders: if another cashier already took the last unit,
 * this update affects 0 rows and the sale fails.
 */
async function deductRetailStock(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	productId: string,
	quantity: number,
	productName: string
) {
	const [updated] = await tx
		.update(inventory)
		.set({
			currentStock: sql`${inventory.currentStock} - ${quantity}`,
			status: sql`CASE
				WHEN ${inventory.currentStock} - ${quantity} <= 0 THEN 'out_of_stock'::inventory_status
				WHEN ${inventory.currentStock} - ${quantity} <= 5 THEN 'low_stock'::inventory_status
				ELSE 'in_stock'::inventory_status
			END`,
		})
		.where(and(eq(inventory.productId, productId), sql`${inventory.currentStock} >= ${quantity}`))
		.returning({ id: inventory.id });

	if (!updated) {
		throw new Error(
			`Stok ${productName} tidak cukup untuk diproses. Silakan periksa kembali inventory.`
		);
	}
}

/**
 * Atomically decrements the raw-material stock of a menu item's recipe.
 * Same concurrency guarantee as deductRetailStock.
 */
async function deductRecipeStock(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	menuProductId: string,
	quantity: number,
	productName: string
) {
	const recipe = await tx
		.select({
			rawMaterialId: recipeIngredients.rawMaterialId,
			rawMaterialName: products.name,
			quantityNeeded: recipeIngredients.quantityNeeded,
		})
		.from(recipeIngredients)
		.innerJoin(products, eq(recipeIngredients.rawMaterialId, products.id))
		.where(eq(recipeIngredients.menuProductId, menuProductId));

	// Menu items without a recipe are consumable as-is.
	for (const ingredient of recipe) {
		const need = Number(ingredient.quantityNeeded) * quantity;
		const [updated] = await tx
			.update(inventory)
			.set({ currentStock: sql`${inventory.currentStock} - ${need}` })
			.where(
				and(eq(inventory.productId, ingredient.rawMaterialId), sql`${inventory.currentStock} >= ${need}`)
			)
			.returning({ id: inventory.id });

		if (!updated) {
			throw new Error(`Bahan ${ingredient.rawMaterialName} tidak cukup untuk ${productName}.`);
		}
	}
}

export async function processCheckout(payload: CheckoutPayload) {
	try {
		const { error: sessionError, session } = await requireSession();
		if (sessionError) return { success: false as const, error: sessionError };

		const { items, paymentMethod, paidAmount, discountAmount, customerName, tableNumber } = payload;

		if (!items || items.length === 0) {
			return { success: false as const, error: "Keranjang masih kosong." };
		}
		if (items.some((i) => !i.productId || !Number.isInteger(i.quantity) || i.quantity <= 0)) {
			return { success: false as const, error: "Item tidak valid." };
		}
		if (!["cash", "card", "qr_code"].includes(paymentMethod)) {
			return { success: false as const, error: "Metode pembayaran tidak valid." };
		}

		// A sale must be attached to an open shift so the cash drawer
		// can be reconciled at closing time.
		const activeShift = await getActiveShift();
		if (!activeShift) {
			return { success: false as const, error: "Belum ada shift yang terbuka. Buka shift terlebih dahulu." };
		}

		// Server-authoritative pricing: never trust client-sent amounts.
		const productRows = await db
			.select({ id: products.id, name: products.name, type: products.type, price: products.price })
			.from(products)
			.where(inArray(products.id, items.map((i) => i.productId)));

		const priceById = new Map(productRows.map((p) => [p.id, p]));
		for (const item of items) {
			if (!priceById.has(item.productId)) {
				return { success: false as const, error: `Produk tidak ditemukan.` };
			}
		}

		const settings = await getShopSettings();
		const subtotal = roundMoney(
			items.reduce((sum, item) => {
				const p = priceById.get(item.productId)!;
				return sum + Number(p.price) * item.quantity;
			}, 0)
		);
		const discount = Math.min(Math.max(roundMoney(discountAmount ?? 0), 0), subtotal);
		const tax = settings.taxEnabled
			? roundMoney(((subtotal - discount) * Number(settings.taxRatePercent)) / 100)
			: 0;
		const total = roundMoney(subtotal - discount + tax);

		let paid = roundMoney(paidAmount ?? 0);
		if (paymentMethod === "cash") {
			if (paid < total) {
				return { success: false as const, error: "Uang yang dibayar kurang dari total." };
			}
		} else {
			// Card / QRIS settle for the exact amount.
			paid = total;
		}
		const change = paymentMethod === "cash" ? roundMoney(paid - total) : null;

		const transactionRecord = await db.transaction(async (tx) => {
			const [newTx] = await tx
				.insert(transactions)
				.values({
					cashierId: session.user.id,
					shiftId: activeShift.id,
					subtotal: subtotal.toString(),
					taxAmount: tax.toString(),
					discountAmount: discount.toString(),
					paidAmount: paid.toString(),
					changeAmount: change === null ? null : change.toString(),
					totalAmount: total.toString(),
					paymentMethod,
					status: "completed",
					customerName: customerName || null,
					tableNumber: tableNumber || null,
				})
				.returning();

			for (const item of items) {
				const product = priceById.get(item.productId)!;

				await tx.insert(transactionItems).values({
					transactionId: newTx.id,
					productId: item.productId,
					quantity: item.quantity,
					priceAtTime: product.price.toString(),
				});

				if (product.type === "retail") {
					await deductRetailStock(tx, item.productId, item.quantity, product.name);
				} else if (product.type === "menu") {
					await deductRecipeStock(tx, item.productId, item.quantity, product.name);
				}
			}

			return newTx;
		});

		revalidatePath("/", "layout");

		return {
			success: true as const,
			transactionId: transactionRecord.id,
			totals: { subtotal, discount, tax, total, paid, change },
		};
	} catch (error) {
		console.error("Checkout error:", error);
		return {
			success: false as const,
			error: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pembayaran.",
		};
	}
}

/**
 * Voids a completed transaction (admin only): marks it cancelled and
 * restores the deducted stock so reports and inventory stay accurate.
 */
export async function voidTransaction(transactionId: string) {
	try {
		const { error, session } = await requireSession();
		if (error) return { success: false as const, error };
		if (session!.user.role !== "admin") {
			return { success: false as const, error: "Hanya admin yang dapat membatalkan transaksi." };
		}

		const [target] = await db
			.select({ id: transactions.id, status: transactions.status })
			.from(transactions)
			.where(eq(transactions.id, transactionId));

		if (!target) return { success: false as const, error: "Transaksi tidak ditemukan." };
		if (target.status !== "completed") {
			return { success: false as const, error: "Transaksi ini sudah dibatalkan." };
		}

		await db.transaction(async (tx) => {
			const [txRow] = await tx
				.update(transactions)
				.set({ status: "cancelled" })
				.where(eq(transactions.id, transactionId))
				.returning();

			const items = await tx
				.select({ productId: transactionItems.productId, quantity: transactionItems.quantity })
				.from(transactionItems)
				.where(eq(transactionItems.transactionId, transactionId));

			for (const item of items) {
				const [product] = await tx
					.select({ type: products.type })
					.from(products)
					.where(eq(products.id, item.productId));

				if (product?.type === "retail") {
					await restoreStock(tx, item.productId, item.quantity);
				} else if (product?.type === "menu") {
					const recipe = await tx
						.select({
							rawMaterialId: recipeIngredients.rawMaterialId,
							quantityNeeded: recipeIngredients.quantityNeeded,
						})
						.from(recipeIngredients)
						.where(eq(recipeIngredients.menuProductId, item.productId));

					for (const ingredient of recipe) {
						await restoreStock(
							tx,
							ingredient.rawMaterialId,
							Number(ingredient.quantityNeeded) * item.quantity
						);
					}
				}
			}
			void txRow;
		});

		revalidatePath("/", "layout");
		return { success: true as const };
	} catch (err) {
		console.error("Void transaction error:", err);
		return {
			success: false as const,
			error: err instanceof Error ? err.message : "Gagal membatalkan transaksi.",
		};
	}
}

async function restoreStock(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	productId: string,
	quantity: number
) {
	// Clamp so a manual stock edit can never push stock negative/quirky here —
	// adding stock is always safe, but recompute status from the new value.
	await tx
		.update(inventory)
		.set({
			currentStock: sql`${inventory.currentStock} + ${quantity}`,
			status: sql`CASE
				WHEN ${inventory.currentStock} + ${quantity} <= 0 THEN 'out_of_stock'::inventory_status
				WHEN ${inventory.currentStock} + ${quantity} <= 5 THEN 'low_stock'::inventory_status
				ELSE 'in_stock'::inventory_status
			END`,
		})
		.where(eq(inventory.productId, productId));
}

// --- Shift actions ---

export type OpenShiftPayload = { openingCash: number; note?: string };

export async function openShift(payload: OpenShiftPayload) {
	try {
		const { error, session } = await requireSession();
		if (error) return { success: false as const, error };

		const existing = await getActiveShift();
		if (existing) {
			return { success: false as const, error: "Masih ada shift yang terbuka." };
		}

		const openingCash = roundMoney(Math.max(payload.openingCash, 0));
		const [shift] = await db
			.insert(shifts)
			.values({ openedBy: session.user.id, openingCash: openingCash.toString(), note: payload.note || null })
			.returning();

		revalidatePath("/", "layout");
		return { success: true as const, shiftId: shift.id };
	} catch (err) {
		console.error("Open shift error:", err);
		return { success: false as const, error: "Gagal membuka shift." };
	}
}

export async function closeShift(payload: { countedCash: number; note?: string }) {
	try {
		const { error, session } = await requireSession();
		if (error) return { success: false as const, error };

		const activeShift = await getActiveShift();
		if (!activeShift) return { success: false as const, error: "Tidak ada shift yang terbuka." };

		// Aggregate the cash takings for this shift, completed only.
		const [totals] = await db
			.select({
				cashTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'cash' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				cardTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'card' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				qrisTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'qr_code' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				orderCount: sql<number>`count(*)::int`,
			})
			.from(transactions)
			.where(and(eq(transactions.shiftId, activeShift.id), eq(transactions.status, "completed")));

		const openingCash = Number(activeShift.openingCash);
		const cashTotal = Number(totals?.cashTotal ?? 0);
		const expectedCash = roundMoney(openingCash + cashTotal);

		const [closed] = await db
			.update(shifts)
			.set({
				closedAt: new Date(),
				countedCash: roundMoney(payload.countedCash).toString(),
				expectedCash: expectedCash.toString(),
				note: payload.note ?? activeShift.note,
			})
			.where(and(eq(shifts.id, activeShift.id), isNull(shifts.closedAt)))
			.returning();

		if (!closed) {
			return { success: false as const, error: "Shift sudah ditutup oleh sesi lain." };
		}

		revalidatePath("/", "layout");
		return {
			success: true as const,
			report: {
				openedAt: closed.openedAt,
				closedAt: closed.closedAt,
				openingCash,
				cashTotal,
				cardTotal: Number(totals?.cardTotal ?? 0),
				qrisTotal: Number(totals?.qrisTotal ?? 0),
				expectedCash,
				countedCash: roundMoney(payload.countedCash),
				difference: roundMoney(payload.countedCash - expectedCash),
				orderCount: totals?.orderCount ?? 0,
				cashier: session.user.name,
			},
		};
	} catch (err) {
		console.error("Close shift error:", err);
		return { success: false as const, error: "Gagal menutup shift." };
	}
}

export async function getShiftOverview() {
	try {
		const { error } = await requireSession();
		if (error) return { success: false as const, error };

		const activeShift = await getActiveShift();
		if (!activeShift) {
			return { success: true as const, open: false, report: null };
		}

		const [totals] = await db
			.select({
				cashTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'cash' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				cardTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'card' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				qrisTotal: sql<string>`COALESCE(sum(CASE WHEN ${transactions.paymentMethod} = 'qr_code' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
				orderCount: sql<number>`count(*)::int`,
			})
			.from(transactions)
			.where(and(eq(transactions.shiftId, activeShift.id), eq(transactions.status, "completed")));

		return {
			success: true as const,
			open: true,
			report: {
				openedAt: activeShift.openedAt,
				openingCash: Number(activeShift.openingCash),
				cashTotal: Number(totals?.cashTotal ?? 0),
				cardTotal: Number(totals?.cardTotal ?? 0),
				qrisTotal: Number(totals?.qrisTotal ?? 0),
				expectedCash: roundMoney(Number(activeShift.openingCash) + Number(totals?.cashTotal ?? 0)),
				orderCount: totals?.orderCount ?? 0,
			},
		};
	} catch (err) {
		console.error("Shift overview error:", err);
		return { success: false as const, error: "Gagal memuat ringkasan shift." };
	}
}
