import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProduct, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Barcode } from "lucide-react";
import { Link } from "wouter";
import { ImageUpload } from "@/components/image-upload";
import { BarcodeScanner } from "@/components/barcode-scanner";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  categoryId: z.string().optional(),
  quantity: z.coerce.number().min(0).default(0),
  unitCostPrice: z.coerce.number().min(0).optional(),
  unitSalePrice: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).default(5),
  notes: z.string().optional(),
  barcode: z.string().optional(),
});

export function ProductNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const createProduct = useCreateProduct();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", categoryId: undefined, quantity: 0, lowStockThreshold: 5, notes: "", barcode: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProduct.mutate({
      data: {
        ...values,
        categoryId: values.categoryId ? Number(values.categoryId) : undefined,
        barcode: values.barcode || undefined,
        imageUrl: imageUrl || undefined,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Produit créé" });
        setLocation(`/products/${data.id}`);
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err?.message || "Échec." }),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau produit</h1>
          <p className="text-muted-foreground">Ajoutez un produit à votre inventaire.</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
        <div>
          <Label>Photo du produit</Label>
          <div className="mt-2">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl><Input placeholder="ex. Robe d'été" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger></FormControl>
                    <SelectContent>{categories?.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="barcode" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="flex items-center gap-2"><Barcode className="h-4 w-4" />Code-barres</FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input placeholder="ex. 3760123456789" className="font-mono" {...field} /></FormControl>
                    <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}>
                      <Camera className="h-4 w-4 mr-2" /> Scanner
                    </Button>
                  </div>
                  <FormDescription>Optionnel — utilisé pour la recherche rapide en caisse.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="unitCostPrice" render={({ field }) => (
                <FormItem><FormLabel>Prix d'achat (FCFA)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="unitSalePrice" render={({ field }) => (
                <FormItem><FormLabel>Prix de vente (FCFA)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>Stock initial</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Vous pourrez ajouter des variantes (taille/couleur) après la création.</FormDescription><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
                <FormItem><FormLabel>Seuil d'alerte stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Alerte quand le stock passe sous ce nombre.</FormDescription><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Détails additionnels..." className="min-h-[100px]" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" asChild><Link href="/products">Annuler</Link></Button>
              <Button type="submit" disabled={createProduct.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                {createProduct.isPending ? "Création..." : "Créer le produit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onScan={(code) => form.setValue("barcode", code)} />
    </div>
  );
}
