import { getProducts, getCategories } from "@/lib/actions";
import { CatalogClient } from "@/components/public/catalog-client";

export const metadata = {
  title: "Catalogue - Stock Boutique",
  description: "Découvrez nos produits",
};

export default async function PublicCatalogPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <CatalogClient
      products={products}
      categories={categories}
      boutiqueName="STOCK BOUTIQUE"
    // phoneNumber="22890000000" // A configurer par l'utilisateur
    />
  );
}
