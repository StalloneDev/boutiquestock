import { getSalesEvolution } from "@/lib/actions";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SalesEvolutionChart } from "@/components/sales/sales-evolution-chart";
import { TrendingUp, ArrowUpRight, ShoppingBag, Target } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SalesEvolutionPage() {
  const session = await getSession();
  if (session?.user?.role !== "admin") {
    redirect("/pos");
  }

  const salesData = await getSalesEvolution();

  // Basic stats for the header
  const totalSales = salesData.reduce((acc, s) => acc + s.amount, 0);
  const avgSale = salesData.length > 0 ? totalSales / salesData.length : 0;

  return (
    <div className="p-8 space-y-10 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
            <TrendingUp size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Rapport de Performance</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Évolution des Ventes</h1>
        <p className="text-slate-500 font-medium max-w-2xl">
          Suivez la croissance de votre entreprise à travers le temps. Analysez les tendances pour optimiser votre stratégie commerciale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Chiffre d'Affaires</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(totalSales)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Recettes cumulées sur la période</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre de Ventes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{salesData.length}</div>
            <p className="text-[10px] text-slate-500 mt-1">Transactions validées</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Panier Moyen</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(avgSale)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Valeur moyenne par vente</p>
          </CardContent>
        </Card>
      </div>

      <SalesEvolutionChart data={salesData} />
    </div>
  );
}
