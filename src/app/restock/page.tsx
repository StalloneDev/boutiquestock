import { getProducts } from "@/lib/actions";
import { StockEntryForm } from "@/components/stock/stock-entry-form";

export default async function RestockPage() {
  const products = await getProducts();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Réapprovisionner</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérer les entrées de stock et les besoins</p>
      </div>

      <div className="max-w-2xl">
        <StockEntryForm products={products} />
      </div>
    </div>
  );
}
