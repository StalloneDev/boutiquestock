import { getMarginAnalysis } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarginCharts } from "@/components/margins/margin-charts";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, Wallet, ArrowUpRight, BarChart3 } from "lucide-react";

export default async function MarginsPage() {
  const analysis = await getMarginAnalysis();

  return (
    <div className="p-8 space-y-10 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Marges & Rentabilité</h1>
        <p className="text-slate-500 font-medium">Analyse approfondie des coûts et du potentiel de revenus de votre inventaire.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valeur d'Achat (Coût)</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(analysis.totalCost)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Investissement total en stock</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenu Potentiel</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600">{formatCurrency(analysis.totalRevenue)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Chiffre d'affaires si tout est vendu</p>
          </CardContent>
        </Card>

        <Card className="border-black shadow-lg bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 text-slate-400">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest">Bénéfice Potentiel</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{formatCurrency(analysis.totalProfit)}</div>
            <p className="text-[10px] text-slate-400 mt-1">Gain estimé après vente totale</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Marge Globale</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{analysis.globalMargin}%</div>
            <p className="text-[10px] text-slate-500 mt-1">Taux de rentabilité moyen</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-8 rounded-3xl ring-1 ring-slate-200 shadow-sm">
        <MarginCharts data={analysis.categoryData} />
      </div>

      {/* Detailed Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Détails par Catégorie</h2>
        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4 text-right">Investissement</th>
                  <th className="px-6 py-4 text-right">Revenu Est.</th>
                  <th className="px-6 py-4 text-right">Profit Est.</th>
                  <th className="px-6 py-4 text-right">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.categoryData.map((cat) => (
                  <tr key={cat.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{cat.name}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(cat.cost)}</td>
                    <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(cat.revenue)}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">{formatCurrency(cat.profit)}</td>
                    <td className="px-6 py-4 text-right font-black">
                      <span className={`px-2 py-1 rounded ${cat.margin > 20 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                        {cat.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
