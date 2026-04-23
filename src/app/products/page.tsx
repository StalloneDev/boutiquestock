import { getProducts, getCategories } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { ProductDialog } from "@/components/products/product-dialog";
import { ProductActions } from "@/components/products/product-actions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const categoryId = typeof resolvedParams.categoryId === "string" ? parseInt(resolvedParams.categoryId, 10) : undefined;

  const [products, categories] = await Promise.all([
    getProducts({ search, categoryId }),
    getCategories()
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock & Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez votre inventaire et vos niveaux de stock</p>
        </div>
        <ProductDialog categories={categories} />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." className="pl-9" />
        </div>
        <select 
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={categoryId || ""}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <Card key={p.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.quantity <= p.lowStockThreshold ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {p.quantity} en stock
                  </div>
                  <ProductActions product={p} categories={categories} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{p.categoryName || "Sans catégorie"}</p>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Prix de vente</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(p.unitSalePrice)}</p>
                </div>
                <Link href={`/products/${p.id}`}>
                  <Button variant="ghost" size="sm">Détails</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
