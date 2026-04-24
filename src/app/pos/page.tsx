"use client";

import { useEffect, useState } from "react";
import { getProducts, recordSale, getCategories } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Trash2, Plus, Minus, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [allCats, allProds] = await Promise.all([
        getCategories(),
        getProducts()
      ]);
      setCategories(allCats);
      setProducts(allProds);
    };
    loadData();
  }, []);

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(term);
      const matchBarcode = p.barcode ? p.barcode.includes(term) : false;
      return matchName || matchBarcode;
    }
    return true;
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, quantity: 1, unitPrice: Number(product.unitSalePrice) }];
    });
    // On efface la recherche si c'était un scan de code-barres (long)
    if (searchTerm.length >= 8) {
       setSearchTerm("");
    }
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const total = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of cart) {
        await recordSale({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
      setCart([]);
      toast.success("Vente enregistrée avec succès");
      // Refresh products to show updated stock
      const updatedProds = await getProducts();
      setProducts(updatedProds);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-2rem)] overflow-hidden">
      <div className="lg:col-span-2 space-y-4 flex flex-col h-full overflow-hidden">
        <Card className="flex-1 overflow-hidden flex flex-col border-none shadow-xl bg-white/70 backdrop-blur-md rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 mb-2">
              <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">CAISSE</CardTitle>
              <div className="flex flex-col md:flex-row gap-3">
                {/* Filtre par Catégories */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                    Filtrer par catégorie
                  </label>
                  <select 
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={selectedCategory || ""}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value ? Number(e.target.value) : null);
                      setSearchTerm(""); // reset product filter when category changes
                    }}
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre / Recherche par Produits */}
                <div className="flex-1 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                    Filtrer par produit ou scanner
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="Nom du produit ou code-barres..." 
                      className="w-full h-11 pl-9 bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 text-sm font-medium"
                      list="product-suggestions"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Auto-add if it exactly matches a product name from the datalist
                        const match = products.find(p => p.name === e.target.value);
                        if (match) {
                           addToCart(match);
                           // Clear input after short delay to let them see it matched
                           setTimeout(() => setSearchTerm(""), 100);
                        }
                      }}
                    />
                    <datalist id="product-suggestions">
                      {products.filter(p => !selectedCategory || p.categoryId === selectedCategory).map(p => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="group relative flex flex-col items-start p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-95 overflow-hidden"
                    onClick={() => addToCart(p)}
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                        <Plus size={14} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                      {p.categoryName || "Général"}
                    </span>
                    <p className="font-extrabold text-slate-700 text-sm line-clamp-2 leading-tight mb-3 h-10">
                      {p.name}
                    </p>
                    <div className="mt-auto w-full flex justify-between items-end">
                      <p className="text-blue-600 font-black text-base italic">
                        {formatCurrency(p.unitSalePrice)}
                      </p>
                      <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.quantity > 5 ? "bg-slate-100 text-slate-500" : "bg-red-100 text-red-600"}`}>
                        {p.quantity} dispos
                      </div>
                    </div>
                  </button>
                ))}
             </div>
             {filteredProducts.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                 <Search size={48} className="mb-4 opacity-20" />
                 <p className="font-bold">Aucun produit trouvé</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Panier</span>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{item.name}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    <p className="font-bold text-sm">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <div className="p-6 border-t bg-slate-50/50 space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-muted-foreground">Total</span>
            <span className="font-extrabold text-2xl text-blue-600">{formatCurrency(total)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg font-bold" 
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? "Traitement..." : "VALIDER LA VENTE"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
