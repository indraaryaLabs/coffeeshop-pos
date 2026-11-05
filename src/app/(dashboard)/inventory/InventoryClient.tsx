"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PackagePlus, Plus, Loader2 } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct } from "@/lib/actions/product";
import { restockProduct } from "@/lib/actions/inventory";
import { type InventoryRow } from "@/components/inventory/InventoryTable";

interface InventoryClientProps {
  initialItems: InventoryRow[];
  isAdmin: boolean;
}

export function InventoryClient({ initialItems, isAdmin }: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<"retail" | "raw_material">("retail");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    currentStock: 0 as number | "",
    price: "",
    type: "retail" as "retail" | "raw_material",
  });

  const [restockForm, setRestockForm] = useState({
    id: "",
    qty: 10,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // Filter items by active tab
  const retailItems = initialItems.filter((i) => i.productType === "retail");
  const rawItems = initialItems.filter((i) => i.productType === "raw_material");
  const displayItems = activeTab === "retail" ? retailItems : rawItems;

  // Compute stats from all items (retail + raw_material)
  const lowStockCount = initialItems.filter(
    (i) => i.status === "low_stock" || i.status === "out_of_stock"
  ).length;
  const totalValue = initialItems.reduce((acc: number, item: InventoryRow) => {
    const priceStr = String(item.pricePerUnit || "0").replace(/[^0-9.]/g, "");
    const price = parseFloat(priceStr) || 0;
    return acc + price * (item.currentStock || 0);
  }, 0);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.id) {
      toast.error("Pilih item terlebih dahulu");
      return;
    }
    setIsLoading(true);
    const result = await restockProduct(restockForm.id, restockForm.qty);
    setIsLoading(false);

    if (result.success) {
      toast.success("Restok berhasil!");
      setIsRestockOpen(false);
      setRestockForm({ id: "", qty: 10 });
    } else {
      toast.error(result.error || "Gagal restok");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("price", form.price.toString());
    formData.append("initialStock", (form.currentStock || 0).toString());
    formData.append("type", form.type);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const result = await createProduct(formData);
    setIsLoading(false);

    if (result.success) {
      toast.success(
        form.type === "raw_material" ? "Bahan baku baru ditambahkan!" : "Produk baru ditambahkan!"
      );
      setIsAddOpen(false);
      setForm({ name: "", category: "", currentStock: 0, price: "", type: "retail" });
      setImageFile(null);
    } else {
      toast.error(result.error || "Gagal menambahkan item");
    }
  };

  return (
    <>
      <TopNav
        title="Inventaris"
        subtitle="Stok Database Langsung"
        searchPlaceholder="Cari database..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header Actions & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-extrabold text-foreground tracking-tight">
                Database Inventory
              </h2>
              <div className="flex p-1 bg-card border border-border rounded-xl w-fit shadow-sm">
                <button
                  onClick={() => setActiveTab("retail")}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeTab === "retail"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-accent font-medium hover:text-foreground hover:bg-background/20"
                  }`}
                >
                  Produk
                </button>
                <button
                  onClick={() => setActiveTab("raw_material")}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    activeTab === "raw_material"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-accent font-medium hover:text-foreground hover:bg-background/20"
                  }`}
                >
                  Bahan Baku
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3">
                {/* Restock Dialog */}
                <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
                  <DialogTrigger className="flex items-center gap-2 px-5 h-11 rounded-lg bg-card text-accent font-semibold text-sm hover:bg-primary/10 transition-all border-border active:scale-95 border shadow-sm cursor-pointer">
                    <PackagePlus className="w-4 h-4" />
                    Restok
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Restok Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRestockSubmit} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Pilih Item</label>
                        <Select
                          value={restockForm.id}
                          onValueChange={(val) => {
                            if (val !== null) setRestockForm({ ...restockForm, id: val });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih item inventory..." />
                          </SelectTrigger>
                          <SelectContent>
                            {initialItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.currentStock} stok)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Jumlah Ditambah</label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={restockForm.qty}
                          onChange={(e) => setRestockForm({ ...restockForm, qty: Number(e.target.value) })}
                        />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Merestok..." : "Konfirmasi Restok"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Add New Item Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger className="flex items-center gap-2 px-6 h-11 rounded-lg bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Tambah Item Baru
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Tambah ke Inventory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddItem} className="space-y-4 py-4">
                      {/* Item Type Selector */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Tipe Item</label>
                        <Select
                          value={form.type}
                          onValueChange={(val) => {
                            if (val !== null) setForm({ ...form, type: val });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Produk (Dijual di POS)</SelectItem>
                            <SelectItem value="raw_material">Bahan Baku (Resep)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Unggah Gambar</label>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="file:border-0 file:bg-transparent file:text-sm file:font-medium text-muted-foreground w-full flex items-center p-2 h-auto"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Nama Item</label>
                        <Input
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder={form.type === "raw_material" ? "cth. Biji Espresso" : "cth. Cold Brew Botol"}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Kategori</label>
                        <Input
                          required
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          placeholder={form.type === "raw_material" ? "cth. biji, susu, sirup" : "cth. botol, merchandise"}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Stok Awal</label>
                          <Input
                            type="number"
                            required
                            value={form.currentStock}
                            onChange={(e) =>
                              setForm({ ...form, currentStock: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Harga (Rp)</label>
                          <Input
                            inputMode="numeric"
                            required
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, "") })}
                            placeholder="28000"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : form.type === "raw_material" ? (
                            "Tambah Bahan Baku"
                          ) : (
                            "Tambah Produk"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          <InventoryStats lowStockCount={lowStockCount} totalValue={totalValue} />
          <InventoryTable searchQuery={searchQuery} items={displayItems} isAdmin={isAdmin} />
        </div>
      </main>
    </>
  );
}
