// scripts/seed-fresh.mjs
//
// Wipes the SQLite database and re-runs the seed.
//
// Works regardless of caller CWD by resolving paths absolutely and chdir'ing
// into backend/ before importing the DB module.
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// here = /root/tmp/bsu_visitor/scripts
const projectRoot = resolve(here, "..");
const backendDir = resolve(projectRoot, "backend");
const dbPath = resolve(backendDir, "src", "database", "database.db");
const uploadsDir = resolve(backendDir, "uploads");

// Refuse to delete an open SQLite file. A port check can miss another backend
// process, leaving it attached to the old inode and causing stale credentials.
const holderCheck = spawnSync("fuser", ["-w", dbPath], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const holders = holderCheck.stdout.trim();
if (holderCheck.status === 0 && holders) {
  console.error(
    `[seed] FATAL: ${dbPath} is open by process(es): ${holders}. Stop the backend before re-seeding.`,
  );
  process.exit(1);
}

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
