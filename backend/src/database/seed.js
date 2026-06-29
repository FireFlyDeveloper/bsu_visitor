import db from "./database.js";
import bcrypt from "bcrypt";

const password = "admin123";
const hash = bcrypt.hashSync(password, 10);

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
INSERT OR IGNORE INTO  users (fullname, username, password_hash, role_id)
SELECT 'System Administrator', 'admin', ?, 1
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);
`,
).run(hash);

db.prepare(
  `
INSERT OR IGNORE INTO offices (office_name, status, latitude, longitude, type) VALUES
('accreditation', 'available', '13.948517672120119', '120.72000973110724', 'Academic'),
('registrar', 'available', '13.948494244057724', '120.71967780774229', 'Administrative'),
('cashier', 'available', '13.948491640939562', '120.71964629178537', 'Financial')
`,
).run();
