import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateProductVariant,
  useUpdateProductVariant,
  useDeleteProductVariant,
  getGetProductQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import type { ProductVariant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Props = {
  productId: number;
  variants: ProductVariant[];
};

type DraftVariant = {
  size: string;
  color: string;
  sku: string;
  barcode: string;
  quantity: string;
  unitSalePrice: string;
};

const emptyDraft: DraftVariant = { size: "", color: "", sku: "", barcode: "", quantity: "0", unitSalePrice: "" };

export function VariantsManager({ productId, variants }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<DraftVariant>(emptyDraft);
  const [editing, setEditing] = useState<Record<number, Partial<ProductVariant>>>({});

  const createMut = useCreateProductVariant();
  const updateMut = useUpdateProductVariant();
  const deleteMut = useDeleteProductVariant();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
  };

  const onAdd = () => {
    if (!draft.size && !draft.color) {
      toast({ variant: "destructive", title: "Renseignez au moins une taille ou une couleur" });
      return;
    }
    createMut.mutate({
      id: productId,
      data: {
        size: draft.size || null,
        color: draft.color || null,
        sku: draft.sku || null,
        barcode: draft.barcode || null,
        quantity: parseInt(draft.quantity || "0", 10) || 0,
        unitSalePrice: draft.unitSalePrice ? parseFloat(draft.unitSalePrice) : null,
      },
    }, {
      onSuccess: () => {
        invalidate();
        setDraft(emptyDraft);
        toast({ title: "Variante ajoutée" });
      },
      onError: (e: any) => toast({ variant: "destructive", title: "Erreur", description: e?.message || "Échec" }),
    });
  };

  const onSaveRow = (variantId: number) => {
    const changes = editing[variantId];
    if (!changes) return;
    updateMut.mutate({ id: variantId, data: changes }, {
      onSuccess: () => {
        invalidate();
        setEditing((prev) => { const n = { ...prev }; delete n[variantId]; return n; });
        toast({ title: "Variante mise à jour" });
      },
      onError: (e: any) => toast({ variant: "destructive", title: "Erreur", description: e?.message || "Échec" }),
    });
  };

  const onDelete = (variantId: number) => {
    if (!confirm("Supprimer cette variante ?")) return;
    deleteMut.mutate({ id: variantId }, {
      onSuccess: () => { invalidate(); toast({ title: "Variante supprimée" }); },
      onError: (e: any) => toast({ variant: "destructive", title: "Erreur", description: e?.message || "Échec" }),
    });
  };

  const editField = (id: number, key: keyof ProductVariant, value: any) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const valueOf = <K extends keyof ProductVariant>(v: ProductVariant, key: K): any => {
    const ed = editing[v.id];
    if (ed && key in ed) return ed[key] ?? "";
    return v[key] ?? "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            Variantes (taille / couleur)
            <Badge variant="secondary">{variants.length}</Badge>
          </h3>
          <p className="text-sm text-muted-foreground">Chaque variante a son propre stock.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Taille</TableHead>
              <TableHead>Couleur</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Code-barres</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Prix vente</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => {
              const dirty = !!editing[v.id];
              return (
                <TableRow key={v.id} className={dirty ? "bg-primary/5" : ""}>
                  <TableCell><Input className="h-8" value={valueOf(v, "size")} onChange={(e) => editField(v.id, "size", e.target.value || null)} /></TableCell>
                  <TableCell><Input className="h-8" value={valueOf(v, "color")} onChange={(e) => editField(v.id, "color", e.target.value || null)} /></TableCell>
                  <TableCell><Input className="h-8" value={valueOf(v, "sku")} onChange={(e) => editField(v.id, "sku", e.target.value || null)} /></TableCell>
                  <TableCell><Input className="h-8 font-mono text-xs" value={valueOf(v, "barcode")} onChange={(e) => editField(v.id, "barcode", e.target.value || null)} /></TableCell>
                  <TableCell><Input type="number" className="h-8 w-20 text-right ml-auto" value={valueOf(v, "quantity")} onChange={(e) => editField(v.id, "quantity", parseInt(e.target.value || "0", 10))} /></TableCell>
                  <TableCell><Input type="number" className="h-8 w-28 text-right ml-auto" value={valueOf(v, "unitSalePrice") ?? ""} onChange={(e) => editField(v.id, "unitSalePrice", e.target.value ? parseFloat(e.target.value) : null)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {dirty && (
                        <Button size="icon" variant="default" className="h-7 w-7" onClick={() => onSaveRow(v.id)}>
                          <Save className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(v.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
              <TableCell><Input className="h-8" placeholder="S, M, L..." value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} /></TableCell>
              <TableCell><Input className="h-8" placeholder="Bleu, Rouge..." value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></TableCell>
              <TableCell><Input className="h-8" placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} /></TableCell>
              <TableCell><Input className="h-8 font-mono text-xs" placeholder="Code-barres" value={draft.barcode} onChange={(e) => setDraft({ ...draft, barcode: e.target.value })} /></TableCell>
              <TableCell><Input type="number" className="h-8 w-20 text-right ml-auto" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></TableCell>
              <TableCell><Input type="number" className="h-8 w-28 text-right ml-auto" placeholder="Prix" value={draft.unitSalePrice} onChange={(e) => setDraft({ ...draft, unitSalePrice: e.target.value })} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="default" onClick={onAdd} disabled={createMut.isPending}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
