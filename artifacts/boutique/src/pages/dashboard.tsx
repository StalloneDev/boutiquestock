import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetTopProducts, getGetTopProductsQueryKey, useGetCategoryBreakdown, getGetCategoryBreakdownQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingBag, ArrowDownUp, RefreshCcw, AlertCircle, Wallet, TrendingUp, Boxes, Trophy } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: activity, isLoading: actLoading } = useGetRecentActivity({ limit: 10 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }) } });
  const { data: topProducts, isLoading: topLoading } = useGetTopProducts({ limit: 5 }, { query: { queryKey: getGetTopProductsQueryKey({ limit: 5 }) } });
  const { data: categoryBreakdown, isLoading: catLoading } = useGetCategoryBreakdown({ query: { queryKey: getGetCategoryBreakdownQueryKey() } });

  const getActivityIcon = (type: string) => {
    if (type === "sale") return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    if (type === "stock_entry") return <ArrowDownUp className="h-4 w-4 text-green-500" />;
    return <RefreshCcw className="h-4 w-4 text-orange-500" />;
  };

  const chartData = categoryBreakdown?.map(c => ({
    name: c.categoryName,
    value: c.totalValue,
    count: c.productCount,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre boutique</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {summary ? `${summary.totalProducts} produits actifs` : <Skeleton className="h-4 w-32" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valeur du stock</h3>
                <div className="text-2xl font-bold mt-2">{sumLoading ? <Skeleton className="h-8 w-full" /> : formatCurrency(summary?.totalStockValue || 0)}</div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Wallet size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total des ventes</h3>
                <div className="text-2xl font-bold mt-2 text-green-600">{sumLoading ? <Skeleton className="h-8 w-full" /> : formatCurrency(summary?.totalSalesValue || 0)}</div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unités en stock</h3>
                <div className="text-2xl font-bold mt-2">{sumLoading ? <Skeleton className="h-8 w-full" /> : summary?.totalUnits || 0}</div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Boxes size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={summary?.lowStockCount ? "border-orange-500/50 bg-orange-500/5 hover:shadow-sm transition-shadow" : "hover:shadow-sm transition-shadow"}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alertes stock bas</h3>
                <div className={`text-2xl font-bold mt-2 ${summary?.lowStockCount ? 'text-orange-600' : ''}`}>
                  {sumLoading ? <Skeleton className="h-8 w-full" /> : summary?.lowStockCount || 0}
                </div>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${summary?.lowStockCount ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                <AlertCircle size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Valeur par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chargement du graphique...</div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: number) => [formatCurrency(value), "Valeur"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-0 divide-y divide-border/50 max-h-[300px] overflow-y-auto">
              {actLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>
              ) : activity?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Aucune activité récente.</div>
              ) : (
                activity?.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="mt-1 bg-background rounded-full p-1.5 shadow-sm border">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/products/${item.productId}`} className="text-xs text-primary hover:underline truncate">
                          {item.productName}
                        </Link>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm font-mono font-medium ${item.delta > 0 ? "text-green-600" : item.delta < 0 ? "text-red-600" : ""}`}>
                      {item.delta > 0 ? "+" : ""}{item.delta}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            Meilleures ventes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLoading ? (
              <div className="text-center text-sm text-muted-foreground py-4">Chargement...</div>
            ) : topProducts?.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">Aucune vente enregistrée.</div>
            ) : (
              topProducts?.map((product, i) => (
                <div key={product.productId} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <Link href={`/products/${product.productId}`} className="font-medium hover:underline">
                        {product.productName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.categoryName || "Sans catégorie"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(product.totalRevenue)}</div>
                    <div className="text-xs text-muted-foreground">{product.totalSold} unités vendues</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
