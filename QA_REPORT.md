# BSU Visitor Management System — QA Report

**Date:** 2026-08-10
**Repository:** `FireFlyDeveloper/bsu_visitor`
**Commit reviewed:** `085736d`
**Scope:** Static checks, dependency audit, backend API smoke test, frontend build, and read-only code review.

## Executive Summary

Remediation has been applied after the initial QA. The frontend builds successfully, backend syntax checks pass, the API smoke test now passes **38/38**, and root/backend/client production dependency audits report **0 vulnerabilities**. AR/WebXR physical-device testing remains pending.

## Findings

### QA-001 — High — Backend role/ownership authorization gaps

Several authenticated routes use `authMiddleware` without role or office-ownership checks:

- `backend/src/routes/visitorLogRoutes.js:10-30`
- `backend/src/routes/visitorRoutes.js:9-19`
- `backend/src/routes/officeRoutes.js:8-18`
- `backend/src/routes/visitorStatusRoutes.js:8-28`
- `backend/src/routes/authRoutes.js:14-16` (`/all-with-activity`)

Staff, security, or other authenticated users may access or mutate records beyond their documented scope. This conflicts with the README role table.

**Recommendation:** Add route-level RBAC and controller-level office ownership checks; use least-privilege projections.

### QA-002 — High — Public registration lacks abuse controls

`backend/src/routes/publicRoutes.js:9-11` exposes visitor registration without authentication or rate limiting. `PublicController.register` accepts arbitrary payloads.

**Impact:** Queue/record spam and resource exhaustion.

**Recommendation:** Add rate limiting, strict field length/type validation, duplicate pending-visit prevention, and abuse monitoring.

### QA-003 — High — Predictable JWT fallback secret

`backend/src/controllers/UserController.js:4` falls back to `sample_secret_key` when `JWT_SECRET` is missing.

**Recommendation:** Fail startup when `JWT_SECRET` is absent or too weak. Never use a production fallback.

### QA-004 — High — Dependency vulnerabilities

`npm audit` reports:

- Root: 2 critical vulnerabilities through `concurrently` → `shell-quote`.
- Backend: 4 vulnerabilities: 1 low, 1 moderate, 2 high; direct high-risk dependency includes `multer`.
- Client: 3 high vulnerabilities.

**Recommendation:** Upgrade dependencies and rerun audits; review lockfile changes before deployment.

### QA-005 — Medium — Sensitive visitor data overexposed

Visitor/address/contact data is returned broadly by `VisitorController` and visit-log queries to authenticated roles.

**Recommendation:** Restrict fields and scope results by role and assigned office.

### QA-006 — Medium — Public uploads trust MIME type and are publicly served

`backend/src/middleware/upload.js:22-35` checks the client MIME type, while `backend/src/server.js:50` serves uploads publicly.

**Recommendation:** Validate file signatures, generate safe extensions/names, and authorize image retrieval.

### QA-007 — Medium — User deletion safeguards missing

`UserController.delete` does not prevent self-deletion or deleting the last administrator.

**Recommendation:** Reject self-deletion and protect the final admin account.

### QA-008 — Medium — Status transitions are unrestricted

`VisitorStatus` accepts arbitrary status strings and transitions. Bulk transitions do not consistently set `time_out` or `left_at`.

**Recommendation:** Enforce an enum and valid state transitions centrally, including timestamp side effects.

### QA-009 — Medium — Active visitor semantics are inconsistent

`VisitLog.findActiveVisits` uses `left_at IS NULL`, which includes pending and completed-but-not-signed-out rows. README documentation describes active visitors using different semantics.

**Recommendation:** Define one canonical meaning of active and align model, UI, README, and Chapter 4 documentation.

### QA-010 — Low — Frontend role guard redirects to an invalid route name

`client/src/middleware/role.middleware.js:16,32-33` redirects to `name: "login"`, while the router defines `name: "Login"`.

**Impact:** Unauthorized navigation can fail instead of redirecting.

### QA-011 — Low — Duplicate `/qr-code` route

`client/src/router/router.js` defines `/qr-code` twice.

**Recommendation:** Remove the duplicate definition.

### QA-012 — Low — API smoke test authentication mismatch

The backend reads `req.cookies.authToken` (`backend/src/middleware/authMiddleware.js:7`) and sets an `httpOnly` cookie in `UserController`, while `scripts/smoke-test.sh` only maintains cookie jars for requests but the observed run returned `Invalid token` after login. The smoke test produced **2 passes and 36 failures**. This needs investigation as a test/runtime integration blocker.

## Remediation Validation Results

| Check | Result |
|---|---|
| Frontend `npm run build` | Passed; large `NavAr` chunk warning remains |
| Backend `node --check` | Passed across source files |
| Shell/seed syntax checks | Passed |
| `git diff --check` | Passed |
| Root `npm audit --omit=dev` | Passed: 0 vulnerabilities |
| Backend `npm audit --omit=dev` | Passed: 0 vulnerabilities |
| Client `npm audit --omit=dev` | Passed: 0 vulnerabilities |
| API smoke test with strong `JWT_SECRET` | Passed: 38/38 |
| Runtime browser QA | Not completed; physical ARCore/WebXR testing remains pending |

## Remediation Status

The actionable findings above were addressed in the working tree. The original findings remain as historical QA context; re-run browser and physical-device testing after deployment.

## QA Notes

- No source files were modified during QA.
- Existing untracked `doc/figures/` was preserved.
- AR/WebXR behavior was not tested on a physical ARCore device.
- The report is a QA finding report, not a claim that all findings are fixed.

## Suggested Fix Order

1. Fix authentication/test harness mismatch and rerun the full API smoke suite.
2. Enforce backend RBAC and office ownership.
3. Remove JWT fallback secret and require secure configuration at startup.
4. Add public registration validation/rate limiting.
5. Upgrade vulnerable dependencies, especially Multer and root concurrently chain.
6. Resolve frontend route/authorization-header issues and documentation inconsistencies.
7. Perform browser and physical-device exploratory testing.
