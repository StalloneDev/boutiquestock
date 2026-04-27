import { getSales } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { History, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CancelSaleButton } from "@/components/sales/cancel-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams;
  const fromDate = resolvedParams.from;
  const toDate = resolvedParams.to;

  const sales = await getSales({ from: fromDate, to: toDate });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique des ventes</h1>
          <p className="text-sm text-muted-foreground mt-1">Consultez vos transactions passées</p>
        </div>
        <form className="flex items-center gap-2" action={async (formData) => {
          "use server";
          const f = formData.get("from");
          const t = formData.get("to");
          const { redirect } = await import("next/navigation");

          let url = "/sales?";
          if (f) url += `from=${f}&`;
          if (t) url += `to=${t}&`;
          redirect(url);
        }}>
          <Input name="from" type="date" defaultValue={fromDate} className="w-36 h-10" />
          <span className="text-slate-400">à</span>
          <Input name="to" type="date" defaultValue={toDate} className="w-36 h-10" />
          <Button type="submit" variant="secondary">Filtrer</Button>
          {(fromDate || toDate) && (
            <Button type="button" variant="ghost" asChild>
              <a href="/sales" className="text-red-500">Effacer</a>
            </Button>
          )}
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* VUE MOBILE : Cartes empilées */}
          <div className="md:hidden divide-y">
            {sales.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                Aucune vente enregistrée.
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className={`p-4 space-y-3 ${sale.status === "cancelled" ? "bg-red-50/50 opacity-60" : "bg-white"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold uppercase text-slate-800">{sale.productName}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(sale.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                        <span className="ml-2 font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {sale.cashierName || "Inconnu"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <CancelSaleButton saleId={sale.id} status={sale.status || "completed"} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Qté: <strong className="text-slate-900">{sale.quantity}</strong></span>
                    <span className="text-slate-600">{formatCurrency(sale.unitPrice)}/u</span>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-black text-blue-600 text-lg">{formatCurrency(sale.totalAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VUE DESKTOP : Tableau classique */}
          <div className="hidden md:block relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Caissier</th>
                  <th className="px-6 py-3 text-center">Qté</th>
                  <th className="px-6 py-3 text-right">Prix Unitaire</th>
                  <th className="px-6 py-3 text-right">Montant Total</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      Aucune vente enregistrée.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className={`transition-colors ${sale.status === "cancelled" ? "bg-red-50/50 opacity-60" : "hover:bg-slate-50"}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {format(new Date(sale.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                      </td>
                      <td className="px-6 py-4 font-medium uppercase text-slate-800">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-xs uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {sale.cashierName || "Inconnu"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                        {formatCurrency(sale.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-blue-600 text-base">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CancelSaleButton saleId={sale.id} status={sale.status || "completed"} />
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
