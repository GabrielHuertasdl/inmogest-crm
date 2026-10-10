import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };
const g = globalThis as unknown as { __ig_db?: DB };

function open(): DB {
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const sqlite = new Database(path.join(DATA_DIR, "inmogest.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema }) as DB;
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

export const db: DB = g.__ig_db ?? (g.__ig_db = open());
export { schema };
