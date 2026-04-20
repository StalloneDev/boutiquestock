import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListStockMovements, getListStockMovementsQueryKey, useListProducts, getListProductsQueryKey, useCreateStockMovement, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { ArrowDownUp, Plus } from "lucide-react";

const entrySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0"),
  reason: z.string().optional(),
});

export function StockEntries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: movements, isLoading } = useListStockMovements({ limit: 50 }, {
    query: { queryKey: getListStockMovementsQueryKey({ limit: 50 }) }
  });

  // Filter only entries
  const entries = movements?.filter(m => m.type === "entry");

  const { data: products } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey({}) }
  });

  const createMovement = useCreateStockMovement();

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: { productId: "", quantity: 1, reason: "Restock" },
  });

  function onSubmit(values: z.infer<typeof entrySchema>) {
    createMovement.mutate({
      data: {
        productId: Number(values.productId),
        delta: values.quantity, // positive for entry
        reason: values.reason,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStockMovementsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Success", description: "Stock added successfully." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to add stock." })
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restock</h1>
          <p className="text-muted-foreground">Add new inventory for existing products.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Stock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} (Current: {p.quantity})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Add</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason / Notes</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMovement.isPending}>Submit Entry</Button>
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
              <TableHead className="text-right">Added</TableHead>
              <TableHead className="text-right">New Total</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : entries?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No restock entries found.</TableCell></TableRow>
            ) : (
              entries?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{formatDate(entry.createdAt)}</TableCell>
                  <TableCell className="font-medium">{entry.productName}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-green-600">+{entry.delta}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{entry.quantityAfter}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}