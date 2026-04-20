import { useGetDashboardMargins, getGetDashboardMarginsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function Margins() {
  const { data: margins, isLoading } = useGetDashboardMargins({
    query: { queryKey: getGetDashboardMarginsQueryKey() }
  });

  const chartData = margins?.map(m => ({
    name: m.categoryName || "Uncategorized",
    cost: m.totalCostValue,
    sales: m.totalSaleValue,
    profit: m.totalProfit,
    margin: m.marginPercent
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Margins & Profitability</h1>
        <p className="text-muted-foreground">Analyze your inventory costs vs potential revenue.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost vs Potential Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend />
                    <Bar dataKey="cost" name="Total Cost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" name="Potential Revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No margin data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit Margin % by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(value: number) => `${value}%`} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="margin" name="Margin %" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No margin data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Stock Cost</TableHead>
                <TableHead className="text-right">Sales Value</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading margins...</TableCell></TableRow>
              ) : margins?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No data available.</TableCell></TableRow>
              ) : (
                margins?.map((stat, i) => (
                  <TableRow key={stat.categoryId || `none-${i}`}>
                    <TableCell className="font-medium">{stat.categoryName || "Uncategorized"}</TableCell>
                    <TableCell className="text-right font-mono">{stat.productCount}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(stat.totalCostValue)}</TableCell>
                    <TableCell className="text-right font-mono text-primary">{formatCurrency(stat.totalSaleValue)}</TableCell>
                    <TableCell className="text-right font-mono text-green-600 font-medium">{formatCurrency(stat.totalProfit)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      <span className={stat.marginPercent < 20 ? "text-red-500" : stat.marginPercent > 50 ? "text-green-500" : ""}>
                        {stat.marginPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
