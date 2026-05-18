// Apply supabase/seed.sql to the remote database.
// Run: node scripts/apply-seed.mjs
// Reads SUPABASE_DB_URL from .env (loaded by dotenv).

import { readFileSync } from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env first.");
  process.exit(1);
}

const sql = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
  console.log("Connected. Applying seed…");
  await client.query(sql);
  console.log("Seed applied.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
