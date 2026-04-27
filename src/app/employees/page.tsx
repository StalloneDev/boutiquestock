import { getUsers } from "@/lib/actions";
import { EmployeeDialog } from "@/components/employees/employee-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCircle, Key } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
    const session = await getSession();
    if (session?.user?.role !== "admin") {
        redirect("/"); // Or an unauthorized page
    }

    const users = await getUsers();

    return (
        <div className="p-6 md:p-10 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800">Gestion de l'Équipe</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Créez des accès sécurisés pour vos collaborateurs.</p>
                </div>
                <EmployeeDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map((u) => (
                    <Card key={u.id} className="border-none shadow-md hover:shadow-xl transition-all relative overflow-hidden bg-white group rounded-2xl">
                        <div className={`absolute top-0 w-full h-2 ${u.role === "admin" ? "bg-purple-500" : "bg-blue-500"}`} />
                        <CardHeader className="pb-2 pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`h-14 w-14 rounded-full flex items-center justify-center border-4 border-white shadow-sm
                  ${u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                                    {u.role === "admin" ? <ShieldCheck size={28} /> : <UserCircle size={28} />}
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-800 leading-tight">
                                        {u.name}
                                    </CardTitle>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {u.role === "admin" ? "Administrateur" : "Vendeur / Caissier"}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                                <Key size={14} className="text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Identifiant</span>
                                    <span className="text-sm font-bold text-slate-700">{u.username}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <EmployeeDialog employee={u} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
