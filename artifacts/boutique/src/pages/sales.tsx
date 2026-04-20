import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSales, getListSalesQueryKey, useListProducts, getListProductsQueryKey, useCreateSale, useDeleteSale, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";

const saleSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export function Sales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sales, isLoading: salesLoading } = useListSales({ limit: 50 }, {
    query: { queryKey: getListSalesQueryKey({ limit: 50 }) }
  });

  const { data: products } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey({}) }
  });

  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      unitPrice: 0,
      notes: "",
    },
  });

  const selectedProductId = form.watch("productId");
  
  // Update price when product changes
  const handleProductChange = (productId: string) => {
    form.setValue("productId", productId);
    const product = products?.find(p => p.id.toString() === productId);
    if (product?.unitSalePrice) {
      form.setValue("unitPrice", product.unitSalePrice);
    }
  };

  function onSubmit(values: z.infer<typeof saleSchema>) {
    createSale.mutate({
      data: {
        productId: Number(values.productId),
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        notes: values.notes,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Success", description: "Sale recorded successfully." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error?.message || "Failed to record sale." });
      }
    });
  }

  function handleDeleteSale(id: number) {
    deleteSale.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Success", description: "Sale deleted successfully." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error?.message || "Failed to delete sale." });
      }
    });
  }

  const selectedProduct = products?.find(p => p.id.toString() === selectedProductId);
  const totalAmount = (form.watch("quantity") || 0) * (form.watch("unitPrice") || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Record new sales and view sales history.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select value={field.value} onValueChange={handleProductChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.filter(p => p.quantity > 0).map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name} ({p.quantity} in stock)
                            </SelectItem>
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            max={selectedProduct?.quantity} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price (FCFA)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center border border-border/50">
                  <span className="font-medium text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Customer name, payment method, etc." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSale.isPending}>
                    {createSale.isPending ? "Recording..." : "Complete Sale"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading sales...</TableCell></TableRow>
            ) : sales?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No sales recorded yet.</TableCell></TableRow>
            ) : (
              sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-sm">{formatDate(sale.createdAt)}</TableCell>
                  <TableCell className="font-medium">{sale.productName}</TableCell>
                  <TableCell className="text-right font-mono">{sale.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(sale.unitPrice)}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-green-600">{formatCurrency(sale.totalAmount)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Sale?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this sale? The quantity of {sale.quantity} will be restored to the product's stock.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDeleteSale(sale.id)}>
                            Delete Sale
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
