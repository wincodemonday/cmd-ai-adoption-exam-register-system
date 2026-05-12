import { Pool } from "pg";
import { getEnv } from "./env.js";

let pool;
let poolKey = "";
let schemaPromise;

function isLocalDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

function sslConfig(databaseUrl) {
  const { databaseSsl } = getEnv();

  if (databaseSsl === "true") {
    return { rejectUnauthorized: false };
  }

  if (databaseSsl === "false") {
    return false;
  }

  return isLocalDatabaseUrl(databaseUrl) ? false : { rejectUnauthorized: false };
}

export function hasDatabaseUrl(options = {}) {
  if (typeof options === "string") {
    return false;
  }

  if (options && (options.storePath || options.forceFile)) {
    return false;
  }

  return Boolean(options.databaseUrl || getEnv().databaseUrl);
}

function getPool(databaseUrl = getEnv().databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool || poolKey !== databaseUrl) {
    const ssl = sslConfig(databaseUrl);

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: ssl || undefined
    });
    poolKey = databaseUrl;
    schemaPromise = undefined;
  }

  return pool;
}

async function ensureSchema(databaseUrl = getEnv().databaseUrl) {
  if (!schemaPromise) {
    const currentPool = getPool(databaseUrl);
    schemaPromise = currentPool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        reference_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        job_title TEXT NOT NULL DEFAULT '',
        dietary_preferences TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS registration_documents (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        storage_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_registrations_reference_code
        ON registrations(reference_code);

      CREATE INDEX IF NOT EXISTS idx_registration_documents_registration_id
        ON registration_documents(registration_id);
    `);
  }

  await schemaPromise;
}

export async function withDatabase(work, options = {}) {
  const databaseUrl = options.databaseUrl || getEnv().databaseUrl;
  await ensureSchema(databaseUrl);
  return work(getPool(databaseUrl));
}

export async function withTransaction(work, options = {}) {
  return withDatabase(async (db) => {
    const client = await db.connect();

    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }, options);
}
