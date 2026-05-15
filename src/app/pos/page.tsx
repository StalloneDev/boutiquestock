"use client";

import { useEffect, useState } from "react";
import { getProducts, recordSale, getCategories, getActiveSession, openSession, closeSession } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Trash2, Plus, Minus, Lock, Unlock } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";

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

  // Session State
  const [session, setSession] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allCats, allProds, activeSession] = await Promise.all([
          getCategories(),
          getProducts(),
          getActiveSession()
        ]);
        setCategories(allCats);
        setProducts(allProds);
        setSession(activeSession);
        if (!activeSession) {
          setIsSessionModalOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const handleOpenSession = async () => {
    if (!openingBalance || isNaN(Number(openingBalance))) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    setIsProcessing(true);
    try {
      const newSession = await openSession(Number(openingBalance));
      setSession(newSession);
      setIsSessionModalOpen(false);
      toast.success("Session de caisse ouverte");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSession = async () => {
    setIsProcessing(true);
    try {
      // Pour une vraie app, on pourrait calculer le théorique depuis les ventes
      // Ici on passe 0 en dur pour la démo ou on pourrait demander le montant compté
      await closeSession(session.id, 0);
      setSession(null);
      setIsCloseModalOpen(false);
      setIsSessionModalOpen(true);
      toast.success("Caisse clôturée (Report Z)");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

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
    if (!session) {
      toast.error("Ouvrez une session de caisse d'abord");
      return setIsSessionModalOpen(true);
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, quantity: 1, unitPrice: Number(product.unitSalePrice) }];
    });
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
    if (cart.length === 0 || !session) return;
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
      const updatedProds = await getProducts();
      setProducts(updatedProds);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Empêcher l'utilisation si la caisse est fermée (Overlay semi-transparent)
  const isCaisseLocked = !session && !isSessionModalOpen;

  return (
    <>
      <Dialog open={isSessionModalOpen} onOpenChange={(open) => !open && session ? setIsSessionModalOpen(false) : null}>
        <DialogContent className="sm:max-w-md pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-800">
              <Unlock className="text-blue-600" /> Ouverture de Caisse
            </DialogTitle>
            <DialogDescription>
              Veuillez déclarer le fond de caisse (espèces) présent à l'ouverture de votre session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fond de caisse initial (FCFA)</label>
              <Input
                type="number"
                placeholder="Ex: 15000"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="h-12 text-lg font-bold"
              />
            </div>
            <Button className="w-full h-12 text-lg font-bold" onClick={handleOpenSession} disabled={isProcessing}>
              {isProcessing ? "Ouverture..." : "OUVRIR LA CAISSE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-800">
              <Lock className="text-red-600" /> Clôturer la Caisse
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de fermer la session de caisse courante et d'éditer le Report Z.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button variant="destructive" className="w-full h-12 text-lg font-bold" onClick={handleCloseSession} disabled={isProcessing}>
              CONFIRMER LA CLÔTURE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 flex flex-col lg:grid lg:grid-cols-3 gap-4 min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)]">
        {/* Grille principale (Produits) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[60vh] lg:h-full relative">

          {isCaisseLocked && (
            <div className="absolute inset-0 z-10 bg-slate-100/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <Button onClick={() => setIsSessionModalOpen(true)} className="shadow-2xl h-14 px-8 text-xl font-black">
                <Unlock className="mr-2" /> OUVRIR LA CAISSE
              </Button>
            </div>
          )}

          <Card className="flex-1 overflow-hidden flex flex-col border-none shadow-xl bg-white/70 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row gap-4 mb-2 items-start md:items-center justify-between">
                <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  CAISSE
                  {session && (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">
                      Caisse Ouverte
                    </span>
                  )}
                </CardTitle>

                {session && (
                  <Button variant="outline" size="sm" onClick={() => setIsCloseModalOpen(true)} className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                    <Lock size={14} className="mr-2" /> Clôturer (Report Z)
                  </Button>
                )}
              </div>

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
                      setSearchTerm("");
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
                        const match = products.find(p => p.name === e.target.value);
                        if (match) {
                          addToCart(match);
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
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="group relative flex flex-col items-start p-3 md:p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-95 overflow-hidden"
                    onClick={() => addToCart(p)}
                  >
                    <div className="absolute top-0 right-0 p-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                        <Plus size={14} />
                      </div>
                    </div>

                    {p.imageUrl && (
                      <div className="w-full h-24 relative mb-2 rounded-xl overflow-hidden bg-slate-50">
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}

                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1 relative z-10 block w-full">
                      {p.categoryName || "Général"}
                    </span>
                    <p className="font-extrabold text-slate-700 text-xs md:text-sm line-clamp-2 leading-tight mb-2 h-8 md:h-10">
                      {p.name}
                    </p>
                    <div className="mt-auto w-full flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-1">
                      <p className="text-blue-600 font-black text-sm md:text-base italic">
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
                <div className="flex flex-col items-center justify-center py-10 md:py-20 text-slate-300">
                  <Search size={32} className="mb-4 opacity-20 md:w-12 md:h-12" />
                  <p className="font-bold text-sm md:text-base">Aucun produit trouvé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panier (Sidebar sur Desktop, empilé sur Mobile) */}
        <Card className="flex flex-col h-[40vh] lg:h-full relative">

          {isCaisseLocked && (
            <div className="absolute inset-0 z-10 bg-slate-100/50 backdrop-blur-sm rounded-xl" />
          )}

          <CardHeader className="border-b bg-slate-50/50 py-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Panier</span>
              <ShoppingCart size={18} className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Votre panier est vide</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 md:p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-xs md:text-sm">{item.name}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Button variant="outline" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus size={12} />
                        </Button>
                        <span className="w-6 md:w-8 text-center text-xs md:text-sm font-bold">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => updateQuantity(item.id, 1)}>
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
          <div className="p-4 md:p-6 border-t bg-slate-50/50 space-y-3 md:space-y-4">
            <div className="flex justify-between items-center text-base md:text-lg">
              <span className="font-medium text-muted-foreground">Total</span>
              <span className="font-extrabold text-xl md:text-2xl text-blue-600">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full h-10 md:h-12 text-sm md:text-lg font-bold"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? "Traitement..." : "VALIDER LA VENTE"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
