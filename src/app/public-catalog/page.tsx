import { Card, CardContent } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function PublicCatalogPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catalogue partageable</h1>
        <p className="text-sm text-muted-foreground mt-1">Partagez vos produits avec vos clients</p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <Share2 size={48} className="mb-4 opacity-20" />
          <p>Le module de catalogue public est en cours de configuration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
