import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetTopProducts, getGetTopProductsQueryKey, useGetCategoryBreakdown, getGetCategoryBreakdownQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ShoppingBag, ArrowDownUp, RefreshCcw, Package, AlertCircle } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <div className="text-sm text-muted-foreground">
          {summary ? `${summary.totalProducts} active products in stock` : <Skeleton className="h-4 w-32" />}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Inventory Value</h3>
            <div className="text-2xl font-bold mt-2">{sumLoading ? <Skeleton className="h-8 w-full" /> : formatCurrency(summary?.totalStockValue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sales Value</h3>
            <div className="text-2xl font-bold mt-2 text-green-600">{sumLoading ? <Skeleton className="h-8 w-full" /> : formatCurrency(summary?.totalSalesValue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Units</h3>
            <div className="text-2xl font-bold mt-2">{sumLoading ? <Skeleton className="h-8 w-full" /> : summary?.totalUnits || 0}</div>
          </CardContent>
        </Card>
        <Card className={summary?.lowStockCount ? "border-orange-500/50 bg-orange-500/5" : ""}>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Low Stock Alerts
              {summary?.lowStockCount ? <AlertCircle className="h-4 w-4 text-orange-500" /> : null}
            </h3>
            <div className={`text-2xl font-bold mt-2 ${summary?.lowStockCount ? 'text-orange-600' : ''}`}>
              {sumLoading ? <Skeleton className="h-8 w-full" /> : summary?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Category Value Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: number) => [formatCurrency(value), "Value"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No category data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-0 divide-y divide-border/50 max-h-[300px] overflow-y-auto">
              {actLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading activity...</div>
              ) : activity?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No recent activity.</div>
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
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
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
          <CardTitle className="text-lg">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topLoading ? (
              <div className="text-center text-sm text-muted-foreground py-4">Loading top products...</div>
            ) : topProducts?.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">No sales data yet.</div>
            ) : (
              topProducts?.map((product, i) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-mono text-sm text-muted-foreground">#{i + 1}</div>
                    <div>
                      <Link href={`/products/${product.productId}`} className="font-medium hover:underline">
                        {product.productName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.categoryName || "Uncategorized"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(product.totalRevenue)}</div>
                    <div className="text-xs text-muted-foreground">{product.totalSold} units sold</div>
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