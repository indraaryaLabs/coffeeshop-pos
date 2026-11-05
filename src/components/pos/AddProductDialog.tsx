"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Package, FlaskConical, X, Search, TriangleAlert, CirclePlus } from "lucide-react";
import { createProduct } from "@/lib/actions/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/catalog";

interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

interface SelectedIngredient {
  rawMaterialId: string;
  name: string;
  quantityNeeded: number;
  unit: string;
}

interface AddProductDialogProps {
  rawMaterials?: RawMaterial[];
}

export function AddProductDialog({ rawMaterials = [] }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<"menu" | "retail">("menu");
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");

  const filteredMaterials = rawMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !selectedIngredients.some((s) => s.rawMaterialId === m.id)
  );

  const addIngredient = (material: RawMaterial) => {
    setSelectedIngredients((prev) => [
      ...prev,
      {
        rawMaterialId: material.id,
        name: material.name,
        quantityNeeded: 1,
        unit: material.unit,
      },
    ]);
    setIngredientSearch("");
  };

  const removeIngredient = (id: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i.rawMaterialId !== id));
  };

  const updateIngredientQty = (id: string, qty: number) => {
    setSelectedIngredients((prev) =>
      prev.map((i) => (i.rawMaterialId === id ? { ...i, quantityNeeded: qty } : i))
    );
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate: menu items must have at least 1 ingredient
    if (productType === "menu" && selectedIngredients.length === 0) {
      toast.error("Menu harus punya minimal 1 bahan", {
        description: "Pilih bahan baku yang dipakai untuk membuat menu ini.",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("type", productType);

    // Add ingredients JSON for menu items
    if (productType === "menu") {
      formData.set(
        "ingredients",
        JSON.stringify(
          selectedIngredients.map((i) => ({
            rawMaterialId: i.rawMaterialId,
            quantityNeeded: i.quantityNeeded,
            unit: i.unit,
          }))
        )
      );
    }

    const res = await createProduct(formData);

    if (res.success) {
      toast.success("Produk berhasil dibuat");
      setOpen(false);
      setSelectedIngredients([]);
      setProductType("menu");
    } else {
      toast.error(res.error || "Gagal membuat produk");
    }

    setLoading(false);
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setSelectedIngredients([]);
      setProductType("menu");
      setIngredientSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl mr-2" />}
      >
        <Plus className="w-4 h-4" />
        Produk Baru
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl font-extrabold">
            Tambah Produk Baru
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          {/* Product Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Tipe Produk</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProductType("menu")}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  productType === "menu"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Menu
              </button>
              <button
                type="button"
                onClick={() => setProductType("retail")}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  productType === "retail"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                <Package className="w-4 h-4" />
                Produk Retail
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {productType === "menu"
                ? "Menu dibuat dari bahan baku — wajib memilih bahan resepnya."
                : "Produk retail dijual langsung dari stok inventory."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Nama Produk</label>
            <Input name="name" required placeholder="cth. Kopi Susu Gula Aren" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Deskripsi</label>
            <Input
              name="description"
              required
              placeholder="cth. Perpaduan kopi robusta dengan gula aren asli"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Kategori</label>
            <Select name="category" required defaultValue={categories[1].value}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.value !== "all")
                  .map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Gambar Produk</label>
            <Input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:border-0 hover:file:bg-primary/20 file:px-4 file:py-1 file:rounded-xl file:mr-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Harga (Rp)</label>
              <Input
                name="price"
                inputMode="numeric"
                required
                placeholder="25000"
                pattern="[0-9]+"
                title="Masukkan angka tanpa titik/koma"
              />
            </div>
            {productType === "retail" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Stok Awal</label>
                <Input name="initialStock" type="number" min="0" required placeholder="10" />
              </div>
            )}
          </div>

          {/* Ingredient Picker — only for menu items */}
          {productType === "menu" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  Bahan Resep
                  <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  {selectedIngredients.length} dipilih
                </span>
              </div>

              {/* Selected Ingredients */}
              {selectedIngredients.length > 0 && (
                <div className="space-y-2">
                  {selectedIngredients.map((ing) => (
                    <div
                      key={ing.rawMaterialId}
                      className="flex items-center gap-3 bg-secondary/60 rounded-lg px-3 py-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">
                        {ing.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          value={ing.quantityNeeded}
                          onChange={(e) =>
                            updateIngredientQty(ing.rawMaterialId, Number(e.target.value) || 1)
                          }
                          className="w-16 h-7 text-xs text-center px-1"
                        />
                        <span className="text-[10px] text-muted-foreground font-medium w-10">
                          {ing.unit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing.rawMaterialId)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        aria-label="Hapus bahan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search & Add Ingredients */}
              <div className="relative">
                <Input
                  placeholder="Cari bahan baku..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-9"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>

              {ingredientSearch && (
                <div className="bg-card border border-border rounded-lg max-h-40 overflow-y-auto">
                  {filteredMaterials.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                      Bahan baku tidak ditemukan. Tambahkan di menu Inventory dulu.
                    </div>
                  ) : (
                    filteredMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => addIngredient(mat)}
                        className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground">{mat.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">
                            Stok: {mat.currentStock} {mat.unit}
                          </span>
                        </div>
                        <CirclePlus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {rawMaterials.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <TriangleAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Belum ada bahan baku. Tambahkan bahan baku di menu{" "}
                    <strong>Inventory</strong> dulu sebelum membuat menu.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full font-bold">
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
