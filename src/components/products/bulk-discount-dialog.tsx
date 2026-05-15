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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyBulkDiscount } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Tag, ArrowRight, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Product {
  id: number;
  name: string;
  unitSalePrice: string | number | null;
}

interface BulkDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export function BulkDiscountDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkDiscountDialogProps) {
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const discount = parseFloat(discountPercent) || 0;

  const previews = selectedProducts.map((p) => {
    const before = Number(p.unitSalePrice ?? 0);
    const after = Math.round(before * (1 - discount / 100) * 100) / 100;
    return { ...p, before, after, saving: before - after };
  });

  const isValid = discount > 0 && discount < 100;

  const handleApply = async () => {
    if (!isValid) {
      toast.error("Entrez un pourcentage entre 1 et 99.");
      return;
    }
    setLoading(true);
    try {
      const ids = selectedProducts.map((p) => p.id);
      const result = await applyBulkDiscount(ids, discount);
      toast.success(
        `Remise de ${discount}% appliquée sur ${result.count} produit(s) !`
      );
      setDiscountPercent("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'application de la remise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <TrendingDown className="text-orange-500" size={22} />
            Déstockage — Remise en Lot
          </DialogTitle>
          <DialogDescription>
            Appliquez un pourcentage de réduction sur le prix de vente des{" "}
            <strong>{selectedProducts.length}</strong> produit(s) sélectionné(s).
            Une trace sera conservée dans l&apos;historique.
          </DialogDescription>
        </DialogHeader>

        {/* Saisie du % */}
        <div className="space-y-3 py-2">
          <Label htmlFor="discount-pct" className="text-sm font-semibold">
            Pourcentage de réduction
          </Label>
          <div className="relative">
            <Input
              id="discount-pct"
              type="number"
              min={1}
              max={99}
              step={1}
              placeholder="Ex : 20"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              disabled={loading}
              className="pr-10 text-lg font-bold h-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
              %
            </span>
          </div>

          {isValid && (
            <p className="text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              ⚠️ Cette action modifiera définitivement les prix de vente sélectionnés.
            </p>
          )}
        </div>

        {/* Prévisualisation par produit */}
        <div className="space-y-2 mt-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Prévisualisation des nouveaux prix
          </p>
          <div className="rounded-xl border overflow-hidden divide-y bg-white max-h-64 overflow-y-auto">
            {previews.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag size={14} className="text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {p.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(p.before)}
                  </span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span
                    className={`text-sm font-bold ${
                      isValid ? "text-green-600" : "text-slate-700"
                    }`}
                  >
                    {isValid ? formatCurrency(p.after) : "—"}
                  </span>
                  {isValid && (
                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={!isValid || loading}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? "Application..."
              : `Appliquer −${discount || 0}% sur ${selectedProducts.length} produit(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
