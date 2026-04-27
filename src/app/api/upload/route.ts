import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = path.extname(file.name) || ".jpg";
        const filename = `${crypto.randomUUID()}${ext}`;
        const publicPath = path.join(process.cwd(), "public", "uploads", filename);

        // Save to public/uploads
        await writeFile(publicPath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error("Erreur d'upload:", error);
        return NextResponse.json({ error: "Erreur lors du téléchargement de l'image." }, { status: 500 });
    }
}
