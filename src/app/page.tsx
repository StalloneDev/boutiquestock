import { getDashboardStats, getProducts, getMarginAnalysis } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Boxes, TrendingUp, AlertCircle, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const [stats, analysis, lowStockProducts] = await Promise.all([
    getDashboardStats(),
    getMarginAnalysis(),
    getProducts({ lowStock: true })
  ]);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Gérez la croissance de votre boutique en un coup d{`'`}œil.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/restock">
            <Button variant="outline">Réapprovisionner</Button>
          </Link>
          <Link href="/products">
            <Button className="bg-primary hover:scale-105 transition-transform">Gérer produits</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <Wallet className="absolute -right-2 -bottom-2 h-20 w-20 text-white/10 group-hover:scale-110 transition-transform" />
            <p className="text-blue-100 text-sm font-medium">Valeur Investie</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.stockValue)}</h3>
            <p className="text-blue-200 text-xs mt-2 flex items-center">
              Investissement total en stock
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <CardContent className="p-6">
            <TrendingUp className="absolute -right-2 -bottom-2 h-20 w-20 text-white/10 group-hover:scale-110 transition-transform" />
            <p className="text-emerald-100 text-sm font-medium">Profit Potentiel (Brut)</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(analysis.totalProfit)}</h3>
            <p className="text-emerald-200 text-xs mt-2 flex items-center">
              Marge moyenne: {analysis.globalMargin}%
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-0 shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <CardContent className="p-6">
            <Boxes className="absolute -right-2 -bottom-2 h-20 w-20 text-white/10 group-hover:scale-110 transition-transform" />
            <p className="text-purple-100 text-sm font-medium">Catalogue</p>
            <h3 className="text-2xl font-bold mt-1">{stats.productCount} Produits</h3>
            <p className="text-purple-200 text-xs mt-2">Références actives en boutique</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden group border-0 shadow-lg ${lowStockProducts.length > 0 ? "bg-gradient-to-br from-orange-500 to-red-600" : "bg-gradient-to-br from-slate-700 to-slate-800"} text-white`}>
          <CardContent className="p-6">
            <AlertCircle className="absolute -right-2 -bottom-2 h-20 w-20 text-white/10 group-hover:scale-110 transition-transform" />
            <p className="text-white/80 text-sm font-medium">Alertes Stock</p>
            <h3 className="text-2xl font-bold mt-1">{lowStockProducts.length} Alertes</h3>
            <p className="text-white/70 text-xs mt-2">Articles sous le seuil critique</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rentabilité par Catégorie</CardTitle>
            <Link href="/margins" className="text-xs text-primary hover:underline">Voir l{`'`}analyse détaillée</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analysis.categoryData.slice(0, 5).map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-emerald-600 font-bold">+{cat.margin}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(cat.margin, 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-tight">
                    <span>Investi: {formatCurrency(cat.cost)}</span>
                    <span>Revenu est.: {formatCurrency(cat.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Stock Critique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                  <ShoppingBag className="text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-500">Votre stock est optimal !</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{p.categoryName || "Sans catégorie"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{p.quantity} en stock</p>
                      <p className="text-[10px] text-slate-400">Seuil: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                ))
              )}
              {lowStockProducts.length > 6 && (
                <Link href="/products?lowStock=true">
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2">
                    Voir les {lowStockProducts.length - 6} autres alertes
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
