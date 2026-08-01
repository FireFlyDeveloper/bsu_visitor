import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

const databasePath = process.env.DATABASE_PATH || "./src/database/database.db";
mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

export default db;