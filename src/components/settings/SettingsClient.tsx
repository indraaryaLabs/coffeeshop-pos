"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Store,
  Users,
  History,
  SunMoon,
  Save,
  ShieldCheck,
  Coffee,
  Clock,
  Wallet,
  CircleDollarSign,
  Scale,
} from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateShopSettings, setUserRole } from "@/lib/actions/settings";
import { formatIDR } from "@/lib/format";
import type { UserRow, ShiftHistoryRow } from "./types";

interface ShopProfile {
  shopName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRatePercent: number;
}

interface SettingsClientProps {
  isAdmin: boolean;
  currentUserId: string | null;
  shop: ShopProfile;
  users: UserRow[];
  shiftHistory: ShiftHistoryRow[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  barista: "Barista",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SettingsClient({
  isAdmin,
  currentUserId,
  shop: initialShop,
  users,
  shiftHistory,
}: SettingsClientProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: initialShop.shopName,
    address: initialShop.address,
    phone: initialShop.phone,
    receiptFooter: initialShop.receiptFooter,
    taxEnabled: initialShop.taxEnabled,
    taxRate: String(Number(initialShop.taxRatePercent)),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateShopSettings({
      shopName: form.shopName,
      address: form.address,
      phone: form.phone,
      receiptFooter: form.receiptFooter,
      taxEnabled: form.taxEnabled,
      taxRatePercent: Number(form.taxRate) || 0,
    });
    setIsSaving(false);
    if (res.success) {
      toast.success("Pengaturan toko tersimpan", { description: "Perubahan langsung berlaku di kasir." });
      router.refresh();
    } else {
      toast.error(res.error || "Gagal menyimpan pengaturan");
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const res = await setUserRole(userId, role as "admin" | "barista");
    if (res.success) {
      toast.success("Role pengguna diperbarui");
      router.refresh();
    } else {
      toast.error(res.error || "Gagal mengubah role");
    }
  };

  return (
    <>
      <TopNav title="Pengaturan" />
      <main className="pt-24 px-4 sm:px-8 pb-16 font-sans min-h-screen max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
              Pengaturan
            </h2>
            <p className="text-muted-foreground font-medium">
              Kelola profil toko, pajak struk, pengguna, dan riwayat shift kasir.
            </p>
          </div>

          {/* --- Profil Toko --- */}
          <section className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl">Profil Toko</h3>
                <p className="text-xs text-muted-foreground">
                  Nama & alamat ini tercetak di setiap struk pembayaran.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nama Toko
                  </label>
                  <Input
                    required
                    disabled={!isAdmin}
                    value={form.shopName}
                    onChange={(e) => set("shopName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    No. Telepon
                  </label>
                  <Input
                    disabled={!isAdmin}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="cth. 0812-3456-7890"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Alamat
                </label>
                <Input
                  disabled={!isAdmin}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="cth. Jl. Kemang Raya No. 12, Jakarta"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Catatan Kaki Struk
                </label>
                <Input
                  disabled={!isAdmin}
                  value={form.receiptFooter}
                  onChange={(e) => set("receiptFooter", e.target.value)}
                  placeholder="cth. Terima kasih atas kunjungannya!"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Pajak (PPN)</p>
                    <p className="text-xs text-muted-foreground">
                      Jika aktif, pajak dihitung otomatis di setiap transaksi kasir.
                    </p>
                  </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.taxEnabled}
                  disabled={!isAdmin}
                  onClick={() => set("taxEnabled", !form.taxEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    form.taxEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
                      form.taxEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
                </div>
                {form.taxEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Tarif (%)
                    </label>
                    <Input
                      inputMode="decimal"
                      disabled={!isAdmin}
                      value={form.taxRate}
                      onChange={(e) => set("taxRate", e.target.value.replace(/[^\d.]/g, ""))}
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">
                      contoh: 11 untuk PPN 11%
                    </span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="h-11 rounded-xl font-bold gap-2">
                  <Save className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              )}
            </form>
          </section>

          {/* --- Pengguna --- */}
          <section className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl">Pengguna</h3>
                <p className="text-xs text-muted-foreground">
                  Kelola role tim — admin dapat mengatur toko & membatalkan transaksi.
                </p>
              </div>
            </div>

            {isAdmin ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[160px]">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {ROLE_LABEL[u.role] === "Admin" && (
                              <ShieldCheck className="w-4 h-4 text-primary" />
                            )}
                            {u.name}
                            {isSelf && <span className="text-[10px] text-muted-foreground">(Anda)</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          {isSelf ? (
                            <span className="text-sm font-bold">{ROLE_LABEL[u.role] || u.role}</span>
                          ) : (
                            <Select
                              defaultValue={u.role}
                              onValueChange={(role) => role && handleChangeRole(u.id, role)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="barista">Barista</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hanya admin yang dapat melihat & mengelola daftar pengguna.
              </p>
            )}
          </section>

          {/* --- Riwayat Shift --- */}
          <section className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl">Riwayat Shift</h3>
                <p className="text-xs text-muted-foreground">
                  Rekap kas per shift — termasuk laporan saat tutup shift (Z-Report).
                </p>
              </div>
            </div>

            {shiftHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada shift yang dibuat.</p>
            ) : (
              <div className="space-y-3">
                {shiftHistory.map((s) => {
                  const isOpen = s.closedAt === null;
                  const diff =
                    s.countedCash !== null && s.expectedCash !== null
                      ? s.countedCash - s.expectedCash
                      : null;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isOpen ? "bg-green-500/15 text-green-600" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {formatDate(s.openedAt)}
                            {isOpen && (
                              <span className="ml-2 text-[10px] uppercase tracking-widest font-bold text-green-600">
                                Berjalan
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.cashierName}
                            {!isOpen && s.closedAt && ` — ditutup ${formatDate(s.closedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-5 sm:gap-8 text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Kas Awal</p>
                          <p className="font-bold tabular-nums flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatIDR(s.openingCash)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Seharusnya</p>
                          <p className="font-bold tabular-nums flex items-center gap-1">
                            <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            {s.expectedCash === null ? "—" : formatIDR(s.expectedCash)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Dihitung</p>
                          <p className="font-bold tabular-nums flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                            {s.countedCash === null ? "—" : formatIDR(s.countedCash)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Selisih</p>
                          <p
                            className={`font-bold tabular-nums ${
                              diff === null
                                ? ""
                                : diff === 0
                                  ? "text-green-600"
                                  : Math.abs(diff) > 0
                                    ? "text-red-500"
                                    : ""
                            }`}
                          >
                            {diff === null ? "—" : `${diff > 0 ? "+" : ""}${formatIDR(diff)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* --- Tampilan --- */}
          <section className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <SunMoon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl">Tampilan</h3>
                <p className="text-xs text-muted-foreground">
                  Tema gelap nyaman untuk kasir yang buka sampai malam.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
              <span className="text-sm font-bold text-foreground">Mode Gelap</span>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Ganti ke Terang" : "Ganti ke Gelap"}
              </Button>
            </div>
          </section>

          <p className="mt-10 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" />
            Sistem Kasir — semua transaksi terekam aman di server.
          </p>
        </motion.div>
      </main>
    </>
  );
}
