import { db } from "./index";
import { usersTable } from "./schema/users";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";

function hashPassword(password: string) {
    return createHash("sha256").update(password).digest("hex");
}

async function main() {
    console.log("Seeding Database...");

    const profiles = [
        {
            name: "Admin Principal",
            username: "Administrateur",
            password: hashPassword("admin@321"),
            role: "admin" as const,
        },
        {
            name: "Caisse Principale",
            username: "Caissier1",
            password: hashPassword("caissier@2026"),
            role: "cashier" as const,
        }
    ];

    for (const p of profiles) {
        const existing = await db.select().from(usersTable).where(eq(usersTable.username, p.username));
        if (existing.length === 0) {
            await db.insert(usersTable).values(p);
            console.log(`Profil ajouté : ${p.username} | ${p.name}`);
        } else {
            console.log(`Profil ignoré, existe déjà : ${p.username}`);
        }
    }

    console.log("Seeding done successfully!");
}

main().catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
});
