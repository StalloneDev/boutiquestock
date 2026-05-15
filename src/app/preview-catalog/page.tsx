import { getProducts, getCategories } from "@/lib/actions";
import { CatalogClient } from "@/components/public/catalog-client";

export const metadata = {
    title: "Prévisualisation du Catalogue",
    description: "Catalogue partageable",
};

export default async function PreviewCatalogPage() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
    ]);

    return (
        <CatalogClient
            products={products}
            categories={categories}
            boutiqueName="STOCK BOUTIQUE"
            shareUrl="/public-catalog"
        />
    );
}
