"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { recordStockEntry } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StockEntryFormProps {
  products: { id: number; name: string; quantity: number }[];
}

export function StockEntryForm({ products }: StockEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("0");
  const [reason, setReason] = useState<string>("Réapprovisionnement standard");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProductId) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }

    setLoading(true);
    try {
      await recordStockEntry({
        productId: Number(selectedProductId),
        quantity: Number(quantity),
        reason,
      });
      toast.success("Stock mis à jour avec succès");
      setSelectedProductId("");
      setQuantity("0");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer une entrée de stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product">Produit</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} (Stock actuel: {p.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantité entrante</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="reason">Motif / Commentaire</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Arrivage fournisseur, Retour client..."
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading || !selectedProductId}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
            Valider l&apos;entrée de stock
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
