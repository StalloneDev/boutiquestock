import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey, usePosCheckout, lookupByBarcode } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Trash2, ShoppingBag, Camera, Barcode, ImageIcon, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imageUrlFor } from "@/components/image-upload";

type CartItem = {
  key: string;
  productId: number;
  variantId: number | null;
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
};

export function Pos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [variantPick, setVariantPick] = useState<any>(null);
  const [barcodeManual, setBarcodeManual] = useState("");

  const { data: products, isLoading: productsLoading } = useListProducts({ search: search || undefined, categoryId }, {
    query: { queryKey: getListProductsQueryKey({ search: search || undefined, categoryId }) }
  });

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const posCheckout = usePosCheckout();

  const addToCart = (product: any, variant: any | null = null) => {
    const stock = variant ? variant.quantity : product.quantity;
    if (stock <= 0) {
      toast({ variant: "destructive", title: "Stock épuisé" });
      return;
    }
    const price = variant?.unitSalePrice ?? product.unitSalePrice ?? 0;
    const variantLabel = variant ? [variant.size, variant.color].filter(Boolean).join(" / ") : null;
    const key = variant ? `${product.id}-${variant.id}` : `${product.id}`;

    setCart(current => {
      const existing = current.find(item => item.key === key);
      if (existing) {
        if (existing.quantity >= existing.maxQuantity) return current;
        return current.map(item => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, {
        key,
        productId: product.id,
        variantId: variant?.id ?? null,
        productName: product.name,
        variantLabel,
        unitPrice: Number(price),
        quantity: 1,
        maxQuantity: stock,
      }];
    });
  };

  const handleCardClick = (product: any) => {
    if (product.hasVariants && (product.variants?.length || 0) > 0) {
      setVariantPick(product);
    } else {
      addToCart(product);
    }
  };

  const handleBarcode = async (code: string) => {
    try {
      const result = await lookupByBarcode(code);
      addToCart(result.product, result.variant);
      const label = result.variant ? `${result.product.name} (${[result.variant.size, result.variant.color].filter(Boolean).join("/")})` : result.product.name;
      toast({ title: "Ajouté au panier", description: label });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Code-barres inconnu", description: code });
    }
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart(current => current.map(item => {
      if (item.key === key) {
        const newQuantity = Math.max(1, Math.min(item.maxQuantity, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (key: string) => setCart(current => current.filter(item => item.key !== key));

  const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    posCheckout.mutate({
      data: {
        items: cart.map(item => ({ productId: item.productId, variantId: item.variantId ?? undefined, quantity: item.quantity, unitPrice: item.unitPrice })),
        notes: notes || undefined
      }
    }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Vente enregistrée", description: `${result.itemCount} article(s) — ${formatCurrency(result.grandTotal)}` });
        setCart([]);
        setNotes("");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Échec", description: err?.message || "Erreur." })
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Caisse</h1>
            <p className="text-muted-foreground">Encaissez rapidement les ventes.</p>
          </div>
          <Button onClick={() => setScannerOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700">
            <Camera className="mr-2 h-4 w-4" /> Scanner code-barres
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un produit..." className="pl-8 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Saisir un code-barres + Entrée"
              className="pl-8 bg-background font-mono"
              value={barcodeManual}
              onChange={(e) => setBarcodeManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && barcodeManual.trim()) {
                  handleBarcode(barcodeManual.trim());
                  setBarcodeManual("");
                }
              }}
            />
          </div>
        </div>

        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
          <Badge variant={categoryId === undefined ? "default" : "outline"} className="cursor-pointer whitespace-nowrap" onClick={() => setCategoryId(undefined)}>Toutes</Badge>
          {categories?.map(c => (
            <Badge key={c.id} variant={categoryId === c.id ? "default" : "outline"} className="cursor-pointer whitespace-nowrap" onClick={() => setCategoryId(c.id)}>{c.name}</Badge>
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {productsLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Chargement...</div>
            ) : products?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Aucun produit.</div>
            ) : (
              products?.map(product => {
                const img = imageUrlFor(product.imageUrl);
                const stock = product.quantity;
                return (
                  <Card key={product.id}
                    className={`cursor-pointer transition-all hover:border-primary hover:shadow-md overflow-hidden ${stock <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => handleCardClick(product)}>
                    <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
                      {img ? <img src={img} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/40" />}
                    </div>
                    <CardContent className="p-3 flex flex-col gap-1">
                      <div className="font-semibold line-clamp-2 text-sm leading-tight">{product.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-mono text-primary font-semibold text-sm">{formatCurrency(product.unitSalePrice || 0)}</div>
                        {product.hasVariants ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                            <Layers className="h-2.5 w-2.5 mr-0.5" />{product.variants?.length || 0} variantes
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{stock} stock</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart */}
      <Card className="w-96 flex flex-col flex-shrink-0 border-2 border-primary/10 shadow-lg">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <ShoppingBag className="h-5 w-5" />Vente en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 gap-2">
                <ShoppingBag className="h-10 w-10 opacity-30" />
                <span>Panier vide</span>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {cart.map(item => (
                  <div key={item.key} className="flex flex-col gap-2 pb-3 border-b last:border-0">
                    <div className="flex justify-between font-medium gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-1 text-sm">{item.productName}</div>
                        {item.variantLabel && <div className="text-xs text-purple-600">{item.variantLabel}</div>}
                      </div>
                      <span className="font-mono whitespace-nowrap text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground font-mono">{formatCurrency(item.unitPrice)} × {item.quantity}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.key, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.key, 1)} disabled={item.quantity >= item.maxQuantity}><Plus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1" onClick={() => removeFromCart(item.key)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-6 bg-muted/30 border-t mt-auto space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="font-mono text-primary text-xl">{formatCurrency(total)}</span>
            </div>
            <Input placeholder="Notes (optionnel)..." value={notes} onChange={e => setNotes(e.target.value)} />
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" size="lg" disabled={cart.length === 0 || posCheckout.isPending} onClick={handleCheckout}>
              {posCheckout.isPending ? "Traitement..." : "Encaisser"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={handleBarcode} />

      <Dialog open={!!variantPick} onOpenChange={(o) => !o && setVariantPick(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{variantPick?.name} — Choisir une variante</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {variantPick?.variants?.map((v: any) => {
              const label = [v.size, v.color].filter(Boolean).join(" / ") || "Variante";
              const out = v.quantity <= 0;
              return (
                <button key={v.id} disabled={out} onClick={() => { addToCart(variantPick, v); setVariantPick(null); }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${out ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}`}>
                  <div className="text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{v.quantity} en stock</div>
                  </div>
                  <div className="font-mono text-primary font-semibold">{formatCurrency(v.unitSalePrice ?? variantPick.unitSalePrice ?? 0)}</div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
