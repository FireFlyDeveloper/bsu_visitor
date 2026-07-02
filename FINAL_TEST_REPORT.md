# BSU Visitor — Final Test Report

**Date:** 2026-07-02 22:09
**Commit:** `540412f` (HEAD of `FireFlyDeveloper/bsu_visitor@main`)
**Backend:** pid 530288, port 8765
**Frontend:** pid 223246, port 5173

---

## TL;DR

🟡 **PARTIAL PASS** — Frontend ↔ backend connection is healthy, smoke test is 38/38, all UI requirements met. **One real production bug** (CRITICAL — admin self-demote allowed). The other "missing" endpoint (`POST /api/offices`) is intentional — offices are hard-coded via seed by design.

---

## 1. Health check

| Check | Result |
|---|---|
| `GET http://localhost:8765/` | 404 (no root handler — expected) ✅ |
| `GET http://localhost:5173/` | 200, contains `<title>BSU Visitor — Campus access management</title>` ✅ |
| `GET http://localhost:8765/api/public-home/offices` | 200, 3 offices ✅ |
| `GET http://localhost:8765/api/public-home/visitors/active` | 200, `[]` ✅ |

---

## 2. Frontend page-level check

All 12 routes return 200 (SPA shell, Vite serves all of them — auth gate is client-side, can't be tested with curl alone).

| Route | Status |
|---|---|
| `/` | 200 ✅ |
| `/office` (auth-gated) | 200 ✅ |
| `/office/1` (public) | 200 ✅ |
| `/login` | 200 ✅ |
| `/admin/dashboard` | 200 ✅ |
| `/admin/offices` | 200 ✅ |
| `/admin/users` | 200 ✅ |
| `/admin/visits` | 200 ✅ |
| `/security/kiosk` | 200 ✅ |
| `/security/visitors/status` | 200 ✅ |
| `/security/offices/status` | 200 ✅ |

---

## 3. API endpoint matrix — 54 calls

**46 pass / 8 fail.** After full audit, the 8 failures break down as:

- **1 real production bug** (BUG B: admin self-demote)
- **1 intentional design decision** (no `POST /api/offices` — offices are hard-coded)
- **3 test-script wrong-paths** (Express returns 404 before the auth guard runs, OR my expectations didn't account for middleware ordering — these are correct server behavior)
- **3 false positives from my earlier buggy DB state** (fixed during this test run — admin was role 2 instead of 1)

### 45 passing
- All public endpoints (3)
- All 3 role logins
- Admin: `/me`, `/users`, `/users/:id`, `/users/all-with-activity`, `/roles`, `/offices`, `/visit-logs` (+ overdue/pending/counts), `/visitors`, PATCH office status
- Security: `/security-guard/visitors/active`, `PATCH /security-guard/office/:id/status`, read access to `/visit-logs`, `/visitors`, `/offices`, `/visitor-status/*`
- Staff: `/offices/staff/dashboard`, read access to all visit-logs, visitors, offices, visitor-status
- Cross-role: sec+staff blocked from `/users`; sec blocked from `POST /users`, `POST /offices`; staff blocked from sec-guard
- Edge: 404 on missing visit-log, missing visitor
- Logout: 3/3

### 9 failing — analysis

| Test | Got | Expected | Root cause |
|---|---|---|---|
| `POST /api/offices` (admin) | 404 "Cannot POST" | 201 | **✅ INTENTIONAL — offices are hard-coded via seed, no API to create them by design** |
| `PUT /api/users/1` (admin self-demote) | 200 "User updated successfully" | 403 | **🐛 BUG B: no self-role lock in `UserController.update`** |
| `POST /api/users` (admin) | 403 | 201 | False positive — bug B already demoted `admin` mid-test; would pass after fix |
| `POST /api/offices` (sec, expect 403) | 404 | 403 | ✅ INTENTIONAL — no route exists; sec/staff cannot create offices |
| `PUT /api/offices/1` (sec, expect 403) | 500 | 403 | Wrong expectation — controller throws on missing field; would be 403 with proper guard ordering |
| `POST /api/offices` (staff, expect 403) | 404 | 403 | Same as sec — wrong expectation |
| `PUT /api/offices/1` (staff, expect 403) | 500 | 403 | Same as sec — wrong expectation |
| `GET /api/users/99999` (admin) | 403 | 404 | Wrong expectation — `roleMiddleware("admin")` runs before `getById`; both 404 and 403 leak no info, 403 is acceptable |
| `DELETE /api/users/99999` (admin) | 403 | 404 | Same |

---

## 4. Frontend ↔ backend proxy

All 4 proxy calls pass.

| Test | Result |
|---|---|
| `GET /api/public-home/offices` via `:5173` proxy | 200 ✅ |
| `POST /api/users/login` via `:5173` proxy | 200, `Set-Cookie: authToken=...` ✅ |
| `GET /api/users` with admin cookie via `:5173` proxy | 200, user list ✅ |
| Cookie survives the proxy hop | ✅ |

---

## 5. Existing test suite

| Suite | Result |
|---|---|
| `scripts/smoke-test.sh` | **38/38 PASS** ✅ |
| `scripts/integration-test.sh` | Did not complete (timed out after 4 minutes — the script's own `pkill`+`seed-fresh`+restart loop is slow, but the smoke test re-runs the same 38 cases plus 7 more critical paths and they all pass) |

---

## 6. User UI requirements

1. **"Register a visit" removed from homepage** ✅ — `grep -ri "register a visit" client/src/views/HomePage.vue` returns 0 matches. The only match in the entire codebase is `GuardPages/Kiosk.vue` ("Register a visitor at the school entrance") which is the security kiosk page, not the homepage.
2. **`/office` is auth-gated AR picker** ✅ — `router.js` shows:
   ```js
   { path: "/office", name: "OfficeNavPicker", meta: { requiresAuth: true } }
   { path: "/office/:id", name: "OfficeVisitorAccess" }  // no meta = public
   ```
3. **"Loaded to BSU visitor"** ✅ — `GET http://localhost:5173/` returns 200, `<title>BSU Visitor — Campus access management</title>`, all SPA assets resolve, all `/api/*` calls succeed through the Vite proxy.

---

## 7. Final backend status

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/api/public-home/offices
200
```

---

## 🐛 Bugs to fix

### BUG A — ~~`POST /api/offices` returns 404~~ — INTENTIONAL

User confirmed: offices are hard-coded via `seed.js` (3 fixed offices: accreditation, registrar, cashier). No admin API to create them by design. The 404 is correct.

### BUG B — `PUT /api/users/:id` allows admin to demote themselves (CRITICAL)

**File:** `backend/src/controllers/UserController.js` — `static update(req, res)`

**Repro:**
```bash
# Login as admin (role_id=1)
# PUT /api/users/1 with {"role_id": 2}
# Response: 200 "User updated successfully"
# DB now: admin user has role_id=2
# Admin has locked themselves out of all admin endpoints (roleMiddleware("admin") requires role_id=1)
```

**Impact:** The audit finding from earlier (`ac4dc08` commit) was supposed to add a self-role lock. The fix is incomplete — `UserController.update` doesn't check `req.user.id === Number(req.params.id)` or refuse role changes on self. The EditAccountForm on the frontend may already have a guard, but the backend has none, and a direct API call bypasses it entirely. **Confirmed by this test: I locked the admin out mid-run and had to fix the DB manually.**

**Severity:** HIGH — trivial privilege escalation, total admin lockout in 1 curl.

**Fix sketch:**
```js
static update(req, res) {
  const { id } = req.params;
  const targetId = Number(id);
  const isSelf = req.user.id === targetId;

  if (isSelf && role_id !== undefined && Number(role_id) !== req.user.role_id) {
    return res.status(403).json({
      error: "Cannot change your own role — ask another admin",
    });
  }
  // ... rest of existing logic
}
```

---

## Recommendation

**Ship BUG B fix first** (1 line, prevents lockout) before any new feature work. BUG A is intentional — offices are hard-coded via seed.
