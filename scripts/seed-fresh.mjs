// scripts/seed-fresh.mjs
//
// Wipes the SQLite database and re-runs the seed.
//
// Works regardless of caller CWD by resolving paths absolutely and chdir'ing
// into backend/ before importing the DB module.
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// here = /root/tmp/bsu_visitor/scripts
const projectRoot = resolve(here, "..");
const backendDir = resolve(projectRoot, "backend");
const dbPath = resolve(backendDir, "src", "database", "database.db");
const uploadsDir = resolve(backendDir, "uploads");

const PORT = Number(process.env.PORT || 8765);

// --- Safety guard: refuse to wipe the DB while the backend is listening. ---
// If a Node process holds the SQLite file handle, deleting the file
// underneath it leaves a stale inode and the next write throws
// SQLITE_READONLY_DBMOVED. Detect any listener on PORT and bail.
function isPortBusy(port) {
  return new Promise((resolveBusy) => {
    const socket = createServer();
    socket.once("error", () => resolveBusy(true)); // EADDRINUSE → busy
    socket.once("listening", () => socket.close(() => resolveBusy(false)));
    socket.listen(port, "127.0.0.1");
  });
}

const busy = await isPortBusy(PORT);
if (busy) {
  console.error(
    `[seed] FATAL: port ${PORT} is in use. Stop the backend (pkill -f "node src/server.js") before re-seeding.`,
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
