import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey, usePosCheckout } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CartItem = {
  productId: number;
  productName: string;
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

  const { data: products, isLoading: productsLoading } = useListProducts({ search: search || undefined, categoryId }, {
    query: { queryKey: getListProductsQueryKey({ search: search || undefined, categoryId }) }
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const posCheckout = usePosCheckout();

  const addToCart = (product: any) => {
    if (product.quantity <= 0) return;
    
    setCart(current => {
      const existing = current.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return current;
        return current.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.unitSalePrice || 0,
        quantity: 1,
        maxQuantity: product.quantity
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(current => current.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, Math.min(item.maxQuantity, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(current => current.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    posCheckout.mutate({
      data: {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes: notes || undefined
      }
    }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Sale Completed", description: `Successfully processed ${result.itemCount} items.` });
        setCart([]);
        setNotes("");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Checkout Failed", description: err?.message || "An error occurred." });
      }
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Quick checkout interface</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            <Badge 
              variant={categoryId === undefined ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setCategoryId(undefined)}
            >
              All
            </Badge>
            {categories?.map(c => (
              <Badge 
                key={c.id}
                variant={categoryId === c.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {productsLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Loading products...</div>
            ) : products?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No products found.</div>
            ) : (
              products?.map(product => (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${product.quantity <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="font-semibold line-clamp-2">{product.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{product.categoryName || 'Uncategorized'}</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="font-mono text-primary font-medium">{formatCurrency(product.unitSalePrice || 0)}</div>
                      <div className="text-xs text-muted-foreground">{product.quantity} in stock</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart */}
      <Card className="w-96 flex flex-col flex-shrink-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Current Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground py-12">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {cart.map(item => (
                  <div key={item.productId} className="flex flex-col gap-2">
                    <div className="flex justify-between font-medium">
                      <span className="line-clamp-1">{item.productName}</span>
                      <span className="font-mono">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground font-mono">{formatCurrency(item.unitPrice)} each</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, 1)} disabled={item.quantity >= item.maxQuantity}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1" onClick={() => removeFromCart(item.productId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-6 bg-muted/20 border-t mt-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="font-mono text-primary">{formatCurrency(total)}</span>
              </div>
              <Input 
                placeholder="Add notes (optional)..." 
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <Button 
                className="w-full" 
                size="lg" 
                disabled={cart.length === 0 || posCheckout.isPending}
                onClick={handleCheckout}
              >
                {posCheckout.isPending ? "Processing..." : "Complete Checkout"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
