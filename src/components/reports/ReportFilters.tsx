"use client";

import { motion } from "framer-motion";
import { CalendarRange, Banknote, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportFiltersProps {
  dateRange: string;
  paymentMethod: string;
  onDateRangeChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onApply: () => void;
}

const DATE_LABEL: Record<string, string> = {
  all: "Semua Waktu",
  today: "Hari Ini",
  "7days": "7 Hari Terakhir",
  "30days": "30 Hari Terakhir",
  "90days": "90 Hari Terakhir",
};

const PAYMENT_LABEL: Record<string, string> = {
  all: "Semua Metode",
  cash: "Tunai",
  card: "Kartu",
  qr_code: "QRIS",
};

export function ReportFilters({
  dateRange,
  paymentMethod,
  onDateRangeChange,
  onPaymentMethodChange,
  onApply,
}: ReportFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-secondary rounded-2xl p-6 mb-8 flex flex-wrap items-end gap-6"
    >
      <div className="flex-1 min-w-[240px]">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
          Periode
        </label>
        <Select
          value={dateRange}
          onValueChange={(value) => {
            if (value !== null) onDateRangeChange(value);
          }}
        >
          <SelectTrigger className="bg-card rounded-xl border-border h-11">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Pilih periode" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DATE_LABEL) as string[]).map((k) => (
              <SelectItem key={k} value={k}>
                {DATE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
          Metode Pembayaran
        </label>
        <Select
          value={paymentMethod}
          onValueChange={(value) => {
            if (value !== null) onPaymentMethodChange(value);
          }}
        >
          <SelectTrigger className="bg-card rounded-xl border-border h-11">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Semua metode" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PAYMENT_LABEL) as string[]).map((k) => (
              <SelectItem key={k} value={k}>
                {PAYMENT_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button
          onClick={onApply}
          className="bg-accent text-accent-foreground px-8 h-11 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Terapkan
        </Button>
      </div>
    </motion.div>
  );
}
