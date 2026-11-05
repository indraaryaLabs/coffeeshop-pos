"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { useCartStore } from "@/hooks/use-cart";
import { deleteProduct } from "@/lib/actions/inventory";
import { editProduct } from "@/lib/actions/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  index: number;
  isAdmin?: boolean;
}

export function ProductCard({ product, index, isAdmin = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [imgError, setImgError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    name: product.name,
    price: product.price.toString(),
    imageUrl: product.image || "",
  });

  const isMenu = product.type === "menu" || product.type === undefined;
  const isRetail = product.type === "retail";

  // Out of stock: retail with 0 stock, OR menu with unavailable ingredients (stock set to 0)
  const isOutOfStock = product.stock === 0;
  const hasStock = isRetail && product.stock !== undefined;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    const res = await deleteProduct(product.id);
    if (res.success) {
      toast.success(`${product.name} dihapus`);
    } else {
      toast.error(res.error || "Gagal menghapus produk");
    }
    setIsDeleting(false);
    setShowConfirm(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      imageUrl: product.image || "",
    });
    setImageFile(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("name", editForm.name);
    formData.append("price", editForm.price);
    formData.append("category", product.category || "Uncategorized");
    formData.append("type", product.type || "menu");

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await editProduct(formData);
    setIsSaving(false);

    if (res.success) {
      toast.success(`${editForm.name} berhasil diperbarui`);
      setIsEditOpen(false);
    } else {
      toast.error(res.error || "Gagal memperbarui produk");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative product-card"
    >
      {/* Confirm Delete Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 z-30 bg-background/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center border-2 border-destructive/30">
          <Trash2 className="w-7 h-7 text-destructive mb-2" />
          <p className="font-bold text-sm text-foreground mb-1">Hapus {product.name}?</p>
          <p className="text-xs text-muted-foreground mb-4">
            Produk dan data resepnya akan dihapus permanen.
          </p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
              className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      )}

      <button
        disabled={isOutOfStock}
        onClick={() => !isOutOfStock && addItem(product)}
        className={`group relative flex flex-col text-left bg-card rounded-xl overflow-hidden transition-all duration-300 border w-full ${
          isOutOfStock
            ? "border-destructive/40 opacity-75 cursor-not-allowed"
            : "border-border hover:shadow-xl active:scale-[0.98]"
        }`}
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          {!imgError ? (
            <Image
              unoptimized
              src={product.image || "/images/placeholder.svg"}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 ${!isOutOfStock && "group-hover:scale-105"}`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center transition-colors duration-500">
              <span className="text-5xl font-headline font-extrabold text-muted-foreground/30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Stok habis overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl rotate-[-10deg]">
                {isMenu ? "Tidak Tersedia" : "Stok Habis"}
              </span>
              {product.unavailableReason && (
                <span className="text-[10px] text-white font-medium bg-black/60 px-3 py-1 rounded-full max-w-[90%] truncate">
                  {product.unavailableReason}
                </span>
              )}
            </div>
          )}

          {product.badge && !isOutOfStock && (
            <span className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold font-headline">
              {product.badge}
            </span>
          )}

          {/* Indikator stok retail */}
          {hasStock && product.stock! > 0 && (
            <span className={`absolute bottom-3 left-3 text-white/90 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded backdrop-blur-md ${
              product.stock! <= 5
                ? "bg-amber-600/70"
                : "bg-black/50"
            }`}>
              {product.stock! <= 5 ? `sisa ${product.stock}` : `stok ${product.stock}`}
            </span>
          )}
        </div>
        <div className="p-5 w-full">
          <h3 className="font-headline font-bold text-lg text-foreground truncate">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
            {product.description || "Dibuat segar dari bahan pilihan"}
          </p>
          <div className="flex justify-between items-end">
            <span className="text-xl font-bold font-headline text-foreground">
              {formatIDR(product.price)}
            </span>
            {!isOutOfStock && (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <Plus className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </button>

      {isAdmin && !isOutOfStock && (
        <>
          {/* Tombol hapus — admin saja */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="product-delete-btn absolute top-2 left-2 z-20 w-8 h-8 rounded-full bg-black/50 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-destructive hover:text-white transition-all duration-200 backdrop-blur-md"
            title="Hapus produk"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Tombol edit — admin saja */}
          <button
            onClick={handleEditClick}
            className="product-delete-btn absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/50 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-primary hover:text-white transition-all duration-200 backdrop-blur-md"
            title="Edit produk"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Produk: {product.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Nama Produk</label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Harga (Rp)</label>
              <Input
                inputMode="numeric"
                required
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value.replace(/[^\d]/g, "") })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Gambar Produk</label>
              {editForm.imageUrl && !imageFile && (
                <div className="mb-2 relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                  <Image unoptimized src={editForm.imageUrl} alt="Saat ini" fill className="object-cover" />
                </div>
              )}
              <Input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:border-0 hover:file:bg-primary/20 file:px-4 file:py-1 file:rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Unggah gambar baru untuk mengganti yang lama (JPG/PNG/WebP, maks 5 MB).
              </p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
