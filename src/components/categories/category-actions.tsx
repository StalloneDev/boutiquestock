"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { deleteCategory } from "@/lib/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CategoryDialog } from "./category-dialog";

interface CategoryActionsProps {
  category: { id: number; name: string; description: string | null };
}

export function CategoryActions({ category }: CategoryActionsProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteCategory(category.id);
      toast.success("Catégorie supprimée");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 justify-end">
        <CategoryDialog category={category}>
          <Button variant="outline" size="sm" className="h-8" disabled={loading}>
            <Edit size={14} className="mr-2" /> Modifier
          </Button>
        </CategoryDialog>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-red-600 hover:text-red-700"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />} 
          Supprimer
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la catégorie
              <strong> {category.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700" 
              disabled={loading}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
