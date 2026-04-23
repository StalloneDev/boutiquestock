"use client";

import { useState } from "react";
import { getProducts, recordSale } from "@/lib/actions";
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 1) {
      const results = await getProducts({ search: term });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

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
    setSearchTerm("");
    setSearchResults([]);
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
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-2rem)]">
      <div className="lg:col-span-2 space-y-4 flex flex-col">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="text-muted-foreground" size={18} />
              Rechercher des produits
            </CardTitle>
            <div className="relative mt-2">
              <Input 
                placeholder="Scanner un code-barres ou saisir un nom..." 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center border-b last:border-0"
                      onClick={() => addToCart(p)}
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.categoryName || "Sans catégorie"}</p>
                      </div>
                      <p className="font-bold">{formatCurrency(p.unitSalePrice)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {/* Quick select area could go here */}
             </div>
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
