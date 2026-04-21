import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetProduct, getGetProductQueryKey, useListStockMovements, getListStockMovementsQueryKey, useUpdateProduct, useDeleteProduct, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, TrendingUp, TrendingDown, RefreshCcw, ShoppingBag, Trash2, Camera, ImageIcon, Barcode } from "lucide-react";
import { ImageUpload, imageUrlFor } from "@/components/image-upload";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { VariantsManager } from "@/components/variants-manager";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  categoryId: z.string().optional(),
  unitCostPrice: z.coerce.number().min(0).optional(),
  unitSalePrice: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).default(5),
  notes: z.string().optional(),
  barcode: z.string().optional(),
});

export function ProductDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: movements, isLoading: movementsLoading } = useListStockMovements({ productId: id, limit: 10 }, { query: { enabled: !!id, queryKey: getListStockMovementsQueryKey({ productId: id, limit: 10 }) } });

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", categoryId: "", lowStockThreshold: 5, notes: "", barcode: "" },
  });

  useEffect(() => {
    if (product && isEditOpen) {
      form.reset({
        name: product.name,
        categoryId: product.categoryId?.toString() || "",
        unitCostPrice: product.unitCostPrice ?? undefined,
        unitSalePrice: product.unitSalePrice ?? undefined,
        lowStockThreshold: product.lowStockThreshold || 5,
        notes: product.notes || "",
        barcode: product.barcode || "",
      });
      setEditImageUrl(product.imageUrl || null);
    }
  }, [product, isEditOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProduct.mutate({
      id,
      data: {
        ...values,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        barcode: values.barcode || null,
        imageUrl: editImageUrl,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Produit mis à jour" });
        setIsEditOpen(false);
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err?.message || "Échec." })
    });
  }

  function handleDelete() {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Produit supprimé" });
        setLocation("/products");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err?.message || "Échec." })
    });
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  if (!product) return <div className="p-8 text-center text-muted-foreground">Produit introuvable.</div>;

  const movementMeta = (type: string) => {
    switch (type) {
      case "entry": return { icon: <TrendingUp className="h-4 w-4" />, label: "Entrée", color: "text-emerald-600 bg-emerald-50" };
      case "exit": return { icon: <TrendingDown className="h-4 w-4" />, label: "Sortie", color: "text-red-600 bg-red-50" };
      case "sale": return { icon: <ShoppingBag className="h-4 w-4" />, label: "Vente", color: "text-blue-600 bg-blue-50" };
      case "adjustment": return { icon: <RefreshCcw className="h-4 w-4" />, label: "Ajustement", color: "text-orange-600 bg-orange-50" };
      default: return { icon: null, label: type, color: "" };
    }
  };

  const productImg = imageUrlFor(product.imageUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {product.name}
              <Badge variant={product.quantity <= 0 ? "destructive" : product.quantity <= product.lowStockThreshold ? "default" : "outline"}
                className={product.quantity <= product.lowStockThreshold && product.quantity > 0 ? "bg-orange-500 text-white" : product.quantity > product.lowStockThreshold ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                {product.quantity} en stock
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Catégorie : {product.categoryName || "Non classé"} • ID #{product.id}
              {product.barcode && <> • <span className="font-mono">{product.barcode}</span></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Modifier</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Modifier le produit</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <ImageUpload value={editImageUrl} onChange={setEditImageUrl} />
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                      <FormItem><FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                          <SelectContent>{categories?.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="barcode" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-2"><Barcode className="h-4 w-4" />Code-barres</FormLabel>
                        <div className="flex gap-2">
                          <FormControl><Input placeholder="Code-barres" className="font-mono" {...field} /></FormControl>
                          <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)}><Camera className="h-4 w-4" /></Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="unitCostPrice" render={({ field }) => (
                        <FormItem><FormLabel>Prix d'achat (FCFA)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="unitSalePrice" render={({ field }) => (
                        <FormItem><FormLabel>Prix de vente (FCFA)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
                      <FormItem><FormLabel>Seuil d'alerte stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                      <Button type="submit" disabled={updateProduct.isPending}>{updateProduct.isPending ? "Enregistrement..." : "Enregistrer"}</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete} disabled={deleteProduct.isPending}>
                  {deleteProduct.isPending ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Prix de vente</p>
              <p className="text-xl font-mono font-semibold">{formatCurrency(product.unitSalePrice || 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Prix d'achat</p>
              <p className="text-xl font-mono">{formatCurrency(product.unitCostPrice || 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Marge</p>
              <p className="text-xl font-mono text-emerald-600 font-semibold">{formatCurrency((product.unitSalePrice || 0) - (product.unitCostPrice || 0))}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Valeur stock</p>
              <p className="text-xl font-mono text-blue-600 font-semibold">{formatCurrency((product.unitSalePrice || 0) * product.quantity)}</p>
            </div>
          </div>

          <VariantsManager productId={id} variants={product.variants || []} />

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold">Mouvements récents</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Variation</TableHead><TableHead className="text-right">Après</TableHead><TableHead>Motif</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Chargement...</TableCell></TableRow>
                ) : movements?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aucun mouvement.</TableCell></TableRow>
                ) : (
                  movements?.map((m) => {
                    const meta = movementMeta(m.type);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm whitespace-nowrap">{formatDate(m.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${meta.color}`}>
                            {meta.icon}{meta.label}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-medium ${m.delta > 0 ? "text-emerald-600" : m.delta < 0 ? "text-red-600" : ""}`}>
                          {m.delta > 0 ? "+" : ""}{m.delta}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{m.quantityAfter}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.reason || "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">Photo</p>
            <div className="aspect-square rounded-lg bg-muted overflow-hidden flex items-center justify-center">
              {productImg ? <img src={productImg} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="h-12 w-12 text-muted-foreground/40" />}
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Détails</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Seuil d'alerte</p>
                <p className="font-medium">{product.lowStockThreshold} unités</p>
              </div>
              {product.barcode && (
                <div>
                  <p className="text-sm text-muted-foreground">Code-barres</p>
                  <p className="font-mono text-sm">{product.barcode}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium text-sm">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mis à jour</p>
                <p className="font-medium text-sm">{formatDate(product.updatedAt)}</p>
              </div>
              {product.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-md">{product.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={(code) => form.setValue("barcode", code)} />
    </div>
  );
}
