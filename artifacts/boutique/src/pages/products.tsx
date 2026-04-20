import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey, useAdjustProductStock, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [lowStock, setLowStock] = useState<boolean>(false);

  const params = {
    search: search || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    lowStock: lowStock || undefined,
  };

  const { data: products, isLoading } = useListProducts(params, {
    query: { queryKey: getListProductsQueryKey(params) }
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const adjustStock = useAdjustProductStock();

  const handleAdjustStock = (e: React.MouseEvent, productId: number, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    adjustStock.mutate({ 
      id: productId, 
      data: { delta, reason: delta > 0 ? "Quick add" : "Quick deduct" } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Success", description: `Stock ${delta > 0 ? 'increased' : 'decreased'}.` });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to adjust stock." })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory.</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant={lowStock ? "destructive" : "outline"} 
          onClick={() => setLowStock(!lowStock)}
          className={lowStock ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-background"}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Low Stock Alerts
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Quick Adj.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{product.categoryName || "Uncategorized"}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(product.unitSalePrice || 0)}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={product.quantity <= 0 ? "destructive" : product.quantity <= product.lowStockThreshold ? "default" : "outline"}
                      className={product.quantity <= product.lowStockThreshold && product.quantity > 0 ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    >
                      {product.quantity} in stock
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => handleAdjustStock(e, product.id, -1)} disabled={product.quantity <= 0}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => handleAdjustStock(e, product.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
