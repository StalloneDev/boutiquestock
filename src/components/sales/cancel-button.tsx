"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cancelSale } from "@/lib/actions";

export function CancelSaleButton({ saleId, status }: { saleId: number; status: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Fallback si status undefined au tout début, on considère completed
  const isCancelled = status === "cancelled";

  const handleCancel = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera restauré.")) return;

    setIsProcessing(true);
    try {
      await cancelSale(saleId);
      toast.success("Vente annulée avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'annulation");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCancelled) {
    return (
      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
        ANNULÉE
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isProcessing}
      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 h-8"
      title="Annuler la vente"
    >
      <XCircle size={16} className={isProcessing ? "animate-spin" : ""} />
    </Button>
  );
}
