"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { cancelExpense } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CancelExpenseBtn({ id, isAdmin }: { id: number, isAdmin?: boolean }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!isAdmin) return null;

    async function handleCancel() {
        if (!confirm("Voulez-vous vraiment annuler cette sortie de caisse ? Les fonds seront rétablis dans le tiroir caisse.")) return;

        setLoading(true);
        try {
            await cancelExpense(id);
            toast.success("Dépense annulée avec succès");
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de l'annulation");
            setLoading(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 h-8 font-medium"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} className="mr-1" />}
            Annuler
        </Button>
    );
}
