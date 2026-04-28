
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Calculator, Coins, TrendingDown, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
// Composants locaux
import { ExpenseDialog } from "./cash-expense-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getSessionHistory, getActiveCashRegisterStatus } from "@/lib/actions";
import { SessionHistoryFilters } from "./session-filters";
import { Button } from "@/components/ui/button";
import { CancelExpenseBtn } from "./cancel-expense-btn";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function CashRegisterPage({
    searchParams
}: {
    searchParams: { [key: string]: string | undefined }
}) {
    const userSession = await getSession();
    const isAdmin = userSession?.user?.role === "admin";
    const status = await getActiveCashRegisterStatus();

    // History data
    const filters = {
        from: searchParams.from,
        to: searchParams.to
    };
    const history = await getSessionHistory(filters);
    const activeTab = searchParams.tab || "current";

    return (
        <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Gestion de Caisse</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Suivi des sessions et réconciliation financière</p>
                </div>
                {status && <ExpenseDialog />}
            </div>

            <Tabs defaultValue={activeTab} className="space-y-8">
                <TabsList className="bg-white border p-1 h-12 rounded-xl shadow-sm">
                    <TabsTrigger value="current" className="rounded-lg px-8 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Session Actuelle
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg px-8 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Historique des Sessions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-8 outline-none border-none">
                    {!status ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="h-16 w-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Caisse Fermée</h2>
                            <p className="text-slate-500 text-center max-w-sm mt-2 px-6">
                                Aucune session de caisse n'est ouverte en ce moment. Ouvrez-en une depuis le terminal de vente.
                            </p>
                            <Link href="/pos">
                                <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6">
                                    Aller à la Caisse
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-100 w-fit">
                                <Calendar size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Ouverte le {format(new Date(status.session.openingTime), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-none shadow-md">
                                    <CardHeader className="pb-2 text-slate-400 uppercase tracking-widest text-[10px] font-black">Ouverture</CardHeader>
                                    <CardContent className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Coins size={24} /></div>
                                        <span className="text-3xl font-black">{formatCurrency(Number(status.session.openingBalance))}</span>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md">
                                    <CardHeader className="pb-2 text-emerald-500 uppercase tracking-widest text-[10px] font-black">Total Ventes</CardHeader>
                                    <CardContent className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={24} /></div>
                                        <span className="text-3xl font-black">+ {formatCurrency(status.totalSales)}</span>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-md">
                                    <CardHeader className="pb-2 text-red-500 uppercase tracking-widest text-[10px] font-black">Dépenses</CardHeader>
                                    <CardContent className="flex items-center gap-4">
                                        <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
                                        <span className="text-3xl font-black">- {formatCurrency(status.totalExpenses)}</span>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                                <div className="absolute -right-10 -top-10 text-white/5"><Calculator size={200} /></div>
                                <CardContent className="p-8 relative z-10">
                                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">Solde Théorique Actuel</p>
                                    <span className="text-6xl font-black tracking-tighter text-blue-400">{formatCurrency(status.theoreticalBalance)}</span>
                                    <p className="text-sm text-slate-400 mt-4 max-w-xl italic opacity-75">
                                        Fonds initial ({formatCurrency(Number(status.session.openingBalance))}) + Ventes ({formatCurrency(status.totalSales)}) - Dépenses ({formatCurrency(status.totalExpenses)}).
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Sorties de Caisse</CardTitle>
                                    <CardDescription>Dépenses enregistrées durant cette session</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {status.expensesList && status.expensesList.length > 0 ? (
                                        <div className="overflow-hidden rounded-xl border">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                                    <tr>
                                                        <th className="px-4 py-3">Heure</th>
                                                        <th className="px-4 py-3">Auteur</th>
                                                        <th className="px-4 py-3">Motif</th>
                                                        <th className="px-4 py-3 text-right">Montant</th>
                                                        <th className="px-4 py-3 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {status.expensesList.map((expense) => (
                                                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-slate-500">{format(new Date(expense.createdAt), "HH:mm")}</td>
                                                            <td className="px-4 py-3 font-bold">{expense.userName}</td>
                                                            <td className="px-4 py-3 text-slate-600">{expense.reason}</td>
                                                            <td className="px-4 py-3 text-right font-black text-red-500">{formatCurrency(Number(expense.amount))}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <CancelExpenseBtn id={expense.id} isAdmin={isAdmin} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center py-10 text-slate-400 italic">Aucune dépense declarée.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="history" className="outline-none border-none">
                    <SessionHistoryFilters />

                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-slate-500 font-bold uppercase text-[10px] border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-black">Date & Heure</th>
                                        <th className="px-6 py-4 font-black">Caissier</th>
                                        <th className="px-6 py-4 text-emerald-600 font-black">Ouverture</th>
                                        <th className="px-6 py-4 text-blue-600 font-black">Fermeture</th>
                                        <th className="px-6 py-4 text-center font-black">Statut</th>
                                        <th className="px-6 py-4 font-black">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-white">
                                    {history.map((session) => (
                                        <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{format(new Date(session.openingTime), "dd MMM yyyy", { locale: fr })}</div>
                                                <div className="text-[10px] text-slate-400 font-medium">De {format(new Date(session.openingTime), "HH:mm")} à {session.closingTime ? format(new Date(session.closingTime), "HH:mm") : "--:--"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-600">{session.openedByName || "Système"}</span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-600">
                                                {formatCurrency(Number(session.openingBalance))}
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-900">
                                                {session.closingBalance ? formatCurrency(Number(session.closingBalance)) : "---"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    "rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-tighter",
                                                    session.status === "open" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                                                )}>
                                                    {session.status === "open" ? "Ouverte" : "Clôturée"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 italic max-w-[200px] truncate">
                                                {session.notes || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/50">
                                                Aucune session trouvée pour cette période.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
