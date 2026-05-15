import { getProducts, getCategories } from "@/lib/actions";
import { ProductDialog } from "@/components/products/product-dialog";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { getSession } from "@/lib/session";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const search =
    typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const categoryId =
    typeof resolvedParams.categoryId === "string"
      ? parseInt(resolvedParams.categoryId, 10)
      : undefined;
  const lowStock = resolvedParams.lowStock === "true";

  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";

  const [products, categories] = await Promise.all([
    getProducts({ search, categoryId, lowStock }),
    getCategories(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock &amp; Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez votre inventaire, vos niveaux de stock {isAdmin && "et appliquez des remises en lot"}.
          </p>
        </div>
        {isAdmin && <ProductDialog categories={categories} />}
      </div>

      <ProductFilters categories={categories} />

      <ProductGrid products={products} categories={categories} isAdmin={isAdmin} />
    </div>
  );
}
