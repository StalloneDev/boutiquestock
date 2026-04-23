import { getSales } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { History, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function SalesPage() {
  const sales = await getSales();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique des ventes</h1>
          <p className="text-sm text-muted-foreground mt-1">Consultez vos transactions passées</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3 text-center">Quantité</th>
                  <th className="px-6 py-3 text-right">Prix Unitaire</th>
                  <th className="px-6 py-3 text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                      Aucune vente enregistrée.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(sale.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                      </td>
                      <td className="px-6 py-4 font-medium uppercase">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(sale.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
