import { getSuppliers } from "@/lib/actions";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Phone, Mail, MapPin } from "lucide-react";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos contacts et approvisionnements</p>
        </div>
        <SupplierDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            Aucun fournisseur enregistré.
          </div>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg uppercase">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase">{s.contact || "Contact inconnu"}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  <span>{s.phone || "Non renseigné"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="truncate">{s.email || "Non renseigné"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={14} className="text-muted-foreground mt-1 shrink-0" />
                  <span className="text-xs">{s.address || "Aucune adresse"}</span>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">Détails</Button>
                  <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200">Commander</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
