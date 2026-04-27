import { getActiveCashRegisterStatus } from "@/lib/actions";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Calculator, Coins, TrendingDown, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
// Composants locaux
import { ExpenseDialog } from "./cash-expense-dialog";
import { CancelExpenseBtn } from "./cancel-expense-btn";
import { Badge } from "@/components/ui/badge";

export default async function CashRegisterPage() {
    const userSession = await getSession();
    const status = await getActiveCashRegisterStatus();

    if (!status) {
        return (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="h-24 w-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Caisse Fermée</h1>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    Vous devez ouvrir une session de caisse depuis l'interface du point de vente (Caisse) pour suivre la réconciliation financière.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800">État de Caisse</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        Session ouverte le {format(new Date(status.session.openingTime), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                </div>
                <ExpenseDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-bold tracking-widest uppercase text-[10px] text-slate-400">
                            Ouverture (Fonds de caisse)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                                <Coins size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800">
                                {formatCurrency(Number(status.session.openingBalance))}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-bold tracking-widest uppercase text-[10px] text-emerald-500">
                            Total Ventes (Entrées)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800">
                                + {formatCurrency(status.totalSales)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-bold tracking-widest uppercase text-[10px] text-red-500">
                            Dépenses (Sorties)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                <TrendingDown size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800">
                                - {formatCurrency(status.totalExpenses)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute -right-10 -top-10 text-white/5">
                    <Calculator size={200} />
                </div>
                <CardContent className="p-8 relative z-10">
                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">
                        Solde Théorique Actuel
                    </p>
                    <div className="flex items-baseline gap-4">
                        <span className="text-6xl font-black tracking-tighter text-blue-400">
                            {formatCurrency(status.theoreticalBalance)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-4 max-w-xl">
                        Ce montant doit être exactement présent en caisse. Il inclut le fonds de caisse initial de <strong>{formatCurrency(Number(status.session.openingBalance))}</strong>, les ventes réalisées et prend en compte les <strong>{formatCurrency(status.totalExpenses)}</strong> de dépenses.
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm mt-8">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">Historique des Sorties de Caisse</CardTitle>
                    <CardDescription>Liste exhaustive détaillée de vos dépenses déclarées pour la journée</CardDescription>
                </CardHeader>
                <CardContent>
                    {status.expensesList && status.expensesList.length > 0 ? (
                        <div className="rounded-md border border-slate-100 overflow-hidden bg-white">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Heure</th>
                                        <th className="px-4 py-3">Auteur</th>
                                        <th className="px-4 py-3">Motif</th>
                                        <th className="px-4 py-3 text-right">Montant</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {status.expensesList.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {format(new Date(expense.createdAt), "HH:mm")}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                                                {expense.userName}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-slate-600 line-clamp-1">{expense.reason}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-red-500">
                                                - {formatCurrency(Number(expense.amount))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <CancelExpenseBtn id={expense.id} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500">
                            Aucune dépense enregistrée pour la session courante.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
