import Database from "better-sqlite3";
import { dirname, isAbsolute, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const databaseDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory = resolve(databaseDirectory, "../..");
const configuredDatabasePath = process.env.DATABASE_PATH || "src/database/database.db";
const databasePath = isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : resolve(backendDirectory, configuredDatabasePath);
mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

export default db;
