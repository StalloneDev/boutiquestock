import { getPurchaseOrders, getSuppliers, getProducts } from "@/lib/actions";
import { PurchaseOrderForm } from "@/components/orders/purchase-order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function OrdersPage() {
  const [orders, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getProducts()
  ]);

  return (
    <div className="p-6 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bons de commande</h1>
          <p className="text-muted-foreground mt-1">Gérez vos approvisionnements auprès des fournisseurs</p>
        </div>
      </div>

      <PurchaseOrderForm suppliers={suppliers} products={products} />

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Historique des commandes</h2>
        <div className="grid gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
              Aucun bon de commande trouvé.
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <p className="font-bold">Bon #{order.id} - {order.supplierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-600">
                      {order.status}
                    </span>
                    <Button variant="outline" size="sm">Détails</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
