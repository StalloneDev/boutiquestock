import { getCategories } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Trash2, Edit } from "lucide-react";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { CategoryActions } from "@/components/categories/category-actions";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organisez vos produits par groupes</p>
        </div>
        <CategoryDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-lg font-bold">{c.name}</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {c.description || "Aucune description"}
              </p>
              <CategoryActions category={c} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
