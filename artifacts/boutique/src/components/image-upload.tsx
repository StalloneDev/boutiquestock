import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  value: string | null | undefined;
  onChange: (objectPath: string | null) => void;
};

const apiBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

export function imageUrlFor(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  if (objectPath.startsWith("http")) return objectPath;
  return `${apiBase}/storage${objectPath}`;
}

export function ImageUpload({ value, onChange }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const previewUrl = imageUrlFor(value);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Fichier invalide", description: "Veuillez choisir une image." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Fichier trop lourd", description: "Limite de 10 Mo." });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`${apiBase}/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Échec de la demande d'URL");
      const { uploadURL, objectPath } = await res.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Échec de l'envoi du fichier");

      onChange(objectPath);
      toast({ title: "Photo ajoutée" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message || "Échec de l'upload" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center flex-shrink-0">
        {previewUrl ? (
          <img src={previewUrl} alt="aperçu" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" />
          {value ? "Changer la photo" : "Téléverser une photo"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} className="text-destructive">
            <X className="h-4 w-4 mr-2" />
            Retirer
          </Button>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, jusqu'à 10 Mo</p>
      </div>
    </div>
  );
}
