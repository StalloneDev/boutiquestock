import { useState } from "react";
import { useGetCatalog, getGetCatalogQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Search, Package } from "lucide-react";

export function Catalog() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const { data: catalog, isLoading } = useGetCatalog({ categoryId, search: search || undefined, inStockOnly: true }, {
    query: { queryKey: getGetCatalogQueryKey({ categoryId, search: search || undefined, inStockOnly: true }) }
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const handlePrint = () => {
    window.print();
  };

  // Group products by category
  const groupedProducts = catalog?.reduce((acc: any, product) => {
    const cat = product.categoryName || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3 text-primary">
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
              <p className="text-muted-foreground text-sm">Available items in stock</p>
            </div>
          </div>
          <Button onClick={handlePrint} variant="outline" className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Print Catalog
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search catalog..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            <Badge 
              variant={categoryId === undefined ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap text-sm px-3 py-1"
              onClick={() => setCategoryId(undefined)}
            >
              All Categories
            </Badge>
            {categories?.map(c => (
              <Badge 
                key={c.id}
                variant={categoryId === c.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap text-sm px-3 py-1"
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading catalog...</div>
          ) : catalog?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found matching your criteria.</div>
          ) : (
            groupedProducts && Object.entries(groupedProducts).map(([categoryName, products]: [string, any]) => (
              <div key={categoryName} className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2 text-foreground/80">{categoryName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-card hover:shadow-sm transition-shadow">
                      <div className="font-medium line-clamp-2 leading-tight">{product.name}</div>
                      <div className="mt-auto pt-2 flex items-end justify-between">
                        <div className="text-lg font-bold text-primary font-mono">
                          {formatCurrency(product.unitSalePrice || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Instock
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="hidden print:block text-center text-sm text-muted-foreground pt-12 border-t mt-12">
          Generated on {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
