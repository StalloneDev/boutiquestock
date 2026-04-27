"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/actions";
import { toast } from "sonner";
import Image from "next/image";

interface ProductDialogProps {
  categories: { id: number; name: string }[];
  product?: any;
  children?: React.ReactNode;
}

export function ProductDialog({ categories, product, children }: ProductDialogProps) {
  const isEditing = !!product;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      let finalImageUrl = product?.imageUrl || null;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) {
          throw new Error("Erreur lors de l'upload de l'image");
        }

        const { url } = await res.json();
        finalImageUrl = url;
      }

      const data = {
        name: formData.get("name") as string,
        categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
        quantity: Number(formData.get("quantity") || 0),
        unitCostPrice: Number(formData.get("unitCostPrice") || 0),
        unitSalePrice: Number(formData.get("unitSalePrice") || 0),
        lowStockThreshold: Number(formData.get("lowStockThreshold") || 2),
        notes: formData.get("notes") as string,
        barcode: formData.get("barcode") as string,
        imageUrl: finalImageUrl,
      };

      if (isEditing && product) {
        await updateProduct(product.id, data);
        toast.success("Produit mis à jour");
      } else {
        await createProduct(data);
        toast.success("Produit créé avec succès");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus size={16} /> Nouveau produit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations du produit sélectionné."
                : "Enregistrez un nouveau produit dans votre inventaire. Image optionnelle."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 grid-cols-2">
            {/* Zone d'image (pleine largeur pour aérer) */}
            <div className="col-span-2 flex flex-col gap-3 items-start border-b pb-4">
              <Label>Image du Produit (Optionnel)</Label>
              <div className="flex items-center gap-4 w-full">
                <div className="relative w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Aperçu" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-400 opacity-50" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-2">Formats acceptés : JPG, PNG. Poids max : 4Mo.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="name">Nom du produit</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                placeholder="Ex: iPhone 15 Pro"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Catégorie</Label>
              <Select name="categoryId" disabled={loading} defaultValue={product?.categoryId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barcode">Code-barres (Optionnel)</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={product?.barcode}
                placeholder="Scanner ou saisir..."
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Stock Initial</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                defaultValue={product?.quantity ?? "0"}
                min="0"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lowStockThreshold">Seuil d&apos;alerte</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                defaultValue={product?.lowStockThreshold ?? "2"}
                min="1"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unitCostPrice">Prix d&apos;achat (Unitaire)</Label>
              <Input
                id="unitCostPrice"
                name="unitCostPrice"
                type="number"
                step="0.01"
                defaultValue={product?.unitCostPrice ?? "0"}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unitSalePrice">Prix de vente (Unitaire)</Label>
              <Input
                id="unitSalePrice"
                name="unitSalePrice"
                type="number"
                step="0.01"
                defaultValue={product?.unitSalePrice ?? "0"}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="notes">Notes/Description</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={product?.notes}
                placeholder="Détails supplémentaires..."
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? "Mettre à jour" : "Enregistrer le produit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
