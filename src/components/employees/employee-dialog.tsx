"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Key, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function EmployeeDialog({ employee }: { employee?: any }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isEditing = !!employee;

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            role: formData.get("role") as string,
        };

        if (!isEditing && !data.password) {
            toast.error("Un mot de passe est obligatoire pour un nouvel employé.");
            setLoading(false);
            return;
        }

        try {
            if (isEditing) {
                await updateUser(employee.id, data);
                toast.success("Employé mis à jour avec succès");
            } else {
                await createUser(data);
                toast.success("Employé ajouté à l'équipe");
            }
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Une erreur s'est produite");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="outline" size="sm" className="w-full">Modifier</Button>
                ) : (
                    <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-lg">
                        <Plus size={18} />
                        Nouvel Employé
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-800">
                        {isEditing ? "Modifier l'employé" : "Ajouter un employé"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" name="name" required defaultValue={employee?.name} placeholder="Ex: Jean Dupont" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Identifiant de connexion</Label>
                        <Input id="username" name="username" required defaultValue={employee?.username} placeholder="Ex: jdupont" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rôle d'accès</Label>
                        <select
                            id="role"
                            name="role"
                            required
                            defaultValue={employee?.role || "cashier"}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="cashier">Caisse (Caissier)</option>
                            <option value="admin">Administration (Gérant)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {isEditing ? "Nouveau Mot de passe (Laissez vide pour conserver)" : "Mot de passe"}
                        </Label>
                        <Input id="password" name="password" type="text" placeholder={isEditing ? "••••••••" : "Le mot de passe secret"} required={!isEditing} />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                        {loading ? "Enregistrement..." : (isEditing ? "Sauvegarder les modifications" : "Créer le profil")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
