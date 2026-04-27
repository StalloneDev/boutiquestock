"use client";

import { useRef, useState } from "react";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function BarcodePrinter({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!product.barcode) {
    return (
      <Button variant="outline" size="sm" disabled title="Aucun code-barres défini pour ce produit">
        <Printer size={16} className="mr-2" /> Imprimer
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="print:hidden">
          <Printer size={16} className="mr-2" /> Imprimer Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md print:hidden">
        <DialogHeader>
          <DialogTitle>Impression d'étiquettes - {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre d'étiquettes à générer</label>
            <Input 
              type="number" 
              min={1} 
              max={100} 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
            />
          </div>
          <Button onClick={handlePrint} className="w-full">
            Lancer l'impression
          </Button>
        </div>
      </DialogContent>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 10px;
          }
          .barcode-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px dashed #ccc;
            padding: 10px;
            page-break-inside: avoid;
          }
          .barcode-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
          }
        }
      `}</style>

      {/* Zone cachée à l'écran, visible uniquement à l'impression */}
      <div id="print-area" className="hidden print:grid" ref={printRef}>
        {[...Array(quantity)].map((_, i) => (
          <div key={i} className="barcode-item">
            <div className="barcode-title">{product.name.substring(0, 20)}... - {product.unitSalePrice}f</div>
            <Barcode value={product.barcode} width={1.5} height={40} fontSize={10} margin={0} />
          </div>
        ))}
      </div>
    </Dialog>
  );
}
