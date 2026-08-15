import db from "./database.js";
import bcrypt from "bcrypt";

db.prepare(
  `
INSERT OR IGNORE INTO  roles (role_name) VALUES
('admin'),
('security'),
('staff')
`,
).run();

db.prepare(
  `
INSERT OR IGNORE INTO offices (office_name, status, latitude, longitude, type) VALUES
('accreditation', 'available', '13.948517672120119', '120.72000973110724', 'Academic'),
('registrar', 'available', '13.948494244057724', '120.71967780774229', 'Administrative'),
('cashier', 'available', '13.948491640939562', '120.71964629178537', 'Financial')
`,
).run();

const roleId = (name) =>
  db.prepare("SELECT id FROM roles WHERE role_name = ?").get(name).id;
const officeId = db
  .prepare("SELECT id FROM offices WHERE office_name = ?")
  .get("accreditation").id;
const seedUser = db.prepare(`
  INSERT INTO users (fullname, username, password_hash, role_id, office_id)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(username) DO UPDATE SET
    fullname = excluded.fullname,
    password_hash = excluded.password_hash,
    role_id = excluded.role_id,
    office_id = excluded.office_id
`);

db.transaction(() => {
  seedUser.run("System Administrator", "admin", bcrypt.hashSync("admin123", 10), roleId("admin"), null);
  seedUser.run("Security Guard", "sec1", bcrypt.hashSync("secret123", 10), roleId("security"), null);
  seedUser.run("Accreditation Staff", "staff1", bcrypt.hashSync("secret123", 10), roleId("staff"), officeId);
})();
