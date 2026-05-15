import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { existsSync } from "fs";

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 Mo

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
        }

        // Vérifier que c'est bien une image (tous types)
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Seules les images sont acceptées." },
                { status: 400 }
            );
        }

        // Vérifier la taille (4 Mo max)
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "L'image ne doit pas dépasser 4 Mo." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Générer un nom de fichier unique en conservant l'extension d'origine
        const originalExt = path.extname(file.name).toLowerCase();
        // Normaliser : si pas d'extension connue, déduire depuis le type MIME
        const mimeToExt: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "image/avif": ".avif",
            "image/svg+xml": ".svg",
            "image/bmp": ".bmp",
            "image/tiff": ".tiff",
        };
        const ext = originalExt || mimeToExt[file.type] || ".jpg";
        const filename = `${crypto.randomUUID()}${ext}`;

        // Créer le dossier public/uploads s'il n'existe pas
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const publicPath = path.join(uploadsDir, filename);
        await writeFile(publicPath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error("Erreur d'upload:", error);
        return NextResponse.json({ error: "Erreur lors du téléchargement de l'image." }, { status: 500 });
    }
}

