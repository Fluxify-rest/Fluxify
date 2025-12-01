import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  drizzle,
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import type { PgliteDatabase, PgliteQueryResultHKT } from "drizzle-orm/pglite";

let db: NodePgDatabase | PgliteDatabase = null!;

export async function drizzleInit() {
  if (process.env.DB_VARIANT === "pglite") {
    await initializePgLite();
  } else {
    await initializePostgres();
  }
  return db;
}

async function initializePostgres() {
  const pgUrl = process.env.PG_URL;
  if (!pgUrl) {
    throw new Error("postgres connection url is required for drizzle");
  }
  db = drizzle(pgUrl!, { logger: false });
  const result = await db.execute(`select 1 as connected`);
  if (result.rows[0].connected) {
    console.log("db initialized");
  } else {
    throw new Error("db connection failed");
  }
}

async function initializePgLite() {
  const pglitePath = process.env.DB_PGLITE_PATH as string;
  if (!pglitePath) {
    throw new Error("pglite path is required for drizzle");
  }
  const drizzlePgLite = await import("drizzle-orm/pglite");
  db = drizzlePgLite.drizzle(pglitePath);
  const result = await db.execute<{ connected: number }>(
    `select 1 as connected`
  );
  if (result.rows[0].connected) {
    console.log("db initialized");
  } else {
    throw new Error("db connection failed");
  }
}

export { db };
export type DbTransactionType =
  | PgTransaction<
      NodePgQueryResultHKT,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >
  | PgTransaction<
      PgliteQueryResultHKT,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >;
