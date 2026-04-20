import { useState } from "react";
import { useListStockMovements, getListStockMovementsQueryKey, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, RefreshCcw, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export function History() {
  const [productId, setProductId] = useState<string>("all");

  const params = {
    productId: productId !== "all" ? Number(productId) : undefined,
    limit: 100
  };

  const { data: movements, isLoading } = useListStockMovements(params, {
    query: { queryKey: getListStockMovementsQueryKey(params) }
  });

  const { data: products } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey({}) }
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entry": return <TrendingUp className="text-green-500 h-4 w-4" />;
      case "exit": return <TrendingDown className="text-red-500 h-4 w-4" />;
      case "sale": return <ShoppingBag className="text-blue-500 h-4 w-4" />;
      case "adjustment": return <RefreshCcw className="text-orange-500 h-4 w-4" />;
      default: return null;
    }
  };

  const getMovementLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock History</h1>
          <p className="text-muted-foreground">Comprehensive log of all stock movements.</p>
        </div>
        <div className="w-64">
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products?.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">New Total</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : movements?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No movements found.</TableCell></TableRow>
            ) : (
              movements?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(m.createdAt)}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/products/${m.productId}`} className="hover:underline">
                      {m.productName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {getMovementIcon(m.type)}
                      {getMovementLabel(m.type)}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-medium ${m.delta > 0 ? "text-green-600" : m.delta < 0 ? "text-red-600" : ""}`}>
                    {m.delta > 0 ? "+" : ""}{m.delta}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{m.quantityAfter}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.reason || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}