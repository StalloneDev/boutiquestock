"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/format";
import { BarcodePrinter } from "@/components/products/barcode-printer";
import { ProductActions } from "@/components/products/product-actions";
import { BulkDiscountDialog } from "@/components/products/bulk-discount-dialog";
import { TrendingDown, X, CheckSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  quantity: number;
  unitCostPrice: string | number | null;
  unitSalePrice: string | number | null;
  lowStockThreshold: number;
  notes: string | null;
  barcode: string | null;
  imageUrl: string | null;
  hasVariants: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductGridProps {
  products: Product[];
  categories: { id: number; name: string }[];
  isAdmin?: boolean;
}

export function ProductGrid({ products, categories, isAdmin }: ProductGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const router = useRouter();

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  const handleDiscountSuccess = () => {
    clearSelection();
    router.refresh();
  };

  return (
    <>
      {/* Barre de mode sélection */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {products.length} produit(s) affiché(s)
        </p>
        {isAdmin && (
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            className="gap-2 text-xs"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) clearSelection();
            }}
          >
            <CheckSquare size={14} />
            {selectionMode ? "Quitter la sélection" : "Mode sélection"}
          </Button>
        )}
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const isSelected = selectedIds.has(p.id);
          return (
            <Card
              key={p.id}
              onClick={selectionMode ? () => toggleSelect(p.id) : undefined}
              className={`overflow-hidden group flex flex-col transition-all duration-200 ${
                selectionMode
                  ? "cursor-pointer select-none"
                  : "hover:border-primary/50"
              } ${
                isSelected
                  ? "border-orange-500 ring-2 ring-orange-400 shadow-orange-100 shadow-lg"
                  : ""
              }`}
            >
              {/* Zone image */}
              {p.imageUrl ? (
                <div className="relative w-full h-40 bg-slate-100 border-b">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {selectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 border-2 border-white shadow-md bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-8 bg-slate-50 border-b">
                  {selectionMode && (
                    <div className="absolute top-1.5 left-2 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 border-2 border-slate-400 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {p.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        p.quantity <= p.lowStockThreshold
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.quantity} en stock
                    </div>
                    {!selectionMode && (
                      <>
                        <BarcodePrinter product={p} />
                        {isAdmin && <ProductActions product={p} categories={categories} />}
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.categoryName || "Sans catégorie"}
                </p>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                      Prix de vente
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(p.unitSalePrice)}
                    </p>
                  </div>
                  {!selectionMode && (
                    <Link href={`/products/${p.id}`}>
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 col-span-3">
          <p className="text-lg font-semibold">Aucun produit trouvé</p>
          <p className="text-sm mt-1">Essayez de modifier vos filtres.</p>
        </div>
      )}

      {/* Barre flottante de sélection */}
      {selectionMode && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            selectedIds.size > 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-2xl shadow-slate-300/60 rounded-2xl px-5 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="text-slate-400 hover:text-slate-700 h-8 w-8"
            >
              <X size={16} />
            </Button>

            <p className="text-sm font-bold text-slate-700 whitespace-nowrap">
              <span className="text-orange-500">{selectedIds.size}</span>{" "}
              produit(s) sélectionné(s)
            </p>

            <div className="h-5 w-px bg-slate-200" />

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs text-slate-500 hover:text-slate-700 whitespace-nowrap"
            >
              {selectedIds.size === products.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </Button>

            <Button
              size="sm"
              onClick={() => setDiscountDialogOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2 font-semibold whitespace-nowrap"
            >
              <TrendingDown size={15} />
              Appliquer une remise
            </Button>
          </div>
        </div>
      )}

      {/* Dialog remise groupée */}
      <BulkDiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        selectedProducts={selectedProducts}
        onSuccess={handleDiscountSuccess}
      />
    </>
  );
}
