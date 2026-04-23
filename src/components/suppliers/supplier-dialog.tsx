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
import { createSupplier } from "@/lib/actions";
import { toast } from "sonner";

export function SupplierDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
    };

    try {
      await createSupplier(data);
      toast.success("Fournisseur enregistré avec succès");
      setOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du fournisseur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} /> Nouveau fournisseur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un fournisseur</DialogTitle>
            <DialogDescription>
              Enregistrez les coordonnées d'un nouveau partenaire commercial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'entreprise</Label>
              <Input id="name" name="name" placeholder="Ex: Boutique Grossiste SARL" required disabled={loading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input id="contactName" name="contactName" placeholder="Ex: Jean Dupont" disabled={loading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" placeholder="+221 ..." disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="contact@fournisseur.com" disabled={loading} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Adresse physique</Label>
              <Textarea id="address" name="address" placeholder="Rue, Ville, Pays..." disabled={loading} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
