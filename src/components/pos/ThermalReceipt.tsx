import React, { forwardRef } from "react";
import type { CartItem } from "@/hooks/use-cart";
import type { PaymentMethod } from "@/lib/catalog";
import { formatIDR } from "@/lib/format";
import type { ShopProfile } from "./POSClient";

interface ThermalReceiptProps {
  shop: ShopProfile;
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid: number;
    change: number | null;
  };
  orderNumber: number;
  orderType: "dine_in" | "take_away";
  transactionId?: string | null;
  cashierName?: string;
  customerName?: string;
  tableNumber?: string;
  paymentMethod?: PaymentMethod;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "TUNAI",
  card: "KARTU",
  qr_code: "QRIS",
};

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(function ThermalReceipt(
  {
    shop,
    items,
    totals,
    orderNumber,
    orderType,
    transactionId,
    cashierName = "Kasir",
    customerName = "Guest",
    tableNumber,
    paymentMethod = "cash",
  },
  ref
) {
  const date = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const showPayments = transactionId !== null;

  return (
    <div ref={ref} className="hidden print:block fixed inset-0 bg-white text-black z-[9999] font-mono text-sm print:block">
      <div className="max-w-[300px] mx-auto p-4 w-[80mm]">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-bold text-2xl mb-1 uppercase">{shop.shopName}</h1>
          {shop.address && <p className="text-xs">{shop.address}</p>}
          {shop.phone && <p className="text-xs">Telp. {shop.phone}</p>}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span>No. Order</span>
            <span className="font-bold">#{orderNumber}</span>
          </div>
          {transactionId && (
            <div className="flex justify-between">
              <span>ID Transaksi</span>
              <span>{transactionId.substring(0, 8).toUpperCase()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>{cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe</span>
            <span>{orderType === "dine_in" ? `DINE-IN${tableNumber ? ` — MEJA ${tableNumber}` : ""}` : "TAKE-AWAY"}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan</span>
            <span>{customerName}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Items */}
        <div className="space-y-1.5 mb-2">
          {items.length === 0 && !showPayments && <p className="text-xs text-center italic">— Nota sementara —</p>}
          {items.map((item) => (
            <div key={item.product.id}>
              <p className="font-bold">{item.product.name}</p>
              <div className="flex justify-between">
                <span>
                  {item.quantity} x {formatIDR(item.product.price)}
                </span>
                <span>{formatIDR(item.product.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatIDR(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{formatIDR(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex justify-between">
              <span>PPN {shop.taxRatePercent}%</span>
              <span>{formatIDR(totals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-black pt-1 mt-1">
            <span>TOTAL</span>
            <span>{formatIDR(totals.total)}</span>
          </div>
          {showPayments && (
            <>
              <div className="flex justify-between pt-1">
                <span>{METHOD_LABEL[paymentMethod]}</span>
                <span>{formatIDR(totals.paid)}</span>
              </div>
              {totals.change !== null && (
                <div className="flex justify-between font-bold">
                  <span>Kembalian</span>
                  <span>{formatIDR(totals.change)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <p className="text-center text-xs mb-1">{shop.receiptFooter}</p>
        <p className="text-center text-[10px] text-gray-700">{shop.shopName}</p>
        <style>{`
          @media print {
            @page { margin: 0; size: 80mm auto; }
          }
        `}</style>
      </div>
    </div>
  );
});
