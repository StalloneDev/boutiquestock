import { useState } from "react";
import { useGetCatalog, getGetCatalogQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Search, Sparkles, ImageIcon } from "lucide-react";
import { imageUrlFor } from "@/components/image-upload";

export function Catalog() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const { data: catalog, isLoading } = useGetCatalog({ categoryId, search: search || undefined, inStockOnly: true }, {
    query: { queryKey: getGetCatalogQueryKey({ categoryId, search: search || undefined, inStockOnly: true }) }
  });

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const handlePrint = () => window.print();

  const groupedProducts = catalog?.reduce((acc: any, product) => {
    const cat = product.categoryName || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Catalogue</h1>
              <p className="text-muted-foreground text-sm">Articles disponibles en boutique</p>
            </div>
          </div>
          <Button onClick={handlePrint} variant="outline" className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />Imprimer
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher dans le catalogue..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            <Badge variant={categoryId === undefined ? "default" : "outline"} className="cursor-pointer whitespace-nowrap text-sm px-3 py-1" onClick={() => setCategoryId(undefined)}>Toutes</Badge>
            {categories?.map(c => (
              <Badge key={c.id} variant={categoryId === c.id ? "default" : "outline"} className="cursor-pointer whitespace-nowrap text-sm px-3 py-1" onClick={() => setCategoryId(c.id)}>{c.name}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : catalog?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun article trouvé.</div>
          ) : (
            groupedProducts && Object.entries(groupedProducts).map(([categoryName, products]: [string, any]) => (
              <div key={categoryName} className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-primary/20 pb-2 text-foreground">{categoryName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {products.map((product: any) => {
                    const img = imageUrlFor(product.imageUrl);
                    return (
                      <div key={product.id} className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
                          {img ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ImageIcon className="h-12 w-12 text-muted-foreground/40" />}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="font-medium line-clamp-2 leading-tight text-sm min-h-[2.5rem]">{product.name}</div>
                          <div className="flex items-end justify-between">
                            <div className="text-lg font-bold text-primary font-mono">{formatCurrency(product.unitSalePrice || 0)}</div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">En stock</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden print:block text-center text-sm text-muted-foreground pt-12 border-t mt-12">
          Catalogue généré le {new Date().toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
}
