import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
};

export function BarcodeScanner({ open, onOpenChange, onScan }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "barcode-scanner-region";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 1.5 },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            onScan(decodedText);
            void scanner.stop().then(() => scanner.clear()).catch(() => {});
            onOpenChange(false);
          },
          () => {},
        );
      } catch (e: any) {
        setError(e?.message || "Caméra inaccessible. Vérifiez les autorisations.");
      }
    };

    void start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scanner un code-barres
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          ) : (
            <>
              <div id={elementId} className="w-full rounded-lg overflow-hidden bg-black" style={{ minHeight: 280 }} />
              <p className="text-sm text-muted-foreground text-center">
                Pointez la caméra vers le code-barres du produit
              </p>
            </>
          )}
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
