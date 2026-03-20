import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema/index.ts";

let _db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!_db) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set — Supabase connection required");
    }
    const client = postgres(env.DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}
