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
import { Plus, Loader2 } from "lucide-react";
import { createCategory, updateCategory } from "@/lib/actions";
import { toast } from "sonner";

interface CategoryDialogProps {
  category?: { id: number; name: string; description: string | null };
  children?: React.ReactNode;
}

export function CategoryDialog({ category, children }: CategoryDialogProps) {
  const isEditing = !!category;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      if (isEditing && category) {
        await updateCategory(category.id, { name, description });
        toast.success("Catégorie mise à jour");
      } else {
        await createCategory({ name, description });
        toast.success("Catégorie créée avec succès");
      }
      setOpen(false);
    } catch (error) {
      toast.error(isEditing ? "Erreur lors de la mise à jour" : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus size={16} /> Nouvelle catégorie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations de la catégorie existante."
                : "Créez une nouvelle catégorie pour organiser vos produits."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de la catégorie</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name}
                placeholder="Ex: Électronique, Vêtements..."
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optionnel)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={category?.description || ""}
                placeholder="Brève description de la catégorie..."
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
              {isEditing ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
