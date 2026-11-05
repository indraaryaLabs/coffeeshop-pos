"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useReactToPrint } from "react-to-print";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
  Printer,
  CheckCircle2,
  User,
  PlayCircle,
  LockKeyhole,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  processCheckout,
  openShift,
  closeShift,
  type CheckoutPayload,
} from "@/lib/actions/transaction";
import { formatIDR } from "@/lib/format";
import type { PaymentMethod } from "@/lib/catalog";
import { ThermalReceipt } from "./ThermalReceipt";
import type { ShopProfile, ShiftSummary } from "./POSClient";

type CheckoutTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number | null;
};

interface OrderSidebarProps {
  shop: ShopProfile;
  activeShift: ShiftSummary | null;
  cashierName: string;
  onShiftChanged: () => void;
}

export function OrderSidebar({ shop, activeShift, cashierName, onShiftChanged }: OrderSidebarProps) {
  const router = useRouter();
  const {
    items,
    orderNumber,
    orderType,
    incrementItem,
    decrementItem,
    removeAll,
    clearCart,
    setOrderType,
    subtotal,
    itemCount,
  } = useCartStore();
  const shift = activeShift;

  const [animateRef] = useAutoAnimate({ duration: 200 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [successTotals, setSuccessTotals] = useState<CheckoutTotals | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);

  // Payment dialog state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");

  // Customer dialog
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [localCustomerName, setLocalCustomerName] = useState("");
  const [localTableNumber, setLocalTableNumber] = useState("");
  const [activeCustomerName, setActiveCustomerName] = useState("Guest");
  const [activeTableNumber, setActiveTableNumber] = useState("");

  // Shift dialogs
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [openingCashInput, setOpeningCashInput] = useState("0");
  const [isShiftBusy, setIsShiftBusy] = useState(false);

  const computedTotals = (): CheckoutTotals => {
    const sub = subtotal();
    const discount = Math.min(Math.max(Number(discountInput) || 0, 0), sub);
    const tax = shop.taxEnabled ? ((sub - discount) * shop.taxRatePercent) / 100 : 0;
    const total = sub - discount + tax;
    const cash = Number(cashInput) || 0;
    const paid = paymentMethod === "cash" ? cash : total;
    return {
      subtotal: sub,
      discount,
      tax,
      total,
      paid,
      change: paymentMethod === "cash" ? Math.max(cash - total, 0) : null,
    };
  };

  const totals = computedTotals();
  const cashShort = paymentMethod === "cash" && totals.paid < totals.total;

  useEffect(() => {
    if (scrollRef.current && !checkoutSuccess) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length, checkoutSuccess]);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk_${shop.shopName.replace(/\s+/g, "_")}_${orderNumber}`,
  });

  const resetOrder = () => {
    setCheckoutSuccess(false);
    setSuccessTotals(null);
    setLastTransactionId(null);
    clearCart();
    setActiveCustomerName("Guest");
    setActiveTableNumber("");
    setLocalCustomerName("");
    setLocalTableNumber("");
    setDiscountInput("");
    setCashInput("");
    setPaymentMethod("cash");
  };

  const openPaymentDialog = () => {
    if (items.length === 0) return;
    setCashInput("");
    setIsPaymentOpen(true);
  };

  const handleCheckout = async () => {
    if (items.length === 0 || cashShort) return;
    setIsCheckingOut(true);
    try {
      const payload: CheckoutPayload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        paidAmount: paymentMethod === "cash" ? totals.paid : undefined,
        discountAmount: totals.discount > 0 ? totals.discount : undefined,
        customerName: activeCustomerName === "Guest" ? undefined : activeCustomerName,
        tableNumber: activeTableNumber || undefined,
      };

      const res = await processCheckout(payload);
      if (res.success) {
        toast.success("Pembayaran berhasil!", { description: `Pesanan #${orderNumber} tercatat.` });
        setLastTransactionId(res.transactionId);
        setSuccessTotals(res.totals);
        setIsPaymentOpen(false);
        setCheckoutSuccess(true);
      } else {
        toast.error(res.error || "Pembayaran gagal");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat pembayaran");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCustomerName(localCustomerName.trim() || "Guest");
    setActiveTableNumber(localTableNumber.trim());
    setIsCustomerDialogOpen(false);
    toast.success("Info pelanggan tersimpan");
  };

  // --- Shift handlers ---
  const handleOpenShift = async () => {
    setIsShiftBusy(true);
    const res = await openShift({ openingCash: Number(openingCashInput) || 0 });
    setIsShiftBusy(false);
    if (res.success) {
      toast.success("Shift dibuka", { description: "Kasir siap menerima pesanan." });
      onShiftChanged();
    } else {
      toast.error(res.error || "Gagal membuka shift");
    }
  };

  const handleCloseShift = async () => {
    setIsShiftBusy(true);
    const res = await closeShift({ countedCash: Number(countedCash) || 0 });
    setIsShiftBusy(false);
    if (res.success && res.report) {
      toast.info("Shift ditutup", {
        description: `Selisih kas: ${formatIDR(res.report.difference)}`,
      });
      setIsCloseShiftOpen(false);
      setCountedCash("");
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => handlePrint(), 50);
      setTimeout(() => {
        document.body.style.overflow = overflow;
        onShiftChanged();
        router.refresh();
      }, 400);
    } else {
      toast.error(res.error || "Gagal menutup shift");
    }
  };

  const quickCashAmounts = [20000, 50000, 100000, 150000, 200000];

  return (
    <aside
      className="w-full lg:w-[400px] flex-shrink-0 bg-card border-l border-border flex flex-col relative lg:h-[calc(100vh-4rem)] print:hidden"
    >
      {/* No active shift → gate the register */}
      {!activeShift ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <PlayCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-foreground">Buka Shift</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Isi kas awal laci, lalu mulai menerima pesanan.
            </p>
          </div>
          <div className="w-full max-w-[260px] space-y-2 text-left">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kas awal laci (Rp)
            </label>
            <Input
              inputMode="numeric"
              value={openingCashInput}
              onChange={(e) => setOpeningCashInput(e.target.value.replace(/[^\d]/g, ""))}
              className="h-11 font-medium"
              placeholder="0"
            />
          </div>
          <Button
            onClick={handleOpenShift}
            disabled={isShiftBusy}
            className="w-full max-w-[260px] h-12 rounded-xl font-bold text-base"
          >
            {isShiftBusy ? "Membuka..." : "Buka Shift"}
          </Button>
        </div>
      ) : (
        <>
          {/* Success overlay */}
          {checkoutSuccess && successTotals && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-green-500/15 text-green-600 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-headline font-extrabold text-2xl mb-1">Pembayaran Berhasil</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Pesanan #{orderNumber} tersimpan & stok telah dikurangi.
              </p>
              <div className="w-full max-w-[260px] rounded-xl border border-border bg-card p-4 text-sm space-y-1.5 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatIDR(successTotals.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span className="font-medium">{formatIDR(successTotals.paid)}</span>
                </div>
                {successTotals.change !== null && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-muted-foreground">Kembalian</span>
                    <span className="font-bold">{formatIDR(successTotals.change)}</span>
                  </div>
                )}
              </div>
              <div className="w-full max-w-[260px] space-y-3">
                <Button
                  onClick={() => handlePrint()}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 font-bold text-base gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Struk
                </Button>
                <Button onClick={resetOrder} className="w-full h-12 rounded-xl font-bold text-base">
                  Pesanan Baru
                </Button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="p-5 pb-3 border-b border-border/70">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h2 className="font-headline font-extrabold text-xl tracking-tight text-foreground">
                Pesanan #{orderNumber}
              </h2>
              <div className="flex p-0.5 rounded-lg bg-secondary text-[10px] font-bold uppercase tracking-wider">
                <button
                  onClick={() => setOrderType("dine_in")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    orderType === "dine_in" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Dine-in
                </button>
                <button
                  onClick={() => setOrderType("take_away")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    orderType === "take_away" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Take-away
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <button
                onClick={() => setIsCustomerDialogOpen(true)}
                className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
              >
                <User className="w-3 h-3" />
                {activeCustomerName}
                {activeTableNumber && <span className="text-accent">• Meja {activeTableNumber}</span>}
              </button>
              <button
                onClick={() => setIsCloseShiftOpen(true)}
                className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                title="Tutup shift"
              >
                <LockKeyhole className="w-3 h-3" />
                Shift • {new Date(activeShift.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </button>
            </div>
          </div>

          {/* Cart items */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-5">
            <div ref={animateRef} className="space-y-3 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Belum ada item</p>
                  <p className="text-xs opacity-60 mt-1">Pilih menu di sebelah kiri</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 group">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border relative">
                      <Image
                        src={item.product.image || "/images/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {item.product.name}
                        </h4>
                        <span className="font-bold text-sm text-foreground flex-shrink-0 tabular-nums">
                          {formatIDR(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">
                        {formatIDR(item.product.price)} / item
                      </p>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => decrementItem(item.product.id)}
                          className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors active:scale-90"
                          aria-label="Kurangi"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold text-foreground tabular-nums w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => incrementItem(item.product.id)}
                          className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors active:scale-90"
                          aria-label="Tambah"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeAll(item.product.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary + checkout */}
          <div className="border-t border-border bg-secondary/40 p-5 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount()} item)</span>
                <span className="font-medium tabular-nums">{formatIDR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Diskon</span>
                <input
                  inputMode="numeric"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  className="w-24 text-right bg-card border border-border rounded-md px-2 py-0.5 text-foreground font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {shop.taxEnabled && (
                <div className="flex justify-between text-muted-foreground">
                  <span>PPN {shop.taxRatePercent}%</span>
                  <span className="font-medium tabular-nums">{formatIDR(totals.tax)}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-end border-t border-border/60">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-headline font-extrabold text-2xl text-foreground tabular-nums">
                  {formatIDR(totals.total)}
                </span>
              </div>
            </div>

            <Button
              onClick={openPaymentDialog}
              disabled={items.length === 0}
              className="w-full h-12 rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Bayar — {formatIDR(totals.total)}
            </Button>
          </div>
        </>
      )}

      {/* Payment dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <div className="bg-secondary/50 px-5 py-3 border-b border-border">
            <DialogTitle className="font-headline font-extrabold text-lg">Pembayaran</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center gap-1.5 h-20 rounded-xl border-2 transition-all ${
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tunai</span>
              </button>
              <button
                onClick={() => setPaymentMethod("qr_code")}
                className={`flex flex-col items-center gap-1.5 h-20 rounded-xl border-2 transition-all ${
                  paymentMethod === "qr_code"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span className="text-[11px] font-bold uppercase tracking-wider">QRIS</span>
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center gap-1.5 h-20 rounded-xl border-2 transition-all ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Kartu</span>
              </button>
            </div>

            {paymentMethod === "cash" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Uang diterima
                </label>
                <Input
                  inputMode="numeric"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={String(Math.round(totals.total))}
                  className="h-12 text-lg font-bold tabular-nums"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCashInput(String(Math.ceil(totals.total / 1000) * 1000))}
                    className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-colors"
                  >
                    Uang pas
                  </button>
                  {quickCashAmounts
                    .filter((v) => v > totals.total)
                    .slice(0, 3)
                    .map((v) => (
                      <button
                        key={v}
                        onClick={() => setCashInput(String(v))}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-colors tabular-nums"
                      >
                        {v / 1000}rb
                      </button>
                    ))}
                </div>
                <div
                  className={`flex justify-between items-center rounded-xl px-4 py-3 text-sm ${
                    cashShort ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <span className="font-medium">
                    {cashShort ? "Kurang" : "Kembalian"}
                  </span>
                  <span className={`font-headline font-extrabold text-lg tabular-nums ${cashShort ? "text-destructive" : "text-green-600"}`}>
                    {formatIDR(paymentMethod === "cash" ? Math.abs(totals.paid - totals.total) : 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-secondary px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  {paymentMethod === "qr_code" ? "Scan QRIS customer" : "Customer tap kartunya"}
                </p>
                <p className="font-headline font-extrabold text-2xl tabular-nums">
                  {formatIDR(totals.total)}
                </p>
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut || cashShort || (paymentMethod === "cash" && !cashInput)}
              className="w-full h-12 rounded-xl font-bold text-base gap-2"
            >
              {isCheckingOut ? "Memproses..." : `Konfirmasi — ${formatIDR(totals.total)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-headline font-extrabold text-xl">Info Pelanggan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</label>
              <Input
                value={localCustomerName}
                onChange={(e) => setLocalCustomerName(e.target.value)}
                placeholder="cth. Bapak Andi"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No. Meja (opsional)</label>
              <Input
                value={localTableNumber}
                onChange={(e) => setLocalTableNumber(e.target.value)}
                placeholder="cth. 12"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-bold">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close shift dialog */}
      {shift && (
      <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-headline font-extrabold text-xl">Tutup Shift & Hitung Kas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-border p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Pesanan selesai</span>
                <span className="font-bold text-foreground tabular-nums">{shift.orderCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tunai (termasuk kas awal)</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatIDR(shift.openingCash + shift.cashTotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>QRIS / Kartu</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatIDR(shift.qrisTotal + shift.cardTotal)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Uang tunai di hitung
              </label>
              <Input
                inputMode="numeric"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value.replace(/[^\d]/g, ""))}
                className="h-11 font-bold tabular-nums"
                autoFocus
              />
            </div>
            <Button
              onClick={handleCloseShift}
              disabled={isShiftBusy || countedCash === ""}
              className="w-full h-11 rounded-xl font-bold"
            >
              {isShiftBusy ? "Menutup..." : "Tutup Shift & Cetak Laporan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Hidden layout for thermal printing */}
      <ThermalReceipt
        ref={receiptRef}
        shop={shop}
        items={items}
        totals={
          successTotals ?? {
            ...totals,
            paid: totals.paid,
            change: paymentMethod === "cash" ? Math.max(totals.paid - totals.total, 0) : null,
          }
        }
        orderNumber={orderNumber}
        orderType={orderType}
        transactionId={lastTransactionId}
        cashierName={cashierName}
        customerName={activeCustomerName}
        tableNumber={activeTableNumber}
        paymentMethod={paymentMethod}
      />
    </aside>
  );
}
