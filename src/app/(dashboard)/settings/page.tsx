import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shifts, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getShopSettings } from "@/lib/shop";
import { SettingsClient } from "@/components/settings/SettingsClient";
import type { ShiftHistoryRow, UserRow } from "@/components/settings/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";
  const currentUserId = session?.user?.id ?? null;

  const shop = await getShopSettings();

  // Only admins can manage users & see the full user list.
  let users: UserRow[] = [];
  if (isAdmin) {
    const rows = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
      .from(user)
      .orderBy(desc(user.createdAt));
    users = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  // Shift history with the cashier who opened the shift.
  const shiftRows = await db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      closedAt: shifts.closedAt,
      openingCash: shifts.openingCash,
      countedCash: shifts.countedCash,
      expectedCash: shifts.expectedCash,
      note: shifts.note,
      cashierName: user.name,
    })
    .from(shifts)
    .leftJoin(user, eq(shifts.openedBy, user.id))
    .orderBy(desc(shifts.openedAt))
    .limit(10);

  const shiftHistory: ShiftHistoryRow[] = shiftRows.map((s) => ({
    id: s.id,
    openedAt: s.openedAt.toISOString(),
    closedAt: s.closedAt ? s.closedAt.toISOString() : null,
    openingCash: Number(s.openingCash),
    countedCash: s.countedCash === null ? null : Number(s.countedCash),
    expectedCash: s.expectedCash === null ? null : Number(s.expectedCash),
    note: s.note,
    cashierName: s.cashierName ?? "—",
  }));

  return (
    <SettingsClient
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      shop={{
        shopName: shop.shopName,
        address: shop.address,
        phone: shop.phone,
        receiptFooter: shop.receiptFooter,
        taxEnabled: shop.taxEnabled,
        taxRatePercent: Number(shop.taxRatePercent),
      }}
      users={users}
      shiftHistory={shiftHistory}
    />
  );
}
