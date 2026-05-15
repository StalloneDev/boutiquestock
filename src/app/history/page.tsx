import { getStockMovements } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function HistoryPage() {
  const movements = await getStockMovements(100);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entry": return <ArrowUpRight className="text-green-600" size={18} />;
      case "sale":
      case "exit": return <ArrowDownLeft className="text-red-600" size={18} />;
      default: return <ArrowLeftRight className="text-blue-600" size={18} />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "entry": return "Entrée";
      case "sale": return "Vente";
      case "exit": return "Sortie";
      case "adjustment": return "Ajustement";
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique des mouvements</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi détaillé des entrées and sorties de stock</p>
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
                  <th className="px-6 py-3 text-center">Type</th>
                  <th className="px-6 py-3 text-center">Quantité</th>
                  <th className="px-6 py-3 text-center">Avant</th>
                  <th className="px-6 py-3 text-center">Après</th>
                  <th className="px-6 py-3">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      Aucun mouvement enregistré.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
                      </td>
                      <td className="px-6 py-4 font-semibold uppercase truncate max-w-[200px]">
                        {m.productName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {getMovementIcon(m.type)}
                          <span className="font-medium">{getMovementLabel(m.type)}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${m.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                        {m.delta > 0 ? "+" : ""}{m.delta}
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {m.quantityBefore}
                      </td>
                      <td className="px-6 py-4 text-center font-medium bg-slate-50/50">
                        {m.quantityAfter}
                      </td>
                      <td className="px-6 py-4 text-xs italic text-muted-foreground">
                        {m.reason || "-"}
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
