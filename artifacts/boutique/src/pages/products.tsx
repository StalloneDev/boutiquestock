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
import { Plus, Search, AlertCircle, Minus, ImageIcon, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { imageUrlFor } from "@/components/image-upload";

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
    adjustStock.mutate({ id: productId, data: { delta, reason: delta > 0 ? "Ajout rapide" : "Retrait rapide" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Stock mis à jour" });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err?.message || "Échec." })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue et vos stocks.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={lowStock ? "default" : "outline"}
          onClick={() => setLowStock(!lowStock)}
          className={lowStock ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-background"}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Stock faible
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="font-mono text-xs">Code-barres</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : products?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Aucun produit.</TableCell></TableRow>
            ) : (
              products?.map((product) => {
                const img = imageUrlFor(product.imageUrl);
                return (
                  <TableRow key={product.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Link href={`/products/${product.id}`}>
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                          {img ? <img src={img} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/40" />}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/products/${product.id}`} className="hover:underline flex items-center gap-2">
                        {product.name}
                        {product.hasVariants && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            <Layers className="h-3 w-3 mr-1" />
                            {product.variants?.length || 0}
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-700 hover:bg-blue-50">{product.categoryName || "Non classé"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{product.barcode || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(product.unitSalePrice || 0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.quantity <= 0 ? "destructive" : product.quantity <= product.lowStockThreshold ? "default" : "outline"}
                        className={product.quantity <= product.lowStockThreshold && product.quantity > 0 ? "bg-orange-500 hover:bg-orange-600 text-white" : product.quantity > product.lowStockThreshold ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                      >
                        {product.quantity} en stock
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={product.quantity <= 0 || product.hasVariants} onClick={(e) => handleAdjustStock(e, product.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={product.hasVariants} onClick={(e) => handleAdjustStock(e, product.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
