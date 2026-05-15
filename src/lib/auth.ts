import { cookies } from "next/headers";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { encrypt } from "./session";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Auto-seed Admin if DB is totally empty
  const usersCount = await db.select().from(usersTable);
  if (usersCount.length === 0) {
    await db.insert(usersTable).values({
      name: "Admin Principal",
      username: "Administrateur",
      password: hashPassword("Stock2026Admin"),
      role: "admin",
    });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (user && user.password === hashPassword(password)) {
    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: { id: user.id, name: user.name, role: user.role }, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set("session", session, { expires, httpOnly: true });
    return { success: true };
  }

  return { success: false, error: "Identifiants invalides" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
}


