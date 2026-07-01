# BSU Visitor Management System

A role-based campus visitor management platform for **Batangas State University (BSU)**.
Manages visitor registration, per-office queueing, QR-coded visitor access links, and
real-time status tracking for **admin**, **staff**, **security guards**, and **visitors**.

> Forked from [sadassu/bsu_visitor](https://github.com/sadassu/bsu_visitor) (June 2026) and
> re-published under [FireFlyDeveloper/bsu_visitor](https://github.com/FireFlyDeveloper/bsu_visitor).

---

## Stack

| Layer       | Tech                                                                   |
|-------------|------------------------------------------------------------------------|
| Frontend    | Vue 3 + Pinia + Vue Router + Tailwind CSS v4 + Vite 8                  |
| Backend     | Node.js + Express 5 + Helmet + JWT + bcrypt + Multer                   |
| Database    | SQLite (`better-sqlite3`)                                              |
| Auth        | JWT in httpOnly cookies + role-based middleware                        |
| Roles       | `admin` · `staff` · `security`                                         |
| File upload | Multer (disk) → `/uploads`                                             |

---

## Guard-house kiosk flow

The system supports a kiosk workflow for guard houses at the school entrance:

1. **Guard logs visitor** at `/security/kiosk` — name, contact, address, photo, purpose, destination office.
2. **Visitor appears** in the destination office's staff dashboard at `/staff/dashboard` under "Visitors waiting" with their info and photo.
3. **Office marks done** with the "Mark done" button when the visitor's business is complete. This sets `time_out`.
4. **Guard sees the visitor in the "Pending sign-out" panel** of `/security/kiosk` and `/security/visitors/status` with an audible alarm playing.
5. **Guard taps "Sign out"** when the visitor physically leaves. This sets `left_at` and silences the alarm.

Endpoints:

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/security-guard/kiosk/register` | security |
| `PATCH` | `/api/visit-logs/:id/done` | staff, admin |
| `GET` | `/api/visit-logs/overdue` | any authenticated |
| `PATCH` | `/api/security-guard/visit-logs/:id/sign-out` | security |

---

## Quick start

### 1. Install
```bash
npm install              # root: concurrently only
(cd backend && npm install)
(cd client && npm install)
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
cp client/.env.example client/.env
```
Edit `backend/.env` to set a real `JWT_SECRET` and your `CLIENT_URL`
(comma-separated if you need multiple origins, e.g. local + ngrok).
Edit `client/.env` only if you need a non-localhost proxy target or allowed host.

### 3. Seed the database
```bash
npm run seed             # wipes backend/src/database/database.db + reseeds
```

### 4. Run dev
```bash
npm run dev              # starts backend :8000 and frontend :5173 concurrently
```

Default login: **admin / admin123** — change it immediately.

### 5. Run the API smoke test (optional, requires backend running on $PORT)
```bash
npm run test:api         # 30 endpoint tests, exits non-zero on failure
```
The smoke test wipes the DB before running, so don't use it against production data.

---

## Project layout

```
bsu_visitor/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express bootstrap + CORS + routes
│   │   ├── controllers/           # 8 route handlers
│   │   ├── models/                # 7 SQLite-backed data classes
│   │   ├── routes/                # 8 Express routers
│   │   ├── middleware/            # auth, role, upload, activity logger
│   │   └── database/              # schema + seed (auto-runs on boot)
│   ├── uploads/                   # visitor photos (gitignored)
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── views/                 # 4 role groups: Admin, Staff, Guard, Visitor
│   │   ├── store/                 # Pinia stores
│   │   ├── router/                # role-gated routes
│   │   ├── components/
│   │   └── middleware/            # auth + role guards
│   ├── vite.config.js
│   └── .env.example
├── scripts/
│   ├── seed-fresh.mjs             # wipes + reseeds the SQLite DB
│   └── smoke-test.sh              # 30-endpoint E2E API test
└── doc/
    ├── known_issues.md            # historical bug list (mostly resolved)
    └── visit_logs.md              # API design notes
```

---

## API surface

| Method | Path                                          | Role          | Purpose |
|--------|-----------------------------------------------|---------------|---------|
| POST   | `/api/users/login`                            | public        | Issue JWT cookie |
| POST   | `/api/users/logout`                           | public        | Clear cookie |
| GET    | `/api/users/me`                               | any auth      | Current user |
| GET    | `/api/users`                                  | admin         | List users |
| POST   | `/api/users`                                  | admin         | Create user |
| GET    | `/api/visitors`                               | any auth      | List / search visitors |
| POST   | `/api/visitors`                               | any auth      | Create visitor (multipart) |
| POST   | `/api/visit-logs/register`                    | any auth      | Register visit + issue QR link |
| GET    | `/api/visit-logs`                             | admin         | All logs (filterable, paginated) |
| GET    | `/api/visit-logs/pending`                     | staff         | Pending in my offices |
| GET    | `/api/visit-logs/counts`                      | any auth      | Visits per office |
| PATCH  | `/api/visit-logs/:id/status`                  | staff/admin   | Update visit status (auto time_out on completed) |
| PATCH  | `/api/visit-logs/office/:id/status`           | admin         | Bulk update by office |
| GET    | `/api/visit-logs/status/:status`              | staff         | Filter by status |
| GET    | `/api/visit-logs/office/:id/status-count`     | any auth      | Status breakdown |
| GET    | `/api/visitor-status/:status`                | any auth      | List visits by status |
| GET    | `/api/visitor-status/office/:id/status-count` | any auth    | Count by status per office |
| GET    | `/api/offices`                                | any auth      | List offices |
| POST   | `/api/offices`                                | admin         | Create office |
| GET    | `/api/roles`                                  | any auth      | List roles |
| PATCH  | `/api/security-guard/office/:id/status`       | security      | Set office open/closed |
| **GET**| **`/api/security-guard/visitors/active`**     | **security**  | **Visitors still on campus** (time_out IS NULL) |

---

## Bug fixes vs. upstream

| # | Bug | Fix |
|---|-----|-----|
| 1 | `VisitorController.create` read `img` from `req.body` — silently dropped uploaded photos | Read from `req.file`, fall back to `req.body.img` |
| 2 | `vite.config.js` hardcoded `http://192.168.1.5:8000` proxy | `VITE_API_PROXY_TARGET` env var, defaults to localhost |
| 3 | `vite.config.js` hardcoded ngrok host in `allowedHosts` | `VITE_ALLOWED_HOSTS` env var (comma-separated) |
| 4 | `cors()` hardcoded `intussusceptive-skimpily-ona.ngrok-free.dev` | Replaced with allowlist function reading `CLIENT_URL` (comma-separated) |
| 5 | QR-link system exposed via `/visitor-access/:token` and `/api/visitor-links` was unused after the public `/office` flow replaced it | Removed the route, view, store, controller, model, table, and the `LEFT JOIN visitor_links` blocks; no consumers left |
| 7 | `UserController.create` required `office_id` for **all** roles via `requiresOffice()` | Only `staff` (role_id 3) requires it; `admin` and `security` are exempt |
| 8 | No minimum password length check | Reject passwords shorter than 6 chars |
| 9 | `/api/security-guard/visitors/active` missing (called for in `doc/visit_logs.md`) | Implemented using `VisitLog.findActiveVisits`, enriches with visitor + office names |
| 11 | `/admin/register` route missing — `Register.vue` was orphaned | Route + lazy import added |
| 12 | Dead `ar.js` dependency in `client/package.json` (not imported anywhere) | Removed |
| 13 | **No role-based authorization on backend** — any logged-in user could call admin / security routes. Client-side `roleMiddleware` existed but server had no equivalent | New `backend/src/middleware/roleMiddleware.js`, wired into `authRoutes.js` (admin-only user mgmt) and `securityGuardRoutes.js` (security-only) |
| 14 | `server.js` error handler swallowed multer `fileFilter` errors as 500 (non-image upload) | Returns 400 with the real error message; also surfaces the real error message in the generic handler |

---

## Configuration reference

### `backend/.env`
| Key | Default | Notes |
|-----|---------|-------|
| `PORT` | `8000` | Express listen port |
| `NODE_ENV` | `development` | `production` enables `secure` cookie flag |
| `JWT_SECRET` | `your-super-secret-…` | **Change in production** |
| `JWT_EXPIRY` | `24h` | Any `ms`/`jsonwebtoken`-compatible string |
| `CLIENT_URL` | `http://localhost:3000` | Comma-separated CORS allowlist |

### `client/.env`
| Key | Default | Notes |
|-----|---------|-------|
| `VITE_API_BASE` | `/api` | Sent on every fetch. Use full URL in production. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Vite dev proxy target |
| `VITE_ALLOWED_HOSTS` | `localhost` | Comma-separated dev-server allowed hosts (for ngrok etc.) |

---

## License

ISC (per upstream).
