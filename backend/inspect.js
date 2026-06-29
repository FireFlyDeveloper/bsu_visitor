import Database from 'better-sqlite3';
const db = new Database('c:/Users/Angelo/Desktop/projects2026/bsu_reservation/bsu_visitor/backend/src/database/database.db');
const t = '5a0d32942da19905e22d6282324bba525c233707069beea2';
const r = db.prepare('SELECT * FROM visitor_links WHERE token = ?').get(t);
console.log(r);
