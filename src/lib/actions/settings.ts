"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shopSettings, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getShopSettings } from "@/lib/shop";

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session || !session.user) {
		return { user: null, isAdmin: false };
	}
	return { user: session.user, isAdmin: session.user.role === "admin" };
}

export async function updateShopSettings(
	data: Partial<{
		shopName: string;
		address: string;
		phone: string;
		receiptFooter: string;
		taxEnabled: boolean;
		taxRatePercent: number;
	}>
) {
	try {
		const { isAdmin } = await requireAdmin();
		if (!isAdmin) return { success: false as const, error: "Hanya admin yang dapat mengubah pengaturan toko." };

		const update: Record<string, unknown> = {};
		if (data.shopName !== undefined) {
			if (!data.shopName.trim()) return { success: false as const, error: "Nama toko tidak boleh kosong." };
			update.shopName = data.shopName.trim();
		}
		if (data.address !== undefined) update.address = data.address.trim();
		if (data.phone !== undefined) update.phone = data.phone.trim();
		if (data.receiptFooter !== undefined) update.receiptFooter = data.receiptFooter.trim();
		if (data.taxEnabled !== undefined) update.taxEnabled = data.taxEnabled;
		if (data.taxRatePercent !== undefined) {
			const rate = Number(data.taxRatePercent);
			if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
				return { success: false as const, error: "Pajak harus di antara 0 dan 100." };
			}
			update.taxRatePercent = rate.toString();
		}

		await getShopSettings(); // ensure the singleton row exists
		await db
			.update(shopSettings)
			.set({ ...update, updatedAt: new Date() })
			.where(eq(shopSettings.id, "default"));

		revalidatePath("/", "layout");
		return { success: true as const };
	} catch (err) {
		console.error("Update settings error:", err);
		return { success: false as const, error: "Gagal menyimpan pengaturan toko." };
	}
}

export async function listUsers() {
	try {
		const { isAdmin } = await requireAdmin();
		if (!isAdmin) return { success: false as const, error: "Hanya admin yang dapat melihat daftar pengguna." };

		const rows = await db
			.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
			.from(user)
			.orderBy(asc(user.createdAt));
		return { success: true as const, users: rows };
	} catch (err) {
		console.error("List users error:", err);
		return { success: false as const, error: "Gagal memuat daftar pengguna." };
	}
}

export async function setUserRole(targetUserId: string, role: "admin" | "barista") {
	try {
		const { isAdmin, user: me } = await requireAdmin();
		if (!isAdmin) return { success: false as const, error: "Hanya admin yang dapat mengubah role." };
		if (me!.id === targetUserId) {
			return { success: false as const, error: "Tidak dapat mengubah role akun sendiri." };
		}

		await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, targetUserId));

		revalidatePath("/", "layout");
		return { success: true as const };
	} catch (err) {
		console.error("Set role error:", err);
		return { success: false as const, error: "Gagal mengubah role pengguna." };
	}
}
