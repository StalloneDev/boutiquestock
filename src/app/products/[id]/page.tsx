import { getProductById, getProductMovements, getCategories } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  History, 
  Package, 
  AlertTriangle, 
  Tag, 
  Layers, 
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/products/product-actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  const [product, movements, categories] = await Promise.all([
    getProductById(productId),
    getProductMovements(productId),
    getCategories()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/products">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={16} /> Retour aux produits
          </Button>
        </Link>
        <ProductActions product={product} categories={categories} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
                  <p className="text-slate-500 mt-1 flex items-center gap-1">
                    <Layers size={14} /> {product.categoryName || "Sans catégorie"}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${product.quantity <= product.lowStockThreshold ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {product.quantity} en stock
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 border-t bg-slate-50/50">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prix d&apos;achat</p>
                   <p className="text-lg font-semibold">{formatCurrency(product.unitCostPrice)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prix de vente</p>
                   <p className="text-lg font-semibold text-primary">{formatCurrency(product.unitSalePrice)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marge</p>
                   <p className="text-lg font-semibold text-emerald-600">
                     {product.unitSalePrice && product.unitCostPrice 
                       ? (((Number(product.unitSalePrice) - Number(product.unitCostPrice)) / Number(product.unitSalePrice)) * 100).toFixed(1)
                       : 0}%
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valeur Stock</p>
                   <p className="text-lg font-semibold">
                     {formatCurrency(Number(product.unitCostPrice || 0) * product.quantity)}
                   </p>
                 </div>
               </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History size={18} className="text-primary" />
                Historique des mouvements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {movements.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">Aucun mouvement enregistré.</p>
                ) : (
                  movements.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${m.type === 'entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {m.type === 'entry' ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.type === 'entry' ? 'Entrée de stock' : 'Sortie / Vente'}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-tighter">
                            <Clock size={10} /> {format(new Date(m.createdAt), 'PPp', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className={`font-bold ${m.type === 'entry' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.type === 'entry' ? '+' : '-'}{m.delta}
                        </p>
                        <p className="text-[10px] text-slate-400 italic">Raison: {m.reason || 'Non précisée'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Détails techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm py-2 border-b border-dashed">
                <span className="text-slate-500">ID Produit</span>
                <span className="font-mono text-xs">{product.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-dashed">
                <span className="text-slate-500">Code-barres</span>
                <span className="font-mono text-xs">{product.barcode || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-dashed">
                <span className="text-slate-500">Seuil d&apos;alerte</span>
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle size={14} className="text-orange-500" /> {product.lowStockThreshold}
                </span>
              </div>
            </CardContent>
          </Card>

          {product.notes && (
            <Card className="shadow-md bg-amber-50/50 border-amber-100">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-amber-800">Notes & Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900/80 leading-relaxed">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <h4 className="text-sm font-bold text-primary mb-2">Actions rapides</h4>
            <div className="grid grid-cols-1 gap-2">
               <Link href="/restock">
                 <Button className="w-full justify-start gap-2" variant="outline">
                   <Package size={14} /> Réapprovisionner ce produit
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
