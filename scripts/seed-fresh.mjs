// scripts/seed-fresh.mjs
//
// Wipes the SQLite database and re-runs the seed.
//
// Works regardless of caller CWD by resolving paths absolutely and chdir'ing
// into backend/ before importing the DB module.
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// here = /root/tmp/bsu_visitor/scripts
const projectRoot = resolve(here, "..");
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

// database.js opens "./src/database/database.db" relative to process.cwd(),
// so chdir into backend/ before importing it.
process.chdir(backendDir);
await import(resolve(backendDir, "src", "database", "database.js"));
await import(resolve(backendDir, "src", "database", "createTableImport.js"));
await import(resolve(backendDir, "src", "database", "seed.js"));
console.log(`seeded OK -> ${dbPath}`);
