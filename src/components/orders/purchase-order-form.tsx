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
import { Loader2, Plus, Trash2, Send } from "lucide-react";
import { createPurchaseOrder } from "@/lib/actions";
import { toast } from "sonner";

interface PurchaseOrderFormProps {
  suppliers: { id: number; name: string }[];
  products: { id: number; name: string; unitCostPrice: string | null }[];
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseOrderForm({ suppliers, products }: PurchaseOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", quantity: 1, unitCost: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitCost: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill cost if product changed
    if (field === "productId") {
      const product = products.find(p => p.id.toString() === value);
      if (product) {
        newItems[index].unitCost = Number(product.unitCostPrice || 0);
      }
    }
    
    setItems(newItems);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!supplierId) return toast.error("Sélectionnez un fournisseur");
    if (items.some(item => !item.productId)) return toast.error("Veuillez choisir un produit pour chaque ligne");

    setLoading(true);
    try {
      await createPurchaseOrder({
        supplierId: Number(supplierId),
        notes,
        items: items.map(item => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });
      toast.success("Bon de commande enregistré");
      setItems([{ productId: "", quantity: 1, unitCost: 0 }]);
      setSupplierId("");
      setNotes("");
    } catch (error) {
      toast.error("Erreur lors de la création de la commande");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nouveau Bon de Commande</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fournisseur</Label>
              <Select value={supplierId} onValueChange={setSupplierId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir fournisseur..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Infos supplémentaires..." disabled={loading} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Produits commandés</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={loading} className="gap-2">
                <Plus size={14} /> Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg border">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[11px]">Produit</Label>
                    <Select 
                      value={item.productId} 
                      onValueChange={(val: string) => updateItem(index, "productId", val)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-[11px]">Quantité</Label>
                    <Input 
                      type="number" 
                      className="bg-white"
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      disabled={loading} 
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-[11px]">Prix Achat Est.</Label>
                    <Input 
                      type="number"
                      className="bg-white" 
                      value={item.unitCost} 
                      onChange={(e) => updateItem(index, "unitCost", Number(e.target.value))}
                      disabled={loading} 
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItem(index)}
                    disabled={loading || items.length === 1}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full gap-2 py-6 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            Générer le bon de commande
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
