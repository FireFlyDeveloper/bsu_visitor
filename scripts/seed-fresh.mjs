// scripts/seed-fresh.mjs
//
// Wipes the SQLite database and re-runs the seed.
//
// The original `cd backend && node src/database/seed.js` failed with
// `SqliteError: no such table: roles` because it imported only the
// seed module — which assumes the createTableImport side-effect has
// already run. The previous working invocation required the dev server
// to be up first. This script imports the schema + seed explicitly so
// it works on a fresh checkout.
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const isRoot = process.argv.includes("--root");
const projectRoot = isRoot ? resolve(here, "..") : resolve(here, "..", "..");
const backendDir = resolve(projectRoot, "backend");
const dbPath = resolve(backendDir, "src", "database", "database.db");
const uploadsDir = resolve(backendDir, "uploads");

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log(`[seed] removed ${dbPath}`);
}
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  console.log(`[seed] created ${uploadsDir}`);
}

process.chdir(backendDir);
await import("../backend/src/database/database.js");
await import("../backend/src/database/createTableImport.js");
await import("../backend/src/database/seed.js");
console.log("seeded OK");
