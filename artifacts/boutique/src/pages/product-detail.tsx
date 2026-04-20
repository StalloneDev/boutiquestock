import { useState } from "react";
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
import { ArrowLeft, Edit, TrendingUp, TrendingDown, RefreshCcw, ShoppingBag, Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().optional(),
  unitCostPrice: z.coerce.number().min(0).optional(),
  unitSalePrice: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).default(5),
  notes: z.string().optional(),
});

export function ProductDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) }
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const { data: movements, isLoading: movementsLoading } = useListStockMovements(
    { productId: id, limit: 10 },
    { query: { enabled: !!id, queryKey: getListStockMovementsQueryKey({ productId: id, limit: 10 }) } }
  );

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      categoryId: product?.categoryId?.toString() || "",
      unitCostPrice: product?.unitCostPrice || undefined,
      unitSalePrice: product?.unitSalePrice || undefined,
      lowStockThreshold: product?.lowStockThreshold || 5,
      notes: product?.notes || "",
    },
  });

  // Update form when product loads
  if (product && !form.getValues("name")) {
    form.reset({
      name: product.name,
      categoryId: product.categoryId?.toString() || "",
      unitCostPrice: product.unitCostPrice || undefined,
      unitSalePrice: product.unitSalePrice || undefined,
      lowStockThreshold: product.lowStockThreshold || 5,
      notes: product.notes || "",
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProduct.mutate({
      id,
      data: {
        ...values,
        categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Success", description: "Product updated successfully." });
        setIsEditOpen(false);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to update product." });
      }
    });
  }

  function handleDelete() {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Success", description: "Product deleted successfully." });
        setLocation("/products");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to delete product." });
      }
    });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-muted-foreground">Product not found.</div>;
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entry": return <TrendingUp className="text-green-500 h-4 w-4" />;
      case "exit": return <TrendingDown className="text-red-500 h-4 w-4" />;
      case "sale": return <ShoppingBag className="text-blue-500 h-4 w-4" />;
      case "adjustment": return <RefreshCcw className="text-orange-500 h-4 w-4" />;
      default: return null;
    }
  };

  const getMovementLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {product.name}
              <Badge 
                variant={product.quantity <= 0 ? "destructive" : product.quantity <= product.lowStockThreshold ? "default" : "outline"}
                className={product.quantity <= product.lowStockThreshold && product.quantity > 0 ? "bg-orange-500 text-white" : ""}
              >
                {product.quantity} in stock
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Category: {product.categoryName || "Uncategorized"} • ID: #{product.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Uncategorized</SelectItem>
                            {categories?.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitCostPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (FCFA)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitSalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price (FCFA)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Alert Threshold</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={updateProduct.isPending}>
                      {updateProduct.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the product 
                  and it will no longer be available in the inventory.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete} disabled={deleteProduct.isPending}>
                  {deleteProduct.isPending ? "Deleting..." : "Delete"}
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Sale Price</p>
              <p className="text-2xl font-mono">{formatCurrency(product.unitSalePrice || 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Cost Price</p>
              <p className="text-2xl font-mono">{formatCurrency(product.unitCostPrice || 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Margin</p>
              <p className="text-2xl font-mono text-green-600">
                {formatCurrency((product.unitSalePrice || 0) - (product.unitCostPrice || 0))}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-mono text-blue-600">
                {formatCurrency((product.unitSalePrice || 0) * product.quantity)}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold">Recent Movements</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : movements?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No movements found.</TableCell></TableRow>
                ) : (
                  movements?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(m.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {getMovementIcon(m.type)}
                          {getMovementLabel(m.type)}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${m.delta > 0 ? "text-green-600" : m.delta < 0 ? "text-red-600" : ""}`}>
                        {m.delta > 0 ? "+" : ""}{m.delta}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{m.quantityAfter}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.reason || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Alert Threshold</p>
                <p className="font-medium">{product.lowStockThreshold} units</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium text-sm">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
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
    </div>
  );
}
