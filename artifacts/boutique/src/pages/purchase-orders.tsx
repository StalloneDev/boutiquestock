import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPurchaseOrders, getListPurchaseOrdersQueryKey, useCreatePurchaseOrder, useReceivePurchaseOrder, useListSuppliers, getListSuppliersQueryKey, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Trash2, PackageSearch } from "lucide-react";

const poItemSchema = z.object({
  productId: z.string().min(1, "Product required"),
  quantityOrdered: z.coerce.number().min(1),
  unitCost: z.coerce.number().min(0),
});

const poSchema = z.object({
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
});

export function PurchaseOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");

  const queryParams = {
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    supplierId: supplierFilter !== "all" ? Number(supplierFilter) : undefined
  };

  const { data: purchaseOrders, isLoading } = useListPurchaseOrders(queryParams, {
    query: { queryKey: getListPurchaseOrdersQueryKey(queryParams) }
  });

  const { data: suppliers } = useListSuppliers({
    query: { queryKey: getListSuppliersQueryKey() }
  });

  const { data: products } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey({}) }
  });

  const createPO = useCreatePurchaseOrder();
  const receivePO = useReceivePurchaseOrder();

  const form = useForm<z.infer<typeof poSchema>>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplierId: "",
      notes: "",
      items: [{ productId: "", quantityOrdered: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleProductSelect = (index: number, productId: string) => {
    form.setValue(`items.${index}.productId`, productId);
    const product = products?.find(p => p.id.toString() === productId);
    if (product?.unitCostPrice) {
      form.setValue(`items.${index}.unitCost`, product.unitCostPrice);
    }
  };

  const onSubmit = (values: z.infer<typeof poSchema>) => {
    createPO.mutate({
      data: {
        supplierId: values.supplierId ? Number(values.supplierId) : undefined,
        notes: values.notes,
        items: values.items.map(item => ({
          productId: Number(item.productId),
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost
        }))
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey() });
        toast({ title: "Success", description: "Purchase order created." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err?.message })
    });
  };

  const handleReceive = (id: number) => {
    receivePO.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Success", description: "Purchase order received and stock updated." });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err?.message })
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'ordered': return <Badge className="bg-blue-500 hover:bg-blue-600">Ordered</Badge>;
      case 'received': return <Badge className="bg-green-500 hover:bg-green-600">Received</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage incoming stock from suppliers.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 px-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier (Optional)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="font-medium text-sm">Order Items</div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end border p-3 rounded-md bg-muted/20">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: selectField }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Product</FormLabel>
                            <Select value={selectField.value} onValueChange={(val) => handleProductSelect(index, val)}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map(p => (
                                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantityOrdered`}
                        render={({ field: qtyField }) => (
                          <FormItem className="w-24">
                            <FormLabel className="text-xs">Qty</FormLabel>
                            <FormControl>
                              <Input type="number" {...qtyField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitCost`}
                        render={({ field: costField }) => (
                          <FormItem className="w-32">
                            <FormLabel className="text-xs">Unit Cost</FormLabel>
                            <FormControl>
                              <Input type="number" {...costField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive mb-1" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantityOrdered: 1, unitCost: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createPO.isPending}>
                    {createPO.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers?.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Loading orders...</TableCell></TableRow>
            ) : purchaseOrders?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No purchase orders found.</TableCell></TableRow>
            ) : (
              purchaseOrders?.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium font-mono text-sm">PO-{po.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>{formatDate(po.createdAt)}</TableCell>
                  <TableCell>{po.supplierName || <span className="text-muted-foreground italic">None</span>}</TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell className="text-right">{po.items?.length || 0} items</TableCell>
                  <TableCell className="text-right font-mono font-medium text-primary">{formatCurrency(po.totalCost)}</TableCell>
                  <TableCell className="text-right">
                    {po.status === 'ordered' && (
                      <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleReceive(po.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Receive
                      </Button>
                    )}
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
