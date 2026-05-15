import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

function loadEnv() {
  let currentDir = process.cwd();
  while (currentDir !== path.parse(currentDir).root) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    currentDir = path.dirname(currentDir);
  }
}

loadEnv();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

declare global {
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = global.db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  global.db = db;
}

export * from "./schema";
