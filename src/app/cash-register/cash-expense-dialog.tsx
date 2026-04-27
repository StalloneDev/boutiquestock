"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { addExpense } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function ExpenseDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const amount = Number(formData.get("amount"));
        const reason = formData.get("reason") as string;

        if (amount <= 0 || !reason.trim()) {
            toast.error("Veuillez saisir un montant et un motif valides.");
            setLoading(false);
            return;
        }

        try {
            await addExpense({ amount, reason });
            toast.success("Dépense enregistrée avec succès");
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Une erreur s'est produite lors de l'enregistrement.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-lg h-11 px-6">
                    <Wallet size={18} />
                    Déclarer une dépense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-800">
                        Sortie de Caisse
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Montant retiré (FCFA)</Label>
                        <Input id="amount" name="amount" type="number" min="0" required placeholder="Ex: 5000" className="text-lg font-bold h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motif de la dépense</Label>
                        <Input id="reason" name="reason" required placeholder="Ex: Achat de tickets caisse, Carburant coursier..." />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl mt-2">
                        {loading ? "Enregistrement..." : "Retirer de la caisse"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
