import { getProducts, getCategories } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ShoppingBag, Share2, Search, ArrowRight } from "lucide-react";
import Image from "next/image";

export default async function PublicCatalogPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShoppingBag className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-800">STOCK BOUTIQUE</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Catalogue Public</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold transition-all">
            <Share2 size={14} />
            PARTAGER
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Navigation Rapide */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((cat) => (
            <a 
              key={cat.id} 
              href={`#category-${cat.id}`}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
            >
              {cat.name.toUpperCase()}
            </a>
          ))}
        </div>

        {/* Categories Sections */}
        {categories.map((cat) => {
          const categoryProducts = products.filter(p => p.categoryId === cat.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={cat.id} id={`category-${cat.id}`} className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-slate-800 italic uppercase">
                  {cat.name}
                </h2>
                <div className="h-[2px] bg-slate-200 flex-1" />
                <span className="text-xs font-bold text-slate-400">
                  {categoryProducts.length} articles
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {categoryProducts.map((p) => (
                  <Card key={p.id} className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                      {p.imageUrl ? (
                        <Image 
                          src={p.imageUrl} 
                          alt={p.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 italic font-black text-4xl select-none">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Badge Stock Check (Optional for client) */}
                      {p.quantity === 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-3 py-1 bg-white text-slate-900 text-[10px] font-black uppercase rounded-full">Rupture</span>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {cat.name}
                      </p>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-tight h-10 line-clamp-2">
                        {p.name}
                      </h3>
                      <div className="pt-2 flex items-center justify-between">
                        <p className="text-blue-600 font-black text-lg">
                          {formatCurrency(p.unitSalePrice)}
                        </p>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 text-slate-300">
            <ShoppingBag size={80} className="mb-6 opacity-10" />
            <h2 className="text-xl font-bold">Aucun produit dans le catalogue</h2>
            <p className="text-sm">Veuillez ajouter des produits pour les voir ici.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 py-20 px-4 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <ShoppingBag className="text-white h-5 w-5" />
            </div>
            <span className="font-black text-white">STOCK BOUTIQUE</span>
          </div>
          <p className="text-xs font-medium">© 2026 Votre Boutique. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
